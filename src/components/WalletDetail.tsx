import React, { useState, useEffect, useRef } from 'react';
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  FormHelperText,
  useClipboard,
  IconButton,
  Tooltip,
  Select,
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
  Flex,
  Divider,
  InputGroup,
  InputRightElement,
  Code,
  Switch,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Skeleton,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCopy, FaEye, FaEyeSlash, FaQrcode, FaExchangeAlt, FaTrash, FaKey, FaEdit, FaDownload, FaInfoCircle, FaSync, FaCheck, FaGasPump } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import { SUPPORTED_NETWORKS, Network } from '../constants/networks';
import { estimateGasFee, GasEstimate, sendTransaction } from '../utils/wallet';

const MotionBox = motion.create(Box);

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
  const [savedWallets, setSavedWallets] = useState<WalletData[]>([]);
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
    const savedWalletsData = localStorage.getItem('wallets');
    if (savedWalletsData) {
      setSavedWallets(JSON.parse(savedWalletsData));
    }
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
        const provider = new ethers.JsonRpcProvider(network.rpc);
        
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
      setSavedWallets(updatedWallets);
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
        const provider = new ethers.JsonRpcProvider(network.rpc);
        
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
    } catch (error) {
      console.error('Error sending transaction:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send transaction',
        status: 'error',
        duration: 5000,
      });
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

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Convert to seconds
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return 'just now';
    }
    
    // Convert to minutes
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Convert to hours
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    }
    
    // Convert to days
    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Convert to months
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    
    // Convert to years
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
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
    <Box p={8}>
      <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={6}>
        <GridItem>
          <VStack spacing={6} align="stretch">
            <Card variant="outline" borderRadius="xl" overflow="hidden" boxShadow="lg">
              <CardHeader bg="purple.500" color="white">
                <Heading size="md">Wallet Information</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {/* ADDRESS */}
                  <Box>
                    <HStack mb={1}>
                      <Text fontSize="sm" color="gray.500">Address</Text>
                      <Tooltip hasArrow label="Copy to clipboard">
                        <IconButton 
                          aria-label="Copy address" 
                          icon={addressClipboard.hasCopied ? <FaCheck /> : <FaCopy />} 
                          size="xs" 
                          onClick={addressClipboard.onCopy}
                          colorScheme={addressClipboard.hasCopied ? "green" : "gray"}
                        />
                      </Tooltip>
                    </HStack>
                    <Code p={2} borderRadius="md" w="100%" fontSize="xs" isTruncated>
                      {wallet.address}
                    </Code>
                  </Box>
                  
                  {/* NETWORK */}
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>Network</Text>
                    <Badge colorScheme="purple" px={2} py={1}>
                      {network?.name || wallet.network}
                    </Badge>
                  </Box>
                  
                  {/* BALANCE */}
                  <Box>
                    <HStack mb={1}>
                      <Text fontSize="sm" color="gray.500">Balance</Text>
                      <Tooltip hasArrow label="Refresh balance">
                        <IconButton 
                          aria-label="Refresh balance" 
                          icon={<FaSync />}
                          size="xs" 
                          onClick={() => refreshBalance()} 
                          isLoading={isRefreshing}
                        />
                      </Tooltip>
                    </HStack>
                    <Heading size="md">{balance} {network?.currency || 'ETH'}</Heading>
                  </Box>
                  
                  {/* QR CODE */}
                  <Box alignSelf="center" pt={2}>
                    <QRCodeSVG
                      value={wallet.address}
                      size={150}
                      level="H"
                      includeMargin={true}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                    />
                    <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
                      Scan to send funds to this wallet
                    </Text>
                  </Box>
                </VStack>
                
                {/* ACTIONS */}
                <Divider my={4} />
                
                <VStack spacing={3}>
                  <Button 
                    leftIcon={<FaKey />} 
                    size="sm" 
                    colorScheme="blue" 
                    variant="outline"
                    onClick={onOpenExport}
                    width="100%"
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
                  >
                    Delete Wallet
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </GridItem>
        
        <GridItem>
          <Tabs variant="enclosed" colorScheme="purple" isLazy>
            <TabList>
              <Tab>Send</Tab>
              <Tab>Transactions</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Card variant="outline">
                  <CardHeader>
                    <Heading size="md">Send {network?.currency || 'ETH'}</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <FormControl isRequired>
                        <FormLabel>Recipient Address</FormLabel>
                        <Input
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="0x..."
                          size="lg"
                        />
                        <FormHelperText>Enter the full Ethereum address</FormHelperText>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Amount ({network?.currency || 'ETH'})</FormLabel>
                        <InputGroup>
                          <Input
                            type="number"
                            value={amount}
                            onChange={(e) => {
                              setAmount(e.target.value);
                            }}
                            placeholder="0.0"
                            size="lg"
                            min="0"
                            step="0.0001"
                          />
                          <InputRightElement width="4.5rem" h="100%">
                            <Button 
                              h="1.75rem" 
                              size="sm" 
                              onClick={() => {
                                // If there's already an amount, clear it
                                // Otherwise set to maximum
                                if (amount && parseFloat(amount) > 0) {
                                  setAmount("");
                                } else {
                                  // Calculate max amount considering gas fees
                                  if (gasEstimate) {
                                    setAmount(gasEstimate.maxAmount);
                                  } else {
                                    setAmount(balance);
                                  }
                                }
                              }}
                              colorScheme={amount && parseFloat(amount) > 0 ? "gray" : "blue"}
                            >
                              {amount && parseFloat(amount) > 0 ? "Clear" : "Max"}
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                        <FormHelperText>Available: {balance} {network?.currency || 'ETH'}</FormHelperText>
                      </FormControl>
                      
                      {/* Gas Fee Estimate */}
                      <Box 
                        p={4} 
                        borderRadius="md" 
                        borderWidth="1px" 
                        borderColor="gray.200"
                        bg="gray.50"
                      >
                        <HStack justifyContent="space-between" mb={3}>
                          <Heading size="sm">
                            <HStack>
                              <FaGasPump />
                              <Text>Transaction Details</Text>
                            </HStack>
                          </Heading>
                          {isEstimatingGas && <Spinner size="sm" />}
                        </HStack>
                        
                        {gasEstimate ? (
                          <VStack align="stretch" spacing={3}>
                            <Grid templateColumns="1fr 1fr" gap={4}>
                              <GridItem>
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="sm" color="gray.600">You Send:</Text>
                                  <Text fontWeight="bold">{amount} ETH</Text>
                                </VStack>
                              </GridItem>
                              
                              <GridItem>
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="sm" color="gray.600">Receive:</Text>
                                  <Text fontWeight="bold">{amount} ETH</Text>
                                </VStack>
                              </GridItem>
                            </Grid>
                            
                            <Divider />
                            
                            <HStack justify="space-between">
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" color="gray.600">Network Fee:</Text>
                                <Text fontSize="xs" color="gray.500">
                                  (~$
                                  {(parseFloat(gasEstimate.gasCostEther) * 2000).toFixed(2)})
                                </Text>
                              </VStack>
                              <Text fontWeight="bold">{gasEstimate.gasCostEther} ETH</Text>
                            </HStack>
                            
                            {parseFloat(amount) > parseFloat(gasEstimate.maxAmount) && (
                              <Alert status="warning" borderRadius="md" size="sm">
                                <AlertIcon />
                                <Text fontSize="sm">
                                  The amount exceeds your available balance after gas fees.
                                </Text>
                              </Alert>
                            )}
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color="gray.500">
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
                        mt={4}
                        leftIcon={<FaExchangeAlt />}
                      >
                        Send {amount || 0} ETH
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
              
              <TabPanel>
                <Card variant="outline">
                  <CardHeader>
                    <Heading size="md">Transaction History</Heading>
                  </CardHeader>
                  <CardBody>
                    {transactions.length > 0 ? (
                      <Box overflowX="auto">
                        <Table size="sm" variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Type</Th>
                              <Th>Amount</Th>
                              <Th>Address</Th>
                              <Th>Date</Th>
                              <Th>Gas Fee</Th>
                              <Th>Status</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {transactions.map((tx) => (
                              <Tr key={tx.hash}>
                                <Td>
                                  <Badge colorScheme={tx.from === wallet.address ? "red" : "green"}>
                                    {tx.from === wallet.address ? "Sent" : "Received"}
                                  </Badge>
                                </Td>
                                <Td fontWeight="medium">
                                  {parseFloat(tx.value).toFixed(6)} {network?.currency || 'ETH'}
                                </Td>
                                <Td isTruncated maxW="150px">
                                  <Tooltip hasArrow label={tx.from === wallet.address ? tx.to : tx.from}>
                                    <Text>
                                      {tx.from === wallet.address 
                                        ? truncateAddress(tx.to)
                                        : truncateAddress(tx.from)}
                                    </Text>
                                  </Tooltip>
                                </Td>
                                <Td>
                                  <Tooltip hasArrow label={new Date(tx.timestamp).toLocaleString()}>
                                    <Text fontSize="sm">{formatTimeAgo(tx.timestamp)}</Text>
                                  </Tooltip>
                                </Td>
                                <Td>
                                  {tx.gasUsed ? (
                                    <Tooltip hasArrow label={`${tx.gasPrice} Gwei`}>
                                      <Text fontSize="sm">{parseFloat(tx.gasUsed).toFixed(6)} ETH</Text>
                                    </Tooltip>
                                  ) : (
                                    <Text fontSize="sm">-</Text>
                                  )}
                                </Td>
                                <Td>
                                  <Badge 
                                    colorScheme={
                                      tx.status === 'confirmed' ? 'green' : 
                                      tx.status === 'pending' ? 'yellow' : 'red'
                                    }
                                  >
                                    {tx.status}
                                  </Badge>
                                </Td>
                                <Td>
                                  <HStack spacing={1}>
                                    <Tooltip hasArrow label="View on Explorer">
                                      <IconButton
                                        aria-label="View on explorer"
                                        icon={<FaExchangeAlt />}
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => {
                                          const network = SUPPORTED_NETWORKS.find(n => n.id === tx.network);
                                          if (network?.explorer) {
                                            window.open(`${network.explorer}/tx/${tx.hash}`, '_blank');
                                          }
                                        }}
                                      />
                                    </Tooltip>
                                    <Tooltip hasArrow label="Copy Transaction Hash">
                                      <IconButton
                                        aria-label="Copy transaction hash"
                                        icon={<FaCopy />}
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => {
                                          navigator.clipboard.writeText(tx.hash);
                                          toast({
                                            title: "Transaction hash copied",
                                            status: "success",
                                            duration: 2000,
                                          });
                                        }}
                                      />
                                    </Tooltip>
                                  </HStack>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    ) : (
                      <VStack py={8} spacing={4}>
                        <Text textAlign="center" color="gray.500">
                          No transactions found for this wallet
                        </Text>
                        <Button 
                          leftIcon={<FaSync />} 
                          size="sm"
                          onClick={() => loadTransactions(wallet.address)}
                        >
                          Refresh Transactions
                        </Button>
                      </VStack>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </GridItem>
      </Grid>
      
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