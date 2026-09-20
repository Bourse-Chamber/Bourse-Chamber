const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchCryptoEvidence } = require('../src/lib/coingecko');

test('CoinGecko Normalization & Data Structure', async () => {
  const evidence = await fetchCryptoEvidence('BTC');

  // Verify core normalized fields exist
  assert.ok(evidence.ticker === 'BTC', 'Ticker should normalize to BTC');
  assert.ok(typeof evidence.price === 'number' && evidence.price > 0, 'Price should be positive number');
  assert.ok(typeof evidence.change24h === 'number', '24h change should be numeric');
  assert.ok(typeof evidence.marketCap === 'number' && evidence.marketCap > 0, 'Market cap should be positive number');
  assert.ok(typeof evidence.volume24h === 'number', 'Volume should be numeric');
  assert.ok(typeof evidence.ath === 'number', 'ATH should be numeric');
  assert.ok(typeof evidence.drawdownFromAthPct === 'string', 'Drawdown percentage should be formatted string');
  assert.ok(Array.isArray(evidence.sparkline), '7d sparkline should be an array');
  assert.ok(Array.isArray(evidence.dataGaps), 'Data gaps should be an array');
  assert.ok(typeof evidence.retrievalDate === 'string', 'Retrieval date should be a string');
});

test('CoinGecko Data-Gap Handling (Unrecognized Asset in Production)', async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    const unindexed = await fetchCryptoEvidence('UNINDEXEDXYZ99');
    assert.strictEqual(unindexed.price, 0, 'Production must not fabricate random prices for unknown coins');
    assert.ok(unindexed.dataGaps.length > 0, 'Must provide explicit data gaps');
    assert.ok(unindexed.priceFormatted.includes('Data Gap'), 'Formatted price must indicate Data Gap');
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});
