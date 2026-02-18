import { NextResponse } from 'next/server';

const DEFAULT_OFFSET = 100;

const ETHERSCAN_V2_API = 'https://api.etherscan.io/v2/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const chainId = Number(searchParams.get('chainId') || '11155111');
  const page = Number(searchParams.get('page') || '1');
  const offset = Number(searchParams.get('offset') || String(DEFAULT_OFFSET));
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const hasApiKey = Boolean(apiKey);

  console.info('Etherscan API request', {
    address,
    chainId,
    hasApiKey,
  });

  if (!address) {
    return NextResponse.json({ error: 'Missing address' }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing ETHERSCAN_API_KEY', transactions: [], meta: { chainId, hasApiKey } },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    chainid: String(chainId),
    module: 'account',
    action: 'txlist',
    address,
    startblock: '0',
    endblock: '99999999',
    page: String(page),
    offset: String(offset),
    sort: 'desc',
    apikey: apiKey,
  });

  const response = await fetch(`${ETHERSCAN_V2_API}?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.json({
      error: `Etherscan error: HTTP ${response.status}`,
      transactions: [],
      source: 'etherscan',
      meta: { chainId, hasApiKey },
    });
  }

  const data = await response.json();

  if (data.status !== '1' && data.message !== 'No transactions found') {
    return NextResponse.json({
      error: data.result || data.message || 'Etherscan API error',
      transactions: [],
      source: 'etherscan',
      meta: { chainId, hasApiKey },
    });
  }

  const result = Array.isArray(data.result) ? data.result : [];

  const transactions = result.map((tx: any) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    assetAddress: tx.to,
    amount: tx.value || '0',
    timestamp: Number(tx.timeStamp || '0'),
    status: tx.isError === '1' ? 'FAILED' : 'SUCCESS',
    type:
      tx.from?.toLowerCase() === address.toLowerCase() ? 'SELL' : 'BUY',
  }));

  return NextResponse.json({
    transactions,
    page,
    offset,
    source: 'etherscan',
    meta: { chainId, hasApiKey },
  });
}
