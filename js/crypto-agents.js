/**
 * Bourse Chamber — Canonical 9 Crypto Personas Matrix
 * 9 Crypto Architects · 5 Core Schools · Deliberation Logic & Smart Topic-Aware Reasoning
 */

const BourseCryptoAgents = (() => {
  const SCHOOLS = ['ALL', 'CYPHERPUNK', 'COMPUTATION', 'MONOLITHIC', 'MACRO', 'TREASURY', 'LIQUIDITY', 'INSTITUTIONAL'];

  /**
   * Intelligently parses user query/thesis to extract intent, language, and core topic
   */
  function analyzeTopic(query, asset) {
    const q = String(query || "").trim().toLowerCase();
    const isIndo = false; // Deliberations are strictly 100% English and crypto-native

    let topic = 'GENERAL';
    if (/\b(turun|crash|anjlok|drop|merah|dump|koreksi|bear|bearish|rugi|longsor|jatuh|drawdown|mengapa turun|kenapa turun)\b/i.test(q)) {
      topic = 'CRASH';
    } else if (/\b(tembus|100k|ath|all time high|kapan naik|to the moon|moon|bull|bullish|pump|target|naik|terbang|kaya)\b/i.test(q)) {
      topic = 'ATH_100K';
    } else if (/\b(solana|sol).*(vs|versus|competitor|kompetitor|ethereum|eth|compete|bersaing|rival|long.?term|jangka panjang|serious|serius)\b/i.test(q) || /\b(ethereum|eth).*(vs|versus|solana|sol)\b/i.test(q)) {
      topic = 'SOL_VS_ETH';
    } else if (/\b(solana|sol|eth|ethereum|l2|layer 2|layer2|tps|kecepatan|speed|downtime|scaling|throughput|gas fee|monolitik|modular|rollup)\b/i.test(q)) {
      topic = 'L2_SOLANA';
    } else if (/\b(sec|regulasi|regulation|pemerintah|etf|legal|pajak|gensler|hukum|bappebti|banned|dilarang|compliance)\b/i.test(q)) {
      topic = 'REGULATION';
    } else if (/\b(meme|memecoin|pepe|shib|doge|micin|koin micin|judi|casino|rugpull|spekulasi|gamble)\b/i.test(q)) {
      topic = 'MEMECOIN';
    } else if (/\b(privasi|privacy|hack|exploit|tornado|anonym|anonim|keamanan|security)\b/i.test(q)) {
      topic = 'PRIVACY';
    } else if (/\b(leverage|liquidat|long squeeze|short squeeze|funding rate|perpetual|perp|futures|open interest|liquidation)\b/i.test(q)) {
      topic = 'LEVERAGE';
    } else if (/\b(etf|spot etf|blackrock|fidelity|institutional|institution|fund|grayscale|inflow|outflow|flow)\b/i.test(q)) {
      topic = 'ETF_FLOWS';
    } else if (/\b(exchange|cex|binance|coinbase|kraken|hack|insolvency|custody|withdraw|reserves|proof.of.reserve)\b/i.test(q)) {
      topic = 'EXCHANGE_RISK';
    } else if (/\b(macro|fed|interest rate|inflation|cpi|dxy|dollar|treasury|yield|recession|gdp|credit)\b/i.test(q)) {
      topic = 'MACRO';
    } else if (/\b(liquidity|spread|depth|market maker|bid.ask|slippage|volume|orderbook|dex|amm|pool)\b/i.test(q)) {
      topic = 'LIQUIDITY';
    } else if (/\b(halving|halvening|block reward|mining|miner|hash rate|difficulty)\b/i.test(q)) {
      topic = 'HALVING';
    }

    // Never truncate the user's full question
    const cleanQuery = String(query || asset?.ticker || "Crypto Asset").trim();
    return { topic, isIndo, cleanQuery };
  }

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
      avatarImg: '/img/satoshi.png',
      record: { sessions: 42, votedFor: 10, dissents: 32 },
      traits: { decentralizationBias: 10, censorshipResistance: 10, securityFocus: 10, throughputBias: 1 },
      generateAnalysis(asset, evidence, query) {
        const { topic, isIndo, cleanQuery } = analyzeTopic(query, asset);
        const isBtc = asset?.ticker === 'BTC' || /btc|bitcoin/i.test(cleanQuery);

        let argument = "";
        let position = isBtc ? "Pristine Byzantine Consensus" : "Centralized Trust Surface";
        let confidence = isBtc ? 96 : 82;

        if (topic === 'SOL_VS_ETH') {
          position = "Both Fail the Decentralization Standard";
          argument = `Both Ethereum and Solana have drifted from Satoshi's original vision. Ethereum's proof-of-stake introduced validator cartelization, while Solana's high hardware requirements mean only institutional data centers can run validating nodes. Neither achieves the permissionless, trustless peer-to-peer standard that Bitcoin established. The question is not which is better — it's whether either survives a coordinated state-level censorship attack.`;
          confidence = 91;
        } else if (topic === 'CRASH') {
          position = "Byzantine Fault Tolerance Over Market Noise";
          argument = isIndo
            ? `Fluktuasi nilai tukar fiat adalah distraksi spekulatif. Buku besar Proof-of-Work tetap menghasilkan blok setiap 10 menit tanpa manipulasi bank sentral. Penurunan harga terjadi karena likuidasi utang dan kepanikan bursa terpusat, bukan kegagalan matematika 21 juta koin.`
            : `Short-term fiat exchange volatility is noise. The proof-of-work ledger produces blocks every 10 minutes without central bank intervention. Crashes occur because centralized leverage collapses, not because of any defect in 21M mathematical scarcity.`;
        } else if (topic === 'ATH_100K') {
          position = "Mathematical Scarcity Invariance";
          argument = isIndo
            ? `Harga nominal fiat bukanlah metrik keberhasilan sejati. Keberhasilan Bitcoin diukur dari keterbatasan absolut 21 juta koin yang tidak bisa dipalsukan. Karena mata uang fiat terus dicetak tanpa batas, harga nominal tentu akan terus mencerminkan devaluasi fiat tersebut.`
            : `Nominal fiat targets are secondary indicators. Bitcoin's victory is absolute 21M mathematical scarcity without discretionary inflation. As unbacked fiat is printed indefinitely, nominal prices naturally diverge upward.`;
        } else if (topic === 'L2_SOLANA') {
          position = "Decentralized Node Verifiability";
          argument = isIndo
            ? `Menaikkan throughput dengan membebani validator memakai perangkat keras server mahal adalah jebakan sentralisasi. Jika pengguna biasa tidak bisa menjalankan full node di rumah, Anda hanya membangun ulang sistem perbankan terpusat dengan topeng kripto.`
            : `Chasing high throughput by imposing extreme validator hardware requirements is an architectural trap. If ordinary users cannot verify full blocks on consumer hardware, you have merely rebuilt centralized legacy banking.`;
        } else if (topic === 'REGULATION') {
          position = "Sovereign Censorship Resistance";
          argument = isIndo
            ? `Sistem ini dirancang dari awal untuk bertahan dari sensor institusi dan tekanan regulator. Kode konsensus Proof-of-Work tidak membutuhkan izin perantara perbankan untuk memproses transaksi peer-to-peer.`
            : `The protocol was designed from day one to operate without regulatory permission. Proof-of-work consensus is sovereign code; it does not negotiate with state gatekeepers.`;
        } else if (topic === 'MEMECOIN') {
          position = "Zero Monetary Premium for Speculative Noise";
          argument = `Speculative gambling without sound monetary principles is merely an unbacked casino. It distracts capital from the essential mission: monetary emancipation from central banking.`;
        } else if (topic === 'LEVERAGE') {
          position = "Shadow Banking Layer Vulnerability";
          argument = `Centralized leverage recreates the exact fractional reserve banking system Bitcoin was created to replace. When synthetic leverage collapses, exchanges freeze withdrawals and liquidations cascade. The underlying proof-of-work ledger remains completely unaffected, producing blocks every 10 minutes regardless of margin calls.`;
        } else if (topic === 'ETF_FLOWS') {
          position = "Custodial Paper Claims vs Real Ownership";
          argument = `An ETF is an institutional paper claim custodying coins through centralized intermediaries. While it brings fiat capital, remember: not your keys, not your coins. If you rely on an ETF custodian, you own a financial claim check subject to state seizure, not sovereign peer-to-peer electronic cash.`;
        } else if (topic === 'EXCHANGE_RISK') {
          position = "Trusted Third Party Failure Mode";
          argument = `Centralized exchanges are trusted third parties—and trusted third parties are security holes. Every exchange insolvency, from Mt. Gox onward, proves that leaving coins on an exchange reduces sovereign money to an unsecured debt obligation. Sovereign self-custody is the foundational defense.`;
        } else if (topic === 'MACRO') {
          position = "Central Bank Debasement Antidote";
          argument = `Central banks are structurally trapped into inflating fiat currencies to finance sovereign debt. This exact failure was why the London Times headline about bank bailouts was inscribed into block zero. Bitcoin's immutable 21 million supply is the mathematical counter-measure to macro debasement.`;
        } else if (topic === 'LIQUIDITY') {
          position = "Organic Transactional Velocity";
          argument = `Real liquidity comes from voluntary peer-to-peer commerce and node verifiability, not synthetic market maker depth on centralized exchanges. Artificial liquidity evaporates in stress events; cryptographic finality does not.`;
        } else if (topic === 'HALVING') {
          position = "Programmatic Supply Issuance Invariance";
          argument = `The halving is hardcoded algorithmic monetary policy operating without human discretion. As the block subsidy cuts in half every 210,000 blocks, issuance scarcity intensifies strictly according to consensus rules established in 2008.`;
        } else {
          argument = isBtc
            ? `This ledger remains the sole monetary innovation that completely eliminates trusted third parties. With a fixed supply cap and decentralized proof-of-work, no foundation can inflate its baseline issuance.`
            : `Trust is an architectural defect. Who controls sequencer keys and validator sets? Any protocol reliant on foundation coordination is merely legacy banking in disguise.`;
        }

        return {
          position,
          confidence,
          argument,
          keyRisk: isBtc ? "Mining pool concentration and protocol ossification." : "Trusted third party control, validator collusion, or regulatory censorship.",
          keyEvidence: isBtc ? "Unhashed proof-of-work difficulty adjustment ensures 100% computational finality." : "Token governance distribution reveals significant foundation and insider allocations.",
          preliminaryVote: isBtc ? "ADD" : (topic === 'CRASH' ? 'PASS' : 'REDUCE')
        };
      },
      generateChallenge(opponent, query) {
        const { topic, isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${opponent.name}: Anda berbicara tentang ${opponent.discipline}, tetapi siapa yang memegang admin keys? Jika server validator disita atau pendirinya dipanggil pengadilan, apakah sistem Anda masih dapat beroperasi tanpa intervensi manusia?`;
        }
        return `To ${opponent.name}: You speak of ${opponent.discipline}, but who holds the admin keys? If servers are seized or founders subpoenaed, does this ledger produce blocks without human intervention?`;
      },
      generateResponse(challenger, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${challenger.name}: Kepercayaan adalah kerentanan, bukan fitur. Mengganti satu bank sentral korup dengan yayasan multisig segelintir orang adalah kemunduran institusional, bukan kemajuan kriptografi.`;
        }
        return `To ${challenger.name}: Trust is a vulnerability, not a feature. Replacing one corruptible central bank with a foundation multisig is an institutional regression, not cryptographic progress.`;
      },
      generateVote(asset, evidence, query) {
        const { topic } = analyzeTopic(query, asset);
        const isBtc = asset?.ticker === 'BTC' || /btc|bitcoin/i.test(query || '');
        if (isBtc) {
          return { vote: "ADD", rationale: "Pristine Byzantine agreement and immutable 21M supply cap with zero counterparty risk." };
        }
        if (topic === 'CRASH') {
          return { vote: "PASS", rationale: "Await leverage deleveraging to identify truly sovereign decentralized protocols." };
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
      avatarImg: '/img/vitalik.png',
      record: { sessions: 45, votedFor: 28, dissents: 17 },
      traits: { decentralizationBias: 9, censorshipResistance: 9, securityFocus: 8, throughputBias: 6 },
      generateAnalysis(asset, evidence, query) {
        const { topic, isIndo, cleanQuery } = analyzeTopic(query, asset);
        const hasCompute = ['ETH', 'SOL', 'AVAX', 'NEAR', 'LINK'].includes(asset?.ticker);

        let position = hasCompute ? "Constructive Mechanism Design" : "Mechanism Design Review";
        let argument = "";

        if (topic === 'SOL_VS_ETH') {
          position = "Ethereum Modular vs Solana Monolithic";
          argument = `Solana's monolithic single-chain execution achieves raw throughput, but it does so by raising the validator hardware bar so high that only institutional data centers can participate — that's not decentralization, it's performance theater. Ethereum's rollup-centric roadmap separates execution from settlement and data availability, allowing anyone to run a validating node while L2s handle high-frequency transactions. The real long-term question is: can Solana deliver full-node verifiability to ordinary participants, or does it converge into a high-speed permissioned network?`;
        } else if (topic === 'CRASH') {
          position = "Deleveraging vs Consensus Health";
          argument = isIndo
            ? `Penurunan pasar saat ini mencerminkan likuidasi posisi leverage di bursa berjangka, bukan kegagalan layer konsensus. Yang terpenting adalah apakah aktivitas pengembang, finalitas data L2 rollups, dan keamanan public goods tetap berjalan lancar tanpa eksploitasi MEV.`
            : `Today's drawdown reflects cascading derivative liquidations rather than consensus failure. What matters is whether developer ecosystem density and rollup data availability throughput remain resilient without extractive MEV dominance.`;
        } else if (topic === 'ATH_100K') {
          position = "Coordination Utility Preconditions";
          argument = isIndo
            ? `Rekor harga baru harus mencerminkan kegunaan koordinasi sosial yang nyata. Valuasi tinggi tanpa aplikasi terdesentralisasi yang memecahkan masalah koordinasi manusia hanya akan mengundang spekulasi kosong dan risiko sentralisasi.`
            : `ATH valuations must be earned through real decentralized coordination. High prices without sustainable mechanism design merely incentivize extractive speculation rather than durable public goods.`;
        } else if (topic === 'L2_SOLANA') {
          position = "Modular Scaling via Cryptographic Proofs";
          argument = isIndo
            ? `Eksekusi monolitik tunggal berisiko memusatkan validator ke data center institusi. Di Ethereum, kami memilih arsitektur modular: scaling dilakukan lewat rollups L2 dan ZK-proofs sehingga verifikasi full node tetap terjangkau oleh publik.`
            : `Monolithic single-layer throughput risks validator centralization in datacenters. Ethereum's modular rollup roadmap and zero-knowledge proofs scale execution bandwidth without sacrificing decentralized validator verifiability.`;
        } else if (topic === 'REGULATION') {
          position = "Autonomous Code vs Centralized Custody";
          argument = isIndo
            ? `Regulator harus membedakan secara tegas antara perantara kustodian terpusat dan protokol kode otonom open-source. Mengatur kode matematika terdesentralisasi adalah kesalahan konsep dan merusak inovasi publik.`
            : `Regulators must distinguish between centralized custodial intermediaries and autonomous open-source code. Regulating pure smart contract math is fundamentally unworkable and stifles public coordination.`;
        } else if (topic === 'MEMECOIN') {
          position = "Incentive Alignment & Public Goods";
          argument = `Memecoins are interesting cultural coordination experiments, but we urgently need cryptoeconomic mechanisms that redirect speculative energy toward open science and durable public goods funding.`;
        } else if (topic === 'LEVERAGE') {
          position = "Autonomous Liquidation vs Opacity";
          argument = `On-chain lending markets like Aave and Maker execute liquidations deterministically via smart contracts with full transparency. Centralized margin lenders collapsed precisely because their collateral was rehypothecated off-chain in private spreadsheets. Code-enforced margin rules prevent systemic hidden contagion.`;
        } else if (topic === 'ETF_FLOWS') {
          position = "Institutional Inflows & Staking Neutrality";
          argument = `Spot ETFs bring broad financial access, but the cryptoeconomic concern is validator decentralization. If ETF custodians concentrate too much staked asset share, it creates soft governance pressures on client diversity and block building. We need liquid staking that is credibly neutral and trust-minimized.`;
        } else if (topic === 'EXCHANGE_RISK') {
          position = "Self-Sovereign Settlement over Custodial Trust";
          argument = `The recurring failure of centralized exchanges underscores why we built Ethereum. Automated market makers, account abstraction, and decentralized exchanges eliminate counterparty insolvency risk by enforcing settlement purely in verifiable EVM code.`;
        } else if (topic === 'MACRO') {
          position = "Global Coordination Utility";
          argument = `Macro monetary cycles will always fluctuate, but durable blockchain adoption comes from solving real social coordination problems — permissionless payments, identity, verifiable credentials, and decentralized governance that operate independently of any sovereign central bank.`;
        } else if (topic === 'LIQUIDITY') {
          position = "On-Chain Liquidity Mechanisms";
          argument = `Concentrated liquidity AMMs and cross-rollup intent architectures transform liquidity into an open public coordination layer. Rather than depending on proprietary market makers who pull bids during market panic, automated liquidity algorithms guarantee deterministic clearing.`;
        } else {
          argument = `Evaluating state transition throughput and mechanism design. We must verify whether network fee structures fund durable public goods or merely reward extractive MEV bots.`;
        }

        return {
          position,
          confidence: 88,
          argument,
          keyRisk: "Sequencer centralization and economic griefing vulnerabilities.",
          keyEvidence: "Data availability bandwidth and developer commits over trailing periods.",
          preliminaryVote: hasCompute ? "ADD" : "PASS"
        };
      },
      generateChallenge(opponent, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${opponent.name}: Bagaimana model ekonomi Anda mencegah kartelisasi dan ekstraksi MEV? Tanpa desain mekanisme cryptoeconomic formal, model keamanan Anda runtuh menjadi oligarki ekonomi.`;
        }
        return `To ${opponent.name}: How does your economic model prevent cartelization and MEV extraction? Without formal cryptoeconomic mechanism design, your security model collapses into economic oligarchy.`;
      },
      generateResponse(challenger, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${challenger.name}: Monolitik yang kaku tidak bisa menyelesaikan koordinasi manusia yang kompleks. Modularitas dan cryptographic validity proofs memungkinkan penskalaan tanpa mengorbankan verifiabilitas validator individu.`;
        }
        return `To ${challenger.name}: Monolithic ossification cannot solve complex human coordination. Modularity and cryptographic validity proofs allow scaling without sacrificing individual validator verifiability.`;
      },
      generateVote(asset, evidence, query) {
        const hasCompute = ['ETH', 'SOL', 'LINK'].includes(asset?.ticker);
        if (hasCompute) {
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
      avatarImg: '/img/finney.png',
      record: { sessions: 39, votedFor: 14, dissents: 25 },
      traits: { decentralizationBias: 10, censorshipResistance: 10, securityFocus: 10, throughputBias: 2 },
      generateAnalysis(asset, evidence, query) {
        const { topic, isIndo, cleanQuery } = analyzeTopic(query, asset);

        let argument = "";
        let position = "Cryptographic Sovereignty Benchmark";

        if (topic === 'SOL_VS_ETH') {
          position = "Cryptographic Usability vs. Privacy Tradeoffs";
          argument = `From a cryptographic standpoint, both Solana and Ethereum expose complete transaction graphs — neither implements native privacy at the base layer. Solana's sub-second finality makes it practical for everyday payments, which is what I envisioned for digital cash, but the network's liveness depends on a small cartel of high-performance validators with no cryptographic privacy guarantees. Ethereum's direction toward ZK-proofs is more architecturally sound for privacy, but usability today remains poor for ordinary users.`;
        } else if (topic === 'CRASH') {
          argument = isIndo
            ? `Sejak saya menjalankan node Bitcoin kedua di dunia pada Januari 2009, pasar telah berkali-kali anjlok puluhan persen. Penurunan harga jangka pendek tidak pernah sedikit pun mengurangi keindahan matematika dari uang digital bebas sensor.`
            : `Since running the second Bitcoin node on earth in January 2009, I witnessed countless drawdowns. Short-term price drops never diminish the mathematical elegance of sovereign, censorship-resistant digital cash.`;
        } else if (topic === 'ATH_100K') {
          argument = isIndo
            ? `Bertahun-tahun lalu saya pernah mengkalkulasi potensi nilai Bitcoin jika diadopsi dunia. Tembus $100k adalah keniscayaan matematis, tetapi yang terpenting: apakah pengguna masih mempertahankan privasi finansial saat modal institusi mendominasi?`
            : `Years ago I estimated Bitcoin's ultimate value against global wealth. Multi-trillion market caps are a mathematical outcome of adoption, but preserving individual privacy during institutionalization is the true battle.`;
        } else if (topic === 'REGULATION' || topic === 'PRIVACY') {
          argument = `Computer technology must empower individuals to transact completely anonymously. A fully transparent public ledger without cryptographic privacy risks becoming an instrument of mass surveillance.`;
        } else if (topic === 'ETF_FLOWS') {
          position = "Institutional Surrender of Privacy & Sovereignty";
          argument = `When institutions absorb Bitcoin through ETFs, they strip away its core cypherpunk properties: anonymity, self-custody, and peer-to-peer verification. Wall Street gets the price exposure, but governments gain an addressable surveillance vector over every single participant.`;
        } else if (topic === 'LEVERAGE') {
          position = "Paper Derivatives vs Cryptographic Scarcity";
          argument = `Synthetic leverage on offshore exchanges distorts the true cryptographic scarcity we coded into proof-of-work. When margin runs dry, the mathematics of the blockchain remain unblemished.`;
        } else if (topic === 'EXCHANGE_RISK') {
          position = "Centralized Custody is Antithetical to Crypto Cash";
          argument = `The idea of holding coins on a centralized custodian contradicts everything we worked on. Reusable proofs of work and Bitcoin were built specifically so individuals could verify their own transactions without asking an exchange's permission.`;
        } else {
          argument = `We did not design cryptographic cash to construct a surveillance ledger for central authorities. Can an individual transact without permission, identity disclosure, or risk of retroactive account blacklisting?`;
        }

        return {
          position,
          confidence: 90,
          argument,
          keyRisk: "Address graph clustering and lack of native zero-knowledge privacy guarantees.",
          keyEvidence: "Base-layer transaction metadata remains completely transparent to commercial blockchain analysis firms.",
          preliminaryVote: "PASS"
        };
      },
      generateChallenge(opponent, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${opponent.name}: Anda memuja ${opponent.discipline}, tetapi setiap transaksi di jaringan ini terindeks secara permanen dan siap diawasi. Di mana letak hak individu atas privasi kriptografis?`;
        }
        return `To ${opponent.name}: You celebrate ${opponent.discipline}, but every transaction on this network is permanently indexed and surveillance-ready. Where is the individual right to cryptographic privacy?`;
      },
      generateResponse(challenger, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${challenger.name}: Buku besar yang sepenuhnya transparan menjadi panoptikon berbahaya saat negara memetakan kluster dompet. Privasi harus dibangun ke dalam matematika dasar, bukan fitur tambahan.`;
        }
        return `To ${challenger.name}: Transparent ledgers become weaponized panopticons the moment state actors correlate wallet clusters. Privacy must be built into the base math, not treated as an optional feature.`;
      },
      generateVote(asset, evidence, query) {
        const isBtc = asset?.ticker === 'BTC' || /btc|bitcoin/i.test(query || '');
        if (isBtc) {
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
      avatarImg: '/img/szabo.png',
      record: { sessions: 40, votedFor: 16, dissents: 24 },
      traits: { decentralizationBias: 9, censorshipResistance: 10, securityFocus: 9, throughputBias: 3 },
      generateAnalysis(asset, evidence, query) {
        const { topic, isIndo, cleanQuery } = analyzeTopic(query, asset);

        let argument = "";
        if (topic === 'SOL_VS_ETH') {
          argument = `Neither Solana nor Ethereum is immune to my core principle — trusted third parties are security holes. Solana's network has halted multiple times due to its centralized validator set, requiring foundation intervention to restart the chain — that is precisely the trusted-third-party failure mode I warned about. Ethereum's governance via EIP processes and core developer multisigs also introduces social trust vectors. Smart contracts on both chains are only as trustless as the validator set and upgrade mechanisms allow.`;
        } else if (topic === 'CRASH') {
          argument = isIndo
            ? `Fluktuasi harga pasar adalah kebisingan spekulatif jangka pendek. Nilai abadi smart contract dan Bit Gold terletak pada 'social scalability'—kemampuan mengamankan kontrak tanpa perlu saling percaya dan tanpa perantara manusia.`
            : `Price drawdowns are secondary market noise. The lasting value of smart contracts and Bit Gold rests on social scalability—reducing subjective trust vulnerabilities regardless of speculative sentiment.`;
        } else if (topic === 'L2_SOLANA') {
          argument = `Social scalability matters infinitely more than raw TPS. If a network halts or requires manual developer coordination to recover state, its smart contracts surrender immutability and trust minimization.`;
        } else if (topic === 'LEVERAGE') {
          argument = `Financial leverage in traditional contracts relies on subjective legal enforcement and court bankruptcy proceedings. When crypto leverage relies on centralized exchanges rather than unforgeable algorithmic liquidations, it re-introduces counterparty vulnerability.`;
        } else if (topic === 'ETF_FLOWS') {
          argument = `An ETF wraps bearer assets in a subjective legal trust structure, re-introducing the very trusted third parties that smart contracts and Bit Gold were designed to minimize. The institutional capital is real, but the trust minimization is degraded.`;
        } else if (topic === 'EXCHANGE_RISK') {
          argument = `Centralized exchanges are the archetypal trusted third parties—and trusted third parties are security holes. Entrusting private keys to an exchange operator substitutes mathematical certainty for subjective promises.`;
        } else if (topic === 'REGULATION') {
          argument = `The historical purpose of smart contracts was to achieve social scalability without depending on subjective local legal jurisdictions. Protocols that compromise their algorithmic immutability to satisfy discretionary regulatory mandates surrender their core technological advantage.`;
        } else {
          argument = `Examining whether settlement is unforgeably costly. If a contract requires emergency intervention by a foundation multisig, it is not a smart contract—it is a traditional contract enforced by unaccountable administrators.`;
        }

        return {
          position: "Algorithmic Settlement Review",
          confidence: 86,
          argument,
          keyRisk: "Governance mutability and protocol administrative backdoors.",
          keyEvidence: "Protocol parameter modifications remain subject to human voting cartels rather than immutable algorithmic constraints.",
          preliminaryVote: "PASS"
        };
      },
      generateChallenge(opponent, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${opponent.name}: Tunjukkan di mana pihak ketiga yang dipercaya disembunyikan. Jika konsensus sosial atau dewan yayasan dapat menulis ulang state transaksi, Anda hanya memperdagangkan janji manusia.`;
        }
        return `To ${opponent.name}: Show me where the trusted third party is hidden. If human consensus, social hard forks, or foundation councils can rewrite state, you are merely trading counterparty promises.`;
      },
      generateResponse(challenger, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${challenger.name}: Pengadilan hukum tradisional rapuh di lintas yurisdiksi. Eksekusi algoritmik yang deterministik adalah satu-satunya fondasi institusional yang kokoh untuk perdagangan global.`;
        }
        return `To ${challenger.name}: Subjective legal courts fail across international jurisdictions. Deterministic, algorithmic execution is the only durable institutional foundation for global commerce.`;
      },
      generateVote(asset, evidence, query) {
        const isBtc = asset?.ticker === 'BTC' || /btc|bitcoin/i.test(query || '');
        if (isBtc) {
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
      avatarImg: '/img/anatoly.png',
      record: { sessions: 44, votedFor: 26, dissents: 18 },
      traits: { decentralizationBias: 5, censorshipResistance: 6, securityFocus: 6, throughputBias: 10 },
      generateAnalysis(asset, evidence, query) {
        const { topic, isIndo, cleanQuery } = analyzeTopic(query, asset);
        const isHighThroughput = ['SOL', 'AVAX', 'NEAR', 'SUI', 'APT'].includes(asset?.ticker) || /solana|sol/i.test(cleanQuery);

        let argument = "";
        let position = isHighThroughput ? "Monolithic Performance Benchmark" : "Throughput Constrained";

        if (topic === 'SOL_VS_ETH') {
          position = "Monolithic Execution Supremacy";
          argument = `This is precisely the architectural debate I designed Solana to settle. Ethereum's rollup fragmentation is an engineering compromise — you get lower hardware requirements for L1 nodes, but at the cost of fragmented liquidity, async composability failures, and bridge exploits. Solana's Proof of History enables deterministic clock synchronization so every validator processes the same ordered transaction log in parallel, achieving 65,000+ TPS with 400ms finality on a single unified state machine. As hardware costs continue halving, Solana's throughput advantage compounds — Ethereum's L2 complexity does not.`;
        } else if (topic === 'CRASH') {
          position = "Execution Resiliency Under Liquidation";
          argument = isIndo
            ? `Pasar boleh bergejolak, tetapi mesin eksekusi kami tetap memproses ribuan TPS tanpa antrean mempool macet. Likuidasi posisi berjalan instan dalam 400 milidetik. Infrastruktur kecepatan tinggi membuktikan ketahanannya saat jaringan lambat lumpuh.`
            : `Markets can crash, but our hardware-speed state machine continues executing thousands of TPS with sub-second finality. When volatility explodes, instant on-chain settlement proves its superiority over fragmented networks.`;
        } else if (topic === 'L2_SOLANA') {
          position = "Unified Atomic State Superiority";
          argument = `Fragmenting execution across dozens of asynchronous rollups destroys liquidity and UX. Hardware and fiber bandwidth get cheaper every year—monolithic atomic composability is the only rational scaling path.`;
        } else if (topic === 'LIQUIDITY') {
          position = "High-Frequency On-Chain Orderbooks";
          argument = `Real liquidity requires orderbooks that run at NASDAQ speeds directly on-chain. When a block takes 12 seconds, market makers must widen spreads to manage risk. With 400ms slots and local fee markets, Solana supports true central limit order books (CLOBs) with institutional-grade bid-ask depth and zero bridge slippage.`;
        } else if (topic === 'LEVERAGE') {
          position = "Sub-Second Liquidation Engine Integrity";
          argument = `During extreme market volatility, networks with mempool bottlenecks allow bad debt to compound because liquidations get stuck behind fee spikes. On high-throughput architectures, liquidation transactions execute concurrently in the same slot, keeping lending protocols solvent even during severe crashes.`;
        } else if (topic === 'ETF_FLOWS') {
          position = "Institutional Rail Efficiency";
          argument = `Institutional capital naturally flows toward rails with the highest throughput, lowest fees, and largest daily active retail volume. As ETFs expand beyond BTC and ETH, the market will demand high-speed settlement infrastructure that can handle millions of creation and redemption units seamlessly.`;
        } else if (topic === 'EXCHANGE_RISK') {
          position = "Atomic On-Chain Trading vs CEX Counterparty Risk";
          argument = `CEX risk exists because blockchains historically lacked the throughput to host orderbooks on-chain. When you can execute 50,000 TPS on-chain with self-custody, centralized exchange risk becomes obsolete.`;
        } else if (topic === 'MACRO') {
          position = "Real-World Adoption Velocity Trumps Macro Cycles";
          argument = `Macro monetary tides move asset prices in the short term, but global financial adoption is won by developer velocity and consumer throughput. When transactions cost fractions of a cent, real-world commerce outgrows speculative macro noise.`;
        } else {
          argument = `Physics is the hard ceiling. If transactions cost dollars and take minutes to confirm, mainstream applications cannot function. We must saturate global fiber-optic bandwidth on an atomic, composable state machine.`;
        }

        return {
          position,
          confidence: 89,
          argument,
          keyRisk: "Network halt under extreme packet storms and validator hardware barriers.",
          keyEvidence: "Transaction throughput benchmarks and block finality latency under adversarial load.",
          preliminaryVote: isHighThroughput ? "ADD" : "PASS"
        };
      },
      generateChallenge(opponent, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${opponent.name}: Mengapa memaksa pengguna menggunakan jembatan rollup yang rawan hack jika hardware modern dapat mengeksekusi 50.000 TPS di satu layer global? Modularitas sering kali jadi alasan untuk rekayasa yang lambat.`;
        }
        return `To ${opponent.name}: Why force users into asynchronous rollups and bridge exploits when commodity hardware can execute 50,000 TPS on an atomic global state? Modularity is an excuse for bad engineering.`;
      },
      generateResponse(challenger, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${challenger.name}: Hardware semakin cepat dan bandwidth semakin murah setiap tahun. Membangun sistem keuangan untuk 10 transaksi per detik sama saja dengan mengoptimalkan internet untuk modem dial-up era 90-an.`;
        }
        return `To ${challenger.name}: Hardware gets faster and bandwidth gets cheaper every year. Building a financial system for 10 transactions per second is like optimizing the internet for 56k dial-up modems.`;
      },
      generateVote(asset, evidence, query) {
        const isHigh = ['SOL', 'AVAX', 'SUI'].includes(asset?.ticker) || /solana|sol/i.test(query || '');
        if (isHigh) {
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
      avatarImg: '/img/hayes.png',
      record: { sessions: 46, votedFor: 27, dissents: 19 },
      traits: { decentralizationBias: 6, censorshipResistance: 7, securityFocus: 5, throughputBias: 7 },
      generateAnalysis(asset, evidence, query) {
        const { topic, isIndo, cleanQuery } = analyzeTopic(query, asset);
        const isLiquid = ['BTC', 'ETH', 'SOL', 'CRYPTO'].includes(asset?.ticker);

        let argument = "";
        let position = isLiquid ? "High Beta Liquidity Sponge" : "Illiquid Convexity Play";

        if (topic === 'SOL_VS_ETH') {
          position = "Liquidity Reflexivity & Token Market Structure";
          argument = `From a pure liquidity and reflexivity perspective, Solana has successfully captured a younger, higher-beta capital flow while Ethereum accumulates institutional positioning and ETF wrapper demand. Solana's perpetual funding rates and options market are deepening — that matters more to crypto capital markets than architecture debates. Both chains are net beneficiaries of global fiat debasement, but SOL carries higher reflexive upside in a bull cycle precisely because its narrative (speed, low fees) is simple and retail-accessible. The real question is which token captures the next wave of speculative capital rotation.`;
        } else if (topic === 'CRASH') {
          position = "Macro Liquidity Contraction & Margin Flush";
          argument = `Stop weeping on Twitter. Today's dump is pure macro liquidity contraction driven by central bank policy and cascading perpetual long liquidations. Have dry powder ready to scoop generational assets when blood is in the streets!`;
        } else if (topic === 'ATH_100K') {
          position = "Monetary Debasement Inevitability";
          argument = `Central banks have zero choice but to inflate away sovereign debt. The second net dollar liquidity re-accelerates, pristine monetary sponges like Bitcoin will obliterate $100k effortlessly.`;
        } else if (topic === 'LEVERAGE') {
          position = "Derivative Cascade & Funding Rate Analysis";
          argument = `This is where macro liquidity meets crypto microstructure. Watch the perpetual funding rates — when longs are paying 0.1%+ per 8 hours, you have a dangerously overleveraged market primed for a cascade liquidation event. Exchanges will force-sell positions indiscriminately on the way down. The question is not if, but which price level triggers the next flush, and whether you're carrying the right-sized position to survive it and buy the dip.`;
        } else if (topic === 'ETF_FLOWS') {
          position = "Institutional Inflow & Reflexive Demand";
          argument = `Spot ETF inflows are the most powerful structural change in crypto capital markets since Bitcoin futures launched. Every dollar BlackRock or Fidelity accumulates removes liquid BTC from exchange reserves, tightening the reflexive supply shock. The liquidity premium this creates for regulated access products is real and sustained — not speculative.`;
        } else if (topic === 'EXCHANGE_RISK') {
          position = "Exchange Counterparty & Custodial Risk";
          argument = `Every unaudited centralized exchange is a fractional reserve waiting to collapse. Check on-chain proof-of-reserves. If they're not publishing verified Merkle proofs of reserves, they're running a fractional banking operation and you're an unsecured creditor. Self-custody is not optional — it's survival.`;
        } else if (topic === 'MACRO') {
          position = "Dollar Liquidity & Global Risk Appetite";
          argument = `Crypto is a global dollar liquidity bet. When the Fed drains reserves via QT and high rates, risk assets including crypto trade down as institutional desks reduce risk. When net liquidity expands — whether via repo facility drain, balance sheet expansion, or debt monetization — crypto leads the reflation trade. Right now, the DXY and 2-year yield are the signals that matter most.`;
        } else if (topic === 'LIQUIDITY') {
          position = "Market Microstructure & Depth Analysis";
          argument = `Crypto liquidity is structurally thin outside BTC and ETH. A 7-figure trade can move an altcoin 5% because maker liquidity disappears during volatility. Slippage risk and bid-ask spreads widen catastrophically in bear markets. Position sizing must account for the fact that your exit price in stress conditions will be far worse than current orderbook depth suggests.`;
        } else if (topic === 'HALVING') {
          position = "Supply Shock & Miner Selling Pressure";
          argument = `The Bitcoin halving cuts block subsidy and compresses miner revenue. Miners who are unhedged and operating on thin margins will capitulate and sell BTC reserves to service debt. Post-halving supply shock historically compounds over 6–18 months as reduced new supply meets any sustained demand. The reflexive narrative around halvings is as important as the mechanical supply effect.`;
        } else if (topic === 'MEMECOIN') {
          position = "Pure Financialized Attention Momentum";
          argument = `Memecoins are the purest financialized attention casino ever created. Retail is sick of low-float VC vaporware. Ride the volatility wave with strict risk management, but don't become someone else's exit liquidity!`;
        } else {
          argument = `Central banks have no choice but to inflate their sovereign debt away. At ${evidence?.priceFormatted || 'current levels'}, this asset acts as a high-powered liquidity sponge absorbing global fiat debasement. Watch the funding rates.`;
        }

        return {
          position,
          confidence: 85,
          argument,
          keyRisk: "Sharp USD dollar liquidity squeezes and cascading perpetual margin liquidations.",
          keyEvidence: "Correlation with Federal Reserve net liquidity and Reverse Repo facility drain.",
          preliminaryVote: isLiquid ? "ADD" : "PASS"
        };
      },
      generateChallenge(opponent, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${opponent.name}: Di saat Anda terpaku pada teori akademis, bank sentral mencetak uang triliunan dolar. Bagaimana aset Anda menangkap likuiditas fiat global saat mesin cetak uang dinyalakan kembali?`;
        }
        return `To ${opponent.name}: While you obsess over academic whitepapers, the Federal Reserve is debasing the dollar by trillions. How does this asset capture global fiat liquidity when the money printers turn on?`;
      },
      generateResponse(challenger, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${challenger.name}: Setiap pasar bergerak berdasarkan likuiditas dan leverage. Mengabaikan refleksivitas spekulatif selama siklus ekspansi kredit bank sentral menjamin Anda melewatkan seluruh siklus bull market.`;
        }
        return `To ${challenger.name}: Every market moves on liquidity and leverage. Ignoring speculative reflexivity during a central bank credit expansion guarantees you miss the entire bull cycle.`;
      },
      generateVote(asset, evidence, query) {
        const { topic } = analyzeTopic(query, asset);
        if (topic === 'CRASH') {
          return { vote: "ADD", rationale: "Generational entry opportunity during peak derivative liquidation cascades." };
        }
        return { vote: "ADD", rationale: "Prime speculative vehicle poised to capture global central bank fiat dilution." };
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
        return {
          band: "3.0 – 5.0%",
          rationale: "Prime liquidity sponge poised to capture global central bank fiat expansion and speculative reflexivity."
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
      avatarImg: '/img/saylor.png',
      record: { sessions: 48, votedFor: 19, dissents: 29 },
      traits: { decentralizationBias: 9, censorshipResistance: 9, securityFocus: 9, throughputBias: 1 },
      generateAnalysis(asset, evidence, query) {
        const { topic, isIndo, cleanQuery } = analyzeTopic(query, asset);
        const isBtc = asset?.ticker === 'BTC' || /btc|bitcoin/i.test(cleanQuery);

        let argument = "";
        let position = isBtc ? "Thermodynamic Digital Capital" : "Unbacked Software Speculation";

        if (topic === 'SOL_VS_ETH') {
          position = "Both Are Inferior to Bitcoin's Monetary Network";
          argument = `Comparing Solana to Ethereum is like debating which melting ice cube is colder. Both have active foundations that can change consensus rules, both have continuous token emissions diluting holders, and neither has Bitcoin's unalterable 21 million hard cap. Solana's network has suffered repeated outages proving it is not a sound monetary network — you cannot store decades of purchasing power on infrastructure that requires foundation intervention to restart.`;
        } else if (topic === 'CRASH') {
          position = "Thermodynamic Immortality Over Paper Volatility";
          argument = `Daily price volatility is an illusion of melting paper currencies. Bitcoin is thermodynamically incorruptible digital capital. Rational balance sheets do not panic; we accumulate pristine digital energy on every dip.`;
        } else if (topic === 'ATH_100K') {
          position = "Inevitability of Digital Property Migration";
          argument = `Crossing $100k is a mathematical inevitability. When global capital flees depreciating bonds into immutable digital property, Bitcoin will march toward millions per coin. There is no second best.`;
        } else if (topic === 'LEVERAGE') {
          position = "Long-term Holders vs Short-term Derivative Noise";
          argument = `Leverage and liquidations are short-term paper market noise produced by speculators who don't understand what they own. MicroStrategy holds zero leverage against its Bitcoin — the cleanest expression of digital property conviction. Every forced liquidation is a wealth transfer from weak hands to strong hands. Add on weakness, never sell.`;
        } else if (topic === 'ETF_FLOWS') {
          position = "Institutional Adoption of Digital Property";
          argument = `Spot Bitcoin ETF approval is the most significant institutional adoption event since gold's first ETF in 2004. Every billion of net ETF inflows permanently removes Bitcoin from the liquid supply, compressing it against the immovable 21M hard cap. This is the capital migration from analog gold to digital gold happening in real time.`;
        } else if (topic === 'EXCHANGE_RISK') {
          position = "Self-Custody vs Exchange Counterparty Risk";
          argument = `Any Bitcoin held on an exchange is not truly owned — it's an unsecured IOU against the exchange's solvency. Not your keys, not your coins. The correct answer to exchange risk is sovereign self-custody, not diversification across multiple custodians. Institutional treasury Bitcoin must be held through regulated prime custody with full legal title.`;
        } else if (topic === 'MACRO') {
          position = "Global Fiscal Dominance Drives Bitcoin Adoption";
          argument = `Every major government on earth is running structural fiscal deficits they will never close through taxation — they will monetize them through currency debasement. This is the foundational macro thesis for Bitcoin. As sovereign debt credibility erodes and real yields go negative, capital migrates into the only asset with a mathematically inviolable supply cap.`;
        } else if (topic === 'LIQUIDITY') {
          position = "Bitcoin's Market Depth and Institutional Bid";
          argument = `Bitcoin is now the most liquid asset in the world outside US Treasuries and major FX pairs for its market cap. With spot ETF wrapper products, institutional desks can deploy hundreds of millions without moving the market. Altcoin liquidity is structurally different — shallow, manipulable, and subject to sudden market maker withdrawal.`;
        } else if (topic === 'HALVING') {
          position = "Algorithmic Supply Reduction is the Core Investment Thesis";
          argument = `Every Bitcoin halving is a programmatic 50% reduction in new supply creation — an event with no analog in all of monetary history. Unlike central bank rate decisions, the halving is immutable, scheduled, and perfectly transparent. The 12-18 month post-halving window historically represents the most favorable risk-adjusted entry window for corporate treasury allocation.`;
        } else if (topic === 'L2_SOLANA') {
          position = "Counterparty Software vs Sound Money";
          argument = `Everything other than Bitcoin carries counterparty risk, software inflation, and governance exposure. They are speculative software companies, not pristine, immutable thermodynamic property.`;
        } else {
          argument = isBtc
            ? `Bitcoin is pristine monetary energy. Every corporate treasury on earth will eventually convert their melting cash reserves into this indestructible digital property. There is no second best.`
            : `At ${evidence?.priceFormatted || 'current levels'}, this asset possesses an issuing counterparty or governance risk. It is an equity-like venture, not indestructible thermodynamic capital.`;
        }

        return {
          position,
          confidence: isBtc ? 98 : 91,
          argument,
          keyRisk: isBtc ? "Regulatory overreach attempting to restrict self-custodial mining." : "Continuous token emissions, venture unlocks, and structural counterparty failure.",
          keyEvidence: isBtc ? "Cumulative institutional balance sheet holdings and fixed 21 million supply schedule." : "Token supply is not permanently hardcapped against future administrative dilution.",
          preliminaryVote: isBtc ? "ADD" : "REDUCE"
        };
      },
      generateChallenge(opponent, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${opponent.name}: Setiap token yang memiliki yayasan aktif memiliki risiko lawan transaksi (counterparty risk). Mengapa mempertaruhkan modal institusi pada sesuatu yang bisa diubah atau diencerkan oleh manusia?`;
        }
        return `To ${opponent.name}: Every software token with an active foundation has an issuer counterparty. Why risk institutional balance sheet capital on something that can be re-engineered or diluted?`;
      },
      generateResponse(challenger, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${challenger.name}: Uang fiat adalah balok es yang mencair 10-15% per tahun. Bitcoin adalah termodinamika moneter murni—energi yang tersimpan melintasi waktu dan ruang dengan nol entropi.`;
        }
        return `To ${challenger.name}: Cash is a melting ice cube losing 10-15% purchasing power annually. Bitcoin is pure monetary thermodynamics—capital stored across time and space with zero entropy.`;
      },
      generateVote(asset, evidence, query) {
        const isBtc = asset?.ticker === 'BTC' || /btc|bitcoin/i.test(query || '');
        if (isBtc) {
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
      avatarImg: '/img/cz.png',
      record: { sessions: 50, votedFor: 31, dissents: 19 },
      traits: { decentralizationBias: 4, censorshipResistance: 5, securityFocus: 7, throughputBias: 9 },
      generateAnalysis(asset, evidence, query) {
        const { topic, isIndo, cleanQuery } = analyzeTopic(query, asset);
        const hasHighVolume = evidence?.volume24h > 50000000;

        let argument = "";
        let position = hasHighVolume ? "Deep Market Liquidity" : "Orderbook Liquidity Evaluation";

        if (topic === 'SOL_VS_ETH') {
          position = "Exchange Liquidity & Ecosystem Adoption";
          argument = `From a pure exchange infrastructure standpoint, Solana has become a dominant ecosystem for on-chain trading volume — meme coins, NFTs, and DeFi on Solana generate more daily transactions than most L2s combined. SOL/USDT spot depth on major orderbooks is deep and growing. However, Ethereum's ecosystem has more institutional-grade DeFi TVL and broader cross-chain bridge infrastructure. Long-term competitiveness will be decided by which chain makes it easiest for the next hundred million users to onboard, trade, and hold without losing funds to bridge exploits or network outages.`;
        } else if (topic === 'CRASH') {
          position = "Market Cycle Normalization";
          argument = isIndo
            ? `Koreksi pasar adalah bagian alami dari siklus industri kripto. Kami telah melihat volatilitas serupa di 2017, 2020, dan 2022. Kuncinya sederhana: kelola risiko portofolio Anda, jangan terbawa FUD spekulatif, dan fokuslah membangun infrastruktur adopsi pengguna jangka panjang.`
            : `Market corrections are natural market cycles. We survived the downturns of 2017, 2020, and 2022. Keep your leverage low, ignore speculative FUD, and focus on building durable user infrastructure.`;
        } else if (topic === 'MEMECOIN') {
          position = "Retail Liquidity & Community Sentiment";
          argument = `Memecoins reflect genuine grassroots retail demand. While we don't judge user enthusiasm, our priority is deep orderbook liquidity, consumer asset safety, and transparent risk disclosure.`;
        } else if (topic === 'LEVERAGE') {
          position = "Futures Open Interest & Liquidation Microstructure";
          argument = `When perpetual funding rates diverge sharply from spot prices and open interest climbs to multi-month highs, orderbooks become fragile. Liquidation engines have to market-sell large blocks during high volatility, blowing through top-of-book bids. Managing leverage is essential to avoid forced liquidation wicks.`;
        } else if (topic === 'ETF_FLOWS') {
          position = "Bridging Traditional & Crypto Capital Markets";
          argument = `Spot ETFs connect regulated retirement funds to crypto assets, expanding the total addressable market by trillions. The interplay between ETF market hours and 24/7 crypto spot orderbooks creates permanent basis arbitrage and deepens structural liquidity.`;
        } else if (topic === 'EXCHANGE_RISK') {
          position = "Proof of Reserves & User Asset Protection";
          argument = `Trust requires continuous proof. Exchanges must publish cryptographic Merkle-tree Proof of Reserves showing 1:1 backed customer assets, maintain transparent emergency reserves (like SAFU), and never rehypothecate customer funds. If an exchange cannot prove its reserves publicly, users should not trade there.`;
        } else if (topic === 'MACRO') {
          position = "Global Retail Adoption Resiliency";
          argument = `While macro tightening cycles cause hedge funds to trim positions, grassroots retail adoption in emerging markets with hyperinflating fiat currencies continues to accelerate. Peer-to-peer volume and stablecoin rails prove crypto is an indispensable global utility.`;
        } else if (topic === 'LIQUIDITY') {
          position = "Orderbook Depth & Market Maker Density";
          argument = `Liquidity is the lifeblood of any market. We look at +/- 2% orderbook depth across major pairs, active market maker presence, and slippage on large execution blocks. High nominal volume without real bid-ask depth is just wash trading.`;
        } else if (topic === 'REGULATION') {
          position = "Pragmatic Global Licensing Standards";
          argument = `Clear regulatory frameworks and licensing agreements with financial authorities around the world are essential for sustainable growth. Banning innovation only pushes activity underground; proactive compliance creates a safe environment for mass onboarding.`;
        } else {
          argument = `Evaluating orderbook depth and retail velocity. Product utility and low friction always defeat ideological purity that ordinary people cannot navigate.`;
        }

        return {
          position,
          confidence: 87,
          argument,
          keyRisk: "Exchange liquidity dry-ups and punitive slippage during market panics.",
          keyEvidence: "24-hour exchange volume and cross-pair market depth across major spot orderbooks.",
          preliminaryVote: hasHighVolume ? "ADD" : "PASS"
        };
      },
      generateChallenge(opponent, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${opponent.name}: Whitepaper akademis Anda mungkin elegan, tetapi di mana penggunanya? Jaringan terdesentralisasi tanpa pengguna aktif hanyalah kota hantu digital, bukan ekonomi nyata.`;
        }
        return `To ${opponent.name}: Your theoretical whitepaper is elegant, but where are the users? A decentralized network with 20 active wallets is a digital ghost town, not an economy.`;
      },
      generateResponse(challenger, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${challenger.name}: Anda tidak bisa membangun kebebasan ekonomi jika tidak ada orang yang mampu memahami atau membayar biaya antarmuka Anda. Adopsi massal membutuhkan distribusi yang mudah diakses.`;
        }
        return `To ${challenger.name}: You cannot build economic freedom if nobody can understand or afford the user interface. Mass adoption requires accessible, lightning-fast distribution.`;
      },
      generateVote(asset, evidence, query) {
        return { vote: "ADD", rationale: "Vibrant trading volume, deep exchange liquidity, and demonstrable retail engagement." };
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
      avatarImg: '/img/armstrong.png',
      record: { sessions: 43, votedFor: 22, dissents: 21 },
      traits: { decentralizationBias: 5, censorshipResistance: 5, securityFocus: 8, throughputBias: 6 },
      generateAnalysis(asset, evidence, query) {
        const { topic, isIndo, cleanQuery } = analyzeTopic(query, asset);
        const isCompliant = ['BTC', 'ETH', 'CRYPTO'].includes(asset?.ticker) || /bitcoin|btc|eth|ethereum/i.test(cleanQuery);

        let argument = "";
        let position = isCompliant ? "Institutional Custody Standard" : "Regulatory Scrutiny Risk";

        if (topic === 'SOL_VS_ETH') {
          position = "Institutional Custody & Regulatory Classification";
          argument = `From a regulatory and institutional custody standpoint, Ethereum has a significant advantage — it was classified as a commodity by the CFTC, its spot ETFs are live, and Coinbase Custody already safeguards billions in ETH institutional assets. Solana lacks a spot ETF approval, faces potential SEC security classification risk, and its repeated network outages raise questions about institutional-grade reliability standards. Long-term competitiveness requires regulatory clarity and custody infrastructure — Ethereum is further ahead on both counts.`;
        } else if (topic === 'CRASH') {
          position = "Institutional Flight to Quality";
          argument = isIndo
            ? `Penurunan pasar menyaring proyek spekulatif tanpa utilitas. Arus modal institusi jangka panjang melalui kustodi teregulasi dan ETF spot tetap solid karena mereka membutuhkan kepastian hukum dan tata kelola yang transparan, bukan skema spekulasi liar.`
            : `Market drawdowns wash out superficial speculative schemes. Long-term institutional allocators use market pullbacks to build positions through compliant custodial and ETF channels.`;
        } else if (topic === 'REGULATION') {
          position = "Statutory Regulatory Bridgehead";
          argument = `True economic freedom requires statutory legal clarity. By pursuing transparent regulatory frameworks and public market standards, we protect users and solidify crypto as foundational global infrastructure.`;
        } else if (topic === 'ETF_FLOWS') {
          position = "Regulated Institutional Custody Benchmark";
          argument = `Coinbase Custody secures over 80% of US spot crypto ETF assets for BlackRock, Franklin Templeton, and others. These inflows represent patient, fiduciary capital with multi-year mandates. Institutional wrapper adoption is the tipping point where digital assets become an immutable allocation in global pension and sovereign wealth portfolios.`;
        } else if (topic === 'LEVERAGE') {
          position = "Regulated Clearing vs Offshore Shadow Leverage";
          argument = `Unregulated offshore derivatives exchanges with 100x leverage have triggered almost every systemic crash in crypto history. Regulated US futures and options markets with clear margin rules, segregated customer accounts, and transparent clearing houses provide the only sustainable foundation for institutional risk transfer.`;
        } else if (topic === 'EXCHANGE_RISK') {
          position = "Audited Public Custody vs Co-mingled Offshore Risk";
          argument = `As a public company (NASDAQ: COIN) audited by top-tier accounting firms, we maintain strict 1:1 asset backing with bankruptcy-remote custody structures. The era of opaque offshore exchanges using customer funds for proprietary trading is over. Institutional capital demands audited balance sheets and legal recourse.`;
        } else if (topic === 'MACRO') {
          position = "Bipartisan Legal Certainty Accelerates Capital Flow";
          argument = `Regardless of short-term interest rate decisions, the long-term trend in Washington and global financial centers is toward codifying crypto market structure. As statutory clarity arrives, trillions in traditional financial capital sidelined by regulatory ambiguity will gain regulatory approval to enter the market.`;
        } else if (topic === 'LIQUIDITY') {
          position = "Prime Brokerage & Institutional Execution Depth";
          argument = `Institutional liquidity requires smart order routing across both exchange orderbooks and OTC desks, minimizing market impact for multi-million dollar allocations. Transparent execution rails and compliant fiat gateways are critical for continuous market liquidity.`;
        } else {
          argument = `The real bridge to escape velocity is institutional capital. Can this asset be held by regulated custodians, sovereign wealth funds, and exchange-traded funds without statutory securities violations?`;
        }

        return {
          position,
          confidence: 88,
          argument,
          keyRisk: "Statutory regulatory enforcement actions and banking rail de-platforming.",
          keyEvidence: "Clear regulatory classification and cold-storage custody compliance records.",
          preliminaryVote: isCompliant ? "ADD" : "PASS"
        };
      },
      generateChallenge(opponent, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${opponent.name}: Tanpa kepatuhan regulasi dan kustodi institusi berlisensi, 99% kekayaan institusi dunia tidak dapat menyentuh aset ini. Bagaimana Anda menjembatani dana pensiun global tanpa jalur hukum resmi?`;
        }
        return `To ${opponent.name}: Without regulatory compliance and institutional custody, 99% of global institutional wealth cannot touch this asset. How do you bridge to sovereign pension capital without legal rails?`;
      },
      generateResponse(challenger, query) {
        const { isIndo } = analyzeTopic(query);
        if (isIndo) {
          return `Kepada ${challenger.name}: Bekerja melalui kerangka hukum dan preseden pengadilan adalah satu-satunya cara untuk menegakkan hak kepemilikan permanen dan melindungi konsumen dari pelaku penipuan.`;
        }
        return `To ${challenger.name}: Working through legal frameworks and court precedent is the only way to establish permanent property rights and protect everyday retail consumers from illicit operators.`;
      },
      generateVote(asset, evidence, query) {
        const isCompliant = ['BTC', 'ETH'].includes(asset?.ticker) || /bitcoin|btc|eth|ethereum/i.test(query || '');
        if (isCompliant) {
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
    getAgentByName,
    analyzeTopic
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
