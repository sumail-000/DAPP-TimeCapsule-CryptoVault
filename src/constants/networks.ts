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
    id: 'ethereum',
    name: 'Ethereum Mainnet',
    rpc: 'https://eth-mainnet.public.blastapi.io', // CORS-enabled public RPC
    chainId: 1,
    currency: 'ETH',
    explorer: 'https://etherscan.io',
  },
  {
    id: 'sepolia',
    name: 'Sepolia Testnet',
    rpc: 'https://eth-sepolia.public.blastapi.io', // CORS-enabled public RPC
    chainId: 11155111,
    currency: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
  },
  {
    id: 'polygon',
    name: 'Polygon Mainnet',
    rpc: 'https://polygon-rpc.com', // Already CORS-enabled
    chainId: 137,
    currency: 'MATIC',
    explorer: 'https://polygonscan.com',
  },
  {
    id: 'mumbai',
    name: 'Mumbai Testnet',
    rpc: 'https://mumbai.polygonscan.com/rpc', // CORS-enabled RPC
    chainId: 80001,
    currency: 'MATIC',
    explorer: 'https://mumbai.polygonscan.com',
  },
  {
    id: 'bsc',
    name: 'Binance Smart Chain',
    rpc: 'https://bsc-dataseed1.binance.org',
    chainId: 56,
    currency: 'BNB',
    explorer: 'https://bscscan.com',
  },
]; 