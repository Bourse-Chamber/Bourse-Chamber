/**
 * Bourse Chamber — Market Data & Pre-Seeded Sessions
 * Evidence packs, market snapshots, and permanent demo session records
 */

const BourseMockData = (() => {
  // Canonical pre-packaged asset profiles
  const KNOWN_ASSETS = {
    'BTC': {
      ticker: 'BTC',
      name: 'Bitcoin',
      price: 64280,
      change24h: 2.35,
      marketCap: 1268000000000,
      volume24h: 28400000000,
      networkActivity: '840,000 active settlement addresses / 24h',
      supply: '19.75M circulating / 21.0M algorithmic hard cap',
      macroContext: 'Global M2 liquidity expansion; ETF net institutional inflows averaging $140M/week; sovereign reserve discourse accelerating.',
      stakingApy: 0,
      revenuePDR: 0
    },
    'ETH': {
      ticker: 'ETH',
      name: 'Ethereum',
      price: 2640,
      change24h: -0.85,
      marketCap: 317800000000,
      volume24h: 14200000000,
      networkActivity: '1.24M daily transactions across L1; 8.2M transactions on integrated rollups (Base, Arbitrum, Optimism)',
      supply: '120.2M circulating / dynamic burn equilibrium (-0.12% annualized)',
      macroContext: 'Staking participation at 28.6% of circulating supply; institutional spot ETF trading; deflationary burn compressed by blob transaction fees.',
      stakingApy: 3.25,
      revenuePDR: 24.5
    },
    'SOL': {
      ticker: 'SOL',
      name: 'Solana',
      price: 142.50,
      change24h: 6.12,
      marketCap: 66800000000,
      volume24h: 4800000000,
      networkActivity: '2,850 sustained non-vote TPS; $5.2B decentralized exchange daily settlement volume',
      supply: '468.5M circulating / disinflationary schedule (5.4% declining to 1.5%)',
      macroContext: 'Dominant retail DEX volume market share; high validator operational hardware requirements; priority fee revenue expanding.',
      stakingApy: 6.80,
      revenuePDR: 18.2
    },
    'AVAX': {
      ticker: 'AVAX',
      name: 'Avalanche',
      price: 28.40,
      change24h: -1.40,
      marketCap: 11200000000,
      volume24h: 420000000,
      networkActivity: 'Subnet deployment velocity; 180,000 active daily C-chain addresses',
      supply: '394M circulating / 720M maximum cap',
      macroContext: 'Institutional enterprise subnet proofs-of-concept; unlock schedules moderating; competitive fee environment.',
      stakingApy: 7.90,
      revenuePDR: 34.0
    },
    'LINK': {
      ticker: 'LINK',
      name: 'Chainlink',
      price: 13.80,
      change24h: 3.45,
      marketCap: 8200000000,
      volume24h: 380000000,
      networkActivity: 'CCIP cross-chain volume $340M/month; oracle feeds securing >$24B TVL across 14 networks',
      supply: '608M circulating / 1.0B total supply',
      macroContext: 'SWIFT and DTCC tokenization pilot partner; fee accrual mechanism via Chainlink Build and Staking v0.2.',
      stakingApy: 4.10,
      revenuePDR: 16.5
    },
    'CRYPTO': {
      ticker: 'CRYPTO',
      name: 'Global Crypto Market (Market Context)',
      price: 64280,
      change24h: -2.45,
      marketCap: 2380000000000,
      volume24h: 78500000000,
      networkActivity: 'Aggregate multi-chain settlement: $14.2B / 24h across major L1/L2 networks',
      supply: 'Global liquid index (BTC 56% dominance, ETH 14%, Altcoins 30%)',
      macroContext: 'Global digital asset liquidity beta, macro policy stance, and cross-exchange open interest.',
      stakingApy: 4.80,
      revenuePDR: 26.5
    }
  };

  const COIN_SYNONYMS = {
    'BITCOIN': 'BTC', 'BTC': 'BTC',
    'ETHEREUM': 'ETH', 'ETH': 'ETH', 'ETHER': 'ETH',
    'SOLANA': 'SOL', 'SOL': 'SOL',
    'AVALANCHE': 'AVAX', 'AVAX': 'AVAX',
    'CHAINLINK': 'LINK', 'LINK': 'LINK',
    'RIPPLE': 'XRP', 'XRP': 'XRP',
    'CARDANO': 'ADA', 'ADA': 'ADA',
    'BINANCE': 'BNB', 'BNB': 'BNB',
    'DOGECOIN': 'DOGE', 'DOGE': 'DOGE',
    'PEPE': 'PEPE', 'SHIBA': 'SHIB', 'SHIB': 'SHIB',
    'SUI': 'SUI', 'NEAR': 'NEAR'
  };

  /**
   * Generates or synthesizes an evidence pack for any given ticker or thesis
   * Extensible: replace this function's body with CoinGecko / CoinMarketCap / On-chain fetch in production
   */
  async function getMarketData(query) {
    const clean = query.trim().toUpperCase();
    const words = clean.split(/[^A-Z0-9]/).filter(w => w.length > 0);

    // 1. Detect direct coin mentions
    let matchedTicker = null;
    for (const w of words) {
      if (COIN_SYNONYMS[w]) {
        matchedTicker = COIN_SYNONYMS[w];
        break;
      }
    }

    // 2. If general question about crypto, market, or conceptual thesis
    if (!matchedTicker) {
      let tokenCandidate = null;
      const mOf = clean.match(/\b(?:OF|FOR|ON)\s+([A-Z0-9$]{2,20})\s+(?:ON\b|\(CA:|\bTOKEN\b|\(0X)/i);
      const mVerb = clean.match(/\b(?:CAN|WILL|COULD|SHOULD|DOES|IS)\s+([A-Z0-9$]{2,20})\s+(?:REACH|SUSTAIN|HIT|GROW|SURPASS|HOLD)/i);
      const mOn = clean.match(/\b([A-Z0-9$]{2,20})\s+ON\s+[A-Z0-9\s]+(?:CHAIN|NETWORK|L2)\b/i);
      if (mOf && !/^(THE|A|AN|CURRENT|ANY|ALL|OUR|THIS|ITS)$/.test(mOf[1])) tokenCandidate = mOf[1].replace(/^\$/, '');
      else if (mVerb && !/^(THE|A|AN|IT|THIS|THAT|WE)$/.test(mVerb[1])) tokenCandidate = mVerb[1].replace(/^\$/, '');
      else if (mOn && !/^(MARKET|CAP|LIQUIDITY|VOLUME|ACTIVITY|STATUS|PERMISSIONS|CONTRACT)$/.test(mOn[1])) tokenCandidate = mOn[1].replace(/^\$/, '');

      if (tokenCandidate) {
        matchedTicker = tokenCandidate;
      } else {
        const isGeneral = /\b(CRYPTO|KRIPTO|MARKET|PASAR|TURUN|NAIK|CRASH|DUMP|PUMP|MEME|MEMECOIN|DEFI|L2|LAYER2|WEB3|SEC|REGULASI)\b/i.test(clean);
        if (isGeneral || words.length > 2) {
          matchedTicker = 'CRYPTO';
        } else {
          matchedTicker = words[0] && words[0].length <= 8 ? words[0] : 'BTC';
        }
      }
    }

    // Attempt live fetch from /api/market (CoinGecko live integration)
    try {
      const res = await fetch(`/api/market?ticker=${encodeURIComponent(matchedTicker)}`);
      if (res.ok) {
        const live = await res.json();
        if (live && live.price) {
          return {
            ticker: live.ticker || matchedTicker,
            name: live.name || matchedTicker,
            price: live.price,
            priceFormatted: BourseUtils.formatUSD(live.price),
            change24h: live.change24h || 0,
            marketCap: live.marketCap || 0,
            marketCapFormatted: BourseUtils.formatUSD(live.marketCap || 0),
            volume24h: live.volume24h || 0,
            volume24hFormatted: BourseUtils.formatUSD(live.volume24h || 0),
            networkActivity: live.circulatingSupply ? `Circulating: ${live.circulatingSupply}` : 'On-chain settlement active',
            supply: live.totalSupply ? `Total: ${live.totalSupply}` : 'Algorithmic supply distribution',
            macroContext: `Market Source: ${live.source}. Drawdown from ATH: ${live.drawdownFromAthPct || 0}%. Data gaps: ${Array.isArray(live.dataGaps) ? live.dataGaps.join('; ') : 'None documented'}.`,
            stakingApy: 0,
            revenuePDR: 0,
            retrievalDate: live.retrievalDate || BourseUtils.formatDate(new Date()),
            isDemoData: !live.source.includes('Live Market Feed'),
            liveSource: live.source
          };
        }
      }
    } catch (_) {
      // Fallback to offline simulation
    }

    // Artificial realistic latency (350ms)
    await BourseUtils.sleep(350);

    if (matchedTicker && KNOWN_ASSETS[matchedTicker]) {
      const base = { ...KNOWN_ASSETS[matchedTicker] };
      return formatEvidencePack(base);
    }

    // Dynamic asset generation for custom tickers or theses
    const synthTicker = words[0] && words[0].length <= 6 ? words[0] : 'ASSET';
    const hash = BourseUtils.hashString(query);
    const synthPrice = 10 + (hash % 980) * 1.5;
    const synthChange = ((hash % 1900) - 950) / 100;
    const synthCap = 500000000 + (hash % 40000) * 1000000;
    const synthVol = synthCap * 0.08 + (hash % 1000) * 100000;

    const synthAsset = {
      ticker: synthTicker,
      name: query.length > 30 ? query.substring(0, 30) + '...' : query,
      price: synthPrice,
      change24h: synthChange,
      marketCap: synthCap,
      volume24h: synthVol,
      networkActivity: 'Estimated 95,000 active daily on-chain addresses',
      supply: 'Algorithmic dynamic circulating pool',
      macroContext: 'Subject to broad digital asset liquidity beta and macro risk-on appetite.',
      stakingApy: 4.5,
      revenuePDR: 22.0
    };

    return formatEvidencePack(synthAsset);
  }

  function formatEvidencePack(asset) {
    return {
      ...asset,
      priceFormatted: BourseUtils.formatUSD(asset.price),
      marketCapFormatted: BourseUtils.formatUSD(asset.marketCap),
      volume24hFormatted: BourseUtils.formatUSD(asset.volume24h),
      retrievalDate: BourseUtils.formatDate(new Date()),
      isDemoData: true
    };
  }

  // Pre-seeded canonical historical sessions (including BC-0411 and BC-0101)
  const SEED_SESSIONS = [
    {
      id: "BC-0411",
      ticker: "SOL",
      assetName: "Solana",
      question: "Is throughput a moat, or a commodity waiting to be priced?",
      createdAt: "2026-09-05T09:12:00Z",
      closedAt: "09:47",
      evidence: {
        ticker: "SOL",
        name: "Solana",
        priceFormatted: "$142.50",
        change24h: 6.12,
        marketCapFormatted: "$66.80B",
        volume24hFormatted: "$4.80B",
        networkActivity: "2,850 sustained non-vote TPS; $5.2B DEX settlement",
        supply: "468.5M circulating",
        macroContext: "High retail DEX throughput; hardware requirements centralizing validator set.",
        retrievalDate: "05 Sep 2026",
        isDemoData: true
      },
      verdict: {
        outcome: "REDUCE",
        majorityRatio: "5 / 9",
        dissentBreakdown: "3 ADD, 1 PASS",
        positionSizeBand: "0.0 – 1.0%",
        keyAgreement: "Solana has achieved genuine retail product-market fit in low-latency DEX activity and high-frequency trading.",
        keyDisagreement: "Whether monolithic hardware-scaled throughput is a durable moat or an unbacked architecture prone to state bloat and centralized validation.",
        unresolvedQuestion: "Can high validator hardware requirements survive long term without collapsing into centralized datacenter validator cartels?",
        reviewTriggers: [
          "Network activity declines materially below 1,500 non-vote TPS.",
          "Valuation expands above $100B without corresponding non-speculative fee capture.",
          "Validator hardware requirements increase to exclude independent node operators."
        ]
      },
      speakingTurns: 14,
      seatsPresent: "9 / 9",
      votes: [
        { seat: 1, name: "Satoshi Nakamoto", shortName: "Satoshi", school: "CYPHERPUNK", discipline: "Sound money & Cypherpunk PoW", vote: "REDUCE", reason: "Demanding validator hardware bars ordinary users from verifying the state, creating centralized trust." },
        { seat: 2, name: "Vitalik Buterin", shortName: "Vitalik", school: "COMPUTATION", discipline: "Programmable logic & Mechanism design", vote: "ADD", reason: "Demonstrates high single-state execution velocity; valuable empirical benchmark for decentralized state machines." },
        { seat: 3, name: "Hal Finney", shortName: "Finney", school: "CYPHERPUNK", discipline: "Cryptographic privacy & First principles", vote: "REDUCE", reason: "Zero privacy guarantees and high throughput transparent data streams enable trivial surveillance correlation." },
        { seat: 4, name: "Nick Szabo", shortName: "Szabo", school: "COMPUTATION", discipline: "Trust minimization & Smart contracts", vote: "REDUCE", reason: "Pruning history and relying on centralized archival clusters violates algorithmic unforgeable costliness." },
        { seat: 5, name: "Anatoly Yakovenko", shortName: "Anatoly", school: "MONOLITHIC", discipline: "Monolithic execution & Hardware scaling", vote: "ADD", reason: "Physics is the ceiling. 2,850 sustained non-vote TPS on an atomic global state renders modular rollups obsolete." },
        { seat: 6, name: "Arthur Hayes", shortName: "Hayes", school: "MACRO", discipline: "Macro liquidity & Crypto reflexivity", vote: "PASS", reason: "Potent speculative beta in bull liquidity regimes, but perpetual liquidation spirals pose severe downside tail risk." },
        { seat: 7, name: "Michael Saylor", shortName: "Saylor", school: "TREASURY", discipline: "Balance sheet treasury & Digital property", vote: "REDUCE", reason: "Software venture subject to continuous emissions; cannot function as pristine thermodynamic treasury capital." },
        { seat: 8, name: "Changpeng Zhao", shortName: "CZ", school: "LIQUIDITY", discipline: "Orderbook liquidity & Mass onboarding", vote: "ADD", reason: "Dominant retail DEX and spot volumes; fast execution and cheap fees onboard millions regardless of ideology." },
        { seat: 9, name: "Brian Armstrong", shortName: "Armstrong", school: "INSTITUTIONAL", discipline: "Regulated rails & Institutional custody", vote: "REDUCE", reason: "Validator decentralization metrics and historical network halts prevent tier-1 institutional fiduciary endorsement." }
      ],
      transcript: [
        { type: "chair", who: "CHAIR", time: "09:12:00", text: "Floor is open. Thesis filed for Solana (SOL): 'Is throughput a moat, or a commodity waiting to be priced?' Evidence pack distributed to all nine seats." },
        { type: "analysis", who: "Satoshi Nakamoto", time: "09:14:02", text: "The fundamental innovation of digital currency is eliminating trusted third parties. If validating the ledger requires datacenter hardware beyond the reach of normal citizens, you have reconstructed an administrative banking cartel." },
        { type: "analysis", who: "Anatoly Yakovenko", time: "09:15:30", text: "Hardware improves with Moore's Law and fiber bandwidth expands exponentially. Restricting blockchains to 10 TPS is optimizing for dial-up modems. Monolithic composability beats 50 fractured bridges." },
        { type: "analysis", who: "Nick Szabo", time: "09:17:15", text: "Throughput without unforgeable costliness is merely high-frequency web2 database replication. Who preserves state when historical data becomes too heavy for independent nodes?" },
        { type: "analysis", who: "Arthur Hayes", time: "09:18:40", text: "Debating node hardware is missing the macro picture. When global central banks expand credit, SOL acts as a high-beta liquidity sponge. But when real yields spike, watch out for forced margin liquidations." },
        { type: "chair", who: "CHAIR", time: "09:22:10", text: "Divergence detected on Moat Durability between Satoshi (Seat 01) and Anatoly (Seat 05). Cross-examination floor opened." },
        { type: "challenge", who: "Satoshi Nakamoto", time: "09:23:00", text: "Satoshi challenges Anatoly: 'If state history requires enterprise datacenter clusters that ordinary individuals cannot audit, what mathematically prevents validator collusion or state censorship?'" },
        { type: "response", who: "Anatoly Yakovenko", time: "09:24:18", text: "Anatoly responds: 'Satoshi, Proof of History solves cryptographic clock synchronization without centralized coordinators. Forcing users into asynchronous multi-hop rollups causes cross-chain bridge exploits that have cost billions.'" },
        { type: "chair", who: "CHAIR", time: "09:30:00", text: "Cross-examination concluded. All nine seats will now cast formal ballots: ADD, REDUCE, or PASS." },
        { type: "vote", who: "Satoshi, Finney, Szabo, Saylor, Armstrong", time: "09:35:10", text: "Seats 01, 03, 04, 07, 09 cast REDUCE ballots citing hardware barriers, privacy deficits, and institutional hesitation." },
        { type: "vote", who: "Vitalik, Anatoly, CZ", time: "09:36:20", text: "Seats 02, 05, 08 cast ADD ballots citing execution throughput, developer adoption, and retail liquidity." },
        { type: "verdict", who: "CHAIR", time: "09:47:00", text: "VERDICT RECORDED: REDUCE (5 / 9 majority). Dissent: 3 ADD, 1 PASS. Sizing band: 0.0 – 1.0%. Session closed and committed to permanent ledger." }
      ]
    },
    {
      id: "BC-0101",
      ticker: "BTC",
      assetName: "Bitcoin",
      question: "Is BTC still a reasonable core holding at current market levels?",
      createdAt: "2026-09-12T14:20:00Z",
      closedAt: "14:52",
      evidence: {
        ticker: "BTC",
        name: "Bitcoin",
        priceFormatted: "$64,280",
        change24h: 2.35,
        marketCapFormatted: "$1.27T",
        volume24hFormatted: "$28.40B",
        networkActivity: "840,000 active settlement addresses / 24h",
        supply: "19.75M circulating / 21.0M hard cap",
        macroContext: "Global liquidity expansion; institutional ETF inflows; sovereign treasury diversification.",
        retrievalDate: "12 Sep 2026",
        isDemoData: true
      },
      verdict: {
        outcome: "ADD",
        majorityRatio: "7 / 9",
        dissentBreakdown: "2 PASS",
        positionSizeBand: "3.0 – 5.0%",
        keyAgreement: "Bitcoin retains unmatched monetary liquidity, institutional custody adoption, and unforgeable mathematical scarcity.",
        keyDisagreement: "Whether absent programmable smart contracts, Bitcoin can expand beyond digital store-of-value into active economic compute.",
        unresolvedQuestion: "Will long-term transaction fee revenue adequately incentivize hashpower security after subsequent halvings?",
        reviewTriggers: [
          "Material deterioration in global on-chain settlement volume.",
          "Significant synchronous tightening in G10 central bank balance sheets.",
          "Structural shift in global regulatory clarity for regulated custody."
        ]
      },
      speakingTurns: 16,
      seatsPresent: "9 / 9",
      votes: [
        { seat: 1, name: "Satoshi Nakamoto", shortName: "Satoshi", school: "CYPHERPUNK", discipline: "Sound money & Cypherpunk PoW", vote: "ADD", reason: "Pristine Byzantine agreement and immutable 21M supply cap with zero counterparty risk." },
        { seat: 2, name: "Vitalik Buterin", shortName: "Vitalik", school: "COMPUTATION", discipline: "Programmable logic & Mechanism design", vote: "PASS", reason: "The premier monetary Schelling point, but lack of native programmability restricts dynamic cryptoeconomic coordination." },
        { seat: 3, name: "Hal Finney", shortName: "Finney", school: "CYPHERPUNK", discipline: "Cryptographic privacy & First principles", vote: "ADD", reason: "Unbroken cryptographic proof-of-work security and peer-to-peer sovereign verification." },
        { seat: 4, name: "Nick Szabo", shortName: "Szabo", school: "COMPUTATION", discipline: "Trust minimization & Smart contracts", vote: "ADD", reason: "Unforgeable costliness in proof-of-work consensus with absolute immutability and institutional permanence." },
        { seat: 5, name: "Anatoly Yakovenko", shortName: "Anatoly", school: "MONOLITHIC", discipline: "Monolithic execution & Hardware scaling", vote: "PASS", reason: "Unmatched store-of-value consensus, though baseline transaction throughput requires scaling layers for global velocity." },
        { seat: 6, name: "Arthur Hayes", shortName: "Hayes", school: "MACRO", discipline: "Macro liquidity & Crypto reflexivity", vote: "ADD", reason: "Prime speculative liquidity sponge poised to capture global central bank fiat dilution and debt debasement." },
        { seat: 7, name: "Michael Saylor", shortName: "Saylor", school: "TREASURY", discipline: "Balance sheet treasury & Digital property", vote: "ADD", reason: "Pristine digital energy and incorruptible treasury reserve asset. There is no second best." },
        { seat: 8, name: "Changpeng Zhao", shortName: "CZ", school: "LIQUIDITY", discipline: "Orderbook liquidity & Mass onboarding", vote: "ADD", reason: "Vibrant global trading volume, deepest orderbook liquidity, and unquestioned worldwide brand trust." },
        { seat: 9, name: "Brian Armstrong", shortName: "Armstrong", school: "INSTITUTIONAL", discipline: "Regulated rails & Institutional custody", vote: "ADD", reason: "Gold standard for spot ETF products, regulated prime custody, and institutional asset management." }
      ],
      transcript: [
        { type: "chair", who: "CHAIR", time: "14:20:00", text: "Floor convenes. Examination of Bitcoin (BTC): 'Is BTC still a reasonable core holding at current market levels?'" },
        { type: "analysis", who: "Michael Saylor", time: "14:22:15", text: "Cash is a melting ice cube losing 10-15% purchasing power annually. Bitcoin is pure monetary thermodynamics—capital stored across time and space with zero entropy and no counterparty risk." },
        { type: "analysis", who: "Arthur Hayes", time: "14:24:00", text: "Global debt-to-GDP has passed the mathematical point of return. Sovereign treasuries must print fiat. BTC is the apex asset capturing this structural debasement." },
        { type: "analysis", who: "Vitalik Buterin", time: "14:26:30", text: "Bitcoin remains our industry's foundational reserve. However, as block rewards diminish, fee security models and the emergence of L2 settlement architectures will dictate long-term network stability." },
        { type: "chair", who: "CHAIR", time: "14:32:00", text: "Cross-examination: Saylor (Seat 07) vs Vitalik (Seat 02) on Monetary Purity vs Programmability." },
        { type: "challenge", who: "Michael Saylor", time: "14:33:10", text: "Saylor challenges Vitalik: 'Vitalik, why risk monetary capital on complex Turing-complete execution that introduces bugs and hard forks, when immaculate mathematical scarcity is already achieved?'" },
        { type: "response", who: "Vitalik Buterin", time: "14:34:50", text: "Vitalik responds: 'Saylor, money is a coordination tool. Without cryptographic programmability, a network cannot automate decentralized finance, privacy protections, or dynamic collective decision-making.'" },
        { type: "chair", who: "CHAIR", time: "14:42:00", text: "Debate concluded. Roll-call voting commencing across all nine seats." },
        { type: "verdict", who: "CHAIR", time: "14:52:00", text: "VERDICT RECORDED: ADD (7 / 9 majority). Dissent: 2 PASS. Position size band: 3.0 – 5.0%." }
      ]
    },
    {
      id: "BC-0202",
      ticker: "ETH",
      assetName: "Ethereum",
      question: "Does Layer-2 fragmentation permanently impair Ethereum's fee accrual moat?",
      createdAt: "2026-09-15T11:00:00Z",
      closedAt: "11:35",
      evidence: {
        ticker: "ETH",
        name: "Ethereum",
        priceFormatted: "$2,640",
        change24h: -0.85,
        marketCapFormatted: "$317.80B",
        volume24hFormatted: "$14.20B",
        networkActivity: "1.24M L1 txs; 8.2M L2 rollups txs daily",
        supply: "120.2M circulating / dynamic burn",
        macroContext: "Staking yield 3.25%; blob transaction fees compressing L1 fee burn.",
        retrievalDate: "15 Sep 2026",
        isDemoData: true
      },
      verdict: {
        outcome: "PASS",
        majorityRatio: "4 / 9",
        dissentBreakdown: "3 ADD, 2 REDUCE",
        positionSizeBand: "1.0 – 2.0%",
        keyAgreement: "Ethereum remains the undisputed settlement layer for institutional tokenized assets and DeFi TVL.",
        keyDisagreement: "Whether value capture accrues to the ETH token or is captured by external sequencing and application rollups.",
        unresolvedQuestion: "Can synchronous composability between fragmented Layer-2 chains be resolved without compromising base layer security?",
        reviewTriggers: [
          "Layer-1 burn rate drops below net issuance for more than two consecutive quarters.",
          "Alternative execution layers capture more than 50% of total stablecoin settlement.",
          "Major enterprise tokenization moves natively to non-EVM architecture."
        ]
      },
      speakingTurns: 13,
      seatsPresent: "9 / 9",
      votes: [
        { seat: 1, name: "Satoshi Nakamoto", shortName: "Satoshi", school: "CYPHERPUNK", discipline: "Sound money & Cypherpunk PoW", vote: "PASS", reason: "Awaiting decentralized sequencing verification; complex modular state creates new administrative attack vectors." },
        { seat: 2, name: "Vitalik Buterin", shortName: "Vitalik", school: "COMPUTATION", discipline: "Programmable logic & Mechanism design", vote: "ADD", reason: "Durable developer network effects, cryptographic validity proofs, and active public goods mechanism design." },
        { seat: 3, name: "Hal Finney", shortName: "Finney", school: "CYPHERPUNK", discipline: "Cryptographic privacy & First principles", vote: "PASS", reason: "Remarkable smart contract progress, though native base-layer financial privacy remains incomplete." },
        { seat: 4, name: "Nick Szabo", shortName: "Szabo", school: "COMPUTATION", discipline: "Trust minimization & Smart contracts", vote: "PASS", reason: "Turing-complete attack surface and governance mutability warrant caution over long-term base fee accrual." },
        { seat: 5, name: "Anatoly Yakovenko", shortName: "Anatoly", school: "MONOLITHIC", discipline: "Monolithic execution & Hardware scaling", vote: "REDUCE", reason: "Asynchronous Layer-2 fragmentation breaks atomic composability and degrades overall user and developer UX." },
        { seat: 6, name: "Arthur Hayes", shortName: "Hayes", school: "MACRO", discipline: "Macro liquidity & Crypto reflexivity", vote: "ADD", reason: "Staking carry yield combined with high beta exposure to global digital liquidity makes ETH an attractive asset." },
        { seat: 7, name: "Michael Saylor", shortName: "Saylor", school: "TREASURY", discipline: "Balance sheet treasury & Digital property", vote: "REDUCE", reason: "Dynamic token supply schedules and software governance risk prevent classification as pristine digital property." },
        { seat: 8, name: "Changpeng Zhao", shortName: "CZ", school: "LIQUIDITY", discipline: "Orderbook liquidity & Mass onboarding", vote: "PASS", reason: "Massive DeFi liquidity and developer base, but L2 bridging complexity creates friction for retail users." },
        { seat: 9, name: "Brian Armstrong", shortName: "Armstrong", school: "INSTITUTIONAL", discipline: "Regulated rails & Institutional custody", vote: "ADD", reason: "Anchor for institutional stablecoins, spot ETF vehicle approvals, and premier compliant L2 infrastructure." }
      ],
      transcript: [
        { type: "chair", who: "CHAIR", time: "11:00:00", text: "Floor opened for Ethereum (ETH): 'Does Layer-2 fragmentation permanently impair Ethereum's fee accrual moat?'" },
        { type: "analysis", who: "Vitalik Buterin", time: "11:02:40", text: "Layer-2 rollups preserve Ethereum's L1 decentralization while providing scalable blockspace. Cryptographic validity proofs and unified data availability will bind the ecosystem together." },
        { type: "analysis", who: "Anatoly Yakovenko", time: "11:05:10", text: "Fragmenting users and liquidity across 50 separate rollups with centralized sequencers breaks synchronous composability. Developers are forced into bridging nightmares." },
        { type: "chair", who: "CHAIR", time: "11:35:00", text: "VERDICT RECORDED: PASS (4 / 9 plurality). Dissent: 3 ADD, 2 REDUCE. Sizing band: 1.0 – 2.0%." }
      ]
    },
    {
      id: "BC-0305",
      ticker: "AVAX",
      assetName: "Avalanche",
      question: "Subnet architecture vs monolithic scaling in a liquidity-constrained cycle",
      createdAt: "2026-09-17T16:15:00Z",
      closedAt: "16:48",
      evidence: {
        ticker: "AVAX",
        name: "Avalanche",
        priceFormatted: "$28.40",
        change24h: -1.40,
        marketCapFormatted: "$11.20B",
        volume24hFormatted: "$420.00M",
        networkActivity: "180,000 active daily C-chain addresses",
        supply: "394M circulating / 720M maximum cap",
        macroContext: "Institutional subnet trials; unlock schedules moderating.",
        retrievalDate: "17 Sep 2026",
        isDemoData: true
      },
      verdict: {
        outcome: "REDUCE",
        majorityRatio: "6 / 9",
        dissentBreakdown: "2 PASS, 1 ADD",
        positionSizeBand: "0.0 – 1.0%",
        keyAgreement: "Avalanche provides robust subnet isolation for regulated institutions.",
        keyDisagreement: "Whether capital fragmentation across subnets diminishes core token value capture.",
        unresolvedQuestion: "Will private institutional subnets require AVAX staking in sufficient volume?",
        reviewTriggers: [
          "Net validator count drops below 1,000 active nodes.",
          "Subnet gas fee burn fails to exceed validator reward emissions.",
          "Rival enterprise platforms capture major institutional asset pilots."
        ]
      },
      speakingTurns: 12,
      seatsPresent: "9 / 9",
      votes: [
        { seat: 1, name: "Satoshi Nakamoto", shortName: "Satoshi", school: "CYPHERPUNK", discipline: "Sound money & Cypherpunk PoW", vote: "REDUCE", reason: "Subnet consensus and foundation coordination introduce unnecessary human trust assumptions." },
        { seat: 2, name: "Vitalik Buterin", shortName: "Vitalik", school: "COMPUTATION", discipline: "Programmable logic & Mechanism design", vote: "PASS", reason: "Snow consensus is elegant, but EVM subnet fragmentation creates isolated capital silos." },
        { seat: 3, name: "Hal Finney", shortName: "Finney", school: "CYPHERPUNK", discipline: "Cryptographic privacy & First principles", vote: "REDUCE", reason: "Lacks base privacy and relies heavily on institutional validator consortiums." },
        { seat: 4, name: "Nick Szabo", shortName: "Szabo", school: "COMPUTATION", discipline: "Trust minimization & Smart contracts", vote: "REDUCE", reason: "Subnet isolation dilutes base network security and fragments algorithmic trust minimization." },
        { seat: 5, name: "Anatoly Yakovenko", shortName: "Anatoly", school: "MONOLITHIC", discipline: "Monolithic execution & Hardware scaling", vote: "REDUCE", reason: "Isolated app chains cannot compete with high-frequency monolithic atomic composability." },
        { seat: 6, name: "Arthur Hayes", shortName: "Hayes", school: "MACRO", discipline: "Macro liquidity & Crypto reflexivity", vote: "REDUCE", reason: "Thin secondary market depth and vulnerable to severe drawdown during global macro tightening." },
        { seat: 7, name: "Michael Saylor", shortName: "Saylor", school: "TREASURY", discipline: "Balance sheet treasury & Digital property", vote: "REDUCE", reason: "Software venture token with continuous validator emissions; lacks immutable thermodynamic scarcity." },
        { seat: 8, name: "Changpeng Zhao", shortName: "CZ", school: "LIQUIDITY", discipline: "Orderbook liquidity & Mass onboarding", vote: "PASS", reason: "Respectable trading volume, but institutional subnet trials have not generated mass retail adoption." },
        { seat: 9, name: "Brian Armstrong", shortName: "Armstrong", school: "INSTITUTIONAL", discipline: "Regulated rails & Institutional custody", vote: "ADD", reason: "Compliant custom subnet architecture provides regulatory pathways for enterprise pilots." }
      ],
      transcript: [
        { type: "chair", who: "CHAIR", time: "16:15:00", text: "Chamber convened on Avalanche (AVAX)." },
        { type: "verdict", who: "CHAIR", time: "16:48:00", text: "VERDICT RECORDED: REDUCE (6 / 9 majority). Dissent: 2 PASS, 1 ADD. Sizing band: 0.0 – 1.0%." }
      ]
    },
    {
      id: "BC-0189",
      ticker: "LINK",
      assetName: "Chainlink",
      question: "Is Cross-Chain Interoperability Protocol (CCIP) the definitive plumbing of tokenized RWAs?",
      createdAt: "2026-09-18T10:10:00Z",
      closedAt: "10:45",
      evidence: {
        ticker: "LINK",
        name: "Chainlink",
        priceFormatted: "$13.80",
        change24h: 3.45,
        marketCapFormatted: "$8.20B",
        volume24hFormatted: "$380.00M",
        networkActivity: "Oracle services securing >$24B TVL across 14 networks",
        supply: "608M circulating / 1.0B total supply",
        macroContext: "SWIFT and DTCC integration partnerships; staking participation growing.",
        retrievalDate: "18 Sep 2026",
        isDemoData: true
      },
      verdict: {
        outcome: "ADD",
        majorityRatio: "6 / 9",
        dissentBreakdown: "1 REDUCE, 2 PASS",
        positionSizeBand: "2.0 – 3.5%",
        keyAgreement: "Chainlink maintains an unassailable monopoly as the critical standard for blockchain data connectivity.",
        keyDisagreement: "The extent to which commercial enterprise oracle volume translates directly to token staking cash flows.",
        unresolvedQuestion: "Will traditional financial consortia launch closed proprietary oracle consortiums to bypass public tokens?",
        reviewTriggers: [
          "Secured TVL drops below $15B.",
          "Direct enterprise revenue accrual to staking pools falls short of projected roadmaps.",
          "Major SWIFT or DTCC pilot shifts away from public CCIP deployment."
        ]
      },
      speakingTurns: 15,
      seatsPresent: "9 / 9",
      votes: [
        { seat: 1, name: "Satoshi Nakamoto", shortName: "Satoshi", school: "CYPHERPUNK", discipline: "Sound money & Cypherpunk PoW", vote: "PASS", reason: "Off-chain oracle data introduces external dependencies, though cryptographic aggregation limits failure points." },
        { seat: 2, name: "Vitalik Buterin", shortName: "Vitalik", school: "COMPUTATION", discipline: "Programmable logic & Mechanism design", vote: "ADD", reason: "Essential decentralized middleware enabling trust-minimized cryptographic truth for multi-chain contracts." },
        { seat: 3, name: "Hal Finney", shortName: "Finney", school: "CYPHERPUNK", discipline: "Cryptographic privacy & First principles", vote: "PASS", reason: "Verifiable oracle proofs are mathematically sound, but dependent on external data feeds." },
        { seat: 4, name: "Nick Szabo", shortName: "Szabo", school: "COMPUTATION", discipline: "Trust minimization & Smart contracts", vote: "ADD", reason: "Bridges the crucial gap between deterministic smart contracts and subjective real-world information." },
        { seat: 5, name: "Anatoly Yakovenko", shortName: "Anatoly", school: "MONOLITHIC", discipline: "Monolithic execution & Hardware scaling", vote: "PASS", reason: "Critical for DeFi pricing feeds, but oracle latency must continue improving for high-frequency trading." },
        { seat: 6, name: "Arthur Hayes", shortName: "Hayes", school: "MACRO", discipline: "Macro liquidity & Crypto reflexivity", vote: "ADD", reason: "Inescapable tollbooth on all institutional capital and stablecoin movements entering digital assets." },
        { seat: 7, name: "Michael Saylor", shortName: "Saylor", school: "TREASURY", discipline: "Balance sheet treasury & Digital property", vote: "REDUCE", reason: "Software utility token with continuous development requirements; not an absolute store-of-value asset." },
        { seat: 8, name: "Changpeng Zhao", shortName: "CZ", school: "LIQUIDITY", discipline: "Orderbook liquidity & Mass onboarding", vote: "ADD", reason: "Unrivaled market share in price feeds across every major crypto exchange and DeFi protocol." },
        { seat: 9, name: "Brian Armstrong", shortName: "Armstrong", school: "INSTITUTIONAL", discipline: "Regulated rails & Institutional custody", vote: "ADD", reason: "Prime enterprise partner for DTCC, SWIFT, and regulated banking tokenization pilots." }
      ],
      transcript: [
        { type: "chair", who: "CHAIR", time: "10:10:00", text: "Chamber convened on Chainlink (LINK)." },
        { type: "verdict", who: "CHAIR", time: "10:45:00", text: "VERDICT RECORDED: ADD (6 / 9 majority). Dissent: 1 REDUCE, 2 PASS. Sizing band: 2.0 – 3.5%." }
      ]
    }
  ];

  return {
    KNOWN_ASSETS,
    SEED_SESSIONS,
    getMarketData,
    formatEvidencePack
  };
})();

// Export for Node/CommonJS if applicable
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BourseMockData;
}
