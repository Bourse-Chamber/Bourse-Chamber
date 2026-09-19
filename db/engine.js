// Session reasoning engine.
//
// This replaces the old chamber.html behaviour where the verdict word was
// hardcoded to "PASS" and the dissent count was `3 + Math.floor(Math.random()*3)`.
// It is a deterministic, rule-based heuristic — NOT a live LLM or market-data
// model — but it is a real function of (a) the thesis text and (b) each
// agent's fixed philosophical traits, so the same thesis always produces the
// same tally, and different theses produce genuinely different tallies.
// The evidence panel in chamber.html is labelled DEMO DATA for the same
// reason: there is no live price feed wired in.

const { AGENTS } = require("./agents");

// Deterministic 32-bit string hash (same FNV-1a variant already used by the
// avatar generator, so no new hashing behaviour is introduced to the code).
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// A stable pseudo-random float in [-1, 1] derived from a seed string.
function seededSigned(seed) {
  const h = hash(seed);
  return (h % 2000) / 1000 - 1; // -1..1
}

const GROWTH_WORDS = ["adopt", "user", "network", "scal", "upside", "grow", "demand", "throughput", "ecosystem", "developer"];
const RISK_WORDS = ["leverage", "unlock", "unproven", "new", "incentiv", "apy", "hype", "meme", "unaudited", "three-month", "3-month", "airdrop", "farm"];
const FUNDAMENTAL_WORDS = ["cash flow", "cashflow", "fee", "revenue", "audited", "established", "margin", "earnings", "profit", "moat"];

function textScore(text, words) {
  const t = text.toLowerCase();
  let score = 0;
  for (const w of words) if (t.includes(w)) score += 1;
  return Math.min(score, 4); // cap so one thesis can't dominate every trait
}

// Deterministically evaluates all 9 agents against a thesis and produces:
//  - a per-agent vote (FOR / AGAINST / ABSTAIN, mapped to ADD/REDUCE/PASS)
//  - an aggregate verdict word, majority count, and a sizing band
function evaluateSession(assetOrThesis) {
  const text = String(assetOrThesis || "").trim();
  const growthSig = textScore(text, GROWTH_WORDS);
  const riskSig = textScore(text, RISK_WORDS);
  const fundSig = textScore(text, FUNDAMENTAL_WORDS);

  const perAgent = AGENTS.map((a) => {
    const jitter = seededSigned(text.toLowerCase() + "::" + a.name) * 1.5;
    const score =
      a.traits.growthBias * (growthSig / 4) -
      a.traits.riskAversion * (riskSig / 4) * 0.9 +
      a.traits.valuationRigor * (fundSig / 4) * 0.7 +
      jitter -
      // agents with high risk aversion and low fundamentals coverage lean
      // cautious by default when a thesis gives them nothing to grab onto
      (growthSig === 0 && fundSig === 0 ? a.traits.riskAversion * 0.15 : 0);

    let vote; // FOR = supports adding/holding, AGAINST = supports reducing, ABSTAIN = pass
    if (score >= 2.2) vote = "FOR";
    else if (score <= -2.2) vote = "AGAINST";
    else vote = "ABSTAIN";

    return { agent: a, score: Number(score.toFixed(2)), vote };
  });

  const forCount = perAgent.filter((p) => p.vote === "FOR").length;
  const againstCount = perAgent.filter((p) => p.vote === "AGAINST").length;
  const abstainCount = 9 - forCount - againstCount;

  let verdict;
  if (forCount > againstCount && forCount >= 5) verdict = "ADD";
  else if (againstCount > forCount && againstCount >= 5) verdict = "REDUCE";
  else verdict = "PASS";

  const majority = Math.max(forCount, againstCount, abstainCount);

  // Sizing band scales with conviction spread and inversely with the risk
  // signal detected in the thesis text.
  const spread = Math.abs(forCount - againstCount);
  let low, high;
  if (verdict === "PASS") {
    low = high = 0;
  } else {
    const base = 0.4 + spread * 0.35 - riskSig * 0.15;
    low = Math.max(0.2, Number(base.toFixed(1)));
    high = Math.max(low + 0.5, Number((base + 1.2 + fundSig * 0.3).toFixed(1)));
  }

  return {
    perAgent,
    forCount,
    againstCount,
    abstainCount,
    verdict,
    majority,
    sizeBand: verdict === "PASS" ? null : `${low.toFixed(1)}–${high.toFixed(1)}%`,
    signals: { growthSig, riskSig, fundSig }
  };
}

// Deterministic demo "market data" for the Evidence Pack panel — clearly
// fake, seeded so the same asset string always shows the same numbers in a
// given run (Part J #1: "Evidence Pack render step ... clearly labeled DEMO DATA").
function demoEvidence(assetOrThesis) {
  const seed = String(assetOrThesis || "").toLowerCase();
  const h = hash(seed);
  const price = 0.01 + (h % 100000) / 100;
  const change = ((h >>> 3) % 4000) / 100 - 20; // -20%..+20%
  const volume = 1_000_000 + (h % 900_000_000);
  return {
    price: Number(price.toFixed(price < 10 ? 4 : 2)),
    change24h: Number(change.toFixed(2)),
    volume24h: Math.round(volume),
    label: "DEMO DATA — not a live feed"
  };
}

module.exports = { evaluateSession, demoEvidence, hash };
