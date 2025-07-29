// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TimeCapsuleVault.sol";

// Interface for Chainlink Automation
interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData)
        external
        view
        returns (bool upkeepNeeded, bytes memory performData);

    function performUpkeep(bytes calldata performData) external;
}

/**
 * @title VaultAutomation
 * @dev Chainlink Automation-compatible contract for automatic vault withdrawals
 * This contract makes vaults truly autonomous - they will automatically withdraw
 * when conditions are met, even if the DApp is offline
 */
contract VaultAutomation is AutomationCompatibleInterface {
    address public owner; // Contract owner
    address public factoryContract; // Authorized factory contract
    TimeCapsuleVault[] public monitoredVaults;
    mapping(address => bool) public isMonitored;
    
    // Gas limit constants to prevent DoS
    uint256 public constant MAX_VAULTS_PER_UPKEEP = 20; // Max vaults to process in one upkeep
    uint256 public constant WITHDRAWAL_GAS_LIMIT = 100000; // Gas limit per withdrawal
    
    event VaultAdded(address indexed vault);
    event VaultRemoved(address indexed vault);
    event AutoWithdrawTriggered(address indexed vault, string reason);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event FactoryContractSet(address indexed factoryContract);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized: only owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || msg.sender == factoryContract, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Set the authorized factory contract (only owner)
     * @param _factoryContract Address of the VaultFactory contract
     */
    function setFactoryContract(address _factoryContract) external onlyOwner {
        require(_factoryContract != address(0), "Invalid factory contract");
        factoryContract = _factoryContract;
        emit FactoryContractSet(_factoryContract);
    }

    /**
     * @dev Transfer ownership (only owner)
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    /**
     * @dev Add a vault to be monitored for automatic withdrawal
     * @param vault Address of the TimeCapsuleVault to monitor
     */
    function addVault(address vault) external onlyAuthorized {
        require(!isMonitored[vault], "Vault already monitored");
        
        TimeCapsuleVault vaultContract = TimeCapsuleVault(vault);
        // Verify it's a valid vault by checking if it has a creator
        require(vaultContract.creator() != address(0), "Invalid vault contract");
        
        monitoredVaults.push(vaultContract);
        isMonitored[vault] = true;
        
        emit VaultAdded(vault);
    }

    /**
     * @dev Remove a vault from monitoring (e.g., after withdrawal)
     * @param vault Address of the vault to stop monitoring
     */
    function removeVault(address vault) external onlyAuthorized {
        require(isMonitored[vault], "Vault not monitored");
        
        // Find and remove vault from array
        for (uint i = 0; i < monitoredVaults.length; i++) {
            if (address(monitoredVaults[i]) == vault) {
                monitoredVaults[i] = monitoredVaults[monitoredVaults.length - 1];
                monitoredVaults.pop();
                break;
            }
        }
        
        isMonitored[vault] = false;
        emit VaultRemoved(vault);
    }

    /**
     * @dev Chainlink Automation function - checks if any vaults need withdrawal
     * @return upkeepNeeded True if any vault can be auto-withdrawn
     * @return performData Encoded vault addresses that need withdrawal
     */
    function checkUpkeep(bytes calldata /* checkData */)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        address[] memory vaultsToWithdraw = new address[](MAX_VAULTS_PER_UPKEEP);
        uint256 count = 0;

        // Check each monitored vault (limited to prevent gas issues)
        uint256 maxToCheck = monitoredVaults.length > MAX_VAULTS_PER_UPKEEP ? MAX_VAULTS_PER_UPKEEP : monitoredVaults.length;
        
        for (uint i = 0; i < maxToCheck && count < MAX_VAULTS_PER_UPKEEP; i++) {
            TimeCapsuleVault vault = monitoredVaults[i];
            
            try vault.canAutoWithdraw() returns (bool canUnlock, string memory /* reason */) {
                if (canUnlock) {
                    vaultsToWithdraw[count] = address(vault);
                    count++;
                }
            } catch {
                // Skip vaults that can't be checked (might be invalid)
                continue;
            }
        }

        if (count > 0) {
            // Resize array to actual count
            address[] memory finalVaults = new address[](count);
            for (uint i = 0; i < count; i++) {
                finalVaults[i] = vaultsToWithdraw[i];
            }
            
            upkeepNeeded = true;
            performData = abi.encode(finalVaults);
        } else {
            upkeepNeeded = false;
            performData = "";
        }
    }

    /**
     * @dev Chainlink Automation function - executes automatic withdrawals
     * @param performData Encoded array of vault addresses to withdraw from
     */
    function performUpkeep(bytes calldata performData) external override {
        address[] memory vaultsToWithdraw = abi.decode(performData, (address[]));
        
        // Limit to prevent gas issues
        uint256 maxToProcess = vaultsToWithdraw.length > MAX_VAULTS_PER_UPKEEP ? MAX_VAULTS_PER_UPKEEP : vaultsToWithdraw.length;
        
        for (uint i = 0; i < maxToProcess; i++) {
            address vaultAddress = vaultsToWithdraw[i];
            
            if (isMonitored[vaultAddress]) {
                TimeCapsuleVault vault = TimeCapsuleVault(vaultAddress);
                
                // Use try-catch with gas limit to prevent DoS
                try vault.triggerAutoWithdraw{gas: WITHDRAWAL_GAS_LIMIT}() {
                    emit AutoWithdrawTriggered(vaultAddress, "Chainlink Automation");
                    
                    // Remove vault from monitoring after successful withdrawal if it's empty
                    if (address(vault).balance == 0) {
                        // Internal removal logic
                        for (uint j = 0; j < monitoredVaults.length; j++) {
                            if (address(monitoredVaults[j]) == vaultAddress) {
                                monitoredVaults[j] = monitoredVaults[monitoredVaults.length - 1];
                                monitoredVaults.pop();
                                break;
                            }
                        }
                        isMonitored[vaultAddress] = false;
                        emit VaultRemoved(vaultAddress);
                    }
                } catch {
                    // Withdrawal failed, keep monitoring
                    continue;
                }
            }
        }
    }

    /**
     * @dev Get all monitored vault addresses
     * @return Array of vault addresses being monitored
     */
    function getMonitoredVaults() external view returns (address[] memory) {
        address[] memory vaultAddresses = new address[](monitoredVaults.length);
        for (uint i = 0; i < monitoredVaults.length; i++) {
            vaultAddresses[i] = address(monitoredVaults[i]);
        }
        return vaultAddresses;
    }

    /**
     * @dev Get total number of monitored vaults
     */
    function getMonitoredVaultCount() external view returns (uint256) {
        return monitoredVaults.length;
    }
} 