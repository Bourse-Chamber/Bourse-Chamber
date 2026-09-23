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
      if (selectedSeats.size >= 8) {
        BourseUtils.showToast('Select 8 seats maximum, or use Full Bench for all 9.');
        return;
      }
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
      if (!seatEl) return;

      const isSelected = selectedSeats.has(agent.seat);
      seatEl.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

      if (isSelected) {
        seatEl.classList.add('selected');
        seatEl.classList.remove('unselected-dim');
      } else {
        seatEl.classList.remove('selected');
        if (selectedSeats.size > 0 && currentState !== STATES.IDLE) {
          seatEl.classList.add('unselected-dim');
        } else {
          seatEl.classList.remove('unselected-dim');
        }
      }
    });
  }

  /**
   * Calculate required budget & update composer UI (F13 & F14)
   */
  function getRequiredCredits() {
    if (selectedSeats.size === 0) {
      return 9; // Full bench motion = 9 credits
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
        label = `Ask the full bench (${required})`;
        if (composerModeLabelEl) composerModeLabelEl.textContent = "What should the bench examine?";
      } else if (isCrossExamMode && count === 2) {
        const arr = Array.from(selectedSeats).map(s => getChamberCouncil().getAgentBySeat(s).shortName);
        label = `Cross-examine: ${arr.join(' vs ')} (4)`;
        if (composerModeLabelEl) composerModeLabelEl.textContent = `Cross-examination on the floor`;
      } else {
        const arr = Array.from(selectedSeats).map(s => getChamberCouncil().getAgentBySeat(s).shortName);
        label = `Ask ${arr.join(', ')} (${required})`;
        if (composerModeLabelEl) composerModeLabelEl.textContent = `Directed question to ${arr.join(', ')}`;
      }
      conveneBtn.textContent = label;

      // Budget Validation
      const warningEl = document.getElementById('budget-warning-text');
      conveneBtn.disabled = false; // Always keep convene button interactive
      if (remaining < required) {
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

  function appendTranscriptMsg({ type, who, text, time = null }) {
    if (!feedEl) return null;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn(`[Chamber Feed] Ignored empty transcript message for: ${who}`);
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
      <div class="msg-body">${text}</div>
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

  /**
   * Authoritative validation function for session lifecycle completion.
   * Returns true ONLY if:
   * 1. round1Analyses === 9
   * 2. round2Complete === true
   * 3. validVotes === 9
   * 4. verdict !== undefined && verdict.outcome in ["ADD", "REDUCE", "PASS"]
   * 5. databaseSaveSucceeded === true
   */
  function canCompleteSession(session, verdict, dbSaved) {
    if (!session) {
      console.warn('[Completion Guard]: Session object is missing.');
      return false;
    }

    // 1. Round 1: exactly 9 non-empty economist analyses
    const r1Count = session.round1Analyses 
      ? (session.round1Analyses instanceof Map ? session.round1Analyses.size : Object.keys(session.round1Analyses).length)
      : (session.transcript || []).filter(t => t.type === 'speaking' || t.type === 'analysis').length;
    if (r1Count !== 9) {
      console.warn(`[Completion Guard]: Incomplete Round 1 (${r1Count}/9 analyses recorded).`);
      return false;
    }

    // 2. Round 2: cross-examination completed
    const hasR2Transcript = (session.transcript || []).some(t => t.type === 'challenge' || t.type === 'response');
    if (!session.round2Complete && !hasR2Transcript) {
      console.warn('[Completion Guard]: Incomplete Round 2 (cross-examination did not occur).');
      return false;
    }

    // 3. Round 3: exactly 9 valid votes (ADD, REDUCE, or PASS)
    const votes = Array.isArray(session.votes) ? session.votes : [];
    if (votes.length !== 9) {
      console.warn(`[Completion Guard]: Incomplete Round 3 (${votes.length}/9 votes recorded).`);
      return false;
    }
    const validVoteSet = new Set(['ADD', 'REDUCE', 'PASS']);
    const allValid = votes.every(v => v && validVoteSet.has(((v.vote || '').toUpperCase().trim())));
    if (!allValid) {
      console.warn('[Completion Guard]: One or more invalid votes detected:', votes);
      return false;
    }

    // 4. Verdict outcome defined and in ["ADD", "REDUCE", "PASS"]
    const outcome = verdict ? (((verdict.outcome ?? verdict.decision) || '').toUpperCase().trim()) : '';
    if (!outcome || !validVoteSet.has(outcome)) {
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

    // Strict validation guard: DO NOT finalize or close if criteria not satisfied
    if (!canCompleteSession(currentSession, verdictData, dbSaved)) {
      console.error('[Chamber Guard]: canCompleteSession returned false. Aborting completion.');
      updateChamberState(STATES.ERROR);
      if (postActionsEl) postActionsEl.classList.remove('active');
      appendTranscriptMsg({
        type: 'chair',
        who: 'SYSTEM AUDIT',
        text: `SESSION INCOMPLETE: Deliberation aborted. Requirements not satisfied (Analyses: ${currentSession?.round1Analyses?.size || 0}/9, Votes: ${currentSession?.votes?.length || 0}/9, Outcome: ${outcome || 'undefined'}). Verdict cannot be certified.`
      });
      if (conveneBtn) conveneBtn.disabled = false;
      if (composerInput) composerInput.disabled = false;
      return false;
    }

    const dissentList = [];
    if (outcome !== 'ADD' && addTally > 0) dissentList.push(`${addTally} ADD`);
    if (outcome !== 'REDUCE' && reduceTally > 0) dissentList.push(`${reduceTally} REDUCE`);
    if (outcome !== 'PASS' && passTally > 0) dissentList.push(`${passTally} PASS`);
    const dissentBreakdown = verdictData?.dissentBreakdown || (dissentList.length > 0 ? dissentList.join(', ') : 'None (Unanimous)');

    let sizingBand = verdictData?.positionSizeBand;
    let sizingRationale = "Calibrated against downside tail risk.";
    if (!sizingBand) {
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

    const keyAgreement = verdictData?.keyAgreement || `${currentEvidence?.name || 'Asset'} retains market interest, but analytical members agree valuation must reflect structural tail risk.`;
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
      majorityRatio: verdictData?.majorityRatio || `${majorityCount} / 9`,
      dissentBreakdown,
      positionSizeBand: sizingBand,
      sizingSeat: `Seat 06 · ${sizingSeat.name} (${sizingSeat.discipline})`,
      sizingRationale,
      keyAgreement,
      keyDisagreement,
      unresolvedQuestion,
      reviewTriggers
    };

    if (currentSession) {
      currentSession.verdict = verdictObj;
      currentSession.closedAt = BourseUtils.formatTimestamp(new Date());
    }

    triggerVerdictImpact(outcome);

    const isSizingQuery = /\b(size|sizing|position|allocation|allocate|portfolio|weight|percentage|percent|how much|risk budget)\b/i.test(currentSession?.question || '');
    const sizingLine = isSizingQuery
      ? `\nPOSITION SIZE BAND: ${sizingBand} (Fixed by Seat 06 ${sizingSeat.shortName || sizingSeat.name} — ${sizingRationale})`
      : '';

    await streamTranscriptMsg({
      type: 'verdict-announcement',
      who: `VERDICT RECORD · SESSION ${sessionId}`,
      text: `QUESTION: "${currentSession?.question || ''}"\nOUTCOME: ${outcome} (${verdictObj.majorityRatio} Majority)\nDISSENT: ${dissentBreakdown}${sizingLine}\nRecord officially closed and committed to the permanent Verdict Ledger.`
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
              } else if (currentEvent === 'seat_end' || currentEvent === 'seat_analysis' || currentEvent === 'speech') {
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
              } else if (currentEvent === 'rebuttal' || currentEvent === 'cross_exam') {
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
                  if (['ADD', 'REDUCE', 'PASS'].includes(vUpper)) {
                    if (vUpper === 'ADD') {
                      addTally++;
                      animateCounter(tallyAddEl, addTally);
                    } else if (vUpper === 'REDUCE') {
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
                    setSeatState(seatNum, 'voted', vUpper);
                  }
                }
              } else if (currentEvent === 'verdict') {
                updateChamberState(STATES.AGGREGATING);
                pendingVerdict = data;
                if (currentSession) currentSession.votes = recordedVotes;
              } else if (currentEvent === 'done' || currentEvent === 'complete') {
                if (currentSession) currentSession.votes = recordedVotes;
                const dbSaved = Boolean(data.savedToDb || data.completed);

                if (canCompleteSession(currentSession, pendingVerdict, dbSaved)) {
                  const outcome = pendingVerdict.outcome ?? pendingVerdict.decision;
                  const majorityCount = pendingVerdict.majorityCount || (outcome === 'ADD' ? addTally : (outcome === 'REDUCE' ? reduceTally : passTally));
                  const ok = await finalizeSessionVerdict(outcome, majorityCount, addTally, reduceTally, passTally, pendingVerdict, true);
                  if (ok) sessionCompletedSuccessfully = true;
                } else {
                  console.error('[Session Incomplete]: canCompleteSession returned false.');
                  updateChamberState(STATES.ERROR);
                  appendTranscriptMsg({
                    type: 'chair',
                    who: 'SYSTEM AUDIT',
                    text: `SESSION INCOMPLETE: Deliberation aborted. Requirements not satisfied (Analyses: ${currentSession?.round1Analyses?.size || 0}/9, Votes: ${recordedVotes.length}/9). Verdict cannot be certified.`
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
          const majorityCount = pendingVerdict.majorityCount || (outcome === 'ADD' ? addTally : (outcome === 'REDUCE' ? reduceTally : passTally));
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
    if (scoreboardEl) scoreboardEl.classList.remove('active');

    feedEl.innerHTML = '';
    liveSeatStates = {};
    resetAllSeatStates('WAITING');

    const sessionId = BourseUtils.generateSessionId();
    if (sessionIdEl) sessionIdEl.textContent = sessionId;

    currentSession = {
      id: sessionId,
      question: query,
      createdAt: new Date().toISOString(),
      closedAt: null,
      evidence: null,
      speakingTurns: 0,
      seatsPresent: "9 / 9",
      directedMode: selectedSeats.size > 0 ? (isCrossExamMode ? 'cross_exam' : 'directed') : 'full_bench',
      directedSeats: Array.from(selectedSeats),
      votes: [],
      verdict: null,
      transcript: []
    };

    try {
      // 1. FILING
      updateChamberState(STATES.FILING);
      const isDirected = selectedSeats.size > 0;
      const targetSeats = isDirected 
        ? Array.from(selectedSeats).map(s => getChamberCouncil().getAgentBySeat(s)) 
        : getChamberCouncil().AGENTS;

      appendTranscriptMsg({
        type: 'chair',
        who: 'CHAIR',
        text: `Session ${sessionId} filed. The floor takes up: "${query}". ${isDirected ? `Directing prompt to: ${targetSeats.map(s => s.shortName).join(', ')}.` : 'Convening the full bench (Seats 01 through 09).'}`
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

      // Dim non-selected seats if directed
      getChamberCouncil().AGENTS.forEach(a => {
        const isTarget = targetSeats.some(t => t.seat === a.seat);
        if (isTarget) {
          setSeatState(a.seat, 'analyzing', 'ANALYZING');
        } else {
          setSeatState(a.seat, 'unselected-dim', 'OBSERVING');
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
          // STANDARD READINGS (Full Bench or Directed)
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

          // Automatic Stage 2 Clash if Full Bench
          if (!isDirected) {
            updateChamberState(STATES.ROUND_2);
            const seatA = getChamberCouncil().getAgentBySeat(1); // Satoshi Nakamoto
            const seatB = getChamberCouncil().getAgentBySeat(2); // Vitalik Buterin

            appendTranscriptMsg({
              type: 'chair',
              who: 'CHAIR',
              text: `Round 1 readings complete. Fundamental cryptoeconomic fault line identified. Opening cross-examination between Seat 01 (${seatA.name}) and Seat 02 (${seatB.name}).`
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
          }
        }

        // 4. ROUND 3 — VOTING (ALWAYS FREE: 0 CREDITS)
        updateChamberState(STATES.ROUND_3);
        resetAllSeatStates('WAITING');
        if (scoreboardEl) scoreboardEl.classList.add('active');

        appendTranscriptMsg({
          type: 'chair',
          who: 'CHAIR',
          text: `The floor is closed for debate. All nine seats will now cast recorded ballots on the motion: ADD, REDUCE, or PASS.`
        });
        await chamberWait(800);

        let addTally = 0;
        let reduceTally = 0;
        let passTally = 0;
        const recordedVotes = [];

        for (const agent of getChamberCouncil().AGENTS) {
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
            reason: voteResult.rationale
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

        // Calculate Majority Outcome
        let outcome = 'PASS';
        let majorityCount = passTally;
        if (addTally >= 5) {
          outcome = 'ADD';
          majorityCount = addTally;
        } else if (reduceTally >= 5) {
          outcome = 'REDUCE';
          majorityCount = reduceTally;
        } else if (addTally > reduceTally && addTally > passTally) {
          outcome = 'ADD';
          majorityCount = addTally;
        } else if (reduceTally > addTally && reduceTally > passTally) {
          outcome = 'REDUCE';
          majorityCount = reduceTally;
        }

        await finalizeSessionVerdict(outcome, majorityCount, addTally, reduceTally, passTally);
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
        if (scoreboardEl) scoreboardEl.classList.remove('active');
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
