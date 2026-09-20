const express = require("express");
const path = require("node:path");
const db = require("./db/init");
const { AGENTS, SCHOOL_ORDER } = require("./db/agents");
const { evaluateSession, demoEvidence } = require("./db/engine");

const app = express();
app.use(express.json());

// Serve root static files (index.html, chamber.html, bench.html, ledger.html, verdict.html, css/, js/, data/)
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "public")));

// Clean URL routing for conceptual routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/chamber", (req, res) => {
  res.sendFile(path.join(__dirname, "chamber.html"));
});

app.get("/bench", (req, res) => {
  res.sendFile(path.join(__dirname, "bench.html"));
});

app.get("/ledger", (req, res) => {
  res.sendFile(path.join(__dirname, "ledger.html"));
});

app.get("/verdict", (req, res) => {
  res.sendFile(path.join(__dirname, "verdict.html"));
});

app.get("/method", (req, res) => {
  res.sendFile(path.join(__dirname, "method.html"));
});

app.get("/disclaimer", (req, res) => {
  res.sendFile(path.join(__dirname, "disclaimer.html"));
});

app.get("/legal/disclaimer", (req, res) => {
  res.sendFile(path.join(__dirname, "disclaimer.html"));
});

// Vercel-compatible serverless endpoints
app.all("/api/market", (req, res) => {
  require("./api/market")(req, res);
});

app.all("/api/budget", (req, res) => {
  require("./api/budget")(req, res);
});

app.all("/api/session", (req, res) => {
  require("./api/session")(req, res);
});

app.all("/api/og", (req, res) => {
  require("./api/og")(req, res);
});

app.all("/api/watch", (req, res) => {
  require("./api/watch")(req, res);
});

app.all("/api/cron-watcher", (req, res) => {
  require("./api/cron-watcher")(req, res);
});

app.all("/api/cron/watcher", (req, res) => {
  require("./api/cron-watcher")(req, res);
});

// ---------- helpers ----------

function nextSessionId() {
  const rows = db.prepare("SELECT id FROM sessions").all();
  let max = 411;
  for (const r of rows) {
    const m = /^BC-(\d+)$/.exec(r.id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return "BC-" + String(max + 1).padStart(4, "0");
}

function fmtVoteForMotion(vote) {
  return vote;
}

// ---------- API: agents / bench ----------

app.get("/api/agents", (req, res) => {
  res.json({ agents: AGENTS, schoolOrder: SCHOOL_ORDER });
});

// ---------- API: run a session ----------

app.post("/api/sessions", (req, res) => {
  const asset = String((req.body && req.body.asset) || "").slice(0, 200);
  if (!asset.trim()) return res.status(400).json({ error: "asset/thesis is required" });

  const evalResult = evaluateSession(asset);
  const id = nextSessionId();
  const openedAt = new Date();
  const closedAt = new Date(openedAt.getTime() + (2 + evalResult.perAgent.length) * 60000);

  const transcript = [];
  let seq = 1;
  transcript.push({ seq: seq++, type: "chair", speaker: "Chairman", discipline: null,
    body: `The bench convenes on ${asset}. Nine independent reads, followed by cross-examination.` });

  evalResult.perAgent.forEach((p) => {
    transcript.push({
      seq: seq++,
      type: "agent",
      speaker: p.agent.name,
      discipline: p.agent.discipline,
      body: p.agent.say.replace(/\{A\}/g, asset)
    });
  });

  // Cross-examination: the most bullish seat vs. the most bearish seat
  const sorted = [...evalResult.perAgent].sort((a, b) => b.score - a.score);
  const bull = sorted[0], bear = sorted[sorted.length - 1];
  if (bull.agent.name !== bear.agent.name) {
    transcript.push({
      seq: seq++, type: "crossexam", speaker: bull.agent.name, discipline: bull.agent.discipline,
      body: `To ${bear.agent.name}: you're asking "${bear.agent.asks[0]}" — fair, but that framing prices ${asset} as if the base case never plays out. Where does your own number land if it does?`
    });
    transcript.push({
      seq: seq++, type: "crossexam", speaker: bear.agent.name, discipline: bear.agent.discipline,
      body: `To ${bull.agent.name}: "${bull.agent.asks[0]}" is the right question for a different sizing. My vote isn't on the story — it's on ${evalResult.verdict === "PASS" ? "what happens before either of us is proven right" : "what survives if we're both wrong at the same time"}.`
    });
  }

  const verdictLine = evalResult.verdict === "PASS"
    ? `PASS — ${evalResult.againstCount} of 9 against, ${evalResult.abstainCount} abstaining. No motion carries a majority; recorded with no size band attached.`
    : `${evalResult.verdict} — carried ${evalResult.majority} to ${9 - evalResult.majority}. Size band ${evalResult.sizeBand} of book, reviewed on a 30% drawdown.`;
  transcript.push({ seq: seq++, type: "verdict", speaker: "Verdict", discipline: null, body: verdictLine });

  const record = {
    id, asset, thesis: asset,
    verdict: evalResult.verdict,
    forCount: evalResult.forCount,
    againstCount: evalResult.againstCount,
    abstainCount: evalResult.abstainCount,
    majority: evalResult.majority,
    sizeBand: evalResult.sizeBand,
    openedAt: openedAt.toISOString(),
    closedAt: closedAt.toISOString(),
    seatsPresent: 9,
    speakingTurns: transcript.length - 1,
    summary: verdictLine,
    legacy: 0
  };

  db.prepare(`
    INSERT INTO sessions (id, asset, thesis, verdict, for_count, against_count, abstain_count,
      majority, size_band, opened_at, closed_at, seats_present, speaking_turns, summary, legacy)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(record.id, record.asset, record.thesis, record.verdict, record.forCount, record.againstCount,
    record.abstainCount, record.majority, record.sizeBand, record.openedAt, record.closedAt,
    record.seatsPresent, record.speakingTurns, record.summary, 0);

  evalResult.perAgent.forEach((p) => {
    db.prepare(`INSERT INTO votes (session_id, seat, agent_name, discipline, vote, reasoning, score)
      VALUES (?,?,?,?,?,?,?)`)
      .run(id, p.agent.seat, p.agent.name, p.agent.discipline, fmtVoteForMotion(p.vote), null, p.score);
  });

  transcript.forEach((m) => {
    db.prepare(`INSERT INTO transcript (session_id, seq, speaker, discipline, type, body)
      VALUES (?,?,?,?,?,?)`).run(id, m.seq, m.speaker, m.discipline, m.type, m.body);
  });

  res.json({
    session: record,
    transcript,
    votes: evalResult.perAgent.map((p) => ({
      seat: p.agent.seat, name: p.agent.name, discipline: p.agent.discipline,
      vote: p.vote, score: p.score
    })),
    evidence: demoEvidence(asset)
  });
});

// ---------- API: fetch one session (for verdict.html / replay) ----------

app.get("/api/sessions/:id", (req, res) => {
  const id = req.params.id.toUpperCase();
  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);
  if (!session) return res.status(404).json({ error: "not found" });

  const votes = db.prepare("SELECT * FROM votes WHERE session_id = ? ORDER BY seat ASC").all(id);
  const transcript = db.prepare("SELECT * FROM transcript WHERE session_id = ? ORDER BY seq ASC").all(id);

  res.json({ session, votes, transcript });
});

// ---------- API: ledger ----------

app.get("/api/ledger", (req, res) => {
  const q = (req.query.q || "").toString().trim().toLowerCase();
  const verdictFilter = (req.query.verdict || "All").toString();

  let rows = db.prepare("SELECT * FROM sessions ORDER BY closed_at DESC").all();

  if (q) {
    rows = rows.filter((r) =>
      r.asset.toLowerCase().includes(q) || r.thesis.toLowerCase().includes(q));
  }
  if (verdictFilter && verdictFilter !== "All") {
    rows = rows.filter((r) => r.verdict === verdictFilter);
  }

  const all = db.prepare("SELECT * FROM sessions").all();
  const closed = all.length;
  const votedIn = all.filter((r) => r.verdict === "ADD" || r.verdict === "REDUCE").length;
  const majorities = all.map((r) => r.majority).filter((m) => m != null);
  const avgMajority = majorities.length
    ? (majorities.reduce((s, m) => s + m, 0) / majorities.length).toFixed(1)
    : "0.0";
  const bands = all
    .map((r) => r.size_band)
    .filter(Boolean)
    .map((b) => {
      const nums = b.replace("%", "").split(/[–-]/).map(Number).filter((n) => !isNaN(n));
      return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : null;
    })
    .filter((n) => n != null)
    .sort((a, b) => a - b);
  const medianBand = bands.length
    ? bands[Math.floor(bands.length / 2)].toFixed(1) + "%"
    : "—";

  res.json({
    summary: {
      sessionsClosed: closed,
      votedIn,
      avgMajority: `${avgMajority} / 9`,
      medianSizeBand: medianBand
    },
    rows
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bourse Chamber running at http://localhost:${PORT}`);
});
