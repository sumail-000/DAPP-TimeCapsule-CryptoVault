import { useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { useToast } from '@chakra-ui/react'
import { VaultFactoryABI } from '../contracts/abis'

const VAULT_FACTORY_ADDRESS = '0x861bCeBf56B2e766e3a350357d553Acd2b0D5189'

export const useNewVaultNotifications = () => {
  const publicClient = usePublicClient()
  const toast = useToast()

  useEffect(() => {
    if (!publicClient) return

    const unwatch = publicClient.watchContractEvent({
      address: VAULT_FACTORY_ADDRESS as `0x${string}`,
      abi: VaultFactoryABI,
      eventName: 'VaultCreated',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const creator = log.args.creator
          const vaultAddress = log.args.vaultAddress
          if (creator && vaultAddress) {
            toast({
              title: 'New Vault Created Globally!',
              description: `A new vault was created by ${creator} at ${vaultAddress}`,
              status: 'info',
              duration: 5000, // Disappears in 5 seconds
              isClosable: true,
              position: 'top-right',
            })
          }
        })
      },
    })

    return () => unwatch()
  }, [publicClient, toast])
} 