import { useState, useCallback } from 'react';
import { usePrivy, useSendTransaction } from '@privy-io/react-auth';
import { parseEther, formatEther, decodeEventLog } from 'viem';
import { 
  GOBLIN_TAP_ADDRESS, 
  BETTING_POOL_ADDRESS, 
  GOBLIN_TAP_ABI, 
  BETTING_POOL_ABI, 
  publicClient,
  PAYOUT_MULTIPLIERS 
} from '@/config/blockchain';

export interface BetV3 {
  id: bigint;  // V3 feature - bet ID
  player: string;
  amount: bigint;
  timestamp: bigint;
  isActive: boolean;
}

export interface PoolStatus {
  totalPool: string;
  houseReserve: string;
  playerFunds: string;
  contractBalance: string;
}

export function useBlockchain() {
  const { user, authenticated } = usePrivy();
  const { sendTransaction } = useSendTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if pool system is enabled (pool address is set)
  const isPoolEnabled = BETTING_POOL_ADDRESS !== '0x0000000000000000000000000000000000000000';

  // V3 Enhanced placeBet - returns bet ID
  const placeBet = useCallback(async (amount: string): Promise<{ success: boolean; betId?: number }> => {
    if (!authenticated || !user) {
      setError('Please connect your wallet first');
      return { success: false };
    }

    setIsLoading(true);
    setError(null);

    try {
      const wallet = user.wallet;
      if (!wallet) {
        setError('No wallet available. Please ensure you have connected a wallet.');
        setIsLoading(false);
        return { success: false };
      }

      const amountWei = parseEther(amount);
      console.log('V3 Placing bet:', amount, 'cBTC for wallet:', wallet.address);

      // Check balance
      const currentBalance = await publicClient.getBalance({
        address: wallet.address as `0x${string}`,
      });
      
      const estimatedFees = BigInt('2000000000000000'); // estimated 0.002 cBTC for fees
      const totalNeeded = amountWei + estimatedFees;
      
      if (currentBalance < totalNeeded) {
        throw new Error(`Insufficient balance. You need at least ${formatEther(totalNeeded)} cBTC (${amount} for bet + ~0.002 for fees), but you only have ${formatEther(currentBalance)} cBTC.`);
      }

      // Use V3 contract
      const contractAddress = GOBLIN_TAP_ADDRESS;
      const contractABI = GOBLIN_TAP_ABI;

      // Encode the placeBet function call
      const { encodeFunctionData } = await import('viem');
      const data = encodeFunctionData({
        abi: contractABI,
        functionName: 'placeBet',
        args: [],
      });

      // Estimate gas
      let gasEstimate;
      try {
        gasEstimate = await publicClient.estimateGas({
          account: wallet.address as `0x${string}`,
          to: contractAddress as `0x${string}`,
          data: data,
          value: amountWei,
        });
        console.log('Estimated gas for V3 bet:', gasEstimate.toString());
      } catch (gasError) {
        console.warn('Gas estimation failed for V3 bet:', gasError);
        gasEstimate = BigInt(200000); // V3 fallback
        console.log('Using fallback gas limit for V3 bet:', gasEstimate.toString());
      }

      const result = await sendTransaction({
        to: contractAddress as `0x${string}`,
        value: amountWei,
        data: data,
        gasLimit: gasEstimate,
      }, {
        uiOptions: {
          showWalletUIs: true,
        },
      });

      console.log('V3 Bet transaction sent:', result.hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: result.hash });
      console.log('V3 Bet transaction confirmed:', receipt);
      
             // Extract bet ID from transaction logs/events
       // In V3, placeBet returns the bet ID, but we need to parse it from the receipt
       let betId: number | undefined;
       
       // Parse the BetPlaced event to get the bet ID
       try {
         // Look for BetPlaced event in transaction logs
         for (const log of receipt.logs) {
           try {
             const decoded = decodeEventLog({
               abi: contractABI,
               data: log.data,
               topics: log.topics,
             });
             if (decoded.eventName === 'BetPlaced' && decoded.args && Array.isArray(decoded.args)) {
               // V3 BetPlaced event should have betId as the second parameter (after player)
               betId = Number(decoded.args[1]);
               console.log('V3 Bet ID extracted:', betId);
               break;
             }
           } catch {
             // Skip logs that can't be decoded
             continue;
           }
         }
       } catch (error) {
         console.warn('Could not extract bet ID from transaction:', error);
       }

      return { success: true, betId };
      
    } catch (err) {
      console.error('Error placing V3 bet:', err);
      setError(err instanceof Error ? err.message : 'Failed to place bet');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, user, sendTransaction]);

  // V3 Get all active bets for a player
  const getActiveBets = useCallback(async (): Promise<BetV3[]> => {
    if (!authenticated || !user?.wallet) return [];

    try {
      const wallet = user.wallet;
      const bets = await publicClient.readContract({
        address: GOBLIN_TAP_ADDRESS as `0x${string}`,
        abi: GOBLIN_TAP_ABI,
        functionName: 'getActiveBets',
        args: [wallet.address as `0x${string}`],
      });
      
      return bets as BetV3[];
    } catch (err) {
      console.error('Error getting active bets:', err);
      return [];
    }
  }, [authenticated, user]);

  // V3 Get active bet count
  const getActiveBetCount = useCallback(async (): Promise<number> => {
    if (!authenticated || !user?.wallet) return 0;

    try {
      const wallet = user.wallet;
      const count = await publicClient.readContract({
        address: GOBLIN_TAP_ADDRESS as `0x${string}`,
        abi: GOBLIN_TAP_ABI,
        functionName: 'getActiveBetCount',
        args: [wallet.address as `0x${string}`],
      });
      
      return Number(count);
    } catch (err) {
      console.error('Error getting active bet count:', err);
      return 0;
    }
  }, [authenticated, user]);

  // V3 Claim specific bet by ID
  const claimWinningsById = useCallback(async (betId: number, goblinsTapped: number) => {
    if (!authenticated || !user) {
      setError('Please connect your wallet first');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const wallet = user.wallet;
      if (!wallet) {
        setError('No wallet available. Please ensure you have connected a wallet.');
        setIsLoading(false);
        return false;
      }

      console.log('V3 Claiming winnings for bet ID:', betId, 'with', goblinsTapped, 'goblins');
      
      if (goblinsTapped < 0 || goblinsTapped > 255) {
        throw new Error(`Invalid goblin count: ${goblinsTapped}. Must be between 0 and 255.`);
      }

      // Encode the V3 claimWinnings function call with bet ID
      const { encodeFunctionData } = await import('viem');
      const data = encodeFunctionData({
        abi: GOBLIN_TAP_ABI,
        functionName: 'claimWinnings',
        args: [betId, goblinsTapped],
      });

      // Estimate gas
      let gasEstimate;
      try {
        gasEstimate = await publicClient.estimateGas({
          account: wallet.address as `0x${string}`,
          to: GOBLIN_TAP_ADDRESS as `0x${string}`,
          data: data,
          value: BigInt(0),
        });
        console.log('Estimated gas for V3 claim:', gasEstimate.toString());
      } catch (gasError) {
        console.warn('Gas estimation failed for V3 claim:', gasError);
        gasEstimate = BigInt(300000); // V3 fallback for claims
        console.log('Using fallback gas limit for V3 claim:', gasEstimate.toString());
      }

      const result = await sendTransaction({
        to: GOBLIN_TAP_ADDRESS as `0x${string}`,
        data: data,
        value: BigInt(0),
        gasLimit: gasEstimate,
      }, {
        uiOptions: {
          showWalletUIs: true,
        },
      });

      console.log('V3 Claim winnings transaction sent:', result.hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: result.hash });
      console.log('V3 Claim winnings transaction confirmed:', receipt);

      return true;
    } catch (err) {
      console.error('Error claiming V3 winnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim winnings');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, user, sendTransaction]);

  // Legacy claimWinnings (claims oldest bet) for backward compatibility
  const claimWinnings = useCallback(async (goblinsTapped: number) => {
    if (!authenticated || !user) {
      setError('Please connect your wallet first');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const wallet = user.wallet;
      if (!wallet) {
        setError('No wallet available. Please ensure you have connected a wallet.');
        setIsLoading(false);
        return false;
      }

      console.log('V3 Claiming oldest bet with', goblinsTapped, 'goblins...');
      
      if (goblinsTapped < 0 || goblinsTapped > 255) {
        throw new Error(`Invalid goblin count: ${goblinsTapped}. Must be between 0 and 255.`);
      }

      // Encode the legacy claimWinnings function call (claims oldest bet)
      const { encodeFunctionData } = await import('viem');
      const data = encodeFunctionData({
        abi: GOBLIN_TAP_ABI,
        functionName: 'claimWinnings',
        args: [goblinsTapped],
      });

      // Estimate gas
      let gasEstimate;
      try {
        gasEstimate = await publicClient.estimateGas({
          account: wallet.address as `0x${string}`,
          to: GOBLIN_TAP_ADDRESS as `0x${string}`,
          data: data,
          value: BigInt(0),
        });
        console.log('Estimated gas for V3 legacy claim:', gasEstimate.toString());
      } catch (gasError) {
        console.warn('Gas estimation failed for V3 legacy claim:', gasError);
        gasEstimate = BigInt(300000);
        console.log('Using fallback gas limit for V3 legacy claim:', gasEstimate.toString());
      }

      const result = await sendTransaction({
        to: GOBLIN_TAP_ADDRESS as `0x${string}`,
        data: data,
        value: BigInt(0),
        gasLimit: gasEstimate,
      }, {
        uiOptions: {
          showWalletUIs: true,
        },
      });

      console.log('V3 Legacy claim winnings transaction sent:', result.hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: result.hash });
      console.log('V3 Legacy claim winnings transaction confirmed:', receipt);

      return true;
    } catch (err) {
      console.error('Error claiming V3 legacy winnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim winnings');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, user, sendTransaction]);

  // Get wallet balance
  const getBalance = useCallback(async (): Promise<string> => {
    if (!authenticated || !user?.wallet) return '0';

    try {
      const wallet = user.wallet;
      console.log('Getting balance for wallet:', wallet.address);
      const balance = await publicClient.getBalance({
        address: wallet.address as `0x${string}`,
      });

      return formatEther(balance);
    } catch (err) {
      console.error('Error getting balance:', err);
      return '0';
    }
  }, [authenticated, user]);

  const refreshBalance = useCallback(async (): Promise<string> => {
    return await getBalance();
  }, [getBalance]);

  // Pool status
  const getPoolStatus = useCallback(async (): Promise<PoolStatus | null> => {
    if (!isPoolEnabled) return null;

    try {
      const poolStatus = await publicClient.readContract({
        address: BETTING_POOL_ADDRESS as `0x${string}`,
        abi: BETTING_POOL_ABI,
        functionName: 'getPoolStatus',
        args: [],
      });

      const [totalPool, houseReserve, playerFunds, contractBalance] = poolStatus as [bigint, bigint, bigint, bigint];

      return {
        totalPool: formatEther(totalPool),
        houseReserve: formatEther(houseReserve),
        playerFunds: formatEther(playerFunds),
        contractBalance: formatEther(contractBalance),
      };
    } catch (err) {
      console.error('Error getting pool status:', err);
      return null;
    }
  }, [isPoolEnabled]);

  // Preview payout
  const previewPayout = useCallback(async (betAmount: string, goblinsTapped: number): Promise<string> => {
    try {
      const betAmountWei = parseEther(betAmount);
      
      if (isPoolEnabled) {
        // Use V3 pool contract for accurate payout calculation
        const payout = await publicClient.readContract({
          address: GOBLIN_TAP_ADDRESS as `0x${string}`,
          abi: GOBLIN_TAP_ABI,
          functionName: 'previewPayout',
          args: [betAmountWei, goblinsTapped],
        });
        return formatEther(payout as bigint);
      } else {
        // Use local calculation for legacy system
        let multiplier = 0;
        if (goblinsTapped >= 10) multiplier = PAYOUT_MULTIPLIERS[10];
        else if (goblinsTapped >= 8) multiplier = PAYOUT_MULTIPLIERS[8];
        else if (goblinsTapped >= 5) multiplier = PAYOUT_MULTIPLIERS[5];
        else multiplier = PAYOUT_MULTIPLIERS[0];
        
        const payoutAmount = parseFloat(betAmount) * multiplier;
        return payoutAmount.toString();
      }
    } catch (err) {
      console.error('Error previewing payout:', err);
      return '0';
    }
  }, [isPoolEnabled]);

  // Legacy compatibility functions
  const getActiveBet = useCallback(async () => {
    const bets = await getActiveBets();
    return bets.length > 0 ? bets[0] : null;
  }, [getActiveBets]);

  const hasActiveBet = useCallback(async (): Promise<boolean> => {
    const count = await getActiveBetCount();
    return count > 0;
  }, [getActiveBetCount]);

  return {
    // V3 Enhanced functions
    placeBet,
    claimWinningsById,
    getActiveBets,
    getActiveBetCount,
    
    // Legacy compatibility
    claimWinnings,
    getActiveBet,
    hasActiveBet,
    getBalance,
    refreshBalance,
    getPoolStatus,
    previewPayout,
    
    // System info
    isPoolEnabled,
    isLoading,
    error,
    authenticated,
    user,
  };
} 