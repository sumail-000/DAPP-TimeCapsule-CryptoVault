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
    SUPPORTED_NETWORKS.find((n: Network) => n.id === network)?.rpc[0]
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
    SUPPORTED_NETWORKS.find((n: Network) => n.id === network)?.rpc[0]
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
    SUPPORTED_NETWORKS.find((n: Network) => n.id === network)?.rpc[0]
  );
  
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
};

export interface GasEstimate {
  gasPrice: bigint;
  gasLimit: bigint;
  gasCost: bigint;
  gasCostEther: string;
  maxAmount: string;
}

export const estimateGasFee = async (
  fromWallet: WalletData,
  toAddress: string,
  amount: string
): Promise<GasEstimate> => {
  const provider = new ethers.JsonRpcProvider(
    SUPPORTED_NETWORKS.find((n: Network) => n.id === fromWallet.network)?.rpc[0]
  );
  
  const wallet = new ethers.Wallet(fromWallet.privateKey, provider);
  const amountWei = ethers.parseEther(amount);
  
  // Get current gas price
  const gasPrice = await provider.getFeeData();
  const maxFeePerGas = gasPrice.maxFeePerGas || gasPrice.gasPrice;
  
  if (!maxFeePerGas) {
    throw new Error("Could not get gas price");
  }
  
  // Estimate gas limit for this transaction
  const gasLimit = await provider.estimateGas({
    from: fromWallet.address,
    to: toAddress,
    value: amountWei
  });
  
  // Calculate total gas cost
  const gasCost = gasLimit * maxFeePerGas;
  const gasCostEther = ethers.formatEther(gasCost);
  
  // Calculate maximum amount that can be sent (balance - gas cost)
  const balance = await provider.getBalance(fromWallet.address);
  const maxSendableWei = balance - gasCost;
  const maxAmount = maxSendableWei > 0n ? ethers.formatEther(maxSendableWei) : "0";
  
  return {
    gasPrice: maxFeePerGas,
    gasLimit,
    gasCost,
    gasCostEther,
    maxAmount
  };
};

export const sendTransaction = async (
  fromWallet: WalletData,
  toAddress: string,
  amount: string,
  useMaxAmount: boolean = false
): Promise<string> => {
  const provider = new ethers.JsonRpcProvider(
    SUPPORTED_NETWORKS.find((n: Network) => n.id === fromWallet.network)?.rpc[0]
  );
  
  const wallet = new ethers.Wallet(fromWallet.privateKey, provider);
  
  // Get gas estimate
  const gasEstimate = await estimateGasFee(fromWallet, toAddress, amount);
  
  // If useMaxAmount is true, send maximum possible amount after gas fees
  const valueToSend = useMaxAmount 
    ? ethers.parseEther(gasEstimate.maxAmount)
    : ethers.parseEther(amount);
  
  const tx = await wallet.sendTransaction({
    to: toAddress,
    value: valueToSend,
    maxFeePerGas: gasEstimate.gasPrice,
    gasLimit: gasEstimate.gasLimit
  });
  
  // Wait for transaction confirmation
  await tx.wait();
  
  // Dispatch transaction event
  window.dispatchEvent(new CustomEvent('outgoing_transaction', {
    detail: {
      from: fromWallet.address,
      to: toAddress,
      value: useMaxAmount ? gasEstimate.maxAmount : amount,
      hash: tx.hash,
      gasCost: gasEstimate.gasCostEther
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