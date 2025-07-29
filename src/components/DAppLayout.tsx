import { 
  Box, 
  Container, 
  Flex, 
  Heading, 
  Link, 
  Spacer, 
  Stack, 
  Button, 
  Select, 
  IconButton, 
  Drawer, 
  DrawerBody, 
  DrawerHeader, 
  DrawerOverlay, 
  DrawerContent, 
  DrawerCloseButton, 
  useDisclosure, 
  VStack,
  useBreakpointValue,
  HStack
} from '@chakra-ui/react'
import { Routes, Route, Link as RouterLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import React from 'react'
import { FaBars } from 'react-icons/fa'

import { VaultForm } from './VaultForm'
import { MyVaults } from './MyVaults'
import { WalletManager } from './WalletManager'
import { WalletDetail } from './WalletDetail'
import WelcomePage from './WelcomePage'
import Dashboard from './Dashboard'
import NotificationBell from './NotificationBell'
import { SUPPORTED_NETWORKS } from '../constants/networks'

// Create a context for the selected network
export const NetworkContext = React.createContext({
  network: SUPPORTED_NETWORKS[0],
  setNetwork: (_n: typeof SUPPORTED_NETWORKS[0]) => {},
})

function DAppLayout() {
  const [hasWallets, setHasWallets] = useState(false);
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
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
      <Box minH="100vh" minW="100vw" bg="#181a20" style={{ background: 'linear-gradient(135deg, #181a20 0%, #232526 60%, #3a1c71 100%)' }}>
        {/* Navigation Bar */}
        <Flex as="nav" p={4} bg="rgba(24,26,32,0.95)" backdropFilter="blur(10px)" boxShadow="0 2px 12px 0 rgba(0,0,0,0.25)" borderBottom="1px solid #232526" alignItems="center" zIndex={1000} position="sticky" top="0" width="100%">
          <Heading as="h1" size="md" color="#fff" fontWeight="extrabold">
            <RouterLink to="/">TimeCapsuleVault</RouterLink>
          </Heading>
          <Spacer />
          
          {/* Mobile Menu Button */}
          {isMobile ? (
            <IconButton
              aria-label="Open menu"
              icon={<FaBars />}
              onClick={onOpen}
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
            />
          ) : (
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
              bg="#232526"
              color="#fff"
              borderColor="#414345"
              _hover={{ borderColor: "#7f5af0" }}
              _focus={{ borderColor: "#21d4fd" }}
            >
              {SUPPORTED_NETWORKS.map(net => (
                <option key={net.id} value={net.id} style={{ color: '#181a20', background: '#fff' }}>{net.name}</option>
              ))}
            </Select>
            <Link as={RouterLink} to="/dashboard" px={3} py={1} rounded="md" color="#fff" _hover={{ color: "#21d4fd", textDecoration: 'underline' }} transition="all 0.2s">
              Dashboard
            </Link>
            <Link as={RouterLink} to="/my-vaults" px={3} py={1} rounded="md" color="#fff" _hover={{ color: "#21d4fd", textDecoration: 'underline' }} transition="all 0.2s">
              My Vaults
            </Link>
                          <Link as={RouterLink} to="/wallet" px={3} py={1} rounded="md" color="#fff" _hover={{ color: "#21d4fd", textDecoration: 'underline' }} transition="all 0.2s">
                Wallets
              </Link>
              <NotificationBell />
              <Button 
                as={RouterLink} 
                to={buttonTo} 
                colorScheme="purple" 
                size="sm" 
                px={5} 
                py={2} 
                rounded="full" 
                fontWeight="bold"
                _hover={{ bg: "#7f5af0", color: "#fff", shadow: "lg" }} 
                transition="all 0.2s"
              >
                {buttonLabel}
              </Button>
            </Stack>
          )}
        </Flex>

        {/* Mobile Navigation Drawer */}
        <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent bg="rgba(24,26,32,0.98)" color="white">
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px" borderColor="#414345">
              <HStack>
                <Heading size="md">Menu</Heading>
                <Spacer />
                <NotificationBell />
              </HStack>
            </DrawerHeader>

            <DrawerBody>
              <VStack spacing={6} align="stretch" pt={4}>
                {/* Network Selector */}
                <Box>
                  <Heading size="sm" mb={3} color="gray.400">Network</Heading>
                  <Select
                    value={selectedNetwork.id}
                    onChange={e => {
                      const net = SUPPORTED_NETWORKS.find(n => n.id === e.target.value);
                      if (net) setSelectedNetwork(net);
                    }}
                    bg="#232526"
                    borderColor="#414345"
                    _hover={{ borderColor: "#7f5af0" }}
                  >
                    {SUPPORTED_NETWORKS.map(net => (
                      <option key={net.id} value={net.id} style={{ color: '#181a20', background: '#fff' }}>
                        {net.name}
                      </option>
                    ))}
                  </Select>
                </Box>

                {/* Navigation Links */}
                <VStack spacing={3} align="stretch">
                  <Heading size="sm" color="gray.400">Navigation</Heading>
                  <Link 
                    as={RouterLink} 
                    to="/dashboard" 
                    p={3} 
                    rounded="md" 
                    bg={location.pathname === '/dashboard' ? 'purple.600' : 'transparent'}
                    _hover={{ bg: 'purple.700' }}
                    onClick={onClose}
                  >
                    📊 Dashboard
                  </Link>
                  <Link 
                    as={RouterLink} 
                    to="/my-vaults" 
                    p={3} 
                    rounded="md" 
                    bg={location.pathname === '/my-vaults' ? 'purple.600' : 'transparent'}
                    _hover={{ bg: 'purple.700' }}
                    onClick={onClose}
                  >
                    🔒 My Vaults
                  </Link>
                  <Link 
                    as={RouterLink} 
                    to="/wallet" 
                    p={3} 
                    rounded="md" 
                    bg={location.pathname === '/wallet' ? 'purple.600' : 'transparent'}
                    _hover={{ bg: 'purple.700' }}
                    onClick={onClose}
                  >
                    💳 Wallets
                  </Link>
                </VStack>

                {/* Quick Actions */}
                <VStack spacing={3} align="stretch">
                  <Heading size="sm" color="gray.400">Quick Actions</Heading>
                  <Button 
                    as={RouterLink} 
                    to="/create-vault" 
                    colorScheme="purple" 
                    size="lg"
                    onClick={onClose}
                  >
                    ✨ Create New Vault
                  </Button>
                  <Button 
                    as={RouterLink} 
                    to="/wallet" 
                    variant="outline" 
                    colorScheme="purple"
                    onClick={onClose}
                  >
                    ➕ Add Wallet
                  </Button>
                </VStack>
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        <Container maxW="container.xl" py={8} px={4}>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
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

export default DAppLayout; 