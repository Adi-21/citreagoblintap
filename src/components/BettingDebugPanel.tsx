'use client';

import { useState, useEffect } from 'react';
import { useBlockchain } from '@/hooks/useBlockchain';
import { formatEther, parseEther } from 'viem';
import { publicClient, GOBLIN_TAP_ADDRESS, BETTING_POOL_ADDRESS } from '@/config/blockchain';

interface BettingDebugPanelProps {
    className?: string;
}

export function BettingDebugPanel({ className = '' }: BettingDebugPanelProps) {
    const {
        placeBet,
        claimWinnings,
        getActiveBet,
        hasActiveBet,
        getBalance,
        getPoolStatus,
        previewPayout,
        canClaimPayout,
        isLoading,
        error,
        authenticated,
        user,
        isPoolEnabled
    } = useBlockchain();

    const [activeBet, setActiveBet] = useState<any>(null);
    const [poolStatus, setPoolStatus] = useState<any>(null);
    const [contractBalances, setContractBalances] = useState<any>(null);
    const [walletBalance, setWalletBalance] = useState<string>('0');
    const [hasActiveB, setHasActiveB] = useState<boolean>(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [testGoblins, setTestGoblins] = useState<number>(10);
    const [previewedPayout, setPreviewedPayout] = useState<string>('0');

    // Refresh all data
    const refreshData = async () => {
        if (!authenticated || !user) return;

        setIsRefreshing(true);
        try {
            // Get active bet status
            const hasActive = await hasActiveBet();
            setHasActiveB(hasActive);

            if (hasActive) {
                const bet = await getActiveBet();
                setActiveBet(bet);

                // Preview payout for current bet
                if (bet?.amount) {
                    const payout = await previewPayout(formatEther(bet.amount), testGoblins);
                    setPreviewedPayout(payout);
                }
            } else {
                setActiveBet(null);
                setPreviewedPayout('0');
            }

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
    };

    // Auto-refresh on mount and when authentication changes
    useEffect(() => {
        refreshData();
    }, [authenticated, user]);

    // Handle claiming winnings
    const handleClaimWinnings = async () => {
        try {
            const success = await claimWinnings(testGoblins);
            if (success) {
                await refreshData(); // Refresh after claiming
            }
        } catch (err) {
            console.error('Error claiming winnings:', err);
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

            {/* Active Bet Status */}
            <div className="bg-gray-800 rounded p-4">
                <h4 className="text-white font-medium mb-2">🎯 Active Bet Status</h4>
                {hasActiveB && activeBet ? (
                    <div className="space-y-3">
                        <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3">
                            <p className="text-yellow-300 font-medium">⚠️ You have an active bet!</p>
                            <div className="mt-2 space-y-1 text-sm">
                                <p className="text-gray-300">Amount: <span className="text-white">{formatEther(activeBet.amount)} cBTC</span></p>
                                <p className="text-gray-300">Placed: <span className="text-white">{new Date(Number(activeBet.timestamp) * 1000).toLocaleString()}</span></p>
                                <p className="text-gray-300">Status: <span className="text-green-400">Active</span></p>
                            </div>
                        </div>

                        {/* Payout Preview */}
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
                                    Update
                                </button>
                            </div>
                            <p className="text-sm text-gray-300">
                                Payout: <span className="text-green-400">{previewedPayout} cBTC</span>
                                {testGoblins < 5 && <span className="text-red-400 ml-2">(Loss)</span>}
                            </p>
                        </div>

                        {/* Claim Actions */}
                        <div className="space-y-2">
                            <button
                                onClick={handleClaimWinnings}
                                disabled={isLoading}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                                {isLoading ? 'Claiming...' : `🏆 Claim Winnings (${testGoblins} goblins)`}
                            </button>
                            <p className="text-xs text-gray-400">
                                💡 You must claim this bet before placing a new one
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="bg-green-900/30 border border-green-600 rounded p-3">
                            <p className="text-green-300">✅ No active bet - you can place a new bet!</p>
                        </div>

                        {/* Quick Bet Actions */}
                        <div className="space-y-2">
                            <p className="text-gray-300 text-sm font-medium">Quick Bet Actions:</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => handlePlaceBet('0.001')}
                                    disabled={isLoading}
                                    className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                                >
                                    Bet 0.001 cBTC
                                </button>
                                <button
                                    onClick={() => handlePlaceBet('0.005')}
                                    disabled={isLoading}
                                    className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                                >
                                    Bet 0.005 cBTC
                                </button>
                                <button
                                    onClick={() => handlePlaceBet('0.01')}
                                    disabled={isLoading}
                                    className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                                >
                                    Bet 0.01 cBTC
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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

            {/* Pool Funding (if needed) */}
            {poolStatus && parseFloat(poolStatus.totalPool) < 0.1 && (
                <div className="bg-red-900/30 border border-red-600 rounded p-4">
                    <h4 className="text-red-300 font-medium mb-2">⚠️ Pool Funding Required</h4>
                    <div className="space-y-3">
                        <div className="text-sm text-red-200">
                            <p>Pool below minimum balance (0.1 cBTC required)</p>
                            <p>Current: <span className="text-white">{poolStatus.totalPool} cBTC</span></p>
                            <p>Needed: <span className="text-yellow-400">~{(0.1 - parseFloat(poolStatus.totalPool)).toFixed(3)} cBTC</span></p>
                        </div>

                        <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3">
                            <h5 className="text-yellow-300 font-medium text-sm mb-2">💡 How to Fund Pool:</h5>
                            <div className="text-xs text-yellow-200 space-y-1">
                                <p><strong>Option 1:</strong> Send ~{(0.1 - parseFloat(poolStatus.totalPool)).toFixed(3)} cBTC directly to:</p>
                                <p className="font-mono text-white bg-gray-800 p-1 rounded">{BETTING_POOL_ADDRESS}</p>
                                <p><strong>Option 2:</strong> Use a wallet to call <code>fundPool()</code> with cBTC</p>
                            </div>
                        </div>

                        <div className="bg-blue-900/30 border border-blue-600 rounded p-3">
                            <p className="text-blue-200 text-xs">
                                🎯 Once funded, your claim transactions will work properly!
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