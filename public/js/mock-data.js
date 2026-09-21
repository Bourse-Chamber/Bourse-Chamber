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
    }
  };

  /**
   * Generates or synthesizes an evidence pack for any given ticker or thesis
   * Extensible: replace this function's body with CoinGecko / CoinMarketCap / On-chain fetch in production
   */
  async function getMarketData(query) {
    const clean = query.trim().toUpperCase();
    const words = clean.split(/[^A-Z0-9]/).filter(w => w.length > 0);
    const matchedTicker = Object.keys(KNOWN_ASSETS).find(t => words.includes(t) || clean.includes(t)) || (words[0] && words[0].length <= 8 ? words[0] : 'BTC');

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
        positionSizeBand: "1.0 – 2.0%",
        keyAgreement: "Solana has achieved genuine retail product-market fit in low-latency DEX activity.",
        keyDisagreement: "Whether transaction execution throughput will remain a defensible competitive moat once rival rollups achieve sub-cent finality.",
        unresolvedQuestion: "Can high validator hardware requirements and storage state growth survive without structural centralization?",
        reviewTriggers: [
          "Network activity declines materially below 1,500 non-vote TPS.",
          "Valuation expands above $100B without corresponding non-speculative fee economics.",
          "Foundation or early venture unlock schedule accelerates distribution."
        ]
      },
      speakingTurns: 14,
      seatsPresent: "9 / 9",
      votes: [
        { seat: 1, name: "Benjamin Graham", shortName: "Graham", school: "VALUE", discipline: "Margin of safety", vote: "REDUCE", reason: "Current valuation assumes indefinite speculative volume. Lacks a tangible cash margin of safety." },
        { seat: 2, name: "Charlie Munger", shortName: "Munger", school: "VALUE", discipline: "Mental models", vote: "REDUCE", reason: "Invert: validator economics and state bloat represent unmodeled operational fragilities." },
        { seat: 3, name: "Peter Lynch", shortName: "Lynch", school: "GROWTH", discipline: "Know what you own", vote: "ADD", reason: "Organic retail user volume is observable in real life; consumer apps are choosing Solana." },
        { seat: 4, name: "Cathie Wood", shortName: "Wood", school: "GROWTH", discipline: "Growth and disruption", vote: "ADD", reason: "Frictionless execution and monolithic composability represent the future of decentralized finance." },
        { seat: 5, name: "Aswath Damodaran", shortName: "Damodaran", school: "VALUATION", discipline: "Story into numbers", vote: "REDUCE", reason: "Token fee capture sits well below the protocol's required cost of capital." },
        { seat: 6, name: "Nassim Nicholas Taleb", shortName: "Taleb", school: "RISK", discipline: "Tail risk", vote: "REDUCE", reason: "Hardware centralization and single-client dependencies create severe absorbing tail risk." },
        { seat: 7, name: "Mohnish Pabrai", shortName: "Pabrai", school: "VALUE", discipline: "Low risk, high uncertainty", vote: "ADD", reason: "Heads I win, tails I don't lose much: developer gravity provides asymmetric upside." },
        { seat: 8, name: "Bill Ackman", shortName: "Ackman", school: "CONCENTRATION", discipline: "Concentrated conviction", vote: "REDUCE", reason: "Lacks durable institutional governance protections and predictable long-term cash generation." },
        { seat: 9, name: "Michael Burry", shortName: "Burry", school: "CONTRARIAN", discipline: "Contrarian audit", vote: "REDUCE", reason: "Concentrated venture backing and reflexive liquidity loops create an asymmetric downside trap." }
      ],
      transcript: [
        { type: "chair", who: "CHAIR", time: "09:12:00", text: "Floor is open. Thesis filed for Solana (SOL): 'Is throughput a moat, or a commodity waiting to be priced?' Evidence pack distributed to all nine seats." },
        { type: "analysis", who: "Benjamin Graham", time: "09:14:02", text: "The margin of safety depends on whether the current $66.8B valuation is supported by cash-generating economics. At 2,850 TPS with nominal fees, the protocol burns capital to subsidize hardware validators. Without a floor, price is tethered only to sentiment." },
        { type: "analysis", who: "Peter Lynch", time: "09:15:30", text: "Walk into any developer hackathon. Builders aren't modeling multi-layered rollup abstractions; they are deploying on Solana because it works in sub-seconds. That is organic adoption you can touch." },
        { type: "analysis", who: "Nassim Nicholas Taleb", time: "09:17:15", text: "Solana survived the FTX collapse—an absorbing barrier that shatters fragile systems. What does not kill you makes you antifragile. That convex resilience has mathematical value." },
        { type: "analysis", who: "Charlie Munger", time: "09:18:40", text: "Invert the thesis. If high throughput is commoditized by hardware advances and rival chains, the fee moat collapses to zero while state storage costs compound. That is a terrible business model." },
        { type: "chair", who: "CHAIR", time: "09:22:10", text: "Divergence detected on Moat Durability between Graham (Seat 01) and Wood (Seat 04). Cross-examination floor opened." },
        { type: "challenge", who: "Benjamin Graham", time: "09:23:00", text: "Graham challenges Wood: 'Your exponential S-curve model assumes users will permanently pay fees on an asset that can be cloned with 50 lines of configuration. What protects your capital if fees race to zero?'" },
        { type: "response", who: "Cathie Wood", time: "09:24:18", text: "Wood responds: 'Graham is evaluating a decentralized internet protocol like a 1930s railroad company. Metcalfe's law of network liquidity creates an unassailable ecosystem moat that far outpaces simple code forks.'" },
        { type: "chair", who: "CHAIR", time: "09:30:00", text: "Cross-examination concluded. All nine seats will now cast formal ballots: ADD, REDUCE, or PASS." },
        { type: "vote", who: "Graham, Munger, Damodaran, Taleb, Ackman, Burry", time: "09:35:10", text: "Seats 01, 02, 05, 06, 08, 09 cast REDUCE ballots citing moat commoditization and tail fragility." },
        { type: "vote", who: "Lynch, Wood, Pabrai", time: "09:36:20", text: "Seats 03, 04, 07 cast ADD ballots citing organic adoption and asymmetric upside." },
        { type: "verdict", who: "CHAIR", time: "09:47:00", text: "VERDICT RECORDED: REDUCE (6 / 9 majority). Dissent: 3 ADD. Sizing band: 1.0 – 2.0%. Session closed and committed to permanent ledger." }
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
        majorityRatio: "5 / 9",
        dissentBreakdown: "3 REDUCE, 1 PASS",
        positionSizeBand: "3.0 – 5.0%",
        keyAgreement: "BTC retains unmatched monetary liquidity, institutional custody adoption, and unforgeable scarcity.",
        keyDisagreement: "Whether absent cash flows, Bitcoin can sustain a trillion-dollar valuation across sovereign liquidity drawdowns.",
        unresolvedQuestion: "Will long-term transaction fee revenue adequately incentivize hashpower security after subsequent halvings?",
        reviewTriggers: [
          "Material deterioration in global on-chain settlement volume.",
          "Significant synchronous tightening in G10 central bank balance sheets.",
          "Structural shift in US/global regulatory clarity for regulated custody."
        ]
      },
      speakingTurns: 16,
      seatsPresent: "9 / 9",
      votes: [
        { seat: 1, name: "Benjamin Graham", shortName: "Graham", school: "VALUE", discipline: "Margin of safety", vote: "PASS", reason: "Monetary brand acknowledged, but absence of cash flow floor warrants caution over accumulation." },
        { seat: 2, name: "Charlie Munger", shortName: "Munger", school: "VALUE", discipline: "Mental models", vote: "REDUCE", reason: "Remains an artificial speculative token with excessive social friction and non-productive economics." },
        { seat: 3, name: "Peter Lynch", shortName: "Lynch", school: "GROWTH", discipline: "Know what you own", vote: "ADD", reason: "Global brand awareness is total; institutional adoption has crossed the chasm." },
        { seat: 4, name: "Cathie Wood", shortName: "Wood", school: "GROWTH", discipline: "Growth and disruption", vote: "ADD", reason: "Global monetary protocol on track for multi-trillion market capture; supreme conviction." },
        { seat: 5, name: "Aswath Damodaran", shortName: "Damodaran", school: "VALUATION", discipline: "Story into numbers", vote: "REDUCE", reason: "Without contractual cash flows or dividend yields, valuation is driven entirely by changing market pricing moods." },
        { seat: 6, name: "Nassim Nicholas Taleb", shortName: "Taleb", school: "RISK", discipline: "Tail risk", vote: "ADD", reason: "Proven survival through multiple 80% drawdowns without bankruptcy gives it antifragile convexity." },
        { seat: 7, name: "Mohnish Pabrai", shortName: "Pabrai", school: "VALUE", discipline: "Low risk, high uncertainty", vote: "ADD", reason: "Sovereign game theory makes terminal downside remote while global liquidity upside remains convex." },
        { seat: 8, name: "Bill Ackman", shortName: "Ackman", school: "CONCENTRATION", discipline: "Concentrated conviction", vote: "ADD", reason: "Digital store-of-value monopoly with massive structural network moats and regulated spot ETF custody." },
        { seat: 9, name: "Michael Burry", shortName: "Burry", school: "CONTRARIAN", discipline: "Contrarian audit", vote: "REDUCE", reason: "Derivative leverage concentration and custodial central counterparty risks create flash liquidation spirals." }
      ],
      transcript: [
        { type: "chair", who: "CHAIR", time: "14:20:00", text: "Floor convenes. Examination of Bitcoin (BTC): 'Is BTC still a reasonable core holding at current market levels?'" },
        { type: "analysis", who: "Cathie Wood", time: "14:22:15", text: "When global debt-to-GDP hits historical extremes, fiat currency monetization accelerates. BTC is rapidly assuming the role of the primary digital monetary reserve on institutional balance sheets." },
        { type: "analysis", who: "Charlie Munger", time: "14:24:00", text: "It is an index of human gullibility. Just because you have a ledger that limits supply does not mean you have created an asset that blesses society. Invert it: what happens when governments decide currency issuance is non-negotiable?" },
        { type: "analysis", who: "Aswath Damodaran", time: "14:26:30", text: "Remember the difference between pricing and valuing. You cannot value Bitcoin with DCF because it produces no cash flows. You can only price it based on liquidity and sentiment." },
        { type: "chair", who: "CHAIR", time: "14:32:00", text: "Cross-examination: Wood (Seat 04) vs Munger (Seat 02) on Macro Reserve Necessity." },
        { type: "challenge", who: "Cathie Wood", time: "14:33:10", text: "Wood challenges Munger: 'Charlie, if you hold sovereign fiat bonds mathematically guaranteed to be debased by central banks, is that not far riskier than holding a mathematical hard cap?'" },
        { type: "response", who: "Charlie Munger", time: "14:34:50", text: "Munger responds: 'I would rather hold productive businesses and farmland that feed and shelter humanity than rely on a cryptographic ledger whose only return depends on selling to someone else tomorrow.'" },
        { type: "chair", who: "CHAIR", time: "14:42:00", text: "Debate concluded. Roll-call voting commencing across all nine seats." },
        { type: "verdict", who: "CHAIR", time: "14:52:00", text: "VERDICT RECORDED: ADD (5 / 9 majority). Dissent: 3 REDUCE, 1 PASS. Position size band: 3.0 – 5.0%." }
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
        majorityRatio: "5 / 9",
        dissentBreakdown: "4 ADD, 2 REDUCE",
        positionSizeBand: "2.0 – 3.0%",
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
        { seat: 1, name: "Benjamin Graham", shortName: "Graham", school: "VALUE", discipline: "Margin of safety", vote: "PASS", reason: "3.2% staking yield offers cash flow, but compressed L1 burn clouds earnings visibility." },
        { seat: 2, name: "Charlie Munger", shortName: "Munger", school: "VALUE", discipline: "Mental models", vote: "REDUCE", reason: "Unnecessary complexity and agency dilemmas between L1 and competing L2 teams." },
        { seat: 3, name: "Peter Lynch", shortName: "Lynch", school: "GROWTH", discipline: "Know what you own", vote: "ADD", reason: "Massive developer ecosystem and genuine financial applications running continuously." },
        { seat: 4, name: "Cathie Wood", shortName: "Wood", school: "GROWTH", discipline: "Growth and disruption", vote: "ADD", reason: "The foundational settlement layer for global financial market tokenization." },
        { seat: 5, name: "Aswath Damodaran", shortName: "Damodaran", school: "VALUATION", discipline: "Story into numbers", vote: "PASS", reason: "Fee generation is real, but terminal discount rate must reflect constant protocol shifts." },
        { seat: 6, name: "Nassim Nicholas Taleb", shortName: "Taleb", school: "RISK", discipline: "Tail risk", vote: "ADD", reason: "Longest unbroken track record of smart contract execution and battle-tested consensus." },
        { seat: 7, name: "Mohnish Pabrai", shortName: "Pabrai", school: "VALUE", discipline: "Low risk, high uncertainty", vote: "PASS", reason: "Unclear whether value accrues to the base asset or to competing Layer-2 execution tokens." },
        { seat: 8, name: "Bill Ackman", shortName: "Ackman", school: "CONCENTRATION", discipline: "Concentrated conviction", vote: "ADD", reason: "Monopoly on institutional DeFi liquidity and deeply established validator decentralization." },
        { seat: 9, name: "Michael Burry", shortName: "Burry", school: "CONTRARIAN", discipline: "Contrarian audit", vote: "REDUCE", reason: "L2 cannibalization strips L1 economic rent, exposing stakers to real negative carry." }
      ],
      transcript: [
        { type: "chair", who: "CHAIR", time: "11:00:00", text: "Floor opened for Ethereum (ETH): 'Does Layer-2 fragmentation permanently impair Ethereum's fee accrual moat?'" },
        { type: "analysis", who: "Benjamin Graham", time: "11:02:40", text: "Ethereum is unique in generating tangible staking yields. However, if transactions move to L2s paying negligible blob fees, the P/E ratio on L1 revenue explodes upwards. That weakens the margin of safety." },
        { type: "chair", who: "CHAIR", time: "11:35:00", text: "VERDICT RECORDED: PASS (5 / 9 plurality). Dissent: 4 ADD, 2 REDUCE." }
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
        positionSizeBand: "0.5 – 1.5%",
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
        { seat: 1, name: "Benjamin Graham", shortName: "Graham", school: "VALUE", discipline: "Margin of safety", vote: "REDUCE", reason: "Token emissions outpace organic burn, diluting underlying holder equity." },
        { seat: 2, name: "Charlie Munger", shortName: "Munger", school: "VALUE", discipline: "Mental models", vote: "REDUCE", reason: "Institutions using subnets have no economic reason to enrich AVAX spot holders." },
        { seat: 3, name: "Peter Lynch", shortName: "Lynch", school: "GROWTH", discipline: "Know what you own", vote: "PASS", reason: "Solid gaming and enterprise trials, but end-user retail traction is lagging." },
        { seat: 4, name: "Cathie Wood", shortName: "Wood", school: "GROWTH", discipline: "Growth and disruption", vote: "ADD", reason: "Subnet architecture represents a breakthrough in customizable sovereign application chains." },
        { seat: 5, name: "Aswath Damodaran", shortName: "Damodaran", school: "VALUATION", discipline: "Story into numbers", vote: "REDUCE", reason: "Cost of capital exceeds protocol fee capture; net negative cash margins." },
        { seat: 6, name: "Nassim Nicholas Taleb", shortName: "Taleb", school: "RISK", discipline: "Tail risk", vote: "REDUCE", reason: "Ecosystem relies heavily on subsidized incentive programs that shatter when treasury dries up." },
        { seat: 7, name: "Mohnish Pabrai", shortName: "Pabrai", school: "VALUE", discipline: "Low risk, high uncertainty", vote: "PASS", reason: "Uncertainty is too high without clear downside protection." },
        { seat: 8, name: "Bill Ackman", shortName: "Ackman", school: "CONCENTRATION", discipline: "Concentrated conviction", vote: "REDUCE", reason: "Subnet dilution prevents concentrated value capture at the root governance token." },
        { seat: 9, name: "Michael Burry", shortName: "Burry", school: "CONTRARIAN", discipline: "Contrarian audit", vote: "REDUCE", reason: "Scheduled unlocks and validator emissions represent continuous sell-side overhang." }
      ],
      transcript: [
        { type: "chair", who: "CHAIR", time: "16:15:00", text: "Chamber convened on Avalanche (AVAX)." },
        { type: "verdict", who: "CHAIR", time: "16:48:00", text: "VERDICT RECORDED: REDUCE (6 / 9 majority). Dissent: 2 PASS, 1 ADD." }
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
        positionSizeBand: "2.5 – 4.0%",
        keyAgreement: "Chainlink maintains a nearly unbreachable monopoly as the critical standard for blockchain data connectivity.",
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
        { seat: 1, name: "Benjamin Graham", shortName: "Graham", school: "VALUE", discipline: "Margin of safety", vote: "PASS", reason: "Monopolistic market share provides defensive comfort, but fee capture model remains young." },
        { seat: 2, name: "Charlie Munger", shortName: "Munger", school: "VALUE", discipline: "Mental models", vote: "ADD", reason: "Like the plumbing in a major city: you cannot easily replace the pipes without breaking the buildings." },
        { seat: 3, name: "Peter Lynch", shortName: "Lynch", school: "GROWTH", discipline: "Know what you own", vote: "ADD", reason: "Standard of the industry. When everyone needs your data feed, you have pricing power." },
        { seat: 4, name: "Cathie Wood", shortName: "Wood", school: "GROWTH", discipline: "Growth and disruption", vote: "ADD", reason: "The universal interoperability protocol connecting legacy finance to decentralized blockchains." },
        { seat: 5, name: "Aswath Damodaran", shortName: "Damodaran", school: "VALUATION", discipline: "Story into numbers", vote: "PASS", reason: "Essential infrastructure, but valuation trades at speculative multiple to current fee capture." },
        { seat: 6, name: "Nassim Nicholas Taleb", shortName: "Taleb", school: "RISK", discipline: "Tail risk", vote: "ADD", reason: "Battle-tested during historic market flash crashes without critical oracle failure." },
        { seat: 7, name: "Mohnish Pabrai", shortName: "Pabrai", school: "VALUE", discipline: "Low risk, high uncertainty", vote: "ADD", reason: "Toll bridge on all institutional smart contracts; asymmetric risk profile." },
        { seat: 8, name: "Bill Ackman", shortName: "Ackman", school: "CONCENTRATION", discipline: "Concentrated conviction", vote: "ADD", reason: "Defensible competitive moat; near-zero customer churn and SWIFT/DTCC relationships." },
        { seat: 9, name: "Michael Burry", shortName: "Burry", school: "CONTRARIAN", discipline: "Contrarian audit", vote: "REDUCE", reason: "Foundation token distribution history warrants caution; enterprise pilots take years to monetize." }
      ],
      transcript: [
        { type: "chair", who: "CHAIR", time: "10:10:00", text: "Chamber convened on Chainlink (LINK)." },
        { type: "verdict", who: "CHAIR", time: "10:45:00", text: "VERDICT RECORDED: ADD (6 / 9 majority). Dissent: 1 REDUCE, 2 PASS." }
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
