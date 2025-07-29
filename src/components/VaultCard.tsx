import { 
  Box, 
  Text, 
  Badge, 
  VStack, 
  HStack, 
  Progress, 
  Icon,
  Tooltip,
  Flex,
  Divider,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Wrap,
  WrapItem,
  Tag
} from '@chakra-ui/react'
import { formatEther } from 'viem'
import { 
  FaLock, 
  FaUnlock, 
  FaClock, 
  FaChartLine, 
  FaBullseye, 
  FaCoins,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSync,
  FaEllipsisV,
  FaPaintBrush,
  FaEye
} from 'react-icons/fa'
import { useVaultCustomization } from '../hooks/useVaultCustomization'

interface VaultCardProps {
  vault: `0x${string}`
  index: number
  onClick: () => void
  onRefresh?: () => void
  onCustomize?: () => void
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
  isAutoWithdrawing?: boolean
}

export const VaultCard = ({
  vault,
  index,
  onClick,
  onRefresh,
  onCustomize,
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
  isLocked,
  isAutoWithdrawing
}: VaultCardProps) => {
  const { getVaultCustomization } = useVaultCustomization();
  const customization = getVaultCustomization(vault);
  const formattedBalance = balance ? formatEther(balance) : '0'
  const formattedTargetPrice = targetPrice ? Number(targetPrice) / 1e8 : 0
  const formattedGoalUsd = goalAmount && currentPrice ? ((Number(goalAmount) / 1e18) * currentPrice).toFixed(2) : undefined

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!unlockTime) return null
    const now = Math.floor(Date.now() / 1000)
    const remaining = Number(unlockTime) - now
    if (remaining <= 0) return 'Unlocked'
    
    const days = Math.floor(remaining / 86400)
    const hours = Math.floor((remaining % 86400) / 3600)
    const minutes = Math.floor((remaining % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const timeRemaining = getTimeRemaining()
  const isUnlocked = timeRemaining === 'Unlocked'

  return (
    <Box
      p={6}
      bg="rgba(35, 37, 38, 0.9)"
      borderRadius="xl"
      shadow="lg"
      cursor="pointer"
      onClick={onClick}
      borderWidth="2px"
      borderColor={customization?.color || "rgba(65, 67, 69, 0.5)"}
      _hover={{
        shadow: "xl",
        transform: "translateY(-4px)",
        bg: "rgba(35, 37, 38, 0.95)",
        borderColor: customization?.color || "#7f5af0",
        transition: "all 0.3s ease-in-out",
      }}
      transition="all 0.3s ease-in-out"
      overflow="hidden"
      position="relative"
      sx={{
        background: 'linear-gradient(145deg, rgba(35, 37, 38, 0.9), rgba(24, 26, 32, 0.8))',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Status Indicator */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="4px"
        bg={isLocked ? "linear-gradient(90deg, #e53e3e, #fc8181)" : "linear-gradient(90deg, #38a169, #68d391)"}
      />

      <VStack align="start" spacing={4} width="full" minW={0}>
        {/* Header */}
        <HStack width="full" justifyContent="space-between" alignItems="flex-start">
          <VStack align="start" spacing={1}>
            <HStack spacing={2}>
              {customization?.emoji && (
                <Text fontSize="lg">{customization.emoji}</Text>
              )}
              <Icon as={isLocked ? FaLock : FaUnlock} color={isLocked ? "red.400" : "green.400"} />
              <Text fontSize="lg" color="white" fontWeight="bold">
                {customization?.name || `Vault #${index + 1}`}
              </Text>
            </HStack>
            <Text fontSize="xs" color="gray.400" fontFamily="mono">
              {vault.slice(0, 8)}...{vault.slice(-6)}
            </Text>
            {customization?.description && (
              <Text fontSize="sm" color="gray.300" maxW="200px" noOfLines={2}>
                {customization.description}
          </Text>
            )}
          </VStack>
          
          <HStack spacing={2} align="end">
            <VStack spacing={1} align="end">
              {customization?.category && (
                <Badge
                  bg={customization.color || "#7f5af0"}
                  color="white"
                  px={2}
                  py={1}
                  borderRadius="full"
                  fontSize="0.6em"
                  fontWeight="bold"
                >
                  {customization.category}
                </Badge>
              )}
            <Badge
              colorScheme={isLocked ? 'red' : 'green'}
              variant="solid"
              px={3}
              py={1}
              borderRadius="full"
                fontSize="0.7em"
                fontWeight="bold"
            >
              {isLocked ? 'LOCKED' : 'UNLOCKED'}
            </Badge>
              {isAutoWithdrawing && (
                <Badge
                  colorScheme="orange"
                  variant="solid"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="0.7em"
                  animation="pulse 2s infinite"
                >
                  AUTO-WITHDRAWING
                </Badge>
              )}
            </VStack>
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<FaEllipsisV />}
                size="xs"
                variant="ghost"
                color="gray.400"
                _hover={{ color: "white" }}
                onClick={(e) => e.stopPropagation()}
              />
              <MenuList bg="rgba(35, 37, 38, 0.95)" borderColor="#414345">
                {onCustomize && (
                  <MenuItem
                    icon={<FaPaintBrush />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCustomize();
                    }}
                    _hover={{ bg: "rgba(127, 90, 240, 0.2)" }}
                  >
                    Customize Vault
                  </MenuItem>
                )}
                <MenuItem
                  icon={<FaEye />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  _hover={{ bg: "rgba(127, 90, 240, 0.2)" }}
                >
                  View Details
                </MenuItem>
                {onRefresh && (
                  <>
                    <MenuDivider />
                    <MenuItem
                      icon={<FaSync />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRefresh();
                      }}
                      _hover={{ bg: "rgba(127, 90, 240, 0.2)" }}
                    >
                      Refresh Status
                    </MenuItem>
                  </>
                )}
              </MenuList>
            </Menu>
          </HStack>
        </HStack>
        
        <Divider borderColor="rgba(255,255,255,0.1)" />

        {/* Balance Section */}
        <Box width="full">
          <Text fontSize="sm" color="gray.400" mb={1}>Balance</Text>
          <HStack spacing={2} alignItems="baseline">
            <Text fontSize="3xl" fontWeight="extrabold" color="#7f5af0">
              {parseFloat(formattedBalance).toFixed(4)}
          </Text>
            <Text fontSize="lg" color="gray.400" fontWeight="medium">ETH</Text>
          </HStack>
        </Box>

        {/* Lock Types */}
        <HStack spacing={2} flexWrap="wrap">
          {isTimeLocked && (
            <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="full">
              <Icon as={FaClock} mr={1} />
              Time Lock
            </Badge>
          )}
          {isPriceLocked && (
            <Badge colorScheme="purple" variant="subtle" px={3} py={1} borderRadius="full">
              <Icon as={FaChartLine} mr={1} />
              Price Lock
            </Badge>
          )}
          {isGoalLocked && (
            <Badge colorScheme="green" variant="subtle" px={3} py={1} borderRadius="full">
              <Icon as={FaBullseye} mr={1} />
              Goal Lock
            </Badge>
          )}
        </HStack>

        {/* Time Lock Details */}
        {isTimeLocked && unlockTime && (
          <Box width="full">
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color="gray.400">Time Remaining</Text>
              <HStack spacing={1}>
                <Icon as={isUnlocked ? FaCheckCircle : FaClock} color={isUnlocked ? "green.400" : "blue.400"} boxSize={4} />
                <Text fontSize="sm" fontWeight="semibold" color={isUnlocked ? "green.400" : "white"}>
                  {timeRemaining}
            </Text>
              </HStack>
            </HStack>
            {!isUnlocked && (
              <Progress 
                value={Math.max(0, 100 - ((Number(unlockTime) - Math.floor(Date.now() / 1000)) / (Number(unlockTime) - (Number(unlockTime) - 86400 * 30)) * 100))} 
                colorScheme="blue" 
                size="sm" 
                borderRadius="full"
              />
            )}
          </Box>
        )}

        {/* Price Lock Details */}
        {isPriceLocked && targetPrice && (
          <Box width="full">
            <Text fontSize="sm" color="gray.400" mb={2}>Price Target</Text>
            <VStack spacing={1} align="start">
              <HStack spacing={2}>
                <Icon as={FaChartLine} color="purple.400" />
                <Text fontWeight="semibold" color="white">
                  ${formattedTargetPrice.toFixed(2)}
            </Text>
              </HStack>
              {currentPrice !== undefined && !isNaN(currentPrice) && (
                <HStack spacing={2}>
                  <Icon as={FaCoins} color="yellow.400" />
                  <Text fontSize="sm" color="gray.400">
                    Current: <Text as="span" fontWeight="bold" color="white">${currentPrice.toFixed(2)}</Text>
              </Text>
                  {currentPrice >= formattedTargetPrice && (
                    <Icon as={FaCheckCircle} color="green.400" />
                  )}
                </HStack>
              )}
            </VStack>
          </Box>
        )}

        {/* Goal Lock Details */}
        {isGoalLocked && goalAmount && currentAmount !== undefined && progressPercentage !== undefined && (
          <Box width="full">
            <Text fontSize="sm" color="gray.400" mb={2}>Goal Progress</Text>
            <VStack spacing={2} align="start" width="full">
              <HStack justify="space-between" width="full">
                <Text fontSize="sm" color="gray.400">Target</Text>
                <Text fontWeight="semibold" color="white">
              {formattedGoalUsd && !isNaN(Number(formattedGoalUsd)) ? `$${formattedGoalUsd}` : `${Number(goalAmount) / 1e18} ETH`}
            </Text>
              </HStack>
              <Progress 
                value={Math.min(100, Math.max(0, progressPercentage))} 
                colorScheme={progressPercentage >= 100 ? "green" : "yellow"} 
                size="md" 
                borderRadius="full"
                width="full"
              />
              <HStack justify="space-between" width="full">
                <Text fontSize="xs" color="gray.400">Progress</Text>
                <Text fontSize="sm" fontWeight="bold" color={progressPercentage >= 100 ? "green.400" : "yellow.400"}>
                  {Math.min(100, Math.max(0, progressPercentage)).toFixed(1)}%
            </Text>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Tags */}
        {customization?.tags && customization.tags.length > 0 && (
          <Box width="full">
            <Wrap spacing={1}>
              {customization.tags.slice(0, 3).map((tag, tagIndex) => (
                <WrapItem key={tagIndex}>
                  <Tag
                    size="sm"
                    borderRadius="full"
                    variant="solid"
                    bg={customization.color || "#7f5af0"}
                    color="white"
                    fontSize="0.7em"
                    opacity={0.8}
                  >
                    {tag}
                  </Tag>
                </WrapItem>
              ))}
              {customization.tags.length > 3 && (
                <WrapItem>
                  <Tag
                    size="sm"
                    borderRadius="full"
                    variant="outline"
                    borderColor={customization.color || "#7f5af0"}
                    color={customization.color || "#7f5af0"}
                    fontSize="0.7em"
                  >
                    +{customization.tags.length - 3}
                  </Tag>
                </WrapItem>
              )}
            </Wrap>
          </Box>
        )}

        {/* Action Hint */}
        <Box width="full" textAlign="center" pt={2}>
          <Text fontSize="xs" color="gray.500" fontStyle="italic">
            Click to view details
          </Text>
        </Box>
      </VStack>
    </Box>
  )
} 