import { useCallback, useEffect, useState } from 'react';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { Loading, Toggle } from '@geist-ui/core';
import { tinyBig } from 'essential-eth';
import { useAtom } from 'jotai';
import { checkedTokensAtom } from '../../src/atoms/checked-tokens-atom';
import { globalTokensAtom } from '../../src/atoms/global-tokens-atom';
import { Alchemy, Network } from 'alchemy-sdk';

// Setup Alchemy instances for multiple networks
const alchemyInstances = {
  [Network.ETH_MAINNET]: new Alchemy({
    apiKey: "iUoZdhhu265uyKgw-V6FojhyO80OKfmV",
    network: Network.ETH_MAINNET,
  }),
  [Network.BSC_MAINNET]: new Alchemy({
    apiKey: "iUoZdhhu265uyKgw-V6FojhyO80OKfmV",
    network: Network.BSC_MAINNET,
  }),
  [Network.OPTIMISM]: new Alchemy({
    apiKey: "iUoZdhhu265uyKgw-V6FojhyO80OKfmV",
    network: Network.OPTIMISM,
  }),
  [Network.ZK_SYNC]: new Alchemy({
    apiKey: "iUoZdhhu265uyKgw-V6FojhyO80OKfmV",
    network: Network.ZK_SYNC,
  }),
  [Network.ARB_MAINNET]: new Alchemy({
    apiKey: "iUoZdhhu265uyKgw-V6FojhyO80OKfmV",
    network: Network.ARB_MAINNET,
  }),
  [Network.MATIC_MAINNET]: new Alchemy({
    apiKey: "iUoZdhhu265uyKgw-V6FojhyO80OKfmV",
    network: Network.MATIC_MAINNET,
  }),
  // Add other networks as needed
};

// Mapping from chain IDs to Alchemy SDK network enums
const chainIdToNetworkMap = {
  1: Network.ETH_MAINNET,      // Ethereum Mainnet
  56: Network.BSC_MAINNET,     // BSC Mainnet
  10: Network.OPTIMISM,        // Optimism Mainnet
  324: Network.ZK_SYNC,        // zkSync Mainnet
  42161: Network.ARB_MAINNET,  // Arbitrum Mainnet
  137: Network.MATIC_MAINNET,  // Polygon Mainnet
  // Add other mappings as needed
};

const supportedChains = [1, 56, 10, 324, 42161, 137]; // Add your supported chain IDs here

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const TokenRow: React.FunctionComponent<{ token: any }> = ({ token }) => {
  const [checkedRecords, setCheckedRecords] = useAtom(checkedTokensAtom);
  const { chain } = useAccount();
  const pendingTxn = checkedRecords[token.contract_address]?.pendingTxn;
  const setTokenChecked = (tokenAddress: string, isChecked: boolean) => {
    setCheckedRecords((old) => ({
      ...old,
      [tokenAddress]: { isChecked: isChecked },
    }));
  };
  const { address } = useAccount();
  const { balance, contract_address, contract_ticker_symbol } = token;
  const unroundedBalance = tinyBig(token.quote).div(token.quote_rate);
  const roundedBalance = unroundedBalance.lt(0.001)
    ? unroundedBalance.round(10)
    : unroundedBalance.gt(1000)
    ? unroundedBalance.round(2)
    : unroundedBalance.round(5);

  const { isLoading } = useWaitForTransactionReceipt({
    hash: pendingTxn?.blockHash || undefined,
  });

  return (
    <div key={contract_address}>
      {isLoading && <Loading />}
      <Toggle
        checked={checkedRecords[contract_address]?.isChecked}
        onChange={(e) => {
          setTokenChecked(contract_address, e.target.checked);
        }}
        style={{ marginRight: '18px' }}
        disabled={Boolean(pendingTxn)}
      />
      <span style={{ fontFamily: 'monospace' }}>
        {roundedBalance.toString()}{' '}
      </span>
      <a
        href={`${chain?.blockExplorers?.default.url}/token/${token.contract_address}?a=${address}`}
        target="_blank"
        rel="noreferrer"
      >
        {contract_ticker_symbol}
      </a>{' '}
      (worth{' '}
      <span style={{ fontFamily: 'monospace' }}>
        {usdFormatter.format(token.quote)}
      </span>
      )
    </div>
  );
};

export const GetTokens = () => {
  const [tokens, setTokens] = useAtom(globalTokensAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkedRecords, setCheckedRecords] = useAtom(checkedTokensAtom);

  const { address, isConnected, chain } = useAccount();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      if (!chain || !supportedChains.includes(chain.id)) {
        throw new Error(
          `Chain ${chain?.name || 'unknown'} not supported. Supported chains: ${supportedChains.join(
            ', '
          )}.`
        );
      }

      // Map chain ID to the correct Alchemy network key
      const alchemyNetwork = chainIdToNetworkMap[chain.id];
      if (!alchemyNetwork) {
        throw new Error(`Alchemy network not configured for chain ID ${chain.id}`);
      }

      // Get the appropriate Alchemy instance for the current network
      const alchemy = alchemyInstances[alchemyNetwork];
      if (!alchemy) {
        throw new Error(`Alchemy instance not found for network: ${alchemyNetwork}`);
      }

      // Fetch ERC20 token balances
      const tokensResponse = await alchemy.core.getTokenBalances(address as string, [
        /* List your token contracts here */
      ]);

      // Fetch native token balance
      const nativeBalanceResponse = await alchemy.core.getBalance(address as string, 'latest');

      // Process token balances
      const processedTokens = tokensResponse.tokenBalances.map((balance) => ({
        contract_address: balance.contractAddress,
        balance: balance.tokenBalance,
        // Add additional processing as needed
      }));

      setTokens(processedTokens);
    } catch (error) {
      setError((error as Error).message);
    }
    setLoading(false);
  }, [address, chain, setTokens]);

  useEffect(() => {
    if (address && chain?.id) {
      fetchData();
      setCheckedRecords({});
    }
  }, [address, chain?.id, fetchData, setCheckedRecords]);

  useEffect(() => {
    if (!isConnected) {
      setTokens([]);
      setCheckedRecords({});
    }
  }, [isConnected, setTokens, setCheckedRecords]);

  if (loading) {
    return <Loading>Loading</Loading>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ margin: '20px' }}>
      {isConnected && tokens?.length === 0 && `No tokens on ${chain?.name}`}
      {tokens.map((token) => (
        <TokenRow token={token} key={token.contract_address} />
      ))}
    </div>
  );
};
