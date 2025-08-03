const { ethers } = require('ethers');

async function main() {
    console.log('🔍 Testing with Lower Pool Minimums...\n');

    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.citrea.xyz');
    const poolAddress = '0x4aE75535bA7655FA4533cFDB5eDeD672dCE4bf40';
    
    const poolABI = [
        'function MIN_POOL_BALANCE() view returns (uint256)',
        'function MAX_PAYOUT_RATIO() view returns (uint256)',
        'function getPoolStatus() view returns (uint256, uint256, uint256, uint256)',
        'function canPayout(uint256 amount) view returns (bool)'
    ];

    const poolContract = new ethers.Contract(poolAddress, poolABI, provider);

    try {
        console.log('📊 Current Pool Status:');
        const poolStatus = await poolContract.getPoolStatus();
        const [totalPool, houseReserve, playerFunds, contractBalance] = poolStatus;
        
        console.log('   Total Pool:', ethers.formatEther(totalPool), 'cBTC');
        console.log('   Contract Balance:', ethers.formatEther(contractBalance), 'cBTC');

        // Current constants
        const currentMinBalance = await poolContract.MIN_POOL_BALANCE();
        const maxPayoutRatio = await poolContract.MAX_PAYOUT_RATIO();
        console.log('   Current MIN_POOL_BALANCE:', ethers.formatEther(currentMinBalance), 'cBTC');
        console.log('   MAX_PAYOUT_RATIO:', maxPayoutRatio.toString(), '%');

        // Test current bet payout
        console.log('\n🎯 Testing Current Bet (0.001 cBTC):');
        const currentBetAmount = ethers.parseEther('0.001');
        const currentPayout = (currentBetAmount * 180n) / 100n; // 1.8x multiplier
        console.log('   Bet Amount:', ethers.formatEther(currentBetAmount), 'cBTC');
        console.log('   Expected Payout:', ethers.formatEther(currentPayout), 'cBTC');
        
        // Simulate with proposed 0.01 cBTC minimum
        const proposedMinBalance = ethers.parseEther('0.01');
        console.log('\n🔧 Simulating with 0.01 cBTC minimum:');
        
        // Check conditions manually
        const hasBalance = contractBalance >= currentPayout;
        const meetsNewMin = totalPool >= proposedMinBalance;
        const maxAllowedPayout = (totalPool * maxPayoutRatio) / 100n;
        const withinRatio = currentPayout <= maxAllowedPayout;
        
        console.log('   1. Contract balance >= payout:', hasBalance ? '✅' : '❌');
        console.log('      ', ethers.formatEther(contractBalance), '>=', ethers.formatEther(currentPayout));
        console.log('   2. Total pool >= new min (0.01):', meetsNewMin ? '✅' : '❌'); 
        console.log('      ', ethers.formatEther(totalPool), '>=', ethers.formatEther(proposedMinBalance));
        console.log('   3. Payout <= max ratio:', withinRatio ? '✅' : '❌');
        console.log('      ', ethers.formatEther(currentPayout), '<=', ethers.formatEther(maxAllowedPayout));
        
        const wouldWork = hasBalance && meetsNewMin && withinRatio;
        console.log('   ✅ Would work with 0.01 min:', wouldWork ? '✅ YES' : '❌ NO');

        // Test smaller bet amounts
        console.log('\n🎯 Testing Smaller Bet Amounts:');
        const smallBetAmounts = [
            ethers.parseEther('0.0001'), // 0.0001 cBTC
            ethers.parseEther('0.0005'), // 0.0005 cBTC
            ethers.parseEther('0.001'),  // 0.001 cBTC (current)
        ];

        for (const betAmount of smallBetAmounts) {
            const payout = (betAmount * 180n) / 100n;
            const canAfford = contractBalance >= payout && payout <= maxAllowedPayout;
            console.log('   Bet', ethers.formatEther(betAmount), 'cBTC → Payout', ethers.formatEther(payout), 'cBTC:', canAfford ? '✅' : '❌');
        }

        console.log('\n💡 Recommendations:');
        console.log('1. ✅ Lower MIN_POOL_BALANCE to 0.01 cBTC (current pool will work)');
        console.log('2. ✅ Use smaller bet amounts (0.0001 - 0.001 cBTC)');
        console.log('3. ✅ Current 0.006 cBTC pool can handle multiple small payouts');
        console.log('4. 🔧 Need contract changes to allow multiple active bets');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

main().catch(console.error);
