/**
 * Bourse Chamber — Motion & Interactive Animation Engine (js/motion.js)
 * Institutional Monochrome Wave Canvas · Marquee Controller · Motion Mode HUD
 */

const BourseMotion = (() => {
  let mode = localStorage.getItem('bourse_motion_mode') || 'ultra';
  let canvas, ctx, animFrameId;
  let mouse = { x: -1000, y: -1000, radius: 140 };

  function init() {
    applyMode(mode);
    setupMotionButtons();
    initHeroCanvas();
    initProcessObserver();
  }

  function getMode() {
    return mode;
  }

  function setMode(newMode) {
    mode = newMode;
    localStorage.setItem('bourse_motion_mode', mode);
    applyMode(mode);
    updateButtonLabels();
  }

  function applyMode(currentMode) {
    document.body.classList.remove('motion-ultra', 'motion-calm', 'motion-reduced');
    document.body.classList.add(`motion-${currentMode}`);

    const radar = document.getElementById('radar-sweep');
    if (radar) {
      radar.style.display = currentMode === 'reduced' ? 'none' : 'block';
      radar.style.animationDuration = currentMode === 'ultra' ? '9s' : '18s';
    }

    const canvasWrap = document.querySelector('.hero-canvas-wrap');
    if (canvasWrap) {
      canvasWrap.style.display = currentMode === 'reduced' ? 'none' : 'block';
    }
  }

  function setupMotionButtons() {
    const btns = document.querySelectorAll('.nav-btn-motion');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const next = mode === 'ultra' ? 'calm' : mode === 'calm' ? 'reduced' : 'ultra';
        setMode(next);
        if (typeof BourseUtils !== 'undefined') {
          BourseUtils.showToast(`Motion FX: ${next.toUpperCase()}`);
        }
      });
    });
    updateButtonLabels();
  }

  function updateButtonLabels() {
    const btns = document.querySelectorAll('.nav-btn-motion');
    btns.forEach(btn => {
      const dot = '<span class="motion-dot" aria-hidden="true"></span>';
      btn.innerHTML = `${dot} MOTION: ${mode.toUpperCase()}`;
    });
  }

  /**
   * Typographic ASCII Halftone & Mathematical Wave Field (Reference Image 1)
   */
  function initHeroCanvas() {
    canvas = document.getElementById('hero-matrix-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width, height;
    const charW = 16;
    const charH = 18;
    let cols, rows;
    let step = 0;
    const glyphs = [' ', '.', ':', ';', 's', 'u', 't', 'b', 'o', 'u', 'r', 's', 'e', '9', '#', '@'];

    function resize() {
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
      cols = Math.ceil(width / charW);
      rows = Math.ceil(height / charH);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();

    window.addEventListener('mousemove', (e) => {
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });

    function render() {
      if (!ctx || mode === 'reduced') {
        animFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      step += (mode === 'ultra' ? 0.022 : 0.01);

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const cx = width * 0.5;
      const cy = height * 0.45;
      const radiusX = width * 0.42;
      const radiusY = height * 0.48;

      for (let y = 0; y < rows; y++) {
        const py = y * charH;
        for (let x = 0; x < cols; x++) {
          const px = x * charW;

          // Normalized distance from center
          const nx = (px - cx) / radiusX;
          const ny = (py - cy) / radiusY;
          const distSq = nx * nx + ny * ny;

          // Trigonometric fluid wave
          const wave = Math.sin(nx * 3.8 + step) * Math.cos(ny * 3.4 + step * 0.7);

          // Mouse distortion
          const dx = px - mouse.x;
          const dy = py - mouse.y;
          const mDist = Math.sqrt(dx * dx + dy * dy);
          const mouseBonus = mDist < 160 ? (1 - mDist / 160) * 0.5 : 0;

          let val = 0;
          if (distSq <= 1.0) {
            const z = Math.sqrt(1.0 - distSq);
            val = z * 0.65 + wave * 0.28 + mouseBonus;
          } else {
            val = (Math.sin(px * 0.03 + py * 0.02 + step) * 0.5 + 0.5) * 0.09 + mouseBonus * 0.4;
          }

          if (val > 0.06) {
            const gIdx = Math.min(glyphs.length - 1, Math.floor(val * (glyphs.length - 1)));
            const char = glyphs[gIdx];
            if (char !== ' ') {
              const alpha = Math.min(0.65, val * 0.75);
              // Holographic chromatic spectral coloring
              // Left: Violet (#C084FC) -> Indigo (#818CF8) -> Cyan (#38BDF8) -> Emerald (#34D399) on right
              const hueRatio = Math.max(0, Math.min(1, px / width));
              let r, g, b;
              if (hueRatio < 0.4) {
                const t = hueRatio / 0.4;
                r = Math.round(192 * (1 - t) + 129 * t);
                g = Math.round(132 * (1 - t) + 140 * t);
                b = Math.round(252 * (1 - t) + 248 * t);
              } else if (hueRatio < 0.75) {
                const t = (hueRatio - 0.4) / 0.35;
                r = Math.round(129 * (1 - t) + 56 * t);
                g = Math.round(140 * (1 - t) + 189 * t);
                b = Math.round(248 * (1 - t) + 248 * t);
              } else {
                const t = (hueRatio - 0.75) / 0.25;
                r = Math.round(56 * (1 - t) + 52 * t);
                g = Math.round(189 * (1 - t) + 211 * t);
                b = Math.round(248 * (1 - t) + 153 * t);
              }

              // Brighten crests towards luminescent white
              if (val > 0.45) {
                const w = Math.min(1, (val - 0.45) * 1.6);
                r = Math.round(r * (1 - w) + 255 * w);
                g = Math.round(g * (1 - w) + 255 * w);
                b = Math.round(b * (1 - w) + 255 * w);
              }

              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
              ctx.fillText(char, px, py);
            }
          }
        }
      }

      animFrameId = requestAnimationFrame(render);
    }

    render();
  }

  function initProcessObserver() {
    const cards = document.querySelectorAll('.process-step-card, .bench-preview-card');
    if (!cards.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.15 });

    cards.forEach(c => observer.observe(c));
  }

  return {
    init,
    getMode,
    setMode
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  BourseMotion.init();
});
