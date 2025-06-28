export interface Network {
  id: string;
  name: string;
  rpc: string[];
  chainId: number;
  currency: string;
  explorer: string;
}

export const SUPPORTED_NETWORKS: Network[] = [
  {
    id: 'sepolia',
    name: 'Sepolia Testnet',
    rpc: [
      'https://eth-sepolia.g.alchemy.com/v2/djNT8rHHwMM8vB0WBkTCZTrxq-lZ1SUo', // Alchemy (primary)
      'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Infura (fallback)
      'https://rpc.sepolia.org', // Public RPC (fallback)
      'https://eth-sepolia.public.blastapi.io', // BlastAPI (last resort)
    ],
    chainId: 11155111,
    currency: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
  },
];