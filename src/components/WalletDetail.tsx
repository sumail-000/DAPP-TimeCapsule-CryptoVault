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
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCopy, FaEye, FaEyeSlash, FaQrcode, FaExchangeAlt, FaTrash, FaKey, FaEdit, FaDownload, FaInfoCircle, FaSync, FaCheck } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import { SUPPORTED_NETWORKS, Network } from '../constants/networks';

const MotionBox = motion.create(Box);

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
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

  const loadTransactions = async (walletAddress: string) => {
    // This would normally fetch from a blockchain explorer API
    // For now, we'll use mock data
    const mockTransactions: Transaction[] = [
      {
        hash: '0x123abc456def789ghi',
        from: walletAddress,
        to: '0x456def789ghi123abc',
        value: '0.1',
        timestamp: Date.now() - 86400000, // 1 day ago
        status: 'confirmed',
      },
      {
        hash: '0x789ghi123abc456def',
        from: '0x987zyx654wvu321tsr',
        to: walletAddress,
        value: '0.5',
        timestamp: Date.now() - 172800000, // 2 days ago
        status: 'confirmed',
      }
    ];
    setTransactions(mockTransactions);
  };

  const handleSendTransaction = async () => {
    if (!wallet || !recipient || !amount) return;

    try {
      setIsSending(true);
      
      // Validate address
      if (!ethers.isAddress(recipient)) {
        throw new Error('Invalid recipient address');
      }
      
      // Connect to network
      const network = SUPPORTED_NETWORKS.find(n => n.id === wallet.network);
      if (!network) {
        throw new Error('Network not found');
      }
      
      const provider = new ethers.JsonRpcProvider(network.rpc);
      
      // Create wallet instance
      const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
      
      // Check balance
      const currentBalance = await provider.getBalance(wallet.address);
      const sendAmount = ethers.parseEther(amount);
      
      if (sendAmount > currentBalance) {
        throw new Error('Insufficient balance');
      }
      
      // Send transaction
      const tx = await walletInstance.sendTransaction({
        to: recipient,
        value: sendAmount,
      });
      
      toast({
        title: 'Transaction Submitted',
        description: `Transaction hash: ${tx.hash}`,
        status: 'info',
        duration: 5000,
      });
      
      // Wait for confirmation
      await tx.wait();
      
      // Update balance
      const newBalance = await provider.getBalance(wallet.address);
      const formattedBalance = ethers.formatEther(newBalance);
      setBalance(formattedBalance);
      
      // Update wallet in storage
      const updatedWallet = {...wallet, balance: formattedBalance};
      updateWalletInStorage(updatedWallet);
      
      // Add transaction to list
      const newTransaction: Transaction = {
        hash: tx.hash,
        from: wallet.address,
        to: recipient,
        value: amount,
        timestamp: Date.now(),
        status: 'confirmed',
      };
      
      setTransactions([newTransaction, ...transactions]);
      
      // Clear form
      setRecipient('');
      setAmount('');
      
      toast({
        title: 'Success',
        description: 'Transaction sent successfully',
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
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.0"
                            size="lg"
                            min="0"
                            step="0.0001"
                          />
                          <InputRightElement width="4.5rem">
                            <Button h="1.75rem" size="sm" onClick={() => setAmount(balance)}>
                              Max
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                        <FormHelperText>Available: {balance} {network?.currency || 'ETH'}</FormHelperText>
                      </FormControl>

                      <Button
                        colorScheme="purple"
                        size="lg"
                        isLoading={isSending}
                        loadingText="Sending..."
                        onClick={handleSendTransaction}
                        isDisabled={!recipient || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance)}
                        mt={4}
                      >
                        Send Transaction
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
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>Type</Th>
                            <Th>Amount</Th>
                            <Th>Address</Th>
                            <Th>Date</Th>
                            <Th>Status</Th>
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
                              <Td>{tx.value} {network?.currency || 'ETH'}</Td>
                              <Td isTruncated maxW="200px">
                                {tx.from === wallet.address 
                                  ? truncateAddress(tx.to)
                                  : truncateAddress(tx.from)}
                              </Td>
                              <Td>{formatDate(tx.timestamp)}</Td>
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
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    ) : (
                      <Text textAlign="center" py={4} color="gray.500">
                        No transactions found for this wallet
                      </Text>
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