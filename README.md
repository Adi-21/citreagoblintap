# 🎯 Goblin Tap - Citrea Blockchain Game

A fast-paced, skill-based game built on the Citrea blockchain where players bet cBTC on their ability to quickly tap goblins as they pop up from holes within a time limit. The more goblins you tap, the bigger the reward!

## 🎮 Game Overview

**Goblin Tap** is a hybrid blockchain game that combines:
- **Off-chain gameplay**: Fast, responsive tapping mechanics with smooth animations
- **On-chain betting**: Secure, transparent betting using cBTC on the Citrea network
- **Skill-based rewards**: Player skill directly influences payout multipliers

### Game Mechanics
- **Objective**: Tap goblins as they pop up from holes within 15 seconds
- **Betting**: Place cBTC bets before each round
- **Payouts**: 
  - Less than 5 Goblins: Loss of bet
  - 5-7 Goblins: 1.2x payout
  - 8-9 Goblins: 1.5x payout
  - 10+ Goblins: 2.0x payout

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Game Engine**: React with custom interval management for smooth gameplay
- **Authentication**: Privy for seamless Web3 onboarding
- **Blockchain**: Citrea network (Bitcoin ZK-Rollup)
- **Smart Contracts**: Solidity for betting and payout logic
- **Blockchain Interaction**: Viem for Ethereum-compatible interactions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- A Privy account (for authentication)
- Citrea testnet cBTC for testing

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd citrea-slingers
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Privy Configuration
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
   
   # Smart Contract Address
   NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address_here
   ```

4. **Deploy Smart Contract**
   ```bash
   # Deploy the GoblinTap.sol contract to Citrea testnet
   # Update the contract address in .env.local
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Privy Setup
1. Visit [Privy Console](https://console.privy.io/)
2. Create a new app
3. Copy your App ID to `NEXT_PUBLIC_PRIVY_APP_ID`

### Smart Contract Deployment
1. Deploy `contracts/GoblinTap.sol` to Citrea testnet
2. Update `NEXT_PUBLIC_CONTRACT_ADDRESS` with the deployed address
3. Fund the contract with cBTC for payouts

## 🎯 How to Play

1. **Connect Wallet**: Click "Login to Play" and connect via Privy
2. **Place Bet**: Enter your cBTC bet amount and confirm the transaction
3. **Tap Goblins**: Quickly tap goblins as they pop up from holes
4. **Beat the Clock**: You have 15 seconds to tap as many goblins as possible
5. **Claim Winnings**: Automatically claim your rewards based on performance

## 🏗️ Project Structure

```
citrea-slingers/
├── contracts/
│   └── GoblinTap.sol         # Smart contract for betting and payouts
├── src/
│   ├── app/                  # Next.js app router
│   │   ├── layout.tsx        # Root layout with Privy provider
│   │   └── page.tsx          # Main page component
│   ├── components/           # React components
│   │   ├── GoblinTapGame.tsx # Main game component (includes betting and results modals)
│   │   ├── WalletSetup.tsx   # Wallet creation/linking modal
│   │   └── DebugInfo.tsx     # Debug information overlay
│   ├── config/               # Configuration files
│   │   ├── blockchain.ts     # Blockchain and contract config
│   │   └── privy.tsx         # Privy authentication config
│   └── hooks/                # Custom React hooks
│       └── useBlockchain.ts  # Blockchain interaction hooks
├── scripts/
│   └── test-goblin-tap-contract.js # Contract testing script
├── package.json              # Dependencies and scripts
├── README.md                 # This file
└── SETUP.md                  # Setup instructions
```

## 🔒 Security Considerations

### Current Implementation (Prototype)
- **Client-side verification**: Game results are reported by the client
- **Trust model**: Players can potentially modify client to cheat
- **Suitable for**: Testing and demonstration purposes

### Production Requirements
For a production deployment with real value, implement:
- **ZK Proofs**: Cryptographic proof of correct game execution
- **Oracles**: Secure off-chain computation via Chainlink Functions
- **Multi-party verification**: Multiple validators for game results

## 🧪 Testing

### Smart Contract Testing
```bash
# Deploy to testnet and test betting flow
npm run test:contract
```

### Game Testing
```bash
# Run the development server
npm run dev

# Test the complete game flow:
# 1. Connect wallet
# 2. Place bet
# 3. Play game
# 4. Claim winnings
```

## 🚀 Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the code comments and this README
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join our community discussions

## 🎉 Acknowledgments

- **Citrea Team**: For the amazing Bitcoin ZK-Rollup
- **Privy**: For seamless Web3 authentication
- **Matter.js**: For the excellent physics engine
- **Next.js Team**: For the incredible React framework

---

**Happy Slinging! 🎯**
