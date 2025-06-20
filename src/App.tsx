import { Box, Container, Flex, Heading, Link, Spacer, Stack, Button } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { useState, useEffect } from 'react'

import { VaultForm } from './components/VaultForm'
import { MyVaults } from './components/MyVaults'
import Home from './components/Home'
import { WalletManager } from './components/WalletManager'
import { WalletDetail } from './components/WalletDetail'
import { NotificationsHandler } from './components/NotificationsHandler'

const theme = extendTheme({
  // ... existing theme config
})

function App() {
  const [hasWallets, setHasWallets] = useState(false);

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
    
    // Listen for changes in localStorage
    window.addEventListener('storage', checkWallets);
    return () => window.removeEventListener('storage', checkWallets);
  }, []);
  
  return (
    <ChakraProvider theme={theme}>
      <NotificationsHandler />
      <Router>
        <Box minH="100vh" minW="100vw" bgGradient="linear(to-br, blue.50, #E0F7FA, #B2EBF2)">
          {/* Navigation Bar */}
          <Flex as="nav" p={4} bg="rgba(255, 255, 255, 0.8)" backdropFilter="blur(10px)" boxShadow="sm" alignItems="center" zIndex="sticky" top="0" width="100%">
            <Heading as="h1" size="md" color="blue.800" fontWeight="extrabold">
              <RouterLink to="/">TimeCapsuleVault</RouterLink>
            </Heading>
            <Spacer />
            <Stack direction="row" spacing={4} alignItems="center">
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
                to={hasWallets ? "/create-vault" : "/wallet"} 
                colorScheme="purple" 
                size="sm" 
                px={5} 
                py={2} 
                rounded="full" 
                _hover={{ bg: "purple.600", shadow: "lg" }} 
                transition="all 0.2s"
              >
                {hasWallets ? "Create Vault" : "Create Wallet"}
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
      </Router>
    </ChakraProvider>
  )
}

export default App