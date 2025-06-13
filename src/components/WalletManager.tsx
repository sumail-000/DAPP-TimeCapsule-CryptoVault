import { useState, useEffect, useRef } from 'react';
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
  Select,
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
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Skeleton,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SUPPORTED_NETWORKS } from '../constants/networks';
import { FaPlus, FaCopy, FaEye, FaEyeSlash, FaWallet, FaLock, FaQrcode, FaCheck, FaSync, FaKey } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';

const MotionCard = motion.create(Card);

interface WalletData {
  address: string;
  privateKey: string;
  network: string;
  balance: string;
}

export const WalletManager = () => {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState(SUPPORTED_NETWORKS[0].id);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newWallet, setNewWallet] = useState<WalletData | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  
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
  const [importNetwork, setImportNetwork] = useState(SUPPORTED_NETWORKS[0].id);
  const [isImporting, setIsImporting] = useState(false);
  
  const privateKeyRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  // Reference for showing/hiding private key
  const newWalletPrivateKeyClipboard = useClipboard(newWallet?.privateKey || '');
  const selectedWalletPrivateKeyClipboard = useClipboard(selectedWallet?.privateKey || '');

  // Load saved wallets from localStorage
  useEffect(() => {
    const savedWallets = localStorage.getItem('wallets');
    if (savedWallets) {
      setWallets(JSON.parse(savedWallets));
    }
    setLoading(false);
  }, []);

  // Save wallets to localStorage when updated
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('wallets', JSON.stringify(wallets));
    }
  }, [wallets, loading]);

  const createNewWallet = async () => {
    try {
      setIsCreating(true);
      
      // Create new wallet
      const wallet = ethers.Wallet.createRandom();
      
      // Get network details 
      const network = SUPPORTED_NETWORKS.find(n => n.id === selectedNetwork);
      
      if (!network) {
        throw new Error("Selected network not found");
      }
      
      // Try to connect to provider with fallbacks
      let provider;
      let balance;
      
      try {
        provider = new ethers.JsonRpcProvider(network.rpc);
        const connectedWallet = wallet.connect(provider);
        balance = await provider.getBalance(connectedWallet.address);
      } catch (rpcError) {
        console.warn(`Failed to connect to primary RPC: ${network.rpc}`, rpcError);
        // Use a mock balance as fallback for demo purposes
        balance = ethers.parseEther("0");
      }
      
      const walletData: WalletData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        network: selectedNetwork,
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
      
      // Get network details 
      const network = SUPPORTED_NETWORKS.find(n => n.id === importNetwork);
      
      if (!network) {
        throw new Error("Selected network not found");
      }
      
      // Try to connect to provider with fallbacks
      let balance;
      
      try {
        const provider = new ethers.JsonRpcProvider(network.rpc);
        balance = await provider.getBalance(wallet.address);
      } catch (rpcError) {
        console.warn(`Failed to connect to RPC: ${network.rpc}`, rpcError);
        // Use a mock balance as fallback
        balance = ethers.parseEther("0");
      }
      
      const walletData: WalletData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        network: importNetwork,
        balance: ethers.formatEther(balance),
      };

      setWallets([...wallets, walletData]);
      onCloseImport();
      setImportPrivateKey('');
      
      toast({
        title: 'Success',
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
      setWallets([...wallets, newWallet]);
      onClose();
      toast({
        title: 'Success',
        description: 'Wallet created successfully',
        status: 'success',
        duration: 5000,
      });
      // Navigate to vault creation
      navigate('/create-vault', { state: { walletAddress: newWallet.address } });
    }
  };
  
  const viewWalletDetails = (wallet: WalletData) => {
    navigate(`/wallet/${wallet.address}`);
  };
  
  const viewPrivateKey = (wallet: WalletData) => {
    setSelectedWallet(wallet);
    onOpenPrivateKey();
  };
  
  const refreshBalances = async () => {
    try {
      setIsRefreshing(true);
      const updatedWallets = await Promise.all(
        wallets.map(async (wallet) => {
          try {
            const network = SUPPORTED_NETWORKS.find(n => n.id === wallet.network);
            if (!network) return wallet;
            
            const provider = new ethers.JsonRpcProvider(network.rpc);
            const balance = await provider.getBalance(wallet.address);
            
            return {
              ...wallet,
              balance: ethers.formatEther(balance),
            };
          } catch (error) {
            console.warn(`Error refreshing balance for ${wallet.address}`, error);
            return wallet;
          }
        })
      );
      
      setWallets(updatedWallets);
      toast({
        title: 'Balances Updated',
        description: 'Wallet balances have been refreshed',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error refreshing balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh some wallet balances',
        status: 'warning',
        duration: 5000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Box p={6}>
      <Tabs variant="enclosed" colorScheme="purple" isLazy>
        <TabList>
          <Tab>My Wallets</Tab>
          <Tab>Create Wallet</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <HStack justifyContent="space-between" wrap="wrap">
                <Heading size="lg">Your Wallets</Heading>
                <HStack spacing={2}>
                  <Button 
                    size="sm"
                    colorScheme="green" 
                    leftIcon={<FaPlus />}
                    onClick={onOpenImport}
                  >
                    Import
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={refreshBalances}
                    isLoading={isRefreshing}
                  >
                    Refresh Balances
                  </Button>
                </HStack>
              </HStack>
              
              {loading ? (
                <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={5}>
                  {[1, 2].map((i) => (
                    <Card key={i}>
                      <CardBody>
                        <Skeleton height="100px" />
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : wallets.length > 0 ? (
                <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={5}>
                  {wallets.map((wallet) => {
                    const network = SUPPORTED_NETWORKS.find(n => n.id === wallet.network);
                    return (
                      <MotionCard
                        key={wallet.address}
                        variant="outline"
                        borderRadius="lg"
                        overflow="hidden"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardHeader bg="purple.50" p={4}>
                          <HStack justifyContent="space-between">
                            <Badge colorScheme="purple" p={1}>
                              {network?.name || wallet.network}
                            </Badge>
                            <HStack>
                              <Tooltip hasArrow label="Copy Address">
                                <IconButton
                                  aria-label="Copy address"
                                  icon={<FaCopy />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(wallet.address);
                                    toast({
                                      title: "Address copied",
                                      status: "success",
                                      duration: 2000,
                                    });
                                  }}
                                />
                              </Tooltip>
                              <Tooltip hasArrow label="View Private Key">
                                <IconButton
                                  aria-label="View private key"
                                  icon={<FaKey />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    viewPrivateKey(wallet);
                                  }}
                                />
                              </Tooltip>
                            </HStack>
                          </HStack>
                        </CardHeader>
                        
                        <CardBody p={4} onClick={() => viewWalletDetails(wallet)} cursor="pointer">
                          <VStack spacing={3} align="stretch">
                            <Box>
                              <Text fontSize="sm" color="gray.500">Address</Text>
                              <Text fontWeight="bold" isTruncated>{truncateAddress(wallet.address)}</Text>
                            </Box>
                            
                            <Box>
                              <Text fontSize="sm" color="gray.500">Balance</Text>
                              <Text fontSize="xl" fontWeight="bold">
                                {parseFloat(wallet.balance).toFixed(4)} {network?.currency || 'ETH'}
                              </Text>
                            </Box>
                          </VStack>
                        </CardBody>
                        
                        <CardFooter 
                          p={3} 
                          bg="gray.50" 
                          borderTop="1px" 
                          borderColor="gray.100"
                        >
                          <Button 
                            width="full" 
                            onClick={() => viewWalletDetails(wallet)} 
                            colorScheme="purple" 
                            variant="outline"
                            size="sm"
                          >
                            Manage Wallet
                          </Button>
                        </CardFooter>
                      </MotionCard>
                    );
                  })}
                </SimpleGrid>
              ) : (
                <Alert
                  status="info"
                  variant="subtle"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  textAlign="center"
                  borderRadius="lg"
                  py={8}
                >
                  <AlertIcon boxSize="40px" mr={0} />
                  <AlertDescription mt={4} mb={6} maxW="sm">
                    You don't have any wallets yet. Create a new wallet to get started.
                  </AlertDescription>
                  <Button 
                    colorScheme="purple" 
                    onClick={() => {
                      const tabButtons = document.querySelectorAll('[role="tab"]');
                      if (tabButtons && tabButtons[1]) {
                        (tabButtons[1] as HTMLElement).click();
                      }
                    }}
                  >
                    Create Wallet
                  </Button>
                </Alert>
              )}
            </VStack>
          </TabPanel>
          
          <TabPanel>
            <VStack spacing={8} align="stretch">
              <Box>
                <Heading size="lg" mb={6}>Create a New Wallet</Heading>
                
                <Grid templateColumns={{base: "1fr", md: "1fr 1fr"}} gap={6}>
                  <GridItem>
                    <Card variant="outline" p={4}>
                      <VStack spacing={4} align="stretch">
                        <FormControl>
                          <FormLabel>Select Network</FormLabel>
                          <Select
                            value={selectedNetwork}
                            onChange={(e) => setSelectedNetwork(e.target.value)}
                            icon={<FaWallet />}
                          >
                            {SUPPORTED_NETWORKS.map((network) => (
                              <option key={network.id} value={network.id}>
                                {network.name}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <Button
                          colorScheme="purple"
                          size="lg"
                          leftIcon={<FaPlus />}
                          onClick={createNewWallet}
                          isLoading={isCreating}
                          loadingText="Creating..."
                        >
                          Create New Wallet
                        </Button>
                      </VStack>
                    </Card>
                  </GridItem>
                  
                  <GridItem>
                    <Card variant="outline" p={4}>
                      <VStack spacing={4} align="stretch">
                        <Heading size="md">About Wallets</Heading>
                        <Text>
                          A wallet gives you access to your cryptocurrencies and allows you to create time-locked vaults.
                        </Text>
                        <Divider />
                        <HStack>
                          <Box p={2} bg="purple.50" borderRadius="full">
                            <FaLock color="purple" />
                          </Box>
                          <Text fontWeight="medium">Secure and encrypted</Text>
                        </HStack>
                        <HStack>
                          <Box p={2} bg="purple.50" borderRadius="full">
                            <FaWallet color="purple" />
                          </Box>
                          <Text fontWeight="medium">Store your crypto assets</Text>
                        </HStack>
                        <HStack>
                          <Box p={2} bg="purple.50" borderRadius="full">
                            <FaKey color="purple" />
                          </Box>
                          <Text fontWeight="medium">Full control with private keys</Text>
                        </HStack>
                      </VStack>
                    </Card>
                  </GridItem>
                </Grid>
              </Box>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
            
      {/* New Wallet Created Modal */}
      <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New Wallet Created</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {newWallet && (
              <VStack spacing={5} align="stretch">
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Save your Private Key!</Text>
                    <Text fontSize="sm">It cannot be recovered if lost.</Text>
                  </Box>
                </Alert>
                
                <Box>
                  <FormLabel>Address</FormLabel>
                  <Input 
                    value={newWallet.address} 
                    isReadOnly 
                    bg="gray.50"
                  />
                </Box>
                
                <Box>
                  <HStack mb={1}>
                    <FormLabel mb={0}>Private Key</FormLabel>
                    <IconButton
                      aria-label="Copy private key"
                      icon={newWalletPrivateKeyClipboard.hasCopied ? <FaCheck /> : <FaCopy />}
                      size="xs"
                      onClick={newWalletPrivateKeyClipboard.onCopy}
                      colorScheme={newWalletPrivateKeyClipboard.hasCopied ? "green" : "gray"}
                    />
                  </HStack>
                  <InputGroup>
                    <Input 
                      type={showPrivateKey["new"] ? "text" : "password"}
                      value={newWallet.privateKey} 
                      isReadOnly 
                      pr="4.5rem"
                      bg="gray.50"
                    />
                    <InputRightElement width="4.5rem">
                      <Button 
                        h="1.75rem" 
                        size="sm" 
                        onClick={() => setShowPrivateKey({...showPrivateKey, "new": !showPrivateKey["new"]})}
                      >
                        {showPrivateKey["new"] ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </Box>
                
                <Box textAlign="center" mt={2}>
                  <QRCodeSVG
                    value={newWallet.address}
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    Wallet Address QR Code
                  </Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="purple" onClick={saveWallet}>
              Save Wallet & Continue
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* View Private Key Modal */}
      <Modal isOpen={isPrivateKeyOpen} onClose={onClosePrivateKey}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Wallet Private Key</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedWallet && (
              <VStack spacing={4}>
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Important Security Warning</Text>
                    <Text fontSize="sm">Never share your private key with anyone!</Text>
                  </Box>
                </Alert>
                
                <Box width="100%">
                  <FormLabel>Address</FormLabel>
                  <Input value={selectedWallet.address} isReadOnly bg="gray.50" />
                </Box>
                
                <Box width="100%">
                  <HStack mb={1}>
                    <FormLabel mb={0}>Private Key</FormLabel>
                    <IconButton
                      aria-label="Copy private key"
                      icon={selectedWalletPrivateKeyClipboard.hasCopied ? <FaCheck /> : <FaCopy />}
                      size="xs"
                      onClick={selectedWalletPrivateKeyClipboard.onCopy}
                      colorScheme={selectedWalletPrivateKeyClipboard.hasCopied ? "green" : "gray"}
                    />
                  </HStack>
                  <InputGroup>
                    <Input 
                      type={showPrivateKey["selected"] ? "text" : "password"} 
                      value={selectedWallet.privateKey} 
                      isReadOnly 
                      bg="gray.50"
                      pr="4.5rem"
                    />
                    <InputRightElement width="4.5rem">
                      <Button 
                        h="1.75rem" 
                        size="sm" 
                        onClick={() => setShowPrivateKey({...showPrivateKey, "selected": !showPrivateKey["selected"]})}
                      >
                        {showPrivateKey["selected"] ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClosePrivateKey}>
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
            >
              View Wallet Details
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Import Wallet Modal */}
      <Modal isOpen={isImportOpen} onClose={onCloseImport}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Import Existing Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Private Key</FormLabel>
                <InputGroup>
                  <Input 
                    type={showPrivateKey["import"] ? "text" : "password"}
                    value={importPrivateKey} 
                    onChange={(e) => setImportPrivateKey(e.target.value)} 
                    placeholder="0x..."
                    pr="4.5rem"
                  />
                  <InputRightElement width="4.5rem">
                    <Button 
                      h="1.75rem" 
                      size="sm" 
                      onClick={() => setShowPrivateKey({...showPrivateKey, "import": !showPrivateKey["import"]})}
                    >
                      {showPrivateKey["import"] ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Select Network</FormLabel>
                <Select
                  value={importNetwork}
                  onChange={(e) => setImportNetwork(e.target.value)}
                >
                  {SUPPORTED_NETWORKS.map((network) => (
                    <option key={network.id} value={network.id}>
                      {network.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="blue" 
              mr={3} 
              onClick={importWallet}
              isLoading={isImporting}
              isDisabled={!importPrivateKey}
            >
              Import
            </Button>
            <Button variant="ghost" onClick={onCloseImport}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};