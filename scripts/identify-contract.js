const { ethers } = require('ethers');

async function main() {
  console.log('🔍 Identifying Contract Type...\n');

  // Connect to Citrea testnet
  const provider = new ethers.JsonRpcProvider('https://rpc.testnet.citrea.xyz');
  
  // The address from your error
  const contractAddress = '0xEC163E9c958C574720b03696513a3e4c85e8d391';
  
  console.log('📋 Contract Address:', contractAddress);
  console.log('');

  try {
    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    
    if (code === '0x') {
      console.log('❌ No contract deployed at this address');
      return;
    }
    
    console.log('✅ Contract found');
    console.log('   Code size:', code.length, 'bytes');
    console.log('');

    // Test BettingPool functions
    console.log('🏦 Testing BettingPool functions...');
    const poolABI = [
      'function getPoolStatus() view returns (uint256, uint256, uint256, uint256)',
      'function totalPool() view returns (uint256)',
      'function owner() view returns (address)',
      'function gameContract() view returns (address)'
    ];
    
    const poolContract = new ethers.Contract(contractAddress, poolABI, provider);
    
    try {
      const poolStatus = await poolContract.getPoolStatus();
      console.log('✅ getPoolStatus() works - THIS IS A BETTING POOL CONTRACT');
      console.log('   Total Pool:', ethers.formatEther(poolStatus[0]), 'cBTC');
      console.log('   House Reserve:', ethers.formatEther(poolStatus[1]), 'cBTC');
      console.log('   Player Funds:', ethers.formatEther(poolStatus[2]), 'cBTC');
      console.log('   Contract Balance:', ethers.formatEther(poolStatus[3]), 'cBTC');
      
      const gameContract = await poolContract.gameContract();
      console.log('   Connected Game Contract:', gameContract);
      
      console.log('\n💡 Configuration needed:');
      console.log('   NEXT_PUBLIC_BETTING_POOL_ADDRESS=' + contractAddress);
      console.log('   NEXT_PUBLIC_GOBLIN_TAP_ADDRESS=' + gameContract);
      return;
    } catch (err) {
      console.log('❌ getPoolStatus() failed:', err.message);
    }

    // Test GoblinTapV2 functions
    console.log('\n🎮 Testing GoblinTapV2 functions...');
    const gameABI = [
      'function claimWinnings(uint8) nonpayable',
      'function getActiveBet(address) view returns (tuple(address,uint256,uint256,bool))',
      'function owner() view returns (address)',
      'function bettingPool() view returns (address)',
      'function previewPayout(uint256, uint8) view returns (uint256)'
    ];
    
    const gameContract = new ethers.Contract(contractAddress, gameABI, provider);
    
    try {
      const owner = await gameContract.owner();
      console.log('✅ owner() works - THIS IS A GOBLIN TAP V2 CONTRACT');
      console.log('   Owner:', owner);
      
      const bettingPool = await gameContract.bettingPool();
      console.log('   Connected Betting Pool:', bettingPool);
      
      // Test preview payout
      const previewPayout = await gameContract.previewPayout(ethers.parseEther('0.001'), 10);
      console.log('   Preview payout for 0.001 cBTC, 10 goblins:', ethers.formatEther(previewPayout), 'cBTC');
      
      console.log('\n💡 Configuration needed:');
      console.log('   NEXT_PUBLIC_GOBLIN_TAP_ADDRESS=' + contractAddress);
      console.log('   NEXT_PUBLIC_BETTING_POOL_ADDRESS=' + bettingPool);
      return;
    } catch (err) {
      console.log('❌ GoblinTapV2 functions failed:', err.message);
    }

    // Test legacy contract functions
    console.log('\n🕰️ Testing Legacy GoblinTap functions...');
    const legacyABI = [
      'function claimWinnings(uint8) nonpayable',
      'function getActiveBet(address) view returns (tuple(address,uint256,uint256,bool))',
      'function placeBet() payable'
    ];
    
    const legacyContract = new ethers.Contract(contractAddress, legacyABI, provider);
    
    try {
      // Try to get an active bet (this will fail if no bet, but function exists)
      await legacyContract.getActiveBet('0x0000000000000000000000000000000000000001');
      console.log('✅ Legacy contract functions work - THIS IS A LEGACY GOBLIN TAP CONTRACT');
      
      console.log('\n💡 Configuration needed:');
      console.log('   # Use legacy mode - unset pool variables or set:');
      console.log('   NEXT_PUBLIC_CONTRACT_ADDRESS=' + contractAddress);
      console.log('   # Leave NEXT_PUBLIC_BETTING_POOL_ADDRESS unset');
      return;
    } catch (err) {
      if (err.message.includes('NoActiveBet')) {
        console.log('✅ Legacy contract confirmed (NoActiveBet error expected)');
        console.log('\n💡 Configuration needed:');
        console.log('   NEXT_PUBLIC_CONTRACT_ADDRESS=' + contractAddress);
        return;
      }
      console.log('❌ Legacy functions failed:', err.message);
    }

    console.log('\n❓ Unknown contract type - none of the expected functions work');

  } catch (error) {
    console.error('❌ Identification failed:', error);
  }
}

main().catch(console.error); 