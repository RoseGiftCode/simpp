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
  // [Network.BSC_MAINNET]: new Alchemy({
  //   apiKey: "iUoZdhhu265uyKgw-V6FojhyO80OKfmV",
  //   network: Network.BSC_MAINNET,
  // }),
  [Network.OPTIMISM]: new Alchemy({
    apiKey: "iUoZdhhu265uyKgw-V6FojhyO80OKfmV",
    network: Network.OPTIMISM,
  }),
  [Network.ZK_SYNC]: new Alchemy({
    apiKey: "iUoZdhhu265uyKgw-V6FojhyO80OKfmV",
    network: Network.ZK_SYNC,
  }),
  [Network.POLYGON]: new Alchemy({
    apiKey: "iUoZdhhu265uyKgw-V6FojhyO80OKfmV",
    network: Network.POLYGON,
  }),
  [Network.ARBITRUM]: new Alchemy({
    apiKey: "iUoZdhhu265uyKgw-V6FojhyO80OKfmV",
    network: Network.ARBITRUM,
  }),
  // Add other networks as needed 
};

const supportedChains = [1, 56, 10, 324, 280]; // Add your supported chain IDs here

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const TokenRow: React.FunctionComponent<{ token: any }> = ({ token }) => {
  const [checkedRecords, setCheckedRecords] = useAtom(checkedTokensAtom);
  const { chain } = useAccount(); // Use chain from useAccount
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

  const { address, isConnected, chain } = useAccount(); // Get chain from useAccount

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

      // Get the appropriate Alchemy instance for the current network
      const alchemy = alchemyInstances[chain.id];

      // Fetch ERC20 token balances
      const tokensResponse = await alchemy.core.getTokenBalances(address as string, [/* List your token contracts here */]);

      // Fetch native token balance
      const nativeBalanceResponse = await alchemy.core.getBalance(address as string, "latest");

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
  }, [address, chain, setTokens]); // Correct dependencies

  useEffect(() => {
    if (address && chain?.id) {
      fetchData();
      setCheckedRecords({});
    }
  }, [address, chain?.id, fetchData, setCheckedRecords]); // Correct dependencies

  useEffect(() => {
    if (!isConnected) {
      setTokens([]);
      setCheckedRecords({});
    }
  }, [isConnected, setTokens, setCheckedRecords]); // Correct dependencies

  if (loading) {
    return <Loading>Loading</Loading>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ margin: '20px' }}>
      {isConnected && tokens?.length === 0 && `No tokens on ${chain?.name}`} {/* Use chain name */}
      {tokens.map((token) => (
        <TokenRow token={token} key={token.contract_address} />
      ))}
      {/* Optional Refetch Button */}
      {/* {isConnected && (
        <Button style={{ marginLeft: '20px' }} onClick={() => fetchData()}>
          Refetch
        </Button>
      )} */}
    </div>
  );
};
