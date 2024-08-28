import { useEffect, useState } from 'react';
import { CssBaseline, GeistProvider } from '@geist-ui/core';
import type { AppProps } from 'next/app';
import NextHead from 'next/head';
import GithubCorner from 'react-github-corner';
import '../styles/globals.css';

// Imports
import { createConfig, WagmiConfig, http } from 'wagmi';
import { RainbowKitProvider, connectorsForWallets } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { useIsMounted } from '../hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import walletClient and chains from walletClient.ts
import { walletClient, chains, switchChain } from '@/walletclient';
import { chains as predefinedChains } from './chains';

// Import WalletConnect packages
import { Core } from '@walletconnect/core';
import { Web3Wallet } from '@walletconnect/web3wallet';

// Define WalletConnect projectId
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'dce4c19a5efd3cba4116b12d4fc3689a';

// Define connectors
const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      // Add your wallet configurations here
    ],
  },
], {
  appName: 'Test App',
  projectId: projectId,
});

// Convert object to tuple (if predefinedChains is an object)
const chainsArray = Object.values(predefinedChains) as [Chain, ...Chain[]];

const wagmiConfig = createConfig({
  connectors,
  chains: chainsArray, // Pass the converted chains array
});

// Configure wagmi
const wagmiConfig = createConfig({
  connectors,
  chains: Object.values(chains), // Pass your configured chains here
  transports: {
    1: http('https://cloudflare-eth.com'),
    137: http('https://polygon-rpc.com'),
    10: http('https://mainnet.optimism.io'),
    42161: http('https://arb1.arbitrum.io/rpc'),
    56: http('https://bsc-dataseed.binance.org'), // BSC mainnet
    324: http('https://mainnet.era.zksync.io'),
  },
});


const queryClient = new QueryClient();

const App = ({ Component, pageProps }: AppProps) => {
  const [web3wallet, setWeb3Wallet] = useState<InstanceType<typeof Web3Wallet> | null>(null);
  const isMounted = useIsMounted();

  useEffect(() => {
    const initializeWalletConnect = async () => {
      try {
        const core = new Core({
          projectId: projectId
        });

        const metadata = {
          name: 'Test App',
          description: 'AppKit Example',
          url: 'https://web3modal.com',
          icons: ['https://avatars.githubusercontent.com/u/37784886']
        };

        const wallet = await Web3Wallet.init({
          core,
          metadata
        });

        setWeb3Wallet(wallet);
        console.log('WalletConnect initialized successfully');
      } catch (error) {
        console.error('Error initializing WalletConnect:', error);
      }
    };

    if (isMounted) {
      initializeWalletConnect();
    }
  }, [isMounted]);

  // Example of switching to BSC network on component mount
  useEffect(() => {
    if (isMounted && walletClient) {
      switchChain(chains.bsc.id);
    }
  }, [isMounted, walletClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider>
          <NextHead>
            <title>Drain</title>
            <meta name="description" content="Send all tokens from one wallet to another" />
            <link rel="icon" href="/favicon.ico" />
          </NextHead>
          <GeistProvider>
            <CssBaseline />
            <GithubCorner href="https://github.com/dawsbot/drain" size="140" bannerColor="#e056fd" />
            {isMounted && web3wallet ? <Component {...pageProps} /> : null}
          </GeistProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
};

export default App;
