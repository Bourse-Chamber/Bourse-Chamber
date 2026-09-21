/**
 * Bourse Chamber — The Bench Controller
 * 9 Personas · 5 Schools Filtering · Live Record Aggregation · Dossier Drawer Binding
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

    // Sync live from server API if online
    syncLiveFromAPI();
  }

  async function syncLiveFromAPI() {
    try {
      const res = await fetch('/api/session?aggregate=bench');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.agents)) {
          data.agents.forEach(serverAgent => {
            const local = BourseAgents.getAgentBySeat(serverAgent.seat);
            if (local && serverAgent.record) {
              // Merge live server record
              local.computedRecord = {
                sessions: serverAgent.record.sessions,
                votedFor: serverAgent.record.votedFor,
                dissents: serverAgent.record.dissents,
                votes: serverAgent.recentVotes || []
              };
            }
          });
          renderCards(activeSchool);
        }
      }
    } catch (e) {
      // Offline fallback: BourseStorage provides local real record
    }
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
      // Real live record calculated dynamically from recorded sessions
      const realRecord = (typeof BourseStorage !== 'undefined' && BourseStorage.getAgentVotingRecord)
        ? BourseStorage.getAgentVotingRecord(agent.seat)
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
      const schoolSlug = agent.school.toLowerCase().replace(/\s+/g, '-');
      card.className = `persona-card school-${schoolSlug}`;
      card.dataset.school = agent.school.toLowerCase();
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
