import { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Badge, 
  Spinner, 
  Center, 
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  HStack
} from '@chakra-ui/react';
import { format } from 'date-fns';

interface VaultPerformanceTrackerProps {
  vaultAddress: string;
  creationTime?: number;
  initialDeposit?: bigint;
  currentBalance: bigint;
  targetPrice?: number;
  isPriceLocked: boolean;
  isTimeLocked: boolean;
}

interface PriceSnapshot {
  timestamp: number;
  price: number;
}

const VaultPerformanceTracker = ({ 
  vaultAddress, 
  creationTime = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60, // Default to 30 days ago
  initialDeposit = BigInt(0),
  currentBalance,
  targetPrice = 0,
  isPriceLocked,
  isTimeLocked
}: VaultPerformanceTrackerProps) => {
  const [priceHistory, setPriceHistory] = useState<PriceSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    initialPrice: 0,
    currentPrice: 0,
    priceChange: 0,
    priceChangePercent: 0,
    timeElapsed: 0,
    timeRemaining: 0,
    progressPercent: 0
  });
  
  // Move all hooks to the top, before any conditional logic
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const tableBorderColor = useColorModeValue('gray.200', 'gray.600');
  const boxBg = useColorModeValue('white', 'gray.700');
  
  // Format time elapsed
  const formatTimeElapsed = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setIsLoading(true);
        
        // For now, we'll generate mock data
        // In a production app, you would fetch this from an API
        const mockData: PriceSnapshot[] = [];
        const now = Date.now() / 1000; // Current time in seconds
        const creationTimeSeconds = creationTime;
        const daySeconds = 24 * 60 * 60;
        
        // Generate price snapshots from creation to now
        const daysSinceCreation = Math.ceil((now - creationTimeSeconds) / daySeconds);
        const currentMockPrice = 2000 + Math.random() * 500; // Mock current price
        
        // Generate daily snapshots
        for (let i = daysSinceCreation; i >= 0; i--) {
          const timestamp = creationTimeSeconds + (daysSinceCreation - i) * daySeconds;
          // Create some variation in price
          const randomFactor = 0.9 + (Math.random() * 0.2); // Between 0.9 and 1.1
          const price = currentMockPrice * randomFactor;
          mockData.push({ timestamp, price });
        }
        
        setPriceHistory(mockData);
        
        // Calculate performance metrics
        if (mockData.length > 0) {
          const initialPrice = mockData[0].price;
          const currentPrice = mockData[mockData.length - 1].price;
          const priceChange = currentPrice - initialPrice;
          const priceChangePercent = (priceChange / initialPrice) * 100;
          
          // Calculate time metrics
          const timeElapsed = now - creationTimeSeconds;
          let timeRemaining = 0;
          let progressPercent = 100;
          
          if (isTimeLocked && targetPrice > 0) {
            // For combined time and price locks
            const targetTime = creationTimeSeconds + targetPrice; // Using targetPrice as seconds for this example
            timeRemaining = Math.max(0, targetTime - now);
            const totalDuration = targetTime - creationTimeSeconds;
            progressPercent = Math.min(100, (timeElapsed / totalDuration) * 100);
          } else if (isTimeLocked) {
            // For time locks only
            const targetTime = creationTimeSeconds + targetPrice; // Using targetPrice as seconds for this example
            timeRemaining = Math.max(0, targetTime - now);
            const totalDuration = targetTime - creationTimeSeconds;
            progressPercent = Math.min(100, (timeElapsed / totalDuration) * 100);
          } else if (isPriceLocked) {
            // For price locks only
            progressPercent = Math.min(100, (currentPrice / targetPrice) * 100);
          }
          
          setPerformanceMetrics({
            initialPrice,
            currentPrice,
            priceChange,
            priceChangePercent,
            timeElapsed,
            timeRemaining,
            progressPercent
          });
        }
        
      } catch (err) {
        console.error('Error fetching price history:', err);
        setError('Failed to load performance data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPriceHistory();
  }, [vaultAddress, creationTime, targetPrice, isPriceLocked, isTimeLocked]);
  
  // Render loading state
  if (isLoading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="purple.500" />
      </Center>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Center py={10}>
        <Text color="red.500">{error}</Text>
      </Center>
    );
  }
  
  return (
    <Box p={4} borderRadius="lg" bg={boxBg} shadow="sm" mb={6}>
      <Heading size="md" mb={4}>Vault Performance Metrics</Heading>
      
      {/* Performance Stats */}
      <StatGroup mb={6}>
        <Stat>
          <StatLabel>ETH Price Change</StatLabel>
          <StatNumber>${performanceMetrics.currentPrice.toFixed(2)}</StatNumber>
          <StatHelpText>
            <StatArrow type={performanceMetrics.priceChange >= 0 ? 'increase' : 'decrease'} />
            {performanceMetrics.priceChangePercent.toFixed(2)}%
          </StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel>Time Elapsed</StatLabel>
          <StatNumber>{formatTimeElapsed(performanceMetrics.timeElapsed)}</StatNumber>
          <StatHelpText>
            Since vault creation
          </StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel>Progress</StatLabel>
          <StatNumber>{performanceMetrics.progressPercent.toFixed(0)}%</StatNumber>
          <StatHelpText>
            {isPriceLocked ? 'Toward price target' : 'Toward time unlock'}
          </StatHelpText>
        </Stat>
      </StatGroup>
      
      {/* Price History Table */}
      <Box overflowX="auto">
        <Heading size="sm" mb={2}>Price History</Heading>
        <Table variant="simple" size="sm">
          <Thead bg={tableHeaderBg}>
            <Tr>
              <Th>Date</Th>
              <Th isNumeric>ETH Price</Th>
              <Th isNumeric>Change</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {priceHistory.map((snapshot, index) => {
              // Calculate price change from previous day
              const prevPrice = index > 0 ? priceHistory[index - 1].price : snapshot.price;
              const priceChange = snapshot.price - prevPrice;
              const priceChangePercent = (priceChange / prevPrice) * 100;
              
              // Determine status based on target price (for price-locked vaults)
              let status = 'Locked';
              let statusColor = 'yellow';
              
              if (isPriceLocked && snapshot.price >= targetPrice) {
                status = 'Unlockable';
                statusColor = 'green';
              } else if (!isPriceLocked && !isTimeLocked) {
                status = 'No Lock';
                statusColor = 'gray';
              }
              
              return (
                <Tr key={snapshot.timestamp}>
                  <Td>{format(new Date(snapshot.timestamp * 1000), 'MMM dd, yyyy')}</Td>
                  <Td isNumeric>${snapshot.price.toFixed(2)}</Td>
                  <Td isNumeric>
                    <HStack justifyContent="flex-end" spacing={1}>
                      <Text color={priceChange >= 0 ? 'green.500' : 'red.500'}>
                        {priceChange >= 0 ? '↑' : '↓'} {priceChangePercent.toFixed(2)}%
                      </Text>
                    </HStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={statusColor}>{status}</Badge>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
      
      <Text fontSize="xs" color="gray.500" mt={2}>
        Note: Historical data is for demonstration purposes only.
      </Text>
    </Box>
  );
};

export default VaultPerformanceTracker; 