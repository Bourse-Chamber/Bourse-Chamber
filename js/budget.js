/**
 * Bourse Chamber — F13 Answer Budget Controller
 * 13 expert answers per day · Reset at 00:00 UTC · Pixel HUD & Pre-calculation
 */

const BourseBudget = (() => {
  const TOTAL_CREDITS = 13;
  const STORAGE_KEY = 'bourse_daily_budget';

  function getTodayUTCDayString() {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  }

  function getTimeUntilReset() {
    const now = new Date();
    const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    const diffMs = nextReset - now;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  function loadBudgetState() {
    const today = getTodayUTCDayString();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.date === today && typeof data.remaining === 'number') {
          return data;
        }
      }
    } catch (e) {
      console.warn('Budget localStorage read warning:', e);
    }
    // Fresh day or first visit
    const fresh = { date: today, remaining: TOTAL_CREDITS, used: 0 };
    saveBudgetState(fresh);
    return fresh;
  }

  function saveBudgetState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Budget localStorage write warning:', e);
    }
  }

  function getRemaining() {
    return loadBudgetState().remaining;
  }

  /**
   * Consume credits if available
   * @param {number} count 
   * @returns {boolean} true if successful
   */
  function consume(count) {
    const state = loadBudgetState();
    if (state.remaining >= count) {
      state.remaining -= count;
      state.used += count;
      saveBudgetState(state);
      renderCounter();
      return true;
    }
    return false;
  }

  /**
   * Refund credits (e.g. if a seat failed or timed out)
   */
  function refund(count) {
    const state = loadBudgetState();
    state.remaining = Math.min(TOTAL_CREDITS, state.remaining + count);
    state.used = Math.max(0, state.used - count);
    saveBudgetState(state);
    renderCounter();
  }

  /**
   * Render the 13-pixel counter HUD
   */
  function renderCounter(previewCost = 0) {
    const state = loadBudgetState();
    const remaining = state.remaining;
    const counterTextEl = document.getElementById('budget-counter-text');
    const pixelGridEl = document.getElementById('budget-pixel-grid');
    const warningEl = document.getElementById('budget-warning-text');
    const resetTimeEl = document.getElementById('budget-reset-countdown');

    if (counterTextEl) {
      counterTextEl.textContent = `${remaining} / ${TOTAL_CREDITS} answers left today`;
    }

    if (resetTimeEl) {
      resetTimeEl.textContent = `Resets in ${getTimeUntilReset()} (00:00 UTC)`;
    }

    if (pixelGridEl) {
      pixelGridEl.innerHTML = '';
      for (let i = 1; i <= TOTAL_CREDITS; i++) {
        const box = document.createElement('i');
        box.className = 'budget-pixel-box';
        
        const isFilled = i <= remaining;
        const isBlinking = isFilled && (i > (remaining - previewCost));

        if (isFilled) {
          box.classList.add('active');
        }
        if (isBlinking) {
          box.classList.add('blinking');
        }
        pixelGridEl.appendChild(box);
      }
    }

    if (warningEl) {
      if (remaining <= 3 && remaining > 0) {
        warningEl.style.display = 'block';
        warningEl.textContent = 'Three answers left. Spend them on the seat you disagree with.';
      } else if (remaining === 0) {
        warningEl.style.display = 'block';
        warningEl.textContent = 'Daily budget reached. Voting & closed verdicts remain free. Resets at 00:00 UTC.';
      } else {
        warningEl.style.display = 'none';
      }
    }
  }

  function init() {
    loadBudgetState();
    renderCounter();
    setInterval(renderCounter, 60000); // refresh reset timer every minute
  }

  return {
    init,
    getRemaining,
    consume,
    refund,
    renderCounter,
    getTimeUntilReset,
    TOTAL_CREDITS
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  BourseBudget.init();
});

// Export for Node/CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BourseBudget;
}
