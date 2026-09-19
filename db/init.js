const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const { AGENTS } = require("./agents");

const DB_PATH = path.join(__dirname, "bourse-chamber.sqlite");
const db = new DatabaseSync(DB_PATH);

db.exec(`
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  asset TEXT NOT NULL,
  thesis TEXT NOT NULL,
  verdict TEXT NOT NULL,
  for_count INTEGER NOT NULL,
  against_count INTEGER NOT NULL,
  abstain_count INTEGER NOT NULL,
  majority INTEGER NOT NULL,
  size_band TEXT,
  opened_at TEXT NOT NULL,
  closed_at TEXT NOT NULL,
  seats_present INTEGER NOT NULL DEFAULT 9,
  speaking_turns INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  legacy INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS votes (
  session_id TEXT NOT NULL,
  seat INTEGER NOT NULL,
  agent_name TEXT NOT NULL,
  discipline TEXT NOT NULL,
  vote TEXT NOT NULL,
  reasoning TEXT,
  score REAL,
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS transcript (
  session_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  speaker TEXT NOT NULL,
  discipline TEXT,
  type TEXT NOT NULL,
  body TEXT NOT NULL,
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_votes_session ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_transcript_session ON transcript(session_id);
`);

function alreadySeeded() {
  const row = db.prepare("SELECT COUNT(*) AS n FROM sessions").get();
  return row.n > 0;
}

function insertSession(rec) {
  db.prepare(`
    INSERT INTO sessions (id, asset, thesis, verdict, for_count, against_count, abstain_count,
      majority, size_band, opened_at, closed_at, seats_present, speaking_turns, summary, legacy)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    rec.id, rec.asset, rec.thesis, rec.verdict, rec.forCount, rec.againstCount, rec.abstainCount,
    rec.majority, rec.sizeBand, rec.openedAt, rec.closedAt, rec.seatsPresent || 9,
    rec.speakingTurns || 0, rec.summary || null, rec.legacy ? 1 : 0
  );
}

function insertVote(sessionId, v) {
  db.prepare(`INSERT INTO votes (session_id, seat, agent_name, discipline, vote, reasoning, score)
    VALUES (?,?,?,?,?,?,?)`)
    .run(sessionId, v.seat, v.agentName, v.discipline, v.vote, v.reasoning || null, v.score || null);
}

function insertTranscript(sessionId, seq, msg) {
  db.prepare(`INSERT INTO transcript (session_id, seq, speaker, discipline, type, body)
    VALUES (?,?,?,?,?,?)`)
    .run(sessionId, seq, msg.speaker, msg.discipline || null, msg.type, msg.body);
}

function seed() {
  if (alreadySeeded()) return;

  const byName = Object.fromEntries(AGENTS.map((a) => [a.name, a]));

  // --- BC-0411 (SOL) — the one row that ships with a fully authored,
  // internally-consistent verdict page (Part G.2/G.3, verbatim). ---
  insertSession({
    id: "BC-0411",
    asset: "SOL",
    thesis: "Is throughput a moat, or a commodity waiting to be priced?",
    verdict: "REDUCE",
    forCount: 5,
    againstCount: 3,
    abstainCount: 1,
    majority: 5,
    sizeBand: "0.5–1.0%",
    openedAt: "2026-09-05T09:12:00",
    closedAt: "2026-09-05T09:47:00",
    seatsPresent: 9,
    speakingTurns: 14,
    summary: "Carried 5 to 4, the narrowest majority on the ledger this quarter. Two seats filed dissent against the sizing rather than the direction.",
    legacy: 0
  });

  const sol0411Votes = [
    ["Benjamin Graham", "FOR", "No floor under the price that survives a failed narrative."],
    ["Charlie Munger", "FOR", "Three dull ways to lose, one clever way to win."],
    ["Peter Lynch", "AGAINST", "Usage is visible and explainable; that earns patience."],
    ["Cathie Wood", "AGAINST", "Early on the curve. Selling here is selling the thesis."],
    ["Aswath Damodaran", "FOR", "Price implies growth the sector has never sustained."],
    ["Nassim Nicholas Taleb", "FOR", "Vote is on survivable sizing, not on the forecast."],
    ["Mohnish Pabrai", "ABSTAIN", "Uncertainty is real, capped downside is not. Half a setup."],
    ["Bill Ackman", "AGAINST", "Either it deserves size or it deserves nothing. Trimming is neither."],
    ["Michael Burry", "FOR", "Concentrated float, unlocks into thin books."]
  ];
  sol0411Votes.forEach(([name, vote, reasoning]) => {
    const a = byName[name];
    insertVote("BC-0411", { seat: a.seat, agentName: a.name, discipline: a.discipline, vote, reasoning });
  });

  const sol0411Transcript = [
    ["chair", "Chairman", null, "The floor is open on SOL. Nine seats, one motion: is throughput a moat, or a commodity waiting to be priced?"],
    ["agent", "Cathie Wood", "Growth and disruption", "Throughput is not the moat — the developer base sitting on top of it is. Every seat here is pricing a single quarter of fee compression as if it were the terminal state. This chain is four years into a ten-year adoption curve and the room keeps valuing it on the last drawdown."],
    ["agent", "Aswath Damodaran", "Story into numbers", "Then give me the inputs, not the adjective. At the current level you need fee revenue compounding well above anything this sector has sustained for four consecutive quarters, with take rates that have fallen every time throughput rose. I can build the optimistic case; it simply does not reach today's price without assumptions nobody at this table would defend in writing."],
    ["agent", "Michael Burry", "Contrarian audit", "Nobody has mentioned who is holding this. A concentrated float with unlocks landing into thin books, and a base that is calm only because it has not needed to exit at once. Throughput does not help you on the day everyone tries the door at the same time."],
    ["agent", "Nassim Nicholas Taleb", "Tail risk", "I will not vote on whether it is a moat, because that is unknowable from this table. I vote on what survives being wrong. At half a percent, wrong is a bad week. At four, wrong is the year. Reduce, and stop arguing about the forecast."],
    ["verdict", "Verdict", null, "REDUCE — carried 5 to 4. Size band 0.5–1.0% of book. Two seats filed dissent against the sizing rather than the direction."]
  ];
  sol0411Transcript.forEach((m, i) => insertTranscript("BC-0411", i + 1, { type: m[0], speaker: m[1], discipline: m[2], body: m[3] }));

  // --- Nine legacy ledger rows (Part G.2) — summary-only. Real per-seat
  // votes/transcript were never authored for these in the original build,
  // so verdict.html falls back to a "verdict not yet on record" state for
  // them instead of fabricating detail (Part G.2 recommendation). ---
  const legacyRows = [
    ["BC-0501", "BTC", "Core holding at current levels, or reduce into strength?", "ADD", 6, "3.0–5.0%", "2026-09-12"],
    ["BC-0490", "ETH", "Does staking yield justify a permanent core position?", "ADD", 6, "2.0–3.5%", "2026-09-09"],
    ["BC-0480", "LINK", "Oracle dominance versus fee capture at the token layer.", "PASS", 5, null, "2026-09-02"],
    ["BC-0460", "HYPE", "Perp DEX revenue run rate against unlock schedule.", "REDUCE", 7, "0.3–0.8%", "2026-08-28"],
    ["BC-0455", "NEW L2", "40% incentivised APY on a three-month-old chain.", "PASS", 8, null, "2026-08-25"],
    ["BC-0442", "DOGE", "Is attention a durable asset class?", "PASS", 9, null, "2026-08-21"],
    ["BC-0430", "RWA BASKET", "Tokenised treasuries as the cash leg of the book.", "ADD", 7, "5.0–8.0%", "2026-08-18"],
    ["BC-0421", "AI AGENT TOKENS", "Narrative rotation or a real revenue category?", "PASS", 6, null, "2026-08-14"],
    ["BC-0415", "LST BASKET", "Does the extra yield pay for the extra smart-contract tail?", "REDUCE", 5, "1.0–2.0%", "2026-08-11"]
  ];
  legacyRows.forEach(([id, asset, thesis, verdict, forCount, sizeBand, dateStr]) => {
    const against = verdict === "REDUCE" ? forCount : 9 - forCount;
    insertSession({
      id, asset, thesis, verdict,
      forCount: verdict === "ADD" || verdict === "REDUCE" ? forCount : Math.round(9 / 3),
      againstCount: 9 - forCount,
      abstainCount: 0,
      majority: forCount,
      sizeBand,
      openedAt: dateStr + "T09:00:00",
      closedAt: dateStr + "T09:40:00",
      seatsPresent: 9,
      speakingTurns: 0,
      summary: null,
      legacy: 1
    });
  });

  console.log("Seeded database with 10 ledger records (1 full, 9 legacy summaries).");
}

seed();

module.exports = db;
