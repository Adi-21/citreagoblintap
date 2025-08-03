const { ethers } = require('ethers');

async function main() {
    console.log('🔍 Checking Pool Logic Issues...\n');

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
        // Get pool constants
        console.log('🏦 Pool Constants:');
        const minPoolBalance = await poolContract.MIN_POOL_BALANCE();
        const maxPayoutRatio = await poolContract.MAX_PAYOUT_RATIO();
        console.log('   MIN_POOL_BALANCE:', ethers.formatEther(minPoolBalance), 'cBTC');
        console.log('   MAX_PAYOUT_RATIO:', maxPayoutRatio.toString(), '%');

        // Get current status
        console.log('\n📊 Current Pool Status:');
        const poolStatus = await poolContract.getPoolStatus();
        const [totalPool, houseReserve, playerFunds, contractBalance] = poolStatus;
        
        console.log('   Total Pool:', ethers.formatEther(totalPool), 'cBTC');
        console.log('   Contract Balance:', ethers.formatEther(contractBalance), 'cBTC');

        // Check each canPayout condition
        console.log('\n🔍 Analyzing canPayout() Conditions:');
        
        const testPayout = ethers.parseEther('0.0018'); // Expected payout
        console.log('   Testing payout amount:', ethers.formatEther(testPayout), 'cBTC');
        
        // Condition 1: Contract has enough balance
        const hasBalance = contractBalance >= testPayout;
        console.log('   1. Contract balance >= payout:', hasBalance ? '✅' : '❌');
        console.log('      ', ethers.formatEther(contractBalance), '>=', ethers.formatEther(testPayout));
        
        // Condition 2: Pool meets minimum balance requirement
        const meetsMinBalance = totalPool >= minPoolBalance;
        console.log('   2. Total pool >= min balance:', meetsMinBalance ? '✅' : '❌');
        console.log('      ', ethers.formatEther(totalPool), '>=', ethers.formatEther(minPoolBalance));
        
        // Condition 3: Payout within max ratio
        const maxAllowedPayout = (totalPool * maxPayoutRatio) / 100n;
        const withinRatio = testPayout <= maxAllowedPayout;
        console.log('   3. Payout <= max ratio:', withinRatio ? '✅' : '❌');
        console.log('      ', ethers.formatEther(testPayout), '<=', ethers.formatEther(maxAllowedPayout));
        
        // Overall result
        const canPay = await poolContract.canPayout(testPayout);
        console.log('\n🎯 Overall canPayout result:', canPay ? '✅' : '❌');
        
        if (!canPay) {
            console.log('\n❌ ISSUE IDENTIFIED:');
            if (!meetsMinBalance) {
                console.log('   Pool below minimum balance!');
                console.log('   Current:', ethers.formatEther(totalPool), 'cBTC');
                console.log('   Required:', ethers.formatEther(minPoolBalance), 'cBTC');
                console.log('   Need to add:', ethers.formatEther(minPoolBalance - totalPool), 'cBTC');
            }
        }

    } catch (error) {
        console.error('❌ Check failed:', error.message);
    }
}

main().catch(console.error);
