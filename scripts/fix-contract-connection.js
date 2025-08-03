const { ethers } = require('ethers');

async function main() {
    console.log('🔧 Fixing Contract Connection...\n');

    // Connect to Citrea testnet
    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.citrea.xyz');

    // Contract addresses
    const gameAddress = '0xEC163E9c958C574720b03696513a3e4c85e8d391';
    const poolAddress = '0xD96f8B90d06dB950e8d4D97b72049A08905D44E0';

    console.log('📋 Addresses:');
    console.log('   Game Contract:', gameAddress);
    console.log('   Pool Contract:', poolAddress);
    console.log('');

    // You need to use your private key here (the owner of both contracts)
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.log('❌ PRIVATE_KEY environment variable not set');
        console.log('💡 To fix the connection, you need to:');
        console.log('');
        console.log('1. 📝 Set your private key: export PRIVATE_KEY=your_private_key');
        console.log('2. 🔗 Call setGameContract on the pool:');
        console.log('   - Go to Remix IDE');
        console.log('   - Load BettingPool at', poolAddress);
        console.log('   - Call setGameContract(' + gameAddress + ')');
        console.log('');
        console.log('3. ✅ Verify the connection:');
        console.log('   - Call gameContract() should return', gameAddress);
        console.log('');
        console.log('4. 🧪 Test a small bet to see money flow');
        return;
    }

    try {
        const wallet = new ethers.Wallet(privateKey, provider);
        console.log('🔑 Using wallet:', wallet.address);

        // Pool contract ABI (only the functions we need)
        const poolABI = [
            'function setGameContract(address _gameContract)',
            'function gameContract() view returns (address)',
            'function owner() view returns (address)',
            'function getPoolStatus() view returns (uint256, uint256, uint256, uint256)'
        ];

        const poolContract = new ethers.Contract(poolAddress, poolABI, wallet);

        // Check if we're the owner
        const poolOwner = await poolContract.owner();
        console.log('👤 Pool owner:', poolOwner);
        console.log('👤 Your address:', wallet.address);

        if (poolOwner.toLowerCase() !== wallet.address.toLowerCase()) {
            console.log('❌ You are not the owner of the pool contract');
            console.log('💡 Only the owner can set the game contract');
            return;
        }

        // Check current game contract setting
        const currentGameContract = await poolContract.gameContract();
        console.log('🔗 Current game contract in pool:', currentGameContract);

        if (currentGameContract.toLowerCase() === gameAddress.toLowerCase()) {
            console.log('✅ Game contract already set correctly');
        } else {
            console.log('🔧 Setting game contract...');

            const tx = await poolContract.setGameContract(gameAddress);
            console.log('📤 Transaction sent:', tx.hash);

            const receipt = await tx.wait();
            console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

            // Verify the setting
            const newGameContract = await poolContract.gameContract();
            console.log('🔗 New game contract in pool:', newGameContract);

            if (newGameContract.toLowerCase() === gameAddress.toLowerCase()) {
                console.log('✅ Game contract set successfully!');
            } else {
                console.log('❌ Failed to set game contract');
            }
        }

        // Test the connection
        console.log('\n🧪 Testing connection...');

        const gameABI = [
            'function bettingPool() view returns (address)',
        ];

        const gameContract = new ethers.Contract(gameAddress, gameABI, provider);
        const gamePoolAddress = await gameContract.bettingPool();

        console.log('🔗 Game → Pool:', gamePoolAddress);
        console.log('🔗 Pool → Game:', await poolContract.gameContract());

        if (gamePoolAddress.toLowerCase() === poolAddress.toLowerCase() &&
            (await poolContract.gameContract()).toLowerCase() === gameAddress.toLowerCase()) {
            console.log('✅ Contracts fully connected!');

            console.log('\n💰 Ready for money flow:');
            console.log('1. User bets → Game Contract');
            console.log('2. Game Contract → Pool Contract (automatic)');
            console.log('3. Pool tracks funds → Player/House split');
            console.log('4. User wins → Pool pays directly to user');

        } else {
            console.log('❌ Connection incomplete');
        }

    } catch (error) {
        console.error('❌ Fix failed:', error);
    }
}

main().catch(console.error); 