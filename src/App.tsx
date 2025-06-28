import { Box, Container, Flex, Heading, Link, Spacer, Stack, Button, Select } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import React from 'react'

import { VaultForm } from './components/VaultForm'
import { MyVaults } from './components/MyVaults'
import Home from './components/Home'
import { WalletManager } from './components/WalletManager'
import { WalletDetail } from './components/WalletDetail'
import { NotificationsHandler } from './components/NotificationsHandler'
import { SUPPORTED_NETWORKS } from './constants/networks'

const theme = extendTheme({
  // ... existing theme config
})

// Create a context for the selected network
export const NetworkContext = React.createContext({
  network: SUPPORTED_NETWORKS[0],
  setNetwork: (n: typeof SUPPORTED_NETWORKS[0]) => {},
})

function AppLayout() {
  const [hasWallets, setHasWallets] = useState(false);
  const location = useLocation();
  const [selectedNetwork, setSelectedNetwork] = useState(() => {
    const stored = localStorage.getItem('selectedNetwork');
    return stored ? JSON.parse(stored) : SUPPORTED_NETWORKS[0];
  });

  // Save network selection to localStorage
  useEffect(() => {
    localStorage.setItem('selectedNetwork', JSON.stringify(selectedNetwork));
  }, [selectedNetwork]);

  // Check if user has any saved wallets
  useEffect(() => {
    const checkWallets = () => {
      const savedWallets = localStorage.getItem('wallets');
      if (savedWallets) {
        const wallets = JSON.parse(savedWallets);
        setHasWallets(wallets.length > 0);
      } else {
        setHasWallets(false);
      }
    };
    checkWallets();
    window.addEventListener('storage', checkWallets);
    return () => window.removeEventListener('storage', checkWallets);
  }, []);

  // Determine button label and link based on route
  let buttonLabel = 'Create Wallet';
  let buttonTo = '/wallet';
  if (location.pathname.startsWith('/my-vaults') || location.pathname.startsWith('/create-vault')) {
    buttonLabel = 'Create Vault';
    buttonTo = '/create-vault';
  } else if (location.pathname.startsWith('/wallet')) {
    buttonLabel = 'Create Wallet';
    buttonTo = '/wallet';
  }
  
  return (
    <NetworkContext.Provider value={{ network: selectedNetwork, setNetwork: setSelectedNetwork }}>
      <Box minH="100vh" minW="100vw" bgGradient="linear(to-br, blue.50, #E0F7FA, #B2EBF2)">
        {/* Navigation Bar */}
        <Flex as="nav" p={4} bg="rgba(255, 255, 255, 0.8)" backdropFilter="blur(10px)" boxShadow="sm" alignItems="center" zIndex="sticky" top="0" width="100%">
          <Heading as="h1" size="md" color="blue.800" fontWeight="extrabold">
            <RouterLink to="/">TimeCapsuleVault</RouterLink>
          </Heading>
          <Spacer />
          <Stack direction="row" spacing={4} alignItems="center">
            {/* Global Network Selector */}
            <Select
              value={selectedNetwork.id}
              onChange={e => {
                const net = SUPPORTED_NETWORKS.find(n => n.id === e.target.value);
                if (net) setSelectedNetwork(net);
              }}
              size="sm"
              width="180px"
              bg="white"
              borderColor="gray.300"
              _hover={{ borderColor: "blue.300" }}
              _focus={{ borderColor: "blue.500" }}
            >
              {SUPPORTED_NETWORKS.map(net => (
                <option key={net.id} value={net.id}>{net.name}</option>
              ))}
            </Select>
            <Link as={RouterLink} to="/" px={3} py={1} rounded="md" _hover={{ bg: "blue.50", color: "blue.700" }} transition="all 0.2s">
              Home
            </Link>
            <Link as={RouterLink} to="/my-vaults" px={3} py={1} rounded="md" _hover={{ bg: "blue.50", color: "blue.700" }} transition="all 0.2s">
              My Vaults
            </Link>
            <Link as={RouterLink} to="/wallet" px={3} py={1} rounded="md" _hover={{ bg: "blue.50", color: "blue.700" }} transition="all 0.2s">
              Wallets
            </Link>
            <Button 
              as={RouterLink} 
              to={buttonTo} 
              colorScheme="purple" 
              size="sm" 
              px={5} 
              py={2} 
              rounded="full" 
              _hover={{ bg: "purple.600", shadow: "lg" }} 
              transition="all 0.2s"
            >
              {buttonLabel}
            </Button>
          </Stack>
        </Flex>

        <Container maxW="container.xl" py={8} px={4}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/my-vaults" element={<MyVaults />} />
            <Route path="/create-vault" element={<VaultForm />} />
            <Route path="/wallet" element={<WalletManager />} />
            <Route path="/wallet/:address" element={<WalletDetail />} />
          </Routes>
        </Container>
      </Box>
    </NetworkContext.Provider>
  );
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <NotificationsHandler />
      <Router>
        <AppLayout />
      </Router>
    </ChakraProvider>
  )
}

export default App