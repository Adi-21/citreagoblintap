// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GoblinTap {
    struct Bet {
        address player;
        uint256 amount;
        uint256 timestamp;
        bool isActive;
    }

    mapping(address => Bet) public activeBets;
    
    // Payout multipliers based on goblins tapped
    uint256 public constant PAYOUT_5_GOBLINS = 120; // 1.2x (120%)
    uint256 public constant PAYOUT_8_GOBLINS = 150; // 1.5x (150%)
    uint256 public constant PAYOUT_10_GOBLINS = 200; // 2.0x (200%)
    uint256 public constant BASIS_POINTS = 100;

    event BetPlaced(address indexed player, uint256 amount);
    event WinningsClaimed(address indexed player, uint256 amount, uint8 goblinsTapped);
    event BetLost(address indexed player, uint256 amount);

    error NoActiveBet();
    error InvalidGoblinCount();
    error InsufficientBalance();

    function placeBet() external payable {
        if (msg.value == 0) revert("Bet amount must be greater than 0");
        if (activeBets[msg.sender].isActive) revert("Player already has an active bet");

        activeBets[msg.sender] = Bet({
            player: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            isActive: true
        });

        emit BetPlaced(msg.sender, msg.value);
    }

    function claimWinnings(uint8 goblinsTapped) external {
        Bet storage bet = activeBets[msg.sender];
        if (!bet.isActive) revert NoActiveBet();
        if (goblinsTapped > 20) revert InvalidGoblinCount(); // Sanity check

        uint256 payout = 0;
        uint256 betAmount = bet.amount;

        // Calculate payout based on goblins tapped
        if (goblinsTapped < 5) {
            // Player loses their bet
            emit BetLost(msg.sender, betAmount);
        } else if (goblinsTapped >= 5 && goblinsTapped < 8) {
            payout = (betAmount * PAYOUT_5_GOBLINS) / BASIS_POINTS;
        } else if (goblinsTapped >= 8 && goblinsTapped < 10) {
            payout = (betAmount * PAYOUT_8_GOBLINS) / BASIS_POINTS;
        } else {
            // 10 or more goblins
            payout = (betAmount * PAYOUT_10_GOBLINS) / BASIS_POINTS;
        }

        // Clear the active bet
        delete activeBets[msg.sender];

        // Transfer winnings if any
        if (payout > 0) {
            if (address(this).balance < payout) revert InsufficientBalance();
            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Transfer failed");
            emit WinningsClaimed(msg.sender, payout, goblinsTapped);
        }
    }

    function getActiveBet(address player) external view returns (Bet memory) {
        return activeBets[player];
    }

    function hasActiveBet(address player) external view returns (bool) {
        return activeBets[player].isActive;
    }

    // Emergency function to withdraw contract balance (for development)
    function emergencyWithdraw() external {
        // In production, this should be restricted to owner
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    // Function to receive ETH
    receive() external payable {}
} 