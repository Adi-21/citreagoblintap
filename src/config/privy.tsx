'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export function PrivyCitreaWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmduf64el00u3jp0b6wp5a0x6'}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#8B5CF6',
          showWalletLoginFirst: false,
        },
        // Configure wallets for Citrea compatibility
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
        // Citrea testnet as the primary chain
        defaultChain: {
          id: 5115,
          name: 'Citrea Testnet',
          network: 'citrea-testnet',
          nativeCurrency: {
            decimals: 18,
            name: 'cBTC',
            symbol: 'cBTC',
          },
          rpcUrls: {
            default: {
              http: ['https://rpc.testnet.citrea.xyz'],
            },
            public: {
              http: ['https://rpc.testnet.citrea.xyz'],
            },
          },
          blockExplorers: {
            default: { name: 'Citrea Explorer', url: 'https://explorer.testnet.citrea.xyz' },
          },
        },
        supportedChains: [{
          id: 5115,
          name: 'Citrea Testnet',
          network: 'citrea-testnet',
          nativeCurrency: {
            decimals: 18,
            name: 'cBTC',
            symbol: 'cBTC',
          },
          rpcUrls: {
            default: {
              http: ['https://rpc.testnet.citrea.xyz'],
            },
            public: {
              http: ['https://rpc.testnet.citrea.xyz'],
            },
          },
          blockExplorers: {
            default: { name: 'Citrea Explorer', url: 'https://explorer.testnet.citrea.xyz' },
          },
        }],
      }}
    >
      {children}
    </PrivyProvider>
  );
} 