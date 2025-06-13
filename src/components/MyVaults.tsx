import { useState, useEffect } from 'react';
import { Box, Text, VStack, SimpleGrid, Spinner, Center, Heading } from '@chakra-ui/react';
import { useVault } from '../hooks/useVault';
import { VaultCard } from './VaultCard';
import { VaultDetailsModal } from './VaultDetailsModal';
import { FaBoxOpen, FaEthereum } from 'react-icons/fa';

export const MyVaults = () => {
  const [hasWallet, setHasWallet] = useState(false);
  const { vaults, isLoading, error } = useVault();
  const [selectedVault, setSelectedVault] = useState<any | null>(null);
  const [selectedVaultIndex, setSelectedVaultIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if user has any wallets
  useEffect(() => {
    const savedWallets = localStorage.getItem('wallets');
    if (savedWallets) {
      const wallets = JSON.parse(savedWallets);
      setHasWallet(wallets.length > 0);
    } else {
      setHasWallet(false);
    }
  }, []);

  const handleOpenModal = (vault: any, index: number) => {
    setSelectedVault(vault);
    setSelectedVaultIndex(index);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVault(null);
    setSelectedVaultIndex(null);
  };

  if (!hasWallet) {
    return (
      <Center py={20} flexDirection="column">
        <Box mb={4}><FaEthereum size="3em" color="gray" /></Box>
        <Text fontSize="xl" color="gray.600" textAlign="center">
          Please create a wallet first to view your vaults.
        </Text>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <Center py={20} flexDirection="column">
        <Spinner size="xl" color="purple.500" mb={4} />
        <Text fontSize="xl" color="gray.600">Loading your vaults...</Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Center py={20} flexDirection="column">
        <Box mb={4}><FaBoxOpen size="3em" color="red.400" /></Box>
        <Text fontSize="xl" color="red.500" textAlign="center">
          Error loading vaults: {error}
        </Text>
        <Text fontSize="md" color="gray.500" mt={2}>
          Please try refreshing the page or connecting a different network.
        </Text>
      </Center>
    );
  }

  if (!vaults || vaults.length === 0) {
    return (
      <Center py={20} flexDirection="column">
        <Box as={FaBoxOpen} size="3em" color="gray.400" mb={4} />
        <Text fontSize="xl" color="gray.600" textAlign="center">
          No vaults found. Create one to get started!
        </Text>
      </Center>
    );
  }

  return (
    <VStack spacing={8} align="stretch" py={8}>
      <Heading as="h2" size="xl" textAlign="center" color="purple.800" fontWeight="extrabold" letterSpacing="wide">
        My Vaults
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} minChildWidth={{ base: "100%", md: "300px" }}>
        {vaults.map((vault, index: number) => {
          return (
            <VaultCard
              key={vault.address}
              vault={vault.address}
              index={index}
              onClick={() => handleOpenModal(vault, index)}
              balance={vault.balance}
              isTimeLocked={vault.isTimeLocked}
              isPriceLocked={vault.isPriceLocked}
              unlockTime={vault.unlockTime}
              targetPrice={vault.targetPrice}
              currentPrice={Number(vault.currentPrice) / 1e8}
              isLocked={vault.isLocked}
            />
          );
        })}
      </SimpleGrid>

      {selectedVault && selectedVaultIndex !== null && (
        <VaultDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          vault={selectedVault.address}
          vaultIndex={selectedVaultIndex}
          balance={selectedVault.balance}
          isTimeLocked={selectedVault.isTimeLocked}
          isPriceLocked={selectedVault.isPriceLocked}
          unlockTime={selectedVault.unlockTime}
          targetPrice={selectedVault.targetPrice}
          currentPrice={selectedVault.currentPrice}
          isLocked={selectedVault.isLocked}
          unlockReason={selectedVault.unlockReason}
        />
      )}
    </VStack>
  );
}