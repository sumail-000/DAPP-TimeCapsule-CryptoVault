# TimeCapsule CryptoVault - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Creating Your First Wallet](#creating-your-first-wallet)
3. [Creating Vaults](#creating-vaults)
4. [Managing Your Vaults](#managing-your-vaults)
5. [Understanding Lock Types](#understanding-lock-types)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### What is TimeCapsule CryptoVault?

TimeCapsule CryptoVault helps you lock away cryptocurrency until specific conditions are met:
- **Time Lock**: Release funds on a future date
- **Price Lock**: Release when ETH reaches your target price
- **Goal Lock**: Release when you've saved a target amount

### Prerequisites
- Web browser (Chrome, Firefox, Edge, Safari)
- Internet connection
- Basic understanding of cryptocurrency

## Creating Your First Wallet

### Step 1: Access the Application
1. Navigate to the TimeCapsule CryptoVault web application
2. You'll see the welcome screen with options to create a vault or manage wallets

### Step 2: Create a New Wallet
1. Click **"Wallets"** in the navigation menu
2. Click **"Create Your First Wallet"** button
3. Choose **"Generate New Wallet"** tab
4. Enter a memorable name for your wallet
5. Click **"Generate Wallet"**

⚠️ **IMPORTANT**: Your private key will be displayed. Save it securely!

### Step 3: Secure Your Wallet
1. **Copy the private key** to a secure location (password manager, hardware wallet)
2. **Write down the address** for future reference
3. **Never share your private key** with anyone

## Creating Vaults

### Step 1: Navigate to Vault Creation
1. Click **"My Vaults"** in the navigation menu
2. Click **"Create Vault"** button
3. You'll see a multi-step vault creation form

### Step 2: Choose Lock Type

#### Time Lock Vault
1. Select **"Time Lock"** 
2. Set your unlock date and time
3. Minimum: 1 hour, Maximum: 10 years

#### Price Lock Vault  
1. Select **"Price Lock"**
2. Enter target ETH price in USD
3. Vault unlocks when ETH reaches this price

#### Goal Lock Vault
1. Select **"Goal Lock"**
2. Enter target amount in USD
3. Vault unlocks when you've deposited this amount

#### Combined Locks
You can combine multiple lock types - the vault unlocks when ANY condition is met.

### Step 3: Set Amount and Create
1. Enter the amount of ETH to lock
2. Review your settings
3. Click **"Create Vault"**
4. Confirm the transaction in your wallet

## Managing Your Vaults

### Viewing Vault Status
Your vaults dashboard shows:
- **Balance**: Current ETH locked in each vault
- **Status**: Locked/Unlocked
- **Progress**: Time remaining, price progress, or goal progress
- **Lock Type**: Visual indicators for each lock condition

### Depositing to Vaults
1. Click on any vault card
2. Enter additional deposit amount
3. Click **"Deposit"**
4. Confirm transaction

### Withdrawing from Vaults
1. Vault must be unlocked (at least one condition met)
2. Click **"Withdraw"** button
3. Confirm transaction
4. Funds will be sent to your wallet

### Auto-Withdrawal
The system automatically withdraws funds when vaults unlock:
- Checks every 2 minutes for unlocked vaults
- Sends notifications when auto-withdrawal occurs
- You can also manually withdraw anytime

## Understanding Lock Types

### Time Lock 🕐
**Purpose**: Prevent access to funds until a specific date/time

**Use Cases**:
- Long-term savings goals
- Preventing impulsive trading
- Retirement planning
- Gift scheduling

**How it Works**:
- Set any future date/time (minimum 1 hour, maximum 10 years)
- Funds are locked until that exact moment
- Automatically unlocks at the specified time

### Price Lock 📈
**Purpose**: Release funds when ETH reaches your target price

**Use Cases**:
- Take profit at specific price levels
- Dollar-cost averaging exits
- Market timing strategies

**How it Works**:
- Uses Chainlink oracles for real-time ETH/USD prices
- Price data updated every few minutes
- Automatically unlocks when target price is reached

### Goal Lock 💰
**Purpose**: Encourage saving until you reach a target amount

**Use Cases**:
- Emergency fund building
- Savings challenges
- Investment accumulation
- Budget enforcement

**How it Works**:
- Set a target amount in USD
- Make multiple deposits over time
- Unlocks when total deposits reach your goal

## Security Best Practices

### Wallet Security
- ✅ **Store private keys securely** (password manager, hardware wallet)
- ✅ **Use strong, unique passwords**
- ✅ **Enable 2FA** on all related accounts
- ❌ **Never share private keys**
- ❌ **Don't screenshot private keys**

### Vault Security
- ✅ **Start with small amounts** to test
- ✅ **Verify lock conditions** before creating vaults
- ✅ **Keep backup wallet information**
- ❌ **Don't lock more than you can afford to lose**

### Network Security
- ✅ **Use official website only**
- ✅ **Check URL carefully** before connecting
- ✅ **Use secure networks** (avoid public WiFi for transactions)
- ❌ **Don't click suspicious links**

## Troubleshooting

### Common Issues

#### "Wallet not connected"
**Solution**: 
1. Refresh the page
2. Ensure you have a wallet created
3. Check your internet connection

#### "Transaction failed"
**Solution**:
1. Check you have enough ETH for gas fees
2. Try increasing gas price
3. Wait a few minutes and retry

#### "Vault still locked"
**Solution**:
1. Check if lock conditions are actually met
2. Wait for next price update (if price lock)
3. Verify current time vs. unlock time

#### "Auto-withdrawal not working"
**Solution**:
1. Check vault is actually unlocked
2. Ensure you have gas fees available
3. Manual withdrawal is always available

### Getting Help

#### Documentation
- Technical Whitepaper: `docs/TECHNICAL_WHITEPAPER.md`
- API Documentation: `docs/API_REFERENCE.md`
- Architecture Guide: `docs/ARCHITECTURE.md`

#### Support Channels
- GitHub Issues: Report bugs and feature requests
- Community Discord: Real-time help and discussion
- Email Support: Contact for serious issues

#### Emergency Procedures

If you cannot access your funds and believe there's a critical issue:

1. **Check vault status** - ensure unlock conditions are met
2. **Try manual withdrawal** - auto-withdrawal might be delayed
3. **Wait 24 hours** - some operations have delays
4. **Contact support** - provide vault address and transaction hashes
5. **Emergency withdrawal** - available after 1 year as last resort

## Advanced Features

### Emergency Withdrawal
After 1 year from vault creation, emergency withdrawal becomes available regardless of lock conditions. This prevents permanent fund loss from oracle failures or other technical issues.

### Vault Removal
Empty and unlocked vaults can be removed from your dashboard to keep it clean. This doesn't affect your funds - it's just a UI cleanup feature.

### Multiple Wallets
You can create and manage multiple wallets within the application. Each wallet can have its own vaults and operate independently.

### Network Selection
Currently supports Sepolia testnet. Mainnet support coming soon.

---

**Remember**: Cryptocurrency transactions are irreversible. Always double-check addresses, amounts, and conditions before confirming any transaction. 