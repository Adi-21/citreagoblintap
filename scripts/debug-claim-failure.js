const { ethers } = require('ethers');

async function main() {
    console.log('🔍 Debugging Claim Winnings Failure...\n');

    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.citrea.xyz');
    
    const gameAddress = '0x4B7eD8B00299383FfCb26EC981e07199AaAb8744';
    const poolAddress = '0x4aE75535bA7655FA4533cFDB5eDeD672dCE4bf40';
    const testWallet = '0xF9BDade3F4a1CA9EaE08737A8C88063Bd5063965';
    
    console.log('📋 Debug Info:');
    console.log('   Game Contract:', gameAddress);
    console.log('   Pool Contract:', poolAddress);
    console.log('   Test Wallet:', testWallet);
    console.log('');

    try {
        const gameABI = [
            'function getActiveBet(address player) view returns (tuple(address player, uint256 amount, uint256 timestamp, bool isActive))',
            'function hasActiveBet(address player) view returns (bool)',
            'function previewPayout(uint256 betAmount, uint8 goblinsTapped) view returns (uint256)',
            'function canClaimPayout(address player, uint8 goblinsTapped) view returns (bool)',
            'function claimWinnings(uint8 goblinsTapped)',
            'function bettingPool() view returns (address)'
        ];
        
        const poolABI = [
            'function getPoolStatus() view returns (uint256, uint256, uint256, uint256)',
            'function canPayout(uint256 amount) view returns (bool)',
            'function getMultiplier(uint8 goblinsTapped) pure returns (uint256)',
            'function gameContract() view returns (address)'
        ];

        const gameContract = new ethers.Contract(gameAddress, gameABI, provider);
        const poolContract = new ethers.Contract(poolAddress, poolABI, provider);

        console.log('✅ Step 1: Check Active Bet');
        const hasActiveBet = await gameContract.hasActiveBet(testWallet);
        console.log('   Has active bet:', hasActiveBet);
        
        if (!hasActiveBet) {
            console.log('❌ No active bet found!');
            return;
        }

        const activeBet = await gameContract.getActiveBet(testWallet);
        console.log('   Bet amount:', ethers.formatEther(activeBet.amount), 'cBTC');

        console.log('\n✅ Step 2: Check Pool Status');
        const poolStatus = await poolContract.getPoolStatus();
        console.log('   Total Pool:', ethers.formatEther(poolStatus[0]), 'cBTC');
        console.log('   House Reserve:', ethers.formatEther(poolStatus[1]), 'cBTC');
        console.log('   Player Funds:', ethers.formatEther(poolStatus[2]), 'cBTC');
        console.log('   Contract Balance:', ethers.formatEther(poolStatus[3]), 'cBTC');

        console.log('\n✅ Step 3: Check Payout Calculation');
        const betAmount = activeBet.amount;
        const goblinsTapped = 10;
        
        const previewPayout = await gameContract.previewPayout(betAmount, goblinsTapped);
        console.log('   Bet Amount:', ethers.formatEther(betAmount), 'cBTC');
        console.log('   Goblins Tapped:', goblinsTapped);
        console.log('   Expected Payout:', ethers.formatEther(previewPayout), 'cBTC');

        const multiplier = await poolContract.getMultiplier(goblinsTapped);
        console.log('   Multiplier:', multiplier.toString(), '(', Number(multiplier)/100, 'x)');

        console.log('\n✅ Step 4: Check Pool Can Pay');
        const poolCanPay = await poolContract.canPayout(previewPayout);
        console.log('   Pool can afford payout:', poolCanPay ? '✅' : '❌');
        
        if (!poolCanPay) {
            console.log('   ❌ ISSUE: Pool cannot afford the payout!');
            console.log('   Needed:', ethers.formatEther(previewPayout), 'cBTC');
            console.log('   Available:', ethers.formatEther(poolStatus[3]), 'cBTC');
        }

        console.log('\n✅ Step 5: Check Game Can Claim');
        const canClaim = await gameContract.canClaimPayout(testWallet, goblinsTapped);
        console.log('   Game says can claim:', canClaim ? '✅' : '❌');

        console.log('\n✅ Step 6: Check Contract Connections');
        const gameToPool = await gameContract.bettingPool();
        const poolToGame = await poolContract.gameContract();
        console.log('   Game → Pool:', gameToPool);
        console.log('   Pool → Game:', poolToGame);
        console.log('   Connections OK:', 
            gameToPool.toLowerCase() === poolAddress.toLowerCase() && 
            poolToGame.toLowerCase() === gameAddress.toLowerCase() ? '✅' : '❌'
        );

        console.log('\n🧪 Step 7: Simulate Transaction');
        try {
            // Try to simulate the call
            const result = await gameContract.claimWinnings.staticCall(goblinsTapped, {
                from: testWallet
            });
            console.log('   Static call result:', result);
            console.log('   ✅ Transaction should succeed');
        } catch (simulationError) {
            console.log('   ❌ Simulation failed:', simulationError.message);
            
            // Try to decode the error
            if (simulationError.data) {
                console.log('   Raw error data:', simulationError.data);
                
                // Common error signatures
                const errors = {
                    '0xc2e5ec04': 'NoActiveBet()',
                    '0xbc6072f1': 'InvalidGoblinCount()',
                    '0x37fb14b1': 'PoolNotSet()',
                    '0x356680b7': 'InsufficientPoolBalance()',
                    '0x82b42900': 'Unauthorized()',
                    '0x8c379a00': 'Generic revert with message'
                };
                
                const errorSig = simulationError.data.slice(0, 10);
                console.log('   Error signature:', errorSig);
                console.log('   Decoded error:', errors[errorSig] || 'Unknown error');
            }
        }

        console.log('\n🎯 DIAGNOSIS:');
        if (!poolCanPay) {
            console.log('❌ PRIMARY ISSUE: Pool cannot afford the payout');
            console.log('💡 SOLUTION: Need to fund the pool or reduce bet size');
        } else if (!canClaim) {
            console.log('❌ PRIMARY ISSUE: Game contract says claim not allowed');
            console.log('💡 SOLUTION: Check contract logic or try different goblin count');
        } else {
            console.log('⚠️  All checks pass but transaction still fails');
            console.log('💡 SOLUTION: Check the simulation error above for details');
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

main().catch(console.error);
