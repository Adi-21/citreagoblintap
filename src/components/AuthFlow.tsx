'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';

export default function AuthFlow() {
    const { user, authenticated, ready, login, createWallet, linkWallet } = usePrivy();
    const [isCreating, setIsCreating] = useState(false);

    // Wait for Privy to initialize
    if (!ready) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-800">Loading Citrea Goblin Tap...</h2>
                        <p className="text-gray-600 mt-2">Initializing blockchain connection...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Step 1: User is not authenticated - Show login
    if (!authenticated) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🎯</div>
                        <h2 className="text-3xl font-bold mb-4 text-gray-800">Welcome to Citrea Goblin Tap!</h2>
                        <p className="text-gray-600 mb-6">
                            A skill-based blockchain game on Citrea testnet.
                            Bet cBTC and use your skills to defeat goblins and earn rewards!
                        </p>

                        <button
                            onClick={login}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-lg shadow-lg"
                        >
                            🚀 Start Playing - Login / Sign Up
                        </button>

                        <p className="text-sm text-gray-500 mt-4">
                            Login with email or social account to get started
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: User is authenticated but has no wallet - Show wallet setup
    if (!user?.wallet && !user?.smartWallet) {
        const createEmbeddedWallet = async () => {
            setIsCreating(true);
            try {
                console.log('Creating embedded wallet for Citrea...');
                await createWallet();
                console.log('✅ Citrea wallet created successfully');
            } catch (error) {
                console.error('❌ Failed to create wallet:', error);
                alert('Failed to create wallet. Please try again.');
            } finally {
                setIsCreating(false);
            }
        };

        const connectExternalWallet = async () => {
            try {
                console.log('Connecting external wallet to Citrea...');
                await linkWallet();
                console.log('✅ External wallet connected to Citrea');
            } catch (error) {
                console.error('❌ Failed to connect wallet:', error);
                alert('Failed to connect wallet. Please try again.');
            }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
                    <div className="text-center">
                        <div className="text-6xl mb-4">👛</div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Setup Your Citrea Wallet</h2>
                        <p className="text-gray-600 mb-6">
                            You need a wallet to play on Citrea testnet and handle cBTC transactions.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={createEmbeddedWallet}
                                disabled={isCreating}
                                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-semibold"
                            >
                                {isCreating ? '⏳ Creating Wallet...' : '🔐 Create Embedded Wallet (Recommended)'}
                            </button>

                            <button
                                onClick={connectExternalWallet}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                            >
                                🦊 Connect External Wallet (MetaMask, etc.)
                            </button>
                        </div>

                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-2">🌟 Why Embedded Wallets?</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• No seed phrases to remember</li>
                                <li>• Automatic Citrea testnet setup</li>
                                <li>• Seamless gaming experience</li>
                                <li>• Secure and user-friendly</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 3: User is fully set up - No modal needed
    return null;
} 