// global.d.ts
interface Window {
  ethereum?: any;
}

// walletClient.ts
import { createWalletClient, custom } from 'viem';
import { mainnet, bsc, polygon, optimism, arbitrum, zkSync } from 'viem/chains';

// Define your chains
export const chains = {
  mainnet,
  bsc,
  polygon,
  optimism,
  arbitrum,
  zkSync,
};

// Create the wallet client
export const walletClient = createWalletClient({
  chain: mainnet, // Default chain can be set to any of your supported chains
  transport: custom(window.ethereum!), // Ensure window.ethereum is recognized
});

// Function to switch chains
export const switchChain = async (chainId: number) => {
  try {
    await walletClient.switchChain({ id: chainId });
    console.log(`Successfully switched to chain ID: ${chainId}`);
  } catch (error) {
    console.error(`Failed to switch to chain ID: ${chainId}`, error);
  }
};
