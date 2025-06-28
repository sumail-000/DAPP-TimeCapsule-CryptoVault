import { TimeCapsuleVaultABI, VaultFactoryABI } from '@/contracts/abis'
import { parseEther } from 'viem'
import type { Address } from 'viem'

// Sepolia testnet addresses
export const VAULT_FACTORY_ADDRESS = '0x236Bb0804115CD5E6e509149BD30eD733050C43d' as const
// ETH/USD price feed for Sepolia testnet - official Chainlink address
export const ETH_USD_PRICE_FEED = '0x694AA1769357215DE4FAC081bf1f309aDC325306' as const

// Chainlink Price Feed ABI
export const CHAINLINK_PRICE_FEED_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export const getVaultContract = (address: string) => {
  return {
    address,
    abi: TimeCapsuleVaultABI,
  }
}

export const getVaultFactoryContract = () => {
  return {
    address: VAULT_FACTORY_ADDRESS,
    abi: VaultFactoryABI,
  }
}

export const createVault = (unlockTime: number, targetPrice: number, targetAmount: number) => ({
  address: VAULT_FACTORY_ADDRESS,
  abi: VaultFactoryABI,
  functionName: 'createVault',
  args: [BigInt(unlockTime), BigInt(targetPrice), BigInt(targetAmount), ETH_USD_PRICE_FEED],
} as const)

export const depositToVault = (vaultAddress: string, amount: string) => ({
  address: vaultAddress as Address,
  abi: TimeCapsuleVaultABI,
  functionName: 'deposit',
  value: parseEther(amount),
} as const)

export const withdrawFromVault = (vaultAddress: string) => ({
  address: vaultAddress as Address,
  abi: TimeCapsuleVaultABI,
  functionName: 'withdraw',
} as const)

export const getVaultStatus = (vaultAddress: string) => ({
  address: vaultAddress as Address,
  abi: TimeCapsuleVaultABI,
  functionName: 'getLockStatus',
} as const)

export const getCurrentEthPrice = () => ({
  address: ETH_USD_PRICE_FEED,
  abi: CHAINLINK_PRICE_FEED_ABI,
  functionName: 'latestRoundData',
} as const) 