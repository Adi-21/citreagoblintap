const { ethers } = require('ethers');

async function main() {
    console.log('💰 Funding Pool to Meet Minimum Balance...\n');

    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.citrea.xyz');
    const poolAddress = '0x4aE75535bA7655FA4533cFDB5eDeD672dCE4bf40';
    
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.log('❌ PRIVATE_KEY not set');
        console.log('💡 Set it with: export PRIVATE_KEY=your_private_key');
        console.log('');
        console.log('🔧 Alternative: Send 0.1 cBTC directly to pool address:');
        console.log('   Pool Address:', poolAddress);
        console.log('   Amount needed: ~0.095 cBTC');
        return;
    }

    try {
        const wallet = new ethers.Wallet(privateKey, provider);
        console.log('🔑 Funding from:', wallet.address);
        
        // Check current balance
        const walletBalance = await provider.getBalance(wallet.address);
        console.log('💰 Wallet balance:', ethers.formatEther(walletBalance), 'cBTC');
        
        // Amount to fund (0.095 cBTC to reach 0.1+ minimum)
        const fundAmount = ethers.parseEther('0.095');
        console.log('📤 Funding amount:', ethers.formatEther(fundAmount), 'cBTC');
        
        if (walletBalance < fundAmount + ethers.parseEther('0.01')) {
            console.log('❌ Insufficient balance for funding + fees');
            return;
        }
        
        // Fund the pool using fundPool() function
        const poolABI = [
            'function fundPool() payable',
            'function getPoolStatus() view returns (uint256, uint256, uint256, uint256)'
        ];
        
        const poolContract = new ethers.Contract(poolAddress, poolABI, wallet);
        
        console.log('📤 Sending transaction...');
        const tx = await poolContract.fundPool({ value: fundAmount });
        console.log('Transaction hash:', tx.hash);
        
        console.log('⏳ Waiting for confirmation...');
        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
        
        // Check new pool status
        const newStatus = await poolContract.getPoolStatus();
        console.log('\n🏦 New Pool Status:');
        console.log('   Total Pool:', ethers.formatEther(newStatus[0]), 'cBTC');
        console.log('   House Reserve:', ethers.formatEther(newStatus[1]), 'cBTC');
        console.log('   Player Funds:', ethers.formatEther(newStatus[2]), 'cBTC');
        console.log('   Contract Balance:', ethers.formatEther(newStatus[3]), 'cBTC');
        
        if (newStatus[0] >= ethers.parseEther('0.1')) {
            console.log('\n🎉 SUCCESS! Pool now meets minimum balance requirement');
            console.log('💡 You can now claim your winnings!');
        } else {
            console.log('\n⚠️  Pool still below minimum, may need more funding');
        }
        
    } catch (error) {
        console.error('❌ Funding failed:', error.message);
    }
}

main().catch(console.error);
