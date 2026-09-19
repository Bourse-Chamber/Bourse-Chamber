/**
 * Bourse Chamber — The Bench Controller
 * 9 Personas · 5 Schools Filtering · Dossier Drawer Binding
 */

const BourseBench = (() => {
  let gridEl, filtersEl;
  let activeSchool = 'ALL';

  function init() {
    gridEl = document.getElementById('bench-grid');
    filtersEl = document.getElementById('bench-filters');

    if (!gridEl) return;

    renderFilters();
    renderCards(activeSchool);
  }

  function renderFilters() {
    if (!filtersEl) return;
    const schools = BourseAgents.SCHOOLS;
    filtersEl.innerHTML = '';

    schools.forEach(school => {
      const btn = document.createElement('button');
      btn.className = `filter-btn ${school === activeSchool ? 'active' : ''}`;
      btn.textContent = school;
      btn.setAttribute('type', 'button');
      btn.addEventListener('click', () => {
        activeSchool = school;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCards(activeSchool);
      });
      filtersEl.appendChild(btn);
    });
  }

  function renderCards(schoolFilter) {
    if (!gridEl) return;
    gridEl.innerHTML = '';

    const agents = BourseAgents.getAgentsBySchool(schoolFilter);

    if (agents.length === 0) {
      gridEl.innerHTML = `<p style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.8rem;padding:40px 0;grid-column:1/-1;text-align:center;">No seats found matching filter "${schoolFilter}".</p>`;
      return;
    }

    agents.forEach(agent => {
      const card = document.createElement('article');
      card.className = 'persona-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Inspect dossier for ${agent.name}`);

      const questionsList = (agent.asks || [])
        .map(q => `<li>${q}</li>`)
        .join('');

      card.innerHTML = `
        <div class="card-top">
          <div class="card-avatar-box">
            ${BourseUtils.generatePixelAvatarSVG(agent.name, 42)}
          </div>
          <div class="card-meta">
            <div class="card-seat-tag">SEAT 0${agent.seat} · ${agent.school}</div>
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
            <b>${agent.record.sessions}</b>
            <span>Sessions</span>
          </div>
          <div class="card-record-item">
            <b>${agent.record.votedFor}</b>
            <span>Voted In</span>
          </div>
          <div class="card-record-item">
            <b>${agent.record.dissents}</b>
            <span>Dissents</span>
          </div>
        </div>
      `;

      // Click or Enter opens the full dossier drawer
      card.addEventListener('click', () => {
        window.openAgentDossier(agent);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.openAgentDossier(agent);
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

document.addEventListener('DOMContentLoaded', () => {
  BourseBench.init();
});
