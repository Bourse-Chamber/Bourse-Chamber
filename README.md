# Bourse Chamber

> **Nine economists. One market that refuses to behave.**

Bourse Chamber is an institutional AI-powered crypto investment debate chamber inspired by multi-agent research workflows. A user submits a crypto asset or investment thesis to the floor, triggering a structured, multi-stage council debate:

1. **Evidentiary Pack**: Locks verifiable baseline metrics (price, volume, market cap, supply schedules, network velocity, and macro liquidity context).
2. **9 Independent Readings**: Nine distinct economic personas evaluate the asset strictly in parallel—without viewing each other's initial analysis.
3. **Cross-Examination**: The moderator identifies acute ideological disagreement and convenes a direct clash between opposing seats.
4. **9-Seat Roll-Call Voting**: Every seat casts an immutable ballot (`ADD`, `REDUCE`, or `PASS`) backed by its governing discipline.
5. **Verdict Aggregation**: A deterministic aggregation engine computes the majority ratio, dissent breakdown, and suggested position sizing band.
6. **Permanent Verdict Ledger**: Every deliberation is permanently archived and shareable via a persistent URL record.

Built strictly with **HTML5, CSS3, and Vanilla JavaScript** without frontend frameworks (no React, Next.js, Vue, or Angular).

---

## 1. Complete File Tree

```
bourse-chamber/
│
├── index.html              # Landing Page (Hero, 4-stage process, 9-seat bench preview, CTAs)
├── chamber.html            # Council Chamber (Circular 9-seat stage, live transcript, voting tally, composer)
├── bench.html              # The Bench (9 Persona Dossiers, 5 School filters, questioning criteria)
├── ledger.html             # Verdict Ledger (Searchable closed-session archive, dynamic summary metrics)
├── verdict.html            # Verdict Record (?id=BC-XXXX, votes table, transcript replay player, triggers)
│
├── css/
│   ├── main.css            # Tokenized monochrome design system, dither/pixel patterns, nav, footer, drawer
│   ├── chamber.css         # Council arena geometry, spoke lines, pulse/speaking animations, composer
│   ├── bench.css           # 3-column persona grid, category filter tabs, historical statistics
│   ├── ledger.css          # Metrics ribbon, instant search bar, terminal data table
│   └── verdict.css         # Case overview, verdict stamp card, votes breakdown, replay player
│
├── js/
│   ├── app.js              # Global bootstrap: navigation, mobile collapse, dossier drawer controller
│   ├── utils.js            # Deterministic pixel avatar generator (SVG), formatters, timers, clipboard HUD
│   ├── agents.js           # 9 Persona definitions, disciplines, philosophies, reasoning generators
│   ├── mock-data.js        # Market data snapshot synthesis, evidence packs, pre-seeded historical sessions
│   ├── storage.js          # LocalStorage persistence manager (sessions, metrics calculation, auto-seeding)
│   ├── chamber.js          # Chamber state machine, circular layout math, live transcript, cross-exam, voting
│   ├── bench.js            # Bench filter controller (ALL, VALUE, GROWTH, MACRO, RISK, CONTRARIAN)
│   ├── ledger.js           # Ledger renderer, realtime search & verdict filtering, summary metrics
│   └── verdict.js          # Verdict viewer, session loader, replay engine with play/pause/step, share
│
├── data/
│   ├── agents.json         # Static JSON export of the 9 personas
│   ├── sessions.json       # Seeded historical sessions (BC-0411 SOL, BC-0101 BTC, etc.)
│   └── verdicts.json       # Seeded verdict summary records
│
├── db/
│   ├── agents.js           # Backend persona definitions
│   ├── engine.js           # Heuristic tally & cross-exam matching engine
│   ├── init.js             # SQLite initialization & schema
│   └── schema_postgres.sql # Production PostgreSQL / Supabase migration schema
│
├── server.js               # Optional Node/Express server for static hosting & REST API
├── package.json            # Project configuration & scripts
└── README.md               # Architecture documentation & production guide
```

---

## 2. How to Run the Project

### Option A: Pure Static Mode (Zero Dependencies / Immediate Execution)
Double-click `index.html` or open any of the HTML files directly in any modern browser (`file://`).
You can also run a static web server:
```bash
# Python
python -m http.server 8000

# or npx serve
npx serve .
```
Navigate to `http://localhost:8000`.

### Option B: Optional Full-Stack Node.js Server
Requires **Node 22.5+** (uses Node's built-in `node:sqlite`):
```bash
npm install
npm start
```
The server will boot at `http://localhost:3000`:
- Serves the static routes: `/`, `/chamber`, `/bench`, `/ledger`, `/verdict`.
- Hosts the REST API at `/api/agents`, `/api/sessions`, `/api/sessions/:id`, `/api/ledger`.

---

## 3. The Nine Personas & Five Schools

| Seat | Persona | School | Discipline | Core Philosophy / Question |
|---|---|---|---|---|
| **01** | **Benjamin Graham** | `VALUE` | Margin of safety | *"What is this still worth if the narrative dies?"* |
| **02** | **Charlie Munger** | `VALUE` | Mental models | *"Invert: how does this fail in the dullest, most predictable way?"* |
| **03** | **Warren Buffett** | `VALUE` | Quality / economics | *"What protects this moat against a 50-line open-source fork?"* |
| **04** | **Peter Lynch** | `GROWTH` | Growth at reasonable price | *"Adoption you can point at beats adoption you have to model."* |
| **05** | **Howard Marks** | `RISK` | Risk / cycles | *"When everyone believes there is no risk, risk is at its absolute highest."* |
| **06** | **Ray Dalio** | `MACRO` | Macro / regime | *"Capital naturally seeks neutral reserve assets in sovereign debt cycles."* |
| **07** | **Cathie Wood** | `GROWTH` | Innovation / disruption | *"Exponential S-curve convergence disrupts legacy financial architectures."* |
| **08** | **Michael Burry** | `CONTRARIAN` | Contrarian / asymmetric risk | *"Auditing the hidden leverage, predatory unlocks, and exit liquidity traps."* |
| **09** | **Nassim Nicholas Taleb** | `RISK` | Tail risk / antifragility | *"Sizes for the worst week, not the median month. Barbell sizing avoids ruin."* |

---

## 4. How the Multi-Agent Engine Works

### Independent Readings (Round 1)
To ensure unpolluted reasoning, each agent evaluates the filed asset and evidence pack **strictly in isolation**:
$$\text{Agent}_i = f(\text{Asset}, \text{EvidencePack}, \text{PersonaTraits}_i)$$
Agents do **not** read their peers' initial analyses. Each persona generates:
- Position stance & confidence percentage.
- Primary argument grounded in its distinctive discipline.
- Key risk factor & key evidentiary metric.
- Preliminary ballot inclination.

### Cross-Examination (Round 2)
The chair measures divergence across the 9 independent outputs:
- Locates the pair with the greatest ideological friction (e.g., Benjamin Graham's strict liquidation-floor requirement vs. Cathie Wood's exponential S-curve TAM thesis).
- Enters `CHALLENGING` and `RESPONDING` states with spoke animations connecting the two seats.
- Records structured challenge and rebuttal exchanges in the central transcript.

### Real Roll-Call Voting (Round 3) & Verdict Aggregation
Debate closes and all 9 seats cast definitive ballots: `ADD`, `REDUCE`, or `PASS`.
A JavaScript engine computes:
- Majority outcome & ratio (e.g., `6 / 9 ADD`).
- Dissent breakdown (e.g., `2 REDUCE, 1 PASS`).
- Suggested illustrative position size band (e.g., `2.0 – 3.5%` of book).
- Key points of agreement & disagreement.
- 3 Permanent Review Triggers that would reopen deliberation.

---

## 5. API & External Integration Points

### Where Real AI API Integration Should Happen
In `js/agents.js` and `js/chamber.js`, the mock reasoning generators can be wired to LLM inference endpoints (e.g., Anthropic Claude 3.5 Sonnet, OpenAI GPT-4o, or an internal multi-agent orchestrator):

```javascript
// js/agents.js -> replace generateAnalysis with async LLM call:
async function runAgentAnalysis(agent, evidence, question) {
  const response = await fetch('/api/agent/deliberate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      persona: agent.name,
      discipline: agent.discipline,
      philosophy: agent.philosophy,
      evidencePack: evidence,
      thesis: question
    })
  });
  return await response.json(); // returns { position, confidence, argument, keyRisk, preliminaryVote }
}
```

> **Security Rule**: Never place secret API keys in client-side code. Always proxy through a backend endpoint (e.g., Express or serverless function) with environment variables.

### Where Real Market Data API Integration Should Happen
In `js/mock-data.js`, the function `getMarketData(query)` is structured as an async adapter ready for public market data APIs (e.g., CoinGecko, CoinMarketCap, DefiLlama, or an RPC node):

```javascript
// js/mock-data.js -> replace getMarketData with live provider:
async function getMarketData(ticker) {
  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${ticker.toLowerCase()}`);
  const data = await res.json();
  return {
    ticker: ticker.toUpperCase(),
    name: data.name,
    priceFormatted: BourseUtils.formatUSD(data.market_data.current_price.usd),
    change24h: data.market_data.price_change_percentage_24h,
    marketCapFormatted: BourseUtils.formatUSD(data.market_data.market_cap.usd),
    volume24hFormatted: BourseUtils.formatUSD(data.market_data.total_volume.usd),
    // ...
  };
}
```

---

## 6. Database Integration & Architecture

### PostgreSQL / Supabase Schema
For production deployments, the complete enterprise relational schema is documented in `db/schema_postgres.sql`:
- `users`: Authenticated analysts and researchers.
- `agents`: The 9 canonical personas, school categories, and traits.
- `councils`: Session floors, ticker, thesis questions, status machine, timestamps.
- `evidence`: Evidentiary snapshots linked to councils.
- `messages`: Transcript feeds with sequencing and speaker types.
- `votes`: Immutable recorded ballots and stated rationales.
- `verdicts`: Aggregated outcomes, vote ratios, dissent splits, and size bands.
- `review_triggers`: Specific triggers monitored by automated oracles.

### LocalStorage Persistence & Consistency
For zero-dependency portability, the frontend uses `js/storage.js`:
- Sessions are stored under `bourse_sessions`.
- Auto-seeded with historical records (`BC-0411` SOL, `BC-0101` BTC, etc.) on first launch.
- Any newly convened session in `chamber.html` is automatically persisted.
- Visiting `verdict.html?id=BC-XXXX` reads directly from storage, guaranteeing deterministic consistency across page reloads.

---

## 7. Visual Language: Monochrome Financial Terminal
- Palette: `#050505` (Obsidian background), `#0A0A0A` (Card surfaces), `#242424` (Institutional border lines), `#FFFFFF` (Primary text/stamps), `#9A9A9A` (Secondary metrics), `#6E6E6E` (Muted labels).
- Typography: Monospace `JetBrains Mono` and clean editorial sans-serif `Inter`.
- Pixel Avatars: Symmetrical 8x8 monochrome silhouettes generated dynamically from deterministic seeds via inline SVG in `js/utils.js`.
- Accessibility: Respects `prefers-reduced-motion` across pulsing spoke lines and transcript animations.

---

## 8. License & Disclaimers

AI personas are constructed from publicly documented investment philosophies and historical writings. They are not the individuals, do not represent them, and do not constitute financial advice.

© 2026 Bourse Chamber.
