process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const sessionHandler = require('../api/session');
const {
  detectQuestionTopic,
  asksForInvestmentSizing,
  aggregateVotes,
  generateFinalSynthesis,
  extractJsonFromModelResponse
} = require('../src/lib/openrouter');
const { extractTickerFromQuery } = require('../src/lib/coingecko');
const { AGENTS } = require('../src/lib/agents');

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

// TEST A: input tanpa selectedSeats -> return status 400 / error "Select at least one seat to convene."
test('TEST A: Rejection when 0 seats selected (HTTP 400 & clear message)', async () => {
  const reqNoSeats = {
    method: 'POST',
    body: { input: 'BTC What is the outlook?', selectedSeats: [] }
  };
  const resNoSeats = createMockRes();
  await sessionHandler(reqNoSeats, resNoSeats);

  assert.strictEqual(resNoSeats.statusCode, 400);
  assert.strictEqual(resNoSeats.body.error, 'Select at least one seat to convene.');
  assert.strictEqual(resNoSeats.body.code, 'NO_SEATS_SELECTED');

  const reqUndefinedSeats = {
    method: 'POST',
    body: { input: 'BTC What is the outlook?' }
  };
  const resUndefined = createMockRes();
  await sessionHandler(reqUndefinedSeats, resUndefined);

  assert.strictEqual(resUndefined.statusCode, 400);
  assert.strictEqual(resUndefined.body.error, 'Select at least one seat to convene.');
});

// TEST B: input 1 selectedSeat -> 1 response R1, 0 cross-exam, 1 vote R3, denominator "1 / 1"
test('TEST B: Single seat session (1 R1, 0 cross-exam, 1 vote R3, denominator 1/1)', async () => {
  const req = {
    method: 'POST',
    body: {
      input: 'BTC Is proof of work mathematically secure?',
      selectedSeats: [1]
    }
  };
  const res = createMockRes();
  await sessionHandler(req, res);

  assert.strictEqual(res.statusCode, 200);
  const events = parseSseEvents(res.body);

  const r1Events = events.filter(e => e.event === 'seat_end' || e.event === 'seat_analysis');
  assert.strictEqual(r1Events.length, 1, 'R1 must have exactly 1 analysis');
  assert.strictEqual(r1Events[0].data.seat, 1);

  // Cross-exam must be skipped
  const crossExamEvents = events.filter(e => e.event === 'cross_exam');
  assert.strictEqual(crossExamEvents.length, 0, 'Cross-exam duel must be skipped when 1 seat selected');

  // Exactly 1 vote cast
  const voteEvents = events.filter(e => e.event === 'vote');
  assert.strictEqual(voteEvents.length, 1, 'Exactly 1 vote must be cast');
  assert.strictEqual(voteEvents[0].data.seat, 1);

  // Verdict denominator
  const verdictEvt = events.find(e => e.event === 'verdict');
  assert.ok(verdictEvt, 'Must emit verdict event');
  assert.strictEqual(verdictEvt.data.totalVotes, 1);
  assert.strictEqual(verdictEvt.data.totalParticipants, 1);
  assert.strictEqual(verdictEvt.data.majorityRatio, '1 / 1');

  // Synthesis must only summarize participating seat
  const synthEvt = events.find(e => e.event === 'synthesis');
  assert.ok(synthEvt, 'Must emit synthesis event');
  assert.ok(synthEvt.data.conclusion.includes('Satoshi Nakamoto') || synthEvt.data.conclusion.includes('Seat 01'));
  assert.ok(!synthEvt.data.conclusion.includes('Vitalik Buterin'), 'Unselected seats must not be in synthesis');
});

// TEST C: input 2 selectedSeats -> 2 responses R1, cross-exam duel HANYA antara 2 seats, 2 votes R3, denominator "X / 2"
test('TEST C: Two seats session (2 R1, cross-exam duel only between 2 seats, 2 R3 votes, denominator X/2)', async () => {
  const req = {
    method: 'POST',
    body: {
      input: 'Can smart contracts achieve decentralized consensus without sacrificing throughput?',
      selectedSeats: [1, 2]
    }
  };
  const res = createMockRes();
  await sessionHandler(req, res);

  assert.strictEqual(res.statusCode, 200);
  const events = parseSseEvents(res.body);

  const r1Events = events.filter(e => e.event === 'seat_end' || e.event === 'seat_analysis');
  assert.strictEqual(r1Events.length, 2, 'R1 must have exactly 2 analyses');
  const r1Seats = r1Events.map(e => e.data.seat);
  assert.deepStrictEqual(r1Seats.sort(), [1, 2]);

  // Cross-exam duel must only involve Seat 1 and Seat 2 via single 'rebuttal' event
  const rebuttalEvents = events.filter(e => e.event === 'rebuttal');
  assert.strictEqual(rebuttalEvents.length, 1, 'Must have exactly 1 rebuttal duel event');
  const redundantCrossExam = events.filter(e => e.event === 'cross_exam');
  assert.strictEqual(redundantCrossExam.length, 0, 'No redundant cross_exam event should be emitted');
  const duel = rebuttalEvents[0].data;
  assert.ok(
    (duel.seatA === 1 && duel.seatB === 2) || (duel.seatA === 2 && duel.seatB === 1),
    'Duel must be strictly between Seat 1 and Seat 2'
  );

  // Exactly 2 votes cast
  const voteEvents = events.filter(e => e.event === 'vote');
  assert.strictEqual(voteEvents.length, 2);

  // In default 2-seat deliberation (Seat 1: PASS, Seat 2: REDUCE), outcome is strictly a tie -> DIVIDED
  const verdictEvt = events.find(e => e.event === 'verdict');
  assert.ok(verdictEvt);
  assert.strictEqual(verdictEvt.data.totalVotes, 2);
  assert.strictEqual(verdictEvt.data.outcome, 'DIVIDED', '1 PASS and 1 REDUCE must produce DIVIDED');
  assert.strictEqual(verdictEvt.data.majorityRatio, 'NO MAJORITY', 'Tie outcome must have NO MAJORITY ratio');
  assert.ok(verdictEvt.data.keyAgreement.includes('No clear consensus.'));
});

// TEST D: input 4 selectedSeats -> 4 responses R1, 4 votes R3, denominator "X / 4"
test('TEST D: Four seats session (4 R1, 4 R3 votes, denominator X/4)', async () => {
  const req = {
    method: 'POST',
    body: {
      input: 'SOL vs ETH scaling and execution architectures',
      selectedSeats: [1, 2, 4, 5]
    }
  };
  const res = createMockRes();
  await sessionHandler(req, res);

  assert.strictEqual(res.statusCode, 200);
  const events = parseSseEvents(res.body);

  const r1Events = events.filter(e => e.event === 'seat_end' || e.event === 'seat_analysis');
  assert.strictEqual(r1Events.length, 4, 'Must have 4 Round 1 analyses');

  const voteEvents = events.filter(e => e.event === 'vote');
  assert.strictEqual(voteEvents.length, 4, 'Must have 4 Round 3 votes');

  const verdictEvt = events.find(e => e.event === 'verdict');
  assert.ok(verdictEvt);
  assert.strictEqual(verdictEvt.data.totalVotes, 4);
  assert.ok(verdictEvt.data.majorityRatio.endsWith('/ 4'), `Majority ratio must end with '/ 4', received: ${verdictEvt.data.majorityRatio}`);
});

// TEST E: input 9 selectedSeats -> 9 responses R1, 9 votes R3, denominator "X / 9"
test('TEST E: Full 9 seats session (9 R1, 9 R3 votes, denominator X/9)', async () => {
  const req = {
    method: 'POST',
    body: {
      input: 'BTC Long term monetary thesis across all disciplines',
      selectedSeats: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    }
  };
  const res = createMockRes();
  await sessionHandler(req, res);

  assert.strictEqual(res.statusCode, 200);
  const events = parseSseEvents(res.body);

  const r1Events = events.filter(e => e.event === 'seat_end' || e.event === 'seat_analysis');
  assert.strictEqual(r1Events.length, 9, 'Must have 9 Round 1 analyses');

  const voteEvents = events.filter(e => e.event === 'vote');
  assert.strictEqual(voteEvents.length, 9, 'Must have 9 Round 3 votes');

  const verdictEvt = events.find(e => e.event === 'verdict');
  assert.ok(verdictEvt);
  assert.strictEqual(verdictEvt.data.totalVotes, 9);
  assert.ok(verdictEvt.data.majorityRatio.endsWith('/ 9'), `Majority ratio must end with '/ 9', received: ${verdictEvt.data.majorityRatio}`);
});

// TEST F: cross-exam duel hanya melibatkan tokoh di selectedSeats
test('TEST F: Cross-exam duel strictly restricted to participating seats', async () => {
  const req = {
    method: 'POST',
    body: {
      input: 'Macro liquidity vs treasury management in crypto assets',
      selectedSeats: [6, 7] // Arthur Hayes and Michael Saylor
    }
  };
  const res = createMockRes();
  await sessionHandler(req, res);

  assert.strictEqual(res.statusCode, 200);
  const events = parseSseEvents(res.body);

  const rebuttalEvents = events.filter(e => e.event === 'rebuttal');
  assert.strictEqual(rebuttalEvents.length, 1);
  const duel = rebuttalEvents[0].data;
  assert.ok([6, 7].includes(duel.seatA) && [6, 7].includes(duel.seatB), 'Duel seats must only be from [6, 7]');
  assert.notStrictEqual(duel.seatA, 1, 'Unselected Seat 1 must NOT appear in cross-exam');
  assert.notStrictEqual(duel.seatB, 2, 'Unselected Seat 2 must NOT appear in cross-exam');
});

// TEST G: pertanyaan teknis menghasilkan analisis teknis (dan tidak mengulang pertanyaan)
test('TEST G: Technical question topic detection and direct response without question parroting', async () => {
  const techQuestion = 'What are the biggest technical risks facing decentralized blockchain networks?';
  const topic = detectQuestionTopic(techQuestion);
  assert.strictEqual(topic, 'TECHNICAL');

  const req = {
    method: 'POST',
    body: {
      input: techQuestion,
      selectedSeats: [1, 2]
    }
  };
  const res = createMockRes();
  await sessionHandler(req, res);

  const events = parseSseEvents(res.body);
  const r1Events = events.filter(e => e.event === 'seat_end' || e.event === 'seat_analysis');

  r1Events.forEach(evt => {
    const analysis = evt.data.analysis || '';
    assert.ok(analysis.length > 20, 'Analysis must be substantial');
    assert.ok(!analysis.startsWith('On "'), 'Persona must not start with question parroting prefix: On "..."');
    assert.ok(!analysis.startsWith('On the question'), 'Persona must not start with: On the question');
    assert.ok(!analysis.startsWith('Mengenai "'), 'Persona must not start with: Mengenai "..."');
  });

  const verdictEvt = events.find(e => e.event === 'verdict');
  assert.ok(verdictEvt);
  assert.strictEqual(verdictEvt.data.outcome, 'DIVIDED');
  assert.strictEqual(verdictEvt.data.majorityRatio, 'NO MAJORITY');
  assert.ok(verdictEvt.data.keyAgreement.includes('No clear consensus.'));

  // Test technical agreement when decisive majority exists
  const techVotes = [
    { seat: 1, persona: 'Satoshi Nakamoto', shortName: 'Satoshi', vote: 'ADD', weight: 1, rationale: 'r' },
    { seat: 7, persona: 'Michael Saylor', shortName: 'Saylor', vote: 'ADD', weight: 1, rationale: 'r' }
  ];
  const techVerdict = aggregateVotes(techVotes, 'BC-TEST-G', 'ETH', 'Ethereum', techQuestion);
  assert.strictEqual(techVerdict.outcome, 'ADD');
  assert.ok(techVerdict.keyAgreement.toLowerCase().includes('protocol') || techVerdict.keyAgreement.toLowerCase().includes('technical'));
});

// TEST H: pertanyaan market menghasilkan analisis market
test('TEST H: Market question topic detection and analysis', () => {
  const marketQuery = 'How will exchange leverage, perpetual funding liquidations, and spot ETF inflows impact BTC price?';
  const topic = detectQuestionTopic(marketQuery);
  assert.strictEqual(topic, 'MARKET');

  const votesMockMajority = [
    { seat: 6, persona: 'Arthur Hayes', shortName: 'Hayes', vote: 'ADD', weight: 1, rationale: 'r' },
    { seat: 7, persona: 'Michael Saylor', shortName: 'Saylor', vote: 'ADD', weight: 1, rationale: 'r' }
  ];
  const verdict = aggregateVotes(votesMockMajority, 'BC-TEST-H', 'BTC', 'Bitcoin', marketQuery);
  assert.strictEqual(verdict.outcome, 'ADD');
  assert.ok(verdict.keyAgreement.toLowerCase().includes('market') || verdict.keyAgreement.toLowerCase().includes('flow') || verdict.keyAgreement.toLowerCase().includes('liquidity'));
  assert.ok(verdict.unresolvedQuestion.toLowerCase().includes('liquidity') || verdict.unresolvedQuestion.toLowerCase().includes('macro'));

  // Divided / tie case
  const votesMockTie = [
    { seat: 1, persona: 'Satoshi Nakamoto', shortName: 'Satoshi', vote: 'PASS', weight: 1, rationale: 'r' },
    { seat: 6, persona: 'Arthur Hayes', shortName: 'Hayes', vote: 'ADD', weight: 1, rationale: 'r' }
  ];
  const tieVerdict = aggregateVotes(votesMockTie, 'BC-TEST-H-TIE', 'BTC', 'Bitcoin', marketQuery);
  assert.strictEqual(tieVerdict.outcome, 'DIVIDED');
  assert.strictEqual(tieVerdict.majorityRatio, 'NO MAJORITY');
  assert.ok(tieVerdict.keyAgreement.includes('No clear consensus.'));
});

// TEST I: pertanyaan umum menghasilkan analisis umum sesuai persona
test('TEST I: General question deliberated without hardcoded protocol bias', () => {
  const generalQuery = 'What is the future outlook for digital bearer assets in the next decade?';
  const topic = detectQuestionTopic(generalQuery);
  assert.strictEqual(topic, 'GENERAL');

  const votesMock = [
    { seat: 1, persona: 'Satoshi Nakamoto', shortName: 'Satoshi', vote: 'ADD', weight: 1, rationale: 'r' },
    { seat: 7, persona: 'Michael Saylor', shortName: 'Saylor', vote: 'ADD', weight: 1, rationale: 'r' }
  ];
  const verdict = aggregateVotes(votesMock, 'BC-TEST-I', 'BTC', 'Bitcoin', generalQuery);
  assert.strictEqual(verdict.outcome, 'ADD');
  assert.strictEqual(verdict.majorityRatio, '2 / 2');
});

// TEST J: pertanyaan panjang tidak terpotong di input, transcript, dan synthesis
test('TEST J: Long question un-truncated in input, transcript, and synthesis', async () => {
  const longQuestion = 'Given increasing regulatory scrutiny by global financial authorities alongside rising sovereign debt levels and institutional adoption via exchange traded funds, can decentralized layer-1 networks preserve their original censorship resistance and permissionless validator participation?';
  assert.ok(longQuestion.length > 250);

  const req = {
    method: 'POST',
    body: {
      input: longQuestion,
      selectedSeats: [1, 2]
    }
  };
  const res = createMockRes();
  await sessionHandler(req, res);

  const events = parseSseEvents(res.body);
  const synthEvt = events.find(e => e.event === 'synthesis');
  assert.ok(synthEvt, 'Synthesis event must be present');
  assert.strictEqual(synthEvt.data.question, longQuestion, 'Question in synthesis must not be truncated');

  const verdictEvt = events.find(e => e.event === 'verdict');
  assert.ok(verdictEvt, 'Verdict event must be present');
  assert.strictEqual(verdictEvt.data.question, longQuestion, 'Question in verdict must not be truncated');
});

// TEST K: Contract address (CA) topic detection and ticker extraction
test('TEST K: Contract address (CA) topic detection and ticker extraction', () => {
  const caQuery = 'Can this CA 0x63Ee32Ac3077d1fbd8a77eBBA2a6ed4b8e9c1e18 raise 100K?';
  const topic = detectQuestionTopic(caQuery);
  assert.strictEqual(topic, 'TOKEN_CA');

  const ticker = extractTickerFromQuery(caQuery);
  assert.strictEqual(ticker, '0x63Ee...1e18');
});

// TEST L: Resilient JSON partial extraction when trailing brace is cut off
test('TEST L: Resilient JSON partial extraction when trailing brace is cut off', () => {
  const truncatedJson = '{\n  "persona": "Satoshi Nakamoto",\n  "analysis": "This token lacks proof-of-work validation.",\n  "stance": "REDUCE",\n  "risk": "Deployer backdo';
  const parsed = extractJsonFromModelResponse(truncatedJson);
  assert.ok(parsed, 'Parsed object should not be null');
  assert.strictEqual(parsed.analysis, 'This token lacks proof-of-work validation.');
  assert.strictEqual(parsed.stance, 'REDUCE');
});

// TEST M: Single done event emitted without duplicate complete event
test('TEST M: Single done event emitted without duplicate complete event', async () => {
  const req = {
    method: 'POST',
    body: {
      input: 'Can this CA 0x63Ee32Ac3077d1fbd8a77eBBA2a6ed4b8e9c1e18 raise 100K?',
      selectedSeats: [1]
    }
  };
  const res = createMockRes();
  await sessionHandler(req, res);

  const events = parseSseEvents(res.body);
  const doneEvents = events.filter(e => e.event === 'done');
  const completeEvents = events.filter(e => e.event === 'complete');

  assert.strictEqual(doneEvents.length, 1, 'Exactly one done event must be emitted');
  assert.strictEqual(completeEvents.length, 0, 'No redundant complete events should be emitted');
});

// TEST N: PROTOCOL category question routing and mandate
test('TEST N: Protocol topic category detection', () => {
  const protoQuery = 'Will introducing a protocol fee switch and staking emissions dilute liquidity providers in this DAO?';
  const topic = detectQuestionTopic(protoQuery);
  assert.strictEqual(topic, 'PROTOCOL');

  const votes = [
    { seat: 2, persona: 'Vitalik Buterin', shortName: 'Vitalik', vote: 'REDUCE', weight: 1, rationale: 'Centralization' },
    { seat: 4, persona: 'Nick Szabo', shortName: 'Szabo', vote: 'REDUCE', weight: 1, rationale: 'Social consensus violation' }
  ];
  const verdict = aggregateVotes(votes, 'BC-TEST-N', 'UNI', 'Uniswap', protoQuery);
  assert.strictEqual(verdict.outcome, 'REDUCE');
  assert.ok(verdict.keyAgreement.toLowerCase().includes('tokenomics') || verdict.keyAgreement.toLowerCase().includes('protocol') || verdict.keyAgreement.toLowerCase().includes('fee'));
});

// TEST O: Real CA evidence vs DATA UNAVAILABLE (zero fabricated numbers)
test('TEST O: Real CA evidence vs DATA UNAVAILABLE without fabricated numbers', async () => {
  const { fetchCaEvidence } = require('../src/lib/ca-evidence');

  // Case 1: Unindexed / invalid CA returns DATA UNAVAILABLE with zero fabricated numbers
  const unavailableCa = await fetchCaEvidence('0x1111111111111111111111111111111111111111');
  assert.strictEqual(unavailableCa.isAvailable, false);
  assert.strictEqual(unavailableCa.priceFormatted, 'DATA UNAVAILABLE');
  assert.strictEqual(unavailableCa.marketCapFormatted, 'DATA UNAVAILABLE');
  assert.strictEqual(unavailableCa.liquidityFormatted, 'DATA UNAVAILABLE');
  assert.strictEqual(unavailableCa.volume24hFormatted, 'DATA UNAVAILABLE');

  // Case 2: Live token contract address on DexScreener
  const realCa = await fetchCaEvidence('0x63Ee32Ac3077d1fbd8a77eBBA2a6ed4b8e9c1e18');
  assert.ok(realCa.contractAddress.toLowerCase().includes('0x63ee'));
  if (realCa.isAvailable) {
    assert.notStrictEqual(realCa.priceFormatted, 'DATA UNAVAILABLE');
    assert.notStrictEqual(realCa.liquidityFormatted, 'DATA UNAVAILABLE');
    assert.ok(realCa.priceFormatted.startsWith('$'), `Price should be formatted with $: ${realCa.priceFormatted}`);
    assert.ok(typeof realCa.price === 'number', 'Price must be numeric');
  }
});

// TEST P: Position Sizing Suppression unless explicitly requested
test('TEST P: Position sizing suppression on CA/general queries vs explicitly requested', () => {
  const generalQuery = 'Can this token maintain valuation during liquidity contraction?';
  assert.strictEqual(asksForInvestmentSizing(generalQuery), false, 'General query does not ask for position sizing');

  const sizingQuery1 = 'What should my allocation percentage be for SOL?';
  assert.strictEqual(asksForInvestmentSizing(sizingQuery1), true, 'Allocation percentage query asks for sizing');

  const sizingQuery2 = 'How much should I invest in BTC given tail risk?';
  assert.strictEqual(asksForInvestmentSizing(sizingQuery2), true, 'How much should I invest query asks for sizing');

  const sizingQuery3 = 'What is the recommended position size for this thesis?';
  assert.strictEqual(asksForInvestmentSizing(sizingQuery3), true, 'Position size query asks for sizing');
});

// TEST Q: Final synthesis structure includes keyEvidence and No clear consensus on ties
test('TEST Q: Final synthesis includes keyEvidence and No clear consensus on ties', async () => {
  const mockAgents = [
    { seat: 1, name: 'Satoshi Nakamoto', shortName: 'Satoshi', discipline: 'Proof-of-work' },
    { seat: 2, name: 'Vitalik Buterin', shortName: 'Vitalik', discipline: 'Smart contracts' }
  ];
  const r1Map = new Map();
  r1Map.set(1, { persona: 'Satoshi Nakamoto', analysis: 'Analysis 1', key_claims: ['c1'], risk: 'Centralization', stance: 'PASS' });
  r1Map.set(2, { persona: 'Vitalik Buterin', analysis: 'Analysis 2', key_claims: ['c2'], risk: 'Liveness', stance: 'REDUCE' });

  const tiedVotes = [
    { seat: 1, persona: 'Satoshi Nakamoto', shortName: 'Satoshi', vote: 'PASS', weight: 1, rationale: 'P' },
    { seat: 2, persona: 'Vitalik Buterin', shortName: 'Vitalik', vote: 'REDUCE', weight: 1, rationale: 'R' }
  ];

  const evidenceSummary = `Contract Address: 0x63Ee32Ac3077d1fbd8a77eBBA2a6ed4b8e9c1e18\nPrice: $0.009\nMarket Cap: $9.7M\nDEX Liquidity Pool: $1.04M\n24h Trading Volume: $44.8K`;

  const synthesis = await generateFinalSynthesis(
    'Can this CA reach a $100K market cap?',
    mockAgents,
    r1Map,
    tiedVotes,
    evidenceSummary
  );

  assert.ok(Array.isArray(synthesis.keyEvidence), 'Synthesis must contain keyEvidence array');
  assert.ok(synthesis.keyEvidence.length > 0, 'keyEvidence must be populated from evidence');
  assert.strictEqual(synthesis.areasOfAgreement, 'No clear consensus.', 'Divided votes must yield No clear consensus.');
  assert.ok(synthesis.conclusion.includes('DIVIDED — NO MAJORITY'), 'Conclusion must state DIVIDED — NO MAJORITY on tie');
  assert.ok(synthesis.conclusion.includes('$100K'), 'Conclusion must directly address the target from the question');
});


