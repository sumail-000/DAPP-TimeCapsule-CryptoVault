import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, VStack, Text, Badge, Button, useToast, Spinner, Box, Tabs, TabList, TabPanels, Tab, TabPanel, Divider } from '@chakra-ui/react';
import { formatEther } from 'viem';
import { useVault } from '../hooks/useVault';
import { VaultData } from '../hooks/useVault';
import { PriceChart, CountdownTimer, VaultPerformanceTracker } from './visualization';

interface VaultDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: string;
  vaultIndex: number | null;
  balance: bigint;
  isTimeLocked: boolean;
  isPriceLocked: boolean;
  unlockTime: bigint;
  targetPrice: bigint;
  currentPrice: bigint;
  isLocked: boolean;
  unlockReason: string;
}

export const VaultDetailsModal = ({
  isOpen,
  onClose,
  vault,
  vaultIndex,
  balance,
  isTimeLocked,
  isPriceLocked,
  unlockTime,
  targetPrice,
  currentPrice,
  isLocked,
  unlockReason,
}: VaultDetailsModalProps) => {
  const toast = useToast();
  const { withdraw } = useVault();

  if (!vault || vaultIndex === null) {
    return null;
  }

  const formattedBalance = formatEther(balance);
  const formattedTargetPrice = Number(targetPrice) / 1e8;
  const formattedCurrentPrice = Number(currentPrice) / 1e8;
  const unlockDate = new Date(Number(unlockTime) * 1000).toLocaleString();

  const handleWithdraw = async () => {
    try {
      await withdraw(vault);
      toast({
        title: 'Success',
        description: 'Funds withdrawn successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to withdraw funds',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px) hue-rotate(90deg)" />
      <ModalContent
        bg="white"
        borderRadius="2xl"
        boxShadow="xl"
        p={6}
        maxW="800px"
        sx={{
          background: 'linear-gradient(145deg, #f0f8ff, #e6f2ff)',
          boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
        }}
      >
        <ModalHeader fontSize="2xl" fontWeight="extrabold" color="purple.700" textAlign="center">
          Vault Details
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs variant="soft-rounded" colorScheme="purple" isFitted>
            <TabList mb={4}>
              <Tab fontWeight="medium">Overview</Tab>
              <Tab fontWeight="medium">Analytics</Tab>
            </TabList>
            
            <TabPanels>
              {/* Overview Tab */}
              <TabPanel px={0}>
                <VStack align="start" spacing={5} pb={4}>
                  <Box width="full">
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">Vault Address</Text>
                    <Text fontSize="md" fontWeight="semibold" noOfLines={1} color="blue.800">
                      {vault}
                    </Text>
                  </Box>

                  <Box width="full">
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">Balance</Text>
                    <Text fontSize="3xl" fontWeight="extrabold" color="purple.600">
                      {formattedBalance} ETH
                    </Text>
                  </Box>

                  <Box width="full">
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">Lock Type</Text>
                    <Badge
                      colorScheme={isTimeLocked ? 'blue' : 'purple'}
                      variant="solid"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="0.9em"
                      mt={1}
                    >
                      {isTimeLocked ? 'TIME LOCK' : 'PRICE LOCK'}
                    </Badge>
                  </Box>

                  {/* Countdown Timer for Time Locks */}
                  {isTimeLocked && (
                    <>
                      <Box width="full">
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">
                          Unlock Time
                        </Text>
                        <Text fontSize="md" fontWeight="semibold" color="gray.700">{unlockDate}</Text>
                      </Box>
                      <CountdownTimer unlockTime={Number(unlockTime)} isTimeLocked={isTimeLocked} />
                    </>
                  )}

                  {/* Price Information for Price Locks */}
                  {isPriceLocked && (
                    <>
                      <VStack align="start" width="full" spacing={2}>
                        <Box>
                          <Text fontSize="sm" color="gray.600" fontWeight="medium">
                            Target Price
                          </Text>
                          <Text fontSize="md" fontWeight="semibold" color="gray.700">${formattedTargetPrice.toFixed(2)}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600" fontWeight="medium">
                            Current Price
                          </Text>
                          <Text fontSize="md" fontWeight="semibold" color="gray.700">${formattedCurrentPrice.toFixed(2)}</Text>
                        </Box>
                      </VStack>
                      
                      {/* Price Chart for Price Locks */}
                      <PriceChart 
                        targetPrice={Number(targetPrice)} 
                        currentPrice={Number(currentPrice)} 
                        isPriceLocked={isPriceLocked} 
                      />
                    </>
                  )}

                  <Button
                    colorScheme="purple"
                    onClick={handleWithdraw}
                    isDisabled={isLocked}
                    size="lg"
                    width="full"
                    mt={4}
                    _hover={{ bg: "purple.600", shadow: "lg" }}
                    transition="all 0.2s"
                  >
                    Withdraw
                  </Button>
                  {isLocked && (
                    <Text fontSize="sm" color="red.500" textAlign="center" width="full">
                      {unlockReason}
                    </Text>
                  )}
                </VStack>
              </TabPanel>
              
              {/* Analytics Tab */}
              <TabPanel px={0}>
                <VaultPerformanceTracker
                  vaultAddress={vault}
                  currentBalance={balance}
                  targetPrice={Number(targetPrice)}
                  isPriceLocked={isPriceLocked}
                  isTimeLocked={isTimeLocked}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 