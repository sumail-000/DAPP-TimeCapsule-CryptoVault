import { http } from 'viem'
import { sepolia } from 'viem/chains'
import { createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/djNT8rHHwMM8vB0WBkTCZTrxq-lZ1SUo'),
  },
  connectors: [
    injected(),
  ],
}) 