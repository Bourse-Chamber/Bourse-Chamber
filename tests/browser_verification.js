const puppeteer = require('puppeteer-core');
const fs = require('node:fs');

// Candidate browser paths
const browserPaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];

const executablePath = browserPaths.find(p => fs.existsSync(p));
if (!executablePath) {
  console.error('No valid Edge or Chrome browser found on system.');
  process.exit(1);
}

const BASE_URL = 'https://bourse-chamber.vercel.app';
const THESIS = 'Is Bitcoin still fundamentally strong enough to justify long-term adoption, or is its value increasingly driven by speculation?';

async function runBrowserTest() {
  console.log(`[Browser Test] Launching browser: ${executablePath}`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => {
      console.log(`[PAGE ${msg.type()}]: ${msg.text()}`);
    });
    page.on('pageerror', err => console.log(`[PAGE ERROR]: ${err.message}`));

    console.log(`[Browser Test] Navigating to ${BASE_URL}/chamber...`);
    await page.goto(`${BASE_URL}/chamber`, { waitUntil: 'networkidle2', timeout: 30000 });

    // 1. Verify Council Ring Personas on /chamber
    console.log('[Browser Test] Auditing Council Chamber Personas...');
    await page.waitForSelector('.council-seat .seat-name', { timeout: 10000 });
    const seatNames = await page.$$eval('.council-seat .seat-name', els => els.map(e => e.textContent.trim()));
    console.log('[Browser Test] Rendered Seat Names:', seatNames);

    const canonicalEconomists = [
      'Graham',
      'Munger',
      'Lynch',
      'Wood',
      'Damodaran',
      'Taleb',
      'Pabrai',
      'Ackman',
      'Burry'
    ];

    const cryptoArchitects = [
      'Hayes',
      'Satoshi',
      'Anatoly',
      'Vitalik',
      'Finney',
      'Szabo',
      'Saylor',
      'Zhao',
      'Armstrong'
    ];

    const hasAllEconomists = canonicalEconomists.every(name => 
      seatNames.some(sn => sn.toLowerCase().includes(name.toLowerCase()))
    );

    const hasAnyCrypto = cryptoArchitects.some(name =>
      seatNames.some(sn => sn.toLowerCase().includes(name.toLowerCase()))
    );

    console.log(`[Browser Test] Council Chamber has 9 Economists: ${hasAllEconomists ? 'PASS' : 'FAIL'}`);
    console.log(`[Browser Test] Council Chamber has NO Crypto Architects: ${!hasAnyCrypto ? 'PASS' : 'FAIL'}`);

    if (!hasAllEconomists || hasAnyCrypto) {
      throw new Error('Chamber persona isolation failure: Incorrect personas rendered on /chamber.');
    }

    // 2. Click Bitcoin Thesis Hint Chip
    console.log('[Browser Test] Clicking Bitcoin Fundamental Thesis hint chip...');
    const hintChip = await page.waitForSelector('.hint-chip[data-thesis*="Bitcoin"]', { timeout: 10000 });
    await hintChip.click();

    const inputValue = await page.$eval('#composer-input', el => el.value);
    console.log('[Browser Test] Clicking CONVENE COUNCIL button via DOM click...');
    await page.evaluate(() => {
      document.getElementById('convene-btn').click();
    });

    // 3. Monitor Deliberation Progression
    console.log('[Browser Test] Waiting for Session to Complete and Finalize...');
    await page.waitForFunction(() => {
      const stateEl = document.getElementById('chamber-state-label');
      const postActions = document.getElementById('post-session-actions');
      return (
        stateEl &&
        stateEl.textContent === 'COMPLETED' &&
        postActions &&
        postActions.classList.contains('active')
      );
    }, { timeout: 90000 });

    const finalStateText = await page.$eval('#chamber-state-label', el => el.textContent.trim());
    console.log('[Browser Test] Final State Label:', finalStateText);

    // Check Scoreboard Tallies
    const addCount = await page.$eval('#tally-add', el => parseInt(el.textContent.trim(), 10) || 0);
    const reduceCount = await page.$eval('#tally-reduce', el => parseInt(el.textContent.trim(), 10) || 0);
    const passCount = await page.$eval('#tally-pass', el => parseInt(el.textContent.trim(), 10) || 0);
    const totalVotes = addCount + reduceCount + passCount;
    console.log(`[Browser Test] Final Vote Tallies: ADD=${addCount}, REDUCE=${reduceCount}, PASS=${passCount}, TOTAL=${totalVotes}`);

    if (totalVotes !== 9) {
      throw new Error(`Expected exactly 9 total votes, got ${totalVotes}`);
    }

    // Check Feed for final outcome
    const feedMsgs = await page.$$eval('.transcript-msg .msg-body', els => els.map(e => e.textContent));
    const outcomeMsg = feedMsgs.find(m => m.includes('OUTCOME:'));
    console.log('[Browser Test] Final Outcome Message in Feed:', outcomeMsg);
    if (!outcomeMsg || outcomeMsg.includes('undefined') || outcomeMsg.includes('0 / 9')) {
      throw new Error(`Invalid outcome generated: "${outcomeMsg}"`);
    }

    // 4. Click "Open Full Verdict Record →" and navigate
    console.log('[Browser Test] Clicking "Open Full Verdict Record →"...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.evaluate(() => document.getElementById('view-verdict-btn').click())
    ]);

    console.log('[Browser Test] Arrived at Verdict Page:', page.url());

    // 5. Verify Verdict Record Page Hydration
    await page.waitForSelector('#votes-table-rows', { timeout: 10000 });
    const verdictOutcome = await page.$eval('#verdict-outcome', el => el.textContent.trim());
    const verdictRatio = await page.$eval('#verdict-ratio', el => el.textContent.trim());
    console.log('[Browser Test] Verdict Page Outcome:', verdictOutcome);
    console.log('[Browser Test] Verdict Page Ratio:', verdictRatio);

    if (verdictOutcome.includes('undefined') || verdictRatio.includes('0 / 9')) {
      throw new Error(`Verdict page shows invalid outcome or 0/9 ratio: "${verdictOutcome}" / "${verdictRatio}"`);
    }

    const ballotRows = await page.$$eval('#votes-table-rows .vote-item-row', rows => rows.map(r => {
      const name = r.querySelector('.vote-persona-name')?.textContent.trim();
      const vote = r.querySelector('.badge')?.textContent.trim();
      return { name, vote };
    }));
    console.log(`[Browser Test] Individual Ballots Rendered: ${ballotRows.length} / 9`);
    console.log('[Browser Test] Ballots Sample:', ballotRows);

    if (ballotRows.length !== 9) {
      throw new Error(`Expected 9 individual ballots on verdict page, got ${ballotRows.length}`);
    }

    // 6. Verify /crypto-bench separation
    console.log(`[Browser Test] Navigating to ${BASE_URL}/crypto-bench...`);
    await page.goto(`${BASE_URL}/crypto-bench`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('#crypto-bench-grid .card-name', { timeout: 10000 });
    const cryptoCards = await page.$$eval('#crypto-bench-grid .card-name', els => els.map(e => e.textContent.trim()));
    console.log('[Browser Test] Crypto Bench Cards:', cryptoCards);

    const hasCryptoArchitects = cryptoArchitects.every(name =>
      cryptoCards.some(c => c.toLowerCase().includes(name.toLowerCase()))
    );
    console.log(`[Browser Test] Crypto Bench has all 9 Crypto Architects: ${hasCryptoArchitects ? 'PASS' : 'FAIL'}`);

    if (!hasCryptoArchitects) {
      throw new Error('/crypto-bench failed to render all 9 crypto architects.');
    }

    console.log('====================================================');
    console.log('ALL LIVE BROWSER VERIFICATION TESTS PASSED PERFECTLY!');
    console.log('====================================================');
  } finally {
    await browser.close();
  }
}

runBrowserTest().catch(err => {
  console.error('BROWSER TEST FAILED:', err);
  process.exit(1);
});
