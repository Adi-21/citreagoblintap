'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';

export default function WalletSetup() {
  const { user, authenticated, createWallet, linkWallet } = usePrivy();
  const [isCreating, setIsCreating] = useState(false);

  const createEmbeddedWallet = async () => {
    if (!user) return;
    
    setIsCreating(true);
    try {
      console.log('Creating embedded wallet...');
      await createWallet();
      console.log('Embedded wallet created successfully');
    } catch (error) {
      console.error('Failed to create embedded wallet:', error);
      alert('Failed to create wallet. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const connectExternalWallet = async () => {
    if (!user) return;
    
    try {
      console.log('Linking external wallet...');
      await linkWallet();
      console.log('External wallet linked successfully');
    } catch (error) {
      console.error('Failed to link external wallet:', error);
      alert('Failed to link wallet. Please try again.');
    }
  };

  if (!authenticated) {
    return null;
  }

  // Show setup if user is authenticated but has no wallet
  if (user?.wallet || user?.smartWallet) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl text-black">
        <h2 className="text-2xl font-bold mb-4 text-center">Setup Your Wallet</h2>
        <p className="text-center mb-6">
          You need to create or connect a wallet to play Citrea Slingers.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={createEmbeddedWallet}
            disabled={isCreating}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Embedded Wallet (Recommended)'}
          </button>
          
          <button
            onClick={connectExternalWallet}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect External Wallet
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mt-4 text-center">
          Embedded wallets are created automatically and don&apos;t require seed phrases.
        </p>
      </div>
    </div>
  );
} 