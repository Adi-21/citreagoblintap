const { ethers } = require('ethers');

async function main() {
  console.log('💰 Testing Money Flow...\n');

  // Connect to Citrea testnet
  const provider = new ethers.JsonRpcProvider('https://rpc.testnet.citrea.xyz');
  
  // Contract addresses from your setup
  const gameAddress = '0xEC163E9c958C574720b03696513a3e4c85e8d391';
  const poolAddress = '0xD96f8B90d06dB950e8d4D97b72049A08905D44E0';
  
  console.log('📋 Addresses:');
  console.log('   Game Contract:', gameAddress);
  console.log('   Pool Contract:', poolAddress);
  console.log('');

  try {
    // Get current balances
    console.log('💳 Current Balances:');
    
    const gameBalance = await provider.getBalance(gameAddress);
    console.log('   Game Contract:', ethers.formatEther(gameBalance), 'cBTC');
    
    const poolBalance = await provider.getBalance(poolAddress);
    console.log('   Pool Contract:', ethers.formatEther(poolBalance), 'cBTC');
    
    // Get pool status
    const poolABI = [
      'function getPoolStatus() view returns (uint256, uint256, uint256, uint256)',
      'function totalPool() view returns (uint256)',
      'function gameContract() view returns (address)',
      'function owner() view returns (address)'
    ];
    
    const poolContract = new ethers.Contract(poolAddress, poolABI, provider);
    
    const poolStatus = await poolContract.getPoolStatus();
    console.log('\n🏦 Pool Status:');
    console.log('   Total Pool:', ethers.formatEther(poolStatus[0]), 'cBTC');
    console.log('   House Reserve:', ethers.formatEther(poolStatus[1]), 'cBTC');
    console.log('   Player Funds:', ethers.formatEther(poolStatus[2]), 'cBTC');
    console.log('   Contract Balance:', ethers.formatEther(poolStatus[3]), 'cBTC');
    
    // Check game contract connection
    const gameABI = [
      'function bettingPool() view returns (address)',
      'function owner() view returns (address)',
      'function previewPayout(uint256, uint8) view returns (uint256)'
    ];
    
    const gameContract = new ethers.Contract(gameAddress, gameABI, provider);
    
    const connectedPool = await gameContract.bettingPool();
    console.log('\n🔗 Contract Connections:');
    console.log('   Game → Pool:', connectedPool);
    console.log('   Pool → Game:', await poolContract.gameContract());
    
    if (connectedPool.toLowerCase() !== poolAddress.toLowerCase()) {
      console.log('❌ MISMATCH: Game contract points to different pool!');
      console.log('   Expected:', poolAddress);
      console.log('   Actual:', connectedPool);
    } else {
      console.log('✅ Contracts properly connected');
    }
    
    // Test payout calculation
    const betAmount = ethers.parseEther('0.001');
    const payout10 = await gameContract.previewPayout(betAmount, 10);
    console.log('\n🎯 Payout Preview:');
    console.log('   Bet: 0.001 cBTC');
    console.log('   Win (10 goblins): ' + ethers.formatEther(payout10) + ' cBTC');
    console.log('   Multiplier:', (parseFloat(ethers.formatEther(payout10)) / 0.001).toFixed(2) + 'x');
    
    // Check if pool can afford the payout
    const canAfford = poolStatus[3] >= payout10; // contract balance >= payout
    console.log('   Pool can afford payout:', canAfford ? '✅' : '❌');
    
    if (!canAfford) {
      console.log('   ⚠️  Pool balance too low for payout!');
      console.log('   Needed:', ethers.formatEther(payout10), 'cBTC');
      console.log('   Available:', ethers.formatEther(poolStatus[3]), 'cBTC');
    }
    
    // Check ownership
    console.log('\n👤 Ownership:');
    console.log('   Game Owner:', await gameContract.owner());
    console.log('   Pool Owner:', await poolContract.owner());
    
    console.log('\n🔧 Troubleshooting:');
    
    if (gameBalance > 0) {
      console.log('⚠️  Game contract has balance - money might be stuck there');
      console.log('   This could mean bets aren\'t being forwarded to pool');
    }
    
    if (poolStatus[3] === 0n) {
      console.log('❌ Pool contract has no balance - no funds for payouts');
      console.log('   Need to either:');
      console.log('   1. Fund the pool directly: send cBTC to ' + poolAddress);
      console.log('   2. Ensure bets are forwarded from game to pool');
    }
    
    if (poolStatus[0] !== poolStatus[3]) {
      console.log('⚠️  Pool accounting mismatch');
      console.log('   Total Pool (tracked):', ethers.formatEther(poolStatus[0]), 'cBTC');
      console.log('   Contract Balance:', ethers.formatEther(poolStatus[3]), 'cBTC');
    }
    
    console.log('\n💡 For proper money flow:');
    console.log('1. User places bet → Money goes to Game Contract');
    console.log('2. Game Contract → Forwards money to Pool Contract');
    console.log('3. Pool Contract → Tracks player/house funds');
    console.log('4. User wins → Pool Contract sends payout directly to user');
    console.log('5. Balances update in real-time');

  } catch (error) {
    console.error('❌ Money flow test failed:', error);
  }
}

main().catch(console.error); 