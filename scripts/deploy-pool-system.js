const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
  console.log('🚀 Deploying Pool-Based Betting System...\n');

  // Connect to Citrea testnet
  const provider = new ethers.JsonRpcProvider('https://rpc.testnet.citrea.xyz');
  
  // Use your private key (add to .env file)
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ Please set PRIVATE_KEY in your .env file');
    process.exit(1);
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log('📝 Deploying from wallet:', wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Wallet balance:', ethers.formatEther(balance), 'cBTC\n');
  
  if (balance < ethers.parseEther('0.01')) {
    console.error('❌ Insufficient balance. Need at least 0.01 cBTC for deployment.');
    process.exit(1);
  }

  try {
    // Step 1: Deploy BettingPool with initial funding
    console.log('📦 Step 1: Deploying BettingPool...');
    const initialPoolFunding = ethers.parseEther('0.005'); // 0.005 cBTC initial funding
    
    const poolCode = fs.readFileSync('./contracts/BettingPool.sol', 'utf8');
    // Note: In a real deployment, you'd compile this with hardhat/foundry
    // For now, assume it's compiled elsewhere or use Remix
    
    console.log('🏗️  BettingPool Features:');
    console.log('   • Initial funding:', ethers.formatEther(initialPoolFunding), 'cBTC');
    console.log('   • House edge: 5%');
    console.log('   • Min pool balance: 0.1 cBTC');
    console.log('   • Max payout: 50% of pool');
    console.log('   • Payout multipliers: 1.15x, 1.4x, 1.8x (reduced for sustainability)');
    
    // Note: Replace with actual deployment when contracts are compiled
    console.log('⚠️  Manual deployment required:');
    console.log('   1. Compile BettingPool.sol in Remix');
    console.log('   2. Deploy with', ethers.formatEther(initialPoolFunding), 'cBTC value');
    console.log('   3. Note the deployed address');
    console.log('   4. Come back and run this script with POOL_ADDRESS env var\n');
    
    // If pool address is provided, deploy game contract
    const poolAddress = process.env.POOL_ADDRESS;
    if (poolAddress) {
      console.log('📦 Step 2: Deploying GoblinTapV2...');
      console.log('🔗 Connecting to pool at:', poolAddress);
      
      // Note: Replace with actual deployment
      console.log('⚠️  Manual deployment required:');
      console.log('   1. Compile GoblinTapV2.sol in Remix');
      console.log('   2. Deploy with pool address:', poolAddress);
      console.log('   3. Note the deployed address');
      console.log('   4. Set game contract in pool using setGameContract()');
      
      console.log('\n🎯 Deployment Summary:');
      console.log('   • BettingPool: [Manual deployment needed]');
      console.log('   • GoblinTapV2: [Manual deployment needed]');
      console.log('   • Initial pool funding:', ethers.formatEther(initialPoolFunding), 'cBTC');
      console.log('   • House edge: 5%');
      console.log('   • Sustainable economics: ✅');
    } else {
      console.log('💡 Next steps:');
      console.log('   1. Deploy BettingPool in Remix with initial funding');
      console.log('   2. Set POOL_ADDRESS=<deployed_address> in .env');
      console.log('   3. Run this script again to deploy GoblinTapV2');
      console.log('   4. Update your frontend to use the new contract addresses');
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
}

// Additional helper functions
function generateContractInterfaces() {
  console.log('\n📋 Contract Interface Summary:');
  console.log('\n🏦 BettingPool Functions:');
  console.log('   • fundPool() payable - Add more funds to pool');
  console.log('   • getPoolStatus() view - Check pool balances');
  console.log('   • setGameContract(address) - Connect game contract');
  console.log('   • emergencyWithdraw() - Owner emergency function');
  
  console.log('\n🎮 GoblinTapV2 Functions:');
  console.log('   • placeBet() payable - Same as before');
  console.log('   • claimWinnings(uint8) - Same as before');
  console.log('   • previewPayout(uint256, uint8) view - Preview winnings');
  console.log('   • canClaimPayout(address, uint8) view - Check if payout possible');
  
  console.log('\n💰 Economics:');
  console.log('   • Player bets 0.001 cBTC → 0.00095 goes to player pool, 0.00005 to house');
  console.log('   • Player wins 10 goblins → Gets 0.001 × 1.8 = 0.0018 cBTC from pool');
  console.log('   • Pool sustainability: House edge covers operational costs');
  console.log('   • Pool grows over time from house edge and lost bets');
}

if (require.main === module) {
  main().then(() => {
    generateContractInterfaces();
  }).catch(console.error);
}

module.exports = { main, generateContractInterfaces }; 