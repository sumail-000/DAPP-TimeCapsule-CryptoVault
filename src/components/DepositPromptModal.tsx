import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Heading,
  Icon,
  Badge,
  useToast,
  Tooltip,
  Progress,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import {
  FaCoins,
  FaLightbulb,
  FaRocket,
  FaShieldAlt,
  FaChartLine,
  FaWallet,
  FaArrowRight,
} from 'react-icons/fa';
import { useVault } from '../hooks/useVault';
import { useVaultCustomization } from '../hooks/useVaultCustomization';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface DepositPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultAddress: string;
  vaultName?: string;
  vaultType: 'time' | 'price' | 'goal';
  goalAmount?: string;
  unlockTime?: string;
  targetPrice?: string;
  onDepositComplete?: () => void;
}

export const DepositPromptModal: React.FC<DepositPromptModalProps> = ({
  isOpen,
  onClose,
  vaultAddress,
  vaultName,
  vaultType,
  goalAmount,
  unlockTime,
  targetPrice,
  onDepositComplete
}) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [step, setStep] = useState(1); // 1: prompt, 2: amount, 3: confirmation
  const { deposit } = useVault();
  const { getVaultCustomization } = useVaultCustomization();
  const toast = useToast();

  const customization = getVaultCustomization(vaultAddress);
  const displayName = customization?.name || vaultName || 'Your New Vault';

  const getVaultTypeInfo = () => {
    switch (vaultType) {
      case 'time':
        return {
          icon: FaShieldAlt,
          color: 'blue.400',
          title: 'Time-Locked Vault',
          description: `Funds will be locked until ${unlockTime}`,
          benefit: 'Perfect for building discipline and long-term savings goals'
        };
      case 'price':
        return {
          icon: FaChartLine,
          color: 'purple.400',
          title: 'Price-Locked Vault',
          description: `Unlocks when ETH reaches $${targetPrice}`,
          benefit: 'Ideal for capitalizing on market opportunities'
        };
      case 'goal':
        return {
          icon: FaRocket,
          color: 'green.400',
          title: 'Goal-Based Vault',
          description: `Target: ${goalAmount} ETH`,
          benefit: 'Great for achieving specific savings milestones'
        };
      default:
        return {
          icon: FaCoins,
          color: 'yellow.400',
          title: 'Crypto Vault',
          description: 'Secure your digital assets',
          benefit: 'Safe and smart crypto storage'
        };
    }
  };

  const vaultInfo = getVaultTypeInfo();

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid deposit amount',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsDepositing(true);
    try {
      await deposit(depositAmount, vaultAddress as `0x${string}`);
      
      toast({
        title: 'Deposit Successful! 🎉',
        description: `${depositAmount} ETH deposited to ${displayName}`,
        status: 'success',
        duration: 5000,
      });

      setStep(3);
      setTimeout(() => {
        onDepositComplete?.();
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Deposit failed:', error);
      toast({
        title: 'Deposit Failed',
        description: 'Please try again or check your wallet balance',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleSkip = () => {
    toast({
      title: 'Vault Created Successfully',
      description: 'You can add funds to your vault anytime from the vault details',
      status: 'info',
      duration: 4000,
    });
    onClose();
  };

  const getSuggestedAmounts = () => {
    if (vaultType === 'goal' && goalAmount) {
      const goal = parseFloat(goalAmount);
      return [
        { label: '10%', value: (goal * 0.1).toFixed(4), description: 'Start small' },
        { label: '25%', value: (goal * 0.25).toFixed(4), description: 'Good start' },
        { label: '50%', value: (goal * 0.5).toFixed(4), description: 'Strong start' },
      ];
    }
    return [
      { label: 'Starter', value: '0.01', description: 'Perfect for testing' },
      { label: 'Standard', value: '0.1', description: 'Good for most goals' },
      { label: 'Premium', value: '0.5', description: 'Serious commitment' },
    ];
  };

  if (step === 3) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false} size="md">
        <ModalOverlay />
        <ModalContent bg="rgba(35, 37, 38, 0.95)" color="white" borderColor="#414345" borderWidth="1px">
          <ModalBody py={8}>
            <VStack spacing={6} textAlign="center">
              <MotionBox
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Icon as={FaRocket} fontSize="4xl" color="green.400" />
              </MotionBox>
              
              <VStack spacing={2}>
                <Heading size="lg" color="green.400">Success! 🎉</Heading>
                <Text color="gray.300">
                  Your vault is now active and earning interest!
                </Text>
              </VStack>

              <Alert status="success" bg="rgba(56, 161, 105, 0.1)" borderColor="green.400">
                <AlertIcon />
                <Box>
                  <AlertTitle>Vault Activated!</AlertTitle>
                  <AlertDescription>
                    {depositAmount} ETH has been securely deposited to {displayName}
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent bg="rgba(35, 37, 38, 0.95)" color="white" borderColor="#414345" borderWidth="1px">
        <ModalHeader>
          <HStack>
            <Icon as={vaultInfo.icon} color={vaultInfo.color} />
            <Text>Fund Your Vault</Text>
            <Badge colorScheme="purple">Step {step}/2</Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {step === 1 && (
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <VStack spacing={6} align="stretch">
                  {/* Vault Info */}
                  <Box
                    p={4}
                    bg="rgba(127, 90, 240, 0.1)"
                    borderRadius="lg"
                    borderLeft="4px solid"
                    borderColor={vaultInfo.color}
                  >
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <Icon as={vaultInfo.icon} color={vaultInfo.color} />
                        <Text fontWeight="bold" fontSize="lg">
                          {customization?.emoji} {displayName}
                        </Text>
                      </HStack>
                      <Text color="gray.300" fontSize="sm">
                        {vaultInfo.description}
                      </Text>
                      <Text color={vaultInfo.color} fontSize="sm" fontStyle="italic">
                        💡 {vaultInfo.benefit}
                      </Text>
                    </VStack>
                  </Box>

                  {/* Welcome Message */}
                  <Alert status="info" bg="rgba(66, 153, 225, 0.1)" borderColor="blue.400">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Vault Created Successfully! 🎉</AlertTitle>
                      <AlertDescription>
                        Your vault is ready, but it needs an initial deposit to become active. 
                        Even a small amount gets you started on your savings journey!
                      </AlertDescription>
                    </Box>
                  </Alert>

                  {/* Benefits */}
                  <Box>
                    <Text fontWeight="bold" mb={3} color="gray.200">
                      Why deposit now? ✨
                    </Text>
                    <VStack spacing={3} align="start">
                      <HStack>
                        <Icon as={FaShieldAlt} color="green.400" />
                        <Text fontSize="sm">Immediate security - funds are locked and protected</Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaChartLine} color="blue.400" />
                        <Text fontSize="sm">Start building your savings habit right away</Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaLightbulb} color="yellow.400" />
                        <Text fontSize="sm">Track your progress and stay motivated</Text>
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>
              </MotionBox>
            )}

            {step === 2 && (
              <MotionBox
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <VStack spacing={6} align="stretch">
                  <FormControl>
                    <FormLabel>Initial Deposit Amount</FormLabel>
                    <InputGroup>
                      <Input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.0000"
                        bg="rgba(0,0,0,0.3)"
                        borderColor="#414345"
                        _focus={{ borderColor: vaultInfo.color }}
                        fontSize="lg"
                      />
                      <InputRightElement>
                        <Text color="gray.400" fontSize="sm" pr={3}>ETH</Text>
                      </InputRightElement>
                    </InputGroup>
                    <FormHelperText>
                      You can always add more funds later from the vault details page
                    </FormHelperText>
                  </FormControl>

                  {/* Quick Amount Suggestions */}
                  <Box>
                    <Text fontWeight="bold" mb={3} color="gray.200">
                      Suggested amounts:
                    </Text>
                    <HStack spacing={3}>
                      {getSuggestedAmounts().map((suggestion, index) => (
                        <Tooltip key={index} label={suggestion.description} hasArrow>
                          <Button
                            size="sm"
                            variant="outline"
                            borderColor={vaultInfo.color}
                            color={vaultInfo.color}
                            _hover={{ bg: `${vaultInfo.color}20` }}
                            onClick={() => setDepositAmount(suggestion.value)}
                          >
                            <VStack spacing={0}>
                              <Text fontSize="xs">{suggestion.label}</Text>
                              <Text fontSize="xs" fontWeight="bold">{suggestion.value} ETH</Text>
                            </VStack>
                          </Button>
                        </Tooltip>
                      ))}
                    </HStack>
                  </Box>

                  {/* Progress Visualization for Goal Vaults */}
                  {vaultType === 'goal' && goalAmount && depositAmount && (
                    <Box>
                      <Text fontWeight="bold" mb={2} color="gray.200">
                        Progress Preview:
                      </Text>
                      <Box p={3} bg="rgba(0,0,0,0.2)" borderRadius="md">
                        <Progress 
                          value={(parseFloat(depositAmount) / parseFloat(goalAmount)) * 100}
                          colorScheme="green"
                          borderRadius="full"
                          mb={2}
                        />
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.400">
                            {depositAmount} ETH
                          </Text>
                          <Text fontSize="sm" color="gray.400">
                            {goalAmount} ETH (goal)
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color="green.400" textAlign="center" mt={1}>
                          {((parseFloat(depositAmount) / parseFloat(goalAmount)) * 100).toFixed(1)}% complete
                        </Text>
                      </Box>
                    </Box>
                  )}
                </VStack>
              </MotionBox>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3} width="100%">
            {step === 1 ? (
              <>
                <Button 
                  variant="ghost" 
                  onClick={handleSkip}
                  flex="1"
                >
                  Skip for now
                </Button>
                <Button 
                  bg={vaultInfo.color}
                  color="white"
                  _hover={{ opacity: 0.8 }}
                  onClick={() => setStep(2)}
                  rightIcon={<FaArrowRight />}
                  flex="1"
                >
                  Add Funds
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(1)}
                  isDisabled={isDepositing}
                >
                  Back
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleSkip}
                  isDisabled={isDepositing}
                >
                  Skip
                </Button>
                <Button 
                  bg={vaultInfo.color}
                  color="white"
                  _hover={{ opacity: 0.8 }}
                  onClick={handleDeposit}
                  isLoading={isDepositing}
                  loadingText="Depositing..."
                  isDisabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  leftIcon={<FaWallet />}
                >
                  Deposit {depositAmount} ETH
                </Button>
              </>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DepositPromptModal; 