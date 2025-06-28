import { useState, useEffect } from 'react';
import { Box, Text, VStack, SimpleGrid, Spinner, Center, Heading } from '@chakra-ui/react';
import { useVault } from '../hooks/useVault';
import { VaultCard } from './VaultCard';
import { VaultDetailsModal } from './VaultDetailsModal';
import { FaBoxOpen, FaEthereum } from 'react-icons/fa';

export const MyVaults = () => {
  const [hasWallet, setHasWallet] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
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

  // Re-instantiate useVault when refreshKey changes
  const vaultHook = useVault();
  const vaultsToShow = vaultHook.vaults;
  const isLoadingToShow = vaultHook.isLoading;
  const errorToShow = vaultHook.error;

  const handleOpenModal = (vault: any, index: number) => {
    setSelectedVault(vault);
    setSelectedVaultIndex(index);
    setIsModalOpen(true);
  };

  const handleCloseModal = (didWithdraw = false) => {
    setIsModalOpen(false);
    setSelectedVault(null);
    setSelectedVaultIndex(null);
    if (didWithdraw) setRefreshKey(k => k + 1);
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

  if (isLoadingToShow) {
    return (
      <Center py={20} flexDirection="column">
        <Spinner size="xl" color="purple.500" mb={4} />
        <Text fontSize="xl" color="gray.600">Loading your vaults...</Text>
      </Center>
    );
  }

  if (errorToShow) {
    return (
      <Center py={20} flexDirection="column">
        <Box mb={4}><FaBoxOpen size="3em" color="red.400" /></Box>
        <Text fontSize="xl" color="red.500" textAlign="center">
          Error loading vaults: {errorToShow}
        </Text>
        <Text fontSize="md" color="gray.500" mt={2}>
          Please try refreshing the page or connecting a different network.
        </Text>
      </Center>
    );
  }

  if (!vaultsToShow || vaultsToShow.length === 0) {
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
        {vaultsToShow.map((vault, index: number) => {
          return (
            <VaultCard
              key={vault.address}
              vault={vault.address as `0x${string}`}
              index={index}
              onClick={() => handleOpenModal(vault, index)}
              balance={vault.balance}
              isTimeLocked={vault.isTimeLocked}
              isPriceLocked={vault.isPriceLocked}
              isGoalLocked={vault.isGoalLocked}
              unlockTime={vault.unlockTime}
              targetPrice={vault.targetPrice}
              goalAmount={vault.goalAmount}
              currentAmount={vault.currentAmount}
              progressPercentage={vault.progressPercentage}
              currentPrice={Number(vault.currentPrice) / 1e8}
              isLocked={vault.isLocked}
            />
          );
        })}
      </SimpleGrid>

      {selectedVault && selectedVaultIndex !== null && (
        <VaultDetailsModal
          isOpen={isModalOpen}
          onClose={() => handleCloseModal(false)}
          onWithdrawComplete={() => handleCloseModal(true)}
          vault={
            typeof selectedVault.address === 'string' && selectedVault.address.startsWith('0x')
              ? (selectedVault.address as unknown as `0x${string}`)
              : ('' as `0x${string}`)
          }
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