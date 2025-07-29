import { createPublicClient, http, fallback, type PublicClient } from 'viem'
import { sepolia } from 'viem/chains'
import { SUPPORTED_NETWORKS } from '@/constants/networks'

// RPC provider configuration with retry logic
const createRpcClient = (endpoints: string[]): PublicClient => {
  return createPublicClient({
    chain: sepolia,
    transport: fallback(
      endpoints.map(endpoint => http(endpoint)),
      {
        retryCount: 3,
        retryDelay: 1000,
      }
    ),
  })
}

// Get the primary RPC client for Sepolia
export const getSepoliaClient = (): PublicClient => {
  const sepoliaNetwork = SUPPORTED_NETWORKS.find(network => network.id === 'sepolia')
  if (!sepoliaNetwork) {
    throw new Error('Sepolia network not found in configuration')
  }
  
  return createRpcClient(sepoliaNetwork.rpc)
}

// Rate limiting utility
export class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests: number
  private readonly timeWindow: number

  constructor(maxRequests: number = 10, timeWindow: number = 1000) {
    this.maxRequests = maxRequests
    this.timeWindow = timeWindow
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now()
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    
    // If we've hit the limit, wait
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0]
      const waitTime = this.timeWindow - (now - oldestRequest)
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    // Add current request
    this.requests.push(now)
  }
}

// Global rate limiter instance - reasonable rate limiting for Alchemy
export const globalRateLimiter = new RateLimiter(3, 1000) // 3 requests per second

// Wrapper for RPC calls with rate limiting
export const rateLimitedRpcCall = async <T>(
  rpcCall: () => Promise<T>,
  retries: number = 3
): Promise<T> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await globalRateLimiter.waitForSlot()
      return await rpcCall()
    } catch (error: any) {
      const isRateLimitError = error.message?.includes('rate limit') || 
                              error.message?.includes('429') ||
                              error.message?.includes('Too Many Requests') ||
                              error.message?.includes('compute units per second') ||
                              error.code === 429
      
      if (isRateLimitError && attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000 // Normal exponential backoff (1s, 2s, 4s)
        console.warn(`Alchemy rate limit hit, retrying in ${delay}ms (attempt ${attempt}/${retries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      throw error
    }
  }
  
  throw new Error('Max retries exceeded')
} 