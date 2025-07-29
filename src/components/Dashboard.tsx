import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Grid,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Flex,
  Icon,
  Divider,
  SimpleGrid,
  useColorModeValue,
  CircularProgress,
  CircularProgressLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
} from '@chakra-ui/react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from 'recharts';
import {
  FaWallet,
  FaLock,
  FaCoins,
  FaCalendarAlt,
  FaChartLine,
  FaBullseye,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { useVault } from '../hooks/useVault';
import { formatEther } from 'viem';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

interface PortfolioData {
  totalValue: number;
  totalLocked: number;
  totalUnlocked: number;
  totalVaults: number;
  activeGoals: number;
  completedGoals: number;
  avgLockDuration: number;
  successRate: number;
}

interface GoalProgress {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  progress: number;
  category: string;
  deadline?: Date;
  status: 'active' | 'completed' | 'overdue';
}

interface PerformanceData {
  date: string;
  totalValue: number;
  locked: number;
  unlocked: number;
  goals: number;
}

const Dashboard: React.FC = () => {
  const { vaults } = useVault();
  const [timeframe, setTimeframe] = useState('30d');
  const [forceRefresh, setForceRefresh] = useState(0);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  const bgColor = useColorModeValue('#f7fafc', '#0d1117');
  const cardBg = useColorModeValue('white', '#161b22');
  const borderColor = useColorModeValue('gray.200', '#30363d');
  const textColor = useColorModeValue('gray.800', '#f0f6fc');
  const mutedTextColor = useColorModeValue('gray.600', '#8b949e');

  // Calculate portfolio statistics
  useEffect(() => {
    if (vaults.length > 0) {
      const totalValue = vaults.reduce((sum, vault) => sum + Number(formatEther(vault.balance)), 0);
      const lockedVaults = vaults.filter(v => v.isLocked);
      const unlockedVaults = vaults.filter(v => !v.isLocked);
      const goalVaults = vaults.filter(v => v.isGoalLocked);
      
      const totalLocked = lockedVaults.reduce((sum, vault) => sum + Number(formatEther(vault.balance)), 0);
      const totalUnlocked = unlockedVaults.reduce((sum, vault) => sum + Number(formatEther(vault.balance)), 0);
      
      const avgLockDuration = vaults.length > 0 
        ? vaults.reduce((sum, vault) => sum + vault.remainingTime, 0) / vaults.length / 86400 // Convert to days
        : 0;

      const completedGoals = goalVaults.filter(v => v.progressPercentage >= 100).length;
      const successRate = goalVaults.length > 0 ? (completedGoals / goalVaults.length) * 100 : 0;

      setPortfolioData({
        totalValue,
        totalLocked,
        totalUnlocked,
        totalVaults: vaults.length,
        activeGoals: goalVaults.filter(v => v.progressPercentage < 100).length,
        completedGoals,
        avgLockDuration,
        successRate,
      });

      // Generate goal progress data
      const goals: GoalProgress[] = goalVaults.map((vault, index) => ({
        id: vault.address,
        name: `Goal Vault #${index + 1}`,
        currentValue: Number(formatEther(vault.currentAmount || 0n)),
        targetValue: Number(formatEther(vault.goalAmount || 0n)),
        progress: vault.progressPercentage,
        category: vault.isTimeLocked ? 'Time-based' : vault.isPriceLocked ? 'Price-based' : 'Goal-based',
        status: vault.progressPercentage >= 100 ? 'completed' : 'active',
      }));

      setGoalProgress(goals);

      // Generate mock performance data (in real app, this would come from historical data)
      const mockPerformanceData: PerformanceData[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          totalValue: totalValue * (0.8 + (i / 30) * 0.4 + Math.random() * 0.1),
          locked: totalLocked * (0.9 + Math.random() * 0.2),
          unlocked: totalUnlocked * (0.7 + Math.random() * 0.6),
          goals: goalVaults.length * (0.5 + (i / 30) * 0.5),
        };
      });

      setPerformanceData(mockPerformanceData);
    }
  }, [vaults]);

  const pieData = [
    { name: 'Locked Funds', value: portfolioData?.totalLocked || 0, color: '#7f5af0' },
    { name: 'Unlocked Funds', value: portfolioData?.totalUnlocked || 0, color: '#2cb67d' },
  ];

  const goalStatusData = [
    { name: 'Active Goals', value: portfolioData?.activeGoals || 0, color: '#ffa726' },
    { name: 'Completed Goals', value: portfolioData?.completedGoals || 0, color: '#66bb6a' },
  ];

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Flex justify="space-between" align="center" mb={6}>
            <VStack align="start" spacing={0}>
              <Box
                bg="rgba(0,0,0,0.3)"
                p={3}
                borderRadius="md"
                border="1px solid rgba(255,255,255,0.1)"
              >
                <Heading
                  as="h1"
                  size="xl"
                  fontWeight="bold"
                  fontSize="2xl"
                  color="white"
                  className="dashboard-heading"
                  sx={{
                    color: 'white !important',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: 'inherit',
                    lineHeight: '1.2',
                    WebkitTextFillColor: 'white',
                    WebkitTextStroke: '1px rgba(0,0,0,0.5)',
                    filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))',
                    _dark: {
                      color: 'white !important',
                      WebkitTextFillColor: 'white',
                    },
                    _light: {
                      color: 'black !important',
                      WebkitTextFillColor: 'black',
                    }
                  }}
                >
                  Portfolio Dashboard
                </Heading>
              </Box>
              <Text
                color="white"
                fontSize="md"
                mt={2}
                className="dashboard-subtitle"
                sx={{
                  color: 'white !important',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  _dark: {
                    color: 'white !important',
                  },
                  _light: {
                    color: 'black !important',
                  }
                }}
              >
                Track your savings goals and vault performance.
              </Text>
            </VStack>
            <Select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)} 
              w="200px"
              bg="#161b22"
              color="#f0f6fc"
              borderColor="#30363d"
              border="1px solid #30363d"
              _hover={{ borderColor: "#7f5af0", bg: "#161b22" }}
              _focus={{ borderColor: "#7f5af0", boxShadow: "0 0 0 1px #7f5af0", bg: "#161b22" }}
              sx={{
                '& option': {
                  backgroundColor: '#161b22',
                  color: '#f0f6fc'
                }
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </Select>
          </Flex>
        </MotionBox>

        {/* Stats Overview */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <MotionCard
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CardBody>
              <Stat>
                <StatLabel color={mutedTextColor} fontSize="sm">
                  <HStack>
                    <Icon as={FaCoins} />
                    <Text>Total Portfolio Value</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color={textColor} fontSize="2xl">
                  {portfolioData?.totalValue.toFixed(4) || '0'} ETH
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  +12.3% this month
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CardBody>
              <Stat>
                <StatLabel color={mutedTextColor} fontSize="sm">
                  <HStack>
                    <Icon as={FaLock} />
                    <Text>Active Vaults</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color={textColor} fontSize="2xl">
                  {portfolioData?.totalVaults || 0}
                </StatNumber>
                <StatHelpText>
                  <Badge colorScheme="purple">{portfolioData?.totalLocked.toFixed(4) || '0'} ETH locked</Badge>
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CardBody>
              <Stat>
                <StatLabel color={mutedTextColor} fontSize="sm">
                  <HStack>
                    <Icon as={FaBullseye} />
                    <Text>Goal Success Rate</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color={textColor} fontSize="2xl">
                  {portfolioData?.successRate.toFixed(1) || '0'}%
                </StatNumber>
                <StatHelpText>
                  <Badge colorScheme="green">{portfolioData?.completedGoals || 0} completed</Badge>
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <CardBody>
              <Stat>
                <StatLabel color={mutedTextColor} fontSize="sm">
                  <HStack>
                    <Icon as={FaClock} />
                    <Text>Avg. Lock Duration</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color={textColor} fontSize="2xl">
                  {portfolioData?.avgLockDuration.toFixed(0) || '0'}d
                </StatNumber>
                <StatHelpText>
                  <Text color={mutedTextColor}>days remaining</Text>
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>
        </SimpleGrid>

        {/* Charts Section */}
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
          {/* Performance Chart */}
          <MotionCard
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <CardHeader>
              <Heading size="md" color={textColor}>Portfolio Performance</Heading>
            </CardHeader>
            <CardBody>
              <Box h="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                    <XAxis dataKey="date" stroke="#8b949e" />
                    <YAxis stroke="#8b949e" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#161b22', 
                        border: '1px solid #30363d',
                        borderRadius: '8px',
                        color: '#f0f6fc'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalValue" 
                      stackId="1"
                      stroke="#7f5af0" 
                      fill="#7f5af0" 
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="locked" 
                      stackId="2"
                      stroke="#2cb67d" 
                      fill="#2cb67d" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </MotionCard>

          {/* Portfolio Distribution */}
          <MotionCard
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <CardHeader>
              <Heading size="md" color={textColor}>Fund Distribution</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <Box h="200px" w="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <VStack spacing={2} w="100%">
                  {pieData.map((item, index) => (
                    <HStack key={index} justify="space-between" w="100%">
                      <HStack>
                        <Box w={3} h={3} bg={item.color} borderRadius="sm" />
                        <Text fontSize="sm" color={mutedTextColor}>{item.name}</Text>
                      </HStack>
                      <Text fontSize="sm" color={textColor}>{item.value.toFixed(4)} ETH</Text>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </MotionCard>
        </Grid>

        {/* Goals Progress Section */}
        <MotionCard
          bg={cardBg}
          borderColor={borderColor}
          borderWidth="1px"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md" color={textColor}>Active Goals Progress</Heading>
              <Badge colorScheme="purple">{goalProgress.filter(g => g.status === 'active').length} active</Badge>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {goalProgress.length === 0 ? (
                <Text color={mutedTextColor} textAlign="center" py={8}>
                  No goals found. Create your first goal-based vault to start tracking progress!
                </Text>
              ) : (
                goalProgress.map((goal) => (
                  <Box key={goal.id} p={4} bg="rgba(0,0,0,0.2)" borderRadius="lg">
                    <HStack justify="space-between" mb={2}>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" color={textColor}>{goal.name}</Text>
                        <Badge colorScheme={goal.status === 'completed' ? 'green' : 'orange'}>
                          {goal.category}
                        </Badge>
                      </VStack>
                      <VStack align="end" spacing={0}>
                        <Text fontSize="lg" fontWeight="bold" color={textColor}>
                          {goal.progress.toFixed(1)}%
                        </Text>
                        <Text fontSize="sm" color={mutedTextColor}>
                          {goal.currentValue.toFixed(4)} / {goal.targetValue.toFixed(4)} ETH
                        </Text>
                      </VStack>
                    </HStack>
                    <Progress 
                      value={goal.progress} 
                      colorScheme={goal.status === 'completed' ? 'green' : 'purple'}
                      borderRadius="full"
                      h={2}
                    />
                    {goal.status === 'completed' && (
                      <HStack mt={2}>
                        <Icon as={FaCheckCircle} color="green.400" />
                        <Text fontSize="sm" color="green.400">Goal achieved!</Text>
                      </HStack>
                    )}
                  </Box>
                ))
              )}
            </VStack>
          </CardBody>
        </MotionCard>
      </VStack>
    </Container>
    </Box>
  );
};

export default Dashboard; 