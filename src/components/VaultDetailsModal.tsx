import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, VStack, Text, Badge, Button, useToast, Spinner, Box, Tabs, TabList, TabPanels, Tab, TabPanel, Divider } from '@chakra-ui/react';
import { formatEther } from 'viem';
import { useVault } from '../hooks/useVault';
import { VaultData } from '../hooks/useVault';
import { PriceChart, CountdownTimer, VaultPerformanceTracker } from './visualization';
import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { CopyIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import { Tooltip, Progress, HStack, Input, IconButton } from '@chakra-ui/react';

interface VaultDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdrawComplete?: () => void;
  vault: string;
  vaultIndex: number | null;
  balance: bigint;
  isTimeLocked: boolean;
  isPriceLocked: boolean;
  isGoalLocked?: boolean;
  unlockTime: bigint;
  targetPrice: bigint;
  goalAmount?: bigint;
  currentAmount?: bigint;
  progressPercentage?: number;
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
  isGoalLocked,
  unlockTime,
  targetPrice,
  goalAmount,
  currentAmount,
  progressPercentage,
  currentPrice,
  isLocked,
  unlockReason,
}: VaultDetailsModalProps) => {
  const toast = useToast();
  const { withdraw, deposit, isWalletInitialized } = useVault();
  const navigate = useNavigate();
  const [isWithdrawing, setIsWithdrawing] = React.useState(false);
  const [autoWithdrawStarted, setAutoWithdrawStarted] = React.useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  React.useEffect(() => {
    // If vault is unlocked, has balance, wallet is initialized, and not already withdrawing, start withdrawal
    if (!isLocked && balance > 0n && isWalletInitialized && !isWithdrawing && !autoWithdrawStarted) {
      console.log('Modal: Starting automatic withdrawal for vault:', vault);
      console.log('Modal: Vault balance:', formatEther(balance), 'ETH');
      console.log('Modal: Vault locked status:', isLocked);
      console.log('Modal: Wallet initialized:', isWalletInitialized);
      
      setIsWithdrawing(true);
      setAutoWithdrawStarted(true);
      
      (async () => {
        try {
          const success = await withdraw(vault);
          
          if (success) {
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
          } else {
            throw new Error('Withdrawal failed - check console for details');
          }
        } catch (error) {
          console.error('Modal: Withdrawal error:', error);
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
    } else if (!isWalletInitialized && !isLocked && balance > 0n) {
      console.log('Modal: Wallet not yet initialized, waiting...');
    } else if (isWithdrawing) {
      console.log('Modal: Withdrawal already in progress...');
    } else if (autoWithdrawStarted) {
      console.log('Modal: Auto-withdrawal already started...');
    } else if (isLocked) {
      console.log('Modal: Vault is still locked...');
    } else if (balance === 0n) {
      console.log('Modal: Vault has no balance...');
    }
  }, [isLocked, balance, isWalletInitialized, isWithdrawing, autoWithdrawStarted, withdraw, vault, toast, onClose, navigate, onWithdrawComplete]);

  if (!vault || vaultIndex === null) {
    return null;
  }

  const formattedBalance = formatEther(balance);
  const formattedTargetPrice = Number(targetPrice) / 1e8;
  const formattedCurrentPrice = Number(currentPrice) / 1e8;
  const formattedGoalUsd = goalAmount && currentPrice ? ((Number(goalAmount) / 1e18) * (Number(currentPrice) / 1e8)).toFixed(2) : undefined;
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
                      <HStack spacing={2}>
                        <Text fontSize="md" fontWeight="semibold" noOfLines={1} color="blue.800">
                          {vault}
                        </Text>
                        <Tooltip label="Copy address" hasArrow>
                          <IconButton
                            aria-label="Copy address"
                            icon={<CopyIcon />}
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(vault);
                              toast({ title: 'Address copied!', status: 'info', duration: 2000 });
                            }}
                          />
                        </Tooltip>
                      </HStack>
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
                          <HStack spacing={2} mb={2}>
                            {[0.01, 0.1, 0.5].map((amt) => (
                              <Button
                                key={amt}
                                size="sm"
                                variant="outline"
                                colorScheme="purple"
                                onClick={() => setDepositAmount((prev) => (prev ? (Number(prev) + amt).toString() : amt.toString()))}
                              >
                                +{amt} ETH
                              </Button>
                            ))}
                          </HStack>
                          {/* Suggest amount needed for goal lock */}
                          {isGoalLocked && goalAmount !== undefined && currentAmount !== undefined && progressPercentage !== undefined && progressPercentage < 100 && (
                            <HStack spacing={2} mb={2}>
                              <Text fontSize="sm" color="green.700">
                                You need {isNaN(Number(goalAmount) - Number(currentAmount)) ? '' : ((Number(goalAmount) - Number(currentAmount)) / 1e18)} more ETH to reach your goal.
                              </Text>
                              <Button
                                size="xs"
                                colorScheme="green"
                                variant="outline"
                                onClick={() => setDepositAmount(((Number(goalAmount) - Number(currentAmount)) / 1e18).toString())}
                              >
                                Add Exact
                              </Button>
                            </HStack>
                          )}
                          <Box display="flex" gap={2}>
                            <Input
                              type="number"
                              min="0"
                              step="0.001"
                              value={depositAmount}
                              onChange={e => setDepositAmount(e.target.value)}
                              placeholder="Amount in ETH"
                              disabled={isDepositing}
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
                      <HStack spacing={2} mt={1}>
                        <Badge
                          colorScheme={isTimeLocked ? 'blue' : isPriceLocked ? 'purple' : isGoalLocked ? 'green' : 'gray'}
                          variant="solid"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="0.9em"
                        >
                          {isTimeLocked ? 'TIME LOCK' : isPriceLocked ? 'PRICE LOCK' : isGoalLocked ? 'GOAL LOCK' : 'UNKNOWN'}
                        </Badge>
                        <Tooltip
                          label={
                            isTimeLocked
                              ? 'Assets unlock at a specific time.'
                              : isPriceLocked
                              ? 'Assets unlock when a price target is reached.'
                              : isGoalLocked
                              ? 'Assets unlock when a deposit goal is reached.'
                              : 'Unknown lock type.'
                          }
                          hasArrow
                        >
                          <InfoOutlineIcon color="gray.500" />
                        </Tooltip>
                      </HStack>
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
                    {/* Goal Information for Goal Locks */}
                    {isGoalLocked && goalAmount !== undefined && currentAmount !== undefined && progressPercentage !== undefined && (
                      <Box width="full" mt={2} mb={2} p={3} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                        <VStack align="stretch" spacing={2}>
                          <Text fontSize="md" color="green.700" fontWeight="semibold">Goal Progress</Text>
                          <HStack width="full" justify="space-between">
                            <Text fontSize="sm" color="gray.600">Goal:</Text>
                            <Text fontSize="lg" fontWeight="bold" color="green.800">
                              {formattedGoalUsd && !isNaN(Number(formattedGoalUsd)) ? `$${formattedGoalUsd}` : `${Number(goalAmount) / 1e18} ETH`}
                            </Text>
                          </HStack>
                          <HStack width="full" justify="space-between">
                            <Text fontSize="sm" color="gray.600">Current:</Text>
                            <Text fontSize="lg" fontWeight="bold" color="green.800">
                              {isNaN(Number(currentAmount) / 1e18) ? '0' : (Number(currentAmount) / 1e18)} ETH
                            </Text>
                          </HStack>
                          <Progress value={isNaN(progressPercentage) ? 0 : progressPercentage} colorScheme="green" borderRadius="md" height="20px" />
                          <HStack width="full" justify="space-between">
                            <Text fontSize="sm" color="gray.600">Progress:</Text>
                            <Text fontSize="lg" fontWeight="bold" color="green.800">
                              {isNaN(progressPercentage) ? '0' : progressPercentage}%
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">
                            {progressPercentage < 100
                              ? `You need ${(Number(goalAmount) - Number(currentAmount)) / 1e18} more ETH to unlock.`
                              : 'Goal reached! Vault will unlock soon.'}
                          </Text>
                        </VStack>
                      </Box>
                    )}
                    {/* Manual Withdraw Button for Unlocked Vaults */}
                    {!isLocked && balance > 0n && (
                      <Box width="full" mt={4}>
                        <Button
                          colorScheme="green"
                          size="lg"
                          width="full"
                          onClick={async () => {
                            setIsWithdrawing(true);
                            try {
                              console.log('Manual withdrawal triggered for vault:', vault);
                              const success = await withdraw(vault);
                              if (success) {
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
                              } else {
                                throw new Error('Manual withdrawal failed - check console for details');
                              }
                            } catch (error) {
                              console.error('Manual withdrawal error:', error);
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
                          }}
                          isLoading={isWithdrawing}
                          loadingText="Withdrawing..."
                        >
                          Withdraw {formatEther(balance)} ETH
                        </Button>
                      </Box>
                    )}
                    
                    {/* Auto-withdraw message for locked vaults */}
                    {isLocked && (
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
                          Withdrawals are automatic! Assets will be sent to your wallet as soon as the vault unlocks.
                      </Text>
                    </Box>
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
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 