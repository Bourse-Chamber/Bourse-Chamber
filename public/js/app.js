/**
 * Bourse Chamber — App Bootstrap & Global Controllers
 * Navigation, Mobile Menu, Dossier Drawer Controller
 */

document.addEventListener('DOMContentLoaded', () => {
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

  // Active Link Highlight based on current path (supports clean URLs & .html)
  const rawPath = window.location.pathname.split('/').pop() || 'index.html';
  const pathPart = rawPath.replace('.html', '') || 'index';
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const href = (link.getAttribute('href') || '').replace('.html', '');
    if (
      href === pathPart ||
      (pathPart === 'index' && (href === '' || href === 'index')) ||
      (pathPart === 'bourse-chamber' && href === 'index') ||
      (pathPart === 'verdict' && href === 'ledger')
    ) {
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

    if (agent.record) {
      if (dSessions) dSessions.textContent = agent.record.sessions || 45;
      if (dVotedFor) dVotedFor.textContent = agent.record.votedFor || 15;
      if (dDissents) dDissents.textContent = agent.record.dissents || 30;
    }

    if (dLiveSection) {
      if (liveState) {
        dLiveSection.style.display = 'block';
        dLiveSection.innerHTML = `
          <div class="dossier-section-title">CURRENT SESSION STANCE</div>
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
