// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IBettingPoolV3 {
    function receiveBet(address player, uint256 amount) external payable;
    function payoutWinner(address player, uint256 betAmount, uint8 goblinsTapped) external returns (uint256);
    function playerLost(address player, uint256 betAmount) external;
    function canPayout(uint256 amount) external view returns (bool);
    function getMultiplier(uint8 goblinsTapped) external pure returns (uint256);
}

contract GoblinTapV3 {
    struct Bet {
        uint256 id;
        address player;
        uint256 amount;
        uint256 timestamp;
        bool isActive;
    }

    // Multiple bets per player support
    mapping(uint256 => Bet) public bets; // betId => Bet
    mapping(address => uint256[]) public playerBetIds; // player => betId[]
    uint256 public nextBetId = 1;
    
    address public owner;
    IBettingPoolV3 public bettingPool;
    
    event BetPlaced(address indexed player, uint256 indexed betId, uint256 amount);
    event WinningsClaimed(address indexed player, uint256 indexed betId, uint256 payout, uint8 goblinsTapped);
    event BetLost(address indexed player, uint256 indexed betId, uint256 amount);

    error InvalidBetId();
    error BetNotActive();
    error NotBetOwner();
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
        bettingPool = IBettingPoolV3(_bettingPool);
    }

    function setBettingPool(address _bettingPool) external onlyOwner {
        bettingPool = IBettingPoolV3(_bettingPool);
    }

    // Place a new bet (allows multiple active bets per player)
    function placeBet() external payable returns (uint256) {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(address(bettingPool) != address(0), "Betting pool not set");

        uint256 betId = nextBetId++;
        
        // Store the bet
        bets[betId] = Bet({
            id: betId,
            player: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            isActive: true
        });

        // Add to player's bet list
        playerBetIds[msg.sender].push(betId);

        // Send bet to pool and notify in one call
        bettingPool.receiveBet{value: msg.value}(msg.sender, msg.value);

        emit BetPlaced(msg.sender, betId, msg.value);
        return betId;
    }

    // Claim winnings for a specific bet
    function claimWinnings(uint256 betId, uint8 goblinsTapped) external {
        if (betId == 0 || betId >= nextBetId) revert InvalidBetId();
        
        Bet storage bet = bets[betId];
        if (!bet.isActive) revert BetNotActive();
        if (bet.player != msg.sender) revert NotBetOwner();
        if (goblinsTapped > 20) revert InvalidGoblinCount();
        if (address(bettingPool) == address(0)) revert PoolNotSet();

        _claimWinnings(betId, goblinsTapped);
    }

    // Claim winnings for the oldest active bet (backward compatibility)
    function claimWinnings(uint8 goblinsTapped) external {
        uint256[] memory playerBets = playerBetIds[msg.sender];
        
        // Find the oldest active bet
        uint256 oldestBetId = 0;
        for (uint256 i = 0; i < playerBets.length; i++) {
            uint256 betId = playerBets[i];
            if (bets[betId].isActive) {
                oldestBetId = betId;
                break;
            }
        }
        
        if (oldestBetId == 0) revert BetNotActive();
        
        // Claim the oldest bet using internal logic
        _claimWinnings(oldestBetId, goblinsTapped);
    }

    // Internal function to handle claiming
    function _claimWinnings(uint256 betId, uint8 goblinsTapped) internal {
        Bet storage bet = bets[betId];
        uint256 betAmount = bet.amount;
        
        // Clear the active bet first
        bet.isActive = false;

        // Check if player won or lost
        if (goblinsTapped < 5) {
            // Player lost
            bettingPool.playerLost(msg.sender, betAmount);
            emit BetLost(msg.sender, betId, betAmount);
        } else {
            // Player won - let pool handle payout
            uint256 payout = bettingPool.payoutWinner(msg.sender, betAmount, goblinsTapped);
            emit WinningsClaimed(msg.sender, betId, payout, goblinsTapped);
        }
    }

    // Preview functions (no state changes)
    function previewPayout(uint256 betAmount, uint8 goblinsTapped) external view returns (uint256) {
        if (address(bettingPool) == address(0)) return 0;
        
        uint256 multiplier = bettingPool.getMultiplier(goblinsTapped);
        return (betAmount * multiplier) / 100;
    }

    function canClaimPayout(address player, uint8 goblinsTapped) external view returns (bool) {
        if (address(bettingPool) == address(0)) return false;
        if (goblinsTapped < 5) return true; // Loss is always "claimable"
        
        // Check if player has any active bets
        uint256[] memory playerBets = playerBetIds[player];
        for (uint256 i = 0; i < playerBets.length; i++) {
            if (bets[playerBets[i]].isActive) {
                uint256 betAmount = bets[playerBets[i]].amount;
                uint256 payout = this.previewPayout(betAmount, goblinsTapped);
                return bettingPool.canPayout(payout);
            }
        }
        
        return false;
    }

    // Get all active bets for a player
    function getActiveBets(address player) external view returns (Bet[] memory) {
        uint256[] memory playerBets = playerBetIds[player];
        
        // Count active bets
        uint256 activeCount = 0;
        for (uint256 i = 0; i < playerBets.length; i++) {
            if (bets[playerBets[i]].isActive) {
                activeCount++;
            }
        }
        
        // Create array of active bets
        Bet[] memory activeBets = new Bet[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < playerBets.length; i++) {
            uint256 betId = playerBets[i];
            if (bets[betId].isActive) {
                activeBets[index] = bets[betId];
                index++;
            }
        }
        
        return activeBets;
    }

    // Get a specific bet
    function getBet(uint256 betId) external view returns (Bet memory) {
        if (betId == 0 || betId >= nextBetId) revert InvalidBetId();
        return bets[betId];
    }

    // Backward compatibility functions
    function getActiveBet(address player) external view returns (Bet memory) {
        uint256[] memory playerBets = playerBetIds[player];
        
        // Return the oldest active bet for backward compatibility
        for (uint256 i = 0; i < playerBets.length; i++) {
            uint256 betId = playerBets[i];
            if (bets[betId].isActive) {
                return bets[betId];
            }
        }
        
        // Return empty bet if no active bets
        return Bet(0, address(0), 0, 0, false);
    }

    function hasActiveBet(address player) external view returns (bool) {
        uint256[] memory playerBets = playerBetIds[player];
        
        for (uint256 i = 0; i < playerBets.length; i++) {
            if (bets[playerBets[i]].isActive) {
                return true;
            }
        }
        
        return false;
    }

    // Get count of active bets for a player
    function getActiveBetCount(address player) external view returns (uint256) {
        uint256[] memory playerBets = playerBetIds[player];
        uint256 count = 0;
        
        for (uint256 i = 0; i < playerBets.length; i++) {
            if (bets[playerBets[i]].isActive) {
                count++;
            }
        }
        
        return count;
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