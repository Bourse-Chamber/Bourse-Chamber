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
    // Artificial realistic latency (350ms)
    await BourseUtils.sleep(350);

    const clean = query.trim().toUpperCase();
    const words = clean.split(/[^A-Z0-9]/).filter(w => w.length > 0);
    const matchedTicker = Object.keys(KNOWN_ASSETS).find(t => words.includes(t) || clean.includes(t));

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
        { seat: 1, name: "Benjamin Graham", school: "VALUE", discipline: "Margin of safety", vote: "REDUCE", reason: "Current valuation assumes indefinite speculative volume. Lacks a tangible cash margin of safety." },
        { seat: 2, name: "Charlie Munger", school: "VALUE", discipline: "Mental models", vote: "REDUCE", reason: "Invert: validator economics and state bloat represent unmodeled operational fragilities." },
        { seat: 3, name: "Warren Buffett", school: "VALUE", discipline: "Quality / economics", vote: "REDUCE", reason: "Raw throughput is an engineering specification, not a durable monopoly toll moat." },
        { seat: 4, name: "Peter Lynch", school: "GROWTH", discipline: "Growth at reasonable price", vote: "ADD", reason: "Organic retail user volume is observable in real life; consumer apps are choosing Solana." },
        { seat: 5, name: "Howard Marks", school: "RISK", discipline: "Risk / cycles", vote: "PASS", reason: "Pendulum has swung from existential post-FTX distress to excessive euphoria; wait for equilibrium." },
        { seat: 6, name: "Ray Dalio", school: "MACRO", discipline: "Macro / regime", vote: "PASS", reason: "High-beta technology asset rather than a neutral macro reserve; maintain neutral benchmark weight." },
        { seat: 7, name: "Cathie Wood", school: "GROWTH", discipline: "Innovation / disruption", vote: "ADD", reason: "Frictionless execution and monolithic composability represent the future of decentralized finance." },
        { seat: 8, name: "Michael Burry", school: "CONTRARIAN", discipline: "Contrarian / asymmetric risk", vote: "REDUCE", reason: "Concentrated venture backing and reflexive liquidity loops create an asymmetric downside trap." },
        { seat: 9, name: "Nassim Nicholas Taleb", school: "RISK", discipline: "Tail risk / antifragility", vote: "ADD", reason: "Demonstrated antifragility by surviving catastrophic external collapse and regaining network velocity." }
      ],
      transcript: [
        { type: "chair", who: "CHAIR", time: "09:12:00", text: "Floor is open. Thesis filed for Solana (SOL): 'Is throughput a moat, or a commodity waiting to be priced?' Evidence pack distributed to all nine seats." },
        { type: "analysis", who: "Benjamin Graham", time: "09:14:02", text: "The margin of safety depends on whether the current $66.8B valuation is supported by cash-generating economics. At 2,850 TPS with nominal fees, the protocol burns capital to subsidize hardware validators. Without a floor, price is tethered only to sentiment." },
        { type: "analysis", who: "Peter Lynch", time: "09:15:30", text: "Walk into any developer hackathon. Builders aren't modeling multi-layered rollup abstractions; they are deploying on Solana because it works in sub-seconds. That is organic adoption you can touch." },
        { type: "analysis", who: "Nassim Nicholas Taleb", time: "09:17:15", text: "Solana survived the FTX collapse—an absorbing barrier that shatters fragile systems. What does not kill you makes you antifragile. That convex resilience has mathematical value." },
        { type: "analysis", who: "Charlie Munger", time: "09:18:40", text: "Invert the thesis. If high throughput is commoditized by hardware advances and rival chains, the fee moat collapses to zero while state storage costs compound. That is a terrible business model." },
        { type: "chair", who: "CHAIR", time: "09:22:10", text: "Divergence detected on Moat Durability between Graham (Seat 01) and Wood (Seat 07). Cross-examination floor opened." },
        { type: "challenge", who: "Benjamin Graham", time: "09:23:00", text: "Graham challenges Wood: 'Your exponential S-curve model assumes users will permanently pay fees on an asset that can be cloned with 50 lines of configuration. What protects your capital if fees race to zero?'" },
        { type: "response", who: "Cathie Wood", time: "09:24:18", text: "Wood responds: 'Graham is evaluating a decentralized internet protocol like a 1930s railroad company. Metcalfe's law of network liquidity creates an unassailable ecosystem moat that far outpaces simple code forks.'" },
        { type: "chair", who: "CHAIR", time: "09:30:00", text: "Cross-examination concluded. All nine seats will now cast formal ballots: ADD, REDUCE, or PASS." },
        { type: "vote", who: "Graham, Munger, Buffett, Burry", time: "09:35:10", text: "Seats 01, 02, 03, 08 cast REDUCE ballots citing moat commoditization and valuation risk." },
        { type: "vote", who: "Lynch, Wood, Taleb", time: "09:36:20", text: "Seats 04, 07, 09 cast ADD ballots citing organic adoption and proven antifragility." },
        { type: "vote", who: "Marks, Dalio", time: "09:37:45", text: "Seats 05, 06 cast PASS ballots citing cyclical sentiment extension and macro regime neutrality." },
        { type: "verdict", who: "CHAIR", time: "09:47:00", text: "VERDICT RECORDED: REDUCE (5 / 9 majority). Dissent: 3 ADD, 1 PASS. Sizing band: 1.0 – 2.0%. Session closed and committed to permanent ledger." }
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
        majorityRatio: "6 / 9",
        dissentBreakdown: "2 REDUCE, 1 PASS",
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
        { seat: 1, name: "Benjamin Graham", school: "VALUE", discipline: "Margin of safety", vote: "PASS", reason: "Monetary brand acknowledged, but absence of cash flow floor warrants caution over accumulation." },
        { seat: 2, name: "Charlie Munger", school: "VALUE", discipline: "Mental models", vote: "REDUCE", reason: "Remains an artificial speculative token with excessive social friction and non-productive economics." },
        { seat: 3, name: "Warren Buffett", school: "VALUE", discipline: "Quality / economics", vote: "PASS", reason: "Non-productive asset: does not produce food, oil, or dividends. Neutral stance." },
        { seat: 4, name: "Peter Lynch", school: "GROWTH", discipline: "Growth at reasonable price", vote: "ADD", reason: "Global brand awareness is total; institutional adoption has crossed the chasm." },
        { seat: 5, name: "Howard Marks", school: "RISK", discipline: "Risk / cycles", vote: "ADD", reason: "Cycle placement shows steady accumulation rather than late-stage blow-off mania." },
        { seat: 6, name: "Ray Dalio", school: "MACRO", discipline: "Macro / regime", vote: "ADD", reason: "Essential non-debt reserve alternative in an era of aggressive sovereign debt monetization." },
        { seat: 7, name: "Cathie Wood", school: "GROWTH", discipline: "Innovation / disruption", vote: "ADD", reason: "Global monetary protocol on track for multi-trillion market capture; supreme conviction." },
        { seat: 8, name: "Michael Burry", school: "CONTRARIAN", discipline: "Contrarian / asymmetric risk", vote: "REDUCE", reason: "Derivative leverage concentration creates severe risk of flash liquidations." },
        { seat: 9, name: "Nassim Nicholas Taleb", school: "RISK", discipline: "Tail risk / antifragility", vote: "ADD", reason: "Proven survival through multiple 80% drawdowns without bankruptcy gives it convexity." }
      ],
      transcript: [
        { type: "chair", who: "CHAIR", time: "14:20:00", text: "Floor convenes. Examination of Bitcoin (BTC): 'Is BTC still a reasonable core holding at current market levels?'" },
        { type: "analysis", who: "Ray Dalio", time: "14:22:15", text: "When global debt-to-GDP hits historical extremes, central banks are forced to devalue fiat purchasing power. Gold has played the neutral reserve role for millennia; BTC is rapidly assuming that role in digital capital markets." },
        { type: "analysis", who: "Charlie Munger", time: "14:24:00", text: "It is an index of human gullibility. Just because you have a ledger that limits supply does not mean you have created an asset that blesses society. Invert it: what happens when governments decide currency issuance is non-negotiable?" },
        { type: "analysis", who: "Howard Marks", time: "14:26:30", text: "The psychological pendulum on BTC is currently at measured optimism, not hysterical euphoria. Sizing appropriately when sentiment is rational is the hallmark of second-level discipline." },
        { type: "chair", who: "CHAIR", time: "14:32:00", text: "Cross-examination: Dalio (Seat 06) vs Munger (Seat 02) on Macro Reserve Necessity." },
        { type: "challenge", who: "Ray Dalio", time: "14:33:10", text: "Dalio challenges Munger: 'Charlie, if you hold 100% in sovereign fiat bonds that are mathematically guaranteed to be inflated away to pay entitlements, is that not far riskier than holding a 3% allocation in a hard mathematical supply cap?'" },
        { type: "response", who: "Charlie Munger", time: "14:34:50", text: "Munger responds: 'I would rather hold productive farms and factories that generate food and energy during inflation than rely on a cryptographic talisman whose only utility is finding another buyer tomorrow.'" },
        { type: "chair", who: "CHAIR", time: "14:42:00", text: "Debate concluded. Roll-call voting commencing across all nine seats." },
        { type: "verdict", who: "CHAIR", time: "14:52:00", text: "VERDICT RECORDED: ADD (6 / 9 majority). Dissent: 2 REDUCE, 1 PASS. Position size band: 3.0 – 5.0%." }
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
        dissentBreakdown: "3 ADD, 1 REDUCE",
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
        { seat: 1, name: "Benjamin Graham", school: "VALUE", discipline: "Margin of safety", vote: "PASS", reason: "3.2% staking yield offers cash flow, but compressed L1 burn clouds earnings visibility." },
        { seat: 2, name: "Charlie Munger", school: "VALUE", discipline: "Mental models", vote: "REDUCE", reason: "Unnecessary complexity and agency dilemmas between L1 and competing L2 teams." },
        { seat: 3, name: "Warren Buffett", school: "VALUE", discipline: "Quality / economics", vote: "PASS", reason: "Unclear whether the moat belongs to the rail or the trains running on it." },
        { seat: 4, name: "Peter Lynch", school: "GROWTH", discipline: "Growth at reasonable price", vote: "ADD", reason: "Massive developer ecosystem and genuine financial applications running continuously." },
        { seat: 5, name: "Howard Marks", school: "RISK", discipline: "Risk / cycles", vote: "PASS", reason: "Sentiment is deeply divided; neither extreme fear nor greed." },
        { seat: 6, name: "Ray Dalio", school: "MACRO", discipline: "Macro / regime", vote: "PASS", reason: "Decentralized world computer narrative still competing with simpler monetary metals." },
        { seat: 7, name: "Cathie Wood", school: "GROWTH", discipline: "Innovation / disruption", vote: "ADD", reason: "The foundational settlement layer for global financial market tokenization." },
        { seat: 8, name: "Michael Burry", school: "CONTRARIAN", discipline: "Contrarian / asymmetric risk", vote: "PASS", reason: "Underperforming expectations creates potential contrarian value, but liquidity fragmentation is real." },
        { seat: 9, name: "Nassim Nicholas Taleb", school: "RISK", discipline: "Tail risk / antifragility", vote: "ADD", reason: "Longest unbroken track record of smart contract execution and battle-tested consensus." }
      ],
      transcript: [
        { type: "chair", who: "CHAIR", time: "11:00:00", text: "Floor opened for Ethereum (ETH): 'Does Layer-2 fragmentation permanently impair Ethereum's fee accrual moat?'" },
        { type: "analysis", who: "Benjamin Graham", time: "11:02:40", text: "Ethereum is unique in generating tangible staking yields. However, if transactions move to L2s paying negligible blob fees, the P/E ratio on L1 revenue explodes upwards. That weakens the margin of safety." },
        { type: "chair", who: "CHAIR", time: "11:35:00", text: "VERDICT RECORDED: PASS (5 / 9 majority). Dissent: 3 ADD, 1 REDUCE." }
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
        { seat: 1, name: "Benjamin Graham", school: "VALUE", discipline: "Margin of safety", vote: "REDUCE", reason: "Token emissions outpace organic burn, diluting underlying holder equity." },
        { seat: 2, name: "Charlie Munger", school: "VALUE", discipline: "Mental models", vote: "REDUCE", reason: "Institutions using subnets have no economic reason to enrich AVAX spot holders." },
        { seat: 3, name: "Warren Buffett", school: "VALUE", discipline: "Quality / economics", vote: "REDUCE", reason: "No enduring moat against other layer-1 architectures." },
        { seat: 4, name: "Peter Lynch", school: "GROWTH", discipline: "Growth at reasonable price", vote: "PASS", reason: "Solid gaming and enterprise trials, but end-user retail traction is lagging." },
        { seat: 5, name: "Howard Marks", school: "RISK", discipline: "Risk / cycles", vote: "PASS", reason: "Valuation compressed, but risk premium does not yet compensate for dilution." },
        { seat: 6, name: "Ray Dalio", school: "MACRO", discipline: "Macro / regime", vote: "REDUCE", reason: "Secondary tier asset vulnerable to global liquidity retrenchment." },
        { seat: 7, name: "Cathie Wood", school: "GROWTH", discipline: "Innovation / disruption", vote: "ADD", reason: "Subnet architecture represents a breakthrough in customizable sovereign application chains." },
        { seat: 8, name: "Michael Burry", school: "CONTRARIAN", discipline: "Contrarian / asymmetric risk", vote: "REDUCE", reason: "Scheduled unlocks and validator emissions represent continuous sell-side overhang." },
        { seat: 9, name: "Nassim Nicholas Taleb", school: "RISK", discipline: "Tail risk / antifragility", vote: "REDUCE", reason: "Ecosystem relies heavily on subsidized incentive programs that shatter when treasury dries up." }
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
        majorityRatio: "7 / 9",
        dissentBreakdown: "1 REDUCE, 1 PASS",
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
        { seat: 1, name: "Benjamin Graham", school: "VALUE", discipline: "Margin of safety", vote: "PASS", reason: "Monopolistic market share provides defensive comfort, but fee capture model remains young." },
        { seat: 2, name: "Charlie Munger", school: "VALUE", discipline: "Mental models", vote: "ADD", reason: "Like the plumbing in a major city: you cannot easily replace the pipes without breaking the buildings." },
        { seat: 3, name: "Warren Buffett", school: "VALUE", discipline: "Quality / economics", vote: "ADD", reason: "A genuine toll bridge on digital transactions with massive switching friction." },
        { seat: 4, name: "Peter Lynch", school: "GROWTH", discipline: "Growth at reasonable price", vote: "ADD", reason: "Standard of the industry. When everyone needs your data feed, you have pricing power." },
        { seat: 5, name: "Howard Marks", school: "RISK", discipline: "Risk / cycles", vote: "ADD", reason: "Valuation is disciplined relative to historical peaks; asymmetry favors long-term hold." },
        { seat: 6, name: "Ray Dalio", school: "MACRO", discipline: "Macro / regime", vote: "ADD", reason: "Indispensable infrastructure for institutional real-world asset integration." },
        { seat: 7, name: "Cathie Wood", school: "GROWTH", discipline: "Innovation / disruption", vote: "ADD", reason: "The universal interoperability protocol connecting legacy finance to decentralized blockchains." },
        { seat: 8, name: "Michael Burry", school: "CONTRARIAN", discipline: "Contrarian / asymmetric risk", vote: "REDUCE", reason: "Foundation token distribution history warrants caution; enterprise pilots take years to monetize." },
        { seat: 9, name: "Nassim Nicholas Taleb", school: "RISK", discipline: "Tail risk / antifragility", vote: "ADD", reason: "Battle-tested during historic market flash crashes without critical oracle failure." }
      ],
      transcript: [
        { type: "chair", who: "CHAIR", time: "10:10:00", text: "Chamber convened on Chainlink (LINK)." },
        { type: "verdict", who: "CHAIR", time: "10:45:00", text: "VERDICT RECORDED: ADD (7 / 9 majority). Dissent: 1 REDUCE, 1 PASS." }
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
