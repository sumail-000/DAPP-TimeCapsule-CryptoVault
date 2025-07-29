// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract TimeCapsuleVault {
    address public creator;
    uint256 public unlockTime;
    uint256 public targetPrice;
    uint256 public targetAmount;
    uint256 public immutable createdAt; // Contract creation timestamp for emergency withdrawal
    AggregatorV3Interface public priceFeed;
    bool public isPriceLock;
    bool public isGoalLock;
    
    // Reentrancy protection
    bool private locked;
    
    // Constants for validation
    uint256 public constant MAX_LOCK_DURATION = 10 * 365 days; // 10 years max
    uint256 public constant MIN_LOCK_DURATION = 1 hours; // 1 hour min
    uint256 public constant MAX_TARGET_AMOUNT = 10000 ether; // 10,000 ETH max
    uint256 public constant PRICE_DECIMALS = 8; // Chainlink price decimals
    uint256 public constant MAX_PRICE_CHANGE = 50; // 50% max price change per hour (circuit breaker)

    // For oracle circuit breaker
    int256 private lastValidPrice;
    uint256 private lastPriceUpdate;

    event PriceUpdated(int256 newPrice);
    event VaultUnlocked(string reason);
    event GoalProgress(uint256 currentAmount, uint256 targetAmount, uint256 progressPercentage);
    event Deposit(address indexed depositor, uint256 amount);
    event Withdrawal(address indexed creator, uint256 amount);
    // Event for automatic withdrawals
    event AutoWithdrawal(address indexed creator, uint256 amount, string reason);

    modifier noReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyCreator() {
        require(msg.sender == creator, "Not authorized");
        _;
    }

    modifier autoWithdrawIfUnlocked() {
        _;
        // After any state change, check if vault should auto-withdraw
        _checkAndExecuteAutoWithdraw();
    }

    constructor(
        uint256 _unlockTime, 
        address _owner, 
        uint256 _targetPrice, 
        uint256 _targetAmount, 
        address _priceFeedAddress
    ) {
        // Input validation
        require(_owner != address(0), "Invalid owner address");
        require(_priceFeedAddress != address(0), "Invalid price feed address");
        
        // Time validation
        if (_unlockTime > 0) {
            require(_unlockTime > block.timestamp, "Unlock time must be in future");
            require(_unlockTime <= block.timestamp + MAX_LOCK_DURATION, "Lock duration too long");
            require(_unlockTime >= block.timestamp + MIN_LOCK_DURATION, "Lock duration too short");
        }
        
        // Amount validation
        if (_targetAmount > 0) {
            require(_targetAmount <= MAX_TARGET_AMOUNT, "Target amount too high");
            require(_targetAmount >= 0.001 ether, "Target amount too low");
        }
        
        // Price validation (basic check - price should be positive)
        if (_targetPrice > 0) {
            require(_targetPrice > 0, "Target price must be positive");
        }
        
        creator = _owner;
        unlockTime = _unlockTime;
        targetPrice = _targetPrice;
        targetAmount = _targetAmount;
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        isPriceLock = _targetPrice > 0;
        isGoalLock = _targetAmount > 0;
        
        // At least one lock condition must be set
        require(_unlockTime > 0 || _targetPrice > 0 || _targetAmount > 0, "At least one lock condition required");
        
        // Set contract creation timestamp for emergency withdrawal
        createdAt = block.timestamp;
    }

    function deposit() external payable autoWithdrawIfUnlocked {
        require(msg.value >= 0.001 ether, "Minimum deposit is 0.001 ETH");
        require(address(this).balance <= MAX_TARGET_AMOUNT, "Vault would exceed maximum capacity");
        
        if (isGoalLock) {
            uint256 currentBalance = address(this).balance;
            uint256 progressPercentage = (currentBalance * 100) / targetAmount;
            emit GoalProgress(currentBalance, targetAmount, progressPercentage);
        }
        
        emit Deposit(msg.sender, msg.value);
    }

    function getLatestPrice() public view returns (int256) {
        try priceFeed.latestRoundData() returns (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            require(price > 0, "Invalid price from oracle");
            require(updatedAt > 0, "Round not complete");
            require(block.timestamp - updatedAt < 1 hours, "Price data too old");
            
            // Circuit breaker: check for extreme price changes
            if (lastValidPrice > 0 && lastPriceUpdate > 0) {
                uint256 timeDiff = block.timestamp - lastPriceUpdate;
                if (timeDiff < 1 hours) {
                    // Calculate percentage change
                    uint256 priceChange = price > lastValidPrice ? 
                        uint256((price - lastValidPrice) * 100 / lastValidPrice) :
                        uint256((lastValidPrice - price) * 100 / lastValidPrice);
                    
                    require(priceChange <= MAX_PRICE_CHANGE, "Price change too extreme");
                }
            }
            
        return price;
        } catch {
            revert("Failed to get price from oracle");
        }
    }

    // Internal function to update last valid price (for circuit breaker)
    function _updateLastValidPrice() internal {
        try this.getLatestPrice() returns (int256 price) {
            lastValidPrice = price;
            lastPriceUpdate = block.timestamp;
            emit PriceUpdated(price);
        } catch {
            // Price update failed, keep using last valid price
        }
    }

    function withdraw() external onlyCreator noReentrant {
        require(address(this).balance > 0, "Nothing to withdraw");
        
        bool canUnlock = false;
        string memory unlockReason = "";
        
        // Check time lock
        if (unlockTime > 0 && block.timestamp >= unlockTime) {
            canUnlock = true;
            unlockReason = "Time lock expired";
        }
        
        // Check price lock
        if (isPriceLock && !canUnlock) {
            try this.getLatestPrice() returns (int256 currentPrice) {
                if (uint256(currentPrice) >= targetPrice) {
            canUnlock = true;
            unlockReason = "Price target reached";
                }
            } catch {
                // If price feed fails, don't allow price-based unlock
                // User can still unlock via time or goal conditions
            }
        }
        
        // Check goal lock
        if (isGoalLock && !canUnlock) {
            if (address(this).balance >= targetAmount) {
            canUnlock = true;
            unlockReason = "Goal amount reached";
            }
        }
        
        require(canUnlock, "Vault is still locked");
        
        uint256 amount = address(this).balance;
        
        // Use call instead of transfer for better gas compatibility
        (bool success, ) = payable(creator).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit VaultUnlocked(unlockReason);
        emit Withdrawal(creator, amount);
    }

    function getLockStatus() external view returns (
        bool isLocked,
        uint256 currentPrice,
        uint256 timeRemaining,
        bool isPriceBased,
        bool isGoalBased,
        uint256 currentAmount,
        uint256 goalAmount,
        uint256 progressPercentage,
        string memory unlockReason
    ) {
        // Get current price safely
        try this.getLatestPrice() returns (int256 price) {
            currentPrice = uint256(price);
        } catch {
            currentPrice = 0; // Indicate price feed failure
        }
        
        timeRemaining = block.timestamp >= unlockTime ? 0 : unlockTime - block.timestamp;
        isPriceBased = isPriceLock;
        isGoalBased = isGoalLock;
        currentAmount = address(this).balance;
        goalAmount = targetAmount;
        progressPercentage = isGoalLock && targetAmount > 0 ? (currentAmount * 100) / targetAmount : 0;
        
        // Determine lock status
        bool timeUnlocked = (unlockTime > 0) ? (block.timestamp >= unlockTime) : false;
        bool priceUnlocked = (isPriceLock && currentPrice > 0) ? (currentPrice >= targetPrice) : false;
        bool goalUnlocked = isGoalLock ? (currentAmount >= targetAmount) : false;
        
        if (timeUnlocked) {
            isLocked = false;
            unlockReason = "Time lock expired";
        } else if (priceUnlocked) {
            isLocked = false;
            unlockReason = "Price target reached";
        } else if (goalUnlocked) {
            isLocked = false;
            unlockReason = "Goal amount reached";
        } else {
            isLocked = true;
            if (isGoalLock) {
                unlockReason = "Waiting for goal amount";
            } else if (isPriceLock) {
                unlockReason = "Waiting for price target";
            } else {
                unlockReason = "Waiting for time lock";
            }
        }
    }
    
    // Emergency function - allows creator to withdraw after a very long time regardless of conditions
    // This prevents funds from being permanently locked due to oracle failures
    function emergencyWithdraw() external onlyCreator noReentrant {
        // Emergency withdrawal available after 1 year from contract creation or unlock time (whichever is later)
        uint256 emergencyTime = unlockTime > 0 ? unlockTime + 365 days : createdAt + 365 days;
        require(block.timestamp >= emergencyTime, "Emergency withdraw not available yet");
        require(address(this).balance > 0, "Nothing to withdraw");
        
        uint256 amount = address(this).balance;
        (bool success, ) = payable(creator).call{value: amount}("");
        require(success, "Emergency transfer failed");
        
        emit VaultUnlocked("Emergency withdrawal");
        emit Withdrawal(creator, amount);
    }
    
    // View function to check if emergency withdrawal is available
    function canEmergencyWithdraw() external view returns (bool) {
        uint256 emergencyTime = unlockTime > 0 ? unlockTime + 365 days : createdAt + 365 days;
        return block.timestamp >= emergencyTime && address(this).balance > 0;
    }

    // Internal function to check and execute automatic withdrawal
    function _checkAndExecuteAutoWithdraw() internal noReentrant {
        if (address(this).balance == 0) return; // Nothing to withdraw
        
        bool canUnlock = false;
        string memory unlockReason = "";
        
        // Check time lock
        if (unlockTime > 0 && block.timestamp >= unlockTime) {
            canUnlock = true;
            unlockReason = "Time lock expired";
        }
        
        // Check price lock
        if (isPriceLock && !canUnlock) {
            try this.getLatestPrice() returns (int256 currentPrice) {
                if (uint256(currentPrice) >= targetPrice) {
                    canUnlock = true;
                    unlockReason = "Price target reached";
                }
            } catch {
                // If price feed fails, don't auto-withdraw
                return;
            }
        }
        
        // Check goal lock
        if (isGoalLock && !canUnlock) {
            if (address(this).balance >= targetAmount) {
                canUnlock = true;
                unlockReason = "Goal amount reached";
            }
        }
        
        // If unlocked, automatically withdraw to creator
        if (canUnlock) {
            uint256 amount = address(this).balance;
            
            // Use call instead of transfer for better gas compatibility
            (bool success, ) = payable(creator).call{value: amount}("");
            if (success) {
                emit AutoWithdrawal(creator, amount, unlockReason);
                emit VaultUnlocked(unlockReason);
                emit Withdrawal(creator, amount);
            }
            // If transfer fails, vault remains locked for manual withdrawal
        }
    }

    // Public function that anyone can call to trigger auto-withdrawal check
    // This allows external services, bots, or users to trigger withdrawals
    function triggerAutoWithdraw() external {
        _checkAndExecuteAutoWithdraw();
    }

    // Function to check if vault can be auto-withdrawn (view function)
    function canAutoWithdraw() external view returns (bool canUnlock, string memory reason) {
        if (address(this).balance == 0) return (false, "No funds to withdraw");
        
        // Check time lock
        if (unlockTime > 0 && block.timestamp >= unlockTime) {
            return (true, "Time lock expired");
        }
        
        // Check price lock
        if (isPriceLock) {
            try this.getLatestPrice() returns (int256 currentPrice) {
                if (uint256(currentPrice) >= targetPrice) {
                    return (true, "Price target reached");
                }
            } catch {
                // Price feed failed, can't determine
                return (false, "Price feed unavailable");
            }
        }
        
        // Check goal lock
        if (isGoalLock && address(this).balance >= targetAmount) {
            return (true, "Goal amount reached");
        }
        
        return (false, "Vault still locked");
    }
} 