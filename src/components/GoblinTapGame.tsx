'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBlockchain } from '@/hooks/useBlockchain';
import { usePrivy } from '@privy-io/react-auth';
import { PAYOUT_MULTIPLIERS } from '@/config/blockchain';

// --- GAME CONFIGURATION ---
const GAME_DURATION = 15; // seconds
const GOBLIN_POP_UP_SPEED = 800; // ms between new goblins
const GOBLIN_STAY_UP_TIME = 1500; // ms a goblin stays visible
const TARGET_SCORE = 10;
const GRID_SIZE = 9; // 3x3 grid

// --- HELPER HOOK for managing intervals ---
const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

// --- UI COMPONENTS ---

// New SVG Goblin Component for better visuals and states
const Goblin = ({ isHit }: { isHit: boolean }) => (
  <div className="relative w-24 h-24 select-none">
    {/* Goblin Body */}
    <div className={`absolute inset-0 bg-green-500 rounded-full border-4 border-green-700 transition-transform duration-100 ${isHit ? 'scale-90' : ''}`}></div>
    {/* Eyes */}
    <div className="absolute top-6 left-5 w-14 h-8 flex justify-between">
      <div className="w-6 h-8 bg-white rounded-full flex items-center justify-center">
        <div className={`w-3 h-4 bg-black rounded-full transition-all duration-100 ${isHit ? 'h-1 w-4' : ''}`}></div>
      </div>
      <div className="w-6 h-8 bg-white rounded-full flex items-center justify-center">
        <div className={`w-3 h-4 bg-black rounded-full transition-all duration-100 ${isHit ? 'h-1 w-4' : ''}`}></div>
      </div>
    </div>
     {/* Dizzy stars on hit */}
    {isHit && (
        <div className="absolute text-yellow-400 text-2xl font-black animate-ping">
            <div className="absolute -top-2 left-8">★</div>
            <div className="absolute top-2 -left-2">★</div>
        </div>
    )}
    {/* Mouth */}
    <div className={`absolute bottom-5 left-1/2 -translate-x-1/2 w-10 h-5 bg-green-800 rounded-b-full border-2 border-green-900 ${isHit ? 'h-2' : ''}`}></div>
  </div>
);

// New SVG Dirt Mound for better visuals
const DirtMound = () => (
    <div className="absolute bottom-10 w-40 h-20">
        <div className="absolute inset-x-0 bottom-0 h-12 bg-yellow-800 rounded-t-full border-4 border-yellow-900"></div>
        <div className="absolute inset-x-0 bottom-0 h-10 bg-yellow-900 opacity-20 rounded-t-full"></div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-24 h-12 bg-black rounded-full opacity-50"></div>
    </div>
);

// Betting Modal Component
const BettingModal = ({ isOpen, onClose, onBetPlaced }: { isOpen: boolean; onClose: () => void; onBetPlaced: (betAmount: string) => void; }) => {
  const [betAmount, setBetAmount] = useState('0.001');
  const [balance, setBalance] = useState('0');
  const [poolStatus, setPoolStatus] = useState<any>(null);
  const [previewPayouts, setPreviewPayouts] = useState({ win5: '0', win8: '0', win10: '0' });
  const { placeBet, getBalance, refreshBalance, isLoading, error, authenticated, isPoolEnabled, getPoolStatus, previewPayout } = useBlockchain();

  useEffect(() => {
    if (authenticated && isOpen) {
      getBalance().then(setBalance);
      
      // Load pool status if pool system is enabled
      if (isPoolEnabled && getPoolStatus) {
        getPoolStatus().then(setPoolStatus);
      }
      
      // Load preview payouts
      if (previewPayout && betAmount) {
        Promise.all([
          previewPayout(betAmount, 5),
          previewPayout(betAmount, 8),
          previewPayout(betAmount, 10)
        ]).then(([win5, win8, win10]) => {
          setPreviewPayouts({ win5, win8, win10 });
        });
      }
    }
  }, [authenticated, getBalance, isOpen, isPoolEnabled, getPoolStatus, previewPayout, betAmount]);

  const handlePlaceBet = async () => {
    console.log('🎯 Starting bet placement for', betAmount, 'cBTC');
    const success = await placeBet(betAmount);
    if (success) {
      console.log('✅ Bet placed successfully');
      // Refresh balance after successful bet placement
      const newBalance = await refreshBalance();
      setBalance(newBalance);
      console.log('💳 New balance after bet:', newBalance, 'cBTC');
      
      // Refresh pool status if available
      if (isPoolEnabled && getPoolStatus) {
        getPoolStatus().then(newPoolStatus => {
          setPoolStatus(newPoolStatus);
          console.log('🏦 Pool status refreshed after bet');
        }).catch(console.error);
      }
      
      onBetPlaced(betAmount);
      onClose();
    } else {
      console.log('❌ Bet placement failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">🎯 Place Your Bet</h2>
          <p className="text-gray-600 mb-4">Your cBTC balance: <span className="font-bold text-green-600">{parseFloat(balance).toFixed(4)}</span></p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bet Amount (cBTC)</label>
            <input 
              type="number" 
              step="0.001"
              min="0.001"
              value={betAmount} 
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg"
              placeholder="0.001"
            />
          </div>

          {/* Payout Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">💰 Payout Structure:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• 5-7 goblins: <span className="font-bold text-green-600">{PAYOUT_MULTIPLIERS[5]}x</span> payout 
                {previewPayouts.win5 !== '0' && <span className="text-xs text-gray-500"> ({previewPayouts.win5} cBTC)</span>}
              </div>
              <div>• 8-9 goblins: <span className="font-bold text-green-600">{PAYOUT_MULTIPLIERS[8]}x</span> payout
                {previewPayouts.win8 !== '0' && <span className="text-xs text-gray-500"> ({previewPayouts.win8} cBTC)</span>}
              </div>
              <div>• 10+ goblins: <span className="font-bold text-green-600">{PAYOUT_MULTIPLIERS[10]}x</span> payout
                {previewPayouts.win10 !== '0' && <span className="text-xs text-gray-500"> ({previewPayouts.win10} cBTC)</span>}
              </div>
              <div>• Less than 5: <span className="font-bold text-red-600">Loss</span></div>
            </div>
          </div>

          {/* Pool Status (if pool system is enabled) */}
          {isPoolEnabled && poolStatus && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-800 mb-2">🏦 Pool Status:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• Total Pool: <span className="font-bold text-blue-600">{parseFloat(poolStatus.totalPool).toFixed(4)} cBTC</span></div>
                <div>• Player Funds: <span className="font-bold text-green-600">{parseFloat(poolStatus.playerFunds).toFixed(4)} cBTC</span></div>
                <div>• House Reserve: <span className="font-bold text-purple-600">{parseFloat(poolStatus.houseReserve).toFixed(4)} cBTC</span></div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {isPoolEnabled ? '✅ Pool system active - Sustainable payouts' : '⚠️ Legacy system - Limited funds'}
              </div>
            </div>
          )}

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">{error}</div>}
          
          <div className="flex space-x-4">
            <button 
              onClick={onClose} 
              disabled={isLoading} 
              className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handlePlaceBet} 
              disabled={isLoading || !betAmount || parseFloat(betAmount) <= 0} 
              className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-semibold"
            >
              {isLoading ? '⏳ Placing Bet...' : '🎮 Place Bet & Play'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Results Modal Component
const ResultsModal = ({ isOpen, onClose, goblinsTapped, betAmount, onPlayAgain }: { isOpen: boolean; onClose: () => void; goblinsTapped: number; betAmount: string; onPlayAgain: () => void; }) => {
  const { claimWinnings, refreshBalance, isLoading, previewPayout, isPoolEnabled } = useBlockchain();
  const [winnings, setWinnings] = useState<number | null>(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [actualPayout, setActualPayout] = useState<string>('0');

  useEffect(() => {
    if (isOpen && !hasClaimed) {
      setHasClaimed(true);
      
      // Get preview payout first
      if (previewPayout) {
        previewPayout(betAmount, goblinsTapped).then(setActualPayout);
      }
      
      claimWinnings(goblinsTapped).then(async (success) => {
        if (success) {
          console.log('✅ Winnings claimed successfully');
          
          // Use actual payout if available, otherwise calculate locally
          if (actualPayout !== '0') {
            setWinnings(parseFloat(actualPayout));
          } else {
            // Fallback calculation
            const betAmountNum = parseFloat(betAmount);
            let multiplier = 0;
            if (goblinsTapped >= 10) multiplier = PAYOUT_MULTIPLIERS[10];
            else if (goblinsTapped >= 8) multiplier = PAYOUT_MULTIPLIERS[8];
            else if (goblinsTapped >= 5) multiplier = PAYOUT_MULTIPLIERS[5];
            else multiplier = PAYOUT_MULTIPLIERS[0];
            setWinnings(betAmountNum * multiplier);
          }
          
          // Refresh balance after claiming
          try {
            await refreshBalance();
            console.log('💳 Balance refreshed after claiming winnings');
          } catch (err) {
            console.error('Failed to refresh balance:', err);
          }
          
        } else {
          console.log('❌ Winnings claim failed');
          setWinnings(0); // Claim failed
        }
      });
    } else if (!isOpen) {
      setWinnings(null);
      setHasClaimed(false);
      setActualPayout('0');
    }
  }, [isOpen, goblinsTapped, betAmount, previewPayout, actualPayout, claimWinnings]);

  if (!isOpen) return null;

  const getResultText = () => {
    if (winnings === null) return "Calculating result...";
    if (winnings > 0) return `You Won ${winnings.toFixed(4)} cBTC!`;
    return `You Lost ${betAmount} cBTC. Try Again!`;
  };

  const getPerformanceText = () => {
    if (goblinsTapped >= 10) return "🎉 AMAZING! Perfect score!";
    if (goblinsTapped >= 8) return "🔥 Great job! Almost there!";
    if (goblinsTapped >= 5) return "👍 Good effort! Keep trying!";
    return "😅 Better luck next time!";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">🎯 Round Over!</h2>
        <p className="text-gray-600 mb-2">You tapped <span className="font-bold text-purple-600">{goblinsTapped}</span> goblin(s).</p>
        <p className="text-sm text-gray-500 mb-4">{getPerformanceText()}</p>
        
        <div className={`text-2xl font-bold mb-6 p-4 rounded-lg ${winnings !== null && winnings > 0 ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'}`}>
          {isLoading ? "⏳ Claiming..." : getResultText()}
        </div>

        {/* Bet Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm">
          <div className="flex justify-between mb-2">
            <span>Bet Amount:</span>
            <span className="font-bold">{betAmount} cBTC</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Goblins Tapped:</span>
            <span className="font-bold">{goblinsTapped}</span>
          </div>
          <div className="flex justify-between">
            <span>Payout Multiplier:</span>
            <span className="font-bold">
              {goblinsTapped >= 10 ? '2.0x' : 
               goblinsTapped >= 8 ? '1.5x' : 
               goblinsTapped >= 5 ? '1.2x' : '0x'}
            </span>
          </div>
        </div>

        <div className="flex space-x-4">
            <button onClick={onClose} className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors">Close</button>
            <button onClick={onPlayAgain} className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold">🎮 Play Again</button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN GAME COMPONENT ---
export default function GoblinTapGame() {
  const { authenticated } = usePrivy();
  const { getActiveBet } = useBlockchain();
  
  // --- STATE MANAGEMENT ---
  const [holes, setHoles] = useState(Array(GRID_SIZE).fill({ isUp: false, isHit: false }));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'loss' | null>(null);
  const [showBettingModal, setShowBettingModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [lastGameResult, setLastGameResult] = useState({ goblins: 0, bet: '0'});

  // --- GAME LOGIC ---

  const handleGoblinTap = (index: number) => {
    if (!isGameActive || !holes[index].isUp || holes[index].isHit) return;

    setScore(prev => prev + 1);
    setHoles(prev => {
      const newHoles = [...prev];
      newHoles[index] = { isUp: true, isHit: true };
      return newHoles;
    });

    // Hide the goblin after a short "hit" delay
    setTimeout(() => {
        setHoles(prev => {
            const newHoles = [...prev];
            newHoles[index] = { isUp: false, isHit: false };
            return newHoles;
        });
    }, 300);
  };

  useEffect(() => {
    if (score >= TARGET_SCORE && isGameActive) {
      endGame('win');
    }
  }, [score, isGameActive]);

  useInterval(() => {
    setTimeLeft(prev => prev - 1);
  }, isGameActive ? 1000 : null);

  useEffect(() => {
    if (timeLeft <= 0 && isGameActive) {
      endGame('loss');
    }
  }, [timeLeft, isGameActive]);

  useInterval(() => {
    const availableHoles = holes.map((h, i) => !h.isUp ? i : -1).filter(i => i !== -1);
    if (availableHoles.length === 0) return;

    const randomIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];

    setHoles(prev => {
      const newHoles = [...prev];
      newHoles[randomIndex] = { isUp: true, isHit: false };
      return newHoles;
    });

    setTimeout(() => {
      setHoles(prev => {
        const newHoles = [...prev];
        if (newHoles[randomIndex] && !newHoles[randomIndex].isHit) {
          newHoles[randomIndex] = { isUp: false, isHit: false };
        }
        return newHoles;
      });
    }, GOBLIN_STAY_UP_TIME);

  }, isGameActive ? GOBLIN_POP_UP_SPEED : null);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setHoles(Array(GRID_SIZE).fill({ isUp: false, isHit: false }));
    setGameResult(null);
    setIsGameActive(true);
  };

  const endGame = useCallback((result: 'win' | 'loss') => {
    setIsGameActive(false);
    setGameResult(result);
    setLastGameResult({ goblins: score, bet: '0.001' }); // Default bet amount
    setShowResultsModal(true);
  }, [score]);

  const handleBetPlaced = (betAmount: string) => {
    setShowBettingModal(false);
    startGame();
  };

  const handlePlayAgain = () => {
    setShowResultsModal(false);
    setShowBettingModal(true);
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap');
          .font-luckiest { font-family: 'Luckiest Guy', cursive; }
        `}
      </style>
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-400 to-green-400 p-4 font-luckiest">
        <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-2xl border-4 border-purple-300">
          {/* Game Header */}
          <div className="flex justify-between items-center mb-4 sm:mb-6 pb-4 border-b-4 border-purple-200">
            <div className="text-center">
              <div className="text-4xl text-black tracking-wider font-bold">{score}</div>
              <div className="text-sm text-black font-semibold">SCORE</div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl text-black drop-shadow-lg font-bold">GOBLIN TAP</h1>
              <p className="text-xs sm:text-sm text-black">Tap {TARGET_SCORE} goblins to win!</p>
            </div>
            <div className="text-center">
              <div className="text-4xl text-black tracking-wider font-bold">{timeLeft}</div>
              <div className="text-sm text-black font-semibold">TIME</div>
            </div>
          </div>

          {/* Game Grid */}
          <div className="relative grid grid-cols-3 gap-2 sm:gap-4 bg-gradient-to-b from-green-100 to-green-200 rounded-lg p-4" style={{ height: '450px' }}>
            {holes.map((hole, index) => (
              <div key={index} className="relative w-full h-full flex items-center justify-center" onClick={() => handleGoblinTap(index)}>
                <DirtMound />
                <div 
                  className={`absolute bottom-12 transition-all duration-300 cursor-pointer ${hole.isUp ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  <Goblin isHit={hole.isHit} />
                </div>
              </div>
            ))}

            {/* Game Overlay */}
            {!isGameActive && !showBettingModal && !showResultsModal && (
              <div className="absolute inset-0 bg-gradient-to-br from-white to-purple-50 rounded-lg flex flex-col items-center justify-center text-black text-center z-10 p-4 border-2 border-purple-200 shadow-xl">
                {gameResult === 'win' && (
                  <>
                    <div className="text-8xl mb-4">🎉</div>
                    <h2 className="text-5xl text-green-600 mb-4 drop-shadow-lg font-bold">YOU WIN!</h2>
                    <p className="text-xl mb-6 text-black font-semibold">You tapped {score} goblins!</p>
                  </>
                )}
                {gameResult === 'loss' && (
                  <>
                    <div className="text-8xl mb-4">😅</div>
                    <h2 className="text-5xl text-red-600 mb-4 drop-shadow-lg font-bold">TIME'S UP!</h2>
                    <p className="text-xl mb-6 text-black font-semibold">You only tapped {score} goblins.</p>
                  </>
                )}
                {!gameResult && (
                  <>
                    <div className="text-8xl mb-4">🎯</div>
                    <h2 className="text-4xl text-purple-600 mb-4 drop-shadow-lg font-bold">Ready to Play?</h2>
                    <p className="text-lg mb-6 text-black">Tap 10 goblins to win!</p>
                  </>
                )}
                <button
                  onClick={() => setShowBettingModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-4 rounded-lg text-2xl transition-all transform hover:scale-105 shadow-lg border-b-4 border-purple-800 active:border-b-0 font-bold"
                >
                  {gameResult ? 'Play Again' : 'Start Game'}
                </button>
                <p className="text-sm mt-4 text-black opacity-70 font-medium">
                  {gameResult ? "(This would claim your winnings)" : "(This would place your bet)"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BettingModal
        isOpen={showBettingModal}
        onClose={() => setShowBettingModal(false)}
        onBetPlaced={handleBetPlaced}
      />

      <ResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        goblinsTapped={lastGameResult.goblins}
        betAmount={lastGameResult.bet}
        onPlayAgain={handlePlayAgain}
      />
    </>
  );
} 