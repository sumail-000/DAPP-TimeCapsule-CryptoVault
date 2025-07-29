import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';

export interface NotificationData {
  id: string;
  type: 'goal_achieved' | 'vault_unlocked' | 'milestone' | 'warning' | 'success';
  title: string;
  message: string;
  vaultAddress?: string;
  timestamp: number;
  read: boolean;
  persistent?: boolean;
  actionUrl?: string;
}

const STORAGE_KEY = 'vault_notifications';
const MAX_NOTIFICATIONS = 50;

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const toast = useToast();

  // Load notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }

    // Check notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Save notifications to localStorage
  const saveNotifications = useCallback((newNotifications: NotificationData[]) => {
    // Keep only the most recent notifications
    const trimmed = newNotifications.slice(0, MAX_NOTIFICATIONS);
    setNotifications(trimmed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);

  // Create a new notification
  const addNotification = useCallback((
    type: NotificationData['type'],
    title: string,
    message: string,
    options?: {
      vaultAddress?: string;
      persistent?: boolean;
      actionUrl?: string;
      showBrowserNotification?: boolean;
      showToast?: boolean;
    }
  ) => {
    const notification: NotificationData = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      vaultAddress: options?.vaultAddress,
      timestamp: Date.now(),
      read: false,
      persistent: options?.persistent || false,
      actionUrl: options?.actionUrl,
    };

    // Add to storage
    const newNotifications = [notification, ...notifications];
    saveNotifications(newNotifications);

    // Show toast notification
    if (options?.showToast !== false) {
      const toastStatus = type === 'warning' ? 'warning' : 
                         type === 'success' || type === 'goal_achieved' || type === 'vault_unlocked' ? 'success' : 
                         'info';

      toast({
        title,
        description: message,
        status: toastStatus,
        duration: type === 'goal_achieved' || type === 'vault_unlocked' ? 8000 : 5000,
        isClosable: true,
        position: 'top-right',
      });
    }

    // Show browser notification
    if (options?.showBrowserNotification !== false && permission === 'granted') {
             const browserNotification = new Notification(title, {
         body: message,
         icon: '/icons/icon-192x192.png',
         badge: '/icons/badge-72x72.png',
         tag: notification.id,
         requireInteraction: type === 'goal_achieved' || type === 'vault_unlocked',
         data: {
           url: options?.actionUrl || '/my-vaults',
           vaultAddress: options?.vaultAddress,
         },
       });

      browserNotification.onclick = () => {
        window.focus();
        if (options?.actionUrl) {
          window.location.href = options.actionUrl;
        }
        browserNotification.close();
      };

      // Auto-close after 10 seconds for non-persistent notifications
      if (!options?.persistent) {
        setTimeout(() => {
          browserNotification.close();
        }, 10000);
      }
    }

    return notification.id;
  }, [notifications, permission, toast, saveNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  }, [notifications, saveNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  }, [notifications, saveNotifications]);

  // Delete notification
  const deleteNotification = useCallback((notificationId: string) => {
    const filtered = notifications.filter(n => n.id !== notificationId);
    saveNotifications(filtered);
  }, [notifications, saveNotifications]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    saveNotifications([]);
  }, [saveNotifications]);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Predefined notification creators
  const notifyGoalAchieved = useCallback((vaultName: string, vaultAddress: string, goalAmount: string) => {
    return addNotification(
      'goal_achieved',
      '🎯 Goal Achieved!',
      `Congratulations! Your ${vaultName} has reached its goal of ${goalAmount} ETH!`,
      {
        vaultAddress,
        actionUrl: `/vault/${vaultAddress}`,
        persistent: true,
      }
    );
  }, [addNotification]);

  const notifyVaultUnlocked = useCallback((vaultName: string, vaultAddress: string, unlockReason: string) => {
    return addNotification(
      'vault_unlocked',
      '🔓 Vault Unlocked!',
      `Your ${vaultName} is now unlocked! ${unlockReason}`,
      {
        vaultAddress,
        actionUrl: `/vault/${vaultAddress}`,
        persistent: true,
      }
    );
  }, [addNotification]);

  const notifyMilestone = useCallback((title: string, message: string, vaultAddress?: string) => {
    return addNotification(
      'milestone',
      title,
      message,
      {
        vaultAddress,
        actionUrl: vaultAddress ? `/vault/${vaultAddress}` : '/dashboard',
      }
    );
  }, [addNotification]);

  const notifyWarning = useCallback((title: string, message: string) => {
    return addNotification(
      'warning',
      title,
      message,
      {
        showBrowserNotification: false, // Only show toast for warnings
      }
    );
  }, [addNotification]);

  const notifySuccess = useCallback((title: string, message: string) => {
    return addNotification(
      'success',
      title,
      message,
      {
        showBrowserNotification: false, // Only show toast for success messages
      }
    );
  }, [addNotification]);

  // Check for vault status changes and trigger notifications
  const checkVaultUpdates = useCallback((vaults: any[]) => {
    // This would be called from useVault when vault data updates
    vaults.forEach(vault => {
      // Check for goal achievements
      if (vault.isGoalLocked && vault.progressPercentage >= 100) {
        const storageKey = `goal_notified_${vault.address}`;
        if (!localStorage.getItem(storageKey)) {
          notifyGoalAchieved(
            vault.customization?.name || `Vault #${vault.index + 1}`,
            vault.address,
            (Number(vault.goalAmount) / 1e18).toFixed(4)
          );
          localStorage.setItem(storageKey, 'true');
        }
      }

      // Check for vault unlocks
      if (!vault.isLocked && vault.balance > 0n) {
        const storageKey = `unlock_notified_${vault.address}`;
        if (!localStorage.getItem(storageKey)) {
          notifyVaultUnlocked(
            vault.customization?.name || `Vault #${vault.index + 1}`,
            vault.address,
            vault.unlockReason || 'Time/condition met'
          );
          localStorage.setItem(storageKey, 'true');
        }
      }

      // Check for milestones (e.g., 50%, 75% progress)
      if (vault.isGoalLocked) {
        const progress = vault.progressPercentage;
        const milestones = [25, 50, 75];
        
        milestones.forEach(milestone => {
          if (progress >= milestone) {
            const storageKey = `milestone_${milestone}_notified_${vault.address}`;
            if (!localStorage.getItem(storageKey)) {
              notifyMilestone(
                `🎯 ${milestone}% Progress!`,
                `Your ${vault.customization?.name || 'vault'} is ${milestone}% of the way to its goal!`,
                vault.address
              );
              localStorage.setItem(storageKey, 'true');
            }
          }
        });
      }
    });
  }, [notifyGoalAchieved, notifyVaultUnlocked, notifyMilestone]);

  return {
    notifications,
    unreadCount,
    permission,
    requestPermission,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    // Convenience methods
    notifyGoalAchieved,
    notifyVaultUnlocked,
    notifyMilestone,
    notifyWarning,
    notifySuccess,
    checkVaultUpdates,
  };
};

export default useNotifications; 