// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract TimeCapsuleVault {
    address public creator;
    uint256 public unlockTime;
    uint256 public targetPrice;
    uint256 public targetAmount;
    AggregatorV3Interface public priceFeed;
    bool public isPriceLock;
    bool public isGoalLock;

    event PriceUpdated(int256 newPrice);
    event VaultUnlocked(string reason);
    event GoalProgress(uint256 currentAmount, uint256 targetAmount, uint256 progressPercentage);

    constructor(uint256 _unlockTime, address _owner, uint256 _targetPrice, uint256 _targetAmount, address _priceFeedAddress) {
        creator = _owner;
        unlockTime = _unlockTime;
        targetPrice = _targetPrice;
        targetAmount = _targetAmount;
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        isPriceLock = _targetPrice > 0;
        isGoalLock = _targetAmount > 0;
    }

    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        
        if (isGoalLock) {
            uint256 currentBalance = address(this).balance;
            uint256 progressPercentage = (currentBalance * 100) / targetAmount;
            emit GoalProgress(currentBalance, targetAmount, progressPercentage);
        }
    }

    function getLatestPrice() public view returns (int256) {
        (, int256 price, , ,) = priceFeed.latestRoundData();
        return price;
    }

    function withdraw() external {
        require(msg.sender == creator, "Not creator");
        require(address(this).balance > 0, "Nothing deposited");
        
        bool canUnlock = false;
        string memory unlockReason = "";
        
        if (block.timestamp >= unlockTime) {
            canUnlock = true;
            unlockReason = "Time lock expired";
        } else if (isPriceLock && uint256(getLatestPrice()) >= targetPrice) {
            canUnlock = true;
            unlockReason = "Price target reached";
        } else if (isGoalLock && address(this).balance >= targetAmount) {
            canUnlock = true;
            unlockReason = "Goal amount reached";
        }
        
        require(canUnlock, "Vault is still locked");
        
        payable(creator).transfer(address(this).balance);
        emit VaultUnlocked(unlockReason);
    }

    function getLockStatus() external view returns (
        bool locked,
        uint256 currentPrice,
        uint256 timeRemaining,
        bool isPriceBased,
        bool isGoalBased,
        uint256 currentAmount,
        uint256 goalAmount,
        uint256 progressPercentage,
        string memory unlockReason
    ) {
        currentPrice = uint256(getLatestPrice());
        timeRemaining = block.timestamp >= unlockTime ? 0 : unlockTime - block.timestamp;
        isPriceBased = isPriceLock;
        isGoalBased = isGoalLock;
        currentAmount = address(this).balance;
        goalAmount = targetAmount;
        progressPercentage = isGoalLock && targetAmount > 0 ? (currentAmount * 100) / targetAmount : 0;
        
        if (block.timestamp >= unlockTime) {
            locked = false;
            unlockReason = "Time lock expired";
        } else if (isPriceLock && currentPrice >= targetPrice) {
            locked = false;
            unlockReason = "Price target reached";
        } else if (isGoalLock && currentAmount >= targetAmount) {
            locked = false;
            unlockReason = "Goal amount reached";
        } else {
            locked = true;
            if (isGoalLock) {
                unlockReason = "Waiting for goal amount";
            } else if (isPriceLock) {
                unlockReason = "Waiting for price target";
            } else {
                unlockReason = "Waiting for time lock";
            }
        }
    }
} 