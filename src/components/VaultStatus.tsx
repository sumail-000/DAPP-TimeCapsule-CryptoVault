import { Box, Heading, Text, Stack, Progress, Badge } from '@chakra-ui/react'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { TimeCapsuleVaultABI } from '../contracts/abis'
import { useUserVault } from '../hooks/useUserVault'
import { useEffect, useState } from 'react'

const VaultStatus = () => {
  const { address } = useAccount()
  const { lastVaultAddress, isLoadingVaults } = useUserVault()
  const [currentEthPrice, setCurrentEthPrice] = useState<number>(0)

  // Fetch the actual ETH balance of the vault
  const { data: vaultEthBalance, isLoading: isLoadingVaultEthBalance } = useBalance({
    address: lastVaultAddress,
    query: {
      enabled: !!lastVaultAddress,
    },
  })

  const { data: lockStatus, isLoading: isLoadingLockStatus } = useReadContract({
    abi: TimeCapsuleVaultABI,
    address: lastVaultAddress,
    functionName: 'getLockStatus',
    query: {
      enabled: !!lastVaultAddress,
    },
  }) as { data: [boolean, bigint, bigint, boolean, string] | undefined, isLoading: boolean }

  const { data: targetPrice, isLoading: isLoadingTargetPrice } = useReadContract({
    abi: TimeCapsuleVaultABI,
    address: lastVaultAddress,
    functionName: 'targetPrice',
    query: {
      enabled: !!lastVaultAddress,
    },
  }) as { data: bigint | undefined, isLoading: boolean }

  // Fetch current ETH price
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (data.ethereum && data.ethereum.usd) {
          setCurrentEthPrice(data.ethereum.usd)
        }
      } catch (error) {
        console.error('Error fetching ETH price:', error)
      }
    }

    fetchEthPrice()
    const interval = setInterval(fetchEthPrice, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  if (!address) {
    return (
      <Box p={4} bg="blue.50" borderRadius="md" boxShadow="sm">
        <Text textAlign="center" color="blue.700">Connect your wallet to view vault status.</Text>
      </Box>
    )
  }

  if (isLoadingVaults) {
    return (
      <Box p={4} bg="blue.50" borderRadius="md" boxShadow="sm">
        <Text textAlign="center" color="blue.700">Loading vaults...</Text>
      </Box>
    )
  }

  if (!lastVaultAddress) {
    return (
      <Box p={4} bg="blue.50" borderRadius="md" boxShadow="sm">
        <Text textAlign="center" color="blue.700">No vault created yet. Create one above!</Text>
      </Box>
    )
  }

  const isPriceLock = lockStatus ? lockStatus[3] : false
  const formattedTargetPrice = targetPrice ? `$${(Number(targetPrice) / 1e8).toFixed(2)}` : 'N/A'
  const formattedCurrentPrice = `$${currentEthPrice.toFixed(2)}`
  const isLocked = lockStatus ? lockStatus[0] : false
  const currentVaultPrice = lockStatus ? Number(lockStatus[1]) / 1e8 : 0
  const timeRemaining = lockStatus ? Number(lockStatus[2]) : 0
  const unlockReason = lockStatus ? lockStatus[4] : ''

  // Calculate price progress percentage for price locks
  const priceProgress = isPriceLock && targetPrice ? 
    Math.min(100, (currentEthPrice / (Number(targetPrice) / 1e8)) * 100) : 0

  return (
    <Box p={4} bg="blue.50" borderRadius="md" boxShadow="sm">
      <Heading as="h2" size="md" mb={4} color="blue.700">Vault Status</Heading>
      <Stack spacing={4}>
        <Box>
          <Text fontSize="sm" color="gray.600">Locked Balance</Text>
          <Text fontSize="xl" fontWeight="bold" color="blue.800">
            {isLoadingVaultEthBalance || typeof vaultEthBalance?.formatted === 'undefined' ? 'Loading...' : `${vaultEthBalance.formatted} ETH`}
          </Text>
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.600">Lock Type</Text>
          <Badge colorScheme={isPriceLock ? 'purple' : 'blue'} fontSize="md" mb={2}>
            {isPriceLock ? 'Price Lock' : 'Time Lock'}
          </Badge>
          {isPriceLock ? (
            <>
              <Text fontSize="sm" color="gray.600">Target Price: {formattedTargetPrice}</Text>
              <Text fontSize="sm" color="gray.600">Current Price: {formattedCurrentPrice}</Text>
              <Progress 
                value={priceProgress} 
                colorScheme={priceProgress >= 100 ? 'green' : 'blue'} 
                size="sm" 
                mt={2}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                {priceProgress.toFixed(1)}% of target price reached
              </Text>
            </>
          ) : (
            <Text fontSize="sm" color="gray.600">
              Time Remaining: {timeRemaining > 0 ? 
                `${Math.floor(timeRemaining / 3600)}h ${Math.floor((timeRemaining % 3600) / 60)}m` : 
                'Unlocked'}
            </Text>
          )}
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.600">Status</Text>
          <Badge colorScheme={isLocked ? 'red' : 'green'} fontSize="md">
            {isLocked ? 'Locked' : 'Unlocked'}
          </Badge>
          <Text fontSize="sm" color="gray.600" mt={1}>
            {unlockReason}
          </Text>
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.600">Live ETH Price</Text>
          <Text fontSize="xl" fontWeight="bold" color="blue.800">
            {formattedCurrentPrice}
          </Text>
        </Box>
      </Stack>
    </Box>
  )
}

export default VaultStatus