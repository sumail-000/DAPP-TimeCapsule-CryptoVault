import { useState, useEffect, useCallback, useRef } from 'react'
import { ethers } from 'ethers'
import { TimeCapsuleVaultABI, VaultFactoryABI } from '../contracts/abis'
import { VAULT_FACTORY_ADDRESS, ETH_USD_PRICE_FEED, CHAINLINK_PRICE_FEED_ABI } from '../utils/contracts'
import { getContractError } from '../utils/errors'
import { SUPPORTED_NETWORKS } from '../constants/networks'
import { rateLimitedRpcCall, getSepoliaClient } from '../utils/rpc'

export interface VaultData {
  address: string;
  balance: bigint;
  lockType: 'time' | 'price' | 'goal';
  unlockTime: bigint;
  targetPrice: bigint;
  goalAmount: bigint;
  currentAmount: bigint;
  progressPercentage: number;
  currentPrice: bigint;
  remainingTime: number;
  creator: string;
  isTimeLocked: boolean;
  isPriceLocked: boolean;
  isGoalLocked: boolean;
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

  // Track vaults that have been auto-withdrawn in this session
  const autoWithdrawnVaults = useRef<Set<string>>(new Set());

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
          // Use the first RPC endpoint as primary
          const provider = new ethers.JsonRpcProvider(network.rpc[0]);
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
        await rateLimitedRpcCall(async () => {
          const priceFeed = new ethers.Contract(
            ETH_USD_PRICE_FEED,
            CHAINLINK_PRICE_FEED_ABI,
            provider
          );
          
          const priceData = await priceFeed.latestRoundData();
          setCurrentEthPrice(BigInt(priceData[1].toString()));
        });
      } catch (err) {
        console.error('Error fetching current ETH price:', err);
        setError('Unable to fetch ETH/USD price from Chainlink. Please make sure you are connected to Sepolia network.');
      }
    };

    if (provider) {
      fetchCurrentEthPrice();
      const interval = setInterval(fetchCurrentEthPrice, 30000); // Update every 30 seconds instead of 10
      return () => clearInterval(interval);
    }
  }, [provider]);

  const fetchVaultDetails = useCallback(async (vaultAddress: string): Promise<VaultData | null> => {
    if (!provider || !selectedWallet) return null;

    try {
      return await rateLimitedRpcCall(async () => {
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
        // lockStatus: [locked, currentPrice, timeRemaining, isPriceBased, isGoalBased, currentAmount, goalAmount, progressPercentage, unlockReason]
        const [locked, currentPrice, timeRemaining, isPriceBased, isGoalBased, currentAmount, goalAmount, progressPercentage, unlockReason] = lockStatus;
        
        // Get current price
        const currentPriceResult = await priceFeed.latestRoundData();
        
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingSeconds = Number(unlockTime) - currentTime;

        const isPriceLocked = isPriceBased;
        const isGoalLocked = isGoalBased;
        const isTimeLocked = locked && !isPriceLocked && !isGoalLocked;
        let lockType: 'time' | 'price' | 'goal' = 'time';
        if (isPriceLocked) lockType = 'price';
        if (isGoalLocked) lockType = 'goal';

        return {
          address: vaultAddress,
          balance: BigInt(balance.toString()),
          unlockTime: BigInt(unlockTime.toString()),
          targetPrice: BigInt(actualTargetPrice.toString()),
          goalAmount: BigInt(goalAmount?.toString() || '0'),
          currentAmount: BigInt(currentAmount?.toString() || '0'),
          progressPercentage: Number(progressPercentage),
          currentPrice: BigInt(currentPriceResult[1].toString()),
          remainingTime: remainingSeconds > 0 ? remainingSeconds : 0,
          creator,
          isTimeLocked,
          isPriceLocked,
          isGoalLocked,
          lockType,
          isLocked: locked,
          unlockReason: unlockReason,
        };
      });
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
        await rateLimitedRpcCall(async () => {
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
        });
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

  const createNewVault = async (
    unlockTime: number,
    targetPrice: number,
    targetAmount: number = 0
  ): Promise<string | undefined> => {
    if (!signer || !provider || !selectedWallet) {
      setError('No wallet selected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting vault creation with params:', { unlockTime, targetPrice, targetAmount });
      
      return await rateLimitedRpcCall(async () => {
        // First verify if the factory contract exists
        const code = await provider.getCode(VAULT_FACTORY_ADDRESS);
        if (!code || code === '0x') {
          setError('Vault factory contract not deployed. Please deploy the contract first.');
          return;
        }

        console.log('Contract exists, creating vault...');

        // Create the vault
        const factoryContract = new ethers.Contract(
          VAULT_FACTORY_ADDRESS,
          VaultFactoryABI,
          signer
        );

        console.log('Calling createVault with params:', [unlockTime, targetPrice, targetAmount, ETH_USD_PRICE_FEED]);
        
        const tx = await factoryContract.createVault(
          BigInt(unlockTime),
          BigInt(targetPrice),
          BigInt(targetAmount),
          ETH_USD_PRICE_FEED
        );

        console.log('Transaction submitted:', tx.hash);

        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);

        // Get the vault address by querying the contract directly
        const userVaults = await factoryContract.getUserVaults(selectedWallet.address);
        if (!userVaults || userVaults.length === 0) {
          throw new Error('No vaults found after creation. Please try again.');
        }
        const vaultAddress = userVaults[userVaults.length - 1];
        console.log('New vault created at:', vaultAddress);

        // Refresh vaults list
        const vaultDetails = await fetchVaultDetails(vaultAddress);
        if (vaultDetails) {
          setVaults(prevVaults => [...prevVaults, vaultDetails]);
        }

        return vaultAddress;
      });
    } catch (err) {
      console.error('Error creating new vault:', err);
      const errorMessage = getContractError(err);
      console.error('Parsed error message:', errorMessage);
      setError(errorMessage);
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
      const vaultContract = new ethers.Contract(vaultAddress, TimeCapsuleVaultABI, signer);

      // Check if vault is unlocked
      const lockStatus = await vaultContract.getLockStatus();
      if (lockStatus[0]) {
        throw new Error(`Vault is still locked: ${lockStatus[8]}`); // unlockReason is at index 8
      }

      // Check if vault has balance
      const balance = await provider.getBalance(vaultAddress);
      if (balance === 0n) {
        throw new Error('Vault has no balance to withdraw');
      }

      console.log(`Withdrawing ${ethers.formatEther(balance)} ETH from vault ${vaultAddress}`);

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
      const errorMessage = getContractError(err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for unlocked vaults and auto-withdraw
  useEffect(() => {
    if (!signer || !provider || !selectedWallet || vaults.length === 0) return;

    const interval = setInterval(async () => {
      for (const vault of vaults) {
        // Only attempt withdrawal if vault is unlocked, has balance, and hasn't been auto-withdrawn
        if (!vault.isLocked && vault.balance > 0n && !autoWithdrawnVaults.current.has(vault.address)) {
          try {
            console.log(`Attempting auto-withdrawal from vault ${vault.address}`);
            
            await rateLimitedRpcCall(async () => {
              // Double-check the vault status before withdrawing
              const vaultContract = new ethers.Contract(vault.address, TimeCapsuleVaultABI, provider);
              const lockStatus = await vaultContract.getLockStatus();
              
              // Only proceed if the vault is actually unlocked
              if (!lockStatus[0]) { // locked = false
                await withdraw(vault.address);
                autoWithdrawnVaults.current.add(vault.address);
                console.log(`Auto-withdrawal successful for vault ${vault.address}`);
              } else {
                console.log(`Vault ${vault.address} is still locked, skipping auto-withdrawal`);
              }
            });
          } catch (err) {
            console.error(`Auto-withdrawal failed for vault ${vault.address}:`, err);
            // Don't add to autoWithdrawnVaults so it will retry next poll
            // But add a small delay to prevent spam
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }
    }, 60000); // Check every 60 seconds instead of 30 to reduce rate limiting

    return () => clearInterval(interval);
  }, [signer, provider, selectedWallet, vaults]);

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