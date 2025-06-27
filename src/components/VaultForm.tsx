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
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'

const MotionButton = motion.create(ChakraButton)
const MotionBox = motion.create(Box, {
  forwardMotionProps: true
})

export const VaultForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  
  const { createNewVault, deposit, currentEthPrice } = useVault()
  const [amount, setAmount] = useState<string>('')
  const [unlockHours, setUnlockHours] = useState<string>('')
  const [unlockMinutes, setUnlockMinutes] = useState<string>('')
  const [targetPrice, setTargetPrice] = useState<string>('')
  const [isPriceLock, setIsPriceLock] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

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

    if (!isPriceLock && (!unlockHours && !unlockMinutes)) {
      setError('Please enter unlock time in hours or minutes')
      return
    }

    if (isPriceLock && !targetPrice) {
      setError('Please enter target price')
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

    try {
      setIsLoading(true)
      setError(null)

      let unlockTimestamp: number
      if (!isPriceLock) {
        const totalUnlockSeconds = (parseInt(unlockHours || '0') * 3600) + (parseInt(unlockMinutes || '0') * 60)
        unlockTimestamp = Math.floor(Date.now() / 1000) + totalUnlockSeconds
      } else {
        // For price lock, set unlockTime to a very distant future to ensure it's not time-locked
        unlockTimestamp = Math.floor(Date.now() / 1000) + (100 * 365 * 24 * 60 * 60) // Approximately 100 years from now
      }

      console.log('Creating vault with params:', {
        unlockTimestamp,
        targetPrice: isPriceLock ? Math.floor(parseFloat(targetPrice) * 1e8) : 0,
        isPriceLock,
      })

      // Create the vault
      const vaultAddress = await createNewVault(
        unlockTimestamp,
        isPriceLock ? Math.floor(parseFloat(targetPrice) * 1e8) : 0
      )

      if (!vaultAddress) {
        throw new Error('Failed to create vault')
      }

      console.log('Vault created successfully, proceeding with deposit...')

      // Deposit funds
      if (amount) {
        console.log('Depositing amount:', amount, 'to vault:', vaultAddress)
        await deposit(amount, vaultAddress as `0x${string}`)
        console.log('Deposit completed successfully')
      }

      // Reset form
      setAmount('')
      setUnlockHours('')
      setUnlockMinutes('')
      setTargetPrice('')
      setIsPriceLock(false)
      setIsLoading(false)

      // Show success toast
      toast({
        title: 'Success',
        description: 'Vault created and funded successfully',
        status: 'success',
        duration: 5000,
      })
      // Redirect to My Vaults page
      navigate('/my-vaults');
      return;
    } catch (err) {
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    setter(e.target.value)
  }

  return (
    <Box
      p={8}
      bg="white"
      borderRadius="xl"
      shadow="2xl"
      maxW="xl"
      mx="auto"
      my={10}
      border="1px solid"
      borderColor="gray.200"
      sx={{
        background: 'linear-gradient(145deg, #f0f8ff, #e6f2ff)',
        boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
      }}
    >
      <VStack spacing={6} align="stretch">
        <Heading as="h2" size="xl" textAlign="center" mb={6} color="purple.700">
          Create New Vault
        </Heading>

        <FormControl id="wallet" isInvalid={!!error && error.includes('wallet')}>
          <FormLabel fontSize="md" fontWeight="bold" color="gray.700">
            Select Wallet
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

        <FormControl id="amount" isInvalid={!!error && error.includes('amount')}>
          <FormLabel fontSize="md" fontWeight="bold" color="gray.700">
            Amount (ETH)
          </FormLabel>
          <ChakraInput
            type="number"
            value={amount}
            onChange={(e) => handleInputChange(e, setAmount)}
            placeholder="Enter amount in ETH"
            min="0"
            step="0.001"
            size="lg"
            borderColor="gray.300"
            _hover={{ borderColor: "blue.300" }}
            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
          />
          {error && error.includes('amount') && (
            <FormErrorMessage>{error}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl id="lock-type">
          <FormLabel fontSize="md" fontWeight="bold" color="gray.700">
            Lock Type
          </FormLabel>
          <HStack spacing={4}>
            <MotionButton
              onClick={() => setIsPriceLock(false)}
              variant={!isPriceLock ? 'solid' : 'outline'}
              colorScheme="purple"
              size="lg"
              flex="1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Time Lock
            </MotionButton>
            <MotionButton
              onClick={() => setIsPriceLock(true)}
              variant={isPriceLock ? 'solid' : 'outline'}
              colorScheme="purple"
              size="lg"
              flex="1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Price Lock
            </MotionButton>
          </HStack>
        </FormControl>

        {!isPriceLock ? (
          <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <FormControl id="unlock-time" isInvalid={!!error && (error.includes('hours') || error.includes('minutes'))}>
              <FormLabel fontSize="md" fontWeight="bold" color="gray.700">
                Unlock Time
              </FormLabel>
              <HStack spacing={3}>
                <ChakraInput
                  type="number"
                  value={unlockHours}
                  onChange={(e) => handleInputChange(e, setUnlockHours)}
                  placeholder="Hours"
                  min="0"
                  size="lg"
                  borderColor="gray.300"
                  _hover={{ borderColor: "blue.300" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
                />
                <Text fontSize="lg" fontWeight="semibold" color="gray.600">H</Text>
                <ChakraInput
                  type="number"
                  value={unlockMinutes}
                  onChange={(e) => handleInputChange(e, setUnlockMinutes)}
                  placeholder="Minutes"
                  min="0"
                  max="59"
                  size="lg"
                  borderColor="gray.300"
                  _hover={{ borderColor: "blue.300" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
                />
                <Text fontSize="lg" fontWeight="semibold" color="gray.600">M</Text>
              </HStack>
              {(error && (error.includes('hours') || error.includes('minutes'))) && (
                <FormErrorMessage>{error}</FormErrorMessage>
              )}
            </FormControl>
          </MotionBox>
        ) : (
          <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <FormControl id="target-price" isInvalid={!!error && error.includes('price')}>
              <FormLabel fontSize="md" fontWeight="bold" color="gray.700">
                Target Price (USD)
              </FormLabel>
              <HStack>
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
                <Text fontSize="lg" fontWeight="semibold" color="gray.600">USD</Text>
              </HStack>
              <Text mt={2} fontSize="sm" color="gray.500">
                Current ETH price: ${currentEthPrice ? (Number(currentEthPrice) / 1e8).toFixed(2) : 'Loading...'}
              </Text>
              {error && error.includes('price') && (
                <FormErrorMessage>{error}</FormErrorMessage>
              )}
            </FormControl>
          </MotionBox>
        )}

        <MotionButton
          mt={6}
          colorScheme="purple"
          size="lg"
          onClick={handleCreateVault}
          isLoading={isLoading}
          loadingText="Creating..."
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          shadow="md"
          _hover={{ shadow: 'lg' }}
          isDisabled={!selectedWallet || !amount || (!isPriceLock && !unlockHours && !unlockMinutes) || (isPriceLock && !targetPrice)}
        >
          Create Vault
        </MotionButton>
      </VStack>
    </Box>
  )
} 