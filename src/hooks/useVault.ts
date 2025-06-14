import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { TimeCapsuleVaultABI, VaultFactoryABI } from '../contracts/abis'
import { VAULT_FACTORY_ADDRESS, ETH_USD_PRICE_FEED, CHAINLINK_PRICE_FEED_ABI } from '../utils/contracts'
import { getContractError } from '../utils/errors'
import { SUPPORTED_NETWORKS } from '../constants/networks'

export interface VaultData {
  address: string;
  balance: bigint;
  lockType: 'time' | 'price';
  unlockTime: bigint;
  targetPrice: bigint;
  currentPrice: bigint;
  remainingTime: number;
  creator: string;
  isTimeLocked: boolean;
  isPriceLocked: boolean;
  isLocked: boolean;
  unlockReason: string;
}

export const useVault = () => {
  const [selectedWallet, setSelectedWallet] = useState<{address: string, privateKey: string, network: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vaults, setVaults] = useState<VaultData[]>([])
  const [currentEthPrice, setCurrentEthPrice] = useState<bigint>(0n)
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Wallet | null>(null);

  // Set up provider and wallet when component mounts
  useEffect(() => {
    const savedWallets = localStorage.getItem('wallets');
    if (savedWallets) {
      const parsedWallets = JSON.parse(savedWallets);
      if (parsedWallets.length > 0) {
        const wallet = parsedWallets[0]; // Use first wallet by default
        setSelectedWallet(wallet);
        
        // Create provider based on network
        const network = SUPPORTED_NETWORKS.find(n => n.id === wallet.network);
        if (network) {
          const provider = new ethers.JsonRpcProvider(network.rpc);
          setProvider(provider);
          
          // Create signer
          const signer = new ethers.Wallet(wallet.privateKey, provider);
          setSigner(signer);
        }
      }
    }
  }, []);

  // Fetch current ETH price periodically
  useEffect(() => {
    const fetchCurrentEthPrice = async () => {
      if (!provider) return;

      try {
        const priceFeed = new ethers.Contract(
          ETH_USD_PRICE_FEED,
          CHAINLINK_PRICE_FEED_ABI,
          provider
        );
        
        const priceData = await priceFeed.latestRoundData();
        setCurrentEthPrice(BigInt(priceData[1].toString()));
      } catch (err) {
        console.error('Error fetching current ETH price:', err);
        setError('Unable to fetch ETH/USD price from Chainlink. Please make sure you are connected to Sepolia network.');
      }
    };

    if (provider) {
      fetchCurrentEthPrice();
      const interval = setInterval(fetchCurrentEthPrice, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [provider]);

  const fetchVaultDetails = useCallback(async (vaultAddress: string): Promise<VaultData | null> => {
    if (!provider || !selectedWallet) return null;

    try {
      const vaultContract = new ethers.Contract(vaultAddress, TimeCapsuleVaultABI, provider);
      const priceFeed = new ethers.Contract(ETH_USD_PRICE_FEED, CHAINLINK_PRICE_FEED_ABI, provider);
      
      const [balance, unlockTime, creator, actualTargetPrice] = await Promise.all([
        provider.getBalance(vaultAddress),
        vaultContract.unlockTime(),
        vaultContract.creator(),
        vaultContract.targetPrice(),
      ]);
      
      // Get lock status
      const lockStatus = await vaultContract.getLockStatus();
      
      // Get current price
      const currentPriceResult = await priceFeed.latestRoundData();
      
      const currentTime = Math.floor(Date.now() / 1000);
      const remainingSeconds = Number(unlockTime) - currentTime;

      const isPriceLocked = lockStatus[3]; // isPriceBased
      const isTimeLocked = lockStatus[0] && !isPriceLocked; // locked and not price based
      
      let unlockReasonCalculated = "";

      if (isTimeLocked) {
        unlockReasonCalculated = remainingSeconds > 0 
          ? `Vault is time-locked. Unlocks in ${formatRemainingTime(remainingSeconds)}.`
          : "Vault is unlocked by time.";
      } else if (isPriceLocked) {
        // Compare currentPriceResult[1] (current price from chainlink) with actualTargetPrice
        // Both are bigints and should have the same decimal precision (1e8)
        const isLockedByPrice = BigInt(currentPriceResult[1].toString()) < BigInt(actualTargetPrice.toString());
        unlockReasonCalculated = isLockedByPrice 
          ? `Vault is price-locked. Current price ($${(Number(currentPriceResult[1]) / 1e8).toFixed(2)}) is below target price ($${(Number(actualTargetPrice) / 1e8).toFixed(2)}).`
          : `Vault is unlocked by price. Current price ($${(Number(currentPriceResult[1]) / 1e8).toFixed(2)}) is at or above target price ($${(Number(actualTargetPrice) / 1e8).toFixed(2)}).`;
      } else {
        // Fallback for unexpected scenarios, use contract's unlock reason
        unlockReasonCalculated = lockStatus[4];
      }

      return {
        address: vaultAddress,
        balance: BigInt(balance.toString()),
        unlockTime: BigInt(unlockTime.toString()),
        targetPrice: BigInt(actualTargetPrice.toString()),
        currentPrice: BigInt(currentPriceResult[1].toString()),
        remainingTime: remainingSeconds > 0 ? remainingSeconds : 0,
        creator,
        isTimeLocked,
        isPriceLocked,
        lockType: isPriceLocked ? 'price' : 'time',
        isLocked: lockStatus[0],
        unlockReason: unlockReasonCalculated,
      };
    } catch (err) {
      console.error(`Error fetching details for vault ${vaultAddress}:`, err);
      return null;
    }
  }, [provider, selectedWallet]);

  // Load all vaults on mount or when wallet changes
  useEffect(() => {
    const loadAllVaults = async () => {
      if (!selectedWallet || !provider || !signer) return;

      setIsLoading(true);
      setError(null);
      try {
        // First verify the contract exists
        const code = await provider.getCode(VAULT_FACTORY_ADDRESS);
        if (!code || code === '0x') {
          setError('Vault factory contract not deployed at the specified address. Make sure you have deployed the contracts to Sepolia testnet.');
          setIsLoading(false);
          return;
        }

        const factoryContract = new ethers.Contract(
          VAULT_FACTORY_ADDRESS,
          VaultFactoryABI,
          provider
        );
        
        const vaultAddresses = await factoryContract.getUserVaults(selectedWallet.address);
        
        if (!vaultAddresses) {
          throw new Error('Invalid response from getUserVaults');
        }

        const fetchedVaultDetails = await Promise.all(
          vaultAddresses.map(fetchVaultDetails)
        );

        function isVaultData(vault: VaultData | null): vault is VaultData {
          return Boolean(vault);
        }

        setVaults(fetchedVaultDetails.filter(isVaultData).filter(vault => vault.balance > 0n));
      } catch (err) {
        console.error('Error loading all vaults:', err);
        setError(getContractError(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadAllVaults();
  }, [selectedWallet, provider, signer, fetchVaultDetails]);

  const formatRemainingTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const createNewVault = async (unlockTime: number, targetPrice: number): Promise<string | undefined> => {
    if (!signer || !provider || !selectedWallet) {
      setError('No wallet selected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First verify if the factory contract exists
      const code = await provider.getCode(VAULT_FACTORY_ADDRESS);
      if (!code || code === '0x') {
        console.error('Vault factory contract not deployed at the specified address');
        setError('Vault factory contract not deployed. Please deploy the contract first.');
        return;
      }

      // Create the vault
      const factoryContract = new ethers.Contract(
        VAULT_FACTORY_ADDRESS,
        VaultFactoryABI,
        signer
      );
      
      const tx = await factoryContract.createVault(
        unlockTime,
        targetPrice,
        ETH_USD_PRICE_FEED
      );

      console.log('Transaction submitted:', tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Get the vault address by querying the contract directly instead of relying on logs
      // This is more robust as it doesn't depend on specific event signatures
      const userVaults = await factoryContract.getUserVaults(selectedWallet.address);
      
      // The most recently created vault should be the last one in the array
      if (!userVaults || userVaults.length === 0) {
        throw new Error('No vaults found after creation. Please try again.');
      }
      
      // Get the most recently created vault address
      const vaultAddress = userVaults[userVaults.length - 1];
      console.log('New vault created at:', vaultAddress);

      // Refresh vaults list
      const vaultDetails = await fetchVaultDetails(vaultAddress);
      if (vaultDetails) {
        setVaults(prevVaults => [...prevVaults, vaultDetails]);
      }

      return vaultAddress;
    } catch (err) {
      console.error('Error creating new vault:', err);
      setError(getContractError(err));
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const deposit = async (amount: string, vaultAddress: string): Promise<boolean> => {
    if (!signer || !provider || !selectedWallet) {
      setError('No wallet selected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the vault contract's deposit function instead of a direct transfer
      const vaultContract = new ethers.Contract(
        vaultAddress,
        TimeCapsuleVaultABI,
        signer
      );
      
      // Call the deposit function with the ETH value
      const tx = await vaultContract.deposit({
        value: ethers.parseEther(amount)
      });

      console.log('Deposit transaction submitted:', tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Deposit transaction confirmed:', receipt);

      // Update the vault details
      const updatedVaultDetails = await fetchVaultDetails(vaultAddress);
      if (updatedVaultDetails) {
        setVaults(prevVaults =>
          prevVaults.map(v => (v.address === vaultAddress ? updatedVaultDetails : v))
        );
      }

      return true;
    } catch (err) {
      console.error('Error depositing to vault:', err);
      setError(getContractError(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const withdraw = async (vaultAddress: string): Promise<boolean> => {
    if (!signer || !provider || !selectedWallet) {
      setError('No wallet selected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const vaultContract = new ethers.Contract(
        vaultAddress,
        TimeCapsuleVaultABI,
        signer
      );

      // Check if vault is unlocked
      const lockStatus = await vaultContract.getLockStatus();
      if (lockStatus[0]) {
        throw new Error(`Vault is still locked: ${lockStatus[4]}`);
      }

      // Withdraw funds
      const tx = await vaultContract.withdraw();
      console.log('Withdrawal transaction submitted:', tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Withdrawal transaction confirmed:', receipt);

      // Update vaults list (remove this vault)
      setVaults(prevVaults => prevVaults.filter(v => v.address !== vaultAddress));

      return true;
    } catch (err) {
      console.error('Error withdrawing from vault:', err);
      setError(getContractError(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    vaults,
    currentEthPrice,
    createNewVault,
    deposit,
    withdraw,
    selectedWallet,
    setSelectedWallet,
  };
}; 