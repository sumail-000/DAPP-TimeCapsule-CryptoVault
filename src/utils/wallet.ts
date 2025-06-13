import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS, Network } from '../constants/networks';

export interface WalletData {
  address: string;
  privateKey: string;
  network: string;
  balance: string;
}

export const createWallet = async (network: string): Promise<WalletData> => {
  const wallet = ethers.Wallet.createRandom();
  const provider = new ethers.JsonRpcProvider(
    SUPPORTED_NETWORKS.find((n: Network) => n.id === network)?.rpc
  );
  
  const connectedWallet = wallet.connect(provider);
  const balance = await provider.getBalance(connectedWallet.address);
  
  return {
    address: connectedWallet.address,
    privateKey: connectedWallet.privateKey,
    network,
    balance: ethers.formatEther(balance),
  };
};

export const importWallet = async (privateKey: string, network: string): Promise<WalletData> => {
  const wallet = new ethers.Wallet(privateKey);
  const provider = new ethers.JsonRpcProvider(
    SUPPORTED_NETWORKS.find((n: Network) => n.id === network)?.rpc
  );
  
  const connectedWallet = wallet.connect(provider);
  const balance = await provider.getBalance(connectedWallet.address);
  
  return {
    address: connectedWallet.address,
    privateKey: connectedWallet.privateKey,
    network,
    balance: ethers.formatEther(balance),
  };
};

export const getWalletBalance = async (address: string, network: string): Promise<string> => {
  const provider = new ethers.JsonRpcProvider(
    SUPPORTED_NETWORKS.find((n: Network) => n.id === network)?.rpc
  );
  
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
};

export const sendTransaction = async (
  fromWallet: WalletData,
  toAddress: string,
  amount: string
): Promise<string> => {
  const provider = new ethers.JsonRpcProvider(
    SUPPORTED_NETWORKS.find((n: Network) => n.id === fromWallet.network)?.rpc
  );
  
  const wallet = new ethers.Wallet(fromWallet.privateKey, provider);
  
  const tx = await wallet.sendTransaction({
    to: toAddress,
    value: ethers.parseEther(amount),
  });
  
  // Wait for transaction confirmation
  await tx.wait();
  
  // Dispatch transaction event
  window.dispatchEvent(new CustomEvent('outgoing_transaction', {
    detail: {
      from: fromWallet.address,
      to: toAddress,
      value: amount,
      hash: tx.hash,
    },
  }));
  
  return tx.hash;
};

export const validateAddress = (address: string): boolean => {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
};

export const validatePrivateKey = (privateKey: string): boolean => {
  try {
    new ethers.Wallet(privateKey);
    return true;
  } catch {
    return false;
  }
}; 