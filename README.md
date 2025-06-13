# Time Capsule Vault

A decentralized application that allows users to create time-locked or price-locked vaults for ETH.

## Features

- Create time-locked vaults (unlock after a specific date)
- Create price-locked vaults (unlock when ETH reaches a target price)
- Deposit ETH into vaults
- Withdraw ETH when conditions are met
- View all your vaults and their status

## Prerequisites

- Node.js and npm
- Metamask or another Web3 wallet
- Sepolia testnet ETH

## Setup and Installation

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd timecapsule-vault-frontend
npm install
```

2. Configure environment variables:

Copy the `.env.example` file to `.env` and fill in your values:

```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
PRIVATE_KEY=YOUR_PRIVATE_KEY_FOR_DEPLOYMENT
```

⚠️ **WARNING:** Never commit your private key or API keys to source control. Keep your `.env` file in `.gitignore`.

3. Compile the smart contracts:

```bash
npm run compile
```

## Deploying the contracts

To fix the errors you're seeing, you need to deploy the Vault Factory contract to the Sepolia network:

1. Get some Sepolia ETH from a faucet like https://sepoliafaucet.com/

2. Make sure your `.env` file contains your private key and Sepolia RPC URL

3. Deploy the contract with:

```bash
# Enable script execution in PowerShell if needed
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Then run the deployment script
npx hardhat run scripts/deploy.ts --network sepolia
```

4. After deployment, update the contract address in `src/utils/contracts.ts`:

```typescript
// Update this with your deployed contract address
export const VAULT_FACTORY_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS' as const
```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## Usage

1. Connect your wallet to the application
2. Create a new vault by selecting either time-based or price-based locking
3. Deposit ETH into your vault
4. Monitor your vaults and withdraw when conditions are met

## Smart Contracts

The application uses two main smart contracts:

1. **VaultFactory**: A factory contract for creating new vaults
2. **TimeCapsuleVault**: The actual vault contract that holds ETH with time or price conditions

### Contract Architecture

- **VaultFactory.sol**
  - Creates new vault instances
  - Keeps track of vaults created by users
  - Allows removal of empty, unlocked vaults

- **TimeCapsuleVault.sol**
  - Stores ETH deposits
  - Enforces time-lock or price-lock conditions
  - Uses Chainlink price feeds for ETH/USD price data
  - Allows withdrawals when conditions are met

## Troubleshooting

### Error: Vault factory contract not deployed at the specified address

This error occurs because the frontend is trying to interact with a contract that doesn't exist at the specified address. Solutions:

1. Deploy the contract as described in the "Deploying the contracts" section
2. Update the contract address in `src/utils/contracts.ts` with your deployed contract address
3. Ensure you're connected to the Sepolia testnet in your wallet

### Error: The contract function "latestRoundData" returned no data ("0x")

This error occurs when the Chainlink price feed contract can't be accessed. Solutions:

1. Make sure you're connected to the Sepolia testnet in your wallet
2. Ensure the Chainlink price feed address in `src/utils/contracts.ts` is correct for Sepolia testnet

### PowerShell Execution Policy Errors

If you see errors about script execution being disabled:

```
File cannot be loaded because running scripts is disabled on this system.
```

Run this command in PowerShell before executing any scripts:

```
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Contract Deployment Guide

To successfully deploy the contracts:

1. Get Sepolia testnet ETH:
   - Visit https://sepoliafaucet.com/ or another Sepolia faucet
   - Request ETH for your deployment wallet

2. Configure your environment:
   - Create a `.env` file based on `.env.example`
   - Add your Sepolia RPC URL (from Alchemy or Infura)
   - Add your private key (with 0x prefix)

3. Compile contracts:
   ```bash
   npx hardhat compile
   ```

4. In PowerShell, enable script execution:
   ```bash
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```

5. Deploy contracts:
   ```bash
   node scripts/deploy.ts
   ```

6. Update the contract address:
   - Copy the deployed contract address from the terminal
   - Update the VAULT_FACTORY_ADDRESS in src/utils/contracts.ts

## License

MIT
