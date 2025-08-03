'use client';

import React, { useState, useEffect } from 'react';
import { useBlockchain } from '@/hooks/useBlockchain';
import { BETTING_POOL_ADDRESS, GOBLIN_TAP_ADDRESS } from '@/config/blockchain';

interface PoolStatus {
  totalPool: string;
  houseReserve: string;
  playerFunds: string;
  contractBalance: string;
}

export default function PoolStatus() {
  const { isPoolEnabled, getPoolStatus } = useBlockchain();
  const [poolStatus, setPoolStatus] = useState<PoolStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    // Add debug info about addresses
    setDebugInfo(`Pool: ${BETTING_POOL_ADDRESS}, Game: ${GOBLIN_TAP_ADDRESS}`);
    
    if (isPoolEnabled && getPoolStatus) {
      setIsLoading(true);
      getPoolStatus()
        .then(setPoolStatus)
        .catch((error) => {
          console.error('Pool status error:', error);
          setDebugInfo(prev => `${prev} | Error: ${error.message}`);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isPoolEnabled, getPoolStatus]);

  if (!isPoolEnabled) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-600">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-800">Legacy Mode</h3>
            <p className="text-sm text-yellow-700">Using legacy contract. Limited funding available.</p>
            <p className="text-xs text-yellow-600 mt-1">Pool address: {BETTING_POOL_ADDRESS}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-600">Loading pool status...</span>
        </div>
        <p className="text-xs text-blue-600 mt-1">{debugInfo}</p>
      </div>
    );
  }

  // Show error state if pool is enabled but no status
  if (!poolStatus && isPoolEnabled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-red-600">❌</span>
          <div>
            <h3 className="font-semibold text-red-800">Pool Contract Error</h3>
            <p className="text-sm text-red-700">Failed to connect to betting pool contract.</p>
            <p className="text-xs text-red-600 mt-1">{debugInfo}</p>
            <div className="mt-2 text-xs text-red-600">
              <p><strong>Possible issues:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Wrong contract address in NEXT_PUBLIC_BETTING_POOL_ADDRESS</li>
                <li>Contract not deployed at {BETTING_POOL_ADDRESS}</li>
                <li>Contract deployed but different ABI</li>
                <li>Network connection issues</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!poolStatus) {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-green-800 flex items-center space-x-2">
            <span>🏦</span>
            <span>Pool System Active</span>
          </h3>
          <p className="text-sm text-green-700">Sustainable betting with 5% house edge</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">
            {parseFloat(poolStatus.totalPool).toFixed(4)} cBTC
          </div>
          <div className="text-xs text-green-600">Total Pool</div>
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-green-600">Player Funds:</span>
          <span className="font-semibold ml-1">{parseFloat(poolStatus.playerFunds).toFixed(4)} cBTC</span>
        </div>
        <div>
          <span className="text-green-600">House Reserve:</span>
          <span className="font-semibold ml-1">{parseFloat(poolStatus.houseReserve).toFixed(4)} cBTC</span>
        </div>
      </div>
      
      {/* Debug info in success state */}
      <div className="mt-2 text-xs text-green-600 opacity-60">
        Pool: {BETTING_POOL_ADDRESS.slice(0, 10)}...
      </div>
    </div>
  );
} 