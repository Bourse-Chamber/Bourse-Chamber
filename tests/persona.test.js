const test = require('node:test');
const assert = require('node:assert/strict');
const { AGENTS, getAgentBySeat } = require('../src/lib/agents');
const { aggregateVotes } = require('../src/lib/openrouter');

test('Persona Configuration (All 9 Canonical Seats)', () => {
  assert.strictEqual(AGENTS.length, 9, 'Must have exactly 9 seats');

  const seatNumbers = AGENTS.map(a => a.seat);
  assert.deepStrictEqual(seatNumbers, [1, 2, 3, 4, 5, 6, 7, 8, 9], 'Seats must be numbered 1 through 9');

  const expectedNames = [
    'Benjamin Graham',
    'Charlie Munger',
    'Peter Lynch',
    'Cathie Wood',
    'Aswath Damodaran',
    'Nassim Nicholas Taleb',
    'Mohnish Pabrai',
    'Bill Ackman',
    'Michael Burry'
  ];

  AGENTS.forEach((agent, i) => {
    assert.strictEqual(agent.name, expectedNames[i], `Seat ${i + 1} name must match canonical persona`);
    assert.ok(agent.discipline.length > 0, `Seat ${agent.seat} must have a defined discipline`);
    assert.ok(agent.firstQuestion.length > 0, `Seat ${agent.seat} must have a first question`);
    assert.ok(agent.systemPrompt.length > 30, `Seat ${agent.seat} must have a detailed system prompt`);
  });

  const seat6 = getAgentBySeat(6);
  assert.ok(seat6 && seat6.name.includes('Taleb'), 'Seat 6 must retrieve Nassim Nicholas Taleb');
});

test('Vote Aggregation & Taleb Position Size Bands', () => {
  // Scenario 1: Decisive REDUCE majority (6 REDUCE, 2 ADD, 1 PASS)
  const votesScenario1 = [
    { seat: 1, persona: 'Graham', shortName: 'Graham', vote: 'PASS', weight: 1, rationale: 'No liquidation floor' },
    { seat: 2, persona: 'Munger', shortName: 'Munger', vote: 'REDUCE', weight: 1, rationale: 'Avoid stupidity' },
    { seat: 3, persona: 'Lynch', shortName: 'Lynch', vote: 'ADD', weight: 1, rationale: 'Organic users' },
    { seat: 4, persona: 'Wood', shortName: 'Wood', vote: 'ADD', weight: 1, rationale: 'S-curve growth' },
    { seat: 5, persona: 'Damodaran', shortName: 'Damodaran', vote: 'REDUCE', weight: 1, rationale: 'Overvalued DCF' },
    { seat: 6, persona: 'Taleb', shortName: 'Taleb', vote: 'REDUCE', weight: 1, rationale: 'Tail ruin risk' },
    { seat: 7, persona: 'Pabrai', shortName: 'Pabrai', vote: 'REDUCE', weight: 1, rationale: 'Not asymmetric' },
    { seat: 8, persona: 'Ackman', shortName: 'Ackman', vote: 'REDUCE', weight: 1, rationale: 'No activist catalyst' },
    { seat: 9, persona: 'Burry', shortName: 'Burry', vote: 'REDUCE', weight: 1, rationale: 'Contagion risk' }
  ];

  const verdict1 = aggregateVotes(votesScenario1, 'TEST-001', 'SOL', 'Solana', 'Is throughput a moat?');

  assert.strictEqual(verdict1.outcome, 'REDUCE', 'Outcome should be REDUCE');
  assert.strictEqual(verdict1.majorityRatio, '6 / 9', 'Majority ratio should be 6 / 9');
  assert.strictEqual(verdict1.positionSizeBand, '0.5 – 1.0%', 'Taleb position size band should be 0.5 – 1.0% for REDUCE');
  assert.ok(verdict1.reviewTriggers.length >= 3, 'Must include permanent review triggers');

  // Scenario 2: Supermajority ADD (7 ADD, 1 REDUCE, 1 PASS)
  const votesScenario2 = votesScenario1.map((v, idx) => idx < 7 ? { ...v, vote: 'ADD' } : v);
  const verdict2 = aggregateVotes(votesScenario2, 'TEST-002', 'BTC', 'Bitcoin', 'Is BTC store of value?');

  assert.strictEqual(verdict2.outcome, 'ADD', 'Outcome should be ADD');
  assert.strictEqual(verdict2.majorityRatio, '7 / 9', 'Majority ratio should be 7 / 9');
  assert.strictEqual(verdict2.positionSizeBand, '2.0 – 3.5%', 'Supermajority ADD should trigger 2.0 – 3.5% size band');
});
