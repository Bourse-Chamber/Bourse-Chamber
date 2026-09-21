/**
 * Bourse Chamber — The Crypto Bench Controller
 * 9 Crypto Architects · 5 Schools Filtering · Dossier Drawer Binding
 */

const BourseCryptoBench = (() => {
  let gridEl, filtersEl;
  let activeSchool = 'ALL';

  function init() {
    gridEl = document.getElementById('crypto-bench-grid');
    filtersEl = document.getElementById('crypto-bench-filters');

    if (!gridEl) return;

    renderFilters();
    renderCards(activeSchool);
  }

  function renderFilters() {
    if (!filtersEl) return;
    const schools = (typeof BourseCryptoAgents !== 'undefined') ? BourseCryptoAgents.SCHOOLS : [];
    filtersEl.innerHTML = '';

    schools.forEach(school => {
      const btn = document.createElement('button');
      btn.className = `filter-btn ${school === activeSchool ? 'active' : ''}`;
      btn.textContent = school;
      btn.setAttribute('type', 'button');
      btn.addEventListener('click', () => {
        activeSchool = school;
        document.querySelectorAll('#crypto-bench-filters .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCards(activeSchool);
      });
      filtersEl.appendChild(btn);
    });
  }

  function renderCards(schoolFilter) {
    if (!gridEl) return;
    gridEl.innerHTML = '';

    if (typeof BourseCryptoAgents === 'undefined') {
      gridEl.innerHTML = `<p style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.8rem;padding:40px 0;grid-column:1/-1;text-align:center;">Crypto persona definitions loading...</p>`;
      return;
    }

    const agents = BourseCryptoAgents.getAgentsBySchool(schoolFilter);

    if (agents.length === 0) {
      gridEl.innerHTML = `<p style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.8rem;padding:40px 0;grid-column:1/-1;text-align:center;">No seats found matching filter "${schoolFilter}".</p>`;
      return;
    }

    agents.forEach(agent => {
      // Real live record calculated dynamically from recorded sessions
      const realRecord = (typeof BourseStorage !== 'undefined' && BourseStorage.getAgentVotingRecord)
        ? BourseStorage.getAgentVotingRecord(agent.name || agent.seat)
        : null;

      const sessionsCount = (realRecord && realRecord.sessions > 0)
        ? realRecord.sessions
        : (agent.computedRecord ? agent.computedRecord.sessions : (agent.record ? agent.record.sessions : 0));

      const votedInCount = (realRecord && realRecord.sessions > 0)
        ? realRecord.votedFor
        : (agent.computedRecord ? agent.computedRecord.votedFor : (agent.record ? agent.record.votedFor : 0));

      const dissentsCount = (realRecord && realRecord.sessions > 0)
        ? realRecord.dissents
        : (agent.computedRecord ? agent.computedRecord.dissents : (agent.record ? agent.record.dissents : 0));

      // Attach computed live record to agent object for dossier drawer
      agent.computedRecord = {
        sessions: sessionsCount,
        votedFor: votedInCount,
        dissents: dissentsCount,
        votes: (realRecord && realRecord.votes && realRecord.votes.length > 0)
          ? realRecord.votes
          : (agent.computedRecord && agent.computedRecord.votes ? agent.computedRecord.votes : [])
      };

      const card = document.createElement('article');
      const schoolSlug = agent.school.toLowerCase().replace(/[\s&]+/g, '-');
      card.className = `persona-card school-${schoolSlug}`;
      card.dataset.school = agent.school.toLowerCase();
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Inspect dossier for ${agent.name}`);

      const questionsList = (agent.asks || [])
        .map(q => `<li>${q}</li>`)
        .join('');

      const avatarSVG = (typeof BourseUtils !== 'undefined' && BourseUtils.generatePixelAvatarSVG)
        ? BourseUtils.generatePixelAvatarSVG(agent.name, 42)
        : `<svg width="42" height="42" viewBox="0 0 42 42"><rect width="42" height="42" fill="#111"/><rect x="14" y="14" width="14" height="14" fill="#fff"/></svg>`;

      card.innerHTML = `
        <div class="card-top">
          <div class="card-avatar-box">
            ${avatarSVG}
          </div>
          <div class="card-meta">
            <div class="card-seat-tag"><span class="school-pill">${agent.school}</span> · SEAT 0${agent.seat}</div>
            <h3 class="card-name">${agent.name}</h3>
            <div class="card-discipline">${agent.discipline}</div>
          </div>
        </div>
        <p class="card-bio">${agent.philosophy || agent.bio}</p>
        <div class="card-section-title">WHAT THIS SEAT ASKS FIRST</div>
        <ul class="card-questions-list">
          ${questionsList}
        </ul>
        <div class="card-record-row">
          <div class="card-record-item">
            <b>${sessionsCount}</b>
            <span>Sessions</span>
          </div>
          <div class="card-record-item">
            <b>${votedInCount}</b>
            <span>Voted In</span>
          </div>
          <div class="card-record-item">
            <b>${dissentsCount}</b>
            <span>Dissents</span>
          </div>
        </div>
      `;

      // Click or Enter opens the full dossier drawer
      card.addEventListener('click', () => {
        if (typeof window.openAgentDossier === 'function') {
          window.openAgentDossier(agent);
        }
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (typeof window.openAgentDossier === 'function') {
            window.openAgentDossier(agent);
          }
        }
      });

      gridEl.appendChild(card);
    });
  }

  return {
    init,
    renderCards
  };
})();

// Auto initialize on DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    BourseCryptoBench.init();
  });
}

// Export for Node/test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BourseCryptoBench;
}
