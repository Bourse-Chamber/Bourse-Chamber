import { CaEvidence } from '../types';

/**
 * Extracts a Contract Address (EVM 0x... full or abbreviated, or Solana base58) from a user query string.
 * Priority: Full EVM -> Full Solana -> Abbreviated EVM (e.g. 0x90456f...f515)
 */
export function extractContractAddress(query: string): string | null {
  if (!query || typeof query !== 'string') return null;

  // 1. Full EVM address priority: 0x followed by exactly 40 hex characters
  const evmFullMatch = query.match(/0x[a-fA-F0-9]{40}/);
  if (evmFullMatch) return evmFullMatch[0];

  // 2. Full Solana base58 token mint: 32-44 base58 characters bounded by word or space
  const solMatch = query.match(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/);
  if (solMatch) {
    const candidate = solMatch[0];
    if (candidate.length >= 32 && !/^(https?|tokenomics|contract|address|cryptocurrency|blockchain|decentralized)/i.test(candidate)) {
      return candidate;
    }
  }

  // 3. Abbreviated EVM address with ellipsis: e.g. 0x90456f...f515 or 0x90456f…f515
  const evmAbbrMatch = query.match(/0x[a-fA-F0-9]{3,20}(?:\.\.\.|…)[a-fA-F0-9]{3,20}/);
  if (evmAbbrMatch) return evmAbbrMatch[0];

  return null;
}

/**
 * Extracts a target market cap value and formatted representation from query.
 * Examples: "$100K" -> 100000, "$1M" -> 1000000, "$500,000" -> 500000, "$50M" -> 50000000
 */
export function extractTargetMarketCap(query: string): { targetMcap: number | null; targetMcapFormatted: string } {
  if (!query || typeof query !== 'string') {
    return { targetMcap: null, targetMcapFormatted: 'DATA UNAVAILABLE' };
  }

  // Match "$100K", "$100,000", "$1.5M", "$500k", "100k market cap", etc.
  const regex = /(?:\$\s*|usd\s*|\b)(\d+(?:[\d,.]*\d)?)\s*(k|m|b|thousand|million|billion)?\s*(?:market\s*cap|mc)?\b/gi;
  let match;
  while ((match = regex.exec(query)) !== null) {
    const rawNumStr = match[1].replace(/,/g, '');
    const num = parseFloat(rawNumStr);
    const unit = (match[2] || '').toLowerCase();

    if (!isNaN(num) && num > 0) {
      let multiplier = 1;
      if (unit === 'k' || unit === 'thousand') multiplier = 1e3;
      else if (unit === 'm' || unit === 'million') multiplier = 1e6;
      else if (unit === 'b' || unit === 'billion') multiplier = 1e9;
      else if (num < 1000 && !unit && /reach|target|hit/i.test(query)) {
        continue;
      }

      const total = num * multiplier;
      // Sanity check: market cap targets are typically >= $1,000
      if (total >= 1000) {
        let formatted = `$${total.toLocaleString('en-US')}`;
        if (unit === 'k' || unit === 'thousand' || (total >= 1e3 && total < 1e6 && total % 1e3 === 0)) {
          formatted = `$${total / 1e3}K`;
        } else if (unit === 'm' || unit === 'million' || (total >= 1e6 && total < 1e9 && total % 1e6 === 0)) {
          formatted = `$${total / 1e6}M`;
        } else if (unit === 'b' || unit === 'billion' || (total >= 1e9 && total % 1e9 === 0)) {
          formatted = `$${total / 1e9}B`;
        }
        return {
          targetMcap: total,
          targetMcapFormatted: formatted
        };
      }
    }
  }

  return { targetMcap: null, targetMcapFormatted: 'DATA UNAVAILABLE' };
}

/**
 * Formats blockchain network name cleanly.
 */
export function formatNetworkName(chainId: string | undefined): string {
  if (!chainId) return 'NETWORK UNKNOWN';
  const lower = chainId.toLowerCase();
  if (lower === 'ethereum' || lower === 'eth' || lower === '1') return 'Ethereum';
  if (lower === 'base' || lower === '8453') return 'Base';
  if (lower === 'bsc' || lower === 'binance' || lower === '56') return 'BSC';
  if (lower === 'arbitrum' || lower === '42161') return 'Arbitrum';
  if (lower === 'solana') return 'Solana';
  if (lower === 'polygon' || lower === '137') return 'Polygon';
  if (lower === 'avalanche' || lower === 'avax' || lower === '43114') return 'Avalanche';
  if (lower === 'optimism' || lower === '10') return 'Optimism';
  if (lower === 'robinhood' || lower.includes('robinhood') || lower === 'arbitrum_orbit') return 'Robinhood';
  return chainId.charAt(0).toUpperCase() + chainId.slice(1);
}

/**
 * Calculates buy/sell ratio cleanly.
 */
export function calculateBuySellRatio(buys: number | null | undefined, sells: number | null | undefined): string {
  if (typeof buys === 'number' && typeof sells === 'number' && sells > 0) {
    return (buys / sells).toFixed(2);
  }
  return 'DATA UNAVAILABLE';
}

function createUnavailableEvidence(contractAddress: string, targetMcap: number | null, targetMcapFormatted: string): CaEvidence {
  const retrievalDate = new Date().toISOString().split('T')[0];
  const retrievedAt = new Date().toISOString();

  return {
    contractAddress: contractAddress || 'UNKNOWN',
    name: 'DATA UNAVAILABLE',
    symbol: 'DATA UNAVAILABLE',
    network: 'NETWORK UNKNOWN',
    chainId: 'DATA UNAVAILABLE',
    pairDex: 'DATA UNAVAILABLE',
    pairAddress: 'DATA UNAVAILABLE',
    tradingPair: 'DATA UNAVAILABLE',
    price: 'DATA UNAVAILABLE',
    priceFormatted: 'DATA UNAVAILABLE',
    marketCap: 'DATA UNAVAILABLE',
    marketCapFormatted: 'DATA UNAVAILABLE',
    targetMarketCap: targetMcap,
    targetMarketCapFormatted: targetMcapFormatted,
    requiredMultiple: null,
    requiredMultipleFormatted: 'DATA UNAVAILABLE',
    fdv: 'DATA UNAVAILABLE',
    fdvFormatted: 'DATA UNAVAILABLE',
    liquidityUsd: 'DATA UNAVAILABLE',
    liquidityFormatted: 'DATA UNAVAILABLE',
    volume24h: 'DATA UNAVAILABLE',
    volume24hFormatted: 'DATA UNAVAILABLE',
    change24h: 'DATA UNAVAILABLE',
    txns24h: { buys: 'DATA UNAVAILABLE', sells: 'DATA UNAVAILABLE' },
    buySellRatio: 'DATA UNAVAILABLE',
    tokenAge: 'DATA UNAVAILABLE',
    holders: 'DATA UNAVAILABLE',
    holderConcentration: 'DATA UNAVAILABLE',
    contractVerification: 'DATA UNAVAILABLE',
    liquidityLock: 'DATA UNAVAILABLE',
    contractRisks: 'DATA UNAVAILABLE',
    isAvailable: false,
    source: 'DexScreener Live DEX API Feed',
    retrievalDate,
    retrievedAt
  };
}

/**
 * Fetches real on-chain DEX evidence for a token contract address using DexScreener API.
 * Never hardcodes market values. If unavailable, returns explicit DATA UNAVAILABLE.
 */
export async function fetchCaEvidence(addressOrQuery: string): Promise<CaEvidence> {
  const contractAddress = extractContractAddress(addressOrQuery) || addressOrQuery.trim();
  const { targetMcap, targetMcapFormatted } = extractTargetMarketCap(addressOrQuery);

  const defaultUnavailable = createUnavailableEvidence(contractAddress, targetMcap, targetMcapFormatted);

  if (!contractAddress || (!contractAddress.startsWith('0x') && contractAddress.length < 32)) {
    return defaultUnavailable;
  }

  const isAbbreviated = contractAddress.includes('...') || contractAddress.includes('…');
  let resolvedAddress = contractAddress;
  let pair: any = null;

  // 1. Strict Abbreviated Address Disambiguation
  if (isAbbreviated) {
    const parts = contractAddress.split(/\.\.\.|…/);
    const prefix = parts[0]?.trim().toLowerCase();
    const suffix = parts[1]?.trim().toLowerCase();

    try {
      const searchRes = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${prefix}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4500)
      });

      if (!searchRes.ok) {
        defaultUnavailable.name = 'CA NOT FOUND';
        defaultUnavailable.isNotFound = true;
        return defaultUnavailable;
      }

      const searchData = await searchRes.json();
      const pairs = Array.isArray(searchData.pairs) ? searchData.pairs : [];

      // Match prefix AND suffix
      const matchingPairs = pairs.filter((p: any) => {
        const addr = p.baseToken?.address?.toLowerCase();
        if (!addr) return false;
        return addr.startsWith(prefix) && (!suffix || addr.endsWith(suffix));
      });

      // Deduplicate unique candidate token addresses
      const candidateAddresses: string[] = Array.from(new Set(matchingPairs.map((p: any) => String(p.baseToken?.address || '').toLowerCase()).filter(Boolean)));

      if (candidateAddresses.length === 0) {
        defaultUnavailable.name = 'CA NOT FOUND';
        defaultUnavailable.isNotFound = true;
        return defaultUnavailable;
      }

      if (candidateAddresses.length > 1) {
        defaultUnavailable.name = 'DATA AMBIGUOUS';
        defaultUnavailable.isAmbiguous = true;
        return defaultUnavailable;
      }

      // Exactly ONE valid candidate!
      resolvedAddress = candidateAddresses[0] as string;
      const tokenPairs = matchingPairs.filter((p: any) => p.baseToken?.address?.toLowerCase() === resolvedAddress);
      pair = tokenPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

    } catch (_) {
      return defaultUnavailable;
    }
  }

  // 2. Direct Token Query (for full address or fallback)
  if (!pair) {
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${resolvedAddress}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4500)
      });

      if (!res.ok) return defaultUnavailable;

      const data = await res.json();
      if (!data.pairs || !Array.isArray(data.pairs) || data.pairs.length === 0) {
        defaultUnavailable.name = 'CA NOT FOUND';
        defaultUnavailable.isNotFound = true;
        return defaultUnavailable;
      }

      pair = data.pairs.slice().sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
      if (!pair) return defaultUnavailable;
    } catch (_) {
      return defaultUnavailable;
    }
  }

  // 3. Extract verified metrics dynamically
  const priceNum = parseFloat(pair.priceUsd);
  const mcapNum = pair.marketCap || pair.fdv;
  const fdvNum = pair.fdv;
  const liqNum = pair.liquidity?.usd;
  const volNum = pair.volume?.h24;
  const changeNum = pair.priceChange?.h24;
  const buysNum = pair.txns?.h24?.buys;
  const sellsNum = pair.txns?.h24?.sells;

  let tokenAge = 'DATA UNAVAILABLE';
  if (pair.pairCreatedAt) {
    const diffMs = Date.now() - pair.pairCreatedAt;
    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    tokenAge = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  }

  // Deterministic requiredMultiple calculation
  let requiredMultiple: number | null = null;
  let requiredMultipleFormatted = 'DATA UNAVAILABLE';
  if (typeof mcapNum === 'number' && mcapNum > 0 && typeof targetMcap === 'number' && targetMcap > 0) {
    const mult = targetMcap / mcapNum;
    requiredMultiple = Number(mult.toFixed(4));
    requiredMultipleFormatted = `${mult.toFixed(2)}x`;
  }

  // Buy/Sell ratio calculation
  const buySellRatio = calculateBuySellRatio(buysNum, sellsNum);

  const network = formatNetworkName(pair.chainId);
  const baseSymbol = pair.baseToken?.symbol || 'TOKEN';
  const quoteSymbol = pair.quoteToken?.symbol || 'ETH';
  const tradingPair = `${baseSymbol} / ${quoteSymbol}`;
  const retrievalDate = new Date().toISOString().split('T')[0];
  const retrievedAt = new Date().toISOString();

  return {
    contractAddress: pair.baseToken?.address || resolvedAddress,
    name: pair.baseToken?.name || 'Contract Token',
    symbol: baseSymbol,
    network,
    chainId: pair.chainId || 'UNKNOWN',
    pairDex: pair.dexId ? `${String(pair.dexId).toUpperCase()} (${network})` : 'DATA UNAVAILABLE',
    pairAddress: pair.pairAddress || 'DATA UNAVAILABLE',
    tradingPair,
    price: isNaN(priceNum) ? 'DATA UNAVAILABLE' : priceNum,
    priceFormatted: isNaN(priceNum) ? 'DATA UNAVAILABLE' : `$${pair.priceUsd}`,
    marketCap: mcapNum ? Number(mcapNum) : 'DATA UNAVAILABLE',
    marketCapFormatted: mcapNum ? `$${Number(mcapNum).toLocaleString('en-US')}` : 'DATA UNAVAILABLE',
    targetMarketCap: targetMcap,
    targetMarketCapFormatted: targetMcapFormatted,
    requiredMultiple,
    requiredMultipleFormatted,
    fdv: fdvNum ? Number(fdvNum) : 'DATA UNAVAILABLE',
    fdvFormatted: fdvNum ? `$${Number(fdvNum).toLocaleString('en-US')}` : 'DATA UNAVAILABLE',
    liquidityUsd: liqNum != null ? Number(liqNum) : 'DATA UNAVAILABLE',
    liquidityFormatted: liqNum != null ? `$${Number(liqNum).toLocaleString('en-US')}` : 'DATA UNAVAILABLE',
    volume24h: volNum != null ? Number(volNum) : 'DATA UNAVAILABLE',
    volume24hFormatted: volNum != null ? `$${Number(volNum).toLocaleString('en-US')}` : 'DATA UNAVAILABLE',
    change24h: changeNum != null ? Number(changeNum) : 'DATA UNAVAILABLE',
    txns24h: {
      buys: typeof buysNum === 'number' ? Number(buysNum) : 'DATA UNAVAILABLE',
      sells: typeof sellsNum === 'number' ? Number(sellsNum) : 'DATA UNAVAILABLE'
    },
    buySellRatio,
    tokenAge,
    holders: 'DATA UNAVAILABLE',
    holderConcentration: 'DATA UNAVAILABLE',
    contractVerification: 'DATA UNAVAILABLE',
    liquidityLock: 'DATA UNAVAILABLE',
    contractRisks: 'DATA UNAVAILABLE',
    isAvailable: true,
    source: 'DexScreener Live DEX API Feed',
    retrievalDate,
    retrievedAt
  };
}

/**
 * Formats structured CaEvidence into a clean evidentiary summary for LLM persona prompts.
 */
export function formatCaEvidenceSummary(ca: CaEvidence): string {
  const parts = [
    `Contract Address: ${ca.contractAddress}`,
    `Network: ${ca.network}`,
    `Token Name: ${ca.name} (${ca.symbol})`,
    `Trading Pair & DEX: ${ca.tradingPair} on ${ca.pairDex}`,
    `Current Price: ${ca.priceFormatted}`,
    `Current Market Cap: ${ca.marketCapFormatted}`,
    `Target Market Cap: ${ca.targetMarketCapFormatted}`,
    `Required Multiple: ${ca.requiredMultipleFormatted}`,
    `FDV: ${ca.fdvFormatted}`,
    `DEX Liquidity Pool: ${ca.liquidityFormatted}`,
    `24h Trading Volume: ${ca.volume24hFormatted}`,
    `24h Transactions: ${typeof ca.txns24h.buys === 'number' ? `${ca.txns24h.buys} buys / ${ca.txns24h.sells} sells (Buy/Sell Ratio: ${ca.buySellRatio})` : 'DATA UNAVAILABLE'}`,
    `Token Age: ${ca.tokenAge}`,
    `Holder Count: ${ca.holders}`,
    `Top 10 Holder Concentration: ${ca.holderConcentration}`,
    `Contract Audit & Verification: ${ca.contractVerification}`,
    `Liquidity Pool Lock / Burn: ${ca.liquidityLock}`,
    `Contract Exploit / Security Risks: ${ca.contractRisks}`,
    `Evidence Source: ${ca.source} (Retrieved: ${ca.retrievedAt})`
  ];

  return parts.join('\n');
}

// CommonJS export for Node.js scripts and serverless handlers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractContractAddress,
    extractTargetMarketCap,
    formatNetworkName,
    calculateBuySellRatio,
    fetchCaEvidence,
    formatCaEvidenceSummary
  };
}
