import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Container,
  SimpleGrid,
  Icon,
  useColorModeValue,
  Flex,
  Badge,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { 
  FaLock, 
  FaWallet, 
  FaCoins, 
  FaShieldAlt, 
  FaClock, 
  FaChartLine 
} from 'react-icons/fa'

const WelcomePage = () => {
  const navigate = useNavigate()
  const bgColor = useColorModeValue('#181a20', '#181a20')
  const textColor = useColorModeValue('#fff', '#fff')
  const cardBg = useColorModeValue('rgba(35, 37, 38, 0.8)', 'rgba(35, 37, 38, 0.8)')
  const borderColor = useColorModeValue('#414345', '#414345')

  const features = [
    {
      icon: FaLock,
      title: 'Time-Locked Vaults',
      description: 'Secure your crypto with time-based locks'
    },
    {
      icon: FaChartLine,
      title: 'Price-Locked Vaults',
      description: 'Lock funds until specific price conditions are met'
    },
    {
      icon: FaWallet,
      title: 'Multi-Wallet Support',
      description: 'Manage multiple wallets in one place'
    },
    {
      icon: FaShieldAlt,
      title: 'Secure & Trustless',
      description: 'Smart contracts ensure your funds are safe'
    }
  ]

  const quickActions = [
    {
      title: 'Create Vault',
      description: 'Start a new time or price-locked vault',
      icon: FaLock,
      color: 'purple',
      action: () => navigate('/create-vault')
    },
    {
      title: 'Manage Wallets',
      description: 'Create and manage your wallets',
      icon: FaWallet,
      color: 'blue',
      action: () => navigate('/wallet')
    },
    {
      title: 'View Vaults',
      description: 'See all your existing vaults',
      icon: FaCoins,
      color: 'yellow',
      action: () => navigate('/my-vaults')
    }
  ]

  return (
    <Box minH="100vh" bg={bgColor} py={12}>
      <Container maxW="container.xl">
        {/* Hero Section */}
        <VStack spacing={8} textAlign="center" mb={16}>
          <Badge 
            colorScheme="purple" 
            px={4} 
            py={2} 
            borderRadius="full"
            fontSize="sm"
            fontWeight="bold"
          >
            🔐 TimeCapsule CryptoVault
          </Badge>
          
          <Heading 
            size="2xl" 
            color={textColor}
            fontWeight="extrabold"
            bgGradient="linear(to-r, #21d4fd, #7f5af0)"
            bgClip="text"
          >
            Welcome to Your Crypto Vault
          </Heading>
          
          <Text 
            fontSize="xl" 
            color="gray.300" 
            maxW="2xl"
            lineHeight="tall"
          >
            Secure your cryptocurrency with time-locked and price-locked vaults. 
            Create, manage, and withdraw your funds with complete control.
          </Text>
        </VStack>

        {/* Features Grid */}
        <Box mb={16}>
          <Heading size="lg" color={textColor} mb={8} textAlign="center">
            What You Can Do
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {features.map((feature, index) => (
              <Box
                key={index}
                p={6}
                bg={cardBg}
                borderRadius="xl"
                border="1px solid"
                borderColor={borderColor}
                textAlign="center"
                transition="all 0.3s"
                _hover={{
                  transform: 'translateY(-4px)',
                  borderColor: '#7f5af0',
                  boxShadow: '0 8px 32px rgba(127, 90, 240, 0.2)'
                }}
              >
                <Icon 
                  as={feature.icon} 
                  w={8} 
                  h={8} 
                  color="#7f5af0" 
                  mb={4}
                />
                <Heading size="md" color={textColor} mb={2}>
                  {feature.title}
                </Heading>
                <Text color="gray.400" fontSize="sm">
                  {feature.description}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        {/* Quick Actions */}
        <Box>
          <Heading size="lg" color={textColor} mb={8} textAlign="center">
            Get Started
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {quickActions.map((action, index) => (
              <Box
                key={index}
                p={6}
                bg={cardBg}
                borderRadius="xl"
                border="1px solid"
                borderColor={borderColor}
                textAlign="center"
                transition="all 0.3s"
                cursor="pointer"
                _hover={{
                  transform: 'translateY(-4px)',
                  borderColor: '#7f5af0',
                  boxShadow: '0 8px 32px rgba(127, 90, 240, 0.2)'
                }}
                onClick={action.action}
              >
                <Icon 
                  as={action.icon} 
                  w={10} 
                  h={10} 
                  color={`${action.color}.400`} 
                  mb={4}
                />
                <Heading size="md" color={textColor} mb={2}>
                  {action.title}
                </Heading>
                <Text color="gray.400" fontSize="sm" mb={4}>
                  {action.description}
                </Text>
                <Button
                  colorScheme={action.color}
                  size="sm"
                  variant="outline"
                  _hover={{
                    bg: `${action.color}.500`,
                    color: 'white'
                  }}
                >
                  Get Started
                </Button>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        {/* Footer Info */}
        <Box mt={16} textAlign="center">
          <Text color="gray.500" fontSize="sm">
            Built with ❤️ using React, TypeScript, and Chakra UI
          </Text>
          <Text color="gray.500" fontSize="sm" mt={2}>
            Secure • Trustless • Decentralized
          </Text>
        </Box>
      </Container>
    </Box>
  )
}

export default WelcomePage 