'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBlockchain } from '@/hooks/useBlockchain';
import { formatEther } from 'viem';
import { publicClient, GOBLIN_TAP_ADDRESS, BETTING_POOL_ADDRESS } from '@/config/blockchain';

interface BettingDebugPanelProps {
    className?: string;
}

interface Bet {
    id: bigint;
    player: `0x${string}`;
    amount: bigint;
    timestamp: bigint;
    isActive: boolean;
}

interface PoolStatus {
    totalPool: string;
    houseReserve: string;
    playerFunds: string;
    contractBalance: string;
}

interface ContractBalances {
    game: string;
    pool: string;
}

export function BettingDebugPanel({ className = '' }: BettingDebugPanelProps) {
    const {
        placeBet,
        claimWinnings,
        getBalance,
        getPoolStatus,
        previewPayout,
        isLoading,
        error,
        authenticated,
        user,
        isPoolEnabled
    } = useBlockchain();

    const [activeBets, setActiveBets] = useState<Bet[]>([]);
    const [activeBetCount, setActiveBetCount] = useState<number>(0);
    const [poolStatus, setPoolStatus] = useState<PoolStatus | null>(null);
    const [contractBalances, setContractBalances] = useState<ContractBalances | null>(null);
    const [walletBalance, setWalletBalance] = useState<string>('0');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [testGoblins, setTestGoblins] = useState<number>(10);
    const [selectedBetId, setSelectedBetId] = useState<bigint | null>(null);
    const [previewedPayouts, setPreviewedPayouts] = useState<{ [key: string]: string }>({});

    // Refresh all data
    const refreshData = useCallback(async () => {
        if (!authenticated || !user) return;

        setIsRefreshing(true);
        try {
            const wallet = user?.wallet;
            if (!wallet) return;

            // Get all active bets using V3 functions
            const betsResult = await publicClient.readContract({
                address: GOBLIN_TAP_ADDRESS as `0x${string}`,
                abi: [
                    {
                        "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
                        "name": "getActiveBets",
                        "outputs": [{ "components": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "address", "name": "player", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "timestamp", "type": "uint256" }, { "internalType": "bool", "name": "isActive", "type": "bool" }], "internalType": "struct GoblinTapV3.Bet[]", "name": "", "type": "tuple[]" }],
                        "stateMutability": "view",
                        "type": "function"
                    }
                ],
                functionName: 'getActiveBets',
                args: [wallet.address as `0x${string}`],
            });
            setActiveBets(betsResult as Bet[]);

            // Get active bet count
            const betCount = await publicClient.readContract({
                address: GOBLIN_TAP_ADDRESS as `0x${string}`,
                abi: [
                    {
                        "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
                        "name": "getActiveBetCount",
                        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
                        "stateMutability": "view",
                        "type": "function"
                    }
                ],
                functionName: 'getActiveBetCount',
                args: [wallet.address as `0x${string}`],
            });
            setActiveBetCount(Number(betCount));

            // Preview payouts for all active bets
            const payouts: { [key: string]: string } = {};
            for (const bet of (betsResult as Bet[])) {
                const payout = await previewPayout(formatEther(bet.amount), testGoblins);
                payouts[bet.id.toString()] = payout;
            }
            setPreviewedPayouts(payouts);

            // Get wallet balance
            const balance = await getBalance();
            setWalletBalance(balance);

            // Get pool status
            if (isPoolEnabled) {
                const pool = await getPoolStatus();
                setPoolStatus(pool);
            }

            // Get contract balances
            const gameBalance = await publicClient.getBalance({
                address: GOBLIN_TAP_ADDRESS as `0x${string}`,
            });

            const poolBalance = await publicClient.getBalance({
                address: BETTING_POOL_ADDRESS as `0x${string}`,
            });

            setContractBalances({
                game: formatEther(gameBalance),
                pool: formatEther(poolBalance),
            });

        } catch (err) {
            console.error('Error refreshing data:', err);
        } finally {
            setIsRefreshing(false);
        }
    }, [authenticated, user, testGoblins, previewPayout, getBalance, getPoolStatus, isPoolEnabled]);

    // Auto-refresh on mount and when authentication changes
    useEffect(() => {
        refreshData();
    }, [authenticated, user, refreshData]);


    // Handle claiming specific bet by ID (V3 feature)
    const handleClaimSpecificBet = async () => {
        try {
            // Use the claimWinnings function from useBlockchain (it should support bet ID in V3)
            // For now, use the legacy function which claims the oldest bet
            const success = await claimWinnings(testGoblins);
            if (success) {
                await refreshData(); // Refresh after claiming
            }
        } catch (err) {
            console.error('Error claiming specific bet:', err);
        }
    };

    // Handle placing bet
    const handlePlaceBet = async (amount: string) => {
        try {
            const success = await placeBet(amount);
            if (success) {
                await refreshData(); // Refresh after placing bet
            }
        } catch (err) {
            console.error('Error placing bet:', err);
        }
    };

    if (!authenticated) {
        return (
            <div className={`bg-gray-900 border border-gray-700 rounded-lg p-6 ${className}`}>
                <h3 className="text-lg font-bold text-white mb-4">🔍 Betting Debug Panel</h3>
                <p className="text-gray-400">Please connect your wallet to see betting information.</p>
            </div>
        );
    }

    return (
        <div className={`bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-6 ${className}`}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">🔍 Betting Debug Panel</h3>
                <button
                    onClick={refreshData}
                    disabled={isRefreshing}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    {isRefreshing ? '🔄' : '🔄 Refresh'}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-900/50 border border-red-600 rounded p-3">
                    <p className="text-red-300 text-sm">❌ {error}</p>
                </div>
            )}

            {/* Wallet Info */}
            <div className="bg-gray-800 rounded p-4">
                <h4 className="text-white font-medium mb-2">👤 Wallet Information</h4>
                <div className="space-y-1 text-sm">
                    <p className="text-gray-300">Address: <span className="text-white font-mono">{user?.wallet?.address}</span></p>
                    <p className="text-gray-300">Balance: <span className="text-green-400">{walletBalance} cBTC</span></p>
                </div>
            </div>

            {/* Contract Addresses */}
            <div className="bg-gray-800 rounded p-4">
                <h4 className="text-white font-medium mb-2">📋 Contract Addresses</h4>
                <div className="space-y-1 text-sm">
                    <p className="text-gray-300">Game: <span className="text-white font-mono">{GOBLIN_TAP_ADDRESS}</span></p>
                    <p className="text-gray-300">Pool: <span className="text-white font-mono">{BETTING_POOL_ADDRESS}</span></p>
                    <p className="text-gray-300">Pool System: <span className="text-green-400">{isPoolEnabled ? '✅ Enabled' : '❌ Disabled'}</span></p>
                </div>
            </div>

            {/* Contract Balances */}
            {contractBalances && (
                <div className="bg-gray-800 rounded p-4">
                    <h4 className="text-white font-medium mb-2">💰 Contract Balances</h4>
                    <div className="space-y-1 text-sm">
                        <p className="text-gray-300">Game Contract: <span className="text-yellow-400">{contractBalances.game} cBTC</span></p>
                        <p className="text-gray-300">Pool Contract: <span className="text-green-400">{contractBalances.pool} cBTC</span></p>
                        {parseFloat(contractBalances.game) > 0 && (
                            <p className="text-orange-400 text-xs">⚠️ Money stuck in game contract (should be 0)</p>
                        )}
                    </div>
                </div>
            )}

            {/* Pool Status */}
            {poolStatus && (
                <div className="bg-gray-800 rounded p-4">
                    <h4 className="text-white font-medium mb-2">🏦 Pool Status</h4>
                    <div className="space-y-1 text-sm">
                        <p className="text-gray-300">Total Pool: <span className="text-blue-400">{poolStatus.totalPool} cBTC</span></p>
                        <p className="text-gray-300">House Reserve: <span className="text-red-400">{poolStatus.houseReserve} cBTC</span></p>
                        <p className="text-gray-300">Player Funds: <span className="text-green-400">{poolStatus.playerFunds} cBTC</span></p>
                        <p className="text-gray-300">Contract Balance: <span className="text-white">{poolStatus.contractBalance} cBTC</span></p>
                    </div>
                </div>
            )}

            {/* Active Bets Status (V3 Multiple Bets) */}
            <div className="bg-gray-800 rounded p-4">
                <h4 className="text-white font-medium mb-2">🎯 Active Bets Status (V3)</h4>
                <div className="mb-3">
                    <p className="text-gray-300 text-sm">Active Bets: <span className="text-white font-medium">{activeBetCount}</span></p>
                </div>

                {activeBets.length > 0 ? (
                    <div className="space-y-4">
                        {/* Global Payout Preview Controls */}
                        <div className="bg-blue-900/30 border border-blue-600 rounded p-3">
                            <h5 className="text-blue-300 font-medium mb-2">💸 Payout Preview</h5>
                            <div className="flex items-center gap-3 mb-2">
                                <label className="text-gray-300 text-sm">Goblins tapped:</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={testGoblins}
                                    onChange={(e) => setTestGoblins(parseInt(e.target.value) || 0)}
                                    className="w-16 px-2 py-1 bg-gray-700 text-white rounded text-sm"
                                />
                                <button
                                    onClick={() => refreshData()}
                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                >
                                    Update All
                                </button>
                            </div>
                        </div>

                        {/* Individual Bets */}
                        {activeBets.map((bet: Bet) => (
                            <div key={bet.id} className="bg-yellow-900/30 border border-yellow-600 rounded p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-yellow-300 font-medium">🎲 Bet #{bet.id}</p>
                                    <button
                                        onClick={() => setSelectedBetId(selectedBetId === bet.id ? null : bet.id)}
                                        className="text-xs text-yellow-200 hover:text-white"
                                    >
                                        {selectedBetId === bet.id ? 'Hide' : 'Show'} Details
                                    </button>
                                </div>

                                <div className="space-y-1 text-sm">
                                    <p className="text-gray-300">Amount: <span className="text-white">{formatEther(bet.amount)} cBTC</span></p>
                                    <p className="text-gray-300">Expected Payout: <span className="text-green-400">{previewedPayouts[bet.id.toString()] || '0'} cBTC</span></p>
                                    {testGoblins < 5 && <span className="text-red-400 text-xs">(Would be loss)</span>}

                                    {selectedBetId === bet.id && (
                                        <>
                                            <p className="text-gray-300">Placed: <span className="text-white">{new Date(Number(bet.timestamp) * 1000).toLocaleString()}</span></p>
                                            <p className="text-gray-300">Bet ID: <span className="text-white">{bet.id}</span></p>
                                        </>
                                    )}
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <button
                                        onClick={() => handleClaimSpecificBet()}
                                        disabled={isLoading}
                                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Claiming...' : `🏆 Claim (${testGoblins})`}
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="bg-green-900/30 border border-green-600 rounded p-3">
                            <p className="text-green-300 text-sm">✅ V3 Feature: You can place more bets while these are active!</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-900/30 border border-green-600 rounded p-3">
                        <p className="text-green-300">✅ No active bets - place your first bet!</p>
                    </div>
                )}

                {/* Quick Bet Actions (Always Available in V3) */}
                <div className="mt-4 space-y-2">
                    <p className="text-gray-300 text-sm font-medium">Quick Bet Actions (V3):</p>
                    <div className="grid grid-cols-4 gap-2">
                        <button
                            onClick={() => handlePlaceBet('0.0001')}
                            disabled={isLoading}
                            className="px-2 py-2 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                        >
                            0.0001 cBTC
                        </button>
                        <button
                            onClick={() => handlePlaceBet('0.0005')}
                            disabled={isLoading}
                            className="px-2 py-2 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                        >
                            0.0005 cBTC
                        </button>
                        <button
                            onClick={() => handlePlaceBet('0.001')}
                            disabled={isLoading}
                            className="px-2 py-2 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                        >
                            0.001 cBTC
                        </button>
                        <button
                            onClick={() => handlePlaceBet('0.002')}
                            disabled={isLoading}
                            className="px-2 py-2 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                        >
                            0.002 cBTC
                        </button>
                    </div>
                    <p className="text-xs text-gray-400">
                        💡 V3 allows multiple active bets - no need to claim before placing new ones!
                    </p>
                </div>
            </div>

            {/* Money Flow Status */}
            <div className="bg-gray-800 rounded p-4">
                <h4 className="text-white font-medium mb-2">💰 Money Flow Status</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-300">Game Contract Balance:</span>
                        <span className={contractBalances?.game === '0.0' ? 'text-green-400' : 'text-yellow-400'}>
                            {contractBalances?.game === '0.0' ? '✅ Empty (good)' : '⚠️ Has funds (might be stuck)'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-300">Pool Contract Balance:</span>
                        <span className={parseFloat(contractBalances?.pool || '0') > 0 ? 'text-green-400' : 'text-red-400'}>
                            {parseFloat(contractBalances?.pool || '0') > 0 ? '✅ Has funds' : '❌ No funds'}
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                        💡 Proper flow: User → Game → Pool → User (on win)
                    </div>
                </div>
            </div>

            {/* Pool Funding (if needed) - V3 Lower Minimum */}
            {poolStatus && parseFloat(poolStatus.totalPool) < 0.005 && (
                <div className="bg-red-900/30 border border-red-600 rounded p-4">
                    <h4 className="text-red-300 font-medium mb-2">⚠️ Pool Funding Required (V3)</h4>
                    <div className="space-y-3">
                        <div className="text-sm text-red-200">
                            <p>Pool below V3 minimum balance (0.005 cBTC required)</p>
                            <p>Current: <span className="text-white">{poolStatus.totalPool} cBTC</span></p>
                            <p>Needed: <span className="text-yellow-400">~{(0.005 - parseFloat(poolStatus.totalPool)).toFixed(4)} cBTC</span></p>
                        </div>

                        <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3">
                            <h5 className="text-yellow-300 font-medium text-sm mb-2">💡 How to Fund Pool (V3):</h5>
                            <div className="text-xs text-yellow-200 space-y-1">
                                <p><strong>Option 1:</strong> Send ~{(0.005 - parseFloat(poolStatus.totalPool)).toFixed(4)} cBTC directly to:</p>
                                <p className="font-mono text-white bg-gray-800 p-1 rounded">{BETTING_POOL_ADDRESS}</p>
                                <p><strong>Option 2:</strong> Use a wallet to call <code>fundPool()</code> with cBTC</p>
                            </div>
                        </div>

                        <div className="bg-blue-900/30 border border-blue-600 rounded p-3">
                            <p className="text-blue-200 text-xs">
                                🎯 V3 has much lower requirements - once funded, all claim transactions will work!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Debug Actions */}
            <div className="bg-gray-800 rounded p-4">
                <h4 className="text-white font-medium mb-2">🔧 Debug Actions</h4>
                <div className="space-y-2">
                    <button
                        onClick={refreshData}
                        disabled={isRefreshing}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        🔄 Refresh All Data
                    </button>
                    <p className="text-xs text-gray-400">
                        Use this panel to monitor betting status and debug issues
                    </p>
                </div>
            </div>
        </div>
    );
} 