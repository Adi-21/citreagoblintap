'use client';

import { usePrivy } from '@privy-io/react-auth';

export default function PrivyDebugLogin() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  console.log('Privy Debug Status:', { ready, authenticated, user: !!user });

  if (!ready) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
        <p className="text-yellow-800">🔄 Privy is loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="p-4 bg-blue-100 border border-blue-300 rounded">
        <p className="text-blue-800 mb-4">🔐 Please login to continue</p>
        <button
          onClick={login}
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition-colors"
        >
          Login with Privy
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-100 border border-green-300 rounded">
      <p className="text-green-800 mb-2">✅ Logged in successfully!</p>
      <p className="text-sm text-gray-600 mb-4">
        Email: {user?.email?.address}<br/>
        Wallet: {user?.wallet?.address}
      </p>
      <button
        onClick={logout}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
      >
        Logout
      </button>
    </div>
  );
} 