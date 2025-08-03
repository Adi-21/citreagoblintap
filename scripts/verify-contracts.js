const { ethers } = require('ethers');

async function main() {
  console.log('🔍 Verifying Contract Deployment...\n');

  // Connect to Citrea testnet
  const provider = new ethers.JsonRpcProvider('https://rpc.testnet.citrea.xyz');
  
  // Get addresses from environment or defaults
  const poolAddress = process.env.NEXT_PUBLIC_BETTING_POOL_ADDRESS || '0x0000000000000000000000000000000000000000';
  const gameAddress = process.env.NEXT_PUBLIC_GOBLIN_TAP_ADDRESS || '0x749eC2d29dd848DF5665Bc0F1AEDFF2F319b85d8';
  
  console.log('📋 Contract Addresses:');
  console.log('   Pool Contract:', poolAddress);
  console.log('   Game Contract:', gameAddress);
  console.log('');

  // Check if pool system is enabled
  const isPoolEnabled = poolAddress !== '0x0000000000000000000000000000000000000000';
  console.log('🏦 Pool System:', isPoolEnabled ? '✅ Enabled' : '❌ Disabled (Legacy Mode)');
  console.log('');

  if (!isPoolEnabled) {
    console.log('💡 To enable pool system:');
    console.log('   1. Deploy BettingPool contract');
    console.log('   2. Deploy GoblinTapV2 contract');
    console.log('   3. Set environment variables:');
    console.log('      NEXT_PUBLIC_BETTING_POOL_ADDRESS=0x...');
    console.log('      NEXT_PUBLIC_GOBLIN_TAP_ADDRESS=0x...');
    return;
  }

  try {
    // Check Pool Contract
    console.log('🔎 Checking Pool Contract...');
    const poolCode = await provider.getCode(poolAddress);
    
    if (poolCode === '0x') {
      console.log('❌ No contract deployed at pool address:', poolAddress);
      console.log('   Please deploy BettingPool contract first');
      return;
    } else {
      console.log('✅ Contract found at pool address');
      console.log('   Code size:', poolCode.length, 'bytes');
    }

    // Try to call basic functions
    console.log('\n📞 Testing Pool Contract Functions...');
    
    // Create contract instance (minimal ABI for testing)
    const poolABI = [
      'function owner() view returns (address)',
      'function totalPool() view returns (uint256)',
      'function gameContract() view returns (address)',
      'function getPoolStatus() view returns (uint256, uint256, uint256, uint256)'
    ];
    
    const poolContract = new ethers.Contract(poolAddress, poolABI, provider);
    
    try {
      const owner = await poolContract.owner();
      console.log('✅ owner():', owner);
    } catch (err) {
      console.log('❌ owner() failed:', err.message);
    }
    
    try {
      const totalPool = await poolContract.totalPool();
      console.log('✅ totalPool():', ethers.formatEther(totalPool), 'cBTC');
    } catch (err) {
      console.log('❌ totalPool() failed:', err.message);
    }
    
    try {
      const gameContract = await poolContract.gameContract();
      console.log('✅ gameContract():', gameContract);
      
      if (gameContract.toLowerCase() !== gameAddress.toLowerCase()) {
        console.log('⚠️  Game contract mismatch!');
        console.log('   Expected:', gameAddress);
        console.log('   Actual:', gameContract);
      }
    } catch (err) {
      console.log('❌ gameContract() failed:', err.message);
    }
    
    try {
      const poolStatus = await poolContract.getPoolStatus();
      console.log('✅ getPoolStatus():');
      console.log('   Total Pool:', ethers.formatEther(poolStatus[0]), 'cBTC');
      console.log('   House Reserve:', ethers.formatEther(poolStatus[1]), 'cBTC');
      console.log('   Player Funds:', ethers.formatEther(poolStatus[2]), 'cBTC');
      console.log('   Contract Balance:', ethers.formatEther(poolStatus[3]), 'cBTC');
    } catch (err) {
      console.log('❌ getPoolStatus() failed:', err.message);
      console.log('   This is the error you\'re seeing in the frontend!');
    }

    // Check Game Contract
    console.log('\n🔎 Checking Game Contract...');
    const gameCode = await provider.getCode(gameAddress);
    
    if (gameCode === '0x') {
      console.log('❌ No contract deployed at game address:', gameAddress);
    } else {
      console.log('✅ Contract found at game address');
      console.log('   Code size:', gameCode.length, 'bytes');
      
      // Test game contract
      const gameABI = [
        'function owner() view returns (address)',
        'function bettingPool() view returns (address)'
      ];
      
      const gameContract = new ethers.Contract(gameAddress, gameABI, provider);
      
      try {
        const gameOwner = await gameContract.owner();
        console.log('✅ Game owner():', gameOwner);
      } catch (err) {
        console.log('❌ Game owner() failed:', err.message);
      }
      
      try {
        const gameBettingPool = await gameContract.bettingPool();
        console.log('✅ Game bettingPool():', gameBettingPool);
        
        if (gameBettingPool.toLowerCase() !== poolAddress.toLowerCase()) {
          console.log('⚠️  Betting pool mismatch!');
          console.log('   Expected:', poolAddress);
          console.log('   Actual:', gameBettingPool);
        }
      } catch (err) {
        console.log('❌ Game bettingPool() failed:', err.message);
      }
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

main().catch(console.error); 