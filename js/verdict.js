/**
 * Bourse Chamber — Verdict Record Controller (js/verdict.js)
 * URL-based Session Loading · 9-Seat Votes · Interactive Transcript Replay Player · Clipboard Share
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
      const match = window.location.pathname.match(/\/verdict\/([^/?#]+)/);
      if (match && match[1] && !match[1].endsWith('.html')) {
        id = decodeURIComponent(match[1]);
      }
    }

    if (!id) {
      // Default to most recent session if available, else BC-0411
      const all = (typeof BourseStorage !== 'undefined') ? BourseStorage.getSessions() : [];
      if (all && all.length > 0) {
        id = all[0].id;
      } else {
        id = 'BC-0411';
      }
    }

    loadSession(id);
    setupShareButton();
    setupWatcherForm();
  }

  async function loadSession(id) {
    if (!id) {
      const all = (typeof BourseStorage !== 'undefined') ? BourseStorage.getSessions() : [];
      id = (all && all.length > 0) ? all[0].id : 'BC-0411';
    }

    session = BourseStorage.getSessionById(id);

    // If not found in localStorage or votes are missing, fetch from server API
    if (!session || !Array.isArray(session.votes) || session.votes.length === 0) {
      try {
        const res = await fetch(`/api/session?id=${encodeURIComponent(id)}`);
        if (res.ok) {
          const apiSession = await res.json();
          if (apiSession && apiSession.id) {
            session = apiSession;
            if (typeof BourseStorage !== 'undefined') {
              BourseStorage.saveSession(apiSession);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch session from API:', err);
      }
    }

    // If still null, try finding any session in storage
    if (!session) {
      const all = BourseStorage.getSessions();
      if (all && all.length > 0) session = all[0];
    }

    if (!session) {
      renderNotFound();
      return;
    }

    // Dynamic Open Graph preview URL update
    try {
      const ogImg = document.getElementById('og-image-meta');
      const twImg = document.getElementById('twitter-image-meta');
      const ogUrl = `${window.location.origin}/api/og?id=${encodeURIComponent(session.id)}`;
      if (ogImg) ogImg.setAttribute('content', ogUrl);
      if (twImg) twImg.setAttribute('content', ogUrl);
    } catch (_) {}

    renderCaseDetails();
    renderVerdictStamp();
    renderFinalSynthesis();
    renderVotesTable();
    renderConsensusAndTriggers();
    renderTranscriptReplay();
  }

  function renderNotFound() {
    const mainWrap = document.querySelector('.wrap.verdict-page');
    if (mainWrap) {
      mainWrap.innerHTML = `
        <div style="padding:80px 0;text-align:center;font-family:var(--font-mono);">
          <h2>SESSION RECORD NOT FOUND</h2>
          <p style="color:var(--text-secondary);margin-top:12px;">The requested session ID could not be retrieved from the Verdict Ledger.</p>
          <button class="btn btn-secondary" data-view="ledger" type="button" style="margin-top:24px;">Return to Ledger</button>
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
    
    const targetCount = Array.isArray(session.directedSeats) && session.directedSeats.length > 0
      ? session.directedSeats.length
      : (Array.isArray(session.votes) && session.votes.length > 0 ? session.votes.length : 9);
    if (seatsEl) seatsEl.textContent = session.seatsPresent || `${targetCount} / ${targetCount}`;
    if (turnsEl) turnsEl.textContent = session.speakingTurns || (session.transcript ? session.transcript.length : 14);
  }

  function renderVerdictStamp() {
    const outcomeEl = document.getElementById('verdict-outcome');
    const ratioEl = document.getElementById('verdict-ratio');
    const dissentEl = document.getElementById('verdict-dissent');
    const sizeBandEl = document.getElementById('verdict-size-band');

    const targetCount = Array.isArray(session.directedSeats) && session.directedSeats.length > 0
      ? session.directedSeats.length
      : (Array.isArray(session.votes) && session.votes.length > 0 ? session.votes.length : 9);

    const v = session.verdict || {
      outcome: 'PASS',
      majorityRatio: `${Math.floor(targetCount / 2) + 1} / ${targetCount}`,
      dissentBreakdown: 'None',
      positionSizeBand: '1.5 – 3.0%'
    };

    if (outcomeEl) {
      outcomeEl.textContent = v.outcome === 'DIVIDED' ? 'DIVIDED — NO MAJORITY' : v.outcome;
      outcomeEl.className = `stamp-outcome ${v.outcome ? v.outcome.toLowerCase() : 'pass'}`;
    }
    if (ratioEl) {
      if (v.outcome === 'DIVIDED') {
        ratioEl.textContent = 'DIVIDED — NO MAJORITY';
      } else {
        ratioEl.textContent = `${v.majorityRatio || `${v.majorityCount || 1} / ${targetCount}`} BENCH MAJORITY`;
      }
    }
    if (dissentEl) {
      dissentEl.textContent = v.dissentBreakdown ? `DISSENT: ${v.dissentBreakdown}` : 'UNANIMOUS BENCH';
    }
    const stampCard = document.querySelector('.verdict-stamp-card');
    if (stampCard && v.outcome) {
      stampCard.classList.remove('add', 'reduce', 'pass', 'divided', 'supported', 'not_supported', 'insufficient_evidence');
      stampCard.classList.add(v.outcome.toLowerCase());
    }
    if (sizeBandEl) {
      const tokenCa = v.tokenCaDetails || session?.synthesis?.tokenCaDetails || session?.synthesis?.caDetails;
      const isTokenCa = Boolean(tokenCa || v.questionType === 'TOKEN_CA');
      const isSizingQuery = v.isSizingRequested || /\b(allocation|portfolio weight|position size|sizing|how much to invest|percentage allocation|how much should i (buy|invest|allocate)|risk budget)\b/i.test(session.question || '');

      if (isTokenCa && tokenCa) {
        sizeBandEl.innerHTML = `
          <strong>VALUATION TARGET: ${tokenCa.targetMarketCap || '$100K'} (${tokenCa.requiredMultiple || 'N/A'})</strong>
          <small>Feasibility: ${tokenCa.overallFeasibility || v.outcome} · Confidence: ${tokenCa.confidenceScore || 'MEDIUM'}</small>
        `;
      } else if (isSizingQuery && v.positionSizeBand && v.positionSizeBand !== 'N/A') {
        sizeBandEl.innerHTML = `
          <strong>POSITION SIZE BAND: ${v.positionSizeBand}</strong>
          <small>Calibrated against tail risk for requested allocation sizing.</small>
        `;
      } else {
        const outcomeDesc = v.outcome === 'ADD' ? 'AFFIRMATIVE / BULLISH CONSENSUS'
          : v.outcome === 'REDUCE' ? 'SKEPTICAL / RISK-OFF CONSENSUS'
          : v.outcome === 'SUPPORTED' ? 'TARGET VALUATION FEASIBLE / SUPPORTED'
          : v.outcome === 'NOT_SUPPORTED' ? 'TARGET VALUATION NOT SUPPORTED BY EVIDENCE'
          : v.outcome === 'INSUFFICIENT_EVIDENCE' ? 'INSUFFICIENT ON-CHAIN EVIDENCE TO SUPPORT TARGET'
          : v.outcome === 'DIVIDED' ? 'DIVIDED BENCH — NO MAJORITY'
          : 'NEUTRAL / PASS BENCH';
        sizeBandEl.innerHTML = `
          <strong>QUESTION EVALUATION: ${outcomeDesc}</strong>
          <small>${session.question ? `Directly answering: "${session.question}"` : 'Deliberation concluded by bench majority.'}</small>
        `;
      }
    }
  }

  function renderFinalSynthesis() {
    const qEl = document.getElementById('synthesis-question');
    const fEl = document.getElementById('synthesis-findings');
    const aEl = document.getElementById('synthesis-agreement');
    const dEl = document.getElementById('synthesis-disagreement');
    const uEl = document.getElementById('synthesis-unresolved');
    const cEl = document.getElementById('synthesis-conclusion');

    const v = session?.verdict || {};
    const synth = v.synthesis || session?.synthesis || null;
    const votes = session?.votes || [];
    const participants = votes.map(vo => vo.name || vo.persona).join(', ') || 'Participating seats';

    const questionText = synth?.question || session?.question || 'Chamber Motion';
    if (qEl) qEl.textContent = questionText;

    // Render TOKEN_CA Feasibility Card if present
    const tokenCa = v.tokenCaDetails || synth?.tokenCaDetails || synth?.caDetails;
    const tokenCaCard = document.getElementById('token-ca-feasibility-card');
    if (tokenCaCard) {
      if (tokenCa) {
        tokenCaCard.style.display = 'block';
        tokenCaCard.className = 'token-ca-analysis-card';
        const condList = Array.isArray(tokenCa.conditionsRequired) && tokenCa.conditionsRequired.length > 0
          ? tokenCa.conditionsRequired.map(c => `<li>${c}</li>`).join('')
          : '<li>Substantial capital inflows and AMM depth expansion.</li>';
        const weakList = Array.isArray(tokenCa.weakestConditions) && tokenCa.weakestConditions.length > 0
          ? tokenCa.weakestConditions.map(w => `<li>${w}</li>`).join('')
          : '<li>Liquidity slippage and order execution depth.</li>';

        tokenCaCard.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;border-bottom:1px solid var(--border-subtle);padding-bottom:10px;">
            <div>
              <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;">TOKEN CONTRACT AUDIT</span>
              <div style="font-family:var(--font-mono);font-size:0.85rem;color:#FFFFFF;margin-top:2px;"><b>CA:</b> ${tokenCa.contractAddress || 'UNSPECIFIED'} · <b>NETWORK:</b> ${tokenCa.network || 'UNKNOWN'}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <span class="badge ${tokenCa.overallFeasibility ? tokenCa.overallFeasibility.toLowerCase() : 'pass'}">${tokenCa.overallFeasibility || 'FEASIBILITY AUDITED'}</span>
              <span class="badge" style="background:#0D0D0D;border-color:#555555;color:#FFFFFF;">CONFIDENCE: ${tokenCa.confidenceScore || 'MEDIUM'}</span>
            </div>
          </div>

          <div class="token-ca-meta-grid">
            <div class="token-ca-metric">
              <span>Current MCap</span>
              <b>${tokenCa.currentMarketCap || 'DATA UNAVAILABLE'}</b>
            </div>
            <div class="token-ca-metric">
              <span>Target MCap</span>
              <b>${tokenCa.targetMarketCap || 'N/A'}</b>
            </div>
            <div class="token-ca-metric">
              <span>Required Multiple</span>
              <b>${tokenCa.requiredMultiple || 'N/A'}</b>
            </div>
            <div class="token-ca-metric">
              <span>Pool Liquidity</span>
              <b>${tokenCa.currentLiquidity || 'DATA UNAVAILABLE'}</b>
            </div>
            <div class="token-ca-metric">
              <span>24h Volume</span>
              <b>${tokenCa.volume24h || 'DATA UNAVAILABLE'}</b>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:12px;margin-bottom:12px;">
            <div style="background:#080808;padding:12px;border:1px solid var(--border-subtle);">
              <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);margin-bottom:6px;">CONDITIONS REQUIRED FOR TARGET</div>
              <ul style="margin:0 0 0 16px;padding:0;font-size:0.8rem;color:var(--text-secondary);line-height:1.5;">${condList}</ul>
            </div>
            <div style="background:#080808;padding:12px;border:1px solid var(--border-subtle);">
              <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);margin-bottom:6px;">WEAKEST CONDITIONS / VULNERABILITIES</div>
              <ul style="margin:0 0 0 16px;padding:0;font-size:0.8rem;color:var(--text-secondary);line-height:1.5;">${weakList}</ul>
            </div>
          </div>

          <div class="token-ca-assessment-box">
            <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);margin-bottom:4px;">CONFIDENCE RATIONALE</div>
            <div style="font-size:0.82rem;color:var(--text-main);line-height:1.4;">${tokenCa.confidenceReason || 'Based on available verified on-chain metrics and liquidity depth analysis.'}</div>
          </div>
        `;
      } else {
        tokenCaCard.style.display = 'none';
      }
    }

    const evContainer = document.getElementById('synthesis-evidence-container');
    const evEl = document.getElementById('synthesis-evidence');
    if (evContainer && evEl) {
      if (synth && Array.isArray(synth.keyEvidence) && synth.keyEvidence.length > 0) {
        evContainer.style.display = 'block';
        evEl.innerHTML = synth.keyEvidence.map(e => `<li>${e}</li>`).join('');
      } else {
        evContainer.style.display = 'none';
      }
    }

    if (fEl) {
      if (synth && Array.isArray(synth.keyFindings) && synth.keyFindings.length > 0) {
        fEl.innerHTML = synth.keyFindings.map(f => `<li>${f}</li>`).join('');
      } else {
        fEl.innerHTML = votes.map(vo => `<li><b>${vo.shortName || vo.name}:</b> ${vo.reason || vo.rationale || vo.vote}</li>`).join('') || `<li>Deliberated by participating seats: ${participants}.</li>`;
      }
    }

    const agreementText = (v.outcome === 'DIVIDED' || synth?.areasOfAgreement === 'No clear consensus.')
      ? 'No clear consensus.'
      : (synth?.areasOfAgreement || v.keyAgreement || `Consensus on governing constraints by participating seats (${participants}).`);
    if (aEl) aEl.textContent = agreementText;

    if (dEl) dEl.textContent = synth?.areasOfDisagreement || v.keyDisagreement || `Divergence across individual discipline thresholds: ${v.dissentBreakdown || 'None'}.`;
    if (uEl) uEl.textContent = synth?.unresolvedIssues || v.unresolvedQuestion || `Whether key network and market fundamentals maintain structural integrity.`;

    if (cEl) {
      const outcomeText = v.outcome === 'DIVIDED' ? 'DIVIDED — NO MAJORITY' : `${v.outcome || 'PASS'} (${v.majorityRatio || `${votes.length} / ${votes.length}`} Majority)`;
      cEl.textContent = synth?.conclusion || `Floor outcome certified as ${outcomeText} based strictly on participating seats: ${participants}.`;
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

      const council = (typeof BourseAgents !== 'undefined') ? BourseAgents : (typeof BourseCryptoAgents !== 'undefined' ? BourseCryptoAgents : null);
      const agent = (council && typeof council.getAgentByName === 'function')
        ? council.getAgentByName(item.name)
        : null;
      const avatarSvg = BourseUtils.generatePixelAvatarSVG(item.name, 32);
      const voteClass = item.vote ? item.vote.toLowerCase() : 'pass';

      row.innerHTML = `
        <div class="vote-seat-avatar">
          ${avatarSvg}
        </div>
        <div class="vote-persona-meta">
          <span class="vote-persona-name">${item.name}</span>
          <span class="vote-persona-discipline">${item.discipline || item.school || (agent ? agent.discipline : '')}</span>
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

    if (triggersListEl) {
      if (v.reviewTriggers && v.reviewTriggers.length > 0) {
        triggersListEl.innerHTML = v.reviewTriggers.map(t => `<li>${t}</li>`).join('');
      } else {
        triggersListEl.innerHTML = `
          <li>Material deterioration in 24h settlement activity.</li>
          <li>Systemic change in protocol security or validator decentralization.</li>
          <li>Macro liquidity tightening impacting high-beta risk assets.</li>
        `;
      }
    }
  }

  function generateFallbackTranscript(s) {
    const list = [];
    const tTime = s.closedAt || '10:00';
    list.push({
      type: 'chair',
      who: 'CHAIR',
      time: '09:00',
      text: `Floor open for ${s.ticker || 'ASSET'}. Thesis on the table: "${s.question}". Evidentiary market pack distributed to all nine seats.`
    });

    if (s.votes && s.votes.length > 0) {
      s.votes.forEach((v, idx) => {
        list.push({
          type: 'analysis',
          who: `${v.name} (Seat 0${v.seat || idx + 1})`,
          time: `09:0${Math.min(9, idx + 1)}`,
          text: v.reason || v.rationale || `Evaluated from ${v.discipline || v.school} mandate: Vote is ${v.vote}.`
        });
      });
    }

    if (s.verdict) {
      const isSizingQ = /\b(size|sizing|position|allocation|allocate|portfolio|weight|percentage|percent|how much|risk budget)\b/i.test(s.question || '');
      const sizingText = isSizingQ ? ` Position Size Band: ${s.verdict.positionSizeBand}.` : '';
      const outcomeAnnounce = s.verdict.outcome === 'DIVIDED' ? 'DIVIDED — NO MAJORITY' : `${s.verdict.outcome} (${s.verdict.majorityRatio} Majority)`;
      list.push({
        type: 'chair',
        who: 'CHAIR',
        time: tTime,
        text: `Floor balloting completed on: "${s.question || 'Floor Question'}". Certified Outcome: ${outcomeAnnounce}. Dissent: ${s.verdict.dissentBreakdown || '--'}.${sizingText} Record officially closed.`
      });
    }

    return list;
  }

  function renderTranscriptReplay() {
    const feed = document.getElementById('replay-feed');
    const playBtn = document.getElementById('replay-play-btn');
    const restartBtn = document.getElementById('replay-restart-btn');
    const nextBtn = document.getElementById('replay-next-btn');

    if (!feed) return;

    // Ensure session has transcript messages
    if (!session.transcript || session.transcript.length === 0) {
      session.transcript = generateFallbackTranscript(session);
    }
    replayMessages = session.transcript || [];
    replayIndex = replayMessages.length; // initially show all

    function renderFeedUpToIndex(idx) {
      feed.innerHTML = '';
      if (replayMessages.length === 0) {
        feed.innerHTML = `<div style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.75rem;padding:24px;text-align:center;">No transcript messages recorded for this session.</div>`;
        return;
      }

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

    // Stop any ongoing replay timer and show initial feed
    stopReplay();
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
      if (replayMessages.length === 0) return;
      if (replayIndex >= replayMessages.length) {
        replayIndex = 0;
        renderFeedUpToIndex(0);
      }
      isReplayPlaying = true;
      if (playBtn) {
        playBtn.textContent = 'Pause';
        playBtn.classList.add('active');
      }
      clearInterval(replayInterval);
      replayInterval = setInterval(() => {
        if (replayIndex < replayMessages.length) {
          stepNext();
        } else {
          stopReplay();
        }
      }, 1400);
    }

    function stopReplay() {
      isReplayPlaying = false;
      if (playBtn) {
        playBtn.textContent = 'Play';
        playBtn.classList.remove('active');
      }
      if (replayInterval) {
        clearInterval(replayInterval);
        replayInterval = null;
      }
    }

    if (playBtn) {
      playBtn.onclick = () => {
        if (isReplayPlaying) {
          stopReplay();
        } else {
          startReplay();
        }
      };
    }

    if (restartBtn) {
      restartBtn.onclick = () => {
        stopReplay();
        replayIndex = 0;
        renderFeedUpToIndex(0);
        startReplay();
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        stopReplay();
        if (replayIndex >= replayMessages.length) {
          replayIndex = 0;
        }
        stepNext();
      };
    }
  }

  function setupShareButton() {
    const shareBtn = document.getElementById('verdict-page-share-btn') || document.getElementById('share-verdict-btn');
    if (!shareBtn) return;

    shareBtn.onclick = async () => {
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
    };
  }

  function setupWatcherForm() {
    const form = document.getElementById('watcher-form');
    const emailInput = document.getElementById('watcher-email');
    const feedbackEl = document.getElementById('watcher-feedback');
    const submitBtn = document.getElementById('watcher-submit-btn');

    if (!form || !emailInput) return;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!email || !session) return;

      if (submitBtn) submitBtn.disabled = true;
      if (feedbackEl) {
        feedbackEl.style.display = 'block';
        feedbackEl.style.color = '#9A9A9A';
        feedbackEl.textContent = 'Registering alert with daily cron watcher...';
      }

      try {
        const res = await fetch('/api/watch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.id,
            asset: session.ticker || session.asset || 'ASSET',
            email,
            triggerCondition: 'Asset price suffers a cumulative drawdown exceeding 30–35%',
            drawdownThreshold: 30.0
          })
        });

        const json = await res.json();
        if (res.ok && json.success) {
          if (feedbackEl) {
            feedbackEl.style.color = '#FFFFFF';
            feedbackEl.textContent = `✓ Watcher active for ${email}. Daily cron will evaluate 30% drawdown triggers.`;
          }
          emailInput.value = '';
          BourseUtils.showToast('Review trigger watcher activated!');
        } else {
          if (feedbackEl) {
            feedbackEl.style.color = '#FFFFFF';
            feedbackEl.textContent = json.error || 'Failed to activate watcher.';
          }
        }
      } catch (err) {
        if (feedbackEl) {
          feedbackEl.style.color = '#FFFFFF';
          feedbackEl.textContent = 'Network error contacting watcher service.';
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    };
  }

  return {
    init,
    loadSession,
    getCurrentSession: () => session
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  BourseVerdict.init();
});
