import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, VStack, Text, Badge, Button, useToast, Spinner, Box, Tabs, TabList, TabPanels, Tab, TabPanel, Divider } from '@chakra-ui/react';
import { formatEther } from 'viem';
import { useVault } from '../hooks/useVault';
import { VaultData } from '../hooks/useVault';
import { PriceChart, CountdownTimer, VaultPerformanceTracker } from './visualization';
import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';

interface VaultDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdrawComplete?: () => void;
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
  onWithdrawComplete,
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
  const { withdraw, deposit } = useVault();
  const navigate = useNavigate();
  const [isWithdrawing, setIsWithdrawing] = React.useState(false);
  const [autoWithdrawStarted, setAutoWithdrawStarted] = React.useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  React.useEffect(() => {
    // If vault is unlocked, has balance, and not already withdrawing, start withdrawal
    if (!isLocked && balance > 0n && !isWithdrawing && !autoWithdrawStarted) {
      setIsWithdrawing(true);
      setAutoWithdrawStarted(true);
      (async () => {
        try {
          await withdraw(vault);
          toast({
            title: 'Success',
            description: 'Funds withdrawn successfully',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          if (onWithdrawComplete) onWithdrawComplete();
          onClose();
          navigate('/wallet');
        } catch (error) {
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to withdraw funds',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setIsWithdrawing(false);
        }
      })();
    }
  }, [isLocked, balance, isWithdrawing, autoWithdrawStarted, withdraw, vault, toast, onClose, navigate, onWithdrawComplete]);

  if (!vault || vaultIndex === null) {
    return null;
  }

  const formattedBalance = formatEther(balance);
  const formattedTargetPrice = Number(targetPrice) / 1e8;
  const formattedCurrentPrice = Number(currentPrice) / 1e8;
  const unlockDate = new Date(Number(unlockTime) * 1000).toLocaleString();

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
          {isWithdrawing ? (
            <VStack width="full" py={12} spacing={6} align="center" justify="center">
              <Spinner size="xl" color="purple.500" thickness="4px" speed="0.7s" />
              <Text fontSize="lg" color="purple.700" fontWeight="bold">Withdrawal in progress...</Text>
              <Text fontSize="md" color="gray.600">Please wait while your assets are being sent to your wallet.</Text>
            </VStack>
          ) : (
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
                    {/* Deposit Form */}
                    {isLocked && (
                      <Box width="full" mt={2} mb={2} p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                        <VStack align="stretch" spacing={2}>
                          <Text fontSize="md" color="gray.700" fontWeight="semibold">Deposit More ETH</Text>
                          <Box display="flex" gap={2}>
                            <input
                              type="number"
                              min="0"
                              step="0.001"
                              value={depositAmount}
                              onChange={e => setDepositAmount(e.target.value)}
                              placeholder="Amount in ETH"
                              disabled={isDepositing}
                              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                            <Button
                              colorScheme="purple"
                              isLoading={isDepositing}
                              loadingText="Depositing"
                              onClick={async () => {
                                if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
                                  toast({ title: 'Invalid amount', status: 'error', duration: 4000 });
                                  return;
                                }
                                setIsDepositing(true);
                                try {
                                  await deposit(depositAmount, vault);
                                  toast({ title: 'Deposit successful', status: 'success', duration: 4000 });
                                  setDepositAmount('');
                                } catch (err) {
                                  toast({ title: 'Deposit failed', description: err instanceof Error ? err.message : 'Error', status: 'error', duration: 5000 });
                                } finally {
                                  setIsDepositing(false);
                                }
                              }}
                              disabled={isDepositing || !depositAmount || Number(depositAmount) <= 0}
                            >
                              Deposit
                            </Button>
                          </Box>
                        </VStack>
                      </Box>
                    )}
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
                    {/* Instead of Withdraw button, show auto-withdraw message */}
                    <Box
                      width="full"
                      mt={4}
                      p={3}
                      bg="purple.50"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="purple.200"
                      textAlign="center"
                    >
                      <Text fontSize="md" color="purple.700" fontWeight="semibold">
                        Withdrawals are now automatic! Assets will be sent to your wallet as soon as the vault unlocks.
                      </Text>
                    </Box>
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
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 