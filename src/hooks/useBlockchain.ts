import { useState, useCallback } from 'react';
import { usePrivy, useSendTransaction } from '@privy-io/react-auth';
import { parseEther, formatEther } from 'viem';
import { 
  GOBLIN_TAP_ADDRESS, 
  BETTING_POOL_ADDRESS, 
  GOBLIN_TAP_ABI, 
  BETTING_POOL_ABI,
  CONTRACT_ADDRESS, 
  CONTRACT_ABI, 
  publicClient,
  PAYOUT_MULTIPLIERS 
} from '@/config/blockchain';

export interface Bet {
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

  const placeBet = useCallback(async (amount: string) => {
    if (!authenticated || !user) {
      setError('Please connect your wallet first');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      let wallet = user.wallet;
      if (!wallet) {
        setError('No wallet available. Please ensure you have connected a wallet.');
        setIsLoading(false);
        return false;
      }

      const amountWei = parseEther(amount);
      console.log('Placing bet:', amount, 'cBTC for wallet:', wallet.address);
      console.log('Pool system enabled:', isPoolEnabled);

      // Check if user has sufficient balance for bet + fees
      const currentBalance = await publicClient.getBalance({
        address: wallet.address as `0x${string}`,
      });
      
      const estimatedFees = BigInt('2000000000000000'); // estimated 0.002 cBTC for fees
      const totalNeeded = amountWei + estimatedFees;
      
      if (currentBalance < totalNeeded) {
        throw new Error(`Insufficient balance. You need at least ${formatEther(totalNeeded)} cBTC (${amount} for bet + ~0.002 for fees), but you only have ${formatEther(currentBalance)} cBTC.`);
      }

      // Use the appropriate contract address (GoblinTapV2 if pool is enabled, legacy otherwise)
      const contractAddress = isPoolEnabled ? GOBLIN_TAP_ADDRESS : CONTRACT_ADDRESS;
      const contractABI = isPoolEnabled ? GOBLIN_TAP_ABI : CONTRACT_ABI;

      // Encode the placeBet function call
      const { encodeFunctionData } = await import('viem');
      const data = encodeFunctionData({
        abi: contractABI,
        functionName: 'placeBet',
        args: [],
      });

      // Estimate gas for the transaction
      let gasEstimate;
      try {
        gasEstimate = await publicClient.estimateGas({
          account: wallet.address as `0x${string}`,
          to: contractAddress as `0x${string}`,
          data: data,
          value: amountWei,
        });
        console.log('Estimated gas for bet:', gasEstimate.toString());
      } catch (gasError) {
        console.warn('Gas estimation failed for bet:', gasError);
        // Higher fallback gas limit for pool operations
        gasEstimate = isPoolEnabled ? BigInt(200000) : BigInt(100000);
        console.log('Using fallback gas limit for bet:', gasEstimate.toString());
      }

      const result = await sendTransaction({
        to: contractAddress as `0x${string}`,
        value: amountWei,
        data: data, // Properly encoded placeBet function call
        gasLimit: gasEstimate, // Add estimated gas limit
      }, {
        uiOptions: {
          showWalletUIs: true, // Show Privy's transaction UI
        },
      });

      console.log('Bet transaction sent:', result.hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: result.hash });
      console.log('Bet transaction confirmed:', receipt);
      
      // Log money flow for debugging
      if (isPoolEnabled) {
        console.log('💰 Money flow: User → Game Contract → Pool Contract');
        console.log('   Game Contract should forward', amount, 'cBTC to pool');
        console.log('   Pool should split: 95% player funds, 5% house reserve');
      } else {
        console.log('💰 Money flow: User → Legacy Contract (direct)');
      }

      return true;
    } catch (err) {
      console.error('Error placing bet:', err);
      setError(err instanceof Error ? err.message : 'Failed to place bet');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, user, sendTransaction, isPoolEnabled]);

  const claimWinnings = useCallback(async (goblinsTapped: number) => {
    if (!authenticated || !user) {
      setError('Please connect your wallet first');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      let wallet = user.wallet;
      if (!wallet) {
        setError('No wallet available. Please ensure you have connected a wallet.');
        setIsLoading(false);
        return false;
      }

      console.log('Claiming winnings for', goblinsTapped, 'goblins...');
      console.log('Pool system enabled:', isPoolEnabled);
      
      // Validate goblin count (must be 0-255 for uint8)
      if (goblinsTapped < 0 || goblinsTapped > 255) {
        throw new Error(`Invalid goblin count: ${goblinsTapped}. Must be between 0 and 255.`);
      }

      // Use the appropriate contract and ABI
      const contractAddress = isPoolEnabled ? GOBLIN_TAP_ADDRESS : CONTRACT_ADDRESS;
      const contractABI = isPoolEnabled ? GOBLIN_TAP_ABI : CONTRACT_ABI;

      // Encode the function call for claimWinnings
      const { encodeFunctionData } = await import('viem');
      const data = encodeFunctionData({
        abi: contractABI,
        functionName: 'claimWinnings',
        args: [goblinsTapped],
      });
      
      console.log('Transaction data:', data);
      console.log('Contract address:', contractAddress);

      // Check if user has an active bet before claiming
      try {
        const activeBet = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: contractABI,
          functionName: 'getActiveBet',
          args: [wallet.address as `0x${string}`],
        });
        console.log('Active bet found:', activeBet);
      } catch (err) {
        console.warn('Could not verify active bet:', err);
        // Continue anyway, let the contract handle the validation
      }

      // Estimate gas for the transaction
      let gasEstimate;
      try {
        gasEstimate = await publicClient.estimateGas({
          account: wallet.address as `0x${string}`,
          to: contractAddress as `0x${string}`,
          data: data,
          value: BigInt(0),
        });
        console.log('Estimated gas:', gasEstimate.toString());
      } catch (gasError) {
        console.warn('Gas estimation failed:', gasError);
        // Higher fallback gas limit for pool operations (claimWinnings can be complex)
        gasEstimate = isPoolEnabled ? BigInt(300000) : BigInt(150000);
        console.log('Using fallback gas limit:', gasEstimate.toString());
      }

      // Check if user has sufficient balance for transaction fees
      const currentBalance = await publicClient.getBalance({
        address: wallet.address as `0x${string}`,
      });
      
      const estimatedFees = BigInt('5000000000000000'); // estimated 0.005 cBTC for fees (increased for contract calls)
      
      if (currentBalance < estimatedFees) {
        throw new Error(`Insufficient balance for transaction fees. You need at least ${formatEther(estimatedFees)} cBTC for fees, but you only have ${formatEther(currentBalance)} cBTC.`);
      }

      const result = await sendTransaction({
        to: contractAddress as `0x${string}`,
        data: data,
        value: BigInt(0), // No value for claimWinnings call
        gasLimit: gasEstimate, // Add the estimated gas limit
      }, {
        uiOptions: {
          showWalletUIs: true, // Show Privy's transaction UI
        },
      });

      console.log('Claim winnings transaction sent:', result.hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: result.hash });
      console.log('Claim winnings transaction confirmed:', receipt);
      
      // Log money flow for debugging
      if (isPoolEnabled) {
        console.log('💰 Money flow: Pool Contract → User Wallet');
        console.log('   Pool should send payout directly to user');
        console.log('   User wallet balance should increase');
        console.log('   Pool balance should decrease');
      } else {
        console.log('💰 Money flow: Legacy Contract → User Wallet');
      }

      return true;
    } catch (err) {
      console.error('Error claiming winnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim winnings');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, user, sendTransaction, isPoolEnabled]);

  const getActiveBet = useCallback(async (): Promise<Bet | null> => {
    if (!authenticated || !user) return null;

    try {
      const wallet = user.wallet;
      if (!wallet) return null;
      
      const contractAddress = isPoolEnabled ? GOBLIN_TAP_ADDRESS : CONTRACT_ADDRESS;
      const contractABI = isPoolEnabled ? GOBLIN_TAP_ABI : CONTRACT_ABI;
      
      const bet = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'getActiveBet',
        args: [wallet.address as `0x${string}`],
      });

      return bet as Bet;
    } catch (err) {
      console.error('Error getting active bet:', err);
      return null;
    }
  }, [authenticated, user, isPoolEnabled]);

  const hasActiveBet = useCallback(async (): Promise<boolean> => {
    if (!authenticated || !user) return false;

    try {
      const wallet = user.wallet;
      if (!wallet) return false;
      
      const contractAddress = isPoolEnabled ? GOBLIN_TAP_ADDRESS : CONTRACT_ADDRESS;
      const contractABI = isPoolEnabled ? GOBLIN_TAP_ABI : CONTRACT_ABI;
      
      const hasBet = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'hasActiveBet',
        args: [wallet.address as `0x${string}`],
      });

      return hasBet as boolean;
    } catch (err) {
      console.error('Error checking active bet:', err);
      return false;
    }
  }, [authenticated, user, isPoolEnabled]);

  const getBalance = useCallback(async (): Promise<string> => {
    if (!authenticated || !user) return '0';

    try {
      let wallet = user.wallet;
      if (!wallet) {
        console.log('No wallet available, user needs to create one');
        return '0';
      }

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

  // New pool-specific functions
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

  const previewPayout = useCallback(async (betAmount: string, goblinsTapped: number): Promise<string> => {
    try {
      const betAmountWei = parseEther(betAmount);
      
      if (isPoolEnabled) {
        // Use pool contract for accurate payout calculation
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

  const canClaimPayout = useCallback(async (goblinsTapped: number): Promise<boolean> => {
    if (!authenticated || !user) return false;

    try {
      const wallet = user.wallet;
      if (!wallet) return false;
      
      if (isPoolEnabled) {
        // Use pool system validation
        const canClaim = await publicClient.readContract({
          address: GOBLIN_TAP_ADDRESS as `0x${string}`,
          abi: GOBLIN_TAP_ABI,
          functionName: 'canClaimPayout',
          args: [wallet.address as `0x${string}`, goblinsTapped],
        });
        return canClaim as boolean;
      } else {
        // For legacy system, check if user has active bet
        return await hasActiveBet();
      }
    } catch (err) {
      console.error('Error checking if payout can be claimed:', err);
      return false;
    }
  }, [authenticated, user, isPoolEnabled, hasActiveBet]);

  return {
    placeBet,
    claimWinnings,
    getActiveBet,
    hasActiveBet,
    getBalance,
    refreshBalance,
    // New pool-specific functions
    getPoolStatus,
    previewPayout,
    canClaimPayout,
    // System info
    isPoolEnabled,
    isLoading,
    error,
    authenticated,
    user,
  };
} 