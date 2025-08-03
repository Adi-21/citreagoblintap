'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useBlockchain } from '@/hooks/useBlockchain';
import { formatEther } from 'viem';

export default function Header() {
  const { user, authenticated, logout } = usePrivy();
  const { getBalance, refreshBalance } = useBlockchain();
  const [balance, setBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Fetch balance when user is authenticated
  useEffect(() => {
    if (authenticated && user) {
      setIsLoadingBalance(true);
      getBalance()
        .then(setBalance)
        .catch(console.error)
        .finally(() => setIsLoadingBalance(false));
    }
  }, [authenticated, user, getBalance]);

  if (!authenticated) {
    return (
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">🎯 Goblin Tap</h1>
              <span className="text-sm bg-opacity-20 px-2 py-1 rounded text-black">
                Citrea Blockchain Game
              </span>
            </div>
            <div className="text-sm text-white text-opacity-80 ">
              Connect your wallet to start playing!
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Game title and status */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">🎯 Goblin Tap</h1>
            <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded text-black">
              Citrea Blockchain Game
            </span>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Connected</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 font-semibold text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 