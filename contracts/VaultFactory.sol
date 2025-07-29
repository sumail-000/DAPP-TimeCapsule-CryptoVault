// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TimeCapsuleVault.sol";
import "./VaultAutomation.sol";

contract VaultFactory {
    address public owner; // Factory owner for admin functions
    mapping(address => address[]) public userVaults;
    mapping(address => bool) public validVaults; // Track valid vaults created by this factory
    
    uint256 public totalVaultsCreated;
    uint256 public constant MAX_VAULTS_PER_USER = 100; // Prevent spam
    
    VaultAutomation public automationContract; // Reference to automation contract
    
    event VaultCreated(address indexed user, address indexed vaultAddress, uint256 indexed vaultId);
    event VaultRemoved(address indexed user, address indexed vaultAddress);
    event AutomationContractSet(address indexed automationContract);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized: only owner");
        _;
    }

    constructor(address _automationContract) {
        owner = msg.sender; // Set deployer as initial owner
        if (_automationContract != address(0)) {
            automationContract = VaultAutomation(_automationContract);
            emit AutomationContractSet(_automationContract);
        }
    }

    /**
     * @dev Set or update the automation contract address (only owner)
     * @param _automationContract Address of the VaultAutomation contract
     */
    function setAutomationContract(address _automationContract) external onlyOwner {
        require(_automationContract != address(0), "Invalid automation contract");
        automationContract = VaultAutomation(_automationContract);
        emit AutomationContractSet(_automationContract);
    }

    /**
     * @dev Transfer ownership of the factory (only owner)
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }
    
    modifier validVaultParams(uint256 _unlockTime, uint256 _targetPrice, uint256 _targetAmount) {
        require(
            _unlockTime > 0 || _targetPrice > 0 || _targetAmount > 0,
            "At least one lock condition required"
        );
        
        if (_unlockTime > 0) {
            require(_unlockTime > block.timestamp, "Unlock time must be in future");
            require(_unlockTime <= block.timestamp + (10 * 365 days), "Lock duration too long");
        }
        
        if (_targetAmount > 0) {
            require(_targetAmount >= 0.001 ether, "Target amount too low");
            require(_targetAmount <= 10000 ether, "Target amount too high");
        }
        
        if (_targetPrice > 0) {
            require(_targetPrice > 0, "Target price must be positive");
        }
        _;
    }
    
    function createVault(
        uint256 _unlockTime, 
        uint256 _targetPrice, 
        uint256 _targetAmount, 
        address _priceFeedAddress
    ) 
        external 
        validVaultParams(_unlockTime, _targetPrice, _targetAmount)
        returns (address) 
    {
        require(_priceFeedAddress != address(0), "Invalid price feed address");
        require(userVaults[msg.sender].length < MAX_VAULTS_PER_USER, "Too many vaults for this user");
        
        TimeCapsuleVault vault = new TimeCapsuleVault(
            _unlockTime, 
            msg.sender, 
            _targetPrice, 
            _targetAmount, 
            _priceFeedAddress
        );
        
        address vaultAddress = address(vault);
        userVaults[msg.sender].push(vaultAddress);
        validVaults[vaultAddress] = true;
        totalVaultsCreated++;
        
        // Automatically register vault with automation system if available
        if (address(automationContract) != address(0)) {
            try automationContract.addVault(vaultAddress) {
                // Vault successfully registered for automatic withdrawal
            } catch {
                // Automation registration failed, but vault creation succeeded
                // Users can still manually register or withdraw
            }
        }
        
        emit VaultCreated(msg.sender, vaultAddress, totalVaultsCreated);
        return vaultAddress;
    }
    
    function getUserVaults(address _user) external view returns (address[] memory) {
        require(_user != address(0), "Invalid user address");
        return userVaults[_user];
    }

    function removeVault(address _vaultAddress) external {
        require(_vaultAddress != address(0), "Invalid vault address");
        require(validVaults[_vaultAddress], "Vault not created by this factory");
        
        TimeCapsuleVault vault = TimeCapsuleVault(_vaultAddress);
        
        // Verify the caller is the vault creator
        require(vault.creator() == msg.sender, "Not vault creator");
        
        // Check if vault can be removed
        (bool isLocked, , , , , , , , ) = vault.getLockStatus();
        require(!isLocked, "Vault is still locked");
        require(address(vault).balance == 0, "Vault is not empty");

        // Remove from user's vault list
        address[] storage vaults = userVaults[msg.sender];
        bool found = false;
        
        for (uint i = 0; i < vaults.length; i++) {
            if (vaults[i] == _vaultAddress) {
                // Move last element to current position and pop
                vaults[i] = vaults[vaults.length - 1];
                vaults.pop();
                found = true;
                break;
            }
        }
        
        require(found, "Vault not found in user's list");
        
        // Mark vault as invalid
        validVaults[_vaultAddress] = false;
        
        emit VaultRemoved(msg.sender, _vaultAddress);
    }
    
    // Get the number of vaults for a user
    function getUserVaultCount(address _user) external view returns (uint256) {
        require(_user != address(0), "Invalid user address");
        return userVaults[_user].length;
    }
    
    // Check if a vault was created by this factory
    function isValidVault(address _vaultAddress) external view returns (bool) {
        return validVaults[_vaultAddress];
    }
    
    // Get paginated vault list to handle users with many vaults
    function getUserVaultsPaginated(
        address _user, 
        uint256 _offset, 
        uint256 _limit
    ) external view returns (address[] memory) {
        require(_user != address(0), "Invalid user address");
        require(_limit > 0 && _limit <= 50, "Invalid limit"); // Max 50 per page
        
        address[] storage allVaults = userVaults[_user];
        uint256 totalVaults = allVaults.length;
        
        if (_offset >= totalVaults) {
            return new address[](0);
        }
        
        uint256 end = _offset + _limit;
        if (end > totalVaults) {
            end = totalVaults;
        }
        
        uint256 length = end - _offset;
        address[] memory result = new address[](length);
        
        for (uint256 i = 0; i < length; i++) {
            result[i] = allVaults[_offset + i];
        }
        
        return result;
    }
    
    // Get total number of vaults created by this factory
    function getTotalVaultsCreated() external view returns (uint256) {
        return totalVaultsCreated;
    }
} 