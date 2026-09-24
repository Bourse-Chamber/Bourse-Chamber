/**
 * Bourse Chamber — Council Chamber Orchestration Engine
 * 9 Seats · State Machine · F13 Answer Budget (13/day) · F14 Directed Selection · Taleb Sizing Band
 */

const BourseChamber = (() => {
  // Council States
  const STATES = {
    IDLE: 'IDLE',
    EVIDENCE: 'EVIDENCE',
    ROUND_1: 'ROUND_1',
    ROUND_2: 'ROUND_2',
    ROUND_3: 'ROUND_3',
    AGGREGATING: 'AGGREGATING',
    COMPLETED: 'COMPLETED',
    ERROR: 'ERROR'
  };

  let currentState = STATES.IDLE;
  let currentSession = null;
  let currentEvidence = null;
  let liveSeatStates = {};
  let isPaused = false;
  let simulationSpeed = 1.0;

  // F14 Directed Selection State
  let selectedSeats = new Set(); // Set of seat numbers (1-9)
  let isCrossExamMode = false;

  // DOM references
  let seatsContainer, spokesSvg, feedEl, composerInput, conveneBtn;
  let statePillEl, stateLabelEl, sessionIdEl, clockEl, evidencePanelEl;
  let scoreboardEl, tallyAddEl, tallyReduceEl, tallyPassEl;
  let postActionsEl, viewVerdictBtn, shareVerdictBtn, resetChamberBtn;
  let selectedChipsGroupEl, directedBarEl, crossExamToggleBtn, clearSelectionBtn, composerModeLabelEl;

  // AI Configuration references
  let engineConfigBtn, engineIndicatorDot, engineStatusText;
  let aiConfigOverlay, aiConfigClose, engineModeSelect, openRouterKeyInput, openRouterModelInput, aiTestBtn, aiSaveBtn;

  const DEFAULT_OPENROUTER_KEY = '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';
  const DEFAULT_OPENROUTER_MODEL = 'openrouter/free';

  function init() {
    seatsContainer = document.getElementById('council-seats');
    spokesSvg = document.getElementById('spoke-lines-svg');
    feedEl = document.getElementById('transcript-feed');
    composerInput = document.getElementById('composer-input');
    conveneBtn = document.getElementById('convene-btn');
    statePillEl = document.getElementById('chamber-state-pill');
    stateLabelEl = document.getElementById('chamber-state-label');
    sessionIdEl = document.getElementById('session-id-display');
    clockEl = document.getElementById('chamber-clock');
    evidencePanelEl = document.getElementById('evidence-panel');
    scoreboardEl = document.getElementById('voting-scoreboard');
    tallyAddEl = document.getElementById('tally-add');
    tallyReduceEl = document.getElementById('tally-reduce');
    tallyPassEl = document.getElementById('tally-pass');
    postActionsEl = document.getElementById('post-session-actions');
    viewVerdictBtn = document.getElementById('view-verdict-btn');
    shareVerdictBtn = document.getElementById('share-verdict-btn');
    resetChamberBtn = document.getElementById('reset-chamber-btn');

    selectedChipsGroupEl = document.getElementById('selected-chips-group');
    directedBarEl = document.getElementById('directed-selection-bar');
    crossExamToggleBtn = document.getElementById('crossexam-toggle-btn');
    clearSelectionBtn = document.getElementById('clear-selection-btn');
    composerModeLabelEl = document.getElementById('composer-mode-label');

    engineConfigBtn = document.getElementById('engine-config-btn');
    engineIndicatorDot = document.getElementById('engine-indicator-dot');
    engineStatusText = document.getElementById('engine-status-text');
    aiConfigOverlay = document.getElementById('ai-config-overlay');
    aiConfigClose = document.getElementById('ai-config-close');
    engineModeSelect = document.getElementById('engine-mode-select');
    openRouterKeyInput = document.getElementById('openrouter-key-input');
    openRouterModelInput = document.getElementById('openrouter-model-input');
    aiTestBtn = document.getElementById('ai-test-btn');
    aiSaveBtn = document.getElementById('ai-save-btn');

    setupAIConfig();

    // Start Clock
    startClock();

    // Render 9 seats & SVG spokes
    renderChamberRing();

    // Setup input, chips, directed listeners
    setupComposer();

    // Setup transcript controls
    setupTranscriptControls();

    // Initial budget calculation
    updateComposerMode();

    // Check query params
    const urlParams = typeof window !== 'undefined' && window.location && window.location.search ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const initialQuery = urlParams.get('q');
    if (initialQuery && composerInput) {
      composerInput.value = initialQuery;
    }
  }

  function setupAIConfig() {
    if (typeof localStorage !== 'undefined') {
      if (!localStorage.getItem('bourse_ai_key')) {
        localStorage.setItem('bourse_ai_key', DEFAULT_OPENROUTER_KEY);
      }
      if (!localStorage.getItem('bourse_ai_model')) {
        localStorage.setItem('bourse_ai_model', DEFAULT_OPENROUTER_MODEL);
      }
      if (!localStorage.getItem('bourse_ai_mode')) {
        localStorage.setItem('bourse_ai_mode', 'live');
      }
    }

    updateEngineUI();

    if (engineConfigBtn && aiConfigOverlay) {
      engineConfigBtn.onclick = () => {
        if (openRouterKeyInput) openRouterKeyInput.value = localStorage.getItem('bourse_ai_key') || DEFAULT_OPENROUTER_KEY;
        if (openRouterModelInput) openRouterModelInput.value = localStorage.getItem('bourse_ai_model') || DEFAULT_OPENROUTER_MODEL;
        if (engineModeSelect) engineModeSelect.value = localStorage.getItem('bourse_ai_mode') || 'live';
        aiConfigOverlay.style.display = 'flex';
      };
    }

    if (aiConfigClose && aiConfigOverlay) {
      aiConfigClose.onclick = () => { aiConfigOverlay.style.display = 'none'; };
      aiConfigOverlay.onclick = (e) => {
        if (e.target === aiConfigOverlay) aiConfigOverlay.style.display = 'none';
      };
    }

    if (aiSaveBtn && aiConfigOverlay) {
      aiSaveBtn.onclick = () => {
        const key = openRouterKeyInput ? openRouterKeyInput.value.trim() : '';
        const model = openRouterModelInput ? openRouterModelInput.value.trim() : DEFAULT_OPENROUTER_MODEL;
        const mode = engineModeSelect ? engineModeSelect.value : 'live';

        localStorage.setItem('bourse_ai_key', key || DEFAULT_OPENROUTER_KEY);
        localStorage.setItem('bourse_ai_model', model || DEFAULT_OPENROUTER_MODEL);
        localStorage.setItem('bourse_ai_mode', mode);

        updateEngineUI();
        aiConfigOverlay.style.display = 'none';
        BourseUtils.showToast(`AI Engine updated: ${mode === 'live' ? 'Live AI Streaming' : 'Smart Simulator'}`);
      };
    }

    if (aiTestBtn) {
      aiTestBtn.onclick = async () => {
        const key = (openRouterKeyInput ? openRouterKeyInput.value.trim() : '') || localStorage.getItem('bourse_ai_key') || DEFAULT_OPENROUTER_KEY;
        aiTestBtn.textContent = 'Testing...';
        aiTestBtn.disabled = true;
        try {
          const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
            headers: { 'Authorization': `Bearer ${key}` }
          });
          const data = await res.json();
          if (res.ok && data?.data) {
            BourseUtils.showToast(`OpenRouter Key Valid! Limit: ${data.data.limit_remaining || '50'}/day`, 'success');
          } else {
            BourseUtils.showToast(`Key response: ${res.status} (${data?.error?.message || 'Check key'})`, 'info');
          }
        } catch (e) {
          BourseUtils.showToast(`Connection test error: ${e.message}`, 'error');
        } finally {
          aiTestBtn.textContent = 'Test Connection';
          aiTestBtn.disabled = false;
        }
      };
    }
  }

  function updateEngineUI() {
    const mode = (typeof localStorage !== 'undefined' && localStorage.getItem('bourse_ai_mode')) || 'live';
    const model = (typeof localStorage !== 'undefined' && localStorage.getItem('bourse_ai_model')) || DEFAULT_OPENROUTER_MODEL;

    if (engineStatusText) {
      if (mode === 'live') {
        const modelLabel = model.includes('free') ? 'FREE' : (model.split('/')[1] || 'ACTIVE');
        engineStatusText.textContent = `⚡ AI: LIVE (${modelLabel.toUpperCase()})`;
      } else {
        engineStatusText.textContent = `⚙ SIMULATOR (NLP)`;
      }
    }
    if (engineIndicatorDot) {
      if (mode === 'live') {
        engineIndicatorDot.classList.remove('simulator');
      } else {
        engineIndicatorDot.classList.add('simulator');
      }
    }
  }

  function startClock() {
    function tick() {
      if (clockEl) clockEl.textContent = BourseUtils.formatTimestamp(new Date());
    }
    tick();
    const clockInterval = setInterval(tick, 1000);
    if (clockInterval && typeof clockInterval.unref === 'function') clockInterval.unref();
  }

  // Canonical rectangular arena coordinates (1000 x 490)
  // 3 Top (Taleb 06, Graham 01, Damodaran 05), 3 Left Flank (Burry 09, Ackman 08, Pabrai 07), 3 Right Flank (Munger 02, Lynch 03, Wood 04)
  const SEAT_COORDINATES = {
    1: { x: 500, y: 44 },  // Graham (Chair / Center Top)
    2: { x: 910, y: 120 }, // Munger (Right Flank Row 1)
    3: { x: 910, y: 270 }, // Lynch (Right Flank Row 2)
    4: { x: 910, y: 420 }, // Wood (Right Flank Row 3)
    5: { x: 705, y: 44 },  // Damodaran (Top Row Right — marked position)
    6: { x: 295, y: 44 },  // Taleb (Top Row Left — marked position)
    7: { x: 90,  y: 420 }, // Pabrai (Left Flank Row 3)
    8: { x: 90,  y: 270 }, // Ackman (Left Flank Row 2)
    9: { x: 90,  y: 120 }  // Burry (Left Flank Row 1)
  };

  // Spoke connections: from seat edge to transcript border (rect: x 190..810, y 108..458)
  const SPOKE_COORDINATES = {
    1: { x1: 500, y1: 82,  x2: 500, y2: 108 }, // Vertical down to transcript top
    2: { x1: 882, y1: 120, x2: 810, y2: 120 }, // Right flank row 1 (horizontal)
    3: { x1: 882, y1: 270, x2: 810, y2: 270 }, // Right flank row 2 (horizontal)
    4: { x1: 882, y1: 420, x2: 810, y2: 420 }, // Right flank row 3 (horizontal)
    5: { x1: 705, y1: 82,  x2: 705, y2: 108 }, // Vertical down to transcript top (Damodaran)
    6: { x1: 295, y1: 82,  x2: 295, y2: 108 }, // Vertical down to transcript top (Taleb)
    7: { x1: 118, y1: 420, x2: 190, y2: 420 }, // Left flank row 3 (horizontal)
    8: { x1: 118, y1: 270, x2: 190, y2: 270 }, // Left flank row 2 (horizontal)
    9: { x1: 118, y1: 120, x2: 190, y2: 120 }  // Left flank row 1 (horizontal)
  };

  // Canonical 9 Crypto Architect Council Personas
  const CRYPTO_PERSONAS = [
    "Satoshi Nakamoto",
    "Vitalik Buterin",
    "Hal Finney",
    "Nick Szabo",
    "Anatoly Yakovenko",
    "Arthur Hayes",
    "Michael Saylor",
    "Changpeng Zhao",
    "Brian Armstrong"
  ];

  /**
   * Get active council (9 Canonical Crypto Architects)
   * The Chamber uses BourseCryptoAgents.
   */
  function getChamberCouncil() {
    if (typeof BourseCryptoAgents !== 'undefined' && BourseCryptoAgents && Array.isArray(BourseCryptoAgents.AGENTS)) {
      return BourseCryptoAgents;
    }
    if (typeof window !== 'undefined' && window.BourseCryptoAgents && Array.isArray(window.BourseCryptoAgents.AGENTS)) {
      return window.BourseCryptoAgents;
    }
    if (typeof globalThis !== 'undefined' && globalThis.BourseCryptoAgents && Array.isArray(globalThis.BourseCryptoAgents.AGENTS)) {
      return globalThis.BourseCryptoAgents;
    }
    throw new Error('Canonical 9 Crypto Architects (BourseCryptoAgents) failed to load into Chamber.');
  }

  /**
   * Render rectangular council arena (1 Top, 4 Left, 4 Right, Open Bottom)
   */
  function renderChamberRing() {
    if (!seatsContainer || !spokesSvg) return;
    seatsContainer.innerHTML = '';
    spokesSvg.innerHTML = '';

    const agents = getChamberCouncil().AGENTS;

    agents.forEach((agent) => {
      const pos = SEAT_COORDINATES[agent.seat] || { x: 500, y: 50 };
      const spoke = SPOKE_COORDINATES[agent.seat] || { x1: pos.x, y1: pos.y, x2: 500, y2: 230 };

      // Spoke Line
      const spokeLine = (typeof document.createElementNS === 'function')
        ? document.createElementNS('http://www.w3.org/2000/svg', 'line')
        : document.createElement('line');
      spokeLine.setAttribute('x1', spoke.x1);
      spokeLine.setAttribute('y1', spoke.y1);
      spokeLine.setAttribute('x2', spoke.x2);
      spokeLine.setAttribute('y2', spoke.y2);
      spokeLine.setAttribute('class', 'spoke-line');
      spokeLine.setAttribute('id', `spoke-${agent.seat}`);
      spokesSvg.appendChild(spokeLine);

      // Seat Node
      const seatEl = document.createElement('div');
      seatEl.className = 'council-seat';
      seatEl.id = `seat-node-${agent.seat}`;
      seatEl.style.left = `${pos.x}px`;
      seatEl.style.top = `${pos.y}px`;
      seatEl.setAttribute('role', 'button');
      seatEl.setAttribute('tabindex', '0');
      seatEl.setAttribute('aria-pressed', 'false');
      seatEl.setAttribute('aria-label', `Seat 0${agent.seat} ${agent.name}`);

      seatEl.innerHTML = `
        <div class="seat-avatar-box">
          <div class="seat-number-tag">0${agent.seat}</div>
          ${BourseUtils.generatePixelAvatarSVG(agent.name, 38)}
          <div class="voice-equalizer-bars" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
        <div class="seat-name">${agent.shortName || agent.name.split(' ').pop()}</div>
        <span class="seat-status-badge" id="seat-status-${agent.seat}">WAITING</span>
      `;

      // F14: Clicking toggles seat selection for directed questions
      seatEl.addEventListener('click', (e) => {
        // If holding Alt/Shift or clicking during active session, open dossier
        if (e.altKey || currentState !== STATES.IDLE) {
          window.openAgentDossier(agent, liveSeatStates[agent.seat]);
          return;
        }
        toggleSeatSelection(agent.seat);
      });

      // Context menu / double-click always opens dossier
      seatEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        window.openAgentDossier(agent, liveSeatStates[agent.seat]);
      });
      seatEl.addEventListener('dblclick', () => {
        window.openAgentDossier(agent, liveSeatStates[agent.seat]);
      });

      seatsContainer.appendChild(seatEl);
    });
  }

  /**
   * F14: Toggle seat selection
   */
  function toggleSeatSelection(seatNum) {
    if (selectedSeats.has(seatNum)) {
      selectedSeats.delete(seatNum);
    } else {
      selectedSeats.add(seatNum);
    }

    if (selectedSeats.size !== 2) {
      isCrossExamMode = false;
    }

    updateChamberSeatVisuals();
    updateComposerMode();
  }

  function clearSeatSelection() {
    selectedSeats.clear();
    isCrossExamMode = false;
    updateChamberSeatVisuals();
    updateComposerMode();
  }

  function updateChamberSeatVisuals() {
    getChamberCouncil().AGENTS.forEach(agent => {
      const seatEl = document.getElementById(`seat-node-${agent.seat}`);
      const badgeEl = document.getElementById(`seat-status-${agent.seat}`);
      if (!seatEl) return;

      const isSelected = selectedSeats.has(agent.seat);
      seatEl.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

      if (isSelected) {
        seatEl.classList.add('selected');
        seatEl.classList.remove('unselected-dim');
        if (badgeEl && (badgeEl.textContent === 'NOT PARTICIPATING' || badgeEl.textContent === 'WAITING' || badgeEl.textContent === 'SELECT TO JOIN')) {
          badgeEl.textContent = 'READY';
        }
      } else {
        seatEl.classList.remove('selected');
        if (selectedSeats.size > 0) {
          seatEl.classList.add('unselected-dim');
          if (badgeEl) badgeEl.textContent = 'NOT PARTICIPATING';
        } else {
          seatEl.classList.remove('unselected-dim');
          if (badgeEl) badgeEl.textContent = 'SELECT TO JOIN';
        }
      }
    });
  }

  /**
   * Calculate required budget & update composer UI (F13 & F14)
   */
  function getRequiredCredits() {
    if (selectedSeats.size === 0) {
      return 0; // 0 credits if nothing selected
    }
    if (isCrossExamMode && selectedSeats.size === 2) {
      return 4; // Cross-examine 2 seats, 2 rounds = 4 credits
    }
    return selectedSeats.size; // 1 credit per selected seat
  }

  function updateComposerMode() {
    const remaining = typeof BourseBudget !== 'undefined' ? BourseBudget.getRemaining() : 13;
    const count = selectedSeats.size;
    const required = getRequiredCredits();

    // Preview cost on budget pixel HUD
    if (typeof BourseBudget !== 'undefined') {
      BourseBudget.renderCounter(required);
    }

    // Update Directed Bar
    if (directedBarEl && selectedChipsGroupEl) {
      if (count > 0) {
        directedBarEl.style.display = 'flex';
        selectedChipsGroupEl.innerHTML = '';
        selectedSeats.forEach(seatNum => {
          const agent = getChamberCouncil().getAgentBySeat(seatNum);
          if (agent) {
            const chip = document.createElement('span');
            chip.className = 'directed-seat-chip';
            chip.innerHTML = `${agent.shortName || agent.name} <button type="button" aria-label="Remove ${agent.name}">×</button>`;
            chip.querySelector('button').addEventListener('click', (e) => {
              e.stopPropagation();
              toggleSeatSelection(agent.seat);
            });
            selectedChipsGroupEl.appendChild(chip);
          }
        });

        // Cross-examine toggle button (available only when exactly 2 seats selected)
        if (crossExamToggleBtn) {
          if (count === 2) {
            crossExamToggleBtn.style.display = 'inline-block';
            crossExamToggleBtn.className = `crossexam-toggle-btn ${isCrossExamMode ? 'active' : ''}`;
            crossExamToggleBtn.textContent = isCrossExamMode ? 'Cross-exam Active (4)' : 'Enable Cross-examine (4)';
          } else {
            crossExamToggleBtn.style.display = 'none';
          }
        }
      } else {
        directedBarEl.style.display = 'none';
      }
    }

    // Update Composer Mode Label & Button
    if (conveneBtn) {
      let label = '';
      if (count === 0) {
        label = 'Select at least one seat to convene';
        conveneBtn.disabled = true;
        if (composerModeLabelEl) composerModeLabelEl.textContent = 'Select at least one seat to convene';
      } else {
        conveneBtn.disabled = false;
        if (isCrossExamMode && count === 2) {
          const arr = Array.from(selectedSeats).map(s => getChamberCouncil().getAgentBySeat(s).shortName);
          label = `Cross-examine: ${arr.join(' vs ')} (4)`;
          if (composerModeLabelEl) composerModeLabelEl.textContent = `Cross-examination on the floor (${count} seats)`;
        } else if (count === 9) {
          label = `Ask full bench (9)`;
          if (composerModeLabelEl) composerModeLabelEl.textContent = `Deliberation with all 9 seats`;
        } else {
          const arr = Array.from(selectedSeats).map(s => getChamberCouncil().getAgentBySeat(s).shortName);
          label = `Convene ${arr.join(', ')} (${count})`;
          if (composerModeLabelEl) composerModeLabelEl.textContent = `Directed deliberation with ${count} selected ${count === 1 ? 'seat' : 'seats'}`;
        }
      }
      conveneBtn.textContent = label;

      // Budget Validation
      const warningEl = document.getElementById('budget-warning-text');
      if (count > 0 && remaining < required) {
        if (warningEl) {
          warningEl.style.display = 'block';
          warningEl.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <span>This prompt costs ${required} credits (${remaining} left today). Allowance will auto-replenish on convene.</span>
              <button type="button" id="budget-warning-replenish-btn" style="background:#FFFFFF;color:#050505;border:none;padding:3px 8px;font-family:var(--font-mono);font-size:0.68rem;font-weight:700;cursor:pointer;">↻ REPLENISH 13 CREDITS</button>
            </div>
          `;
          const repBtn = document.getElementById('budget-warning-replenish-btn');
          if (repBtn) {
            repBtn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof BourseBudget !== 'undefined') BourseBudget.reset();
              updateComposerMode();
              if (typeof BourseUtils !== 'undefined') BourseUtils.showToast('Budget replenished to 13/13 credits.');
            };
          }
        }
      } else {
        if (warningEl && remaining > 3) {
          warningEl.style.display = 'none';
        }
      }
    }
  }

  function setSeatState(seatNum, stateClass, statusText) {
    const seatEl = document.getElementById(`seat-node-${seatNum}`);
    const spokeEl = document.getElementById(`spoke-${seatNum}`);
    const badgeEl = document.getElementById(`seat-status-${seatNum}`);

    if (seatEl) {
      seatEl.className = `council-seat ${stateClass || ''} ${selectedSeats.has(seatNum) ? 'selected' : ''}`;
    }
    if (badgeEl && statusText) {
      badgeEl.textContent = statusText;
    }
    if (spokeEl) {
      spokeEl.className = 'spoke-line';
      if (stateClass === 'speaking') spokeEl.classList.add('active');
      if (stateClass === 'challenging') spokeEl.classList.add('clash');
    }
  }

  function resetAllSeatStates(statusText = 'WAITING') {
    getChamberCouncil().AGENTS.forEach(a => {
      setSeatState(a.seat, '', statusText);
    });
  }

  function updateChamberState(newState) {
    currentState = newState;
    if (stateLabelEl) stateLabelEl.textContent = newState;
    if (statePillEl) {
      statePillEl.className = 'state-pill';
      if (newState === STATES.COMPLETED) statePillEl.style.borderColor = '#FFFFFF';
    }
  }

  function extractTokenNameFromQuery(query, fallbackTicker) {
    if (!query || typeof query !== 'string') {
      return (fallbackTicker && !['CRYPTO', 'TOKEN', 'ASSET', 'UNKNOWN', 'THE TOKEN'].includes(fallbackTicker.toUpperCase())) ? fallbackTicker : '';
    }
    const raw = query.trim();

    // Pattern 1: "of <TOKEN> on <Network>" or "of <TOKEN> (CA:" or "of <TOKEN> token"
    const mOf = raw.match(/\b(?:of|for|on)\s+([A-Za-z0-9$]{2,20})\s+(?:on\b|\(CA:|\btoken\b|\(0x)/i);
    if (mOf && !/^(the|a|an|current|any|all|our|this|its)$/i.test(mOf[1])) {
      return mOf[1].replace(/^\$/, '').toUpperCase();
    }

    // Pattern 2: "<TOKEN> on <Network> [Chain]" e.g. "CASHCAT on Robinhood Chain"
    const mOn = raw.match(/\b([A-Za-z0-9$]{2,20})\s+on\s+[A-Za-z0-9\s]+(?:Chain|Network|L2)\b/i);
    if (mOn && !/^(market|cap|liquidity|volume|activity|concentration|status|permissions|contract|trading|holders?)$/i.test(mOn[1])) {
      return mOn[1].replace(/^\$/, '').toUpperCase();
    }

    // Pattern 3: "<TOKEN> (CA: 0x...)" or "<TOKEN> (0x...)"
    const mCa = raw.match(/\b([A-Za-z0-9$]{2,20})\s*\((?:CA:?\s*)?0x[a-fA-F0-9]/i);
    if (mCa && !/^(chain|network|address|contract|token)$/i.test(mCa[1])) {
      return mCa[1].replace(/^\$/, '').toUpperCase();
    }

    // Pattern 4: "can/will/could/should/does/is <TOKEN> reach/sustain/hit/grow/surpass/hold"
    const mVerb = raw.match(/\b(?:can|will|could|should|does|is)\s+([A-Za-z0-9$]{2,20})\s+(?:reach|sustain|hit|grow|surpass|hold|achieve|maintain)/i);
    if (mVerb && !/^(the|a|an|it|this|that|we)$/i.test(mVerb[1])) {
      return mVerb[1].replace(/^\$/, '').toUpperCase();
    }

    // Pattern 5: "for <TOKEN> to reach"
    const mFor = raw.match(/\bfor\s+([A-Za-z0-9$]{2,20})\s+to\s+(?:reach|sustain|hit|grow)/i);
    if (mFor && !/^(the|a|an|it|this|that)$/i.test(mFor[1])) {
      return mFor[1].replace(/^\$/, '').toUpperCase();
    }

    // Pattern 6: "<TOKEN> token"
    const mToken = raw.match(/\b([A-Za-z0-9$]{2,20})\s+token\b/i);
    if (mToken && !/^(the|a|an|any|this|native|erc20|spl|our)$/i.test(mToken[1])) {
      return mToken[1].replace(/^\$/, '').toUpperCase();
    }

    // Pattern 7: Symbol with dollar sign e.g. $CASHCAT
    const mDollar = raw.match(/\$([A-Za-z0-9]{2,15})\b/);
    if (mDollar && !/^\d+/.test(mDollar[1])) {
      return mDollar[1].toUpperCase();
    }

    // Pattern 8: If fallbackTicker is a real ticker (not generic)
    if (fallbackTicker && !['CRYPTO', 'TOKEN', 'ASSET', 'UNKNOWN', 'THE TOKEN'].includes(fallbackTicker.toUpperCase())) {
      return fallbackTicker.toUpperCase();
    }

    return fallbackTicker || '';
  }

  function makeReadableQuestion(rawQ, ticker, targetFormatted) {
    if (!rawQ || typeof rawQ !== 'string') return '';
    const trimmed = rawQ.trim();

    // 1. Extract the true token identity from raw query first
    const tokenName = extractTokenNameFromQuery(trimmed, ticker);
    const asset = (tokenName && !['CRYPTO', 'TOKEN', 'ASSET', 'UNKNOWN', 'THE TOKEN'].includes(tokenName.toUpperCase()))
      ? tokenName
      : (ticker && !['CRYPTO', 'TOKEN', 'ASSET', 'UNKNOWN', 'THE TOKEN'].includes(ticker.toUpperCase()) ? ticker : 'the token');

    // 2. Extract target market cap
    const targetMatch = trimmed.match(/(?:\$|reach\s+)([\d,.]+[kKmMbB]?)/i);
    const target = targetFormatted || (targetMatch ? (targetMatch[1].startsWith('$') ? targetMatch[1] : `$${targetMatch[1]}`) : '');

    // 3. Detect intent / clauses
    const asksSpeculative = /without\s+relying\s+on\s+(?:temporary\s+)?speculative\s+volume|speculative\s+volume/i.test(trimmed);
    const asksChanges = /what\s+measurable\s+changes|what\s+changes|which\s+current\s+constraint|greatest\s+obstacle|main\s+factor/i.test(trimmed);
    const asksSustainOnly = /can\s+.*reach\s+and\s+sustain/i.test(trimmed) || /sustain/i.test(trimmed);

    // If query is short (e.g. <= 120 chars) and does NOT contain generic tokens like CRYPTO/TOKEN
    if (trimmed.length <= 120 && trimmed.includes('?')) {
      if (asset !== 'the token') {
        const cleaned = trimmed.replace(/\b(?:the token|CRYPTO|TOKEN)\b/gi, asset);
        return cleaned;
      }
      return trimmed;
    }

    // For longer / complex queries, reconstruct cleanly while preserving identity & intent:
    if (target) {
      if (asksSpeculative) {
        return `Can ${asset} reach and sustain a ${target} market cap without relying on temporary speculative volume?`;
      }
      if (asksChanges) {
        return `Can ${asset} reach and sustain a ${target} market cap?\nWhat changes would be needed?`;
      }
      if (asksSustainOnly) {
        return `Can ${asset} reach and sustain a ${target} market cap?`;
      }
      return `Can ${asset} reach a ${target} market cap?`;
    }

    // Try last question sentence if available
    const parts = trimmed.split(/(?<=[.?!])\s+/);
    const qParts = parts.filter(p => p.includes('?'));
    if (qParts.length > 0 && qParts[qParts.length - 1].length < 130) {
      let lastQ = qParts[qParts.length - 1].trim();
      if (asset !== 'the token') {
        lastQ = lastQ.replace(/\b(?:the token|CRYPTO|TOKEN)\b/gi, asset);
      }
      return lastQ;
    }

    return trimmed.slice(0, 110) + '...';
  }

  function formatVerdictRecordHtml(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';
    const normalizedText = rawText.replace(/\r\n/g, '\n');

    const escape = (str) => {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    const sessionMatch = normalizedText.match(/SESSION\s+([^\n\r]+)/i);
    const sessionStr = sessionMatch ? sessionMatch[1].trim() : '';

    const extractSection = (heading, nextHeadings) => {
      const lookahead = nextHeadings.length > 0
        ? `(?=(?:\\n(?:${nextHeadings.join('|')})\\b)|$)`
        : '$';
      const pattern = new RegExp(`${heading}\\s*\\n([\\s\\S]*?)${lookahead}`, 'i');
      const m = normalizedText.match(pattern);
      return m ? m[1].trim() : '';
    };

    const allSections = [
      'OUTCOME',
      'VOTE',
      'MATHEMATICAL REQUIREMENTS',
      'LIQUIDITY REQUIREMENTS',
      'DEMAND REQUIREMENTS',
      'SUPPLY / DILUTION REQUIREMENTS',
      'SECURITY / TRUST REQUIREMENTS',
      'KEY RESULT',
      'MAIN FACTOR',
      'REASON',
      'CONCLUSION',
      'STATUS'
    ];

    const getNextHeadings = (heading) => {
      const idx = allSections.indexOf(heading);
      return idx >= 0 ? allSections.slice(idx + 1) : [];
    };

    const question = extractSection('QUESTION', allSections);
    const outcome = extractSection('OUTCOME', getNextHeadings('OUTCOME'));
    const vote = extractSection('VOTE', getNextHeadings('VOTE'));
    const mathReq = extractSection('MATHEMATICAL REQUIREMENTS', getNextHeadings('MATHEMATICAL REQUIREMENTS'));
    const liqReq = extractSection('LIQUIDITY REQUIREMENTS', getNextHeadings('LIQUIDITY REQUIREMENTS'));
    const demandReq = extractSection('DEMAND REQUIREMENTS', getNextHeadings('DEMAND REQUIREMENTS'));
    const supplyReq = extractSection('SUPPLY / DILUTION REQUIREMENTS', getNextHeadings('SUPPLY / DILUTION REQUIREMENTS'));
    const securityReq = extractSection('SECURITY / TRUST REQUIREMENTS', getNextHeadings('SECURITY / TRUST REQUIREMENTS'));
    const keyResult = extractSection('KEY RESULT', getNextHeadings('KEY RESULT'));
    const mainFactor = extractSection('MAIN FACTOR', getNextHeadings('MAIN FACTOR'));
    const reason = extractSection('REASON', getNextHeadings('REASON'));
    const conclusion = extractSection('CONCLUSION', getNextHeadings('CONCLUSION'));
    const status = extractSection('STATUS', []) || 'Record closed and saved to the Verdict Ledger.';

    if (!question && !outcome) {
      return `<div style="white-space: pre-wrap; word-break: break-word;">${escape(rawText)}</div>`;
    }

    return `
      <div class="vr-container">
        <div class="vr-header-block">
          <div class="vr-title">VERDICT RECORD</div>
          ${sessionStr ? `<div class="vr-session">SESSION ${escape(sessionStr)}</div>` : ''}
        </div>
        <div class="vr-section">
          <div class="vr-label">QUESTION</div>
          <div class="vr-text vr-question">${escape(question).replace(/\n/g, '<br>')}</div>
        </div>
        <div class="vr-section">
          <div class="vr-label">OUTCOME</div>
          <div class="vr-text vr-outcome">${escape(outcome)}</div>
        </div>
        <div class="vr-section">
          <div class="vr-label">VOTE</div>
          <div class="vr-text vr-vote">${escape(vote).replace(/\n/g, '<br>')}</div>
        </div>
        ${mathReq ? `
        <div class="vr-section">
          <div class="vr-label">MATHEMATICAL REQUIREMENTS</div>
          <div class="vr-text vr-math-req">${escape(mathReq).replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}
        ${liqReq ? `
        <div class="vr-section">
          <div class="vr-label">LIQUIDITY REQUIREMENTS</div>
          <div class="vr-text vr-liq-req">${escape(liqReq).replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}
        ${demandReq ? `
        <div class="vr-section">
          <div class="vr-label">DEMAND REQUIREMENTS</div>
          <div class="vr-text vr-demand-req">${escape(demandReq).replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}
        ${supplyReq ? `
        <div class="vr-section">
          <div class="vr-label">SUPPLY / DILUTION REQUIREMENTS</div>
          <div class="vr-text vr-supply-req">${escape(supplyReq).replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}
        ${securityReq ? `
        <div class="vr-section">
          <div class="vr-label">SECURITY / TRUST REQUIREMENTS</div>
          <div class="vr-text vr-security-req">${escape(securityReq).replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}
        ${keyResult ? `
        <div class="vr-section">
          <div class="vr-label">KEY RESULT</div>
          <div class="vr-text vr-key-result">${escape(keyResult).replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}
        ${mainFactor ? `
        <div class="vr-section">
          <div class="vr-label">MAIN FACTOR</div>
          <div class="vr-text vr-main-factor">${escape(mainFactor)}</div>
        </div>
        ` : ''}
        ${reason ? `
        <div class="vr-section">
          <div class="vr-label">REASON</div>
          <div class="vr-text vr-reason">${escape(reason)}</div>
        </div>
        ` : ''}
        <div class="vr-section">
          <div class="vr-label">CONCLUSION</div>
          <div class="vr-text vr-conclusion">${escape(conclusion)}</div>
        </div>
        <div class="vr-section">
          <div class="vr-label">STATUS</div>
          <div class="vr-text vr-status">${escape(status)}</div>
        </div>
      </div>
    `.trim();
  }

  function appendTranscriptMsg({ type, who, text, time = null }) {
    if (!feedEl) return null;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn(`[Chamber Feed] Ignored empty transcript message for: ${who}`);
      return null;
    }
    const msgTime = time || BourseUtils.formatTimestamp(new Date());
    const msg = document.createElement('div');
    msg.className = `transcript-msg ${type || ''}`;

    const bodyContent = type === 'verdict-announcement'
      ? formatVerdictRecordHtml(text)
      : text;

    msg.innerHTML = `
      <div class="msg-meta">
        <span>${who}</span>
        <span class="msg-time">${msgTime}</span>
      </div>
      <div class="msg-body">${bodyContent}</div>
    `;

    feedEl.appendChild(msg);
    feedEl.scrollTop = feedEl.scrollHeight;

    if (currentSession && currentSession.transcript) {
      currentSession.transcript.push({ type, who, time: msgTime, text });
      currentSession.speakingTurns = currentSession.transcript.length;
    }

    return msg;
  }

  function createLiveTranscriptMsg(type, who) {
    if (!feedEl) return null;
    const msg = document.createElement('div');
    msg.className = `transcript-msg ${type || 'analysis'}`;
    const time = (typeof BourseUtils !== 'undefined') ? BourseUtils.formatTimestamp(new Date()) : '--:--';
    msg.innerHTML = `
      <div class="msg-meta">
        <span>${who}</span>
        <span class="msg-time">${time}</span>
      </div>
      <div class="msg-body typing"></div>
    `;
    feedEl.appendChild(msg);
    feedEl.scrollTop = feedEl.scrollHeight;
    return msg;
  }

  async function streamTranscriptMsg({ type, who, text, time = null }) {
    if (!feedEl) return null;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn(`[Chamber Feed] Ignored empty stream transcript message for: ${who}`);
      return null;
    }
    const msgTime = time || BourseUtils.formatTimestamp(new Date());
    const msg = document.createElement('div');
    msg.className = `transcript-msg ${type || ''}`;

    msg.innerHTML = `
      <div class="msg-meta">
        <span>${who}</span>
        <span class="msg-time">${msgTime}</span>
      </div>
      <div class="msg-body typing"></div>
    `;

    feedEl.appendChild(msg);
    const bodyEl = msg.querySelector('.msg-body');

    const words = text.split(' ');
    let current = '';
    const delay = Math.max(12, Math.floor(26 / simulationSpeed));

    for (let i = 0; i < words.length; i++) {
      while (isPaused) {
        await BourseUtils.sleep(60);
      }
      current += (i === 0 ? '' : ' ') + words[i];
      bodyEl.textContent = current;
      feedEl.scrollTop = feedEl.scrollHeight;
      if (simulationSpeed < 2.5) {
        await BourseUtils.sleep(delay);
      }
    }

    bodyEl.classList.remove('typing');
    if (type === 'verdict-announcement') {
      bodyEl.innerHTML = formatVerdictRecordHtml(text);
    }

    if (currentSession && currentSession.transcript) {
      currentSession.transcript.push({ type, who, time: msgTime, text });
      currentSession.speakingTurns = currentSession.transcript.length;
    }

    return msg;
  }

  function drawDuelBeam(seatA, seatB) {
    clearDuelBeam();
    if (!spokesSvg) return;
    const posA = SEAT_COORDINATES[seatA];
    const posB = SEAT_COORDINATES[seatB];
    if (!posA || !posB) return;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('id', 'active-duel-beam');
    line.setAttribute('class', 'duel-beam');
    line.setAttribute('x1', posA.x);
    line.setAttribute('y1', posA.y);
    line.setAttribute('x2', posB.x);
    line.setAttribute('y2', posB.y);
    spokesSvg.appendChild(line);
  }

  function clearDuelBeam() {
    const existing = document.getElementById('active-duel-beam');
    if (existing) existing.remove();
  }

  function animateCounter(el, target) {
    if (!el) return;
    el.textContent = target;
    el.classList.remove('tally-pop');
    void el.offsetWidth;
    el.classList.add('tally-pop');
    setTimeout(() => el.classList.remove('tally-pop'), 400);
  }

  function asksForInvestmentSizing(query) {
    if (!query) return false;
    return /\b(allocation|portfolio weight|position size|sizing|how much to invest|percentage allocation|how much should i (buy|invest|allocate)|risk budget)\b/i.test(query);
  }

  /**
   * Authoritative validation function for session lifecycle completion.
   * Dynamically validates based on participating count (1-9 seats).
   */
  function canCompleteSession(session, verdict, dbSaved) {
    if (!session) {
      console.warn('[Completion Guard]: Session object is missing.');
      return false;
    }

    const targetCount = Array.isArray(session.directedSeats) && session.directedSeats.length > 0
      ? session.directedSeats.length
      : (session.participatingCount || (session.totalParticipants || (Array.isArray(session.votes) && session.votes.length > 0 ? session.votes.length : 9)));

    // 1. Round 1: analyses recorded for participating seats
    const r1Count = session.round1Analyses 
      ? (session.round1Analyses instanceof Map ? session.round1Analyses.size : Object.keys(session.round1Analyses).length)
      : (session.transcript || []).filter(t => t.type === 'speaking' || t.type === 'analysis').length;
    if (r1Count < targetCount) {
      console.warn(`[Completion Guard]: Incomplete Round 1 (${r1Count}/${targetCount} analyses recorded).`);
      return false;
    }

    // 2. Round 2: cross-examination (only required if targetCount >= 2; skipped for 1 seat)
    if (targetCount >= 2) {
      const hasR2Transcript = (session.transcript || []).some(t => t.type === 'challenge' || t.type === 'response');
      if (!session.round2Complete && !hasR2Transcript) {
        console.warn('[Completion Guard]: Incomplete Round 2 (cross-examination did not occur).');
        return false;
      }
    }

    // 3. Round 3: valid votes from participating seats
    const votes = Array.isArray(session.votes) ? session.votes : [];
    if (votes.length < targetCount) {
      console.warn(`[Completion Guard]: Incomplete Round 3 (${votes.length}/${targetCount} votes recorded).`);
      return false;
    }
    const validVoteSet = new Set(['ADD', 'REDUCE', 'PASS', 'SUPPORTED', 'NOT_SUPPORTED', 'INSUFFICIENT_EVIDENCE']);
    const allValid = votes.every(v => v && validVoteSet.has(((v.vote || '').toUpperCase().trim())));
    if (!allValid) {
      console.warn('[Completion Guard]: One or more invalid votes detected:', votes);
      return false;
    }

    // 4. Verdict outcome defined and in ["ADD", "REDUCE", "PASS", "DIVIDED", "SUPPORTED", "NOT_SUPPORTED", "INSUFFICIENT_EVIDENCE"]
    const outcome = verdict ? (((verdict.outcome ?? verdict.decision) || '').toUpperCase().trim()) : '';
    const validOutcomeSet = new Set(['ADD', 'REDUCE', 'PASS', 'DIVIDED', 'SUPPORTED', 'NOT_SUPPORTED', 'INSUFFICIENT_EVIDENCE']);
    if (!outcome || !validOutcomeSet.has(outcome)) {
      console.warn(`[Completion Guard]: Invalid verdict outcome: "${outcome}".`);
      return false;
    }

    // 5. Database save succeeded
    if (!dbSaved) {
      console.warn('[Completion Guard]: Database persistence was not confirmed.');
      return false;
    }

    return true;
  }

  async function finalizeSessionVerdict(outcome, majorityCount, addTally, reduceTally, passTally, verdictData = null, dbSaved = true) {
    const sessionId = currentSession ? currentSession.id : BourseUtils.generateSessionId();
    const sizingSeat = getChamberCouncil().getAgentBySeat(6) || { name: 'Nassim Nicholas Taleb', shortName: 'Taleb', discipline: 'Antifragility & tail risk' };

    const totalParticipants = Array.isArray(currentSession?.directedSeats) && currentSession.directedSeats.length > 0
      ? currentSession.directedSeats.length
      : (currentSession?.totalParticipants || (verdictData?.totalParticipants || (currentSession?.votes?.length || 9)));

    // Strict validation guard: DO NOT finalize or close if criteria not satisfied
    if (!canCompleteSession(currentSession, verdictData, dbSaved)) {
      console.error('[Chamber Guard]: canCompleteSession returned false. Aborting completion.');
      updateChamberState(STATES.ERROR);
      if (postActionsEl) postActionsEl.classList.remove('active');
      appendTranscriptMsg({
        type: 'chair',
        who: 'SYSTEM AUDIT',
        text: `SESSION INCOMPLETE: Deliberation aborted. Requirements not satisfied (Analyses: ${currentSession?.round1Analyses?.size || 0}/${totalParticipants}, Votes: ${currentSession?.votes?.length || 0}/${totalParticipants}, Outcome: ${outcome || 'undefined'}). Verdict cannot be certified.`
      });
      if (conveneBtn) conveneBtn.disabled = false;
      if (composerInput) composerInput.disabled = false;
      return false;
    }

    const dissentList = [];
    if (outcome === 'SUPPORTED' || outcome === 'NOT_SUPPORTED' || outcome === 'INSUFFICIENT_EVIDENCE') {
      if (outcome !== 'SUPPORTED' && addTally > 0) dissentList.push(`${addTally} SUPPORTED`);
      if (outcome !== 'NOT_SUPPORTED' && reduceTally > 0) dissentList.push(`${reduceTally} NOT SUPPORTED`);
      if (outcome !== 'INSUFFICIENT_EVIDENCE' && passTally > 0) dissentList.push(`${passTally} INSUFFICIENT EVIDENCE`);
    } else {
      if (outcome !== 'ADD' && addTally > 0) dissentList.push(`${addTally} ADD`);
      if (outcome !== 'REDUCE' && reduceTally > 0) dissentList.push(`${reduceTally} REDUCE`);
      if (outcome !== 'PASS' && passTally > 0) dissentList.push(`${passTally} PASS`);
    }
    const dissentBreakdown = verdictData?.dissentBreakdown || (dissentList.length > 0 ? dissentList.join(', ') : 'None (Unanimous)');

    const isSizingRequested = verdictData?.isSizingRequested ?? asksForInvestmentSizing(currentSession?.question || '');
    let sizingBand = null;
    let sizingRationale = "Calibrated against downside tail risk.";
    if (isSizingRequested) {
      if (verdictData?.positionSizeBand) {
        sizingBand = verdictData.positionSizeBand;
      } else {
        const sizingResult = (sizingSeat && typeof sizingSeat.calculatePositionSizeBand === 'function')
          ? sizingSeat.calculatePositionSizeBand(
              { ticker: currentEvidence?.ticker || 'ASSET', name: currentEvidence?.name || 'Asset' },
              currentEvidence || {},
              outcome
            )
          : { band: outcome === 'ADD' ? "2.0 – 3.5%" : (outcome === 'REDUCE' ? "0.5 – 1.0%" : "0.0%"), rationale: "Discipline-based tail risk sizing." };
        sizingBand = sizingResult.band;
        sizingRationale = sizingResult.rationale;
      }
    }

    const keyAgreement = verdictData?.keyAgreement || (outcome === 'DIVIDED' ? 'No clear consensus.' : `${currentEvidence?.name || 'Asset'} retains market interest, but participating members agree valuation must reflect structural tail risk.`);
    const keyDisagreement = verdictData?.keyDisagreement || `Whether organic adoption and economic moats endure versus speculative momentum.`;
    const unresolvedQuestion = verdictData?.unresolvedQuestion || `Can long-term unit economics sustain valuation through a liquidity contraction?`;
    const reviewTriggers = verdictData?.reviewTriggers || [
      `Asset price suffers a cumulative drawdown exceeding 30–35% from convening date.`,
      `Protocol exploit, structural governance crisis, or regulatory enforcement.`,
      `Sustained 24h transaction volume contracts by more than 40% over a 14-day rolling window.`
    ];

    const verdictObj = {
      id: `VR-${sessionId}`,
      sessionId,
      outcome,
      majorityRatio: outcome === 'DIVIDED' ? 'NO MAJORITY' : (verdictData?.majorityRatio || `${majorityCount} / ${totalParticipants}`),
      dissentBreakdown,
      positionSizeBand: sizingBand,
      sizingSeat: `Seat 06 · ${sizingSeat.name} (${sizingSeat.discipline})`,
      sizingRationale,
      keyAgreement,
      keyDisagreement,
      unresolvedQuestion,
      reviewTriggers,
      totalParticipants,
      isSizingRequested,
      synthesis: verdictData?.synthesis || currentSession?.synthesis || null
    };

    if (currentSession) {
      currentSession.verdict = verdictObj;
      currentSession.closedAt = BourseUtils.formatTimestamp(new Date());
    }

    triggerVerdictImpact(outcome);

    const isTokenCa = (outcome === 'SUPPORTED' || outcome === 'NOT_SUPPORTED' || outcome === 'INSUFFICIENT_EVIDENCE') ||
                      (verdictData?.tokenCaDetails != null) ||
                      (verdictData?.questionTopic === 'TOKEN_CA');

    let voteLines = '';
    if (isTokenCa) {
      voteLines = `SUPPORTED: ${addTally}\nNOT_SUPPORTED: ${reduceTally}\nINSUFFICIENT_EVIDENCE: ${passTally}`;
    } else {
      voteLines = `ADD: ${addTally}\nREDUCE: ${reduceTally}\nPASS: ${passTally}`;
    }

    const outcomeText = outcome === 'DIVIDED'
      ? 'DIVIDED — NO MAJORITY'
      : (verdictObj.majorityRatio && verdictObj.majorityRatio !== 'NO MAJORITY'
          ? `${outcome} (${verdictObj.majorityRatio} Majority)`
          : outcome);

    const caDetails = verdictData?.tokenCaDetails || currentSession?.synthesis?.caDetails;
    const fullQuestion = (currentSession?.question || verdictData?.question || '').trim();
    let ticker = currentEvidence?.ticker || verdictData?.ticker || currentSession?.ticker;
    const extractedToken = extractTokenNameFromQuery(fullQuestion, ticker);
    if (extractedToken && !['CRYPTO', 'TOKEN', 'ASSET', 'UNKNOWN', 'THE TOKEN'].includes(extractedToken.toUpperCase())) {
      ticker = extractedToken;
    } else if (!ticker || ['CRYPTO', 'TOKEN', 'ASSET'].includes(ticker.toUpperCase())) {
      ticker = 'the token';
    }
    const targetFormatted = caDetails?.targetMarketCap || '$100K';
    const multFormatted = caDetails?.requiredMultipleFormatted || 'DATA UNAVAILABLE';
    const liqFormatted = caDetails?.liquidity || 'DATA UNAVAILABLE';

    const isTargetBelow = caDetails?.targetInterpretation === 'BELOW CURRENT MC' ||
      (typeof caDetails?.targetMarketCapNum === 'number' && typeof caDetails?.currentMarketCapNum === 'number' && caDetails.targetMarketCapNum < caDetails.currentMarketCapNum);

    let conciseConclusion = verdictData?.conciseConclusion ||
      verdictData?.synthesis?.conciseConclusion ||
      currentSession?.synthesis?.conciseConclusion ||
      (currentSession?.verdict && currentSession.verdict.conciseConclusion);

    if (!conciseConclusion) {
      if (isTokenCa && isTargetBelow) {
        conciseConclusion = `The ${targetFormatted} target is below the current Market Cap of ${caDetails?.currentMarketCap || 'current levels'}, so reaching it would mean a decrease, not growth. However, the available evidence is not enough to confirm whether ${targetFormatted} could be sustained without relying on speculative volume.`;
      } else if (outcome === 'DIVIDED') {
        conciseConclusion = isTokenCa
          ? `The Chamber could not confirm that ${ticker} can reach and hold a ${targetFormatted} market cap. More evidence is needed on liquidity, LP status, and holder distribution.`
          : 'The Chamber was divided and could not reach a majority. The seats disagreed on whether conditions are strong enough to act.';
      } else if (isTokenCa) {
        if (outcome === 'SUPPORTED') {
          conciseConclusion = `Trading activity supports the ${targetFormatted} target (${multFormatted} higher). More liquidity and confirmed LP locking are still needed.`;
        } else if (outcome === 'NOT_SUPPORTED') {
          conciseConclusion = `The Chamber found that reaching ${targetFormatted} (${multFormatted} higher) is not supported. Current liquidity (${liqFormatted}) is too low for the required growth.`;
        } else {
          conciseConclusion = `The Chamber could not confirm that ${ticker} can reach the ${targetFormatted} target. Important holder, LP, and contract data are still unavailable.`;
        }
      } else {
        if (outcome === 'ADD') {
          conciseConclusion = 'The Chamber voted to add. A majority found that market and protocol conditions support adding exposure within agreed risk limits.';
        } else if (outcome === 'REDUCE') {
          conciseConclusion = 'The Chamber voted to reduce. A majority found that risk is elevated and current conditions do not support holding full exposure.';
        } else {
          conciseConclusion = 'The Chamber voted to pass. Available data was not clear enough to justify acting at this time.';
        }
      }
    }

    verdictObj.conciseConclusion = conciseConclusion;

    const displayQuestion = makeReadableQuestion(fullQuestion, ticker, targetFormatted);

    // Build 5-SECTION TOKEN_CA REQUIREMENTS block
    const fiveRequirementLines = [];
    if (isTokenCa && caDetails && (caDetails.currentMarketCap || caDetails.targetMarketCap)) {
      const curMc = caDetails.currentMarketCap || 'DATA UNAVAILABLE';
      const tgtMc = caDetails.targetMarketCap || 'DATA UNAVAILABLE';
      const mult = caDetails.requiredMultipleFormatted || (caDetails.requiredMultiple ? `${caDetails.requiredMultiple}x` : 'DATA UNAVAILABLE');
      const mcChange = caDetails.marketCapDiffFormatted || 'DATA UNAVAILABLE';
      const tgtInterp = caDetails.targetInterpretation || 'DATA UNAVAILABLE';
      const liq = caDetails.liquidity || 'DATA UNAVAILABLE';
      const vol = caDetails.volume24h || 'DATA UNAVAILABLE';
      const buySell = caDetails.buySellRatio || (currentEvidence?.buySellRatio || 'DATA UNAVAILABLE');
      const txns = caDetails.buysSells || (currentEvidence?.txns24h?.buys ? `${currentEvidence.txns24h.buys} buys / ${currentEvidence.txns24h.sells} sells` : 'DATA UNAVAILABLE');

      let holderDist = 'DATA UNAVAILABLE';
      if (caDetails.holderCount && caDetails.holderCount !== 'DATA UNAVAILABLE') {
        holderDist = `${caDetails.holderCount} holders`;
        if (caDetails.holderConcentration && caDetails.holderConcentration !== 'DATA UNAVAILABLE') {
          holderDist += ` (Top 10: ${caDetails.holderConcentration})`;
        }
      } else if (caDetails.holderConcentration && caDetails.holderConcentration !== 'DATA UNAVAILABLE') {
        holderDist = caDetails.holderConcentration;
      }

      const fdv = caDetails.fdvFormatted || (currentEvidence?.fdvFormatted || curMc || 'DATA UNAVAILABLE');
      const lpStatus = caDetails.lpStatus || 'DATA UNAVAILABLE';
      const contractPermissions = caDetails.contractRisks || 'DATA UNAVAILABLE';

      fiveRequirementLines.push(
        'MATHEMATICAL REQUIREMENTS',
        `Current Market Cap: ${curMc}`,
        `Target Market Cap: ${tgtMc}`,
        `Required Multiple: ${mult}`,
        `Market-Cap Change: ${mcChange}`,
        `Target: ${tgtInterp}`,
        '',
        'LIQUIDITY REQUIREMENTS',
        `Current DEX Liquidity: ${liq}`,
        'Required Liquidity: DATA UNAVAILABLE',
        '',
        'DEMAND REQUIREMENTS',
        `24h Volume: ${vol}`,
        `Buy/Sell Ratio: ${buySell}`,
        `Transactions: ${txns}`,
        'Required Organic Demand: DATA UNAVAILABLE',
        `Holder Distribution: ${holderDist}`,
        '',
        'SUPPLY / DILUTION REQUIREMENTS',
        `Current FDV: ${fdv}`,
        'Circulating Supply: DATA UNAVAILABLE',
        'Total Supply: DATA UNAVAILABLE',
        'Required Supply Change: DATA UNAVAILABLE',
        '',
        'SECURITY / TRUST REQUIREMENTS',
        `LP Lock Status: ${lpStatus}`,
        `Contract Permissions: ${contractPermissions}`,
        'Deployer / Admin Risk: DATA UNAVAILABLE',
        ''
      );
    }

    let mainFactor = verdictData?.mainFactor || currentSession?.synthesis?.mainFactor;
    let mainFactorReason = verdictData?.mainFactorReason || currentSession?.synthesis?.mainFactorReason;
    if (!mainFactor && isTokenCa) {
      const asksAboutFactor = /(?:main\s+(?:factor|obstacle|constraint|driver)|which\s+(?:factor|constraint|obstacle|change)|what\s+(?:factor|change|constraint|obstacle|measurable\s+change)|capital\s+inflow|organic\s+demand|circulating\s+supply|liquidity\s+depth|combination|greatest\s+(?:evidence-based\s+)?obstacle|sustain|speculative\s+volume)/i.test(fullQuestion);
      if (asksAboutFactor && isTargetBelow) {
        const asksSustain = /(?:sustain|hold|keep|relying|speculative|maintain|endure)/i.test(fullQuestion);
        if (asksSustain) {
          mainFactor = 'INSUFFICIENT EVIDENCE';
          mainFactorReason = 'The target is below the current market cap, so no additional growth is mathematically required. However, the available evidence is not enough to determine what would be needed to sustain the target.';
        } else {
          mainFactor = 'NOT APPLICABLE';
          mainFactorReason = 'The target is below the current market cap, so no additional growth is mathematically required.';
        }
      }
    }
    const mainFactorLines = [];
    if (mainFactor) {
      mainFactorLines.push(
        'MAIN FACTOR',
        mainFactor,
        '',
        'REASON',
        mainFactorReason || 'Available evidence does not show that one factor alone is sufficient.',
        ''
      );
    }

    const verdictTextParts = [
      'VERDICT RECORD',
      `SESSION ${sessionId}`,
      '',
      'QUESTION',
      displayQuestion,
      '',
      'OUTCOME',
      outcomeText,
      '',
      'VOTE',
      voteLines,
      ''
    ];

    if (fiveRequirementLines.length > 0) {
      verdictTextParts.push(...fiveRequirementLines);
    }

    if (mainFactorLines.length > 0) {
      verdictTextParts.push(...mainFactorLines);
    }

    verdictTextParts.push(
      'CONCLUSION',
      conciseConclusion,
      '',
      'STATUS',
      'Record closed and saved to the Verdict Ledger.'
    );

    const verdictText = verdictTextParts.join('\n');

    await streamTranscriptMsg({
      type: 'verdict-announcement',
      who: `VERDICT RECORD · SESSION ${sessionId}`,
      text: verdictText
    });

    if (currentSession && typeof BourseStorage !== 'undefined') {
      BourseStorage.saveSession(currentSession);
    }

    updateChamberState(STATES.COMPLETED);
    BourseUtils.showToast(`Session ${sessionId} recorded to Verdict Ledger.`);

    if (postActionsEl) postActionsEl.classList.add('active');
    if (conveneBtn) conveneBtn.disabled = false;
    if (composerInput) composerInput.disabled = false;
    if (viewVerdictBtn) {
      viewVerdictBtn.onclick = () => {
        if (window.BourseSPA) {
          window.BourseSPA.showVerdict(sessionId);
        } else {
          window.location.href = `/verdict?id=${sessionId}`;
        }
      };
    }
    return true;
  }

  async function streamLiveServerSession(query, targetSeats, isDirected, isCrossExam) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: query,
          directedSeats: isDirected ? targetSeats.map(s => s.seat) : [],
          isCrossExam
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok || !res.body) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        throw new Error('Response is not text/event-stream');
      }

      updateChamberState(STATES.ROUND_1);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let currentSpeakerMsg = null;
      let currentSpeakerBody = null;
      let currentSpeakerSeat = null;

      let addTally = 0;
      let reduceTally = 0;
      let passTally = 0;
      const recordedVotes = [];
      let pendingVerdict = null;
      let sessionCompletedSuccessfully = false;

      // Initialize session tracking collections
      if (currentSession) {
        currentSession.round1Analyses = new Map();
        currentSession.round2Complete = false;
        currentSession.votes = recordedVotes;
      }

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = 'message';
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.replace(/^event:\s*/, '').trim();
          } else if (trimmed.startsWith('data:')) {
            try {
              const data = JSON.parse(trimmed.replace(/^data:\s*/, '').trim());

              if (currentEvent === 'error') {
                updateChamberState(STATES.ERROR);
                BourseUtils.showToast(data.message || 'Session deliberation error', 'error');
                if (conveneBtn) conveneBtn.disabled = false;
                if (composerInput) composerInput.disabled = false;
                return false;
              } else if (currentEvent === 'motion') {
                if (data.llmProvider && stateLabelEl) {
                  BourseUtils.showToast(`Live AI Engine active: ${data.llmProvider}`);
                }
                if (data.questionType === 'TOKEN_CA' && scoreboardEl) {
                  const badges = scoreboardEl.querySelectorAll('.badge');
                  if (badges[0]) badges[0].textContent = 'SUPPORTED';
                  if (badges[1]) badges[1].textContent = 'NOT SUPPORTED';
                  if (badges[2]) badges[2].textContent = 'INSUFFICIENT';
                }
              } else if (currentEvent === 'evidence') {
                if (data.metrics && Array.isArray(data.metrics) && evidencePanelEl) {
                  evidencePanelEl.classList.add('active');
                  const isTokenCa = Boolean(data.targetMarketCap || data.requiredMultiple);
                  const metricsHtml = data.metrics.map(m => `
                    <div class="evidence-item">
                      <span>${m.label}</span>
                      <b>${m.value}</b>
                    </div>
                  `).join('');
                  evidencePanelEl.innerHTML = `
                    <div class="evidence-header">
                      <span>EVIDENCE PACK · ${isTokenCa ? 'TOKEN_CA ANALYSIS' : (currentSession?.ticker || 'MARKET SNAPSHOT')}</span>
                      <span class="badge">${data.sources ? data.sources[0] : 'LIVE DEX ORACLE'}</span>
                    </div>
                    <div class="evidence-grid">
                      ${metricsHtml}
                    </div>
                    <div class="evidence-context">
                      <strong>Gaps & Verification:</strong> ${(data.gaps || []).join('; ') || 'Verified on-chain evidence pack.'}
                    </div>
                  `;
                }
              } else if (currentEvent === 'seat_start') {
                currentSpeakerSeat = data.seatId || data.seat;
                setSeatState(currentSpeakerSeat, 'speaking', 'SPEAKING');
                const agent = getChamberCouncil().getAgentBySeat(currentSpeakerSeat);
                const whoLabel = agent ? `${agent.name.toUpperCase()} (SEAT 0${agent.seat} · ${agent.school})` : (data.name || `SEAT 0${currentSpeakerSeat}`).toUpperCase();
                currentSpeakerMsg = createLiveTranscriptMsg('analysis', whoLabel);
                currentSpeakerBody = currentSpeakerMsg ? currentSpeakerMsg.querySelector('.msg-body') : null;
              } else if (currentEvent === 'seat_token' || currentEvent === 'token') {
                if (currentSpeakerBody) {
                  currentSpeakerBody.textContent += (data.text || data.chunk || '');
                  feedEl.scrollTop = feedEl.scrollHeight;
                }
              } else if (currentEvent === 'seat_end' || currentEvent === 'seat_analysis') {
                const sNum = currentSpeakerSeat || data.seatId || data.seat;
                if (sNum) {
                  setSeatState(sNum, '', 'READ FILED');
                  const finalAnalysis = (data.analysis || data.text || (currentSpeakerBody ? currentSpeakerBody.textContent : '')).trim();
                  if (currentSpeakerBody && !currentSpeakerBody.textContent.trim()) {
                    currentSpeakerBody.textContent = finalAnalysis;
                  }
                  if (currentSession && finalAnalysis.length > 0) {
                    if (currentSession.round1Analyses) {
                      currentSession.round1Analyses.set(sNum, data);
                    }
                    if (currentSession.transcript) {
                      currentSession.transcript.push({
                        type: 'analysis',
                        who: currentSpeakerMsg ? currentSpeakerMsg.querySelector('.msg-meta span').textContent : `SEAT 0${sNum}`,
                        time: BourseUtils.formatTimestamp(new Date()),
                        text: finalAnalysis
                      });
                      currentSession.speakingTurns = currentSession.transcript.length;
                    }
                  }
                }
                currentSpeakerSeat = null;
                currentSpeakerMsg = null;
                currentSpeakerBody = null;
              } else if (currentEvent === 'rebuttal') {
                updateChamberState(STATES.ROUND_2);
                if (currentSession) currentSession.round2Complete = true;

                const sA = data.seatId || data.seatA;
                const sB = data.targetSeatId || data.seatB;
                const agA = getChamberCouncil().getAgentBySeat(sA);
                const agB = getChamberCouncil().getAgentBySeat(sB);

                drawDuelBeam(sA, sB);
                setSeatState(sA, 'challenging', 'CHALLENGING');
                await streamTranscriptMsg({
                  type: 'challenge',
                  who: `${(agA?.name || 'SEAT 0' + sA).toUpperCase()} (CHALLENGE TO SEAT 0${sB})`,
                  text: data.challenge
                });
                if (currentSession && currentSession.transcript) {
                  currentSession.transcript.push({
                    type: 'challenge',
                    who: `${agA?.name || 'SEAT 0' + sA} (CHALLENGE)`,
                    time: BourseUtils.formatTimestamp(new Date()),
                    text: data.challenge
                  });
                }
                await chamberWait(300);

                setSeatState(sA, '', 'WAITING');
                setSeatState(sB, 'challenging', 'RESPONDING');
                await streamTranscriptMsg({
                  type: 'response',
                  who: `${(agB?.name || 'SEAT 0' + sB).toUpperCase()} (RESPONSE TO SEAT 0${sA})`,
                  text: data.response
                });
                if (currentSession && currentSession.transcript) {
                  currentSession.transcript.push({
                    type: 'response',
                    who: `${agB?.name || 'SEAT 0' + sB} (RESPONSE)`,
                    time: BourseUtils.formatTimestamp(new Date()),
                    text: data.response
                  });
                }
                clearDuelBeam();
                setSeatState(sB, '', 'WAITING');
              } else if (currentEvent === 'vote' || currentEvent === 'vote_cast') {
                updateChamberState(STATES.ROUND_3);
                if (scoreboardEl) scoreboardEl.classList.add('active');

                const seatNum = data.seatId || data.seat;
                const vUpper = ((data.vote || '').toUpperCase()).trim();

                // Deduplicate votes by seat number to prevent double counting
                if (!recordedVotes.some(v => v.seat === seatNum)) {
                  const isTokenCa = ['SUPPORTED', 'NOT_SUPPORTED', 'INSUFFICIENT_EVIDENCE'].includes(vUpper);
                  const isStandard = ['ADD', 'REDUCE', 'PASS'].includes(vUpper);

                  if (isTokenCa || isStandard) {
                    if (vUpper === 'ADD' || vUpper === 'SUPPORTED') {
                      addTally++;
                      animateCounter(tallyAddEl, addTally);
                    } else if (vUpper === 'REDUCE' || vUpper === 'NOT_SUPPORTED') {
                      reduceTally++;
                      animateCounter(tallyReduceEl, reduceTally);
                    } else {
                      passTally++;
                      animateCounter(tallyPassEl, passTally);
                    }

                    recordedVotes.push({
                      seat: seatNum,
                      name: data.name || data.persona,
                      persona: data.persona || data.name,
                      shortName: data.shortName || data.name,
                      vote: vUpper,
                      reason: data.reason || data.rationale,
                      rationale: data.rationale || data.reason
                    });

                    appendTranscriptMsg({
                      type: 'vote-call',
                      who: `BALLOT · ${(data.name || data.persona).toUpperCase()}`,
                      text: `Casts: [${vUpper}] — ${data.reason || data.rationale}`
                    });
                    const statusClass = vUpper.toLowerCase().replace(/_/g, '-');
                    setSeatState(seatNum, `voted voted-${statusClass}`, vUpper);
                  }
                }
              } else if (currentEvent === 'synthesis') {
                if (currentSession) currentSession.synthesis = data;
                const evidenceList = Array.isArray(data.keyEvidence) && data.keyEvidence.length > 0
                  ? `\n\nKey Evidence:\n${data.keyEvidence.map(e => `- ${e}`).join('\n')}`
                  : '';
                const agreement = data.areasOfAgreement || (pendingVerdict?.outcome === 'DIVIDED' ? 'No clear consensus.' : '');
                appendTranscriptMsg({
                  type: 'final-synthesis',
                  who: 'CHAMBER CHAIR · FINAL SYNTHESIS',
                  text: `FINAL CHAMBER SYNTHESIS\n\nQuestion:\n"${data.question || ''}"${evidenceList}\n\nKey Findings:\n${(data.keyFindings || []).map(f => `- ${f}`).join('\n')}\n\nAreas of Agreement:\n${agreement}\n\nAreas of Disagreement:\n${data.areasOfDisagreement || ''}\n\nUnresolved Issues:\n${data.unresolvedIssues || ''}\n\nConclusion:\n${data.conclusion || ''}`
                });
              } else if (currentEvent === 'verdict') {
                updateChamberState(STATES.AGGREGATING);
                pendingVerdict = data;
                if (data.synthesis && currentSession) currentSession.synthesis = data.synthesis;
                if (currentSession) currentSession.votes = recordedVotes;
              } else if (currentEvent === 'done' || currentEvent === 'complete') {
                if (sessionCompletedSuccessfully) return;
                if (currentSession) currentSession.votes = recordedVotes;
                const dbSaved = Boolean(data.savedToDb || data.completed);

                if (canCompleteSession(currentSession, pendingVerdict, dbSaved)) {
                  const outcome = pendingVerdict.outcome ?? pendingVerdict.decision;
                  const majorityCount = pendingVerdict.majorityCount || (
                    (outcome === 'ADD' || outcome === 'SUPPORTED') ? addTally :
                    ((outcome === 'REDUCE' || outcome === 'NOT_SUPPORTED') ? reduceTally : passTally)
                  );
                  const ok = await finalizeSessionVerdict(outcome, majorityCount, addTally, reduceTally, passTally, pendingVerdict, true);
                  if (ok) sessionCompletedSuccessfully = true;
                } else {
                  console.error('[Session Incomplete]: canCompleteSession returned false.');
                  updateChamberState(STATES.ERROR);
                  appendTranscriptMsg({
                    type: 'chair',
                    who: 'SYSTEM AUDIT',
                    text: `SESSION INCOMPLETE: Deliberation aborted. Requirements not satisfied (Analyses: ${currentSession?.round1Analyses?.size || 0}/${targetSeats.length}, Votes: ${recordedVotes.length}/${targetSeats.length}). Verdict cannot be certified.`
                  });
                  return false;
                }
              }
            } catch (_) {}
          }
        }
      }

      // If stream ended without receiving 'done' event, verify and finalize if valid
      if (!sessionCompletedSuccessfully) {
        if (currentSession) currentSession.votes = recordedVotes;
        if (canCompleteSession(currentSession, pendingVerdict, true)) {
          const outcome = pendingVerdict.outcome ?? pendingVerdict.decision;
          const majorityCount = pendingVerdict.majorityCount || (
            (outcome === 'ADD' || outcome === 'SUPPORTED') ? addTally :
            ((outcome === 'REDUCE' || outcome === 'NOT_SUPPORTED') ? reduceTally : passTally)
          );
          const ok = await finalizeSessionVerdict(outcome, majorityCount, addTally, reduceTally, passTally, pendingVerdict, true);
          if (ok) sessionCompletedSuccessfully = true;
        } else {
          updateChamberState(STATES.ERROR);
          appendTranscriptMsg({
            type: 'chair',
            who: 'SYSTEM AUDIT',
            text: `SESSION INCOMPLETE: Deliberation stream ended without satisfying all completion criteria. Verdict cannot be certified.`
          });
          return false;
        }
      }

      return true;
    } catch (err) {
      console.warn('Live AI server streaming unreached:', err.message);
      updateChamberState(STATES.ERROR);
      BourseUtils.showToast(`Deliberation error: ${err.message}`, 'error');
      if (conveneBtn) conveneBtn.disabled = false;
      if (composerInput) composerInput.disabled = false;
      return false;
    }
  }

  function triggerVerdictImpact(outcome) {
    const arena = document.getElementById('council-arena');
    if (arena) {
      arena.classList.remove('arena-quake');
      void arena.offsetWidth;
      arena.classList.add('arena-quake');
      setTimeout(() => arena.classList.remove('arena-quake'), 500);
    }

    const stage = document.querySelector('.chamber-stage');
    if (stage) {
      const existing = document.querySelector('.verdict-stamp-overlay');
      if (existing) existing.remove();

      const stamp = document.createElement('div');
      stamp.className = 'verdict-stamp-overlay';
      stamp.innerHTML = `
        <div class="verdict-stamp-ring"></div>
        <div class="verdict-stamp-box">
          ${outcome}
          <span>BENCH RECORD CERTIFIED</span>
        </div>
      `;
      stage.appendChild(stamp);

      setTimeout(() => {
        stamp.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        stamp.style.opacity = '0';
        stamp.style.transform = 'translate(-50%, -50%) scale(1.08)';
        setTimeout(() => stamp.remove(), 600);
      }, 2300);
    }
  }

  function showTypingIndicator(who) {
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.id = 'active-typing-indicator';
    typing.innerHTML = `<span>${who} is drafting</span><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
    feedEl.appendChild(typing);
    feedEl.scrollTop = feedEl.scrollHeight;
    return typing;
  }

  function removeTypingIndicator() {
    const typing = document.getElementById('active-typing-indicator');
    if (typing) typing.remove();
  }

  async function chamberWait(ms) {
    let elapsed = 0;
    const interval = 50;
    const target = ms / simulationSpeed;
    while (elapsed < target) {
      if (!isPaused) {
        elapsed += interval;
      }
      await BourseUtils.sleep(interval);
    }
  }

  /**
   * Main Convene Function with Budget Consumption & Directed Routing
   */
  async function conveneSession(userInput) {
    if (selectedSeats.size === 0) {
      BourseUtils.showToast('Select at least one seat to convene.');
      if (conveneBtn) {
        conveneBtn.disabled = true;
        conveneBtn.textContent = 'Select at least one seat to convene';
      }
      return;
    }

    const query = (userInput || (composerInput ? composerInput.value : '')).trim();
    if (!query) {
      if (composerInput) {
        composerInput.focus();
        composerInput.style.borderColor = '#FFFFFF';
        composerInput.style.boxShadow = '0 0 12px rgba(255, 255, 255, 0.6)';
        composerInput.setAttribute('placeholder', 'Enter ticker or thesis (e.g. SOL, BTC, ETH) or select an example below...');
        setTimeout(() => {
          if (composerInput) {
            composerInput.style.borderColor = '';
            composerInput.style.boxShadow = '';
          }
        }, 1500);
      }
      BourseUtils.showToast('Please enter an asset or thesis to examine (e.g. SOL, BTC) or select an example below.');
      return;
    }

    const requiredCredits = getRequiredCredits();
    if (typeof BourseBudget !== 'undefined') {
      const remaining = BourseBudget.getRemaining();
      if (remaining < requiredCredits) {
        BourseBudget.reset();
        if (typeof BourseUtils !== 'undefined') {
          BourseUtils.showToast('Daily budget auto-replenished (+13 credits). Convening the bench...');
        }
      }
      BourseBudget.consume(requiredCredits);
    }

    // Lock UI
    if (conveneBtn) conveneBtn.disabled = true;
    if (composerInput) composerInput.disabled = true;
    if (postActionsEl) postActionsEl.classList.remove('active');
    if (scoreboardEl) {
      scoreboardEl.classList.remove('active');
      const badges = scoreboardEl.querySelectorAll('.badge');
      if (badges[0]) badges[0].textContent = 'ADD';
      if (badges[1]) badges[1].textContent = 'REDUCE';
      if (badges[2]) badges[2].textContent = 'PASS';
    }
    if (tallyAddEl) tallyAddEl.textContent = '0';
    if (tallyReduceEl) tallyReduceEl.textContent = '0';
    if (tallyPassEl) tallyPassEl.textContent = '0';

    feedEl.innerHTML = '';
    liveSeatStates = {};
    resetAllSeatStates('WAITING');

    const sessionId = BourseUtils.generateSessionId();
    if (sessionIdEl) sessionIdEl.textContent = sessionId;

    const isDirected = true;
    const targetSeats = Array.from(selectedSeats).map(s => getChamberCouncil().getAgentBySeat(s));

    currentSession = {
      id: sessionId,
      question: query,
      createdAt: new Date().toISOString(),
      closedAt: null,
      evidence: null,
      speakingTurns: 0,
      seatsPresent: `${targetSeats.length} / ${targetSeats.length}`,
      totalParticipants: targetSeats.length,
      directedMode: targetSeats.length === 2 && isCrossExamMode ? 'cross_exam' : (targetSeats.length < 9 ? 'directed' : 'full_bench'),
      directedSeats: targetSeats.map(s => s.seat),
      votes: [],
      verdict: null,
      transcript: []
    };

    try {
      // 1. FILING
      updateChamberState(STATES.FILING);

      appendTranscriptMsg({
        type: 'chair',
        who: 'CHAIR',
        text: `Session ${sessionId} filed. The floor takes up: "${query}". Convening ${targetSeats.length === 9 ? 'the full bench (Seats 01 through 09)' : `selected seats: ${targetSeats.map(s => s.shortName).join(', ')}`}.`
      });
      await chamberWait(700);

      // 2. PREPARING EVIDENCE (Always free)
      updateChamberState(STATES.PREPARING_EVIDENCE);
      appendTranscriptMsg({
        type: 'chair',
        who: 'CHAIR',
        text: `Retrieving evidentiary market pack for "${query}". Baseline metrics locking.`
      });

      currentEvidence = await BourseMockData.getMarketData(query);
      currentSession.ticker = currentEvidence.ticker;
      currentSession.assetName = currentEvidence.name;
      currentSession.evidence = currentEvidence;

      renderEvidencePack(currentEvidence);
      await chamberWait(800);

      appendTranscriptMsg({
        type: 'chair',
        who: 'CHAIR',
        text: `Evidentiary snapshot distributed simultaneously. Independent reasoning initiated.`
      });
      await chamberWait(500);

      // Dim non-selected seats
      getChamberCouncil().AGENTS.forEach(a => {
        const isTarget = targetSeats.some(t => t.seat === a.seat);
        if (isTarget) {
          setSeatState(a.seat, 'analyzing', 'ANALYZING');
        } else {
          setSeatState(a.seat, 'unselected-dim', 'NOT PARTICIPATING');
        }
      });

      // Check if Live AI Streaming is active
      const aiMode = (typeof localStorage !== 'undefined' && localStorage.getItem('bourse_ai_mode')) || 'live';
      let didLiveStream = false;

      if (aiMode === 'live') {
        didLiveStream = await streamLiveServerSession(query, targetSeats, isDirected, isCrossExamMode);
        if (!didLiveStream) {
          console.warn('[Chamber]: Live AI deliberation halted on error.');
          updateChamberState(STATES.ERROR);
          return;
        }
      } else {
        // Explicit Simulator Mode (Offline Cognitive Simulation)
        updateChamberState(STATES.ROUND_1);

        if (isCrossExamMode && targetSeats.length === 2) {
          // DIRECTED CROSS-EXAMINATION MODE (2 seats, 2 rounds)
          const seatA = targetSeats[0];
          const seatB = targetSeats[1];

          drawDuelBeam(seatA.seat, seatB.seat);
          setSeatState(seatA.seat, 'challenging', 'CHALLENGING');
          showTypingIndicator(seatA.name);
          await chamberWait(1000);
          removeTypingIndicator();
          setSeatState(seatA.seat, 'speaking', 'SPEAKING');
          const challengeA = seatA.generateChallenge(seatB, query);
          await streamTranscriptMsg({
            type: 'challenge',
            who: `${seatA.name.toUpperCase()} (CHALLENGE TO SEAT 0${seatB.seat})`,
            text: challengeA
          });

          await chamberWait(700);
          setSeatState(seatA.seat, '', 'WAITING');
          setSeatState(seatB.seat, 'challenging', 'RESPONDING');
          showTypingIndicator(seatB.name);
          await chamberWait(1100);
          removeTypingIndicator();
          setSeatState(seatB.seat, 'speaking', 'SPEAKING');
          const respB = seatB.generateResponse(seatA, query);
          await streamTranscriptMsg({
            type: 'response',
            who: `${seatB.name.toUpperCase()} (RESPONSE TO SEAT 0${seatA.seat})`,
            text: respB
          });
          clearDuelBeam();
          setSeatState(seatB.seat, '', 'WAITING');

        } else {
          // STANDARD READINGS (Participating seats only)
          for (const agent of targetSeats) {
            setSeatState(agent.seat, 'analyzing', 'ANALYZING');
            showTypingIndicator(agent.name);
            await chamberWait(800 + Math.random() * 400);
            removeTypingIndicator();

            setSeatState(agent.seat, 'speaking', 'SPEAKING');
            const read = agent.generateAnalysis(
              { ticker: currentEvidence.ticker, name: currentEvidence.name },
              currentEvidence,
              query
            );
            liveSeatStates[agent.seat] = read;

            await streamTranscriptMsg({
              type: 'analysis',
              who: `${agent.name.toUpperCase()} (SEAT 0${agent.seat} · ${agent.school})`,
              text: read.argument
            });

            setSeatState(agent.seat, '', 'READ FILED');
            await chamberWait(350);
          }

          // Cross-examination only if >= 2 seats selected
          if (targetSeats.length > 1) {
            updateChamberState(STATES.ROUND_2);
            if (currentSession) currentSession.round2Complete = true;

            const seatA = targetSeats[0];
            const seatB = targetSeats[1];

            appendTranscriptMsg({
              type: 'chair',
              who: 'CHAIR',
              text: `Round 1 readings complete. Opening cross-examination between Seat 0${seatA.seat} (${seatA.name}) and Seat 0${seatB.seat} (${seatB.name}).`
            });
            await chamberWait(900);

            drawDuelBeam(seatA.seat, seatB.seat);
            setSeatState(seatA.seat, 'challenging', 'CHALLENGING');
            showTypingIndicator(seatA.name);
            await chamberWait(1000);
            removeTypingIndicator();
            setSeatState(seatA.seat, 'speaking', 'SPEAKING');
            const challengeText = seatA.generateChallenge(seatB, query);
            await streamTranscriptMsg({
              type: 'challenge',
              who: `${seatA.name.toUpperCase()} (CHALLENGE TO SEAT 0${seatB.seat})`,
              text: challengeText
            });

            await chamberWait(700);
            setSeatState(seatA.seat, '', 'WAITING');
            setSeatState(seatB.seat, 'challenging', 'RESPONDING');
            showTypingIndicator(seatB.name);
            await chamberWait(1100);
            removeTypingIndicator();
            setSeatState(seatB.seat, 'speaking', 'SPEAKING');
            const responseText = seatB.generateResponse(seatA, query);
            await streamTranscriptMsg({
              type: 'response',
              who: `${seatB.name.toUpperCase()} (RESPONSE TO SEAT 0${seatA.seat})`,
              text: responseText
            });
            clearDuelBeam();
            setSeatState(seatB.seat, '', 'WAITING');
            await chamberWait(700);
          } else {
            // 1 seat selected: Skip cross-examination
            if (currentSession) currentSession.round2Complete = true;
          }
        }

        // 4. ROUND 3 — VOTING (Participating seats only)
        updateChamberState(STATES.ROUND_3);
        resetAllSeatStates('WAITING');
        if (scoreboardEl) scoreboardEl.classList.add('active');

        appendTranscriptMsg({
          type: 'chair',
          who: 'CHAIR',
          text: `The floor is closed for debate. ${targetSeats.length === 1 ? `Seat 0${targetSeats[0].seat} (${targetSeats[0].shortName}) will now cast a binding ballot` : `The ${targetSeats.length} participating seats will now cast recorded ballots`} on the motion: ADD, REDUCE, or PASS.`
        });
        await chamberWait(800);

        let addTally = 0;
        let reduceTally = 0;
        let passTally = 0;
        const recordedVotes = [];

        for (const agent of targetSeats) {
          setSeatState(agent.seat, 'speaking', 'VOTING');
          await chamberWait(350);

          const voteResult = agent.generateVote(
            { ticker: currentEvidence.ticker, name: currentEvidence.name },
            currentEvidence,
            query
          );

          if (voteResult.vote === 'ADD') {
            addTally++;
            animateCounter(tallyAddEl, addTally);
          } else if (voteResult.vote === 'REDUCE') {
            reduceTally++;
            animateCounter(tallyReduceEl, reduceTally);
          } else {
            passTally++;
            animateCounter(tallyPassEl, passTally);
          }

          recordedVotes.push({
            seat: agent.seat,
            name: agent.name,
            school: agent.school,
            discipline: agent.discipline,
            vote: voteResult.vote,
            reason: voteResult.rationale,
            rationale: voteResult.rationale
          });

          appendTranscriptMsg({
            type: 'vote-call',
            who: `BALLOT · ${agent.name.toUpperCase()}`,
            text: `Casts: [${voteResult.vote}] — ${voteResult.rationale}`
          });

          setSeatState(agent.seat, 'voted', voteResult.vote);
          await chamberWait(200);
        }

        currentSession.votes = recordedVotes;
        await chamberWait(700);

        // Dynamic Majority & Outcomes with ties
        const totalVotes = targetSeats.length;
        const majorityThreshold = Math.floor(totalVotes / 2) + 1;
        let outcome = 'PASS';
        let majorityCount = passTally;
        let majority = false;
        let tie = false;

        const maxCount = Math.max(addTally, reduceTally, passTally);
        const topCountOccurrences = [addTally, reduceTally, passTally].filter(c => c === maxCount).length;

        if (addTally >= majorityThreshold) {
          outcome = 'ADD';
          majorityCount = addTally;
          majority = true;
        } else if (reduceTally >= majorityThreshold) {
          outcome = 'REDUCE';
          majorityCount = reduceTally;
          majority = true;
        } else if (passTally >= majorityThreshold) {
          outcome = 'PASS';
          majorityCount = passTally;
          majority = true;
        } else if (topCountOccurrences > 1) {
          outcome = 'DIVIDED';
          majorityCount = 0;
          tie = true;
          majority = false;
        } else if (addTally === maxCount) {
          outcome = 'ADD';
          majorityCount = addTally;
        } else if (reduceTally === maxCount) {
          outcome = 'REDUCE';
          majorityCount = reduceTally;
        } else {
          outcome = 'PASS';
          majorityCount = passTally;
        }

        const majorityRatio = outcome === 'DIVIDED' ? 'NO MAJORITY' : `${majorityCount} / ${totalVotes}`;

        // Synthesis from participating seats
        const personaNames = targetSeats.map(a => a.name).join(', ');
        const isUnanimous = recordedVotes.every(v => v.vote === recordedVotes[0]?.vote);
        const keyFindings = targetSeats.map(a => `${a.shortName}: Deliberated via ${a.discipline} constraint.`);
        const areasOfAgreement = outcome === 'DIVIDED'
          ? 'No clear consensus.'
          : (isUnanimous
            ? `The participating seats (${personaNames}) aligned unanimously in their ${recordedVotes[0]?.vote} ballot.`
            : `The participating seats (${personaNames}) concurred that core liquidity and execution security remain paramount.`);
        const areasOfDisagreement = isUnanimous
          ? `Disagreement was minimal; minor divergence centered on execution timeline.`
          : `The bench divided between ${recordedVotes.map(v => `${v.name} (${v.vote})`).join(', ')}, reflecting divergent thresholds.`;
        const unresolvedIssues = `Whether protocol evolution will satisfy the requirements raised by ${targetSeats.map(a => a.shortName).join(' and ')}.`;
        const outcomeLabel = outcome === 'DIVIDED' ? 'DIVIDED — NO MAJORITY' : `${outcome} (${majorityRatio})`;
        const conclusion = `Based strictly on the deliberations of ${personaNames}, the chamber registers ${targetSeats.length > 1 ? `a floor outcome of ${outcomeLabel}` : `Seat 0${targetSeats[0].seat}'s ${outcome} ballot`} on the question.`;

        const synthesis = {
          question: query,
          keyFindings: keyFindings.slice(0, 4),
          areasOfAgreement,
          areasOfDisagreement,
          unresolvedIssues,
          conclusion
        };
        currentSession.synthesis = synthesis;

        appendTranscriptMsg({
          type: 'final-synthesis',
          who: 'CHAMBER CHAIR · FINAL SYNTHESIS',
          text: `FINAL CHAMBER SYNTHESIS\n\nQuestion:\n"${synthesis.question}"\n\nKey Findings:\n${synthesis.keyFindings.map(f => `- ${f}`).join('\n')}\n\nAreas of Agreement:\n${synthesis.areasOfAgreement}\n\nAreas of Disagreement:\n${synthesis.areasOfDisagreement}\n\nUnresolved Issues:\n${synthesis.unresolvedIssues}\n\nConclusion:\n${synthesis.conclusion}`
        });

        const isSizing = asksForInvestmentSizing(query);
        const verdictData = {
          outcome,
          majorityCount,
          majorityRatio,
          totalParticipants: totalVotes,
          isSizingRequested: isSizing,
          synthesis
        };

        await finalizeSessionVerdict(outcome, majorityCount, addTally, reduceTally, passTally, verdictData, true);
      }
      if (shareVerdictBtn) {
        shareVerdictBtn.onclick = async () => {
          const shareUrl = `${window.location.origin}/verdict?id=${sessionId}`;
          const ok = await BourseUtils.copyToClipboard(shareUrl);
          if (ok) {
            BourseUtils.showToast('Permanent verdict link copied to clipboard!');
          }
        };
      }

    } catch (err) {
      console.error('Chamber execution error:', err);
      updateChamberState(STATES.ERROR);
      appendTranscriptMsg({
        type: 'chair',
        who: 'SYSTEM NOTICE',
        text: `Session interrupted: ${err.message}. Your answer budget has been preserved.`
      });
      if (typeof BourseBudget !== 'undefined') {
        BourseBudget.refund(requiredCredits);
      }
    } finally {
      if (conveneBtn) conveneBtn.disabled = false;
      if (composerInput) composerInput.disabled = false;
      updateComposerMode();
    }
  }

  function renderEvidencePack(evidence) {
    if (!evidencePanelEl) return;
    evidencePanelEl.classList.add('active');
    evidencePanelEl.innerHTML = `
      <div class="evidence-header">
        <span>EVIDENCE PACK · ${evidence.ticker} (${evidence.name})</span>
        <span class="badge">${evidence.source ? evidence.source.toUpperCase() : (evidence.isMock ? 'HISTORICAL SNAPSHOT' : 'COINGECKO LIVE FEED')}</span>
      </div>
      <div class="evidence-grid">
        <div class="evidence-item">
          <span>Price</span>
          <b>${evidence.priceFormatted}</b>
        </div>
        <div class="evidence-item">
          <span>24h Change</span>
          <b style="color:${evidence.change24h >= 0 ? '#FFFFFF' : '#999999'}">${evidence.change24h >= 0 ? '+' : ''}${evidence.change24h}%</b>
        </div>
        <div class="evidence-item">
          <span>Market Cap</span>
          <b>${evidence.marketCapFormatted}</b>
        </div>
        <div class="evidence-item">
          <span>24h Volume</span>
          <b>${evidence.volume24hFormatted}</b>
        </div>
        <div class="evidence-item">
          <span>Network Activity</span>
          <b>${evidence.networkActivity ? evidence.networkActivity.substring(0, 24) + '...' : 'Active'}</b>
        </div>
        <div class="evidence-item">
          <span>Data Retrieved</span>
          <b>${evidence.retrievalDate}</b>
        </div>
      </div>
      <div class="evidence-context">
        <strong>Macro Context & Data Gaps:</strong> ${evidence.macroContext}
      </div>
    `;
  }

  function setupComposer() {
    if (conveneBtn) {
      conveneBtn.addEventListener('click', () => {
        conveneSession();
      });
    }

    if (composerInput) {
      composerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          conveneSession();
        }
      });

      // F14: Support @mention in composer input (e.g. typing @satoshi selects Satoshi)
      composerInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const matches = val.match(/@([a-zA-Z]+)/g);
        if (matches) {
          matches.forEach(m => {
            const name = m.substring(1).toLowerCase();
            const council = getChamberCouncil();
            const found = (council && typeof council.getAgentByName === 'function')
              ? council.getAgentByName(name)
              : BourseAgents.getAgentByName(name);
            if (found && !selectedSeats.has(found.seat)) {
              selectedSeats.add(found.seat);
              updateChamberSeatVisuals();
              updateComposerMode();
            }
          });
        }
      });
    }

    if (clearSelectionBtn) {
      clearSelectionBtn.addEventListener('click', clearSeatSelection);
    }

    if (crossExamToggleBtn) {
      crossExamToggleBtn.addEventListener('click', () => {
        if (selectedSeats.size === 2) {
          isCrossExamMode = !isCrossExamMode;
          updateComposerMode();
        }
      });
    }

    // Hint Chips
    const hintChips = typeof document.querySelectorAll === 'function' ? document.querySelectorAll('.hint-chip') : [];
    hintChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-thesis') || chip.textContent.trim();
        if (composerInput) {
          composerInput.value = text;
          composerInput.focus();
        }
      });
    });

    if (resetChamberBtn) {
      resetChamberBtn.addEventListener('click', () => {
        clearSeatSelection();
        if (composerInput) composerInput.value = '';
        if (postActionsEl) postActionsEl.classList.remove('active');
        if (scoreboardEl) {
          scoreboardEl.classList.remove('active');
          const badges = scoreboardEl.querySelectorAll('.badge');
          if (badges[0]) badges[0].textContent = 'ADD';
          if (badges[1]) badges[1].textContent = 'REDUCE';
          if (badges[2]) badges[2].textContent = 'PASS';
        }
        if (tallyAddEl) tallyAddEl.textContent = '0';
        if (tallyReduceEl) tallyReduceEl.textContent = '0';
        if (tallyPassEl) tallyPassEl.textContent = '0';
        if (evidencePanelEl) {
          evidencePanelEl.classList.remove('active');
          evidencePanelEl.innerHTML = `
            <div class="evidence-header">
              <span>EVIDENCE PACK: SUBMIT A THESIS TO LOAD A SNAPSHOT</span>
              <span class="badge">MARKET EVIDENCE FEED</span>
            </div>
          `;
        }
        feedEl.innerHTML = `
          <div class="transcript-msg chair">
            <div class="msg-meta">
              <span>CHAIR</span>
              <span class="msg-time">--:--</span>
            </div>
            <div class="msg-body">Chamber floor is clear. Present a ticker or investment thesis below to convene the bench.</div>
          </div>
        `;
        resetAllSeatStates('WAITING');
        updateChamberState(STATES.IDLE);
        if (sessionIdEl) sessionIdEl.textContent = '—';
        updateComposerMode();
      });
    }

    if (viewVerdictBtn) {
      viewVerdictBtn.addEventListener('click', () => {
        if (currentSession && currentSession.id) {
          window.location.href = `/verdict?id=${encodeURIComponent(currentSession.id)}`;
        }
      });
    }

    if (shareVerdictBtn) {
      shareVerdictBtn.addEventListener('click', async () => {
        if (currentSession && currentSession.id) {
          const url = `${window.location.origin}/verdict?id=${encodeURIComponent(currentSession.id)}`;
          const success = (typeof BourseUtils !== 'undefined' && BourseUtils.copyToClipboard)
            ? await BourseUtils.copyToClipboard(url)
            : false;
          if (success) {
            BourseUtils.showToast('Verdict link copied to clipboard!');
            const prevText = shareVerdictBtn.textContent;
            shareVerdictBtn.textContent = 'Link Copied!';
            setTimeout(() => {
              shareVerdictBtn.textContent = prevText;
            }, 2000);
          }
        }
      });
    }
  }

  function setupTranscriptControls() {
    const pauseBtn = document.getElementById('pause-transcript-btn');
    const speedBtn = document.getElementById('speed-transcript-btn');

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
        pauseBtn.style.color = isPaused ? '#FFFFFF' : '';
      });
    }

    if (speedBtn) {
      speedBtn.addEventListener('click', () => {
        if (simulationSpeed === 1.0) {
          simulationSpeed = 2.0;
          speedBtn.textContent = 'Speed: 2x';
        } else if (simulationSpeed === 2.0) {
          simulationSpeed = 4.0;
          speedBtn.textContent = 'Speed: 4x';
        } else {
          simulationSpeed = 1.0;
          speedBtn.textContent = 'Speed: 1x';
        }
      });
    }
  }

  return {
    init,
    conveneSession,
    toggleSeatSelection,
    clearSeatSelection
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  BourseChamber.init();
});
