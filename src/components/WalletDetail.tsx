import { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  useToast,
  HStack,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,

  FormHelperText,
  useClipboard,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Card,
  CardHeader,
  CardBody,
  Grid,
  GridItem,
  Divider,
  InputGroup,
  InputRightElement,
  Spinner,
  Alert,
  AlertIcon,
  Container,
  Icon,
  Progress,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCopy, FaEye, FaEyeSlash, FaExchangeAlt, FaTrash, FaKey, FaInfoCircle, FaSync, FaCheck, FaGasPump, FaWallet } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import { SUPPORTED_NETWORKS } from '../constants/networks';
import { estimateGasFee, GasEstimate, sendTransaction } from '../utils/wallet';
import TransactionHistory from './TransactionHistory';

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
  network: string;
  blockNumber?: number;
}

interface WalletData {
  address: string;
  privateKey: string;
  network: string;
  balance: string;
}

export const WalletDetail = () => {
  const { address } = useParams();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [balance, setBalance] = useState('0');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const addressClipboard = useClipboard(wallet?.address || '');
  const privateKeyClipboard = useClipboard(wallet?.privateKey || '');
  const toast = useToast();
  const navigate = useNavigate();
  
  // Delete wallet confirm dialog
  const { isOpen: isDeleteDialogOpen, onOpen: onOpenDeleteDialog, onClose: onCloseDeleteDialog } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  // Export private key dialog
  const { isOpen: isExportOpen, onOpen: onOpenExport, onClose: onCloseExport } = useDisclosure();

  useEffect(() => {
    loadWallet();
    loadAllWallets();
    
    // Refresh balance periodically
    const intervalId = setInterval(() => {
      refreshBalance();
    }, 30000); // 30 seconds
    
    return () => clearInterval(intervalId);
  }, [address]);

  const loadAllWallets = () => {
    // This function is kept for future use but currently not needed
  };

  const loadWallet = async () => {
    try {
      setIsLoading(true);
      // Load wallet from localStorage
      const savedWallets = localStorage.getItem('wallets');
      if (savedWallets && address) {
        const wallets = JSON.parse(savedWallets);
        const foundWallet = wallets.find((w: any) => w.address === address);
        if (foundWallet) {
          setWallet(foundWallet);
          
          // Connect to network and get balance
          await refreshBalance(foundWallet);
          
          // Load transactions (mock data for now)
          loadTransactions(foundWallet.address);
        } else {
          toast({
            title: 'Wallet not found',
            description: 'Could not find the requested wallet',
            status: 'error',
            duration: 5000,
          });
          navigate('/wallet');
        }
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wallet',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalance = async (walletToRefresh?: WalletData) => {
    try {
      setIsRefreshing(true);
      const targetWallet = walletToRefresh || wallet;
      if (!targetWallet) return;
      
      const network = SUPPORTED_NETWORKS.find(n => n.id === targetWallet.network);
      if (!network) return;
      
      try {
        // Connect to network
        const provider = new ethers.JsonRpcProvider(network.rpc[0]);
        
        // Get balance
        const balanceWei = await provider.getBalance(targetWallet.address);
        const formattedBalance = ethers.formatEther(balanceWei);
        setBalance(formattedBalance);
        
        // Update the wallet in local storage
        if (formattedBalance !== targetWallet.balance) {
          const updatedWallet = {...targetWallet, balance: formattedBalance};
          updateWalletInStorage(updatedWallet);
        }
      } catch (error) {
        console.warn('Error refreshing balance, using stored value', error);
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateWalletInStorage = (updatedWallet: WalletData) => {
    const savedWalletsData = localStorage.getItem('wallets');
    if (savedWalletsData) {
      const wallets = JSON.parse(savedWalletsData);
      const updatedWallets = wallets.map((w: WalletData) => 
        w.address === updatedWallet.address ? updatedWallet : w
      );
      localStorage.setItem('wallets', JSON.stringify(updatedWallets));
      setWallet(updatedWallet);
    }
  };

  // Load transactions from localStorage
  const loadStoredTransactions = (walletAddress: string, networkId: string) => {
    try {
      const storedTxKey = `transactions_${walletAddress}_${networkId}`;
      const storedTxData = localStorage.getItem(storedTxKey);
      if (storedTxData) {
        const parsedTx = JSON.parse(storedTxData);
        if (Array.isArray(parsedTx)) {
          return parsedTx;
        }
      }
    } catch (error) {
      console.error('Error loading stored transactions:', error);
    }
    return [];
  };

  // Save transactions to localStorage
  const saveTransactions = (walletAddress: string, networkId: string, txList: Transaction[]) => {
    try {
      const storedTxKey = `transactions_${walletAddress}_${networkId}`;
      localStorage.setItem(storedTxKey, JSON.stringify(txList));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  };

  const loadTransactions = async (walletAddress: string) => {
    if (!wallet) return;
    
    try {
      // First load any stored transactions
      const storedTransactions = loadStoredTransactions(walletAddress, wallet.network);
      setTransactions(storedTransactions);
      
      // Then try to fetch from the blockchain
      const network = SUPPORTED_NETWORKS.find(n => n.id === wallet.network);
      if (!network) return;
      
      try {
        // Connect to provider
        const provider = new ethers.JsonRpcProvider(network.rpc[0]);
        
        // Get the latest block number
        const latestBlock = await provider.getBlockNumber();
        
        // Fetch the last 100 blocks for transactions
        const fromBlock = Math.max(0, latestBlock - 100);
        
        // Get sent transactions
        const sentTxs = await fetchWalletTransactions(provider, walletAddress, fromBlock, latestBlock, true);
        
        // Get received transactions
        const receivedTxs = await fetchWalletTransactions(provider, walletAddress, fromBlock, latestBlock, false);
        
        // Combine and sort transactions
        const allTxs = [...sentTxs, ...receivedTxs].sort((a, b) => b.timestamp - a.timestamp);
        
        // Merge with stored transactions, removing duplicates
        const mergedTxs = mergeTransactions(storedTransactions, allTxs);
        
        // Update state and save to localStorage
        setTransactions(mergedTxs);
        saveTransactions(walletAddress, wallet.network, mergedTxs);
      } catch (error) {
        console.warn('Error fetching blockchain transactions, using stored data', error);
      }
    } catch (error) {
      console.error('Error in loadTransactions:', error);
      
      // Fallback to mock data if everything fails
      const mockTransactions: Transaction[] = [
        {
          hash: '0x123abc456def789ghi',
          from: walletAddress,
          to: '0x456def789ghi123abc',
          value: '0.1',
          timestamp: Date.now() - 86400000, // 1 day ago
          status: 'confirmed',
          network: wallet.network
        },
        {
          hash: '0x789ghi123abc456def',
          from: '0x987zyx654wvu321tsr',
          to: walletAddress,
          value: '0.5',
          timestamp: Date.now() - 172800000, // 2 days ago
          status: 'confirmed',
          network: wallet.network
        }
      ];
      setTransactions(mockTransactions);
    }
  };
  
  // Helper function to fetch transactions from the blockchain
  const fetchWalletTransactions = async (
    provider: ethers.JsonRpcProvider, 
    address: string, 
    fromBlock: number, 
    toBlock: number, 
    isSender: boolean
  ): Promise<Transaction[]> => {
    try {
      // Create a filter for transactions
      const filter = {
        fromBlock,
        toBlock,
        address: isSender ? undefined : address, // For received transactions
        topics: []
      };
      
      // Get logs
      const logs = await provider.getLogs(filter);
      
      // Process logs into transactions
      const transactions: Transaction[] = [];
      
      for (const log of logs) {
        if (log.transactionHash) {
          try {
            const tx = await provider.getTransaction(log.transactionHash);
            const receipt = await provider.getTransactionReceipt(log.transactionHash);
            
            if (tx && 
                ((isSender && tx.from.toLowerCase() === address.toLowerCase()) || 
                (!isSender && tx.to?.toLowerCase() === address.toLowerCase()))) {
              
              const block = await provider.getBlock(tx.blockNumber || 0);
              const gasPrice = tx.gasPrice || tx.maxFeePerGas || 0n;
              
              // Make sure wallet is not null
              const currentNetwork = wallet?.network || 'ethereum';
              
              transactions.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to || '',
                value: ethers.formatEther(tx.value || 0n),
                timestamp: block ? block.timestamp * 1000 : Date.now(),
                status: receipt?.status ? 'confirmed' : 'failed',
                gasUsed: receipt ? ethers.formatEther(receipt.gasUsed * gasPrice) : '0',
                gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
                blockNumber: tx.blockNumber || 0,
                network: currentNetwork
              });
            }
          } catch (error) {
            console.warn('Error processing transaction:', error);
          }
        }
      }
      
      return transactions;
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      return [];
    }
  };
  
  // Helper function to merge transactions and remove duplicates
  const mergeTransactions = (oldTxs: Transaction[], newTxs: Transaction[]): Transaction[] => {
    const txMap = new Map<string, Transaction>();
    
    // Add old transactions to map
    oldTxs.forEach(tx => txMap.set(tx.hash, tx));
    
    // Add or update with new transactions
    newTxs.forEach(tx => txMap.set(tx.hash, tx));
    
    // Convert map back to array and sort by timestamp
    return Array.from(txMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  };
  
  const calculateGasFee = async () => {
    if (!wallet || !recipient || !amount || parseFloat(amount) <= 0) {
      setGasEstimate(null);
      return;
    }
    
    try {
      setIsEstimatingGas(true);
      
      // Validate address
      if (!ethers.isAddress(recipient)) {
        throw new Error('Invalid wallet address');
      }
      
      const estimate = await estimateGasFee(wallet, recipient, amount);
      setGasEstimate(estimate);
    } catch (error) {
      console.error('Error estimating gas fee:', error);
      setGasEstimate(null);
    } finally {
      setIsEstimatingGas(false);
    }
  };
  
  // Recalculate gas fee when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (wallet && recipient && amount && parseFloat(amount) > 0) {
        calculateGasFee();
      }
    }, 500); // Debounce
    
    return () => clearTimeout(timer);
  }, [wallet, recipient, amount]);

  const handleSendTransaction = async () => {
    if (!wallet || !recipient || !amount) return;

    try {
      setIsSending(true);
      
      // Validate address
      if (!ethers.isAddress(recipient)) {
        throw new Error('Invalid wallet address');
      }
      
      // Connect to network
      const network = SUPPORTED_NETWORKS.find(n => n.id === wallet.network);
      if (!network) {
        throw new Error('Network not found');
      }
      
      // Get latest gas estimate if needed
      if (!gasEstimate) {
        await calculateGasFee();
      }
      
      // Validate amount after gas fees
      if (gasEstimate && parseFloat(amount) > parseFloat(gasEstimate.maxAmount)) {
        throw new Error(`Insufficient funds for transaction. Maximum available after gas: ${gasEstimate.maxAmount} ETH`);
      }
      
      // Use the sendTransaction function imported at the top of the file
      
      // Show confirmation toast
      toast({
        title: 'Sending Transaction',
        description: `Sending ${amount} ETH plus network fee: ${gasEstimate?.gasCostEther || '0'} ETH`,
        status: 'info',
        duration: 3000,
      });
      
      // Send transaction with gas estimation
      const txHash = await sendTransaction(wallet, recipient, amount, false);
      
      toast({
        title: 'Transaction Submitted',
        description: `Transaction hash: ${txHash}`,
        status: 'info',
        duration: 5000,
      });
      
      // Update balance
      await refreshBalance();
      
      // Add transaction to list
      const sentAmount = amount;
      const gasCost = gasEstimate ? gasEstimate.gasCostEther : '0';
      const gasPrice = gasEstimate ? ethers.formatUnits(gasEstimate.gasPrice, 'gwei') : '0';
      
      const newTransaction: Transaction = {
        hash: txHash,
        from: wallet.address,
        to: recipient,
        value: sentAmount,
        timestamp: Date.now(),
        status: 'confirmed',
        gasUsed: gasCost,
        gasPrice: gasPrice,
        network: wallet.network
      };
      
      // Update transactions state
      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      
      // Save to localStorage
      saveTransactions(wallet.address, wallet.network, updatedTransactions);
      
      // Clear form
      setRecipient('');
      setAmount('');
      setGasEstimate(null);
      
      toast({
        title: 'Success',
        description: `Transaction sent successfully. Gas fee: ${gasCost} ETH`,
        status: 'success',
        duration: 5000,
      });
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 4001) {
        toast({
          title: 'Transaction cancelled',
          description: 'You cancelled the wallet transaction.',
          status: 'info',
          duration: 4000,
        });
      } else {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to send transaction',
          status: 'error',
          duration: 5000,
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteWallet = () => {
    if (!wallet) return;
    
    try {
      const savedWalletsData = localStorage.getItem('wallets');
      if (savedWalletsData) {
        const wallets = JSON.parse(savedWalletsData);
        const updatedWallets = wallets.filter((w: WalletData) => w.address !== wallet.address);
        localStorage.setItem('wallets', JSON.stringify(updatedWallets));
        
        toast({
          title: 'Wallet Deleted',
          description: 'Wallet has been removed from your device',
          status: 'success',
          duration: 5000,
        });
        
        // Navigate back to wallet list
        navigate('/wallet');
      }
    } catch (error) {
      console.error('Error deleting wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete wallet',
        status: 'error',
        duration: 5000,
      });
    } finally {
      onCloseDeleteDialog();
    }
  };



  if (isLoading) {
    return (
      <Box textAlign="center" p={10}>
        <Text>Loading wallet details...</Text>
      </Box>
    );
  }

  if (!wallet) {
    return (
      <Box textAlign="center" p={10}>
        <Text>Wallet not found</Text>
        <Button mt={4} onClick={() => navigate('/wallet')}>Go to Wallet Manager</Button>
      </Box>
    );
  }

  const network = SUPPORTED_NETWORKS.find(n => n.id === wallet.network);

  return (
    <Box 
      minH="100vh" 
      bgGradient="linear(to-br, gray.50, purple.50)"
      py={8}
    >
      <Container maxW="7xl">
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <VStack spacing={4} textAlign="center">
              <HStack spacing={3}>
                <Icon as={FaWallet} color="purple.500" boxSize={8} />
                <Heading size="xl" color="gray.800">Wallet Details</Heading>
              </HStack>
              <Text color="gray.600" fontSize="lg">
                Manage your wallet and transactions
              </Text>
            </VStack>
          </MotionBox>

          <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={8}>
        <GridItem>
              <MotionCard
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                bg="white"
                borderColor="gray.200"
                borderRadius="xl"
                overflow="hidden"
                boxShadow="xl"
              >
                <CardHeader 
                  bgGradient="linear(to-r, purple.500, blue.500)" 
                  color="white"
                  pb={4}
                >
                  <VStack spacing={2} align="start">
                    <HStack spacing={3}>
                      <Icon as={FaWallet} boxSize={6} />
                <Heading size="md">Wallet Information</Heading>
                    </HStack>
                    <Badge colorScheme="whiteAlpha" variant="solid" borderRadius="full">
                      {network?.name || wallet.network}
                    </Badge>
                  </VStack>
              </CardHeader>
                <CardBody p={6}>
                  <VStack spacing={6} align="stretch">
                  {/* ADDRESS */}
                  <Box>
                      <HStack mb={2} justify="space-between">
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">Address</Text>
                      <Tooltip hasArrow label="Copy to clipboard">
                        <IconButton 
                          aria-label="Copy address" 
                          icon={addressClipboard.hasCopied ? <FaCheck /> : <FaCopy />} 
                          size="xs" 
                          onClick={addressClipboard.onCopy}
                          colorScheme={addressClipboard.hasCopied ? "green" : "gray"}
                            borderRadius="full"
                        />
                      </Tooltip>
                    </HStack>
                      <Box 
                        p={3} 
                        bg="gray.50" 
                        borderRadius="lg" 
                        border="1px" 
                        borderColor="gray.200"
                        fontFamily="mono"
                        fontSize="xs"
                        textAlign="center"
                      >
                      {wallet.address}
                  </Box>
                  </Box>
                  
                  {/* BALANCE */}
                  <Box>
                      <HStack mb={2} justify="space-between">
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">Balance</Text>
                      <Tooltip hasArrow label="Refresh balance">
                        <IconButton 
                          aria-label="Refresh balance" 
                          icon={<FaSync />}
                          size="xs" 
                          onClick={() => refreshBalance()} 
                          isLoading={isRefreshing}
                            borderRadius="full"
                        />
                      </Tooltip>
                    </HStack>
                      <VStack spacing={2}>
                        <Heading size="lg" color="gray.800">
                          {balance} {network?.currency || 'ETH'}
                        </Heading>
                        <Progress 
                          value={Math.min((parseFloat(balance) / 1) * 100, 100)} 
                          size="sm" 
                          colorScheme="purple"
                          borderRadius="full"
                          w="100%"
                        />
                      </VStack>
                  </Box>
                  
                  {/* QR CODE */}
                  <Box alignSelf="center" pt={2}>
                      <VStack spacing={3}>
                        <Box p={4} bg="white" borderRadius="lg" boxShadow="md">
                    <QRCodeSVG
                      value={wallet.address}
                            size={120}
                      level="H"
                      includeMargin={true}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                    />
                        </Box>
                        <Text fontSize="xs" color="gray.500" textAlign="center">
                      Scan to send funds to this wallet
                    </Text>
                      </VStack>
                  </Box>
                </VStack>
                
                {/* ACTIONS */}
                  <Divider my={6} />
                
                <VStack spacing={3}>
                  <Button 
                    leftIcon={<FaKey />} 
                    size="sm" 
                    colorScheme="blue" 
                    variant="outline"
                    onClick={onOpenExport}
                    width="100%"
                      borderRadius="full"
                      _hover={{ transform: 'translateY(-1px)' }}
                      transition="all 0.2s"
                  >
                    Export Private Key
                  </Button>
                
                  <Button 
                    leftIcon={<FaTrash />} 
                    size="sm" 
                    colorScheme="red" 
                    variant="outline"
                    onClick={onOpenDeleteDialog}
                    width="100%"
                      borderRadius="full"
                      _hover={{ transform: 'translateY(-1px)' }}
                      transition="all 0.2s"
                  >
                    Delete Wallet
                  </Button>
                </VStack>
              </CardBody>
              </MotionCard>
        </GridItem>
        
        <GridItem>
          <MotionBox
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
          <Tabs variant="enclosed" colorScheme="purple" isLazy>
              <TabList bg="white" borderRadius="lg" p={1} boxShadow="md">
                <Tab 
                  _selected={{ bg: 'purple.500', color: 'white' }}
                  borderRadius="md"
                  fontWeight="semibold"
                >
                  Send
                </Tab>
                <Tab 
                  _selected={{ bg: 'purple.500', color: 'white' }}
                  borderRadius="md"
                  fontWeight="semibold"
                >
                  Transactions
                </Tab>
            </TabList>

            <TabPanels>
                <TabPanel px={0} pt={6}>
                  <Card bg="white" borderColor="gray.200" borderRadius="xl" boxShadow="lg">
                  <CardHeader>
                      <HStack spacing={3}>
                        <Icon as={FaExchangeAlt} color="purple.500" boxSize={6} />
                    <Heading size="md">Send {network?.currency || 'ETH'}</Heading>
                      </HStack>
                  </CardHeader>
                  <CardBody>
                      <VStack spacing={6} align="stretch">
                      <FormControl isRequired>
                          <FormLabel color="gray.700" fontWeight="medium">Recipient Address</FormLabel>
                        <Input
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="0x..."
                          size="lg"
                            borderRadius="lg"
                            borderColor="gray.300"
                            _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
                        />
                          <FormHelperText color="gray.500">Enter the full Ethereum address</FormHelperText>
                      </FormControl>

                      <FormControl isRequired>
                          <FormLabel color="gray.700" fontWeight="medium">Amount ({network?.currency || 'ETH'})</FormLabel>
                          <InputGroup size="lg">
                          <Input
                            type="number"
                            value={amount}
                            onChange={(e) => {
                              setAmount(e.target.value);
                            }}
                            placeholder="0.0"
                            min="0"
                            step="0.0001"
                              borderRadius="lg"
                              borderColor="gray.300"
                              _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
                          />
                            <InputRightElement width="5rem" h="100%">
                            <Button 
                                h="2.5rem" 
                              size="sm" 
                              onClick={() => {
                                if (amount && parseFloat(amount) > 0) {
                                  setAmount("");
                                } else {
                                  if (gasEstimate) {
                                    setAmount(gasEstimate.maxAmount);
                                  } else {
                                    setAmount(balance);
                                  }
                                }
                              }}
                              colorScheme={amount && parseFloat(amount) > 0 ? "gray" : "blue"}
                                borderRadius="full"
                                fontSize="sm"
                            >
                              {amount && parseFloat(amount) > 0 ? "Clear" : "Max"}
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                          <FormHelperText color="gray.500">Available: {balance} {network?.currency || 'ETH'}</FormHelperText>
                      </FormControl>
                      
                      {/* Gas Fee Estimate */}
                      <Box 
                          p={6} 
                          borderRadius="xl" 
                        borderWidth="1px" 
                        borderColor="gray.200"
                        bg="gray.50"
                      >
                          <HStack justifyContent="space-between" mb={4}>
                            <HStack spacing={2}>
                              <Icon as={FaGasPump} color="purple.500" />
                              <Heading size="sm" color="gray.700">Transaction Details</Heading>
                            </HStack>
                            {isEstimatingGas && <Spinner size="sm" color="purple.500" />}
                        </HStack>
                        
                        {gasEstimate ? (
                            <VStack align="stretch" spacing={4}>
                              <Grid templateColumns="1fr 1fr" gap={6}>
                              <GridItem>
                                  <VStack align="start" spacing={2}>
                                    <Text fontSize="sm" color="gray.600" fontWeight="medium">You Send:</Text>
                                    <Text fontSize="lg" fontWeight="bold" color="gray.800">{amount} ETH</Text>
                                </VStack>
                              </GridItem>
                              
                              <GridItem>
                                  <VStack align="start" spacing={2}>
                                    <Text fontSize="sm" color="gray.600" fontWeight="medium">Recipient Gets:</Text>
                                    <Text fontSize="lg" fontWeight="bold" color="gray.800">{amount} ETH</Text>
                                </VStack>
                              </GridItem>
                            </Grid>
                            
                            <Divider />
                            
                            <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="sm" color="gray.600" fontWeight="medium">Network Fee:</Text>
                                <Text fontSize="xs" color="gray.500">
                                    (~${gasEstimate && !isNaN(parseFloat(gasEstimate.gasCostEther)) ? (parseFloat(gasEstimate.gasCostEther) * 2000).toFixed(2) : '0.00'})
                                </Text>
                              </VStack>
                                <Text fontSize="lg" fontWeight="bold" color="gray.800">{gasEstimate.gasCostEther} ETH</Text>
                            </HStack>
                            
                            {parseFloat(amount) > parseFloat(gasEstimate.maxAmount) && (
                                <Alert status="warning" borderRadius="lg" variant="left-accent">
                                <AlertIcon />
                                <Text fontSize="sm">
                                  The amount exceeds your available balance after gas fees.
                                </Text>
                              </Alert>
                            )}
                          </VStack>
                        ) : (
                            <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                            Enter a valid address and amount to see transaction details
                          </Text>
                        )}
                      </Box>

                      <Button
                        colorScheme="purple"
                        size="lg"
                        isLoading={isSending}
                        loadingText="Sending..."
                        onClick={handleSendTransaction}
                        isDisabled={
                          !recipient || 
                          !amount || 
                          parseFloat(amount) <= 0 || 
                          (gasEstimate && parseFloat(amount) > parseFloat(gasEstimate.maxAmount)) ||
                          isEstimatingGas
                        }
                          borderRadius="full"
                          boxShadow="lg"
                          _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                          transition="all 0.2s"
                        leftIcon={<FaExchangeAlt />}
                      >
                        Send {amount || 0} ETH
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
              
              <TabPanel>
                <TransactionHistory 
                  walletAddress={wallet?.address || ''} 
                  network={wallet?.network || 'sepolia'} 
                                      />
              </TabPanel>
            </TabPanels>
          </Tabs>
          </MotionBox>
        </GridItem>
      </Grid>
        </VStack>
      </Container>
      
      {/* Export Private Key Modal */}
      <Modal isOpen={isExportOpen} onClose={onCloseExport} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Export Private Key</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box textAlign="center" mb={4} color="red.500">
              <FaInfoCircle size="40px" />
            </Box>
            <Text mb={4} fontWeight="bold" color="red.500" textAlign="center">
              Warning: Never share your private key with anyone!
            </Text>
            <Text mb={4}>
              Your private key provides complete control over this wallet and its funds.
              If someone gets your private key, they can steal all your assets.
            </Text>
            <FormControl>
              <FormLabel>Private Key</FormLabel>
              <InputGroup>
                <Input
                  type={showPrivateKey ? 'text' : 'password'}
                  value={wallet.privateKey}
                  isReadOnly
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPrivateKey ? 'Hide' : 'Show'}
                    icon={showPrivateKey ? <FaEyeSlash /> : <FaEye />}
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              leftIcon={<FaCopy />}
              colorScheme={privateKeyClipboard.hasCopied ? "green" : "blue"}
              onClick={privateKeyClipboard.onCopy}
              mr={3}
            >
              {privateKeyClipboard.hasCopied ? "Copied!" : "Copy"}
            </Button>
            <Button onClick={onCloseExport}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Delete Wallet Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCloseDeleteDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Wallet
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this wallet? This action cannot be undone.
              
              <Box mt={4} p={3} bg="red.50" borderRadius="md" borderLeft="4px" borderColor="red.500">
                <Text fontWeight="bold" color="red.500">WARNING</Text>
                <Text mt={2}>Make sure you have backed up your private key before deleting this wallet. Without the private key, you will permanently lose access to any funds in this wallet.</Text>
              </Box>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCloseDeleteDialog}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteWallet} ml={3}>
                Delete Wallet
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}; 