import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Card,
  CardBody,
  Heading,
  Divider,
  Button,
  useColorModeValue,
  Tooltip,
  Link,
  Spinner,
  Center,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { 
  FaHistory, 
  FaPaperPlane, 
  FaDownload, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaExternalLinkAlt,
  FaCopy,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

interface Transaction {
  hash: string;
  type: 'send' | 'receive' | 'swap' | 'stake' | 'unstake';
  amount: string;
  amountUsd?: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  from: string;
  to: string;
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
  confirmations?: number;
  network: string;
  tokenSymbol?: string;
  tokenAddress?: string;
}

interface TransactionHistoryProps {
  walletAddress: string;
  network: string;
}

export const TransactionHistory = ({ walletAddress, network }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  const bgColor = useColorModeValue('#181a20', '#181a20');
  const cardBg = useColorModeValue('rgba(35, 37, 38, 0.9)', 'rgba(35, 37, 38, 0.9)');
  const borderColor = useColorModeValue('rgba(65, 67, 69, 0.5)', 'rgba(65, 67, 69, 0.5)');
  const textColor = useColorModeValue('#fff', '#fff');
  const mutedTextColor = useColorModeValue('gray.400', 'gray.400');

  // Mock transaction data
  const mockTransactions: Transaction[] = [
    {
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      type: 'receive',
      amount: '0.05',
      amountUsd: '85.50',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'confirmed',
      from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      to: walletAddress,
      gasUsed: '21000',
      gasPrice: '20',
      blockNumber: 12345678,
      confirmations: 12,
      network: 'sepolia',
      tokenSymbol: 'ETH'
    },
    {
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      type: 'send',
      amount: '0.02',
      amountUsd: '34.20',
      timestamp: '2024-01-14T15:45:00Z',
      status: 'confirmed',
      from: walletAddress,
      to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      gasUsed: '21000',
      gasPrice: '25',
      blockNumber: 12345670,
      confirmations: 45,
      network: 'sepolia',
      tokenSymbol: 'ETH'
    },
    {
      hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
      type: 'swap',
      amount: '0.01',
      amountUsd: '17.10',
      timestamp: '2024-01-13T09:15:00Z',
      status: 'pending',
      from: walletAddress,
      to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      gasUsed: '150000',
      gasPrice: '30',
      blockNumber: 12345665,
      confirmations: 0,
      network: 'sepolia',
      tokenSymbol: 'ETH'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setTransactions(mockTransactions);
      setLoading(false);
    }, 1000);
  }, [walletAddress]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'green';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'send': return 'red';
      case 'receive': return 'green';
      case 'swap': return 'purple';
      case 'stake': return 'blue';
      case 'unstake': return 'orange';
      default: return 'gray';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'send': return FaPaperPlane;
      case 'receive': return FaDownload;
      case 'swap': return FaHistory;
      case 'stake': return FaHistory;
      case 'unstake': return FaHistory;
      default: return FaHistory;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === 'all' || tx.type === filter;
    const matchesSearch = tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.amount.includes(searchTerm) ||
                         formatAddress(tx.from).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formatAddress(tx.to).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: transactions.length,
    confirmed: transactions.filter(tx => tx.status === 'confirmed').length,
    pending: transactions.filter(tx => tx.status === 'pending').length,
    failed: transactions.filter(tx => tx.status === 'failed').length,
  };

  if (loading) {
    return (
      <Box p={6}>
        <Center>
          <VStack spacing={4}>
            <Spinner size="xl" color="purple.500" />
            <Text color={mutedTextColor}>Loading transaction history...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" color={textColor} mb={4}>Transaction History</Heading>
          <Text color={mutedTextColor} mb={6}>
            View all transactions for wallet {formatAddress(walletAddress)}
          </Text>
        </Box>

        {/* Stats */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
            <CardBody p={4}>
              <Stat>
                <StatLabel color={mutedTextColor}>Total</StatLabel>
                <StatNumber color={textColor} fontSize="xl">{stats.total}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
            <CardBody p={4}>
              <Stat>
                <StatLabel color={mutedTextColor}>Confirmed</StatLabel>
                <StatNumber color="green.400" fontSize="xl">{stats.confirmed}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
            <CardBody p={4}>
              <Stat>
                <StatLabel color={mutedTextColor}>Pending</StatLabel>
                <StatNumber color="yellow.400" fontSize="xl">{stats.pending}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
            <CardBody p={4}>
              <Stat>
                <StatLabel color={mutedTextColor}>Failed</StatLabel>
                <StatNumber color="red.400" fontSize="xl">{stats.failed}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
          <CardBody p={6}>
            <HStack spacing={4} mb={4}>
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <Icon as={FaSearch} color={mutedTextColor} />
                </InputLeftElement>
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg="rgba(0,0,0,0.2)"
                  borderColor={borderColor}
                  color={textColor}
                  _placeholder={{ color: mutedTextColor }}
                />
              </InputGroup>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                maxW="200px"
                bg="rgba(0,0,0,0.2)"
                borderColor={borderColor}
                color={textColor}
              >
                <option value="all" style={{ background: '#181a20', color: '#fff' }}>All Types</option>
                <option value="send" style={{ background: '#181a20', color: '#fff' }}>Send</option>
                <option value="receive" style={{ background: '#181a20', color: '#fff' }}>Receive</option>
                <option value="swap" style={{ background: '#181a20', color: '#fff' }}>Swap</option>
                <option value="stake" style={{ background: '#181a20', color: '#fff' }}>Stake</option>
                <option value="unstake" style={{ background: '#181a20', color: '#fff' }}>Unstake</option>
              </Select>
            </HStack>
          </CardBody>
        </Card>

        {/* Transactions */}
        <VStack spacing={4} align="stretch">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx, index) => (
              <MotionCard
                key={tx.hash}
                bg={cardBg}
                borderColor={borderColor}
                borderRadius="xl"
                overflow="hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.01, boxShadow: 'xl' }}
              >
                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    {/* Header */}
                    <HStack justify="space-between" align="start">
                      <HStack spacing={3}>
                        <Icon 
                          as={getTypeIcon(tx.type)} 
                          color={`${getTypeColor(tx.type)}.400`} 
                          boxSize={5} 
                        />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" color={textColor} textTransform="capitalize">
                            {tx.type}
                          </Text>
                          <Text fontSize="sm" color={mutedTextColor}>
                            {formatDate(tx.timestamp)}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <VStack align="end" spacing={1}>
                        <Badge colorScheme={getStatusColor(tx.status)} variant="solid" borderRadius="full">
                          {tx.status}
                        </Badge>
                        <HStack spacing={2}>
                          <Text fontSize="lg" fontWeight="bold" color={textColor}>
                            {tx.amount} {tx.tokenSymbol}
                          </Text>
                          {tx.amountUsd && (
                            <Text fontSize="sm" color={mutedTextColor}>
                              (${tx.amountUsd})
                            </Text>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>

                    {/* Transaction Hash */}
                    <HStack justify="space-between" align="center">
                      <Text fontSize="sm" color={mutedTextColor}>Transaction Hash:</Text>
                      <HStack spacing={2}>
                        <Text fontSize="sm" fontFamily="mono" color={textColor}>
                          {formatAddress(tx.hash)}
                        </Text>
                        <Tooltip hasArrow label="Copy Hash">
                          <IconButton
                            aria-label="Copy transaction hash"
                            icon={<FaCopy />}
                            size="xs"
                            variant="ghost"
                            color={textColor}
                            onClick={() => {
                              navigator.clipboard.writeText(tx.hash);
                            }}
                          />
                        </Tooltip>
                        <Tooltip hasArrow label="View on Explorer">
                          <IconButton
                            aria-label="View on explorer"
                            icon={<FaExternalLinkAlt />}
                            size="xs"
                            variant="ghost"
                            color={textColor}
                            onClick={() => {
                              window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, '_blank');
                            }}
                          />
                        </Tooltip>
                      </HStack>
                    </HStack>

                    {/* Addresses */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color={mutedTextColor} mb={1}>From:</Text>
                        <Text fontSize="sm" fontFamily="mono" color={textColor}>
                          {formatAddress(tx.from)}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color={mutedTextColor} mb={1}>To:</Text>
                        <Text fontSize="sm" fontFamily="mono" color={textColor}>
                          {formatAddress(tx.to)}
                        </Text>
                      </Box>
                    </SimpleGrid>

                    {/* Details Toggle */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDetails({ ...showDetails, [tx.hash]: !showDetails[tx.hash] })}
                      leftIcon={showDetails[tx.hash] ? <FaEyeSlash /> : <FaEye />}
                      color={mutedTextColor}
                    >
                      {showDetails[tx.hash] ? 'Hide Details' : 'Show Details'}
                    </Button>

                    {/* Expanded Details */}
                    {showDetails[tx.hash] && (
                      <Box p={4} bg="rgba(0,0,0,0.2)" borderRadius="md">
                        <VStack spacing={3} align="stretch">
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <Box>
                              <Text fontSize="sm" color={mutedTextColor}>Block Number:</Text>
                              <Text fontSize="sm" color={textColor}>{tx.blockNumber}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" color={mutedTextColor}>Confirmations:</Text>
                              <Text fontSize="sm" color={textColor}>{tx.confirmations}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" color={mutedTextColor}>Gas Used:</Text>
                              <Text fontSize="sm" color={textColor}>{tx.gasUsed}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" color={mutedTextColor}>Gas Price:</Text>
                              <Text fontSize="sm" color={textColor}>{tx.gasPrice} Gwei</Text>
                            </Box>
                          </SimpleGrid>
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </MotionCard>
            ))
          ) : (
            <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
              <CardBody p={8}>
                <Center>
                  <VStack spacing={4}>
                    <Icon as={FaHistory} color={mutedTextColor} boxSize={12} />
                    <Text color={textColor} fontWeight="bold">No Transactions Found</Text>
                    <Text color={mutedTextColor} textAlign="center">
                      {searchTerm || filter !== 'all' 
                        ? 'No transactions match your current filters.'
                        : 'This wallet has no transaction history yet.'
                      }
                    </Text>
                  </VStack>
                </Center>
              </CardBody>
            </Card>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};

export default TransactionHistory; 