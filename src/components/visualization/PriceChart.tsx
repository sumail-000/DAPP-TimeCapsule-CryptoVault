import { useState, useEffect } from 'react';
import { Box, Heading, Text, Spinner, Center, useColorModeValue } from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface PriceChartProps {
  targetPrice: number;
  currentPrice: number;
  isPriceLocked: boolean;
}

interface PriceData {
  timestamp: number;
  price: number;
}

const PriceChart = ({ targetPrice, currentPrice, isPriceLocked }: PriceChartProps) => {
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const lineColor = useColorModeValue('purple.500', 'purple.300');
  const gridColor = useColorModeValue('gray.200', 'gray.600');
  const referenceLineColor = useColorModeValue('red.500', 'red.300');
  
  // Fetch historical price data
  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setIsLoading(true);
        
        // For now, we'll generate mock data
        // In a production app, you would fetch this from an API like CoinGecko
        const mockData: PriceData[] = [];
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        // Generate 14 days of mock data
        for (let i = 14; i >= 0; i--) {
          const timestamp = now - (i * oneDayMs);
          // Create some variation around the current price
          const randomFactor = 0.9 + (Math.random() * 0.2); // Between 0.9 and 1.1
          const price = currentPrice * randomFactor;
          mockData.push({ timestamp, price });
        }
        
        setPriceHistory(mockData);
      } catch (err) {
        console.error('Error fetching price history:', err);
        setError('Failed to load price history data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPriceHistory();
  }, [currentPrice]);
  
  // Custom tooltip formatter
  const formatTooltip = (value: number) => {
    return [`$${value.toFixed(2)}`, 'ETH Price'];
  };
  
  // Date formatter for X-axis
  const formatXAxis = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM dd');
  };
  
  if (isLoading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="purple.500" />
      </Center>
    );
  }
  
  if (error) {
    return (
      <Center py={10}>
        <Text color="red.500">{error}</Text>
      </Center>
    );
  }
  
  return (
    <Box p={4} borderRadius="lg" bg={useColorModeValue('white', 'gray.700')} shadow="sm" mb={6}>
      <Heading size="md" mb={4}>ETH Price History</Heading>
      
      <Box height="300px">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={priceHistory}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis} 
              stroke={useColorModeValue('gray.500', 'gray.400')}
            />
            <YAxis 
              domain={['auto', 'auto']}
              stroke={useColorModeValue('gray.500', 'gray.400')}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={lineColor} 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            
            {/* Target price reference line */}
            {isPriceLocked && (
              <ReferenceLine 
                y={targetPrice / 1e8} 
                stroke={referenceLineColor} 
                strokeDasharray="3 3"
                label={{ 
                  value: `Target: $${(targetPrice / 1e8).toFixed(2)}`,
                  position: 'insideTopRight',
                  fill: referenceLineColor,
                  fontSize: 12
                }}
              />
            )}
            
            {/* Current price reference line */}
            <ReferenceLine 
              y={currentPrice / 1e8} 
              stroke="green" 
              strokeDasharray="3 3"
              label={{ 
                value: `Current: $${(currentPrice / 1e8).toFixed(2)}`,
                position: 'insideBottomRight',
                fill: 'green',
                fontSize: 12
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      
      {isPriceLocked && (
        <Text fontSize="sm" mt={2} color={useColorModeValue('gray.600', 'gray.300')}>
          {targetPrice > currentPrice 
            ? `ETH needs to increase by $${((targetPrice - currentPrice) / 1e8).toFixed(2)} to unlock this vault.`
            : 'Target price reached! Vault can be unlocked.'}
        </Text>
      )}
    </Box>
  );
};

export default PriceChart; 