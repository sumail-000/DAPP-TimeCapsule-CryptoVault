# TimeCapsule CryptoVault 🔐

> **Programmable cryptocurrency vaults with time, price, and goal-based unlocking conditions**

A secure, user-friendly DApp that enables sophisticated crypto asset management through smart contract automation. Built on Ethereum with Chainlink oracle integration.

## Project Structure

### DApp (`/`)
- **Component**: `src/components/DAppLayout.tsx`
- **Purpose**: Full DApp functionality with dashboard
- **Features**:
  - Dashboard overview (`/`)
  - Wallet management (`/wallet`)
  - Vault creation (`/create-vault`)
  - Vault management (`/my-vaults`)
  - Network selection
  - Blockchain interactions

## Key Features

### Dashboard
- 📊 Overview statistics (total vaults, wallets, ETH locked/withdrawn)
- 📈 Recent vault activity
- ⚡ Quick action buttons
- 🎨 Modern dark theme interface

### DApp Functionality
- 💼 Multi-wallet support
- 🔐 Time-locked vaults
- 💰 Price-locked vaults
- ⏰ Combined time/price conditions
- 🔄 Auto-withdrawal functionality
- 🌐 Multi-chain support

## Technology Stack

- **Frontend**: React + TypeScript
- **UI Framework**: Chakra UI
- **Animations**: Framer Motion
- **Blockchain**: Ethers.js
- **Routing**: React Router
- **State Management**: React Context + Local Storage

## Getting Started

1. **Install dependencies**:
```bash
npm install
```

2. **Start development server**:
```bash
   npm run dev
   ```

3. **Access the application**:
   - Main DApp: `http://localhost:5173/`
   - Dashboard: `http://localhost:5173/dashboard`

## Architecture Benefits

### Simplified Structure
- **Single Application**: No separation between marketing and functionality
- **Direct Access**: Users land directly in the DApp
- **Streamlined UX**: Clean, focused user experience

### Comprehensive Dashboard
- **Overview**: At-a-glance statistics and recent activity
- **Quick Actions**: Easy access to main features
- **Visual Design**: Modern dark theme with purple accents

## Routes

### Main Routes
- `/` - Dashboard (default)
- `/dashboard` - Dashboard overview
- `/my-vaults` - View and manage vaults
- `/create-vault` - Create new vault
- `/wallet` - Wallet management
- `/wallet/:address` - Individual wallet details

## Development

### Adding New Features
- **Dashboard widgets**: Update `Dashboard.tsx`
- **DApp functionality**: Update components in `src/components/`
- **Routing**: Update `App.tsx` for new routes

### Styling
- Dark theme with purple accents throughout
- Responsive design for all screen sizes
- Consistent UI patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
