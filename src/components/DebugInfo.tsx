'use client';

import { usePrivy } from '@privy-io/react-auth';

export default function DebugInfo() {
  const { user, authenticated, ready } = usePrivy();

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border text-black text-xs max-w-sm">
      <h4 className="font-bold mb-2">Debug Info</h4>
      <div className="space-y-1">
        <div>Ready: {ready ? '✅' : '❌'}</div>
        <div>Authenticated: {authenticated ? '✅' : '❌'}</div>
        <div>User: {user ? '✅' : '❌'}</div>
        <div>Wallet: {user?.wallet ? '✅' : '❌'}</div>
        {user?.wallet && (
          <div className="break-all">
            Address: {user.wallet.address}
          </div>
        )}
        {user && (
          <div className="break-all">
            User ID: {user.id}
          </div>
        )}
      </div>
    </div>
  );
} 