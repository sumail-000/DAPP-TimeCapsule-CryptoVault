import { useAccount, useReadContract } from 'wagmi'
import { VaultFactoryABI, TimeCapsuleVaultABI } from '../contracts/abis'
import { useMemo } from 'react'
import type { Address } from 'viem'
import { VAULT_FACTORY_ADDRESS } from '../utils/contracts'

export const useUserVault = () => {
  const { address } = useAccount()

  // Get all vault addresses associated with the user from the factory
  const { data: userVaults, isLoading: isLoadingVaults, refetch } = useReadContract({
    abi: VaultFactoryABI,
    address: VAULT_FACTORY_ADDRESS as Address,
    functionName: 'getUserVaults',
    args: [address as Address],
    query: {
      enabled: !!address,
    },
  }) as { data: Address[] | undefined, isLoading: boolean, refetch: () => Promise<any> }

  // Add console logs for debugging
  console.log("useUserVault - connected address:", address);
  console.log("useUserVault - raw user vaults from contract:", userVaults);

  const lastVaultAddress = useMemo(() => {
    if (!userVaults || userVaults.length === 0) {
      return undefined
    }
    return userVaults[userVaults.length - 1]
  }, [userVaults]) as Address | undefined

  return {
    userVaults,
    lastVaultAddress,
    isLoadingVaults,
    refetch,
  }
} 