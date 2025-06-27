export interface Network {
  id: string;
  name: string;
  rpc: string;
  chainId: number;
  currency: string;
  explorer: string;
}

export const SUPPORTED_NETWORKS: Network[] = [
  {
    id: 'sepolia',
    name: 'Sepolia Testnet',
    rpc: 'https://eth-sepolia.public.blastapi.io', // CORS-enabled public RPC
    chainId: 11155111,
    currency: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
  },
];