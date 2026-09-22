const test = require('node:test');
const assert = require('node:assert/strict');
const { AGENTS } = require('../src/lib/agents');
const {
  stripMarkdownFences,
  cleanModelText,
  extractJsonFromModelResponse,
  generateRound1Analysis,
  generateRound2CrossExam,
  generateRound3Vote,
  aggregateVotes
} = require('../src/lib/openrouter');
const sessionHandler = require('../api/session');
const { db } = require('../src/lib/db');

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; return this; },
    send(str) { this.body = str; return this; },
    write(chunk) { this.body += chunk; },
    end(str) { if (str) this.body += str; return this; }
  };
}

// Parse Server-Sent Events from SSE response body
function parseSseEvents(rawBody) {
  const events = [];
  const lines = rawBody.split('\n');
  let currentEvent = 'message';
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('event:')) {
      currentEvent = trimmed.replace('event:', '').trim();
    } else if (trimmed.startsWith('data:')) {
      const jsonStr = trimmed.replace('data:', '').trim();
      try {
        const data = JSON.parse(jsonStr);
        events.push({ event: currentEvent, data });
      } catch (_) {}
    }
  }
  return events;
}

test('Engine Test 1: Markdown fence stripping and text cleaner', () => {
  const fenced = '```json\n{"persona": "Benjamin Graham", "stance": "PASS"}\n```';
  const stripped = stripMarkdownFences(fenced);
  assert.strictEqual(stripped, '{"persona": "Benjamin Graham", "stance": "PASS"}');

  const withThink = '<think>I should be cautious</think>Intrinsic value is uncertain.';
  const cleaned = cleanModelText(withThink);
  assert.strictEqual(cleaned, 'Intrinsic value is uncertain.');
});

test('Engine Test 2: Safe JSON Extraction and Fallbacks', () => {
  const validJson = extractJsonFromModelResponse('Some intro text {"analysis": "Deep margin of safety", "stance": "PASS"} trailing');
  assert.ok(validJson);
  assert.strictEqual(validJson.analysis, 'Deep margin of safety');
  assert.strictEqual(validJson.stance, 'PASS');

  const invalidJson = extractJsonFromModelResponse('This is not json at all');
  assert.strictEqual(invalidJson, null);
});

test('Engine Test 3: Round 1 — All 9 Canonical Personas Reason Independently with Non-Empty Analysis', async () => {
  const testMotion = 'Is Bitcoin still fundamentally strong enough to justify long-term adoption, or is its value increasingly driven by speculation?';
  const testEvidence = 'BTC Price: $65,000 | 24h Vol: $28B | MktCap: $1.28T';

  assert.strictEqual(AGENTS.length, 9, 'Must have exactly 9 canonical personas');

  const analyses = [];
  for (const agent of AGENTS) {
    const r1 = await generateRound1Analysis(agent, testMotion, testEvidence);
    assert.strictEqual(r1.persona, agent.name);
    assert.ok(typeof r1.analysis === 'string' && r1.analysis.trim().length > 0, `Analysis for ${agent.name} must never be empty`);
    assert.ok(Array.isArray(r1.key_claims) && r1.key_claims.length > 0, `Key claims for ${agent.name} must be populated`);
    assert.ok(typeof r1.risk === 'string' && r1.risk.trim().length > 0, `Risk for ${agent.name} must be populated`);
    assert.ok(['ADD', 'REDUCE', 'PASS'].includes(r1.stance), `Stance for ${agent.name} must be ADD, REDUCE, or PASS`);
    analyses.push(r1);
  }

  assert.strictEqual(analyses.length, 9, 'All 9 personas produced Round 1 analysis');
});

test('Engine Test 4: Round 2 — Cross-Examination Structured Duel Between Opposing Personas', async () => {
  const testMotion = 'Is Bitcoin still fundamentally strong enough to justify long-term adoption?';
  const challenger = AGENTS[5]; // Nassim Nicholas Taleb (Seat 6)
  const defender = AGENTS[3]; // Cathie Wood (Seat 4)
  const defenderR1 = {
    persona: defender.name,
    analysis: 'Technological convergence and institutional adoption create parabolic network utility.',
    key_claims: ['Network utility', 'Institutional inflows'],
    risk: 'Short-term regulatory headwind',
    stance: 'ADD'
  };

  const duel = await generateRound2CrossExam(challenger, defender, defenderR1, testMotion, 'Snapshot: BTC $65k');
  assert.strictEqual(duel.persona, challenger.name);
  assert.ok(typeof duel.challenge === 'string' && duel.challenge.trim().length > 0, 'Challenge must not be empty');
  assert.ok(typeof duel.response === 'string' && duel.response.trim().length > 0, 'Response must not be empty');
});

test('Engine Test 5: Round 3 — Exactly 9 Personas Cast Valid Binding Votes (ADD / REDUCE / PASS)', async () => {
  const testMotion = 'Is Bitcoin still fundamentally strong enough to justify long-term adoption?';
  const votes = [];

  for (const agent of AGENTS) {
    const ballot = await generateRound3Vote(agent, testMotion, 'Fundamental analysis completed', 'Cross-exam note');
    assert.strictEqual(ballot.seat, agent.seat);
    assert.strictEqual(ballot.persona, agent.name);
    assert.ok(['ADD', 'REDUCE', 'PASS'].includes(ballot.vote), `Vote for ${agent.name} must be ADD, REDUCE, or PASS. Got: ${ballot.vote}`);
    assert.ok(typeof ballot.rationale === 'string' && ballot.rationale.trim().length > 0, 'Rationale must not be empty');
    assert.strictEqual(ballot.weight, 1.0);
    votes.push(ballot);
  }

  assert.strictEqual(votes.length, 9, 'Exactly 9 votes must be cast');
});

test('Engine Test 6: Deterministic Aggregator — Strict Majority, Tie-Breaking, and Position Sizing', () => {
  // Scenario A: Clear Majority ADD (6 ADD, 2 REDUCE, 1 PASS)
  const votesA = [
    { seat: 1, persona: 'Benjamin Graham', shortName: 'Graham', vote: 'ADD', weight: 1, rationale: 'Value' },
    { seat: 2, persona: 'Charlie Munger', shortName: 'Munger', vote: 'ADD', weight: 1, rationale: 'Moat' },
    { seat: 3, persona: 'Peter Lynch', shortName: 'Lynch', vote: 'ADD', weight: 1, rationale: 'Growth' },
    { seat: 4, persona: 'Cathie Wood', shortName: 'Wood', vote: 'ADD', weight: 1, rationale: 'Innovation' },
    { seat: 5, persona: 'Aswath Damodaran', shortName: 'Damodaran', vote: 'REDUCE', weight: 1, rationale: 'Cash flow' },
    { seat: 6, persona: 'Nassim Nicholas Taleb', shortName: 'Taleb', vote: 'REDUCE', weight: 1, rationale: 'Tail risk' },
    { seat: 7, persona: 'Mohnish Pabrai', shortName: 'Pabrai', vote: 'ADD', weight: 1, rationale: 'Asymmetry' },
    { seat: 8, persona: 'Bill Ackman', shortName: 'Ackman', vote: 'ADD', weight: 1, rationale: 'Activism' },
    { seat: 9, persona: 'Michael Burry', shortName: 'Burry', vote: 'PASS', weight: 1, rationale: 'Wait' }
  ];

  const verdictA = aggregateVotes(votesA, 'BC-TEST-A', 'BTC', 'Bitcoin', 'Test Motion');
  assert.strictEqual(verdictA.outcome, 'ADD');
  assert.strictEqual(verdictA.addCount, 6);
  assert.strictEqual(verdictA.reduceCount, 2);
  assert.strictEqual(verdictA.passCount, 1);
  assert.strictEqual(verdictA.totalVotes, 9);
  assert.strictEqual(verdictA.majority, true);
  assert.strictEqual(verdictA.tie, false);
  assert.strictEqual(verdictA.majorityRatio, '6 / 9');
  assert.ok(verdictA.positionSizeBand.includes('%'));

  // Scenario B: Exact Tie (3 ADD, 3 REDUCE, 3 PASS) — Must break tie to PASS
  const votesB = [
    { seat: 1, persona: 'Benjamin Graham', shortName: 'Graham', vote: 'ADD', weight: 1, rationale: 'r' },
    { seat: 2, persona: 'Charlie Munger', shortName: 'Munger', vote: 'ADD', weight: 1, rationale: 'r' },
    { seat: 3, persona: 'Peter Lynch', shortName: 'Lynch', vote: 'ADD', weight: 1, rationale: 'r' },
    { seat: 4, persona: 'Cathie Wood', shortName: 'Wood', vote: 'REDUCE', weight: 1, rationale: 'r' },
    { seat: 5, persona: 'Aswath Damodaran', shortName: 'Damodaran', vote: 'REDUCE', weight: 1, rationale: 'r' },
    { seat: 6, persona: 'Nassim Nicholas Taleb', shortName: 'Taleb', vote: 'REDUCE', weight: 1, rationale: 'r' },
    { seat: 7, persona: 'Mohnish Pabrai', shortName: 'Pabrai', vote: 'PASS', weight: 1, rationale: 'r' },
    { seat: 8, persona: 'Bill Ackman', shortName: 'Ackman', vote: 'PASS', weight: 1, rationale: 'r' },
    { seat: 9, persona: 'Michael Burry', shortName: 'Burry', vote: 'PASS', weight: 1, rationale: 'r' }
  ];

  const verdictB = aggregateVotes(votesB, 'BC-TEST-B', 'BTC', 'Bitcoin', 'Tie Motion');
  assert.strictEqual(verdictB.outcome, 'PASS', 'Tie must resolve to PASS per precedence');
  assert.strictEqual(verdictB.tie, true);
  assert.strictEqual(verdictB.majority, false);
  assert.strictEqual(verdictB.totalVotes, 9);

  // Scenario C: Plurality (4 REDUCE, 3 ADD, 2 PASS) — Not strict majority (>4)
  const votesC = [
    { seat: 1, persona: 'Benjamin Graham', shortName: 'Graham', vote: 'REDUCE', weight: 1, rationale: 'r' },
    { seat: 2, persona: 'Charlie Munger', shortName: 'Munger', vote: 'REDUCE', weight: 1, rationale: 'r' },
    { seat: 3, persona: 'Peter Lynch', shortName: 'Lynch', vote: 'REDUCE', weight: 1, rationale: 'r' },
    { seat: 4, persona: 'Cathie Wood', shortName: 'Wood', vote: 'REDUCE', weight: 1, rationale: 'r' },
    { seat: 5, persona: 'Aswath Damodaran', shortName: 'Damodaran', vote: 'ADD', weight: 1, rationale: 'r' },
    { seat: 6, persona: 'Nassim Nicholas Taleb', shortName: 'Taleb', vote: 'ADD', weight: 1, rationale: 'r' },
    { seat: 7, persona: 'Mohnish Pabrai', shortName: 'Pabrai', vote: 'ADD', weight: 1, rationale: 'r' },
    { seat: 8, persona: 'Bill Ackman', shortName: 'Ackman', vote: 'PASS', weight: 1, rationale: 'r' },
    { seat: 9, persona: 'Michael Burry', shortName: 'Burry', vote: 'PASS', weight: 1, rationale: 'r' }
  ];

  const verdictC = aggregateVotes(votesC, 'BC-TEST-C', 'BTC', 'Bitcoin', 'Plurality');
  assert.strictEqual(verdictC.outcome, 'REDUCE');
  assert.strictEqual(verdictC.majority, false, 'Winning count of 4 is plurality, not strict majority > 4');
  assert.strictEqual(verdictC.tie, false);

  // Scenario D: Rejection of invalid vote counts
  assert.throws(() => {
    aggregateVotes(votesA.slice(0, 8));
  }, /aggregateVotes requires exactly 9 votes/);
});

test('Engine Test 7: Full Multi-Round Session Deliberation & Database Persistence (Bitcoin Scenario)', async () => {
  const req = {
    method: 'POST',
    body: {
      input: 'Is Bitcoin still fundamentally strong enough to justify long-term adoption, or is its value increasingly driven by speculation?'
    }
  };
  const res = createMockRes();

  await sessionHandler(req, res);

  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.headers['Content-Type'].includes('text/event-stream'));

  const events = parseSseEvents(res.body);

  // 1. Motion & Evidence
  const motionEvt = events.find(e => e.event === 'motion');
  const evidenceEvt = events.find(e => e.event === 'evidence');
  assert.ok(motionEvt, 'Must emit motion event');
  assert.ok(evidenceEvt, 'Must emit evidence event');
  const sessionId = motionEvt.data.sessionId;
  assert.ok(sessionId, 'Session ID must be present');

  // 2. Round 1: 9 distinct seat analyses
  const seatAnalyses = events.filter(e => e.event === 'seat_end' || e.event === 'seat_analysis');
  assert.strictEqual(seatAnalyses.length, 9, 'Must emit exactly 9 Round 1 seat analyses');
  for (const sa of seatAnalyses) {
    assert.ok(sa.data.analysis && sa.data.analysis.trim().length > 0, `Seat ${sa.data.seat} analysis must not be empty`);
    assert.ok(['ADD', 'REDUCE', 'PASS'].includes(sa.data.stance), `Seat ${sa.data.seat} stance must be valid`);
  }

  // 3. Round 2: Opposing Cross-Examination Rebuttal
  const duelEvt = events.find(e => e.event === 'rebuttal');
  assert.ok(duelEvt, 'Must emit Round 2 cross-examination rebuttal event');
  assert.ok(duelEvt.data.challenge && duelEvt.data.challenge.trim().length > 0, 'Challenge must be non-empty');
  assert.ok(duelEvt.data.response && duelEvt.data.response.trim().length > 0, 'Response must be non-empty');

  // 4. Round 3: 9 distinct votes
  const voteEvts = events.filter(e => e.event === 'vote');
  assert.strictEqual(voteEvts.length, 9, 'Must emit exactly 9 Round 3 votes');
  for (const ve of voteEvts) {
    assert.ok(['ADD', 'REDUCE', 'PASS'].includes(ve.data.vote), `Vote ${ve.data.vote} must be ADD, REDUCE, or PASS`);
    assert.ok(ve.data.reason && ve.data.reason.trim().length > 0, 'Vote reason must be non-empty');
  }

  // 5. Verdict & Done
  const verdictEvt = events.find(e => e.event === 'verdict');
  const doneEvt = events.find(e => e.event === 'done');
  assert.ok(verdictEvt, 'Must emit verdict event');
  assert.ok(doneEvt, 'Must emit done event');

  const verdict = verdictEvt.data;
  assert.ok(['ADD', 'REDUCE', 'PASS'].includes(verdict.outcome), `Outcome must be ADD, REDUCE, or PASS. Got: ${verdict.outcome}`);
  assert.strictEqual(verdict.totalVotes, 9);
  assert.strictEqual(verdict.outcome !== undefined, true);
  assert.strictEqual(verdict.majorityRatio, `${verdict.majorityCount} / 9`);

  // 6. Verify Session Persistence in Database
  const stored = await db.getSession(sessionId);
  assert.ok(stored, `Session ${sessionId} must be persisted in database`);
  assert.strictEqual(stored.id, sessionId);
  assert.ok(Array.isArray(stored.transcript) && stored.transcript.length >= 11, 'Transcript must contain speeches and duels');
  assert.ok(Array.isArray(stored.votes) && stored.votes.length === 9, 'Stored session must contain all 9 votes');
  assert.ok(stored.verdict, 'Stored session must contain verdict');
  assert.strictEqual(stored.verdict.totalVotes, 9);
  assert.ok(['ADD', 'REDUCE', 'PASS'].includes(stored.verdict.outcome));
});

test('Engine Test 8: Rejection of Malformed Input / Empty Query', async () => {
  const req = { method: 'POST', body: { input: '   ' } };
  const res = createMockRes();
  await sessionHandler(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error, 'Input thesis or asset is required.');
});
