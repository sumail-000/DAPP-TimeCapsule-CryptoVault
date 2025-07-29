// Service Worker for TimeCapsule CryptoVault
// Version: 1.0.1

const CACHE_NAME = 'timecapsule-vault-v1.0.1';
const STATIC_CACHE = 'static-v1.0.1';
const DYNAMIC_CACHE = 'dynamic-v1.0.1';

// Files to cache for offline use
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other critical assets
];

// API endpoints that should be cached
const CACHE_API_PATTERNS = [
  /^https:\/\/api\.etherscan\.io/,
  /^https:\/\/eth-mainnet\.g\.alchemy\.com/,
  /^https:\/\/eth-sepolia\.g\.alchemy\.com/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated and ready');
      // Claim all clients to ensure immediate control
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests that aren't APIs
  if (url.origin !== self.location.origin && !isApiRequest(request.url)) {
    return;
  }

  // Handle API requests with network-first strategy
  if (isApiRequest(request.url)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(cacheFirstStrategy(request));
});

// Check if request is to an API endpoint
function isApiRequest(url) {
  return CACHE_API_PATTERNS.some(pattern => pattern.test(url));
}

// Network-first strategy for API requests
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses (only for GET requests)
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for:', request.url);
    
    // Fall back to cache (only for GET requests)
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline message for API failures
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Network unavailable. Some features may be limited.' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  // Only cache GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }

  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Fall back to network
    const networkResponse = await fetch(request);
    
    // Cache successful responses (only GET requests)
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to fetch:', request.url);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || caches.match('/');
    }
    
    // Return empty response for other assets
    return new Response('', { status: 404 });
  }
}

// Navigation handler with SPA support
async function navigationHandler(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    
    // Cache the response (only for GET requests)
    if (request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Navigation failed, serving cached version');
    
    // Serve the cached app shell (index.html) for SPA routing
    const cachedResponse = await caches.match('/') || await caches.match('/index.html');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Last resort - offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - CryptoVault</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              background: #1a1d23; 
              color: white; 
              text-align: center; 
              padding: 50px 20px; 
            }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #7f5af0; }
            .retry-btn { 
              background: #7f5af0; 
              color: white; 
              border: none; 
              padding: 12px 24px; 
              border-radius: 8px; 
              font-size: 16px; 
              cursor: pointer; 
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="icon">📱</div>
          <h1>You're Offline</h1>
          <p>CryptoVault needs an internet connection to access the blockchain.</p>
          <p>Your data is safely stored locally and will sync when you reconnect.</p>
          <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'vault-sync') {
    event.waitUntil(syncVaultData());
  }
});

// Sync vault data when online
async function syncVaultData() {
  try {
    console.log('Service Worker: Syncing vault data...');
    
    // Get pending actions from IndexedDB or localStorage
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await processAction(action);
        await removePendingAction(action.id);
      } catch (error) {
        console.error('Service Worker: Failed to sync action:', action, error);
      }
    }
    
    console.log('Service Worker: Vault data sync completed');
  } catch (error) {
    console.error('Service Worker: Vault sync failed:', error);
  }
}

// Mock functions for pending actions (to be implemented with IndexedDB)
async function getPendingActions() {
  // TODO: Implement with IndexedDB
  return [];
}

async function processAction(action) {
  // TODO: Implement action processing
  console.log('Processing action:', action);
}

async function removePendingAction(actionId) {
  // TODO: Implement action removal
  console.log('Removing action:', actionId);
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push message received');
  
  const options = {
    body: 'Your vault has been unlocked!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'vault-unlock',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Vault',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.tag = data.tag || options.tag;
  }

  event.waitUntil(
    self.registration.showNotification('CryptoVault', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/my-vaults')
    );
  }
});

// Message handler for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker: Registered and ready'); 