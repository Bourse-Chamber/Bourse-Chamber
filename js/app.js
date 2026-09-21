/**
 * Bourse Chamber — App Bootstrap & Global Controllers
 * Navigation, Mobile Menu, Dossier Drawer Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Strip .html extension from browser address bar and rewrite index to overview
  if (typeof window !== 'undefined' && window.location) {
    const pathname = window.location.pathname;
    if (pathname.endsWith('.html') || pathname === '/index') {
      let clean = pathname.replace(/\.html$/, '');
      if (clean === '/index' || clean === '') clean = '/overview';
      window.history.replaceState(null, '', clean + window.location.search + window.location.hash);
    }
  }

  // Mobile Nav Toggle
  const navToggle = document.querySelector('.mobile-nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-active');
      const expanded = navLinks.classList.contains('mobile-active');
      navToggle.setAttribute('aria-expanded', expanded);
    });
  }

  // Active Link Highlight based on current path (supports clean URLs & overview)
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const rawPath = pathSegments[0] || 'overview';
  const pathPart = rawPath.replace('.html', '') || 'overview';
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const rawHref = link.getAttribute('href') || '';
    const cleanHref = rawHref.replace('.html', '').replace(/^\//, '') || 'overview';
    const isOverview = (pathPart === 'overview' || pathPart === 'index' || pathPart === '') && (cleanHref === 'overview' || cleanHref === 'index' || cleanHref === '');
    const isVerdict = pathPart === 'verdict' && cleanHref === 'ledger';
    if (cleanHref === pathPart || isOverview || isVerdict) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Dossier Scrim & Close
  const scrim = document.getElementById('dossier-scrim');
  const drawer = document.getElementById('dossier-drawer');
  const closeBtn = document.getElementById('dossier-close');

  function closeDossier() {
    if (drawer) drawer.classList.remove('open');
    if (scrim) scrim.classList.remove('open');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeDossier);
  if (scrim) scrim.addEventListener('click', closeDossier);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
      closeDossier();
    }
  });

  // Expose global drawer opener
  window.openAgentDossier = function(agent, liveState = null) {
    if (!drawer) return;

    const dAvatar = document.getElementById('dossier-avatar');
    const dSeat = document.getElementById('dossier-seat');
    const dName = document.getElementById('dossier-name');
    const dDiscipline = document.getElementById('dossier-discipline');
    const dBio = document.getElementById('dossier-bio');
    const dQuestions = document.getElementById('dossier-questions');
    const dSessions = document.getElementById('dossier-sessions');
    const dVotedFor = document.getElementById('dossier-voted-for');
    const dDissents = document.getElementById('dossier-dissents');
    const dLiveSection = document.getElementById('dossier-live-section');

    if (dAvatar) dAvatar.innerHTML = BourseUtils.generatePixelAvatarSVG(agent.name, 72);
    if (dSeat) dSeat.textContent = `SEAT ${String(agent.seat).padStart(2, '0')} · ${agent.school}`;
    if (dName) dName.textContent = agent.name;
    if (dDiscipline) dDiscipline.textContent = agent.discipline;
    if (dBio) dBio.textContent = agent.bio;

    if (dQuestions && agent.asks) {
      dQuestions.innerHTML = agent.asks.map(q => `<li>${q}</li>`).join('');
    }

    const rec = agent.computedRecord || (typeof BourseStorage !== 'undefined' && BourseStorage.getAgentVotingRecord ? BourseStorage.getAgentVotingRecord(agent.seat) : null) || agent.record;
    if (rec) {
      if (dSessions) dSessions.textContent = rec.sessions;
      if (dVotedFor) dVotedFor.textContent = rec.votedFor;
      if (dDissents) dDissents.textContent = rec.dissents;
    }

    let dVotesHistory = document.getElementById('dossier-votes-history');
    if (!dVotesHistory && drawer) {
      dVotesHistory = document.createElement('div');
      dVotesHistory.id = 'dossier-votes-history';
      const liveSection = document.getElementById('dossier-live-section');
      if (liveSection) {
        drawer.insertBefore(dVotesHistory, liveSection);
      } else {
        drawer.appendChild(dVotesHistory);
      }
    }

    if (dVotesHistory) {
      const votes = (rec && rec.votes) ? rec.votes : [];
      if (votes.length > 0) {
        dVotesHistory.innerHTML = `
          <div class="dossier-section-title" style="margin-top:20px;">RECORDED FLOOR VOTES (${votes.length})</div>
          <div class="dossier-votes-list" style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
            ${votes.map(v => `
              <div class="dossier-vote-card" style="border:1px solid var(--border-subtle, #242424);padding:8px 10px;background:rgba(255,255,255,0.02);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <a href="/verdict?id=${v.sessionId}" style="font-family:var(--font-mono);font-size:0.75rem;font-weight:700;color:var(--text-primary);text-decoration:underline;">${v.sessionId} · ${v.ticker}</a>
                  <span class="badge ${v.vote.toLowerCase()}" style="font-size:0.65rem;padding:2px 6px;">${v.vote}</span>
                </div>
                <p style="font-size:0.74rem;line-height:1.4;color:var(--text-muted);margin:6px 0 0 0;font-style:italic;">"${v.rationale}"</p>
                <div style="margin-top:6px;display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim, #666);">
                  <span>Verdict: ${v.outcome || 'CLOSED'}</span>
                  <span>${v.date || ''}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        dVotesHistory.innerHTML = '';
      }
    }

    if (dLiveSection) {
      if (liveState) {
        dLiveSection.style.display = 'block';
        dLiveSection.innerHTML = `
          <div class="dossier-section-title" style="margin-top:20px;">CURRENT SESSION STANCE</div>
          <div class="dossier-live-box">
            <b>${liveState.position || 'Under Review'} (Confidence: ${liveState.confidence || '--'}%)</b>
            <p>${liveState.argument || 'Analysis in progress...'}</p>
            ${liveState.keyRisk ? `<p style="margin-top:8px;font-size:0.75rem;color:#888"><em>Risk:</em> ${liveState.keyRisk}</p>` : ''}
            ${liveState.preliminaryVote ? `<div style="margin-top:10px;"><span class="badge ${liveState.preliminaryVote.toLowerCase()}">Preliminary Ballot: ${liveState.preliminaryVote}</span></div>` : ''}
          </div>
        `;
      } else {
        dLiveSection.style.display = 'none';
      }
    }

    drawer.classList.add('open');
    if (scrim) scrim.classList.add('open');
  };
});
