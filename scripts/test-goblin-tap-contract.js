const { ethers } = require('ethers');

// GoblinTap Contract ABI (simplified for testing)
const CONTRACT_ABI = [
  "function placeBet() external payable",
  "function claimWinnings(uint8 goblinsTapped) external",
  "function getActiveBet(address player) external view returns (tuple(address player, uint256 amount, uint256 timestamp, bool isActive))",
  "function hasActiveBet(address player) external view returns (bool)",
  "event BetPlaced(address indexed player, uint256 amount)",
  "event WinningsClaimed(address indexed player, uint256 amount, uint8 goblinsTapped)",
  "event BetLost(address indexed player, uint256 amount)"
];

// Test configuration
const CONTRACT_ADDRESS = '0x749eC2d29dd848DF5665Bc0F1AEDFF2F319b85d8'; // Replace with your deployed address
const RPC_URL = 'https://rpc.testnet.citrea.xyz';

async function testGoblinTapContract() {
  console.log('🧪 Testing GoblinTap Smart Contract...\n');

  try {
    // Connect to Citrea testnet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Create a test wallet (replace with your private key for testing)
    const privateKey = process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000';
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('📍 Connected to Citrea testnet');
    console.log('👤 Test wallet address:', wallet.address);
    console.log('💰 Balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'cBTC\n');

    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    console.log('📋 Contract address:', CONTRACT_ADDRESS);

    // Test 1: Check if player has active bet (should be false initially)
    console.log('\n🔍 Test 1: Checking active bet...');
    const hasBet = await contract.hasActiveBet(wallet.address);
    console.log('Has active bet:', hasBet);

    // Test 2: Place a bet
    console.log('\n💰 Test 2: Placing bet...');
    const betAmount = ethers.parseEther('0.001'); // 0.001 cBTC
    
    const placeBetTx = await contract.placeBet({ value: betAmount });
    console.log('Bet transaction hash:', placeBetTx.hash);
    
    // Wait for transaction to be mined
    const receipt = await placeBetTx.wait();
    console.log('Bet placed successfully!');

    // Test 3: Check active bet details
    console.log('\n📊 Test 3: Checking bet details...');
    const activeBet = await contract.getActiveBet(wallet.address);
    console.log('Active bet:', {
      player: activeBet.player,
      amount: ethers.formatEther(activeBet.amount) + ' cBTC',
      timestamp: new Date(Number(activeBet.timestamp) * 1000).toLocaleString(),
      isActive: activeBet.isActive
    });

    // Test 4: Claim winnings with different goblin counts
    console.log('\n🎯 Test 4: Testing winnings claims...');
    
    const testCases = [
      { goblins: 3, expected: 'Loss' },
      { goblins: 6, expected: '1.2x payout' },
      { goblins: 9, expected: '1.5x payout' },
      { goblins: 12, expected: '2.0x payout' }
    ];

    for (const testCase of testCases) {
      console.log(`\nTesting ${testCase.goblins} goblins (${testCase.expected}):`);
      
      try {
        const claimTx = await contract.claimWinnings(testCase.goblins);
        console.log('Claim transaction hash:', claimTx.hash);
        
        const claimReceipt = await claimTx.wait();
        console.log('Claim successful!');
        
        // Check if bet is cleared
        const hasBetAfter = await contract.hasActiveBet(wallet.address);
        console.log('Has active bet after claim:', hasBetAfter);
        
        // If this was a loss, we need to place another bet for the next test
        if (testCase.goblins < 5) {
          console.log('Placing new bet for next test...');
          const newBetTx = await contract.placeBet({ value: betAmount });
          await newBetTx.wait();
        }
        
      } catch (error) {
        console.log('Claim failed (expected for some cases):', error.message);
      }
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testGoblinTapContract();
}

module.exports = { testGoblinTapContract }; 