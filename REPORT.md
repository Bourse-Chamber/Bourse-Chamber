# Bourse Chamber — System Report & Technical Overview

**Date:** 24 September 2026  
**Status:** Production Ready (Vercel Deployed)  
**Repository:** `davitzarly/Bourse-Chamber`  
**Live URL:** [https://bourse-chamber.vercel.app](https://bourse-chamber.vercel.app)  
**Test Suite:** 58 / 58 Passing (100% pass rate)

---

## 1. Executive Summary

**Bourse Chamber** is an institutional-grade, multi-agent AI deliberation platform designed specifically for cryptocurrency and digital asset governance. The chamber simulates an unyielding council floor of **nine canonical crypto architects, founders, and theorists** who rigorously deliberate over market hypotheses, tokenomics, protocol moat viability, and token contract addresses (`TOKEN_CA`).

Every deliberation progresses through structured debate rounds and concludes with binding, on-the-record roll-call votes archived in a tamper-evident, permanent **Verdict Ledger**.

---

## 2. The Nine Canonical Crypto Architect Seats

The platform has transitioned from traditional economists to nine authoritative crypto pioneers, each governing from distinct technical and economic first principles:

| Seat | Persona | Category | Core Discipline & Thesis | Key Inquiry |
|:---:|:---|:---|:---|:---|
| **01** | **Satoshi Nakamoto** | Cypherpunk | Sound money, PoW, absolute censorship resistance | *"Can this asset resist state capture without centralized trust?"* |
| **02** | **Vitalik Buterin** | Logic | Programmable state, mechanism design, L2 scaling | *"Is the mechanism design resilient to collusion and economic attacks?"* |
| **03** | **Nick Szabo** | Cypherpunk | Smart contracts, trust minimization, wet vs. dry code | *"Does this system sacrifice trust minimization for short-term throughput?"* |
| **04** | **Hal Finney** | Cypherpunk | Cryptographic primitives, RPOW, long-term durability | *"Will this cryptographic infrastructure survive a multi-decade horizon?"* |
| **05** | **Michael Saylor** | Treasury | Balance sheet reserves, digital property invariants | *"Can this asset reliably preserve corporate treasury purchasing power?"* |
| **06** | **Brian Armstrong** | Rails | Regulated infrastructure, compliance, custodial liquidity | *"Can this project bridge into global institutional custody and compliance?"* |
| **07** | **Arthur Hayes** | Macro | Derivative liquidity, funding rates, central bank fiat cycles | *"Where is the reflexivity, and what happens when the liquidity tide turns?"* |
| **08** | **Chris Burniske** | Valuation | Tokenomic capital assets, network equation of exchange (PQ=MV) | *"Does the token actually capture protocol revenue or just speculative velocity?"* |
| **09** | **Anatoly Yakovenko** | Scaling | High-throughput state execution, Proof of History, pipeline speed | *"Can this protocol scale globally without sharding user and liquidity state?"* |

---

## 3. Core Capabilities & Deliberation Architecture

### 3.1 Three-Round Floor Deliberation
1. **Round 1 — Independent Readings:** All participating seats simultaneously evaluate the market evidence pack in strict isolation without seeing peers' initial reactions.
2. **Round 2 — Cross-Examination Duel:** The floor identifies the sharpest ideological clash and convenes a direct point-counterpoint duel between opposing personas.
3. **Round 3 — Binding Roll-Call Vote:** Every seat issues an immutable vote (`ADD` / `REDUCE` / `PASS` or `SUPPORTED` / `NOT_SUPPORTED` / `INSUFFICIENT_EVIDENCE`) accompanied by a formal governance rationale.

### 3.2 Token Contract Address (`TOKEN_CA`) Auditing
- **Priority 1 Classification:** Automatically detects queries containing EVM (0x...) or Solana (base58) contract addresses and target market caps (e.g., "$10M", "100k", "1B").
- **Quantitative Feasibility:** Analyzes current market cap, target market cap, required expansion multiple, DEX liquidity pool depth, and 24-hour trading volume.
- **Contract Integrity:** Audits mint authority revocation, LP lock duration, deployer concentration, and contract verification status.
- **Strict Evidence Handling:** Flags missing metrics as `DATA UNAVAILABLE` rather than fabricating numbers, and issues `INSUFFICIENT_EVIDENCE` when critical safeguards cannot be verified.

### 3.3 Dynamic Position Sizing (Taleb Invariants)
- Recommends conservative capital allocation bands (`0.5%–1.0%`, `1.0%–2.0%`, etc.) calibrated to tail-risk and convexity.
- Automatically suppresses position sizing on pure CA audits and feasibility checks unless the user explicitly requests allocation guidance.

### 3.4 Automated Drawdown Watcher (CRON)
- Users can subscribe with an email on any verdict record.
- Daily cron job monitors real-time CoinGecko market pricing.
- Automatically dispatches an alert and marks the chamber for reconvening if the asset incurs a drawdown of 30–35% or network activity contracts by >35%.

---

## 4. Summary of Recent Improvements & Bug Fixes

### 4.1 Verdict Record Layout & Ballots Alignment (Fixed in `ccfe228`)
- **Problem:** In the Individual Ballots list on `/verdict`, long badge labels (`INSUFFICIENT_EVIDENCE` at 21 characters) were placed in a rigid `100px` grid column. This caused the badge background to overflow and the rationale text in the adjacent column to render directly on top of the badge text.
- **Resolution:**
  - Expanded badge column width to `185px` (`grid-template-columns: 44px 195px 185px 1fr`).
  - Wrapped each badge in `.vote-badge-cell` with `display: flex; align-items: center; white-space: nowrap; flex-shrink: 0`.
  - Added responsive media queries for tablet/mobile (`@media (max-width: 960px)` uses `grid-template-columns: 38px 1fr auto` with right-aligned badge, and `@media (max-width: 520px)` stacks elements cleanly).

### 4.2 Verdict Record Semantics & Readability
- **Preserved Token Identity:** Strict retention of user-entered token tickers (e.g. `CASHCAT`) throughout synthesis, titles, and ballots, eliminating generic placeholders like "TOKEN" or "CRYPTO".
- **Mathematical Growth vs. Sustainability:** When target market cap is below current market cap, the system explicitly distinguishes that no additional multiple is required while still fully evaluating long-term sustainability.
- **Structured Synthesis:** Transformed previous single-paragraph synthesis into distinct visual cards (Question Deliberated, Key Evidence, Key Findings, Areas of Agreement, Areas of Disagreement, Unresolved Issues, Conclusion).
- **Concise Conclusion:** Clear, 1–2 sentence authoritative conclusion statement.

### 4.3 Branding & Interactive UI Polishing
- **Brutalist Cybernetic Logo:** Added custom geometric logo mark with subtle radar ping and pulse animations in the sticky navigation.
- **Interactive 3D Isometric Cube:** Added playful zero-g floating animation with blinking faces and sparkle particles on the `/overview` landing page.
- **Whitespace Harmonization:** Tightened bottom footer distances across `/chamber` and `/crypto-bench`, eliminating dead empty space.

---

## 5. Verification & Quality Assurance

### Test Suite Execution
```bash
> node --test tests/*.test.js
ℹ tests 58
ℹ suites 4
ℹ pass 58
ℹ fail 0
ℹ duration_ms 214.28ms
```

### Coverage Highlights:
- **`DeliberationEngine`:** 9-seat fixed council, supermajority rules, tie-breaking, asymmetric burden of proof, TOKEN_CA classification, market cap multiple calculation.
- **`CouncilAgents`:** Data integrity for all 9 canonical crypto architects.
- **`Storage & Utils`:** LocalStorage session persistence, deterministic pixel avatars, XSS sanitization, formatters.
- **`CoinGecko & Cron`:** Live market feed normalization, data gap handling, CRON_SECRET authorization.
- **`Next.js Production Build`:** Clean build across all routes and API endpoints.

---

## 6. Directory Structure

```text
bourse-chamber/
├── api/                    # Vercel Serverless Functions
│   ├── deliberate.ts       # Floor debate orchestration
│   ├── market.ts           # CoinGecko market evidence provider
│   ├── og.js               # Dynamic 1200x630 social card generator
│   └── cron/watcher.ts     # Automated drawdown monitor
├── css/                    # Modular Style Sheets
│   ├── main.css            # Brutalist monochrome design system
│   ├── chamber.css         # Council chamber geometry & animations
│   ├── bench.css           # Crypto bench dossiers
│   ├── ledger.css          # Historical ledger search & filters
│   └── verdict.css         # Verdict record & individual ballots styling
├── js/                     # Vanilla Client-Side Controllers
│   ├── app.js              # Global bootstrap & dossier modal controller
│   ├── chamber.js          # Live chamber state machine & streaming transcript
│   ├── crypto-agents.js    # 9 Crypto Architect persona definitions
│   ├── ledger.js           # Searchable verdict ledger table
│   └── verdict.js          # Verdict viewer & debate replay player
├── public/                 # Static Assets & Synced Production Mirrors
├── src/                    # Next.js Application & Server Libs
│   ├── app/                # Next.js App Router (SSR Verdict & OG previews)
│   └── lib/                # Engine, DB client, OpenRouter integration
├── tests/                  # Automated Test Suite (58 passing tests)
├── README.md               # User & Developer Documentation
└── REPORT.md               # This Document
```

---

*Report prepared and certified for Bourse Chamber governance.*
