import { useState, useEffect, useCallback, useRef } from 'react'
import { ethers } from 'ethers'
import { TimeCapsuleVaultABI, VaultFactoryABI } from '../contracts/abis'
import { VAULT_FACTORY_ADDRESS, ETH_USD_PRICE_FEED, CHAINLINK_PRICE_FEED_ABI } from '../utils/contracts'
import { getContractError } from '../utils/errors'
import { SUPPORTED_NETWORKS } from '../constants/networks'
import { rateLimitedRpcCall, getSepoliaClient } from '../utils/rpc'
import { useToast } from '@chakra-ui/react'

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
  const [isWalletInitialized, setIsWalletInitialized] = useState(false);
  const toast = useToast();

  // Track vaults that have been auto-withdrawn in this session
  const autoWithdrawnVaults = useRef<Set<string>>(new Set());

  // Set up provider and wallet when component mounts
  useEffect(() => {
    const initializeWallet = async () => {
    const savedWallets = localStorage.getItem('wallets');
    if (savedWallets) {
      const parsedWallets = JSON.parse(savedWallets);
      if (parsedWallets.length > 0) {
        const wallet = parsedWallets[0]; // Use first wallet by default
        setSelectedWallet(wallet);
        
        // Create provider based on network
        const network = SUPPORTED_NETWORKS.find(n => n.id === wallet.network);
        if (network) {
          try {
            // Create provider and signer first (these don't require network calls)
          const provider = new ethers.JsonRpcProvider(network.rpc[0]);
            const signer = new ethers.Wallet(wallet.privateKey, provider);
            
            // Set provider and signer immediately
          setProvider(provider);
            setSigner(signer);
            
            // Mark wallet as initialized immediately - we have enough to work
            setIsWalletInitialized(true);
            
            console.log('Wallet setup completed (basic):', {
              address: wallet.address,
              network: wallet.network,
              rpcUrl: network.rpc[0],
              signerAddress: signer.address,
            });
            
            // Test connection in background with rate limiting (optional)
            rateLimitedRpcCall(async () => {
              try {
                await provider.getBlockNumber();
                console.log('Provider connection test successful');
              } catch (testError) {
                console.warn('Provider connection test failed (non-critical):', testError);
                // Don't fail initialization - manual operations can still work
              }
            });
            
            // Wallet initialization complete
          } catch (error) {
            console.error('Error initializing wallet:', error);
            setError('Failed to initialize wallet connection');
        }
      }
    }
    }
    };

    initializeWallet();
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
        // Don't set error for price feed issues as they're not critical for core functionality
        // setError('Unable to fetch ETH/USD price from Chainlink. Please make sure you are connected to Sepolia network.');
      }
    };

    if (provider) {
      fetchCurrentEthPrice();
      const interval = setInterval(fetchCurrentEthPrice, 60000); // Update every 60 seconds to reduce rate limiting
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
        // lockStatus: [isLocked, currentPrice, timeRemaining, isPriceBased, isGoalBased, currentAmount, goalAmount, progressPercentage, unlockReason]
        const [isLocked, currentPrice, timeRemaining, isPriceBased, isGoalBased, currentAmount, goalAmount, progressPercentage, unlockReason] = lockStatus;
        
        // Get current price
        const currentPriceResult = await priceFeed.latestRoundData();
        
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingSeconds = Number(unlockTime) - currentTime;

        const isPriceLocked = isPriceBased;
        const isGoalLocked = isGoalBased;
        const isTimeLocked = isLocked && !isPriceLocked && !isGoalLocked;
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
          isLocked: isLocked,
          unlockReason: unlockReason,
        };
      });
    } catch (err) {
      // Only filter out specific errors that definitely indicate old/incompatible vaults
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('missing revert data') && 
          errorMessage.includes('CALL_EXCEPTION')) {
        // These are definitely old vault contracts - skip them
      return null;
      }
      
      // For other errors (rate limits, network issues), log but don't filter out the vault
      // This prevents vaults from disappearing due to temporary issues
      console.warn(`Temporary error fetching vault ${vaultAddress}, will retry:`, errorMessage);
      
      // Return a minimal vault object to keep it visible
      return {
        address: vaultAddress,
        balance: 0n,
        unlockTime: 0n,
        targetPrice: 0n,
        goalAmount: 0n,
        currentAmount: 0n,
        progressPercentage: 0,
        currentPrice: 0n,
        remainingTime: 0,
        creator: '',
        isTimeLocked: false,
        isPriceLocked: false,
        isGoalLocked: false,
        lockType: 'time' as const, // Use a valid lockType
        isLocked: true,
        unlockReason: 'Loading vault data...',
      };
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

          // Only update vaults if we successfully fetched some data
          const validVaults = fetchedVaultDetails.filter(isVaultData);
          if (validVaults.length > 0) {
            // Filter out vaults with 0 balance AND no loading state (truly empty/withdrawn vaults)
            const activeVaults = validVaults.filter(vault => 
              vault.balance > 0n || vault.unlockReason === 'Loading vault data...'
            );
            setVaults(activeVaults);
          } else if (vaultAddresses.length === 0) {
            // No vaults exist for this user
            setVaults([]);
          }
          // If no valid vaults but we have addresses, keep existing vaults (rate limit/network issue scenario)
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
    console.log('=== WITHDRAWAL FUNCTION STARTED ===');
    console.log('Parameters:', { 
      vaultAddress, 
      signer: !!signer, 
      provider: !!provider, 
      selectedWallet: !!selectedWallet,
      isWalletInitialized 
    });
    
    // For manual withdrawal, try to work even if global initialization had rate limit issues
    if (!selectedWallet) {
      console.log('Early exit: No wallet selected');
      setError('No wallet selected');
      return false;
    }

    // If signer/provider are missing but we have selectedWallet, try to recreate them
    let workingSigner = signer;
    let workingProvider = provider;
    
    if (!workingSigner || !workingProvider) {
      console.log('Missing signer/provider, attempting to recreate from selectedWallet...');
      try {
        const network = SUPPORTED_NETWORKS.find(n => n.id === selectedWallet.network);
        if (!network) {
          throw new Error('Network not found for selected wallet');
        }
        
        // Try multiple RPC endpoints for resilience
        let rpcError;
        for (const rpcUrl of network.rpc) {
          try {
            workingProvider = new ethers.JsonRpcProvider(rpcUrl);
            workingSigner = new ethers.Wallet(selectedWallet.privateKey, workingProvider);
            console.log('Successfully created working provider with RPC:', rpcUrl);
            break;
          } catch (err) {
            console.warn(`Failed to create provider with RPC ${rpcUrl}:`, err);
            rpcError = err;
            continue;
          }
        }
        
        if (!workingSigner || !workingProvider) {
          throw rpcError || new Error('All RPC endpoints failed');
        }
      } catch (error) {
        console.error('Failed to recreate signer/provider:', error);
        setError('Unable to connect to blockchain. Please try again later.');
        return false;
      }
    }

    console.log('Wallet components check passed');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting withdrawal process for vault:', vaultAddress);
      
      // Test signer connection
      try {
        const signerAddress = await workingSigner.getAddress();
        console.log('Using signer address:', signerAddress);
      } catch (signerError) {
        console.error('Signer error:', signerError);
        throw new Error('Signer is not properly connected');
      }
      
      try {
        const network = await workingProvider.getNetwork();
        console.log('Network:', network);
      } catch (networkError) {
        console.error('Network error:', networkError);
        throw new Error('Provider is not properly connected');
      }

      // Test basic RPC call
      try {
        const blockNumber = await workingProvider.getBlockNumber();
        console.log('Current block number:', blockNumber);
      } catch (rpcError) {
        console.error('RPC error:', rpcError);
        throw new Error('Unable to connect to blockchain network');
      }

      const vaultContract = new ethers.Contract(vaultAddress, TimeCapsuleVaultABI, workingSigner);

      // Check if vault is unlocked
      console.log('Checking vault lock status...');
      let lockStatus;
      try {
        lockStatus = await vaultContract.getLockStatus();
        console.log('Lock status:', lockStatus);
      } catch (lockStatusError) {
        console.error('Lock status error:', lockStatusError);
        throw new Error('Unable to read vault status - check if vault address is correct');
      }
      
      if (lockStatus[0]) {
        throw new Error(`Vault is still locked: ${lockStatus[8]}`); // unlockReason is at index 8
      }

      // Verify we're on the correct network
      const network = await workingProvider.getNetwork();
      console.log('Current network:', network);
      if (network.chainId !== 11155111n) { // Sepolia chainId
        throw new Error('Please switch to Sepolia testnet to withdraw from this vault');
      }

      // Check if vault has balance
      console.log('Checking vault balance...');
      const balance = await workingProvider.getBalance(vaultAddress);
      console.log('Vault balance:', ethers.formatEther(balance), 'ETH');
      
      if (balance === 0n) {
        throw new Error('Vault has no balance to withdraw');
      }

      console.log(`Withdrawing ${ethers.formatEther(balance)} ETH from vault ${vaultAddress}`);

      // Check gas estimation
      console.log('Estimating gas for withdrawal...');
      const gasEstimate = await vaultContract.withdraw.estimateGas();
      console.log('Estimated gas:', gasEstimate.toString());

      // Get current gas price
      const gasPrice = await workingProvider.getFeeData();
      console.log('Current gas price:', ethers.formatUnits(gasPrice.gasPrice || 0n, 'gwei'), 'gwei');

      // Withdraw funds with explicit gas settings
      const tx = await rateLimitedRpcCall(async () => {
        return await vaultContract.withdraw({
          gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer
          maxFeePerGas: gasPrice.maxFeePerGas,
          maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
        });
      });
      
      console.log('Withdrawal transaction submitted:', tx.hash);
      console.log('Transaction details:', {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        gasLimit: tx.gasLimit?.toString(),
        maxFeePerGas: tx.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
      });

      // Wait for transaction to be mined
      console.log('Waiting for transaction confirmation...');
      const receipt = await rateLimitedRpcCall(async () => {
        return await tx.wait();
      });
      console.log('Withdrawal transaction confirmed:', {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        status: receipt.status,
      });

      // Verify the withdrawal actually happened
      const newBalance = await workingProvider.getBalance(vaultAddress);
      console.log('Vault balance after withdrawal:', ethers.formatEther(newBalance), 'ETH');

      if (newBalance > 0n) {
        console.warn('Warning: Vault still has balance after withdrawal attempt');
      }

      // Update vaults list (remove this vault)
      setVaults(prevVaults => prevVaults.filter(v => v.address !== vaultAddress));

      return true;
    } catch (err) {
      console.error('=== WITHDRAWAL ERROR CAUGHT ===');
      console.error('Error withdrawing from vault:', err);
      console.error('Error details:', {
        name: (err as any).name,
        message: (err as any).message,
        code: (err as any).code,
        data: (err as any).data,
        transaction: (err as any).transaction,
      });
      
      const errorMessage = getContractError(err);
      console.log('Processed error message:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      console.log('=== WITHDRAWAL FUNCTION ENDED ===');
      setIsLoading(false);
    }
  };

  // Poll for unlocked vaults and auto-withdraw
  useEffect(() => {
    if (!isWalletInitialized || !signer || !provider || !selectedWallet || vaults.length === 0) {
      // Only log this occasionally to reduce console spam
      if (Math.random() < 0.1) {
        console.log('Auto-withdrawal not ready:', {
          isWalletInitialized,
          hasSigner: !!signer,
          hasProvider: !!provider,
          hasSelectedWallet: !!selectedWallet,
          vaultsCount: vaults.length
        });
      }
      return;
    }

    console.log('Starting auto-withdrawal polling...');

    const interval = setInterval(async () => {
      console.log('Checking for unlocked vaults to auto-withdraw...');
      
      for (const vault of vaults) {
        // Skip if already auto-withdrawn or has no balance
        if (autoWithdrawnVaults.current.has(vault.address)) {
          console.log(`Vault ${vault.address} already auto-withdrawn, skipping`);
          continue;
        }
        
        if (vault.balance === 0n) {
          console.log(`Vault ${vault.address} has no balance, skipping auto-withdrawal`);
          continue;
        }
        
          try {
          console.log(`Checking vault ${vault.address} for auto-withdrawal (balance: ${ethers.formatEther(vault.balance)} ETH)`);
            
            await rateLimitedRpcCall(async () => {
            // Check the actual vault status in real-time
              const vaultContract = new ethers.Contract(vault.address, TimeCapsuleVaultABI, provider);
              const lockStatus = await vaultContract.getLockStatus();
            const currentBalance = await provider.getBalance(vault.address);
            
            console.log(`Vault ${vault.address} real-time status:`, {
              locked: lockStatus[0],
              unlockReason: lockStatus[8],
              currentBalance: ethers.formatEther(currentBalance),
              cachedBalance: ethers.formatEther(vault.balance)
            });
              
            // Only proceed if the vault is actually unlocked and has balance
            if (!lockStatus[0] && currentBalance > 0n) {
              console.log(`Vault ${vault.address} confirmed unlocked, proceeding with auto-withdrawal`);
              const success = await withdraw(vault.address);
              
              if (success) {
                autoWithdrawnVaults.current.add(vault.address);
                console.log(`🎉 AUTO-WITHDRAWAL SUCCESSFUL! ${ethers.formatEther(currentBalance)} ETH withdrawn from vault ${vault.address}`);
                
                // Show success toast notification
                toast({
                  title: "Auto-withdrawal successful! 🎉",
                  description: `${ethers.formatEther(currentBalance)} ETH has been automatically withdrawn from your vault.`,
                  status: "success",
                  duration: 5000,
                  isClosable: true,
                  position: "top-right",
                });
              } else {
                console.log(`Auto-withdrawal failed for vault ${vault.address}`);
                
                // Show error toast notification
                toast({
                  title: "Auto-withdrawal failed",
                  description: "Failed to automatically withdraw funds. You can try manual withdrawal.",
                  status: "error",
                  duration: 5000,
                  isClosable: true,
                  position: "top-right",
                });
              }
            } else {
              console.log(`Vault ${vault.address} is still locked or has no balance, skipping auto-withdrawal`);
              }
            });
          } catch (err) {
          console.error(`Auto-withdrawal check failed for vault ${vault.address}:`, err);
            // Don't add to autoWithdrawnVaults so it will retry next poll
            // But add a small delay to prevent spam
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
    }, 120000); // Check every 2 minutes for auto-withdrawal

    return () => {
      console.log('Stopping auto-withdrawal polling...');
      clearInterval(interval);
    };
  }, [isWalletInitialized, signer, provider, selectedWallet, vaults]);

  // Refresh vault data more frequently to keep UI updated
  useEffect(() => {
    if (!isWalletInitialized || !signer || !provider || !selectedWallet || vaults.length === 0) {
      return;
    }

    console.log('Starting vault data refresh polling...');
    
    const refreshInterval = setInterval(async () => {
      console.log('Refreshing vault data for UI...');
      try {
        // Re-fetch all vaults to update their status
        await rateLimitedRpcCall(async () => {
          const factoryContract = new ethers.Contract(VAULT_FACTORY_ADDRESS, VaultFactoryABI, provider);
          const vaultAddresses = await factoryContract.getUserVaults(selectedWallet.address);
          
          if (vaultAddresses) {
            const fetchedVaultDetails = await Promise.all(
              vaultAddresses.map(fetchVaultDetails)
            );

            function isVaultData(vault: VaultData | null): vault is VaultData {
              return Boolean(vault);
            }

            // Only update vaults if we successfully fetched some data
            const validVaults = fetchedVaultDetails.filter(isVaultData);
            if (validVaults.length > 0) {
              // Filter out vaults with 0 balance AND no loading state (truly empty/withdrawn vaults)
              const activeVaults = validVaults.filter(vault => 
                vault.balance > 0n || vault.unlockReason === 'Loading vault data...'
              );
              setVaults(activeVaults);
            } else if (vaultAddresses.length === 0) {
              // No vaults exist for this user
              setVaults([]);
            }
            // If no valid vaults but we have addresses, keep existing vaults (rate limit/network issue scenario)
          }
        });
      } catch (err) {
        console.error('Error refreshing vault data:', err);
        // Don't throw - just log and continue
      }
    }, 60000); // Refresh every 60 seconds

    return () => {
      console.log('Stopping vault data refresh polling...');
      clearInterval(refreshInterval);
    };
  }, [isWalletInitialized, signer, provider, selectedWallet, vaults.length, fetchVaultDetails]);

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
    isWalletInitialized,
  };
}; 