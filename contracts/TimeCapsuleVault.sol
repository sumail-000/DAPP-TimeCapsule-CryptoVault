// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract TimeCapsuleVault {
    address public creator;
    uint256 public unlockTime;
    uint256 public targetPrice;
    AggregatorV3Interface public priceFeed;
    bool public isPriceLock;

    event PriceUpdated(int256 newPrice);
    event VaultUnlocked(string reason);

    constructor(uint256 _unlockTime, address _owner, uint256 _targetPrice, address _priceFeedAddress) {
        creator = _owner;
        unlockTime = _unlockTime;
        targetPrice = _targetPrice;
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        isPriceLock = _targetPrice > 0;
    }

    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        // Multiple deposits allowed, no flag needed
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
        string memory unlockReason
    ) {
        currentPrice = uint256(getLatestPrice());
        timeRemaining = block.timestamp >= unlockTime ? 0 : unlockTime - block.timestamp;
        isPriceBased = isPriceLock;
        
        if (block.timestamp >= unlockTime) {
            locked = false;
            unlockReason = "Time lock expired";
        } else if (isPriceLock && currentPrice >= targetPrice) {
            locked = false;
            unlockReason = "Price target reached";
        } else {
            locked = true;
            unlockReason = isPriceLock ? "Waiting for price target" : "Waiting for time lock";
        }
    }
} 