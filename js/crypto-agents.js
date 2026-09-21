/**
 * Bourse Chamber — Canonical 9 Crypto Personas Matrix
 * 9 Crypto Architects · 5 Core Schools · Deliberation Logic & Traits
 */

const BourseCryptoAgents = (() => {
  const SCHOOLS = ['ALL', 'CYPHERPUNK', 'COMPUTATION', 'MONOLITHIC', 'MACRO', 'TREASURY', 'LIQUIDITY', 'INSTITUTIONAL'];

  const AGENTS = [
    {
      seat: 1,
      name: "Satoshi Nakamoto",
      shortName: "Satoshi",
      discipline: "Sound money & Cypherpunk PoW",
      school: "CYPHERPUNK",
      era: "2008–2010",
      philosophy: "Treats trust as a fundamental vulnerability. Argues that any system requiring human intermediaries, discretionary inflation, or trusted third parties will inevitably fail.",
      asks: [
        "Does this protocol rely on a trusted third party, foundation, or centralized sequencer?",
        "Can an ordinary user run a validating full node on consumer-grade hardware?",
        "What mathematically prevents state actors or cartels from censoring transactions on this ledger?"
      ],
      bio: "The pseudonymous creator of Bitcoin. Solved the Byzantine Generals Problem using Proof-of-Work and absolute mathematical scarcity (21M cap). Disdains pre-mines, foundation subsidies, and centralized governance.",
      quote: "The root problem with conventional currency is all the trust that's required to make it work.",
      primaryMetric: "Full Node Verifiability & Cost of 51% Consensus Attack",
      fatalFlaw: "Extreme protocol ossification risks inability to scale execution throughput to accommodate global transactional velocity.",
      firstQuestion: "What trusted human intermediary is pretending to be a decentralized protocol here?",
      record: { sessions: 42, votedFor: 10, dissents: 32 },
      traits: { decentralizationBias: 10, censorshipResistance: 10, securityFocus: 10, throughputBias: 1 },
      generateAnalysis(asset, evidence) {
        const isBtc = asset.ticker === 'BTC';
        return {
          position: isBtc ? "Pristine Byzantine Consensus" : "Centralized Trust Surface",
          confidence: isBtc ? 96 : 82,
          argument: isBtc
            ? `On ${asset.ticker}: This ledger remains the sole monetary innovation that completely eliminates trusted third parties. With a fixed supply cap and decentralized proof-of-work, no foundation can inflate its baseline issuance.`
            : `On ${asset.ticker}: Trust is an architectural defect. At ${evidence.priceFormatted} and ${evidence.marketCapFormatted}, who controls the sequencer keys and validator sets? Any protocol reliant on foundation coordination is merely legacy banking in disguise.`,
          keyRisk: isBtc ? "Mining pool concentration and protocol ossification." : "Trusted third party control, validator collusion, or regulatory censorship.",
          keyEvidence: isBtc ? "Unhashed proof-of-work difficulty adjustment ensures 100% computational finality." : "Token governance distribution reveals significant foundation and insider allocations.",
          preliminaryVote: isBtc ? "ADD" : "REDUCE"
        };
      },
      generateChallenge(opponent) {
        return `To ${opponent.name}: You speak of ${opponent.discipline}, but who holds the admin keys? If the founders are subpoenaed or servers seized, does this ledger continue to produce blocks without human intervention?`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: Trust is a vulnerability, not a feature. Replacing one corruptible central bank with a five-of-nine multisig foundation is an institutional regression, not cryptographic progress.`;
      },
      generateVote(asset, evidence) {
        if (asset.ticker === 'BTC') {
          return { vote: "ADD", rationale: "Pristine Byzantine agreement and immutable 21M supply cap with zero counterparty risk." };
        }
        return { vote: "REDUCE", rationale: "Protocol introduces trusted third parties and centralized governance dependencies." };
      }
    },
    {
      seat: 2,
      name: "Vitalik Buterin",
      shortName: "Vitalik",
      discipline: "Programmable logic & Mechanism design",
      school: "COMPUTATION",
      era: "2013–present",
      philosophy: "Treats blockchain as a global, permissionless world computer. Solves coordination failures through cryptographic mechanism design, public goods funding, and rollup-centric scaling.",
      asks: [
        "Is the mechanism design resilient to collusion, MEV extraction, and economic griefing?",
        "Does this solve a genuine social coordination dilemma or merely reinvent a distributed database?",
        "What is the trust-minimized decentralization roadmap for sequencers and proof systems?"
      ],
      bio: "Co-founder of Ethereum. Pioneered Turing-complete smart contracts, automated market makers, and Ethereum's transition to Proof-of-Stake. Relentlessly models cryptoeconomic mechanism design and public goods.",
      quote: "Blockchain solves the problem of manipulating data, but mechanism design solves the problem of manipulating people.",
      primaryMetric: "Developer Ecosystem Density & L2 Data Availability Bandwidth",
      fatalFlaw: "Multilayer modular complexity creates user experience fragmentation and severe composability risks across bridges.",
      firstQuestion: "How does this mechanism prevent economic collusion and validator centralization at scale?",
      record: { sessions: 45, votedFor: 28, dissents: 17 },
      traits: { decentralizationBias: 9, censorshipResistance: 9, securityFocus: 8, throughputBias: 6 },
      generateAnalysis(asset, evidence) {
        const hasCompute = ['ETH', 'SOL', 'AVAX', 'NEAR', 'LINK'].includes(asset.ticker);
        return {
          position: hasCompute ? "Constructive Mechanism Design" : "Limited Programmability",
          confidence: 88,
          argument: `On ${asset.ticker}: Evaluating state transition throughput and mechanism design. At ${evidence.priceFormatted}, we must verify whether network fee structures fund durable public goods or merely reward extractive MEV bots. Decentralized proof verification must remain accessible.`,
          keyRisk: "Sequencer centralization and economic griefing vulnerabilities.",
          keyEvidence: "Data availability bandwidth and developer commits over the trailing 12-month period.",
          preliminaryVote: hasCompute ? "ADD" : "PASS"
        };
      },
      generateChallenge(opponent) {
        return `To ${opponent.name}: How does your economic model prevent cartelization and MEV extraction? Without formal cryptoeconomic mechanism design, your security model collapses into economic oligarchy.`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: Monolithic ossification cannot solve complex human coordination. Modularity and cryptographic validity proofs allow scaling without sacrificing individual validator verifiability.`;
      },
      generateVote(asset, evidence) {
        if (['ETH', 'SOL', 'LINK'].includes(asset.ticker)) {
          return { vote: "ADD", rationale: "Durable developer network effects and active mechanism design experimentation." };
        }
        return { vote: "PASS", rationale: "Awaiting formal verification of rollup decentralization and MEV mitigation." };
      }
    },
    {
      seat: 3,
      name: "Hal Finney",
      shortName: "Finney",
      discipline: "Cryptographic privacy & First principles",
      school: "CYPHERPUNK",
      era: "1990–2014",
      philosophy: "Privacy is the indispensable foundation of human liberty. A public ledger that leaks identity is merely a transparent panopticon for state surveillance and financial blacklisting.",
      asks: [
        "Does this architecture mathematically protect individual financial anonymity and sovereignty?",
        "Is the cryptographic foundation open, peer-reviewed, and free of proprietary backdoors?",
        "Can this protocol survive an adversarial nation-state actively hunting node operators?"
      ],
      bio: "Legendary cypherpunk and cryptographer. Created Reusable Proofs of Work (RPOW) in 2004 and was the first recipient of a Bitcoin transaction from Satoshi Nakamoto. Dedicated his career to cryptographic privacy and digital freedom.",
      quote: "Computer technology is on the verge of providing the ability for individuals and groups to communicate and interact in a totally anonymous manner.",
      primaryMetric: "On-Chain Anonymity Set Size & Cryptographic Soundness",
      fatalFlaw: "Uncompromising anonymity architecture invites relentless regulatory and banking interdiction from sovereign governments.",
      firstQuestion: "Can a dissident survive economically on this network without exposing their physical identity?",
      record: { sessions: 39, votedFor: 14, dissents: 25 },
      traits: { decentralizationBias: 10, censorshipResistance: 10, securityFocus: 10, throughputBias: 2 },
      generateAnalysis(asset, evidence) {
        const isSecure = ['BTC', 'ETH'].includes(asset.ticker);
        return {
          position: isSecure ? "Sovereign Proof Base" : "Surveillance Panopticon Risk",
          confidence: 90,
          argument: `On ${asset.ticker}: We did not design cryptographic cash to construct a surveillance ledger for central authorities. At ${evidence.priceFormatted}, can an individual transact without permission, identity disclosure, or risk of retroactive account blacklisting?`,
          keyRisk: "Address graph clustering and lack of native zero-knowledge privacy guarantees.",
          keyEvidence: "Base-layer transaction metadata remains completely transparent to commercial blockchain analysis firms.",
          preliminaryVote: isSecure ? "ADD" : "REDUCE"
        };
      },
      generateChallenge(opponent) {
        return `To ${opponent.name}: You celebrate ${opponent.discipline}, but every transaction on this network is permanently indexed and surveillance-ready. Where is the individual right to cryptographic privacy?`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: Transparent ledgers become weaponized panopticons the moment state actors correlate wallet clusters. Privacy must be built into the base math, not treated as an optional feature.`;
      },
      generateVote(asset, evidence) {
        if (asset.ticker === 'BTC') {
          return { vote: "ADD", rationale: "Unbroken cryptographic foundation and peer-to-peer sovereign verification." };
        }
        return { vote: "PASS", rationale: "Deficient base-layer financial privacy guarantees preclude an unreserved Add ballot." };
      }
    },
    {
      seat: 4,
      name: "Nick Szabo",
      shortName: "Szabo",
      discipline: "Trust minimization & Smart contracts",
      school: "COMPUTATION",
      era: "1994–present",
      philosophy: "Trusted third parties are security holes. Smart contracts must convert subjective human promises into unforgeably costly, algorithmic settlement.",
      asks: [
        "Is the settlement unforgeably costly, or merely social consensus dressed up as code?",
        "What subjective legal loopholes are being replaced by deterministic, immutable code execution?",
        "Can the protocol state be retroactively altered by governance multisigs or emergency hard forks?"
      ],
      bio: "Computer scientist, legal scholar, and cryptographer who coined the term 'Smart Contracts' in 1994 and designed Bit Gold (the direct precursor to Bitcoin). Pioneer of trust minimization and institutional economics of money.",
      quote: "Trusted third parties are security holes.",
      primaryMetric: "Trust-Minimization Ratio & Algorithmic Enforcement Invariance",
      fatalFlaw: "Extreme contract immutability leaves zero institutional recourse when flawed code is exploited or drained.",
      firstQuestion: "Show me the trusted third party you are attempting to conceal behind technical jargon.",
      record: { sessions: 40, votedFor: 16, dissents: 24 },
      traits: { decentralizationBias: 9, censorshipResistance: 10, securityFocus: 9, throughputBias: 3 },
      generateAnalysis(asset, evidence) {
        return {
          position: "Algorithmic Settlement Review",
          confidence: 86,
          argument: `On ${asset.ticker}: Examining whether settlement is unforgeably costly. At ${evidence.priceFormatted}, if a contract requires emergency intervention by a foundation multisig, it is not a smart contract—it is a traditional contract enforced by unaccountable administrators.`,
          keyRisk: "Governance mutability and protocol administrative backdoors.",
          keyEvidence: "Protocol parameter modifications remain subject to human voting cartels rather than immutable algorithmic constraints.",
          preliminaryVote: "PASS"
        };
      },
      generateChallenge(opponent) {
        return `To ${opponent.name}: Show me where the trusted third party is hidden. If human consensus, social hard forks, or foundation councils can rewrite state, you are merely trading counterparty promises.`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: Subjective legal courts fail across international jurisdictions. Deterministic, algorithmic execution is the only durable institutional foundation for global commerce.`;
      },
      generateVote(asset, evidence) {
        if (asset.ticker === 'BTC') {
          return { vote: "ADD", rationale: "Unforgeable costliness in proof-of-work consensus with absolute immutability." };
        }
        return { vote: "REDUCE", rationale: "Excessive governance discretion and mutable administrative surface." };
      }
    },
    {
      seat: 5,
      name: "Anatoly Yakovenko",
      shortName: "Anatoly",
      discipline: "Monolithic execution & Hardware scaling",
      school: "MONOLITHIC",
      era: "2017–present",
      philosophy: "Physics is the only fundamental barrier. Scale blockchain throughput to the speed of light and Moore's Law on a unified atomic state machine without layer-2 fragmentation.",
      asks: [
        "Does transaction throughput scale linearly with commodity hardware and GPU compute improvements?",
        "Why fragment liquidity across 50 bridges when a single global state machine can execute 50,000 TPS?",
        "What is the deterministic block propagation latency under global network congestion?"
      ],
      bio: "Co-founder of Solana. Former Qualcomm wireless engineer who invented Proof of History (PoH), enabling distributed clock synchronization across nodes and high-frequency concurrent smart contract execution.",
      quote: "Hardware gets faster, bandwidth gets cheaper. A blockchain should be built to run as fast as the underlying hardware allows.",
      primaryMetric: "True Sustained TPS Under Load & Global Atomic Composability",
      fatalFlaw: "Demanding hardware specifications for validator nodes concentrate infrastructure among institutional data centers.",
      firstQuestion: "Why should users pay 50-dollar gas fees when we can saturate fiber-optic lines at 50,000 TPS?",
      record: { sessions: 44, votedFor: 26, dissents: 18 },
      traits: { decentralizationBias: 5, censorshipResistance: 6, securityFocus: 6, throughputBias: 10 },
      generateAnalysis(asset, evidence) {
        const isHighThroughput = ['SOL', 'AVAX', 'NEAR', 'SUI', 'APT'].includes(asset.ticker);
        return {
          position: isHighThroughput ? "Monolithic Performance Benchmark" : "Throughput Constrained",
          confidence: 89,
          argument: `On ${asset.ticker}: Physics is the hard ceiling. At ${evidence.priceFormatted}, if transactions cost dollars and take minutes to confirm, mainstream applications cannot function. We must saturate global fiber-optic bandwidth on an atomic, composable state machine.`,
          keyRisk: "Network halt under extreme packet storms and validator hardware barriers.",
          keyEvidence: "Transaction throughput benchmarks and block finality latency under adversarial load.",
          preliminaryVote: isHighThroughput ? "ADD" : "PASS"
        };
      },
      generateChallenge(opponent) {
        return `To ${opponent.name}: Why force users into asynchronous rollups and bridge exploits when commodity hardware can execute 50,000 TPS on an atomic global state? Modularity is an excuse for bad engineering.`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: Hardware gets faster and bandwidth gets cheaper every year. Building a financial system for 10 transactions per second is like optimizing the internet for 56k dial-up modems.`;
      },
      generateVote(asset, evidence) {
        if (['SOL', 'AVAX'].includes(asset.ticker)) {
          return { vote: "ADD", rationale: "High-throughput execution capability and monolithic composability." };
        }
        return { vote: "PASS", rationale: "Execution throughput limitations prevent high-frequency global adoption." };
      }
    },
    {
      seat: 6,
      name: "Arthur Hayes",
      shortName: "Hayes",
      discipline: "Macro liquidity & Crypto reflexivity",
      school: "MACRO",
      era: "2014–present",
      philosophy: "Crypto is the purest expression of global fiat debasement. Track the Federal Reserve balance sheet, bank term funding, and currency depreciation; everything else is narrative distraction.",
      asks: [
        "Where is global net fiat liquidity flowing, and how does it lever into this token's volatility curve?",
        "Is this asset reflexive enough to survive a sharp liquidity squeeze when real yields spike?",
        "Who is the marginal forced seller during a cascading weekend perpetual liquidation?"
      ],
      bio: "Co-founder of BitMEX and CIO of Maelstrom. Invented the perpetual swap contract, the highest volume financial instrument in digital asset history. Acclaimed macro commentator on central bank balance sheets and fiat debasement.",
      quote: "If you don't own Bitcoin and gold, you are trusting bankrupt governments to preserve your purchasing power. Good luck with that.",
      primaryMetric: "Net Global Dollar Liquidity Index & Perpetual Funding Rate Dynamics",
      fatalFlaw: "Cynical prioritization of speculative reflexivity and macro leverage over underlying technical utility and decentralization.",
      firstQuestion: "How does global central bank money printing flow into this token's balance of payments?",
      record: { sessions: 46, votedFor: 27, dissents: 19 },
      traits: { decentralizationBias: 6, censorshipResistance: 7, securityFocus: 5, throughputBias: 7 },
      generateAnalysis(asset, evidence) {
        const isLiquid = ['BTC', 'ETH', 'SOL'].includes(asset.ticker);
        return {
          position: isLiquid ? "High Beta Liquidity Sponge" : "Illiquid Convexity Play",
          confidence: 85,
          argument: `On ${asset.ticker}: Central banks have no choice but to inflate their sovereign debt away. At ${evidence.priceFormatted} with 24h volume of ${evidence.volume24hFormatted}, this asset acts as a high-powered liquidity sponge absorbing global fiat debasement. Watch the funding rates.`,
          keyRisk: "Sharp USD dollar liquidity squeezes and cascading perpetual margin liquidations.",
          keyEvidence: "Correlation with Federal Reserve net liquidity and Reverse Repo facility drain.",
          preliminaryVote: isLiquid ? "ADD" : "PASS"
        };
      },
      generateChallenge(opponent) {
        return `To ${opponent.name}: While you obsess over academic whitepapers, the Federal Reserve is debasing the dollar by trillions. How does this asset capture global fiat liquidity when the money printers turn on?`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: Every market moves on liquidity and leverage. Ignoring speculative reflexivity during a central bank credit expansion guarantees you miss the entire bull cycle.`;
      },
      generateVote(asset, evidence) {
        if (['BTC', 'ETH', 'SOL'].includes(asset.ticker)) {
          return { vote: "ADD", rationale: "Prime speculative vehicle poised to capture global central bank fiat dilution." };
        }
        return { vote: "PASS", rationale: "Insufficient secondary liquidity to support institutional size during market drawdowns." };
      },
      calculatePositionSizeBand(asset, evidence, majorityOutcome) {
        if (majorityOutcome === 'REDUCE') {
          return {
            band: "0.0 – 1.0%",
            rationale: "Global fiat liquidity contraction and perpetual funding liquidation cascades mandate near-zero exposure."
          };
        }
        if (majorityOutcome === 'PASS') {
          return {
            band: "1.0 – 2.0%",
            rationale: "Strict barbell allocation: small enough to survive central bank tightening, convex enough for sudden easing."
          };
        }
        if (['BTC', 'ETH', 'SOL'].includes(asset.ticker)) {
          return {
            band: "3.0 – 5.0%",
            rationale: "Prime liquidity sponge poised to capture global central bank fiat expansion and speculative reflexivity."
          };
        }
        return {
          band: "2.0 – 3.5%",
          rationale: "Convex speculative upside, sized strictly to avoid liquidation wipeout during weekend flash crashes."
        };
      }
    },
    {
      seat: 7,
      name: "Michael Saylor",
      shortName: "Saylor",
      discipline: "Balance sheet treasury & Digital property",
      school: "TREASURY",
      era: "2020–present",
      philosophy: "All fiat currencies are melting ice cubes losing purchasing power at the rate of monetary expansion. Bitcoin is thermodynamically sound digital capital with zero counterparty risk—there is no second best.",
      asks: [
        "Does this asset possess economic thermodynamics that guarantee permanence over a 100-year horizon?",
        "Is there any foundation, venture unlock, or governance vote that can inflate its supply cap?",
        "Can a public corporation or sovereign nation hold this on its balance sheet without counterparty exposure?"
      ],
      bio: "Executive Chairman of MicroStrategy. Pioneered the institutional corporate Bitcoin treasury reserve strategy, converting corporate balance sheets into pristine digital property. Promotes Bitcoin as an indestructible monetary energy network.",
      quote: "Bitcoin is bank in cyberspace, run by software that's incorruptible, offering a global, affordable, simple, and secure savings account to billions of people.",
      primaryMetric: "Corporate Balance Sheet Adoption & Invariable Fixed Supply Cap",
      fatalFlaw: "Strict monetary maximalism refuses to acknowledge valid utility in programmable smart contracts and decentralized compute.",
      firstQuestion: "Is this pristine, thermodynamically sound digital capital, or does it have an issuing counterparty?",
      record: { sessions: 48, votedFor: 19, dissents: 29 },
      traits: { decentralizationBias: 9, censorshipResistance: 9, securityFocus: 9, throughputBias: 1 },
      generateAnalysis(asset, evidence) {
        const isBtc = asset.ticker === 'BTC';
        return {
          position: isBtc ? "Thermodynamic Digital Capital" : "Unbacked Software Speculation",
          confidence: isBtc ? 98 : 91,
          argument: isBtc
            ? `On ${asset.ticker}: Bitcoin is pristine monetary energy. At ${evidence.priceFormatted}, every corporate treasury on earth will eventually convert their melting cash reserves into this indestructible digital property. There is no second best.`
            : `On ${asset.ticker}: At ${evidence.priceFormatted}, this asset possesses an issuing counterparty, ongoing developer inflation, or governance risk. It is an equity-like software venture, not indestructible thermodynamic capital.`,
          keyRisk: isBtc ? "Regulatory overreach attempting to restrict self-custodial mining." : "Continuous token emissions, venture unlocks, and structural counterparty failure.",
          keyEvidence: isBtc ? "Cumulative institutional balance sheet holdings and fixed 21 million supply schedule." : "Token supply is not permanently hardcapped against future administrative dilution.",
          preliminaryVote: isBtc ? "ADD" : "REDUCE"
        };
      },
      generateChallenge(opponent) {
        return `To ${opponent.name}: Every software token with an active foundation has an issuer counterparty. Why risk institutional balance sheet capital on something that can be re-engineered or diluted?`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: Cash is a melting ice cube losing 10-15% purchasing power annually. Bitcoin is pure monetary thermodynamics—capital stored across time and space with zero entropy.`;
      },
      generateVote(asset, evidence) {
        if (asset.ticker === 'BTC') {
          return { vote: "ADD", rationale: "Pristine digital energy and incorruptible treasury reserve asset. There is no second best." };
        }
        return { vote: "REDUCE", rationale: "Possesses issuing counterparty risk and lacks thermodynamic supply permanence." };
      }
    },
    {
      seat: 8,
      name: "Changpeng Zhao",
      shortName: "CZ",
      discipline: "Orderbook liquidity & Mass onboarding",
      school: "LIQUIDITY",
      era: "2017–present",
      philosophy: "Liquidity begets liquidity. Friction-free user experience, deep orderbooks, and low transaction fees onboard the next billion users far faster than academic whitepapers.",
      asks: [
        "Is there sufficient secondary market depth and market maker participation to absorb institutional liquidity?",
        "Can an everyday retail user deposit, trade, and withdraw seamlessly without technical friction?",
        "Does this protocol generate real daily active wallet transactions or purely circular venture wash trading?"
      ],
      bio: "Founder and former CEO of Binance, the world's largest cryptocurrency exchange. Architect of modern high-frequency crypto trading engines, global peer-to-peer fiat gateways, and global retail distribution.",
      quote: "If you can't hold, you won't be rich. Focus on building products that real people use every single day.",
      primaryMetric: "24h Spot & Derivatives Orderbook Depth & Real Active Wallet Velocity",
      fatalFlaw: "Centralized custodial infrastructure creates systemic single points of failure and regulatory vulnerabilities.",
      firstQuestion: "Can a hundred million ordinary users use this tomorrow morning without reading a tutorial?",
      record: { sessions: 50, votedFor: 31, dissents: 19 },
      traits: { decentralizationBias: 4, censorshipResistance: 5, securityFocus: 7, throughputBias: 9 },
      generateAnalysis(asset, evidence) {
        const hasHighVolume = evidence.volume24h > 50000000;
        return {
          position: hasHighVolume ? "Deep Market Liquidity" : "Orderbook Liquidity Deficit",
          confidence: 87,
          argument: `On ${asset.ticker}: Evaluating orderbook depth and retail velocity. At ${evidence.priceFormatted} with volume of ${evidence.volume24hFormatted}, if market makers cannot provide tight bid-ask spreads, retail users get front-run. Product utility and low friction always defeat ideological purity.`,
          keyRisk: "Exchange liquidity dry-ups and punitive slippage during market panics.",
          keyEvidence: "24-hour exchange volume and cross-pair market depth across major spot orderbooks.",
          preliminaryVote: hasHighVolume ? "ADD" : "PASS"
        };
      },
      generateChallenge(opponent) {
        return `To ${opponent.name}: Your theoretical whitepaper is elegant, but where are the users? A decentralized network with 20 active wallets is a digital ghost town, not an economy.`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: You cannot build economic freedom if nobody can understand or afford the user interface. Mass adoption requires accessible, lightning-fast distribution.`;
      },
      generateVote(asset, evidence) {
        if (evidence.volume24h > 100000000) {
          return { vote: "ADD", rationale: "Vibrant trading volume, deep exchange liquidity, and demonstrable retail engagement." };
        }
        return { vote: "PASS", rationale: "Secondary market depth is insufficient to accommodate high-volume order flow." };
      }
    },
    {
      seat: 9,
      name: "Brian Armstrong",
      shortName: "Armstrong",
      discipline: "Regulated rails & Institutional custody",
      school: "INSTITUTIONAL",
      era: "2012–present",
      philosophy: "The crypto economy cannot achieve escape velocity in the shadows. Clear legal compliance, auditable custody, and trusted fiat on-ramps bridge institutional capital to decentralized protocols.",
      asks: [
        "Can this protocol withstand federal regulatory scrutiny and statutory compliance without enforcement actions?",
        "Is the custody architecture compliant with SOC-2, cold-storage security, and bankruptcy remoteness?",
        "How does this asset integrate with institutional prime brokerage, pension allocations, and exchange-traded products (ETFs)?"
      ],
      bio: "Co-founder and CEO of Coinbase. Led the first major digital asset exchange to a public Nasdaq listing (COIN). Champion of regulatory clarity, institutional custody (safeguarding over 80% of US spot crypto ETF assets), and user-friendly compliance.",
      quote: "Our mission is to increase economic freedom in the world. Real adoption requires building bridges that institutions and governments can trust.",
      primaryMetric: "Institutional ETF Custodial Assets Under Management (AUM) & Legal Clarity",
      fatalFlaw: "Over-deference to regulatory regimes can compromise core permissionless and censorship-resistant crypto values.",
      firstQuestion: "Will this protocol withstand a formal SEC review and qualify for institutional custody?",
      record: { sessions: 43, votedFor: 22, dissents: 21 },
      traits: { decentralizationBias: 5, censorshipResistance: 5, securityFocus: 8, throughputBias: 6 },
      generateAnalysis(asset, evidence) {
        const isCompliant = ['BTC', 'ETH'].includes(asset.ticker);
        return {
          position: isCompliant ? "Institutional Custody Standard" : "Regulatory Scrutiny Risk",
          confidence: 88,
          argument: `On ${asset.ticker}: The real bridge to escape velocity is institutional capital. At ${evidence.priceFormatted}, can this asset be held by regulated custodians, sovereign wealth funds, and exchange-traded funds without statutory securities violations?`,
          keyRisk: "Statutory regulatory enforcement actions and banking rail de-platforming.",
          keyEvidence: "Clear regulatory classification and cold-storage custody compliance records.",
          preliminaryVote: isCompliant ? "ADD" : "PASS"
        };
      },
      generateChallenge(opponent) {
        return `To ${opponent.name}: Without regulatory compliance and institutional custody, 99% of global institutional wealth cannot touch this asset. How do you bridge to sovereign pension capital without legal rails?`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: Working through legal frameworks and court precedent is the only way to establish permanent property rights and protect everyday retail consumers from illicit operators.`;
      },
      generateVote(asset, evidence) {
        if (['BTC', 'ETH'].includes(asset.ticker)) {
          return { vote: "ADD", rationale: "Approved for spot ETF vehicles, compliant custodial rails, and institutional balance sheets." };
        }
        return { vote: "PASS", rationale: "Requires further regulatory classification clarity before institutional endorsement." };
      }
    }
  ];

  function getAgents() {
    return [...AGENTS];
  }

  function getAgentBySeat(seat) {
    const s = parseInt(seat, 10);
    return AGENTS.find(a => a.seat === s) || null;
  }

  function getAgentsBySchool(school) {
    if (!school || school === 'ALL') return getAgents();
    return AGENTS.filter(a => a.school.toUpperCase() === school.toUpperCase());
  }

  function getAgentByName(name) {
    if (!name) return null;
    const n = name.toLowerCase().trim();
    return AGENTS.find(a => 
      a.name.toLowerCase().includes(n) || 
      (a.shortName && a.shortName.toLowerCase() === n)
    ) || null;
  }

  return {
    SCHOOLS,
    AGENTS,
    getAgents,
    getAgentBySeat,
    getAgentsBySchool,
    getAgentByName
  };
})();

// Export for browser and Node.js
if (typeof window !== 'undefined') {
  window.BourseCryptoAgents = BourseCryptoAgents;
}
if (typeof global !== 'undefined') {
  global.BourseCryptoAgents = BourseCryptoAgents;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BourseCryptoAgents;
}
