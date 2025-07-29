import { useState, useEffect } from 'react';
import { Box, Text, VStack, SimpleGrid, Spinner, Center, Heading } from '@chakra-ui/react';
import { useVault } from '../hooks/useVault';
import { VaultCard } from './VaultCard';
import { VaultDetailsModal } from './VaultDetailsModal';
import { SkeletonCard } from './SkeletonCard';
import { EmptyState } from './EmptyState';
import VaultCustomizationModal from './VaultCustomizationModal';
import { FaBoxOpen, FaEthereum, FaWallet, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export const MyVaults = () => {
  const navigate = useNavigate();
  const [hasWallet, setHasWallet] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedVault, setSelectedVault] = useState<any | null>(null);
  const [selectedVaultIndex, setSelectedVaultIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autoWithdrawingVaults, setAutoWithdrawingVaults] = useState<Set<string>>(new Set());
  const [customizationVault, setCustomizationVault] = useState<string | null>(null);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);

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

  // Listen for auto-withdrawal events
  useEffect(() => {
    const handleAutoWithdrawalStart = (vaultAddress: string) => {
      setAutoWithdrawingVaults(prev => new Set([...prev, vaultAddress]));
    };

    const handleAutoWithdrawalComplete = (vaultAddress: string) => {
      setAutoWithdrawingVaults(prev => {
        const newSet = new Set(prev);
        newSet.delete(vaultAddress);
        return newSet;
      });
    };

    // Listen for console messages to detect auto-withdrawal
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog.apply(console, args);
      
      const message = args.join(' ');
      if (message.includes('Attempting auto-withdrawal from vault')) {
        const match = message.match(/vault (0x[a-fA-F0-9]+)/);
        if (match) {
          handleAutoWithdrawalStart(match[1]);
        }
      } else if (message.includes('Auto-withdrawal successful for vault') || message.includes('AUTO-WITHDRAWAL SUCCESSFUL')) {
        const match = message.match(/vault (0x[a-fA-F0-9]+)/);
        if (match) {
          handleAutoWithdrawalComplete(match[1]);
        }
      }
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

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

  const handleOpenCustomization = (vaultAddress: string) => {
    setCustomizationVault(vaultAddress);
    setIsCustomizationModalOpen(true);
  };

  const handleCloseCustomization = () => {
    setIsCustomizationModalOpen(false);
    setCustomizationVault(null);
    // Trigger re-render to show updated customizations
    setRefreshKey(k => k + 1);
  };

  if (!hasWallet) {
    return (
      <EmptyState
        icon={FaWallet}
        title="No Wallet Found"
        description="You need to create or import a wallet first to start managing your crypto vaults and securely store your funds."
        primaryAction={{
          label: "Create Wallet",
          onClick: () => navigate('/wallet'),
          colorScheme: "blue"
        }}
        secondaryAction={{
          label: "Learn More",
          onClick: () => navigate('/')
        }}
      />
    );
  }

  if (isLoadingToShow) {
    return (
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="white" mb={4}>
          My Vaults
        </Heading>
        <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={6}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} variant="vault" index={i - 1} />
          ))}
        </SimpleGrid>
      </VStack>
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
      <EmptyState
        icon={FaLock}
        title="No Vaults Yet"
        description="Create your first crypto vault to securely lock away your funds until a specific time, price target, or savings goal is reached."
        primaryAction={{
          label: "Create Vault",
          onClick: () => navigate('/create-vault'),
          colorScheme: "purple"
        }}
        secondaryAction={{
          label: "Back to Dashboard",
          onClick: () => navigate('/')
        }}
      />
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
              onRefresh={() => setRefreshKey(k => k + 1)}
              onCustomize={() => handleOpenCustomization(vault.address)}
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
              isAutoWithdrawing={autoWithdrawingVaults.has(vault.address)}
            />
          );
        })}
      </SimpleGrid>

      {selectedVault && (
        <VaultDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          vault={selectedVault.address as `0x${string}`}
          vaultIndex={selectedVaultIndex}
          balance={selectedVault.balance}
          isTimeLocked={selectedVault.isTimeLocked}
          isPriceLocked={selectedVault.isPriceLocked}
          isGoalLocked={selectedVault.isGoalLocked}
          unlockTime={selectedVault.unlockTime}
          targetPrice={selectedVault.targetPrice}
          goalAmount={selectedVault.goalAmount}
          currentAmount={selectedVault.currentAmount}
          progressPercentage={selectedVault.progressPercentage}
          currentPrice={selectedVault.currentPrice}
          isLocked={selectedVault.isLocked}
          unlockReason={selectedVault.unlockReason}
        />
      )}

      {customizationVault && (
        <VaultCustomizationModal
          isOpen={isCustomizationModalOpen}
          onClose={handleCloseCustomization}
          vaultAddress={customizationVault}
        />
      )}
    </VStack>
  );
};