import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const ALCHEMY_API_KEY = z
  .string()
  .min(32)
  .max(64)
  .parse(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);

const selectChainName = (chainId: number) => {
  switch (chainId) {
    case 1:
      return 'ethereum';
    case 137:
      return 'polygon';
    case 10:
      return 'optimism';
    case 42161:
      return 'arbitrum';
    case 324:
      return 'zksync-era';
    default:
      throw new Error(`Unsupported chainId: ${chainId}`);
  }
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { address, chainId } = req.body;
  const chainName = selectChainName(chainId);
  const url = `https://${chainName}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

  const body = JSON.stringify({
    id: 1,
    jsonrpc: '2.0',
    method: 'alchemy_getTokenBalances',
    params: [address],
  });

  try {
    const alchemyRes = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body,
    });
    const data = await alchemyRes.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default handler;
