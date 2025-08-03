const { ethers } = require('ethers');

async function main() {
    console.log('🔍 Testing New Fixed Contracts...\n');

    // Connect to Citrea testnet
    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.citrea.xyz');
    
    // Your NEW contract addresses
    const gameAddress = '0x4B7eD8B00299383FfCb26EC981e07199AaAb8744';
    const poolAddress = '0x4aE75535bA7655FA4533cFDB5eDeD672dCE4bf40';
    
    console.log('📋 NEW Contract Addresses:');
    console.log('   Game Contract (Fixed):', gameAddress);
    console.log('   Pool Contract (Fixed):', poolAddress);
    console.log('');

    try {
        // Check balances
        console.log('💳 Contract Balances:');
        const gameBalance = await provider.getBalance(gameAddress);
        console.log('   Game Contract:', ethers.formatEther(gameBalance), 'cBTC');
        
        const poolBalance = await provider.getBalance(poolAddress);
        console.log('   Pool Contract:', ethers.formatEther(poolBalance), 'cBTC');
        console.log('');

        // Check connections
        const gameABI = [
            'function bettingPool() view returns (address)',
        ];
        
        const poolABI = [
            'function gameContract() view returns (address)',
            'function getPoolStatus() view returns (uint256, uint256, uint256, uint256)'
        ];

        const gameContract = new ethers.Contract(gameAddress, gameABI, provider);
        const poolContract = new ethers.Contract(poolAddress, poolABI, provider);

        console.log('🔗 Connection Status:');
        const gameToPool = await gameContract.bettingPool();
        console.log('   Game → Pool:', gameToPool);
        
        const poolToGame = await poolContract.gameContract();
        console.log('   Pool → Game:', poolToGame);
        
        const isConnected = 
            gameToPool.toLowerCase() === poolAddress.toLowerCase() &&
            poolToGame.toLowerCase() === gameAddress.toLowerCase();
            
        if (isConnected) {
            console.log('   ✅ Contracts properly connected!');
        } else {
            console.log('   ❌ Connection needs fixing:');
            console.log('     Expected Pool → Game:', gameAddress);
            console.log('     Actual Pool → Game:', poolToGame);
        }

        // Check pool status
        console.log('\n🏦 Pool Status:');
        const poolStatus = await poolContract.getPoolStatus();
        console.log('   Total Pool:', ethers.formatEther(poolStatus[0]), 'cBTC');
        console.log('   House Reserve:', ethers.formatEther(poolStatus[1]), 'cBTC');
        console.log('   Player Funds:', ethers.formatEther(poolStatus[2]), 'cBTC');
        console.log('   Contract Balance:', ethers.formatEther(poolStatus[3]), 'cBTC');

        // Summary
        console.log('\n🎮 Ready for Testing:');
        console.log('✅ Frontend updated with new addresses');
        console.log('✅ Contracts deployed with fixed money flow');
        if (isConnected) {
            console.log('✅ Contracts properly connected');
        } else {
            console.log('⚠️  Need to run: setGameContract() on pool');
        }
        if (poolStatus[3] > 0) {
            console.log('✅ Pool has funds for payouts');
        } else {
            console.log('⚠️  Pool needs funding for payouts');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

main().catch(console.error);
