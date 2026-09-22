/**
 * Bourse Chamber — Utility Functions
 * Deterministic pixel avatars, formatting, timing, ID generation, clipboard
 */

const BourseUtils = (() => {
  /**
   * Deterministic 32-bit FNV-1a hash
   */
  function hashString(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  /**
   * Generates a deterministic 8x8 monochrome pixel avatar SVG
   * Symmetrical horizontally for iconic, dignified heraldic/institutional aesthetic.
   */
  function generatePixelAvatarSVG(nameOrAgent, size = 48) {
    const name = typeof nameOrAgent === 'object' ? (nameOrAgent?.name || '') : String(nameOrAgent || '');
    if (/satoshi/i.test(name)) {
      return `<img src="/img/satoshi.png" alt="Satoshi Nakamoto" class="persona-avatar-img" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:2px;display:block;" onerror="this.onerror=null;this.src='img/satoshi.png';" />`;
    }
    if (/vitalik/i.test(name)) {
      return `<img src="/img/vitalik.png" alt="Vitalik Buterin" class="persona-avatar-img" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:2px;display:block;" onerror="this.onerror=null;this.src='img/vitalik.png';" />`;
    }
    if (/finney/i.test(name)) {
      return `<img src="/img/finney.png" alt="Hal Finney" class="persona-avatar-img" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:2px;display:block;" onerror="this.onerror=null;this.src='img/finney.png';" />`;
    }
    const hash = hashString(name);
    const gridSize = 8;
    const halfGrid = 4;
    const pixelSize = size / gridSize;
    
    // Seeded pseudo-random bit generator
    let seed = hash;
    function nextBit() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed >> 16) % 2 === 1;
    }

    let rects = '';
    // Background
    rects += `<rect width="${size}" height="${size}" fill="#080808" />`;
    rects += `<rect x="0.5" y="0.5" width="${size - 1}" height="${size - 1}" fill="none" stroke="#242424" stroke-width="1" />`;

    // 8x8 symmetrical grid
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < halfGrid; x++) {
        // High density in center rows, structured border
        const isCore = (y >= 1 && y <= 6 && x >= 1);
        const active = nextBit() || isCore;
        if (active) {
          const x1 = x * pixelSize;
          const x2 = (gridSize - 1 - x) * pixelSize;
          const yPos = y * pixelSize;
          
          // Primary pixel color: white (#FFFFFF)
          const fill = '#FFFFFF';
          rects += `<rect x="${x1}" y="${yPos}" width="${pixelSize}" height="${pixelSize}" fill="${fill}" />`;
          if (x1 !== x2) {
            rects += `<rect x="${x2}" y="${yPos}" width="${pixelSize}" height="${pixelSize}" fill="${fill}" />`;
          }
        }
      }
    }

    return `<svg class="pixel-avatar-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" aria-label="Avatar for ${name}">${rects}</svg>`;
  }

  /**
   * Generates a session ID (e.g. BC-0842)
   */
  function generateSessionId() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `BC-${num}`;
  }

  /**
   * Formats current or given time as HH:MM:SS
   */
  function formatTimestamp(date = new Date()) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  /**
   * Formats date as e.g. "19 Sep 2026"
   */
  function formatDate(date = new Date()) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  /**
   * Format numbers into human-readable financial strings
   */
  function formatUSD(num) {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${Number(num).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }

  /**
   * Async delay helper
   */
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Copies text to clipboard and returns true if succeeded
   */
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
      return false;
    }
  }

  /**
   * Toast notification HUD
   */
  function showToast(message, duration = 2400) {
    let container = document.getElementById('bourse-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'bourse-toast-container';
      container.className = 'bourse-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'bourse-toast';
    toast.innerHTML = `<span class="toast-dot"></span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Detect prefers-reduced-motion
   */
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  return {
    hashString,
    generatePixelAvatarSVG,
    generateSessionId,
    formatTimestamp,
    formatDate,
    formatUSD,
    sleep,
    copyToClipboard,
    showToast,
    prefersReducedMotion
  };
})();

// Export for Node/CommonJS if applicable
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BourseUtils;
}
