/**
 * Unit & Integration Test Suite for Hardened TOKEN_CA Deliberation Mode
 * Tests deterministic classification, address resolution, target extraction,
 * strict majority rules, and the deterministic validation layer.
 */

const test = require('node:test');
const assert = require('node:assert');
const {
  extractContractAddress,
  extractTargetMarketCap,
  formatNetworkName,
  calculateBuySellRatio,
  fetchCaEvidence
} = require('../src/lib/ca-evidence');
const {
  detectQuestionTopic,
  aggregateVotes,
  validateDeterministicTokenCa,
  generateFinalSynthesis
} = require('../src/lib/openrouter');
const { CRYPTO_AGENTS } = require('../src/lib/crypto-agents');

test('TOKEN_CA Unit: Priority 1 Classification', () => {
  assert.strictEqual(
    detectQuestionTopic('Can this CA 0x90456f...f515 reach $100K market cap?'),
    'TOKEN_CA',
    'Abbreviated CA with target market cap must classify as TOKEN_CA'
  );

  assert.strictEqual(
    detectQuestionTopic('Can this CA 0x63Ee32Ac3077d1fbd8a77eBBA2a6ed4b8e9c1e18 reach a $100K market cap?'),
    'TOKEN_CA',
    'Full EVM CA with target must classify as TOKEN_CA'
  );

  assert.strictEqual(
    detectQuestionTopic('Can this token reach $1M valuation?'),
    'TOKEN_CA',
    'Token valuation question must classify as TOKEN_CA'
  );

  // Must not hijack non-CA questions
  assert.strictEqual(
    detectQuestionTopic('What are the consensus scaling trade-offs of proof of stake validators?'),
    'TECHNICAL',
    'Validator scaling question must classify as TECHNICAL'
  );

  assert.strictEqual(
    detectQuestionTopic('How does the EIP-1559 burn mechanism alter ETH staking economics?'),
    'PROTOCOL',
    'EIP-1559 question must classify as PROTOCOL'
  );

  assert.strictEqual(
    detectQuestionTopic('BTC Macro liquidity flows and institutional exchange liquidation cascades'),
    'MARKET',
    'Liquidity cascade question must classify as MARKET'
  );
});

test('TOKEN_CA Unit: Address Extraction (Full, Abbreviated, Solana)', () => {
  // Full EVM
  const fullEvm = '0x63Ee32Ac3077d1fbd8a77eBBA2a6ed4b8e9c1e18';
  assert.strictEqual(extractContractAddress(`Examine ${fullEvm} feasibility`), fullEvm);

  // Abbreviated EVM
  const abbrEvm = '0x90456f...f515';
  assert.strictEqual(extractContractAddress(`Can ${abbrEvm} reach $100K MC?`), abbrEvm);

  // Solana base58
  const solToken = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
  assert.strictEqual(extractContractAddress(`Can ${solToken} reach $500K?`), solToken);

  // No address
  assert.strictEqual(extractContractAddress('General question without address'), null);
});

test('TOKEN_CA Unit: Target Market Cap Extraction and Formatting', () => {
  assert.deepStrictEqual(
    extractTargetMarketCap('Can this CA reach $100K market cap?'),
    { targetMcap: 100000, targetMcapFormatted: '$100K' }
  );

  assert.deepStrictEqual(
    extractTargetMarketCap('Target feasibility for $500K MC'),
    { targetMcap: 500000, targetMcapFormatted: '$500K' }
  );

  assert.deepStrictEqual(
    extractTargetMarketCap('Can this reach $1M valuation?'),
    { targetMcap: 1000000, targetMcapFormatted: '$1M' }
  );

  assert.deepStrictEqual(
    extractTargetMarketCap('Will this CA hit $50M market cap?'),
    { targetMcap: 50000000, targetMcapFormatted: '$50M' }
  );

  assert.deepStrictEqual(
    extractTargetMarketCap('Question with no financial target values'),
    { targetMcap: null, targetMcapFormatted: 'DATA UNAVAILABLE' }
  );
});

test('TOKEN_CA Unit: Network and Ratio Formatting', () => {
  assert.strictEqual(formatNetworkName('arbitrum_orbit'), 'Robinhood');
  assert.strictEqual(formatNetworkName('ethereum'), 'Ethereum');
  assert.strictEqual(formatNetworkName('base'), 'Base');
  assert.strictEqual(formatNetworkName('solana'), 'Solana');
  assert.strictEqual(formatNetworkName(undefined), 'NETWORK UNKNOWN');

  assert.strictEqual(calculateBuySellRatio(100, 50), '2.00');
  assert.strictEqual(calculateBuySellRatio(50, 0), 'DATA UNAVAILABLE');
  assert.strictEqual(calculateBuySellRatio(null, null), 'DATA UNAVAILABLE');
});

test('TOKEN_CA Deliberation: Strict Majority Rule (>50%) & Dynamic Denominators', () => {
  const mockCaEvidence = {
    isAvailable: true,
    contractAddress: '0x90456F55080Af00FEf3fF1649C83D57258F1F515',
    network: 'Robinhood',
    marketCap: 17900,
    marketCapFormatted: '$17.9K',
    targetMarketCap: 100000,
    targetMarketCapFormatted: '$100K',
    requiredMultiple: 5.59,
    requiredMultipleFormatted: '5.59x',
    liquidityFormatted: '$8.2K',
    volume24hFormatted: '$1.4K',
    txns24h: { buys: 10, sells: 10 },
    buySellRatio: '1.00',
    holders: 'DATA UNAVAILABLE',
    holderConcentration: 'DATA UNAVAILABLE',
    liquidityLock: 'DATA UNAVAILABLE',
    contractRisks: 'DATA UNAVAILABLE',
    source: 'DexScreener API',
    retrievalDate: '2026-09-23',
    retrievedAt: new Date().toISOString()
  };

  // Case 1: 4 Seats — 2 SUPPORTED, 2 NOT_SUPPORTED (Tie / Plurality, not >50%) -> DIVIDED — NO MAJORITY
  const votes4Tie = [
    { seat: 1, persona: 'Satoshi Nakamoto', shortName: 'Satoshi', vote: 'SUPPORTED', weight: 1, rationale: 'r' },
    { seat: 2, persona: 'Vitalik Buterin', shortName: 'Vitalik', vote: 'SUPPORTED', weight: 1, rationale: 'r' },
    { seat: 3, persona: 'Nick Szabo', shortName: 'Szabo', vote: 'NOT_SUPPORTED', weight: 1, rationale: 'r' },
    { seat: 4, persona: 'Anatoly Yakovenko', shortName: 'Anatoly', vote: 'NOT_SUPPORTED', weight: 1, rationale: 'r' }
  ];
  const verdict4Tie = aggregateVotes(votes4Tie, 'TEST-4T', 'SCRAMBLE', 'Scramble', 'Target $100K', mockCaEvidence);
  assert.strictEqual(verdict4Tie.outcome, 'DIVIDED');
  assert.strictEqual(verdict4Tie.majorityRatio, 'NO MAJORITY');
  assert.strictEqual(verdict4Tie.totalVotes, 4);

  // Case 2: 4 Seats — 3 NOT_SUPPORTED, 1 SUPPORTED (Strict Majority > 50%: 3/4) -> NOT_SUPPORTED
  const votes4Maj = [
    { seat: 1, persona: 'Satoshi Nakamoto', shortName: 'Satoshi', vote: 'NOT_SUPPORTED', weight: 1, rationale: 'r' },
    { seat: 2, persona: 'Vitalik Buterin', shortName: 'Vitalik', vote: 'NOT_SUPPORTED', weight: 1, rationale: 'r' },
    { seat: 3, persona: 'Nick Szabo', shortName: 'Szabo', vote: 'NOT_SUPPORTED', weight: 1, rationale: 'r' },
    { seat: 4, persona: 'Anatoly Yakovenko', shortName: 'Anatoly', vote: 'SUPPORTED', weight: 1, rationale: 'r' }
  ];
  const verdict4Maj = aggregateVotes(votes4Maj, 'TEST-4M', 'SCRAMBLE', 'Scramble', 'Target $100K', mockCaEvidence);
  assert.strictEqual(verdict4Maj.outcome, 'NOT_SUPPORTED');
  assert.strictEqual(verdict4Maj.majorityRatio, '3 / 4');
  assert.strictEqual(verdict4Maj.totalVotes, 4);

  // Case 3: 2 Seats — 1 SUPPORTED, 1 INSUFFICIENT_EVIDENCE -> DIVIDED — NO MAJORITY
  const votes2Tie = [
    { seat: 1, persona: 'Satoshi Nakamoto', shortName: 'Satoshi', vote: 'SUPPORTED', weight: 1, rationale: 'r' },
    { seat: 2, persona: 'Vitalik Buterin', shortName: 'Vitalik', vote: 'INSUFFICIENT_EVIDENCE', weight: 1, rationale: 'r' }
  ];
  const verdict2Tie = aggregateVotes(votes2Tie, 'TEST-2T', 'SCRAMBLE', 'Scramble', 'Target $100K', mockCaEvidence);
  assert.strictEqual(verdict2Tie.outcome, 'DIVIDED');
  assert.strictEqual(verdict2Tie.majorityRatio, 'NO MAJORITY');

  // Case 4: 1 Seat — 1 SUPPORTED -> SUPPORTED (1 / 1)
  const votes1 = [
    { seat: 1, persona: 'Satoshi Nakamoto', shortName: 'Satoshi', vote: 'SUPPORTED', weight: 1, rationale: 'r' }
  ];
  const verdict1 = aggregateVotes(votes1, 'TEST-1', 'SCRAMBLE', 'Scramble', 'Target $100K', mockCaEvidence);
  assert.strictEqual(verdict1.outcome, 'SUPPORTED');
  assert.strictEqual(verdict1.majorityRatio, '1 / 1');

  // Case 5: 9 Seats — 4 SUPPORTED, 3 NOT_SUPPORTED, 2 INSUFFICIENT_EVIDENCE (Plurality 4/9 is < 50%) -> DIVIDED — NO MAJORITY
  const votes9Plurality = [
    { seat: 1, persona: 'Satoshi Nakamoto', shortName: 'Satoshi', vote: 'SUPPORTED', weight: 1, rationale: 'r' },
    { seat: 2, persona: 'Vitalik Buterin', shortName: 'Vitalik', vote: 'SUPPORTED', weight: 1, rationale: 'r' },
    { seat: 3, persona: 'Nick Szabo', shortName: 'Szabo', vote: 'SUPPORTED', weight: 1, rationale: 'r' },
    { seat: 4, persona: 'Anatoly Yakovenko', shortName: 'Anatoly', vote: 'SUPPORTED', weight: 1, rationale: 'r' },
    { seat: 5, persona: 'Hal Finney', shortName: 'Finney', vote: 'NOT_SUPPORTED', weight: 1, rationale: 'r' },
    { seat: 6, persona: 'Arthur Hayes', shortName: 'Hayes', vote: 'NOT_SUPPORTED', weight: 1, rationale: 'r' },
    { seat: 7, persona: 'Michael Saylor', shortName: 'Saylor', vote: 'NOT_SUPPORTED', weight: 1, rationale: 'r' },
    { seat: 8, persona: 'Changpeng Zhao', shortName: 'CZ', vote: 'INSUFFICIENT_EVIDENCE', weight: 1, rationale: 'r' },
    { seat: 9, persona: 'Naval Ravikant', shortName: 'Naval', vote: 'INSUFFICIENT_EVIDENCE', weight: 1, rationale: 'r' }
  ];
  const verdict9Plurality = aggregateVotes(votes9Plurality, 'TEST-9P', 'SCRAMBLE', 'Scramble', 'Target $100K', mockCaEvidence);
  assert.strictEqual(verdict9Plurality.outcome, 'DIVIDED', '4/9 is plurality but NOT > 50% majority');
  assert.strictEqual(verdict9Plurality.majorityRatio, 'NO MAJORITY');
});

test('TOKEN_CA Deterministic Validation: Corrects Hallucinated LLM Values', () => {
  const caData = {
    isAvailable: true,
    contractAddress: '0x90456F55080Af00FEf3fF1649C83D57258F1F515',
    network: 'Robinhood',
    marketCap: 17900,
    marketCapFormatted: '$17.9K',
    targetMarketCap: 100000,
    targetMarketCapFormatted: '$100K',
    requiredMultiple: 5.59,
    requiredMultipleFormatted: '5.59x',
    liquidityFormatted: '$8.2K',
    volume24hFormatted: '$1.4K',
    txns24h: { buys: 10, sells: 10 },
    buySellRatio: '1.00',
    source: 'DexScreener API',
    retrievalDate: '2026-09-23',
    retrievedAt: new Date().toISOString()
  };

  const seats = [CRYPTO_AGENTS[0], CRYPTO_AGENTS[1]]; // Seats 1 and 2

  // Simulate an LLM hallucination: hallucinated multiple = 2.9x, current MC = $34K
  const mockVerdict = {
    outcome: 'NOT_SUPPORTED',
    majorityRatio: '2 / 2',
    totalVotes: 2,
    tokenCaDetails: {
      ca: '0x90456f...f515',
      network: 'Ethereum', // Wrong
      currentMarketCap: '$34K', // Hallucinated
      targetMarketCap: '$100K',
      requiredMultiple: 2.9, // Hallucinated
      requiredMultipleFormatted: '2.90x', // Hallucinated
      liquidity: '$20K', // Hallucinated
      volume24h: '$5K',
      chamberAssessment: 'NOT_SUPPORTED',
      confidence: 'LOW',
      reason: 'test'
    },
    synthesis: {
      conclusion: 'Based on 2.9x multiple...',
      keyEvidence: ['Market Cap: $34K']
    }
  };

  validateDeterministicTokenCa(mockVerdict, caData, seats);

  // Assert validator corrected the hallucinated metrics to on-chain truth
  assert.strictEqual(mockVerdict.tokenCaDetails.network, 'Robinhood');
  assert.strictEqual(mockVerdict.tokenCaDetails.currentMarketCap, '$17.9K');
  assert.strictEqual(mockVerdict.tokenCaDetails.targetMarketCap, '$100K');
  assert.strictEqual(mockVerdict.tokenCaDetails.requiredMultiple, 5.59);
  assert.strictEqual(mockVerdict.tokenCaDetails.requiredMultipleFormatted, '5.59x');
  assert.strictEqual(mockVerdict.tokenCaDetails.liquidity, '$8.2K');
  assert.strictEqual(mockVerdict.tokenCaDetails.volume24h, '$1.4K');
});

test('TOKEN_CA Synthesis: Target Direction (Below MC) and Greatest Constraint', async () => {
  const caDataBelow = {
    isAvailable: true,
    contractAddress: '0x63Ee32Ac3077d1fbd8a77eBBA2a6ed4b8e9c1e18',
    network: 'Robinhood',
    marketCap: 8973793,
    marketCapFormatted: '$8,973,793',
    targetMarketCap: 1000000,
    targetMarketCapFormatted: '$1M',
    requiredMultiple: 0.1114,
    requiredMultipleFormatted: '0.11x',
    liquidityFormatted: '$998.8K',
    volume24hFormatted: '$1.25M',
    txns24h: { buys: 2000, sells: 2200 },
    buySellRatio: '0.91',
    holders: 'DATA UNAVAILABLE',
    holderConcentration: 'DATA UNAVAILABLE',
    liquidityLock: 'DATA UNAVAILABLE',
    contractVerification: 'DATA UNAVAILABLE',
    source: 'DexScreener API',
    retrievalDate: '2026-09-23',
    retrievedAt: new Date().toISOString()
  };

  const seats = [CRYPTO_AGENTS[0], CRYPTO_AGENTS[1]];
  const round1Analyses = new Map([
    [1, { persona: 'Satoshi Nakamoto', analysis: 'Analysis', key_claims: [], risk: '', stance: 'INSUFFICIENT_EVIDENCE' }],
    [2, { persona: 'Vitalik Buterin', analysis: 'Analysis', key_claims: [], risk: '', stance: 'NOT_SUPPORTED' }]
  ]);
  const votes = [
    { seat: 1, persona: 'Satoshi Nakamoto', shortName: 'Satoshi', vote: 'INSUFFICIENT_EVIDENCE', weight: 1, rationale: 'r' },
    { seat: 2, persona: 'Vitalik Buterin', shortName: 'Vitalik', vote: 'NOT_SUPPORTED', weight: 1, rationale: 'r' }
  ];

  const query = 'Can CASHCAT reach $1M market cap?';
  const synth = await generateFinalSynthesis(query, seats, round1Analyses, votes, '', caDataBelow);

  assert.strictEqual(synth.caDetails.targetInterpretation, 'Below current market cap');
  assert.ok(synth.caDetails.marketCapChangeRequired.includes('decrease in market capitalization'));
  assert.ok(synth.caDetails.marketCapChangeRequired.includes('88.9%'));
  assert.ok(synth.conclusion.includes('TARGET INTERPRETATION:\nBelow current market cap'));
  assert.ok(synth.conclusion.includes('MARKET-CAP CHANGE REQUIRED:'));
  assert.ok(synth.conclusion.includes('GREATEST OBSERVABLE CONSTRAINT:'));
  assert.ok(synth.conclusion.includes('INSUFFICIENT EVIDENCE — no single greatest constraint can be reliably identified'));
});

