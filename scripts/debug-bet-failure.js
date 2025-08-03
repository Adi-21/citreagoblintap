const { ethers } = require('ethers');

async function main() {
    console.log('🔍 Debugging Bet Placement Failure...\n');

    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.citrea.xyz');
    
    // Your contract addresses
    const gameAddress = '0x4B7eD8B00299383FfCb26EC981e07199AaAb8744';
    const poolAddress = '0x4aE75535bA7655FA4533cFDB5eDeD672dCE4bf40';
    
    // Test wallet address from your error
    const testWallet = '0xF9BDade3F4a1CA9EaE08737A8C88063Bd5063965';
    
    console.log('📋 Debug Info:');
    console.log('   Game Contract:', gameAddress);
    console.log('   Pool Contract:', poolAddress);
    console.log('   Test Wallet:', testWallet);
    console.log('');

    try {
        // Contract ABIs
        const gameABI = [
            'function hasActiveBet(address player) view returns (bool)',
            'function bettingPool() view returns (address)',
            'function placeBet() payable',
            'function getActiveBet(address player) view returns (tuple(address player, uint256 amount, uint256 timestamp, bool isActive))'
        ];
        
        const poolABI = [
            'function gameContract() view returns (address)',
            'function owner() view returns (address)',
            'function getPoolStatus() view returns (uint256, uint256, uint256, uint256)'
        ];

        const gameContract = new ethers.Contract(gameAddress, gameABI, provider);
        const poolContract = new ethers.Contract(poolAddress, poolABI, provider);

        // Check 1: Does player have active bet?
        console.log('✅ Check 1: Active Bet Status');
        const hasActiveBet = await gameContract.hasActiveBet(testWallet);
        console.log('   Player has active bet:', hasActiveBet);
        
        if (hasActiveBet) {
            const activeBet = await gameContract.getActiveBet(testWallet);
            console.log('   ⚠️  FOUND ACTIVE BET:');
            console.log('     Amount:', ethers.formatEther(activeBet.amount), 'cBTC');
            console.log('     Timestamp:', new Date(Number(activeBet.timestamp) * 1000).toLocaleString());
            console.log('     ❌ This is why placeBet() is failing!');
            console.log('     💡 Player must claim/lose current bet first');
        }

        // Check 2: Game contract pool setting
        console.log('\n✅ Check 2: Contract Connections');
        const gamePoolSetting = await gameContract.bettingPool();
        console.log('   Game → Pool:', gamePoolSetting);
        console.log('   Expected:', poolAddress);
        console.log('   Match:', gamePoolSetting.toLowerCase() === poolAddress.toLowerCase() ? '✅' : '❌');

        // Check 3: Pool contract game setting
        const poolGameSetting = await poolContract.gameContract();
        console.log('   Pool → Game:', poolGameSetting);
        console.log('   Expected:', gameAddress);
        console.log('   Match:', poolGameSetting.toLowerCase() === gameAddress.toLowerCase() ? '✅' : '❌');

        // Check 4: Pool status
        console.log('\n✅ Check 3: Pool Status');
        const poolStatus = await poolContract.getPoolStatus();
        console.log('   Contract Balance:', ethers.formatEther(poolStatus[3]), 'cBTC');
        console.log('   Has funds:', poolStatus[3] > 0 ? '✅' : '❌');

        // Check 5: Wallet balance
        console.log('\n✅ Check 4: Wallet Balance');
        const walletBalance = await provider.getBalance(testWallet);
        console.log('   Wallet Balance:', ethers.formatEther(walletBalance), 'cBTC');
        console.log('   Can afford 0.001 + fees:', walletBalance > ethers.parseEther('0.003') ? '✅' : '⚠️');

        // Summary
        console.log('\n🎯 DIAGNOSIS:');
        if (hasActiveBet) {
            console.log('❌ ISSUE: Player already has an active bet');
            console.log('💡 SOLUTION: Claim current bet first, then place new bet');
            console.log('');
            console.log('🔧 To fix:');
            console.log('1. Go to your game UI');
            console.log('2. If you see an active bet, claim winnings first');
            console.log('3. Then try placing a new bet');
        } else {
            console.log('✅ No active bet found');
            console.log('🔍 Need to check other potential issues...');
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

main().catch(console.error);
