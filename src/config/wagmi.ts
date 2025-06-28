import { http, fallback } from 'viem'
import { sepolia } from 'viem/chains'
import { createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'

// Multiple RPC endpoints for better reliability
const sepoliaRpcEndpoints = [
  'https://eth-sepolia.g.alchemy.com/v2/djNT8rHHwMM8vB0WBkTCZTrxq-lZ1SUo',
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  'https://rpc.sepolia.org',
  'https://eth-sepolia.public.blastapi.io',
]

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: fallback(
      sepoliaRpcEndpoints.map(endpoint => http(endpoint)),
      {
        retryCount: 3,
        retryDelay: 1000,
      }
    ),
  },
  connectors: [
    injected(),
  ],
}) 