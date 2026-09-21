const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

test('Frontend Audit — All HTML Pages Structure & Clean Links', (t) => {
  const pages = [
    'index.html',
    'chamber.html',
    'bench.html',
    'ledger.html',
    'verdict.html',
    'method.html',
    'disclaimer.html'
  ];

  pages.forEach(page => {
    const filePath = path.join(rootDir, page);
    assert.strictEqual(fs.existsSync(filePath), true, `${page} must exist in root`);
    
    const html = fs.readFileSync(filePath, 'utf8');

    // 1. Strict clean URLs (no .html extensions in hrefs)
    const hrefMatches = html.match(/href="([^"]+)"/g) || [];
    hrefMatches.forEach(h => {
      assert.strictEqual(h.includes('.html'), false, `${page} should not contain .html in href: ${h}`);
    });

    // 2. Overview navigation link check
    if (page !== 'method.html' && page !== 'disclaimer.html') {
      assert.strictEqual(html.includes('href="/overview"'), true, `${page} must have link to /overview`);
      assert.strictEqual(html.includes('Overview</a>'), true, `${page} must have Overview link label`);
    }

    // 3. No duplicate IDs on the page
    const idMatches = html.match(/id="([^"]+)"/g) || [];
    const idCounts = {};
    idMatches.forEach(m => {
      const id = m.replace('id="', '').replace('"', '');
      idCounts[id] = (idCounts[id] || 0) + 1;
      assert.strictEqual(idCounts[id], 1, `Duplicate ID "${id}" detected in ${page}`);
    });
  });
});

test('Frontend Audit — 9 Canonical Personas Data Integrity', (t) => {
  const agentsPath = path.join(rootDir, 'data', 'agents.json');
  assert.strictEqual(fs.existsSync(agentsPath), true, 'data/agents.json must exist');
  
  const agents = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));
  assert.strictEqual(agents.length, 9, 'Must have exactly 9 canonical seats');

  const expectedSeats = [
    { seat: 1, name: 'Benjamin Graham' },
    { seat: 2, name: 'Charlie Munger' },
    { seat: 3, name: 'Peter Lynch' },
    { seat: 4, name: 'Cathie Wood' },
    { seat: 5, name: 'Aswath Damodaran' },
    { seat: 6, name: 'Nassim Nicholas Taleb' },
    { seat: 7, name: 'Mohnish Pabrai' },
    { seat: 8, name: 'Bill Ackman' },
    { seat: 9, name: 'Michael Burry' }
  ];

  expectedSeats.forEach(exp => {
    const found = agents.find(a => a.seat === exp.seat);
    assert.ok(found, `Seat ${exp.seat} must exist`);
    assert.strictEqual(found.name, exp.name, `Seat ${exp.seat} name must match canonical`);
    assert.strictEqual(found.discipline.includes('dan'), false, `Discipline should not have Indonesian "dan"`);
  });
});

test('Frontend Audit — Budget Controller Auto-Replenish & Reset', (t) => {
  // Mock localStorage in Node
  const storage = {};
  global.localStorage = {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; }
  };
  global.document = {
    addEventListener: () => {},
    getElementById: () => null
  };

  const BourseBudget = require('../js/budget');
  assert.ok(BourseBudget, 'BourseBudget module loaded');

  // Verify total credits
  assert.strictEqual(BourseBudget.TOTAL_CREDITS, 13, 'Budget total must be 13');

  // Consume 9 credits (full bench)
  const ok1 = BourseBudget.consume(9);
  assert.strictEqual(ok1, true, 'First consume should succeed');
  assert.strictEqual(BourseBudget.getRemaining(), 4, 'Remaining should be 4');

  // Consume 5 credits (which is > 4 remaining): must auto-replenish to 13 and then deduct 5
  const ok2 = BourseBudget.consume(5);
  assert.strictEqual(ok2, true, 'Consume exceeding remaining must auto-replenish and succeed');
  assert.strictEqual(BourseBudget.getRemaining(), 8, 'Remaining should be 8 after auto-replenish and deduction');

  // Explicit reset
  BourseBudget.reset();
  assert.strictEqual(BourseBudget.getRemaining(), 13, 'Reset must restore 13 credits');
});
