import { Box, Text, Badge, VStack, HStack } from '@chakra-ui/react'
import { formatEther } from 'viem'

interface VaultCardProps {
  vault: `0x${string}`
  index: number
  onClick: () => void
  balance?: bigint
  isTimeLocked?: boolean
  isPriceLocked?: boolean
  isGoalLocked?: boolean
  unlockTime?: bigint
  targetPrice?: bigint
  goalAmount?: bigint
  currentAmount?: bigint
  progressPercentage?: number
  currentPrice?: number
  isLocked?: boolean
}

export const VaultCard = ({
  vault,
  index,
  onClick,
  balance,
  isTimeLocked,
  isPriceLocked,
  isGoalLocked,
  unlockTime,
  targetPrice,
  goalAmount,
  currentAmount,
  progressPercentage,
  currentPrice,
  isLocked
}: VaultCardProps) => {
  const formattedBalance = balance ? formatEther(balance) : '0'
  const formattedTargetPrice = targetPrice ? Number(targetPrice) / 1e8 : 0
  const formattedGoalUsd = goalAmount && currentPrice ? ((Number(goalAmount) / 1e18) * currentPrice).toFixed(2) : undefined

  return (
    <Box
      p={6}
      bg="white"
      borderRadius="xl"
      shadow="md"
      cursor="pointer"
      onClick={onClick}
      _hover={{
        shadow: "xl",
        transform: "translateY(-5px)",
        transition: "all 0.2s ease-in-out",
      }}
      transition="all 0.2s ease-in-out"
      border="1px solid"
      borderColor="gray.100"
      overflow="hidden"
      sx={{
        background: 'linear-gradient(145deg, #ffffff, #f0f8ff)',
        boxShadow: '5px 5px 10px #e6e6e6, -5px -5px 10px #ffffff',
      }}
    >
      <VStack align="start" spacing={4} width="full" minW={0}>
        <HStack width="full" justifyContent="space-between">
          <Text fontSize="md" color="gray.600" fontWeight="semibold">
            Vault #{index + 1}
          </Text>
          {typeof isLocked === 'boolean' && (
            <Badge
              colorScheme={isLocked ? 'red' : 'green'}
              variant="solid"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="0.8em"
            >
              {isLocked ? 'LOCKED' : 'UNLOCKED'}
            </Badge>
          )}
        </HStack>
        
        <Box width="full" overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis" minWidth={0}>
          <Text 
            fontSize="lg" 
            fontWeight="medium" 
            color="blue.700" 
            flexShrink={1}
          >
            {vault}
          </Text>
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.500">Balance</Text>
          <Text fontSize="2xl" fontWeight="extrabold" color="purple.600">
            {formattedBalance} ETH
          </Text>
        </Box>

        <HStack spacing={2}>
          {isTimeLocked && (
            <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="full">
              Time Lock
            </Badge>
          )}
          {isPriceLocked && (
            <Badge colorScheme="purple" variant="subtle" px={3} py={1} borderRadius="full">
              Price Lock
            </Badge>
          )}
          {isGoalLocked && (
            <Badge colorScheme="green" variant="subtle" px={3} py={1} borderRadius="full">
              Goal Lock
            </Badge>
          )}
        </HStack>

        {isTimeLocked && unlockTime && (
          <Box>
            <Text fontSize="sm" color="gray.500">Unlocks On</Text>
            <Text fontWeight="semibold" color="gray.700">
              {new Date(Number(unlockTime) * 1000).toLocaleString()}
            </Text>
          </Box>
        )}

        {isPriceLocked && targetPrice && (
          <Box>
            <Text fontSize="sm" color="gray.500">Target Price</Text>
            <Text fontWeight="semibold" color="gray.700">
              ${formattedTargetPrice.toFixed(2)}
            </Text>
            {currentPrice !== undefined && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                Current: <Text as="span" fontWeight="bold">${currentPrice.toFixed(2)}</Text>
              </Text>
            )}
          </Box>
        )}

        {isGoalLocked && goalAmount && currentAmount !== undefined && progressPercentage !== undefined && (
          <Box>
            <Text fontSize="sm" color="gray.500">Goal</Text>
            <Text fontWeight="semibold" color="gray.700">
              {formattedGoalUsd ? `$${formattedGoalUsd}` : `${Number(goalAmount) / 1e18} ETH`}
            </Text>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Progress: <Text as="span" fontWeight="bold">{progressPercentage}%</Text>
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  )
} 