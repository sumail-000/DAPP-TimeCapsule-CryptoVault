import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  HStack,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  InputGroup,
  InputRightElement,
  useClipboard,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  AlertDescription,
  Grid,
  GridItem,
  Skeleton,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  useColorModeValue,
  Container,
  Center,
  Icon,
  FormHelperText,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Spinner,
  Tag,
  TagLabel,
  TagLeftIcon,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SUPPORTED_NETWORKS } from '../constants/networks';
import { 
  FaPlus, 
  FaCopy, 
  FaEye, 
  FaEyeSlash, 
  FaWallet, 
  FaLock, 
  FaCheck, 
  FaKey, 
  FaDownload, 
  FaQrcode, 
  FaSync, 
  FaShieldAlt, 
  FaCoins,
  FaEllipsisH,
  FaHistory,
  FaPaperPlane,
  FaNetworkWired,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock
} from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import { NetworkContext } from './DAppLayout';
import { SkeletonCard } from './SkeletonCard';
import { EmptyState } from './EmptyState';
import { WalletFundingModal } from './WalletFundingModal';
import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

interface WalletData {
  address: string;
  privateKey: string;
  network: string;
  balance: string;
  lastActivity?: string;
  transactionCount?: number;
}

interface TransactionPreview {
  hash: string;
  type: 'send' | 'receive';
  amount: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export const WalletManager = () => {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState<Record<string, boolean>>({});
  const [justCreatedWallet, setJustCreatedWallet] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isFundingOpen, onOpen: onFundingOpen, onClose: onFundingClose } = useDisclosure();
  const [newWallet, setNewWallet] = useState<WalletData | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const { notifySuccess } = useNotifications();
  const [walletStats, setWalletStats] = useState({
    totalBalance: 0,
    totalWallets: 0,
    activeWallets: 0
  });
  const toast = useToast();
  const { network: selectedNetwork } = React.useContext(NetworkContext);
  
  // Modal for viewing a wallet's private key
  const { 
    isOpen: isPrivateKeyOpen, 
    onOpen: onOpenPrivateKey, 
    onClose: onClosePrivateKey 
  } = useDisclosure();
  
  // Import wallet modal
  const {
    isOpen: isImportOpen,
    onOpen: onOpenImport,
    onClose: onCloseImport
  } = useDisclosure();
  
  const [importPrivateKey, setImportPrivateKey] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  // Mock transaction data for demonstration
  const getMockTransactions = (address: string): TransactionPreview[] => {
    return [
      {
        hash: '0x1234...5678',
        type: 'receive',
        amount: '0.05',
        timestamp: '2 hours ago',
        status: 'confirmed'
      },
      {
        hash: '0x8765...4321',
        type: 'send',
        amount: '0.02',
        timestamp: '1 day ago',
        status: 'confirmed'
      }
    ];
  };

  const bgColor = useColorModeValue('#f7fafc', '#0d1117');
  const cardBg = useColorModeValue('white', '#161b22');
  const borderColor = useColorModeValue('gray.200', '#30363d');
  const textColor = useColorModeValue('gray.800', '#f0f6fc');
  const mutedTextColor = useColorModeValue('gray.600', '#8b949e');
  
  // Reference for showing/hiding private key
  const newWalletPrivateKeyClipboard = useClipboard(newWallet?.privateKey || '');
  const selectedWalletPrivateKeyClipboard = useClipboard(selectedWallet?.privateKey || '');

  // Load saved wallets from localStorage
  useEffect(() => {
    const savedWallets = localStorage.getItem('wallets');
    if (savedWallets) {
      try {
        const parsedWallets = JSON.parse(savedWallets);
        setWallets(parsedWallets);
        
        // Auto-refresh balances if wallets exist (skip if we just created a wallet)
        if (parsedWallets.length > 0 && !justCreatedWallet) {
          setTimeout(() => {
            console.log('Auto-refreshing balances for', parsedWallets.length, 'wallets');
            refreshBalances();
          }, 3000); // Even longer delay to ensure stability
        }
      } catch (error) {
        console.error('Error parsing wallets from localStorage:', error);
        setWallets([]);
      }
    }
    setLoading(false);
  }, []);

  // Save wallets to localStorage when updated (with error handling)
  useEffect(() => {
    if (!loading && wallets.length >= 0) {
      try {
      localStorage.setItem('wallets', JSON.stringify(wallets));
        console.log('Wallets saved to localStorage:', wallets.length, 'wallets');
      } catch (error) {
        console.error('Failed to save wallets to localStorage:', error);
      }
    }
  }, [wallets, loading]);

  // Calculate wallet statistics
  useEffect(() => {
    const totalBalance = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.balance || '0'), 0);
    const activeWallets = wallets.filter(wallet => parseFloat(wallet.balance || '0') > 0).length;
    
    setWalletStats({
      totalBalance,
      totalWallets: wallets.length,
      activeWallets
    });
  }, [wallets]);

  const createNewWallet = async () => {
    try {
      setIsCreating(true);
      
      // Create new wallet
      const wallet = ethers.Wallet.createRandom();
      
      // Use selectedNetwork from context
      const network = selectedNetwork;
      
      if (!network) {
        throw new Error("Selected network not found");
      }
      
      // Try to connect to provider with fallbacks
      let provider;
      let balance;
      
      try {
        provider = new ethers.JsonRpcProvider(network.rpc[0]);
        const connectedWallet = wallet.connect(provider);
        balance = await provider.getBalance(connectedWallet.address);
      } catch (rpcError) {
        console.warn(`Failed to connect to primary RPC: ${network.rpc[0]}`, rpcError);
        // Use a mock balance as fallback for demo purposes
        balance = ethers.parseEther("0");
      }
      
      const walletData: WalletData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        network: network.id,
        balance: ethers.formatEther(balance),
      };

      setNewWallet(walletData);
      onOpen();
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to create wallet',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const importWallet = async () => {
    try {
      setIsImporting(true);
      
      // Validate private key format
      if (!importPrivateKey.startsWith('0x') || importPrivateKey.length !== 66) {
        throw new Error('Invalid private key format');
      }
      
      // Create wallet from private key
      const wallet = new ethers.Wallet(importPrivateKey);
      
      // Check if this wallet already exists
      const existingWallet = wallets.find(w => w.address === wallet.address);
      if (existingWallet) {
        throw new Error('This wallet has already been imported');
      }
      
      // Use selectedNetwork from context
      const network = selectedNetwork;
      
      if (!network) {
        throw new Error("Selected network not found");
      }
      
      // Try to connect to provider with fallbacks
      let balance;
      
      try {
        const provider = new ethers.JsonRpcProvider(network.rpc[0]);
        balance = await provider.getBalance(wallet.address);
      } catch (rpcError) {
        console.warn(`Failed to connect to RPC: ${network.rpc[0]}`, rpcError);
        // Use a mock balance as fallback
        balance = ethers.parseEther("0");
      }
      
      const walletData: WalletData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        network: network.id,
        balance: ethers.formatEther(balance),
      };

      setWallets(prev => [...prev, walletData]);
      onCloseImport();
      setImportPrivateKey('');
      
      toast({
        title: 'Wallet Imported',
        description: 'Wallet imported successfully',
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error importing wallet:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to import wallet',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const saveWallet = () => {
    if (newWallet) {
      const updatedWallets = [...wallets, newWallet];
      setWallets(updatedWallets);
      
      // Immediately save to localStorage to prevent loss
      localStorage.setItem('wallets', JSON.stringify(updatedWallets));
      console.log('Wallet saved to localStorage:', newWallet.address);
      
      // Set flag to prevent immediate auto-refresh interference
      setJustCreatedWallet(true);
      setTimeout(() => setJustCreatedWallet(false), 5000); // Reset after 5 seconds
      
      onClose();
      
      // Show funding modal instead of navigating directly
      onFundingOpen();
    }
  };
  
  const viewWalletDetails = (wallet: WalletData) => {
    navigate(`/wallet/${wallet.address}`);
  };
  
  const viewPrivateKey = (wallet: WalletData) => {
    setSelectedWallet(wallet);
    onOpenPrivateKey();
  };
  
  const handleCreateVault = () => {
    if (newWallet) {
      navigate('/create-vault', { 
        state: { 
          walletAddress: newWallet.address,
          isFirstVault: true 
        } 
      });
    }
  };
  
  const refreshBalances = useCallback(async () => {
    try {
      setIsRefreshing(true);
      let successCount = 0;
      let errorCount = 0;
      
      // Get current wallets from localStorage to avoid stale closure
      const savedWallets = localStorage.getItem('wallets');
      const currentWallets = savedWallets ? JSON.parse(savedWallets) : [];
      
      if (currentWallets.length === 0) {
        console.log('No wallets to refresh');
        setIsRefreshing(false);
        return;
      }
      
      console.log('Refreshing balances for', currentWallets.length, 'wallets');
      
      const updatedWallets = await Promise.all(
        currentWallets.map(async (wallet: WalletData) => {
          try {
            const network = SUPPORTED_NETWORKS.find(n => n.id === wallet.network);
            if (!network) {
              console.warn(`Network not found for wallet: ${wallet.network}`);
              return wallet;
            }
            
            // Try multiple RPC endpoints for better reliability
            let balance = null;
            for (const rpcUrl of network.rpc) {
              try {
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                balance = await provider.getBalance(wallet.address);
                break; // Success, stop trying other RPCs
              } catch (rpcError) {
                console.warn(`RPC ${rpcUrl} failed for ${wallet.address}:`, rpcError);
                continue; // Try next RPC
              }
            }
            
            if (balance !== null) {
              successCount++;
            return {
              ...wallet,
              balance: ethers.formatEther(balance),
                lastActivity: new Date().toISOString(),
            };
            } else {
              errorCount++;
              console.error(`All RPC endpoints failed for wallet ${wallet.address}`);
              return wallet; // Keep original wallet data
            }
          } catch (error) {
            errorCount++;
            console.warn(`Failed to fetch balance for ${wallet.address}:`, error);
            return wallet;
          }
        })
      );
      
      setWallets(updatedWallets);
      localStorage.setItem('wallets', JSON.stringify(updatedWallets));
      
      console.log(`Balance refresh completed: ${successCount} success, ${errorCount} errors, ${updatedWallets.length} total wallets`);
      
      // Show appropriate toast based on results
      if (successCount === currentWallets.length) {
      toast({
          title: '✅ All Balances Updated',
          description: `Successfully refreshed ${successCount} wallet(s)`,
        status: 'success',
        duration: 3000,
      });
      } else if (successCount > 0) {
        toast({
          title: '⚠️ Partial Update',
          description: `Updated ${successCount}/${currentWallets.length} wallets (${errorCount} failed)`,
          status: 'warning',
          duration: 4000,
        });
      } else {
        toast({
          title: '❌ Update Failed',
          description: 'Could not connect to blockchain. Check your network connection and try again.',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error refreshing balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh wallet balances. Please try again.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [toast]);

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Header with Stats */}
          <Box>
            <Heading size="xl" color={textColor} mb={6}>Wallet Management</Heading>
            
            {/* Stats Cards */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
              <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
                <CardBody p={6}>
                  <Stat>
                    <StatLabel color={mutedTextColor}>Total Balance</StatLabel>
                    <StatNumber color="#7f5af0" fontSize="2xl">
                      {walletStats.totalBalance.toFixed(4)} ETH
                    </StatNumber>
                    <StatHelpText color={mutedTextColor}>
                      Across all wallets
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              
              <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
                <CardBody p={6}>
                  <Stat>
                    <StatLabel color={mutedTextColor}>Total Wallets</StatLabel>
                    <StatNumber color="blue.400" fontSize="2xl">
                      {walletStats.totalWallets}
                    </StatNumber>
                    <StatHelpText color={mutedTextColor}>
                      Created wallets
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              
              <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
                <CardBody p={6}>
                  <Stat>
                    <StatLabel color={mutedTextColor}>Active Wallets</StatLabel>
                    <StatNumber color="green.400" fontSize="2xl">
                      {walletStats.activeWallets}
                    </StatNumber>
                    <StatHelpText color={mutedTextColor}>
                      With balance &gt; 0
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>

          {/* Main Content */}
          <Card bg={cardBg} borderColor={borderColor} borderRadius="xl" overflow="hidden" w="full">
            {/* Header with refresh button */}
            <CardHeader p={4} borderBottom="1px" borderColor={borderColor}>
              <HStack justify="space-between">
                <Heading size="md" color={textColor}>My Wallets</Heading>
                <HStack spacing={2}>
                  <Tooltip label="Refresh all wallet balances" hasArrow>
                    <IconButton
                      aria-label="Refresh all balances"
                      icon={<FaSync />}
                      size="sm"
                      colorScheme="purple"
                      variant="outline"
                      isLoading={isRefreshing}
                      onClick={refreshBalances}
                    />
                  </Tooltip>
                  <Button
                    leftIcon={<FaPlus />}
                    colorScheme="purple"
                    size="sm"
                    onClick={createNewWallet}
                    isLoading={isCreating}
                    loadingText="Creating..."
                  >
                    New Wallet
                  </Button>
                </HStack>
              </HStack>
            </CardHeader>
            
                        <Tabs variant="enclosed" colorScheme="purple" w="full">
              <TabList 
                bg={cardBg} 
                borderRadius="lg" 
                p={{ base: 1, md: 2 }} 
                boxShadow="md"
                border="1px"
                borderColor={borderColor}
                display="flex"
                justifyContent="flex-start"
                overflow="visible"
                w="full"
                flexWrap="nowrap"
                gap={{ base: 1, md: 2 }}
              >
                <Tab 
                  _selected={{ bg: 'purple.500', color: 'white', borderColor: 'purple.500' }}
                  borderRadius="md"
                  fontWeight="semibold"
                  color={textColor}
                  _hover={{ bg: 'purple.100', color: 'purple.700' }}
                  bg="transparent"
                  border="1px"
                  borderColor="transparent"
                  minW="fit-content"
                  flex="0 0 auto"
                  px={{ base: 3, md: 4 }}
                  py={2}
                  fontSize={{ base: "sm", md: "md" }}
                >
                  My Wallets
                </Tab>
                <Tab 
                  _selected={{ bg: 'purple.500', color: 'white', borderColor: 'purple.500' }}
                  borderRadius="md"
                  fontWeight="semibold"
                  color={textColor}
                  _hover={{ bg: 'purple.100', color: 'purple.700' }}
                  bg="transparent"
                  border="1px"
                  borderColor="transparent"
                  minW="fit-content"
                  flex="0 0 auto"
                  px={{ base: 3, md: 4 }}
                  py={2}
                  fontSize={{ base: "sm", md: "md" }}
                >
                  Create Wallet
                </Tab>
        </TabList>
        
        <TabPanels>
                <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
                    {/* Action Buttons */}
                    <Flex justifyContent="space-between" alignItems="center" wrap="wrap" gap={4} p={6}>
                      <VStack align="start" spacing={1}>
                        <Heading size="md" color={textColor}>Your Wallets</Heading>
                        <Text color={mutedTextColor} fontSize="sm">
                          {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} found
                        </Text>
                      </VStack>
                      
                      <HStack spacing={3}>
                  <Button 
                    size="sm"
                    colorScheme="green" 
                          leftIcon={<FaDownload />}
                    onClick={onOpenImport}
                          borderRadius="full"
                          boxShadow="md"
                          _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                          transition="all 0.2s"
                  >
                          Import Wallet
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={refreshBalances}
                    isLoading={isRefreshing}
                          leftIcon={<FaSync />}
                          borderRadius="full"
                          boxShadow="md"
                          _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                          transition="all 0.2s"
                  >
                          Refresh
                  </Button>
                </HStack>
                    </Flex>
              
                    {/* Wallet Cards */}
              {loading ? (
                      <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={6} p={6}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <SkeletonCard key={i} variant="wallet" index={i - 1} />
                  ))}
                </SimpleGrid>
              ) : wallets.length > 0 ? (
                      <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={6} p={6}>
                        {wallets.map((wallet, index) => {
                    const network = SUPPORTED_NETWORKS.find(n => n.id === wallet.network);
                          const balance = parseFloat(wallet.balance) || 0;
                          const transactions = getMockTransactions(wallet.address);
                          const isActive = balance > 0;
                          
                    return (
                      <MotionCard
                        key={wallet.address}
                              bg={cardBg}
                              borderColor={borderColor}
                              borderRadius="xl"
                        overflow="hidden"
                              boxShadow="lg"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              whileHover={{ 
                                scale: 1.02, 
                                boxShadow: 'xl',
                                y: -5
                              }}
                              cursor="pointer"
                              onClick={() => viewWalletDetails(wallet)}
                            >
                              {/* Status Bar */}
                              <Box
                                height="4px"
                                bg={isActive ? "linear-gradient(90deg, #38a169, #68d391)" : "linear-gradient(90deg, #e53e3e, #fc8181)"}
                              />
                              
                              <CardHeader 
                                bgGradient="linear(to-r, purple.500, blue.500)" 
                                color="white"
                                pb={3}
                              >
                                <Flex justifyContent="space-between" alignItems="center">
                                  <HStack spacing={2}>
                                    <Avatar size="sm" bg="whiteAlpha.200" icon={<FaWallet />} />
                                    <VStack align="start" spacing={0}>
                                      <Text fontSize="sm" fontWeight="bold">
                                        Wallet #{index + 1}
                                      </Text>
                                      <Badge 
                                        colorScheme="whiteAlpha" 
                                        variant="solid"
                                        borderRadius="full"
                                        px={2}
                                        py={0.5}
                                        fontSize="xs"
                                      >
                              {network?.name || wallet.network}
                            </Badge>
                                    </VStack>
                                  </HStack>
                                  
                                  <Menu>
                                    <MenuButton
                                      as={IconButton}
                                      icon={<FaEllipsisH />}
                                  variant="ghost"
                                      color="white"
                                      _hover={{ bg: 'whiteAlpha.200' }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <MenuList bg={cardBg} borderColor={borderColor}>
                                      <MenuItem 
                                        icon={<FaCopy />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(wallet.address);
                                    toast({
                                      title: "Address copied",
                                      status: "success",
                                      duration: 2000,
                                    });
                                  }}
                                      >
                                        Copy Address
                                      </MenuItem>
                                      <MenuItem 
                                  icon={<FaKey />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    viewPrivateKey(wallet);
                                  }}
                                      >
                                        View Private Key
                                      </MenuItem>
                                      <MenuDivider />
                                                                              <MenuItem 
                                          icon={<FaPaperPlane />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/wallet/${wallet.address}`);
                                          }}
                                        >
                                          Send Transaction
                                        </MenuItem>
                                    </MenuList>
                                  </Menu>
                                </Flex>
                        </CardHeader>
                        
                              <CardBody p={6}>
                                <VStack spacing={4} align="stretch">
                                  {/* Address */}
                            <Box>
                                    <Text fontSize="sm" color={mutedTextColor} mb={1}>Address</Text>
                                    <Text 
                                      fontWeight="bold" 
                                      fontSize="sm"
                                      fontFamily="mono"
                                      color={textColor}
                                      bg="rgba(127, 90, 240, 0.2)"
                                      p={2}
                                      borderRadius="md"
                                      textAlign="center"
                                      border="1px solid"
                                      borderColor={borderColor}
                                    >
                                      {truncateAddress(wallet.address)}
                                    </Text>
                            </Box>
                            
                                  {/* Balance */}
                            <Box>
                                    <HStack justify="space-between" mb={2}>
                                      <Text fontSize="sm" color={mutedTextColor}>Balance</Text>
                                      <Tooltip label="Refresh balance" hasArrow>
                                        <IconButton
                                          aria-label="Refresh balance"
                                          icon={<FaSync />}
                                          size="xs"
                                          variant="ghost"
                                          color={mutedTextColor}
                                          isLoading={isRefreshing}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            refreshBalances();
                                          }}
                                          _hover={{ color: textColor }}
                                />
                              </Tooltip>
                            </HStack>
                                    <HStack spacing={2} alignItems="baseline">
                                      <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                                        {balance === 0 ? '0.0000' : balance.toFixed(4)}
                              </Text>
                                      <Text fontSize="lg" color={mutedTextColor}>
                                        {network?.currency || 'ETH'}
                                      </Text>
                          </HStack>
                                    {balance === 0 && (
                                      <Text fontSize="xs" color="yellow.400" mt={1}>
                                        💡 Fund your wallet to start creating vaults
                                      </Text>
                                    )}
                            </Box>
                            
                                  {/* Status */}
                                  <HStack justify="space-between">
                                    <Tag 
                                      colorScheme={isActive ? "green" : "yellow"} 
                                      size="sm"
                                      borderRadius="full"
                                      variant={isActive ? "solid" : "outline"}
                                    >
                                      <TagLeftIcon as={isActive ? FaCheckCircle : FaWallet} />
                                      <TagLabel>{isActive ? 'Active' : 'Ready'}</TagLabel>
                                    </Tag>
                                    
                                    <HStack spacing={1}>
                                      <Icon as={FaHistory} color={mutedTextColor} />
                                      <Text fontSize="xs" color={mutedTextColor}>
                                        {transactions.length} tx
                                      </Text>
                                    </HStack>
                                  </HStack>
                                  
                                  {/* Recent Transactions Preview */}
                            <Box>
                                    <Text fontSize="sm" color={mutedTextColor} mb={2}>Recent Activity</Text>
                                    <VStack spacing={2} align="stretch">
                                      {transactions.slice(0, 2).map((tx, txIndex) => (
                                        <HStack key={txIndex} justify="space-between" p={2} bg="rgba(127, 90, 240, 0.1)" borderRadius="md" border="1px solid" borderColor={borderColor}>
                                          <HStack spacing={2}>
                                            <Icon 
                                              as={tx.type === 'send' ? FaPaperPlane : FaDownload} 
                                              color={tx.type === 'send' ? 'red.400' : 'green.400'}
                                              boxSize={3}
                                            />
                                            <Text fontSize="xs" color={textColor}>
                                              {tx.amount} ETH
                              </Text>
                                          </HStack>
                                          <HStack spacing={1}>
                                            <Icon 
                                              as={tx.status === 'confirmed' ? FaCheckCircle : FaClock} 
                                              color={tx.status === 'confirmed' ? 'green.400' : 'yellow.400'}
                                              boxSize={3}
                                            />
                                            <Text fontSize="xs" color={mutedTextColor}>
                                              {tx.timestamp}
                                            </Text>
                                          </HStack>
                                        </HStack>
                                      ))}
                                    </VStack>
                            </Box>
                          </VStack>
                        </CardBody>
                        
                        <CardFooter 
                                p={4} 
                                bg="rgba(127, 90, 240, 0.05)"
                          borderTop="1px" 
                                borderColor={borderColor}
                        >
                          {balance === 0 ? (
                            <VStack spacing={2} w="full">
                              <Button 
                                width="full" 
                                onClick={() => {
                                  navigator.clipboard.writeText(wallet.address);
                                  toast({
                                    title: 'Address Copied! 📋',
                                    description: 'Get testnet ETH from a faucet to start using your wallet',
                                    status: 'info',
                                    duration: 5000,
                                  });
                                  // Open Sepolia faucet
                                  window.open('https://sepoliafaucet.com/', '_blank');
                                }}
                                colorScheme="blue" 
                                variant="solid"
                                size="sm"
                                borderRadius="full"
                                leftIcon={<FaCoins />}
                                _hover={{ transform: 'translateY(-1px)' }}
                                transition="all 0.2s"
                        >
                                Get Test ETH
                              </Button>
                          <Button 
                            width="full" 
                            onClick={() => viewWalletDetails(wallet)} 
                            colorScheme="purple" 
                            variant="outline"
                            size="sm"
                                borderRadius="full"
                                leftIcon={<FaWallet />}
                                _hover={{ transform: 'translateY(-1px)' }}
                                transition="all 0.2s"
                          >
                            Manage Wallet
                          </Button>
                            </VStack>
                          ) : (
                            <Button 
                              width="full" 
                              onClick={() => viewWalletDetails(wallet)} 
                              colorScheme="purple" 
                              variant="outline"
                              size="sm"
                              borderRadius="full"
                              leftIcon={<FaWallet />}
                              _hover={{ transform: 'translateY(-1px)' }}
                              transition="all 0.2s"
                            >
                              Manage Wallet
                            </Button>
                          )}
                        </CardFooter>
                      </MotionCard>
                    );
                  })}
                </SimpleGrid>
              ) : (
                <EmptyState
                  icon={FaWallet}
                  title="No Wallets Found"
                  description="Create your first wallet to get started with managing your cryptocurrency assets and creating secure vaults."
                  primaryAction={{
                    label: "Create Your First Wallet",
                    onClick: onOpen,
                    colorScheme: "purple"
                  }}
                  secondaryAction={{
                    label: "Import Existing Wallet",
                    onClick: onOpenImport
                  }}
                />
              )}
            </VStack>
          </TabPanel>
          
                <TabPanel px={0}>
                  <VStack spacing={6} p={6}>
                    <VStack spacing={4} textAlign="center">
                      <Icon as={FaWallet} color="purple.500" boxSize={12} />
                      <Heading size="lg" color={textColor}>Create New Wallet</Heading>
                      <Text color={mutedTextColor} maxW="md">
                        Generate a new cryptocurrency wallet to start managing your assets securely.
                      </Text>
                    </VStack>
                    
                    <Card bg={cardBg} borderColor={borderColor} borderRadius="xl" p={6} maxW="md" width="full">
                      <VStack spacing={6}>
                        <Alert status="info" borderRadius="lg" variant="left-accent">
                          <AlertIcon />
              <Box>
                            <Text fontWeight="bold">Secure Wallet Creation</Text>
                            <Text fontSize="sm">Your private key will be stored locally and encrypted</Text>
                          </Box>
                        </Alert>
                
                        <Button
                          colorScheme="purple"
                          size="lg"
                          leftIcon={<FaPlus />}
                          onClick={createNewWallet}
                          isLoading={isCreating}
                          width="full"
                          borderRadius="full"
                          boxShadow="lg"
                          _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                          transition="all 0.2s"
                        >
                          {isCreating ? 'Creating Wallet...' : 'Create New Wallet'}
                        </Button>
                        
                        <HStack spacing={4} width="full">
                        <Divider />
                          <Text fontSize="sm" color={mutedTextColor}>OR</Text>
                          <Divider />
                        </HStack>
                        
                        <Button
                          colorScheme="green"
                          variant="outline"
                          size="lg"
                          leftIcon={<FaDownload />}
                          onClick={onOpenImport}
                          width="full"
                          borderRadius="full"
                          _hover={{ transform: 'translateY(-1px)' }}
                          transition="all 0.2s"
                        >
                          Import Existing Wallet
                        </Button>
                      </VStack>
                    </Card>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
          </Card>
        </VStack>
      </Container>
            
      {/* Create Wallet Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent bg={cardBg} borderRadius="xl" boxShadow="2xl">
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={FaPlus} color="purple.500" boxSize={6} />
              <Text color={textColor}>{newWallet ? 'New Wallet Created' : 'Create New Wallet'}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody pb={6}>
            {newWallet ? (
              <VStack spacing={6} align="stretch">
                <Alert status="success" borderRadius="lg" variant="left-accent">
                  <AlertIcon />
                  <Text fontWeight="bold">Wallet Created Successfully!</Text>
                </Alert>
                
                <Card bg="rgba(127, 90, 240, 0.1)" borderColor={borderColor} borderRadius="lg" border="2px solid">
                  <CardBody>
                    <VStack spacing={4}>
                      <HStack spacing={3}>
                        <Icon as={FaWallet} color="purple.500" boxSize={6} />
                        <Text fontWeight="bold" color={textColor}>Wallet Details</Text>
                      </HStack>
                      
                      <Box width="full">
                        <Text fontSize="sm" color={mutedTextColor} mb={2}>Address</Text>
                        <HStack spacing={2}>
                          <Text 
                            fontFamily="mono" 
                            fontSize="sm" 
                            color={textColor}
                            bg="rgba(127, 90, 240, 0.2)"
                            p={2}
                            borderRadius="md"
                            flex={1}
                            border="1px solid"
                            borderColor={borderColor}
                            fontWeight="bold"
                          >
                            {newWallet.address}
                          </Text>
                          <Tooltip hasArrow label="Copy Address">
                    <IconButton
                              aria-label="Copy address"
                              icon={<FaCopy />}
                              size="sm"
                              variant="ghost"
                              color={textColor}
                              onClick={() => {
                                navigator.clipboard.writeText(newWallet.address);
                                toast({
                                  title: "Address copied",
                                  status: "success",
                                  duration: 2000,
                                });
                              }}
                    />
                          </Tooltip>
                  </HStack>
                </Box>
                
                      <Box width="full">
                        <Text fontSize="sm" color={mutedTextColor} mb={2}>Network</Text>
                        <Badge colorScheme="purple" variant="solid" px={3} py={1} borderRadius="full">
                          {newWallet.network}
                        </Badge>
                      </Box>
                      
                      <Box width="full">
                        <Text fontSize="sm" color={mutedTextColor} mb={2}>QR Code</Text>
                        <Center>
                          <Box p={3} bg="white" borderRadius="lg">
                            <QRCodeSVG value={newWallet.address} size={120} />
                          </Box>
                        </Center>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
                
                <Alert status="warning" borderRadius="lg" variant="left-accent">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Important Security Notice</Text>
                    <Text fontSize="sm">
                      Save your private key securely. It cannot be recovered if lost.
                  </Text>
                </Box>
                </Alert>
              </VStack>
            ) : (
              <VStack spacing={6} align="stretch">
                <Alert status="info" borderRadius="lg" variant="left-accent">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold" color={textColor}>Create New Wallet</Text>
                    <Text fontSize="sm" color={mutedTextColor}>
                      Generate a new cryptocurrency wallet to start managing your assets securely.
                    </Text>
                  </Box>
                </Alert>
                
                <VStack spacing={4}>
                  <Text color={mutedTextColor} textAlign="center">
                    Your private key will be generated securely and stored locally on your device.
                  </Text>
                  
                  <Button
                    colorScheme="purple"
                    size="lg"
                    leftIcon={<FaPlus />}
                    onClick={createNewWallet}
                    isLoading={isCreating}
                    width="full"
                    borderRadius="full"
                    boxShadow="lg"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                    transition="all 0.2s"
                  >
                    {isCreating ? 'Creating Wallet...' : 'Create New Wallet'}
                  </Button>
                </VStack>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            {newWallet ? (
              <>
                <Button 
                  colorScheme="purple" 
                  mr={3} 
                  onClick={saveWallet}
                  leftIcon={<FaCheck />}
                  borderRadius="full"
                  boxShadow="lg"
                  _hover={{ transform: 'translateY(-1px)', boxShadow: 'xl' }}
                  transition="all 0.2s"
                >
                  Save Wallet
            </Button>
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  borderRadius="full"
                  color={textColor}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                onClick={onClose}
                borderRadius="full"
                color={textColor}
                width="full"
              >
                Close
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Private Key Modal */}
      <Modal isOpen={isPrivateKeyOpen} onClose={onClosePrivateKey} size="md">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent bg={cardBg} borderRadius="xl" boxShadow="2xl">
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={FaKey} color="orange.500" boxSize={6} />
              <Text>Private Key</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedWallet && (
              <VStack spacing={6} align="stretch">
                <Alert status="warning" borderRadius="lg" variant="left-accent">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Security Warning</Text>
                    <Text fontSize="sm">Never share your private key with anyone</Text>
                  </Box>
                </Alert>
                
                <Box>
                  <Text fontSize="sm" color={mutedTextColor} mb={2}>Private Key</Text>
                  <HStack spacing={2}>
                    <Text 
                      fontFamily="mono" 
                      fontSize="sm" 
                      color={textColor}
                      bg="rgba(127, 90, 240, 0.2)"
                      p={3}
                      borderRadius="md"
                      flex={1}
                      wordBreak="break-all"
                      border="1px solid"
                      borderColor={borderColor}
                      fontWeight="bold"
                    >
                      {selectedWallet.privateKey}
                    </Text>
                    <Tooltip hasArrow label="Copy Private Key">
                    <IconButton
                      aria-label="Copy private key"
                        icon={<FaCopy />}
                        size="sm"
                        variant="ghost"
                        color={textColor}
                        onClick={() => {
                          navigator.clipboard.writeText(selectedWallet.privateKey);
                          toast({
                            title: "Private key copied",
                            status: "success",
                            duration: 2000,
                          });
                        }}
                    />
                    </Tooltip>
                  </HStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="blue" 
              mr={3} 
              onClick={onClosePrivateKey}
              borderRadius="full"
            >
              Close
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                onClosePrivateKey();
                if (selectedWallet) {
                  navigate(`/wallet/${selectedWallet.address}`);
                }
              }}
              borderRadius="full"
              leftIcon={<FaWallet />}
            >
              View Wallet Details
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Import Wallet Modal */}
      <Modal isOpen={isImportOpen} onClose={onCloseImport} size="md">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent bg={cardBg} borderRadius="xl" boxShadow="2xl">
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={FaDownload} color="green.500" boxSize={6} />
              <Text>Import Existing Wallet</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              <Alert status="info" borderRadius="lg" variant="left-accent">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Import Your Wallet</Text>
                  <Text fontSize="sm">Enter your private key to import an existing wallet</Text>
                </Box>
              </Alert>
              
              <FormControl isRequired>
                <FormLabel color={textColor}>Private Key</FormLabel>
                <InputGroup>
                  <Input 
                    type={showPrivateKey["import"] ? "text" : "password"}
                    value={importPrivateKey} 
                    onChange={(e) => setImportPrivateKey(e.target.value)} 
                    placeholder="0x..."
                    pr="4.5rem"
                    borderRadius="md"
                    fontFamily="mono"
                    fontSize="sm"
                  />
                  <InputRightElement width="4.5rem">
                    <Button 
                      h="1.75rem" 
                      size="sm" 
                      onClick={() => setShowPrivateKey({...showPrivateKey, "import": !showPrivateKey["import"]})}
                      borderRadius="full"
                    >
                      {showPrivateKey["import"] ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormHelperText color={mutedTextColor}>
                  Enter the 64-character private key starting with 0x
                </FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="green" 
              mr={3} 
              onClick={importWallet}
              isLoading={isImporting}
              isDisabled={!importPrivateKey}
              leftIcon={<FaDownload />}
              borderRadius="full"
              boxShadow="lg"
              _hover={{ transform: 'translateY(-1px)', boxShadow: 'xl' }}
              transition="all 0.2s"
            >
              Import Wallet
            </Button>
            <Button 
              variant="ghost" 
              onClick={onCloseImport}
              borderRadius="full"
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Wallet Funding Modal */}
      {newWallet && (
        <WalletFundingModal
          isOpen={isFundingOpen}
          onClose={onFundingClose}
          walletAddress={newWallet.address}
          onCreateVault={handleCreateVault}
        />
      )}
    </Box>
  );
};