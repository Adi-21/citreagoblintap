// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BettingPoolV3 {
    address public owner;
    address public gameContract;
    
    uint256 public totalPool;
    uint256 public houseReserve;
    uint256 public playerFunds;
    
    // Updated pool management settings for smaller scale
    uint256 public constant HOUSE_EDGE = 5; // 5% house edge
    uint256 public constant MIN_POOL_BALANCE = 0.005 ether; // Reduced to 0.005 cBTC
    uint256 public constant MAX_PAYOUT_RATIO = 50; // Max 50% of pool per payout
    
    event PoolFunded(address indexed funder, uint256 amount, string source);
    event BetReceived(address indexed player, uint256 amount);
    event PayoutSent(address indexed player, uint256 amount, uint8 goblinsTapped);
    event HouseEdgeCollected(uint256 amount);
    event EmergencyWithdrawal(address indexed owner, uint256 amount);
    
    error OnlyGameContract();
    error OnlyOwner();
    error InsufficientPoolBalance();
    error PayoutTooLarge();
    error TransferFailed();
    
    modifier onlyGameContract() {
        if (msg.sender != gameContract) revert OnlyGameContract();
        _;
    }
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    constructor() payable {
        owner = msg.sender;
        
        // Initial house funding
        if (msg.value > 0) {
            houseReserve = msg.value;
            totalPool = msg.value;
            emit PoolFunded(msg.sender, msg.value, "Initial House Funding");
        }
    }
    
    // Set the game contract that can interact with this pool
    function setGameContract(address _gameContract) external onlyOwner {
        gameContract = _gameContract;
    }
    
    // Add funds to the pool (house or external funding)
    function fundPool() external payable {
        require(msg.value > 0, "Must send cBTC to fund pool");
        
        houseReserve += msg.value;
        totalPool += msg.value;
        
        emit PoolFunded(msg.sender, msg.value, "External Funding");
    }
    
    // Called by game contract when player places bet
    function receiveBet(address player, uint256 amount) external payable onlyGameContract {
        require(msg.value == amount, "Sent value must match bet amount");
        
        // Calculate house edge
        uint256 houseEdge = (amount * HOUSE_EDGE) / 100;
        uint256 playerContribution = amount - houseEdge;
        
        // Add to respective pools
        houseReserve += houseEdge;
        playerFunds += playerContribution;
        totalPool += amount;
        
        emit BetReceived(player, amount);
        emit HouseEdgeCollected(houseEdge);
    }
    
    // Called by game contract when player wins
    function payoutWinner(address player, uint256 betAmount, uint8 goblinsTapped) external onlyGameContract returns (uint256) {
        // Calculate payout based on goblins tapped
        uint256 multiplier = getMultiplier(goblinsTapped);
        uint256 payout = (betAmount * multiplier) / 100;
        
        // Safety checks - relaxed for smaller scale
        if (totalPool < MIN_POOL_BALANCE) revert InsufficientPoolBalance();
        
        uint256 maxPayout = (totalPool * MAX_PAYOUT_RATIO) / 100;
        if (payout > maxPayout) revert PayoutTooLarge();
        
        if (address(this).balance < payout) revert InsufficientPoolBalance();
        
        // Deduct from pool (prioritize player funds first, then house reserve)
        if (payout <= playerFunds) {
            playerFunds -= payout;
        } else {
            uint256 fromHouse = payout - playerFunds;
            playerFunds = 0;
            houseReserve -= fromHouse;
        }
        totalPool -= payout;
        
        // Send payout
        (bool success, ) = payable(player).call{value: payout}("");
        if (!success) revert TransferFailed();
        
        emit PayoutSent(player, payout, goblinsTapped);
        return payout;
    }
    
    // Called by game contract when player loses
    function playerLost(address player, uint256 /* betAmount */) external onlyGameContract {
        // Money already added in receiveBet, just emit event
        emit PayoutSent(player, 0, 0); // 0 payout means loss
    }
    
    // Get payout multiplier based on goblins tapped
    function getMultiplier(uint8 goblinsTapped) public pure returns (uint256) {
        if (goblinsTapped < 5) return 0;     // Loss
        if (goblinsTapped < 8) return 115;   // 1.15x (reduced from 1.2x for house edge)
        if (goblinsTapped < 10) return 140;  // 1.4x (reduced from 1.5x)
        return 180;                          // 1.8x (reduced from 2.0x)
    }
    
    // View functions
    function getPoolStatus() external view returns (
        uint256 _totalPool,
        uint256 _houseReserve,
        uint256 _playerFunds,
        uint256 _contractBalance
    ) {
        return (totalPool, houseReserve, playerFunds, address(this).balance);
    }
    
    function canPayout(uint256 amount) external view returns (bool) {
        return address(this).balance >= amount && 
               totalPool >= MIN_POOL_BALANCE &&
               amount <= (totalPool * MAX_PAYOUT_RATIO) / 100;
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        totalPool = 0;
        houseReserve = 0;
        playerFunds = 0;
        
        (bool success, ) = payable(owner).call{value: balance}("");
        if (!success) revert TransferFailed();
        
        emit EmergencyWithdrawal(owner, balance);
    }
    
    // Function to receive cBTC (for manual pool funding)
    receive() external payable {
        require(msg.value > 0, "Must send cBTC to fund pool");
        
        houseReserve += msg.value;
        totalPool += msg.value;
        
        emit PoolFunded(msg.sender, msg.value, "Direct Transfer");
    }
} 