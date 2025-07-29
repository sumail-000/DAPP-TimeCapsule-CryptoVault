import { useState, ChangeEvent, useEffect } from 'react'
import { useVault } from '../hooks/useVault'
import {
  useToast,
  HStack,
  Box,
  Text,
  Button as ChakraButton,
  VStack,
  FormControl,
  FormLabel,
  Input as ChakraInput,
  FormErrorMessage,
  Heading,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Stepper, Step, StepIndicator, StepStatus, StepTitle, StepDescription, StepSeparator, StepNumber, StepIcon, StepperProps, Button,
  InputGroup, InputRightElement, Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { add } from 'date-fns'
import { InfoOutlineIcon, CheckCircleIcon, LockIcon, TimeIcon } from '@chakra-ui/icons';
import { Tooltip } from '@chakra-ui/react';
import DepositPromptModal from './DepositPromptModal';

const MotionButton = motion.create(ChakraButton)
const MotionBox = motion.create(Box, {
  forwardMotionProps: true
})

const steps = [
  { title: 'Wallet', description: 'Select your wallet' },
  { title: 'Lock Type', description: 'Choose lock type' },
  { title: 'Details', description: 'Enter vault details' },
  { title: 'Review', description: 'Review & Confirm' },
];

const stepIcons = [
  <TimeIcon boxSize={5} color="purple.500" />, // Wallet
  <LockIcon boxSize={5} color="purple.500" />, // Lock Type
  <InfoOutlineIcon boxSize={5} color="purple.500" />, // Details
  <CheckCircleIcon boxSize={5} color="green.500" />, // Review
];

export const VaultForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  
  // Check if this is the first vault from wallet creation
  const isFirstVault = location.state?.isFirstVault;
  const preselectedWallet = location.state?.walletAddress;
  
  const { createNewVault, deposit, currentEthPrice } = useVault()
  const [amount, setAmount] = useState<string>('')
  const [unlockYears, setUnlockYears] = useState('')
  const [unlockMonths, setUnlockMonths] = useState('')
  const [unlockDays, setUnlockDays] = useState('')
  const [targetPrice, setTargetPrice] = useState<string>('')
  const [isPriceLock, setIsPriceLock] = useState(false)
  const [isGoalLock, setIsGoalLock] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usdGoal, setUsdGoal] = useState('')
  const toast = useToast()
  const [step, setStep] = useState(0);

  // Price lock validation state
  const [isPriceInvalid, setIsPriceInvalid] = useState(false);
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const { isOpen: isDepositOpen, onOpen: onDepositOpen, onClose: onDepositClose } = useDisclosure();
  const [isSuccess, setIsSuccess] = useState(false);
  const [newVaultAddress, setNewVaultAddress] = useState<string | null>(null);
  const [vaultCreationData, setVaultCreationData] = useState<{
    vaultType: 'time' | 'price' | 'goal';
    goalAmount?: string;
    unlockTime?: string;
    targetPrice?: string;
  } | null>(null);

  const formatDuration = (years: string, months: string, days: string) => {
    const parts = [];
    if (parseInt(years, 10) > 0) parts.push(`${years}y`);
    if (parseInt(months, 10) > 0) parts.push(`${months}m`);
    if (parseInt(days, 10) > 0) parts.push(`${days}d`);
    if (parts.length === 0) return <span style={{ color: '#aaa' }}>Not set</span>;
    return parts.join(' ');
  };

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  // Load saved wallets from localStorage
  useEffect(() => {
    const savedWallets = localStorage.getItem('wallets');
    if (savedWallets) {
      const parsedWallets = JSON.parse(savedWallets);
      setWallets(parsedWallets);
      
      // If a wallet address was passed in the location state, select it
      if (location.state && location.state.walletAddress) {
        setSelectedWallet(location.state.walletAddress);
      } else if (parsedWallets.length > 0) {
        // Otherwise select the first wallet
        setSelectedWallet(parsedWallets[0].address);
      }
    }
  }, [location]);

  // Validate price lock target price
  useEffect(() => {
    if (isPriceLock && targetPrice && currentEthPrice) {
      const target = parseFloat(targetPrice);
      const current = Number(currentEthPrice) / 1e8;
      setIsPriceInvalid(target <= current);
    } else {
      setIsPriceInvalid(false);
    }
  }, [isPriceLock, targetPrice, currentEthPrice]);

  const handleCreateVault = async () => {
    if (!selectedWallet) {
      setError('Please select a wallet first')
      toast({
        title: 'Error',
        description: 'Please select a wallet first',
        status: 'error',
        duration: 5000,
      })
      return
    }

    if (!amount) {
      setError('Please enter an amount')
      return
    }

    const years = parseInt(unlockYears || '0')
    const months = parseInt(unlockMonths || '0')
    const days = parseInt(unlockDays || '0')

    if (!isPriceLock && !isGoalLock && years === 0 && months === 0 && days === 0) {
      setError('Please enter an unlock duration (years, months, or days).')
      return
    }

    if (isPriceLock && !targetPrice) {
      setError('Please enter target price')
      return
    }

    if (isGoalLock && !usdGoal) {
      setError('Please enter a USD goal')
      return
    }

    // Price lock validation: target price must be greater than current price
    if (isPriceLock) {
      const targetPriceWei = parseFloat(targetPrice) * 1e8 // Assuming 8 decimals for price feed
      const currentPriceWei = Number(currentEthPrice) // currentEthPrice is bigint, convert to number
      if (targetPriceWei <= currentPriceWei) {
        setError('Target price must be greater than current ETH price.')
        return
      }
    }

    // Goal lock validation: USD goal must be greater than 0
    if (isGoalLock) {
      if (parseFloat(usdGoal) <= 0) {
        setError('USD goal must be greater than 0.')
        return
      }
    }

    try {
      setIsLoading(true)
      setError(null)

      let unlockTimestamp: number
      let targetPriceParam = 0
      let targetAmountParam = 0
      if (isGoalLock) {
        // For goal lock, set unlockTime to a very distant future to ensure it's not time-locked
        unlockTimestamp = Math.floor(Date.now() / 1000) + (100 * 365 * 24 * 60 * 60)
        // Calculate targetAmount in wei from USD goal and current ETH price
        // ETH price is in 1e8, USD goal is in dollars
        const ethPrice = Number(currentEthPrice) / 1e8
        const ethAmount = parseFloat(usdGoal) / ethPrice
        targetAmountParam = Math.floor(ethAmount * 1e18)
        
        console.log('Goal lock calculation:', {
          usdGoal,
          currentEthPrice: currentEthPrice.toString(),
          ethPrice,
          ethAmount,
          targetAmountParam
        });
      } else if (isPriceLock) {
        unlockTimestamp = Math.floor(Date.now() / 1000) + (100 * 365 * 24 * 60 * 60)
        targetPriceParam = Math.floor(parseFloat(targetPrice) * 1e8)
      } else {
        const now = new Date()
        const futureDate = add(now, {
          years: parseInt(unlockYears || '0'),
          months: parseInt(unlockMonths || '0'),
          days: parseInt(unlockDays || '0'),
        })
        unlockTimestamp = Math.floor(futureDate.getTime() / 1000)
      }

      console.log('Creating vault with params:', {
        unlockTimestamp,
        targetPrice: targetPriceParam,
        targetAmount: targetAmountParam,
        isPriceLock,
        isGoalLock,
      })

      // Create the vault
      const vaultAddress = await createNewVault(
        unlockTimestamp,
        targetPriceParam,
        targetAmountParam
      )

      if (!vaultAddress) {
        throw new Error('Failed to create vault')
      }

      console.log('Vault created successfully, proceeding with deposit...')

      // Instead of immediate deposit, show deposit prompt
      onConfirmClose();
      setNewVaultAddress(vaultAddress);
      
      // Prepare vault creation data for deposit prompt
      const vaultType = isPriceLock ? 'price' : isGoalLock ? 'goal' : 'time';
      const unlockDate = years > 0 || months > 0 || days > 0 
        ? add(new Date(), { years, months, days }).toLocaleDateString()
        : undefined;
      
      setVaultCreationData({
        vaultType,
        goalAmount: isGoalLock ? usdGoal : undefined,
        unlockTime: unlockDate,
        targetPrice: isPriceLock ? targetPrice : undefined,
      });
      
      // Show deposit prompt immediately
      onDepositOpen();
      
    } catch (err) {
      onConfirmClose();
      if (err && typeof err === 'object' && 'code' in err && err.code === 4001) {
        toast({
          title: 'Transaction cancelled',
          description: 'You cancelled the wallet transaction.',
          status: 'info',
          duration: 4000,
        });
      } else {
        console.error('Error in handleCreateVault:', err)
        setError(err instanceof Error ? err.message : 'Failed to create vault')
        setIsLoading(false)

        // Show error toast
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to create vault',
          status: 'error',
          duration: 5000,
        })
      }
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    setter(e.target.value)
  }

  const isTimeLockDurationSet =
    parseInt(unlockYears || '0') > 0 ||
    parseInt(unlockMonths || '0') > 0 ||
    parseInt(unlockDays || '0') > 0

  // Step navigation
  const nextStep = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  // Step validation
  const isWalletStepValid = !!selectedWallet;
  const isLockTypeStepValid = isPriceLock || isGoalLock || (!isPriceLock && !isGoalLock);
  const isDetailsStepValid = (
    (isPriceLock && targetPrice) ||
    (isGoalLock && usdGoal) ||
    (!isPriceLock && !isGoalLock && (parseInt(unlockYears || '0') > 0 || parseInt(unlockMonths || '0') > 0 || parseInt(unlockDays || '0') > 0))
  ) && amount;

  const handleDepositComplete = () => {
    setIsSuccess(true);
    onDepositClose();
    // Optional: Navigate to my-vaults or show success state
  };

  if (isSuccess) {
    return (
      <Box
        p={8}
        bg="white"
        borderRadius="xl"
        shadow="2xl"
        maxW="xl"
        mx="auto"
        my={10}
        textAlign="center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <VStack spacing={6}>
            <CheckCircleIcon boxSize={16} color="green.500" />
            <Heading as="h2" size="xl" color="purple.700">
              Vault Created!
            </Heading>
            <Text color="gray.600">Your new vault has been successfully created and funded.</Text>
            <Text fontSize="sm" color="gray.500">
              Address: {newVaultAddress}
            </Text>
            <Button
              colorScheme="purple"
              size="lg"
              onClick={() => navigate('/my-vaults')}
            >
              View My Vaults
            </Button>
          </VStack>
        </motion.div>
      </Box>
    )
  }

  return (
    <Box
      p={8}
      bg="white"
      borderRadius="xl"
      shadow="2xl"
      maxW="5xl"
      mx="auto"
      my={10}
      border="1px solid"
      borderColor="gray.200"
      sx={{
        background: 'linear-gradient(145deg, #f0f8ff, #e6f2ff)',
        boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
      }}
    >
      <Stack direction={{ base: 'column', md: 'row' }} spacing={8} align="flex-start">
        {/* Main Form Area */}
        <Box flex="2" minW={0}>
          <VStack spacing={6} align="stretch" minH={{ base: 'auto', md: '550px' }}>
            <VStack spacing={4} textAlign="center" mb={6}>
              <Heading as="h2" size="xl" color="purple.700">
                {isFirstVault ? '🎉 Create Your First Vault!' : 'Create New Vault'}
            </Heading>
              {isFirstVault && (
                <Alert status="success" bg="rgba(56, 161, 105, 0.1)" borderColor="green.400" borderRadius="lg">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Welcome to Secure Savings! 🚀</AlertTitle>
                    <AlertDescription>
                      Great job creating your wallet! Now let's set up your first crypto vault to start saving with purpose. 
                      Choose your savings goal and watch your funds grow securely!
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
            <Stepper index={Number(step)} colorScheme="purple" size="md" mb={6}>
              {steps.map((s, i) => (
                <Step key={i}>
                  <StepIndicator bg={Number(step) === i ? 'purple.100' : 'gray.100'} borderColor={Number(step) === i ? 'purple.500' : 'gray.300'}>
                    {stepIcons[i]}
                  </StepIndicator>
                  <Box flexShrink={0}>
                    <StepTitle color={Number(step) === i ? 'purple.700' : 'gray.600'}>{s.title}</StepTitle>
                    <StepDescription color={Number(step) === i ? 'purple.500' : 'gray.400'}>{s.description}</StepDescription>
                  </Box>
                  <StepSeparator />
                </Step>
              ))}
            </Stepper>

            {/* Step Content Area with animation */}
            <Box flexGrow={1} minH="280px">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step 1: Select Wallet */}
                {Number(step) === 0 && (
                  <FormControl id="wallet" isInvalid={!!error && error.includes('wallet')}> 
                    <FormLabel fontSize="md" fontWeight="bold" color="gray.700">
                      Select Wallet
                      <Tooltip label="Choose the wallet to use for this vault." hasArrow><InfoOutlineIcon ml={2} color="gray.400" /></Tooltip>
                    </FormLabel>
                    <Select
                      value={selectedWallet || ''}
                      onChange={(e) => setSelectedWallet(e.target.value)}
                      size="lg"
                      borderColor="gray.300"
                      _hover={{ borderColor: "blue.300" }}
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
                    >
                      <option value="">Select a wallet</option>
                      {wallets.map((wallet) => (
                        <option key={wallet.address} value={wallet.address}>
                          {wallet.address} ({wallet.network}) - Balance: {wallet.balance} ETH
                        </option>
                      ))}
                    </Select>
                    {(!wallets.length) && (
                      <Text color="red.500" mt={2} fontSize="sm">
                        No wallets found. Please create a wallet first.
                      </Text>
                    )}
                  </FormControl>
                )}

                {/* Step 2: Lock Type */}
                {Number(step) === 1 && (
                  <FormControl id="lock-type">
                    <FormLabel fontSize="md" fontWeight="bold" color="gray.700">
                      Lock Type
                      <Tooltip label="Choose how your vault will unlock." hasArrow><InfoOutlineIcon ml={2} color="gray.400" /></Tooltip>
                    </FormLabel>
                    <HStack spacing={4}>
                      <MotionButton
                        onClick={() => { setIsPriceLock(false); setIsGoalLock(false); }}
                        variant={!isPriceLock && !isGoalLock ? 'solid' : 'outline'}
                        colorScheme="purple"
                        size="lg"
                        flex="1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Time Lock
                      </MotionButton>
                      <MotionButton
                        onClick={() => { setIsPriceLock(true); setIsGoalLock(false); }}
                        variant={isPriceLock ? 'solid' : 'outline'}
                        colorScheme="purple"
                        size="lg"
                        flex="1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Price Lock
                      </MotionButton>
                      <MotionButton
                        onClick={() => { setIsGoalLock(true); setIsPriceLock(false); }}
                        variant={isGoalLock ? 'solid' : 'outline'}
                        colorScheme="purple"
                        size="lg"
                        flex="1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Goal Lock (USD)
                      </MotionButton>
                    </HStack>
                  </FormControl>
                )}

                {/* Step 3: Details */}
                {Number(step) === 2 && (
                  <>
                    <FormControl id="amount" isInvalid={!!error && error.includes('amount')}>
                      <FormLabel fontSize="md" fontWeight="bold" color="gray.700">
                        Initial Deposit (ETH)
                        <Tooltip label="How much ETH to deposit initially." hasArrow><InfoOutlineIcon ml={2} color="gray.400" /></Tooltip>
                      </FormLabel>
                      <InputGroup>
                        <ChakraInput
                          type="number"
                          value={amount}
                          onChange={(e) => handleInputChange(e, setAmount)}
                          placeholder={isGoalLock ? "Enter initial deposit in ETH (e.g., 0.02)" : "Enter amount in ETH"}
                          min="0"
                          step="0.001"
                          size="lg"
                          borderColor="gray.300"
                          _hover={{ borderColor: "blue.300" }}
                          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
                        />
                        <InputRightElement width="4.5rem" h="100%">
                          <Text color="gray.500" fontWeight="bold">ETH</Text>
                        </InputRightElement>
                      </InputGroup>
                      {isGoalLock && usdGoal && currentEthPrice && Number(currentEthPrice) > 0 && !isNaN(parseFloat(usdGoal)) ? (
                        <Text mt={2} fontSize="sm" color="blue.600">
                          💡 For ${usdGoal} goal: deposit ~{(() => {
                            const ethPrice = Number(currentEthPrice) / 1e8;
                            const usd = parseFloat(usdGoal);
                            if (!ethPrice || isNaN(ethPrice) || !usd || isNaN(usd)) return '';
                            const ethAmount = usd / ethPrice;
                            return isNaN(ethAmount) ? '' : ethAmount.toFixed(4);
                          })()} ETH
                        </Text>
                      ) : null}
                      {error && error.includes('amount') && (
                        <FormErrorMessage>{error}</FormErrorMessage>
                      )}
                    </FormControl>
                    {isGoalLock ? (
                      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <FormControl id="usd-goal" isInvalid={!!error && error.includes('USD goal')}>
                          <FormLabel fontSize="md" fontWeight="bold" color="gray.700">
                            Goal Amount (USD)
                            <Tooltip label="The USD value you want to reach before unlocking." hasArrow><InfoOutlineIcon ml={2} color="gray.400" /></Tooltip>
                          </FormLabel>
                          <InputGroup>
                            <ChakraInput
                              type="number"
                              value={usdGoal}
                              onChange={(e) => handleInputChange(e, setUsdGoal)}
                              placeholder="Enter goal in USD"
                              min="0"
                              step="1"
                              size="lg"
                              borderColor="gray.300"
                              _hover={{ borderColor: "blue.300" }}
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
                            />
                            <InputRightElement width="3.5rem" h="100%">
                              <Text color="gray.500" fontWeight="bold">USD</Text>
                            </InputRightElement>
                          </InputGroup>
                          <Text mt={2} fontSize="sm" color="gray.500">
                            Current ETH price: {currentEthPrice && Number(currentEthPrice) > 0 ? `$${(Number(currentEthPrice) / 1e8).toFixed(2)}` : 'Loading...'}
                          </Text>
                          {error && error.includes('USD goal') && (
                            <FormErrorMessage>{error}</FormErrorMessage>
                          )}
                        </FormControl>
                      </MotionBox>
                    ) : isPriceLock ? (
                      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <FormControl id="target-price" isInvalid={isPriceInvalid}>
                          <FormLabel fontSize="md" fontWeight="bold" color="gray.700">
                            Target Price (USD)
                            <Tooltip label="The ETH price that will unlock your vault." hasArrow><InfoOutlineIcon ml={2} color="gray.400" /></Tooltip>
                          </FormLabel>
                          <InputGroup>
                            <ChakraInput
                              type="number"
                              value={targetPrice}
                              onChange={(e) => handleInputChange(e, setTargetPrice)}
                              placeholder="Enter target price in USD"
                              min="0"
                              step="1"
                              size="lg"
                              borderColor="gray.300"
                              _hover={{ borderColor: "blue.300" }}
                              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
                            />
                            <InputRightElement width="3.5rem" h="100%">
                              <Text color="gray.500" fontWeight="bold">USD</Text>
                            </InputRightElement>
                          </InputGroup>
                          <Text mt={2} fontSize="sm" color="gray.500">
                            Current ETH price: {currentEthPrice && Number(currentEthPrice) > 0 ? `$${(Number(currentEthPrice) / 1e8).toFixed(2)}` : 'Loading...'}
                          </Text>
                          {isPriceInvalid && (
                            <FormErrorMessage>
                              Target price must be greater than the current ETH price.
                            </FormErrorMessage>
                          )}
                        </FormControl>
                      </MotionBox>
                    ) : (
                      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <FormControl id="unlock-time" isInvalid={!!error && error.includes('duration')}>
                          <FormLabel fontSize="md" fontWeight="bold" color="gray.700">
                            Unlock Time Duration
                            <Tooltip label="How long to lock your vault for." hasArrow><InfoOutlineIcon ml={2} color="gray.400" /></Tooltip>
                          </FormLabel>
                          <HStack spacing={4} align="flex-end">
                            <FormControl id="unlock-years">
                              <FormLabel fontSize="sm" color="gray.600">Years</FormLabel>
                              <NumberInput
                                value={unlockYears}
                                onChange={(valueString) => setUnlockYears(valueString)}
                                min={0}
                                size="lg"
                                borderColor="gray.300"
                                _hover={{ borderColor: "blue.300" }}
                                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
                              >
                                <NumberInputField placeholder="0" />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </FormControl>
                            <FormControl id="unlock-months">
                              <FormLabel fontSize="sm" color="gray.600">Months</FormLabel>
                              <NumberInput
                                value={unlockMonths}
                                onChange={(valueString) => setUnlockMonths(valueString)}
                                min={0}
                                max={11}
                                size="lg"
                                borderColor="gray.300"
                                _hover={{ borderColor: "blue.300" }}
                                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
                              >
                                <NumberInputField placeholder="0" />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </FormControl>
                            <FormControl id="unlock-days">
                              <FormLabel fontSize="sm" color="gray.600">Days</FormLabel>
                              <NumberInput
                                value={unlockDays}
                                onChange={(valueString) => setUnlockDays(valueString)}
                                min={0}
                                max={30}
                                size="lg"
                                borderColor="gray.300"
                                _hover={{ borderColor: "blue.300" }}
                                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
                              >
                                <NumberInputField placeholder="0" />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </FormControl>
                          </HStack>
                          {error && error.includes('duration') && (
                            <FormErrorMessage>{error}</FormErrorMessage>
                          )}
                        </FormControl>
                      </MotionBox>
                    )}
                  </>
                )}

                {/* Step 4: Review & Confirm */}
                {Number(step) === 3 && (
                  <Box p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                    <Heading as="h3" size="md" mb={4} color="purple.700">Review Vault Details</Heading>
                    <VStack align="start" spacing={3}>
                      <Text><b>Wallet:</b> {truncateAddress(selectedWallet || '')}</Text>
                      <Text><b>Lock Type:</b> {isPriceLock ? 'Price Lock' : isGoalLock ? 'Goal Lock (USD)' : 'Time Lock'}</Text>
                      <Text><b>Initial Deposit:</b> {amount} ETH</Text>
                      {isPriceLock && <Text><b>Target Price:</b> ${targetPrice}</Text>}
                      {isGoalLock && <Text><b>Goal Amount:</b> ${usdGoal}</Text>}
                      {!isPriceLock && !isGoalLock && (
                        <Text><b>Unlock Duration:</b> {formatDuration(unlockYears, unlockMonths, unlockDays)}</Text>
                      )}
                    </VStack>
                  </Box>
                )}
              </motion.div>
            </Box>

            {/* Navigation Buttons */}
            <HStack justify="space-between" mt={8}>
              <Button onClick={prevStep} isDisabled={Number(step) === 0}>Back</Button>
              {Number(step) < steps.length - 1 ? (
                <Button
                  colorScheme="purple"
                  onClick={nextStep}
                  isDisabled={
                    (Number(step) === 0 && !isWalletStepValid) ||
                    (Number(step) === 1 && !isLockTypeStepValid) ||
                    (Number(step) === 2 && (!isDetailsStepValid || isPriceInvalid))
                  }
                >
                  Next
                </Button>
              ) : (
                <MotionButton
                  mt={6}
                  colorScheme="purple"
                  size="lg"
                  onClick={onConfirmOpen}
                  isLoading={isLoading}
                  loadingText="Creating..."
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  shadow="md"
                  _hover={{ shadow: 'lg' }}
                  isDisabled={!selectedWallet || !amount || (!isPriceLock && !isGoalLock && !(parseInt(unlockYears || '0') > 0 || parseInt(unlockMonths || '0') > 0 || parseInt(unlockDays || '0') > 0)) || (isPriceLock && !targetPrice) || (isGoalLock && !usdGoal)}
                >
                  Create Vault
                </MotionButton>
              )}
            </HStack>
          </VStack>
        </Box>

        {/* Live Preview Card */}
        <Box flex="1" minW={{ base: '100%', md: '320px' }} mt={{ base: 8, md: 0 }}>
          <Box p={6} bg="gray.50" borderRadius="xl" boxShadow="md" border="1px solid" borderColor="gray.200">
            <Heading as="h4" size="md" mb={4} color="purple.700">Live Vault Preview</Heading>
            <VStack align="start" spacing={3}>
              <Text><b>Wallet:</b> {selectedWallet ? truncateAddress(selectedWallet) : <span style={{ color: '#aaa' }}>Not selected</span>}</Text>
              <Text><b>Lock Type:</b> {isPriceLock ? 'Price Lock' : isGoalLock ? 'Goal Lock (USD)' : 'Time Lock'}</Text>
              <Text><b>Initial Deposit:</b> {amount ? `${amount} ETH` : <span style={{ color: '#aaa' }}>Not set</span>}</Text>
              {isPriceLock && <Text><b>Target Price:</b> {targetPrice ? `$${targetPrice}` : <span style={{ color: '#aaa' }}>Not set</span>}</Text>}
              {isGoalLock && <Text><b>Goal Amount:</b> {usdGoal ? `$${usdGoal}` : <span style={{ color: '#aaa' }}>Not set</span>}</Text>}
              {!isPriceLock && !isGoalLock && (
                <Text><b>Unlock Duration:</b> {formatDuration(unlockYears, unlockMonths, unlockDays)}</Text>
              )}
            </VStack>
          </Box>
        </Box>
      </Stack>

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={onConfirmClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="2xl" fontWeight="bold" color="purple.700">Confirm Vault Creation</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>Please review the details of your vault before creation.</Text>
            <VStack spacing={4} p={4} bg="gray.50" borderRadius="md" align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="bold">Wallet:</Text>
                <Text isTruncated maxW="250px">{truncateAddress(selectedWallet || '')}</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="bold">Lock Type:</Text>
                <Text>{isPriceLock ? 'Price Lock' : isGoalLock ? 'Goal Lock (USD)' : 'Time Lock'}</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="bold">Initial Deposit:</Text>
                <Text>{amount} ETH</Text>
              </HStack>
              {isPriceLock && (
                <>
                  <Divider />
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Target Price:</Text>
                    <Text>${targetPrice}</Text>
                  </HStack>
                </>
              )}
              {isGoalLock && (
                <>
                  <Divider />
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Goal Amount:</Text>
                    <Text>${usdGoal}</Text>
                  </HStack>
                </>
              )}
              {!isPriceLock && !isGoalLock && (
                <>
                  <Divider />
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Unlock Duration:</Text>
                    <Text>{formatDuration(unlockYears, unlockMonths, unlockDays)}</Text>
                  </HStack>
                </>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onConfirmClose}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleCreateVault}
              isLoading={isLoading}
              loadingText="Creating..."
            >
              Confirm & Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Deposit Prompt Modal */}
      {newVaultAddress && vaultCreationData && (
        <DepositPromptModal
          isOpen={isDepositOpen}
          onClose={onDepositClose}
          vaultAddress={newVaultAddress}
          vaultType={vaultCreationData.vaultType}
          goalAmount={vaultCreationData.goalAmount}
          unlockTime={vaultCreationData.unlockTime}
          targetPrice={vaultCreationData.targetPrice}
          onDepositComplete={handleDepositComplete}
        />
      )}
    </Box>
  )
} 