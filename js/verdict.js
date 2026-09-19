/**
 * Bourse Chamber — Verdict Record Controller
 * URL-based Session Loading · 9-Seat Votes · Transcript Replay Player · Clipboard Share
 */

const BourseVerdict = (() => {
  let session = null;
  let replayMessages = [];
  let replayIndex = 0;
  let replayInterval = null;
  let isReplayPlaying = false;

  function init() {
    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('id');

    if (!id) {
      // Default to canonical SOL session or first in storage
      id = 'BC-0411';
    }

    session = BourseStorage.getSessionById(id);

    // If still null, try finding any session or seed
    if (!session) {
      const all = BourseStorage.getSessions();
      if (all.length > 0) session = all[0];
    }

    if (!session) {
      renderNotFound();
      return;
    }

    renderCaseDetails();
    renderVerdictStamp();
    renderVotesTable();
    renderConsensusAndTriggers();
    renderTranscriptReplay();
    setupShareButton();
  }

  function renderNotFound() {
    const mainWrap = document.querySelector('.wrap.verdict-page');
    if (mainWrap) {
      mainWrap.innerHTML = `
        <div style="padding:80px 0;text-align:center;font-family:var(--font-mono);">
          <h2>SESSION RECORD NOT FOUND</h2>
          <p style="color:var(--text-secondary);margin-top:12px;">The requested session ID could not be retrieved from the Verdict Ledger.</p>
          <a href="ledger.html" class="btn btn-secondary" style="margin-top:24px;">Return to Ledger</a>
        </div>
      `;
    }
  }

  function renderCaseDetails() {
    const idEl = document.getElementById('case-id');
    const assetEl = document.getElementById('case-asset');
    const questionEl = document.getElementById('case-question');
    const openedEl = document.getElementById('meta-opened');
    const closedEl = document.getElementById('meta-closed');
    const seatsEl = document.getElementById('meta-seats');
    const turnsEl = document.getElementById('meta-turns');

    if (idEl) idEl.textContent = `SESSION ${session.id}`;
    if (assetEl) assetEl.textContent = `${session.ticker || 'ASSET'} — ${session.assetName || session.ticker}`;
    if (questionEl) questionEl.textContent = session.question;

    const openedDate = session.createdAt ? BourseUtils.formatDate(session.createdAt) : '05 Sep 2026';
    if (openedEl) openedEl.textContent = openedDate;
    if (closedEl) closedEl.textContent = session.closedAt || '10:00';
    if (seatsEl) seatsEl.textContent = session.seatsPresent || '9 / 9';
    if (turnsEl) turnsEl.textContent = session.speakingTurns || (session.transcript ? session.transcript.length : 14);
  }

  function renderVerdictStamp() {
    const outcomeEl = document.getElementById('verdict-outcome');
    const ratioEl = document.getElementById('verdict-ratio');
    const dissentEl = document.getElementById('verdict-dissent');
    const sizeBandEl = document.getElementById('verdict-size-band');

    const v = session.verdict || {
      outcome: 'PASS',
      majorityRatio: '5 / 9',
      dissentBreakdown: '2 ADD, 2 REDUCE',
      positionSizeBand: '1.5 – 3.0%'
    };

    if (outcomeEl) outcomeEl.textContent = v.outcome;
    if (ratioEl) ratioEl.textContent = `${v.majorityRatio} BENCH MAJORITY`;
    if (dissentEl) dissentEl.textContent = `DISSENT: ${v.dissentBreakdown}`;
    if (sizeBandEl) {
      sizeBandEl.innerHTML = `
        <strong>POSITION SIZE BAND: ${v.positionSizeBand}</strong>
        <small>Illustrative reasoning output — not personalized financial advice.</small>
      `;
    }
  }

  function renderVotesTable() {
    const wrap = document.getElementById('votes-table-rows');
    if (!wrap) return;
    wrap.innerHTML = '';

    const votes = session.votes || [];

    votes.forEach(item => {
      const row = document.createElement('div');
      row.className = 'vote-item-row';

      const agent = BourseAgents.getAgentByName(item.name) || { seat: item.seat || 1 };
      const avatarSvg = BourseUtils.generatePixelAvatarSVG(item.name, 32);
      const voteClass = item.vote ? item.vote.toLowerCase() : 'pass';

      row.innerHTML = `
        <div class="vote-seat-avatar">
          ${avatarSvg}
        </div>
        <div class="vote-persona-meta">
          <span class="vote-persona-name">${item.name}</span>
          <span class="vote-persona-discipline">${item.discipline || item.school}</span>
        </div>
        <div>
          <span class="badge ${voteClass}">${item.vote}</span>
        </div>
        <div class="vote-reasoning-text">
          ${item.reason || item.rationale || 'Deliberated from discipline principles.'}
        </div>
      `;

      wrap.appendChild(row);
    });
  }

  function renderConsensusAndTriggers() {
    const agreementEl = document.getElementById('consensus-agreement');
    const disagreementEl = document.getElementById('consensus-disagreement');
    const questionEl = document.getElementById('consensus-unresolved');
    const triggersListEl = document.getElementById('review-triggers-list');

    const v = session.verdict || {};

    if (agreementEl) agreementEl.textContent = v.keyAgreement || 'Consensus reached on liquidity scale and network brand.';
    if (disagreementEl) disagreementEl.textContent = v.keyDisagreement || 'Disagreement centered on cash-flow liquidation protection vs secular growth.';
    if (questionEl) questionEl.textContent = v.unresolvedQuestion || 'Long-term fee dynamics and validator security sustainability.';

    if (triggersListEl && v.reviewTriggers) {
      triggersListEl.innerHTML = v.reviewTriggers.map(t => `<li>${t}</li>`).join('');
    }
  }

  function renderTranscriptReplay() {
    const feed = document.getElementById('replay-feed');
    const playBtn = document.getElementById('replay-play-btn');
    const restartBtn = document.getElementById('replay-restart-btn');
    const nextBtn = document.getElementById('replay-next-btn');

    if (!feed) return;

    replayMessages = session.transcript || [];
    replayIndex = replayMessages.length; // initially show all

    function renderFeedUpToIndex(idx) {
      feed.innerHTML = '';
      const visible = replayMessages.slice(0, idx);
      visible.forEach(msg => {
        const item = document.createElement('div');
        item.className = 'replay-msg-item';
        item.innerHTML = `
          <div class="replay-msg-head">
            <span>${msg.who}</span>
            <span>${msg.time || '--:--'}</span>
          </div>
          <div class="replay-msg-body">${msg.text}</div>
        `;
        feed.appendChild(item);
      });
      feed.scrollTop = feed.scrollHeight;
    }

    renderFeedUpToIndex(replayIndex);

    function stepNext() {
      if (replayIndex < replayMessages.length) {
        replayIndex++;
        renderFeedUpToIndex(replayIndex);
      } else {
        stopReplay();
      }
    }

    function startReplay() {
      if (replayIndex >= replayMessages.length) {
        replayIndex = 0;
      }
      isReplayPlaying = true;
      if (playBtn) playBtn.textContent = 'Pause';
      replayInterval = setInterval(stepNext, 1800);
    }

    function stopReplay() {
      isReplayPlaying = false;
      if (playBtn) playBtn.textContent = 'Play';
      if (replayInterval) {
        clearInterval(replayInterval);
        replayInterval = null;
      }
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (isReplayPlaying) {
          stopReplay();
        } else {
          startReplay();
        }
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        stopReplay();
        replayIndex = 0;
        renderFeedUpToIndex(replayIndex);
        startReplay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        stopReplay();
        stepNext();
      });
    }
  }

  function setupShareButton() {
    const shareBtn = document.getElementById('share-verdict-btn');
    if (!shareBtn) return;

    shareBtn.addEventListener('click', async () => {
      const url = window.location.href;
      const success = await BourseUtils.copyToClipboard(url);
      if (success) {
        BourseUtils.showToast('Permanent verdict URL copied to clipboard!');
        shareBtn.textContent = 'Copied to Clipboard';
        setTimeout(() => {
          shareBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Share Verdict Record
          `;
        }, 2500);
      }
    });
  }

  return {
    init
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  BourseVerdict.init();
});
