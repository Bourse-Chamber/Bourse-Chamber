/**
 * Bourse Chamber — Council Chamber Orchestration Engine
 * 9 Seats · State Machine · F13 Answer Budget (13/day) · F14 Directed Selection · Taleb Sizing Band
 */

const BourseChamber = (() => {
  // Council States
  const STATES = {
    IDLE: 'IDLE',
    FILING: 'FILING',
    PREPARING_EVIDENCE: 'PREPARING EVIDENCE',
    ROUND_1: 'ROUND 1 — READINGS',
    ROUND_2: 'ROUND 2 — CROSS-EXAMINATION',
    ROUND_3: 'ROUND 3 — VOTING',
    SYNTHESIZING: 'SYNTHESIZING VERDICT',
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
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q');
    if (initialQuery && composerInput) {
      composerInput.value = initialQuery;
    }
  }

  function startClock() {
    function tick() {
      if (clockEl) clockEl.textContent = BourseUtils.formatTimestamp(new Date());
    }
    tick();
    setInterval(tick, 1000);
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

  /**
   * Render rectangular council arena (1 Top, 4 Left, 4 Right, Open Bottom)
   */
  function renderChamberRing() {
    if (!seatsContainer || !spokesSvg) return;
    seatsContainer.innerHTML = '';
    spokesSvg.innerHTML = '';

    const agents = BourseAgents.AGENTS;

    agents.forEach((agent) => {
      const pos = SEAT_COORDINATES[agent.seat] || { x: 500, y: 50 };
      const spoke = SPOKE_COORDINATES[agent.seat] || { x1: pos.x, y1: pos.y, x2: 500, y2: 230 };

      // Spoke Line
      const spokeLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
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
    BourseAgents.AGENTS.forEach(agent => {
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
          const agent = BourseAgents.getAgentBySeat(seatNum);
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
        const arr = Array.from(selectedSeats).map(s => BourseAgents.getAgentBySeat(s).shortName);
        label = `Cross-examine: ${arr.join(' vs ')} (4)`;
        if (composerModeLabelEl) composerModeLabelEl.textContent = `Cross-examination on the floor`;
      } else {
        const arr = Array.from(selectedSeats).map(s => BourseAgents.getAgentBySeat(s).shortName);
        label = `Ask ${arr.join(', ')} (${required})`;
        if (composerModeLabelEl) composerModeLabelEl.textContent = `Directed question to ${arr.join(', ')}`;
      }
      conveneBtn.textContent = label;

      // Budget Validation
      const warningEl = document.getElementById('budget-warning-text');
      if (remaining < required) {
        conveneBtn.disabled = true;
        if (warningEl) {
          warningEl.style.display = 'block';
          if (count === 0 && remaining < 9 && remaining > 0) {
            warningEl.textContent = `A full bench costs 9. You have ${remaining} left — click ${remaining} seats above to direct the floor instead.`;
          } else {
            warningEl.textContent = `Not enough credits. This prompt costs ${required}, but you have ${remaining} left today. Pick fewer seats or come back at 00:00 UTC.`;
          }
        }
      } else {
        conveneBtn.disabled = false;
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
    BourseAgents.AGENTS.forEach(a => {
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

  async function streamTranscriptMsg({ type, who, text, time = null }) {
    if (!feedEl) return null;
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
      const ok = BourseBudget.consume(requiredCredits);
      if (!ok) {
        BourseUtils.showToast('Insufficient daily answer credits. Check budget HUD.');
        return;
      }
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
        ? Array.from(selectedSeats).map(s => BourseAgents.getAgentBySeat(s)) 
        : BourseAgents.AGENTS;

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
      BourseAgents.AGENTS.forEach(a => {
        const isTarget = targetSeats.some(t => t.seat === a.seat);
        if (isTarget) {
          setSeatState(a.seat, 'analyzing', 'ANALYZING');
        } else {
          setSeatState(a.seat, 'unselected-dim', 'OBSERVING');
        }
      });

      // 3. ROUND 1 — READINGS (Consumes 1 credit per speaking seat)
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
        const challengeA = seatA.generateChallenge(seatB);
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
        const respB = seatB.generateResponse(seatA);
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
            currentEvidence
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
          const seatA = BourseAgents.getAgentBySeat(1); // Graham (Downside floor)
          const seatB = BourseAgents.getAgentBySeat(4); // Wood (Growth & Disruption)

          appendTranscriptMsg({
            type: 'chair',
            who: 'CHAIR',
            text: `Round 1 readings complete. The bench has identified fundamental ideological divergence. Opening cross-examination between Seat 01 (${seatA.name}) and Seat 04 (${seatB.name}).`
          });
          await chamberWait(900);

          drawDuelBeam(seatA.seat, seatB.seat);
          setSeatState(seatA.seat, 'challenging', 'CHALLENGING');
          showTypingIndicator(seatA.name);
          await chamberWait(1000);
          removeTypingIndicator();
          setSeatState(seatA.seat, 'speaking', 'SPEAKING');
          const challengeText = seatA.generateChallenge(seatB);
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
          const responseText = seatB.generateResponse(seatA);
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

      for (const agent of BourseAgents.AGENTS) {
        setSeatState(agent.seat, 'speaking', 'VOTING');
        await chamberWait(350);

        const voteResult = agent.generateVote(
          { ticker: currentEvidence.ticker, name: currentEvidence.name },
          currentEvidence
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

        setSeatState(agent.seat, `voted voted-${voteResult.vote.toLowerCase()}`, voteResult.vote);
        await chamberWait(200);
      }

      currentSession.votes = recordedVotes;
      await chamberWait(700);

      // 5. SYNTHESIZING VERDICT & TALEB POSITION SIZING BAND
      updateChamberState(STATES.SYNTHESIZING);
      appendTranscriptMsg({
        type: 'chair',
        who: 'CHAIR',
        text: `Balloting closed. Calling Seat 06 (Taleb) for position sizing band and synthesizing permanent ledger record.`
      });
      await chamberWait(1000);

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

      const dissentList = [];
      if (outcome !== 'ADD' && addTally > 0) dissentList.push(`${addTally} ADD`);
      if (outcome !== 'REDUCE' && reduceTally > 0) dissentList.push(`${reduceTally} REDUCE`);
      if (outcome !== 'PASS' && passTally > 0) dissentList.push(`${passTally} PASS`);
      const dissentBreakdown = dissentList.length > 0 ? dissentList.join(', ') : 'None (Unanimous)';

      // CRITICAL SPECIFICATION: Nassim Nicholas Taleb is the sole seat that determines the Position Size Band!
      const taleb = BourseAgents.getAgentBySeat(6);
      const talebSizing = taleb.calculatePositionSizeBand(
        { ticker: currentEvidence.ticker, name: currentEvidence.name },
        currentEvidence,
        outcome
      );
      const sizingBand = talebSizing.band;

      const keyAgreement = `${currentEvidence.name} retains recognizable market liquidity and participation, but carries starkly distinct risks across analytical schools.`;
      const keyDisagreement = `The core fault line separates Damodaran & Graham's cash-flow valuation rigor from Cathie Wood's exponential S-curve disruption thesis.`;
      const unresolvedQuestion = `Can long-term network fee accrual sustain validator security if macro liquidity contracts?`;
      const reviewTriggers = [
        `Material deterioration in active on-chain daily settlement volume (>35% drawdown).`,
        `Price expansion exceeding 50% without corresponding expansion in organic fee capture.`,
        `Acceleration in venture/insider unlock distribution schedules.`
      ];

      const verdictObj = {
        outcome,
        majorityRatio: `${majorityCount} / 9`,
        dissentBreakdown,
        positionSizeBand: sizingBand,
        sizingSeat: "Seat 06 · Nassim Nicholas Taleb (Tail risk)",
        sizingRationale: talebSizing.rationale,
        keyAgreement,
        keyDisagreement,
        unresolvedQuestion,
        reviewTriggers
      };

      currentSession.verdict = verdictObj;
      currentSession.closedAt = BourseUtils.formatTimestamp(new Date());

      // Trigger High-Impact Verdict Quake & Stamp Slam Animation
      triggerVerdictImpact(outcome);

      // Final Verdict Announcement
      await streamTranscriptMsg({
        type: 'verdict-announcement',
        who: `VERDICT RECORD · SESSION ${sessionId}`,
        text: `OUTCOME: ${outcome} (${verdictObj.majorityRatio} Majority)\nDISSENT: ${dissentBreakdown}\nPOSITION SIZE BAND: ${sizingBand} (Fixed by Seat 06 Taleb — ${talebSizing.rationale})\nRecord officially closed and committed to the permanent Verdict Ledger.`
      });

      // 6. PERSIST TO STORAGE
      BourseStorage.saveSession(currentSession);

      // 7. COMPLETED
      updateChamberState(STATES.COMPLETED);
      BourseUtils.showToast(`Session ${sessionId} recorded to Verdict Ledger.`);

      if (postActionsEl) postActionsEl.classList.add('active');
      if (viewVerdictBtn) {
        viewVerdictBtn.onclick = () => {
          if (window.BourseSPA) {
            window.BourseSPA.showVerdict(sessionId);
          } else {
            window.location.href = `/verdict?id=${sessionId}`;
          }
        };
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

      // F14: Support @mention in composer input (e.g. typing @graham selects Graham)
      composerInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const matches = val.match(/@([a-zA-Z]+)/g);
        if (matches) {
          matches.forEach(m => {
            const name = m.substring(1).toLowerCase();
            const found = BourseAgents.getAgentByName(name);
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
    const hintChips = document.querySelectorAll('.hint-chip');
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
