'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export function PrivyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cltxxxxxxxxxxxxxxxxxxxxxxxxxx'}
      config={{
        loginMethods: ['email', 'google'],
        appearance: {
          theme: 'light',
          accentColor: '#8B5CF6',
          showWalletLoginFirst: false,
        },
        // Citrea chain config for blockchain transactions
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
        }, {
          id: 1,
          name: 'Ethereum',
          network: 'ethereum',
          nativeCurrency: {
            decimals: 18,
            name: 'Ether',
            symbol: 'ETH',
          },
          rpcUrls: {
            default: {
              http: ['https://ethereum.publicnode.com'],
            },
            public: {
              http: ['https://ethereum.publicnode.com'],
            },
          },
        }],
      }}
    >
      {children}
    </PrivyProvider>
  );
} 