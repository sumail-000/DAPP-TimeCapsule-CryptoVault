// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TimeCapsuleVault.sol";

contract VaultFactory {
    mapping(address => address[]) public userVaults;
    
    event VaultCreated(address indexed user, address indexed vaultAddress);
    
    function createVault(uint256 _unlockTime, uint256 _targetPrice, uint256 _targetAmount, address _priceFeedAddress) external returns (address) {
        TimeCapsuleVault vault = new TimeCapsuleVault(_unlockTime, msg.sender, _targetPrice, _targetAmount, _priceFeedAddress);
        userVaults[msg.sender].push(address(vault));
        
        emit VaultCreated(msg.sender, address(vault));
        return address(vault);
    }
    
    function getUserVaults(address _user) external view returns (address[] memory) {
        return userVaults[_user];
    }

    function removeVault(address _vaultAddress) external {
        TimeCapsuleVault vault = TimeCapsuleVault(_vaultAddress);
        (bool locked, , , , , , , , ) = vault.getLockStatus();
        require(!locked, "Vault is still locked");
        require(address(vault).balance == 0, "Vault is not empty");

        address[] storage vaults = userVaults[msg.sender];
        for (uint i = 0; i < vaults.length; i++) {
            if (vaults[i] == _vaultAddress) {
                // Swap with the last element and pop
                vaults[i] = vaults[vaults.length - 1];
                vaults.pop();
                break;
            }
        }
    }
} 