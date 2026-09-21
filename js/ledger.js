/**
 * Bourse Chamber — Verdict Ledger Controller
 * Metrics Ribbon · Realtime Search & Filtering · Dynamic Persistence
 */

const BourseLedger = (() => {
  let tableWrapEl, filtersEl, searchInputEl;
  let metricSessionsEl, metricVotedInEl, metricMajorityEl, metricSizeBandEl;
  let activeVerdictFilter = 'ALL';
  let searchQuery = '';

  function init() {
    tableWrapEl = document.getElementById('ledger-table-rows');
    filtersEl = document.getElementById('ledger-filters');
    searchInputEl = document.getElementById('ledger-search-input');

    metricSessionsEl = document.getElementById('metric-total-sessions');
    metricVotedInEl = document.getElementById('metric-voted-in');
    metricMajorityEl = document.getElementById('metric-avg-majority');
    metricSizeBandEl = document.getElementById('metric-median-band');

    if (!tableWrapEl) return;

    renderMetrics();
    renderFilters();
    setupSearch();
    renderTable();
  }

  function renderMetrics() {
    const metrics = BourseStorage.getLedgerMetrics();
    if (metricSessionsEl) metricSessionsEl.textContent = metrics.totalSessions;
    if (metricVotedInEl) metricVotedInEl.textContent = metrics.votedIn;
    if (metricMajorityEl) metricMajorityEl.textContent = metrics.avgMajority;
    if (metricSizeBandEl) metricSizeBandEl.textContent = metrics.medianSizeBand;
  }

  function renderFilters() {
    if (!filtersEl) return;
    const filterOptions = ['ALL', 'ADD', 'REDUCE', 'PASS'];
    filtersEl.innerHTML = '';

    filterOptions.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = `filter-btn ${opt === activeVerdictFilter ? 'active' : ''}`;
      btn.textContent = opt;
      btn.setAttribute('type', 'button');
      btn.addEventListener('click', () => {
        activeVerdictFilter = opt;
        document.querySelectorAll('#ledger-filters .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTable();
      });
      filtersEl.appendChild(btn);
    });
  }

  function setupSearch() {
    if (!searchInputEl) return;
    searchInputEl.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderTable();
    });
  }

  function renderTable() {
    if (!tableWrapEl) return;
    tableWrapEl.innerHTML = '';

    const allSessions = BourseStorage.getSessions();

    const filtered = allSessions.filter(session => {
      // Verdict filter
      const outcome = session.verdict ? session.verdict.outcome : '';
      if (activeVerdictFilter !== 'ALL' && outcome !== activeVerdictFilter) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const ticker = (session.ticker || '').toLowerCase();
        const assetName = (session.assetName || '').toLowerCase();
        const question = (session.question || '').toLowerCase();
        const id = (session.id || '').toLowerCase();
        const matches = ticker.includes(searchQuery) ||
                        assetName.includes(searchQuery) ||
                        question.includes(searchQuery) ||
                        id.includes(searchQuery);
        if (!matches) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      tableWrapEl.innerHTML = `
        <div class="ledger-empty">
          No recorded sessions found matching "${searchQuery || activeVerdictFilter}".
        </div>
      `;
      return;
    }

    filtered.forEach(session => {
      const row = document.createElement('a');
      row.className = 'ledger-row';
      row.href = `/verdict?id=${session.id}`;
      row.addEventListener('click', (e) => {
        if (window.BourseSPA) {
          e.preventDefault();
          window.BourseSPA.showVerdict(session.id);
        }
      });

      const outcome = session.verdict ? session.verdict.outcome : 'PENDING';
      const badgeClass = outcome.toLowerCase();
      const ratio = session.verdict ? session.verdict.majorityRatio : '--';
      const sizeBand = session.verdict ? session.verdict.positionSizeBand : '--';
      const dateText = session.evidence && session.evidence.retrievalDate 
        ? session.evidence.retrievalDate 
        : BourseUtils.formatDate(session.createdAt);

      row.innerHTML = `
        <div class="col-asset">
          <span>${session.ticker || 'ASSET'}</span>
        </div>
        <div class="col-question" title="${session.question}">
          ${session.question}
        </div>
        <div>
          <span class="badge ${badgeClass}">${outcome}</span>
        </div>
        <div class="col-vote">${ratio}</div>
        <div class="col-band">${sizeBand}</div>
        <div class="col-date">${dateText}</div>
      `;

      tableWrapEl.appendChild(row);
    });
  }

  return {
    init,
    renderTable
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  BourseLedger.init();
});
