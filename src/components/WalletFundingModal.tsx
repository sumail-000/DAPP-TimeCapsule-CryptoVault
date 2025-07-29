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
  Alert,
  AlertIcon,
  AlertDescription,
  Box,
  Heading,
  Icon,
  useColorModeValue,
  Badge,
  Card,
  CardBody,
  Tooltip,
  useClipboard,
  IconButton,
} from '@chakra-ui/react';
import {
  FaCoins,
  FaWallet,
  FaArrowRight,
  FaCopy,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaInfoCircle,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MotionBox = motion.create(Box);

interface WalletFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onCreateVault: () => void;
}

export const WalletFundingModal: React.FC<WalletFundingModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  onCreateVault
}) => {
  const navigate = useNavigate();
  const { hasCopied, onCopy } = useClipboard(walletAddress);
  const [step, setStep] = useState(1); // 1: welcome, 2: funding instructions, 3: ready
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.300');

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  const handleContinueToVault = () => {
    onClose();
    onCreateVault();
  };

  const handleSkipForNow = () => {
    onClose();
    navigate('/wallet');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <VStack spacing={6} align="stretch">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              textAlign="center"
            >
              <Icon as={FaCheckCircle} boxSize={16} color="green.500" mb={4} />
              <Heading size="lg" color={textColor} mb={2}>
                🎉 Wallet Created Successfully!
              </Heading>
              <Text color={mutedTextColor} fontSize="lg">
                Your new crypto wallet is ready to use
              </Text>
            </MotionBox>

            <Alert status="info" borderRadius="lg" variant="left-accent">
              <AlertIcon />
              <AlertDescription>
                <Text fontWeight="bold" mb={1}>What's Next?</Text>
                <Text fontSize="sm">
                  To start creating secure vaults, you'll need to fund your wallet with some ETH. 
                  This will cover transaction fees and allow you to deposit funds into vaults.
                </Text>
              </AlertDescription>
            </Alert>

            <Card bg={cardBg} borderColor={borderColor} borderRadius="lg">
              <CardBody p={4}>
                <VStack spacing={3}>
                  <HStack justify="space-between" w="full">
                    <Text fontSize="sm" color={mutedTextColor}>Wallet Address:</Text>
                    <Badge colorScheme="purple" variant="subtle">Sepolia Testnet</Badge>
                  </HStack>
                  <HStack spacing={2} w="full">
                    <Text 
                      fontSize="sm" 
                      fontFamily="mono" 
                      color={textColor}
                      bg="rgba(127, 90, 240, 0.15)"
                      p={2}
                      borderRadius="md"
                      flex={1}
                      textAlign="center"
                    >
                      {truncateAddress(walletAddress)}
                    </Text>
                    <Tooltip label={hasCopied ? "Copied!" : "Copy address"} hasArrow>
                      <IconButton
                        aria-label="Copy address"
                        icon={<FaCopy />}
                        size="sm"
                        onClick={onCopy}
                        colorScheme={hasCopied ? "green" : "gray"}
                        variant="outline"
                      />
                    </Tooltip>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        );

      case 2:
        return (
          <VStack spacing={6} align="stretch">
            <MotionBox
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              textAlign="center"
            >
              <Icon as={FaCoins} boxSize={12} color="blue.500" mb={4} />
              <Heading size="md" color={textColor} mb={2}>
                Fund Your Wallet
              </Heading>
              <Text color={mutedTextColor}>
                Get testnet ETH to start using your wallet
              </Text>
            </MotionBox>

            <Alert status="warning" borderRadius="lg" variant="left-accent">
              <AlertIcon />
              <AlertDescription>
                <Text fontWeight="bold" mb={1}>⚠️ Testnet Only</Text>
                <Text fontSize="sm">
                  This is a testnet application. Use only test ETH from faucets - never send real ETH!
                </Text>
              </AlertDescription>
            </Alert>

            <VStack spacing={4}>
              <Text fontWeight="bold" color={textColor}>Follow these steps:</Text>
              
              <Box w="full" p={4} bg="blue.50" borderRadius="lg" border="1px" borderColor="blue.200">
                <VStack spacing={3} align="start">
                  <HStack>
                    <Badge colorScheme="blue" variant="solid">1</Badge>
                    <Text fontSize="sm" fontWeight="bold">Copy your wallet address</Text>
                  </HStack>
                  <HStack spacing={2} w="full">
                    <Text 
                      fontSize="xs" 
                      fontFamily="mono" 
                      bg="white"
                      p={2}
                      borderRadius="md"
                      flex={1}
                    >
                      {walletAddress}
                    </Text>
                    <IconButton
                      aria-label="Copy address"
                      icon={<FaCopy />}
                      size="xs"
                      onClick={onCopy}
                      colorScheme="blue"
                      variant="outline"
                    />
                  </HStack>
                </VStack>
              </Box>

              <Box w="full" p={4} bg="green.50" borderRadius="lg" border="1px" borderColor="green.200">
                <VStack spacing={3} align="start">
                  <HStack>
                    <Badge colorScheme="green" variant="solid">2</Badge>
                    <Text fontSize="sm" fontWeight="bold">Get test ETH from faucet</Text>
                  </HStack>
                  <Button
                    leftIcon={<FaExternalLinkAlt />}
                    colorScheme="green"
                    size="sm"
                    onClick={() => {
                      onCopy(); // Copy address first
                      window.open('https://sepoliafaucet.com/', '_blank');
                    }}
                  >
                    Open Sepolia Faucet
                  </Button>
                  <Text fontSize="xs" color="green.700">
                    Paste your address and request test ETH (usually takes 1-2 minutes)
                  </Text>
                </VStack>
              </Box>

              <Box w="full" p={4} bg="purple.50" borderRadius="lg" border="1px" borderColor="purple.200">
                <VStack spacing={3} align="start">
                  <HStack>
                    <Badge colorScheme="purple" variant="solid">3</Badge>
                    <Text fontSize="sm" fontWeight="bold">Create your first vault</Text>
                  </HStack>
                  <Text fontSize="xs" color="purple.700">
                    Once funded, you can create secure time-locked crypto vaults
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={false}>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent bg={cardBg} borderRadius="xl" boxShadow="2xl">
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={FaWallet} color="purple.500" boxSize={6} />
            <Text color={textColor}>
              {step === 1 ? 'Wallet Ready' : 'Fund Your Wallet'}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color={textColor} />
        
        <ModalBody pb={6}>
          {renderStep()}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3} w="full">
            {step === 1 && (
              <>
                <Button 
                  variant="ghost" 
                  onClick={handleSkipForNow}
                  color={textColor}
                >
                  Skip for Now
                </Button>
                <Button 
                  colorScheme="blue" 
                  onClick={() => setStep(2)}
                  leftIcon={<FaCoins />}
                  flex={1}
                >
                  Fund Wallet
                </Button>
              </>
            )}
            
            {step === 2 && (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(1)}
                  color={textColor}
                >
                  Back
                </Button>
                <Button 
                  colorScheme="purple" 
                  onClick={handleContinueToVault}
                  leftIcon={<FaArrowRight />}
                  flex={1}
                >
                  Continue to Create Vault
                </Button>
              </>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 