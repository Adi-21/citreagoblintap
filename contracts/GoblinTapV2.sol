// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IBettingPool {
    function receiveBet(address player, uint256 amount) external payable;
    function payoutWinner(address player, uint256 betAmount, uint8 goblinsTapped) external returns (uint256);
    function playerLost(address player, uint256 betAmount) external;
    function canPayout(uint256 amount) external view returns (bool);
    function getMultiplier(uint8 goblinsTapped) external pure returns (uint256);
}

contract GoblinTapV2 {
    struct Bet {
        address player;
        uint256 amount;
        uint256 timestamp;
        bool isActive;
    }

    mapping(address => Bet) public activeBets;
    
    address public owner;
    IBettingPool public bettingPool;
    
    event BetPlaced(address indexed player, uint256 amount);
    event WinningsClaimed(address indexed player, uint256 payout, uint8 goblinsTapped);
    event BetLost(address indexed player, uint256 amount);

    error NoActiveBet();
    error InvalidGoblinCount();
    error PoolNotSet();
    error InsufficientPoolBalance();
    error OnlyOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address _bettingPool) {
        owner = msg.sender;
        bettingPool = IBettingPool(_bettingPool);
    }

    function setBettingPool(address _bettingPool) external onlyOwner {
        bettingPool = IBettingPool(_bettingPool);
    }

    function placeBet() external payable {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(!activeBets[msg.sender].isActive, "Player already has an active bet");
        require(address(bettingPool) != address(0), "Betting pool not set");

        // Store the bet
        activeBets[msg.sender] = Bet({
            player: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            isActive: true
        });

        // Send bet to pool and notify in one call
        bettingPool.receiveBet{value: msg.value}(msg.sender, msg.value);

        emit BetPlaced(msg.sender, msg.value);
    }

    function claimWinnings(uint8 goblinsTapped) external {
        Bet storage bet = activeBets[msg.sender];
        if (!bet.isActive) revert NoActiveBet();
        if (goblinsTapped > 20) revert InvalidGoblinCount();
        if (address(bettingPool) == address(0)) revert PoolNotSet();

        uint256 betAmount = bet.amount;
        
        // Clear the active bet first
        delete activeBets[msg.sender];

        // Check if player won or lost
        if (goblinsTapped < 5) {
            // Player lost
            bettingPool.playerLost(msg.sender, betAmount);
            emit BetLost(msg.sender, betAmount);
        } else {
            // Player won - let pool handle payout
            uint256 payout = bettingPool.payoutWinner(msg.sender, betAmount, goblinsTapped);
            emit WinningsClaimed(msg.sender, payout, goblinsTapped);
        }
    }

    // Preview functions (no state changes)
    function previewPayout(uint256 betAmount, uint8 goblinsTapped) external view returns (uint256) {
        if (address(bettingPool) == address(0)) return 0;
        
        uint256 multiplier = bettingPool.getMultiplier(goblinsTapped);
        return (betAmount * multiplier) / 100;
    }

    function canClaimPayout(address player, uint8 goblinsTapped) external view returns (bool) {
        if (!activeBets[player].isActive) return false;
        if (address(bettingPool) == address(0)) return false;
        if (goblinsTapped < 5) return true; // Loss is always "claimable"
        
        uint256 betAmount = activeBets[player].amount;
        uint256 payout = this.previewPayout(betAmount, goblinsTapped);
        
        return bettingPool.canPayout(payout);
    }

    // View functions
    function getActiveBet(address player) external view returns (Bet memory) {
        return activeBets[player];
    }

    function hasActiveBet(address player) external view returns (bool) {
        return activeBets[player].isActive;
    }

    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // Function to receive cBTC (should not be used, but just in case)
    receive() external payable {
        // Funds sent directly here will be trapped
        // Use placeBet() instead
    }
} 