/**
 * Bourse Chamber — LocalStorage Persistence Layer
 * Auto-seeds demo sessions, ensures data consistency across reloads and shares
 */

const BourseStorage = (() => {
  const STORAGE_KEYS = {
    SESSIONS: 'bourse_sessions',
    VERDICTS: 'bourse_verdicts',
    PREFERENCES: 'bourse_preferences'
  };

  // In-memory fallback if localStorage is blocked
  let memorySessions = [];

  function isLocalStorageAvailable() {
    try {
      const test = '__bourse_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Initializes storage with SEED_SESSIONS if empty
   */
  function init() {
    if (!isLocalStorageAvailable()) {
      if (typeof BourseMockData !== 'undefined' && BourseMockData.SEED_SESSIONS) {
        memorySessions = JSON.parse(JSON.stringify(BourseMockData.SEED_SESSIONS));
      }
      return;
    }

    try {
      const existing = window.localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!existing || JSON.parse(existing).length === 0) {
        if (typeof BourseMockData !== 'undefined' && BourseMockData.SEED_SESSIONS) {
          window.localStorage.setItem(
            STORAGE_KEYS.SESSIONS,
            JSON.stringify(BourseMockData.SEED_SESSIONS)
          );
        }
      }
    } catch (e) {
      console.warn('BourseStorage initialization warning:', e);
    }
  }

  // Run init immediately on load
  init();

  /**
   * Retrieve all saved sessions
   */
  function getSessions() {
    if (!isLocalStorageAvailable()) {
      return memorySessions;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!raw) return (typeof BourseMockData !== 'undefined' ? BourseMockData.SEED_SESSIONS : []);
      const parsed = JSON.parse(raw);
      // If parsed list is somehow empty, re-seed
      if (parsed.length === 0 && typeof BourseMockData !== 'undefined' && BourseMockData.SEED_SESSIONS) {
        init();
        return BourseMockData.SEED_SESSIONS;
      }
      return parsed;
    } catch (e) {
      console.error('Error reading sessions from localStorage:', e);
      return memorySessions;
    }
  }

  /**
   * Retrieve a specific session by its ID (e.g. BC-0411)
   */
  function getSessionById(id) {
    if (!id) return null;
    const cleanId = id.trim().toUpperCase();
    const sessions = getSessions();
    return sessions.find(s => s.id.toUpperCase() === cleanId) || null;
  }

  /**
   * Save or update a session
   */
  function saveSession(session) {
    if (!session || !session.id) return false;
    const sessions = getSessions();
    const existingIndex = sessions.findIndex(s => s.id.toUpperCase() === session.id.toUpperCase());

    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session); // Add newest to the top
    }

    if (!isLocalStorageAvailable()) {
      memorySessions = sessions;
      return true;
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      return true;
    } catch (e) {
      console.error('Error saving session to localStorage:', e);
      return false;
    }
  }

  /**
   * Dynamically calculate summary metrics from real stored sessions
   */
  function getLedgerMetrics() {
    const sessions = getSessions();
    const totalSessions = sessions.length;
    if (totalSessions === 0) {
      return {
        totalSessions: 0,
        votedIn: 0,
        votedInPercent: '0%',
        avgMajority: '0.0 / 9',
        medianSizeBand: '0.0%'
      };
    }

    let addCount = 0;
    let totalMajoritySum = 0;
    const sizeBandValues = [];

    sessions.forEach(s => {
      if (s.verdict) {
        if (s.verdict.outcome === 'ADD') addCount++;
        if (s.verdict.majorityRatio) {
          const parts = s.verdict.majorityRatio.split('/');
          const num = parseFloat(parts[0]);
          if (!isNaN(num)) totalMajoritySum += num;
        }
        if (s.verdict.positionSizeBand) {
          // Parse e.g. "3.0 – 5.0%" or "2.5%"
          const match = s.verdict.positionSizeBand.match(/([0-9.]+)/);
          if (match) sizeBandValues.push(parseFloat(match[1]));
        }
      }
    });

    const avgMajorityVal = (totalMajoritySum / totalSessions).toFixed(1);
    sizeBandValues.sort((a, b) => a - b);
    const medianSize = sizeBandValues.length > 0 
      ? sizeBandValues[Math.floor(sizeBandValues.length / 2)].toFixed(1) + '%'
      : '2.0%';

    return {
      totalSessions,
      votedIn: addCount,
      votedInPercent: `${Math.round((addCount / totalSessions) * 100)}%`,
      avgMajority: `${avgMajorityVal} / 9`,
      medianSizeBand: medianSize
    };
  }

  /**
   * Dynamically calculate real persona voting records across all recorded sessions
   */
  function getAgentVotingRecord(seatOrShortName) {
    const sessions = getSessions();
    const cleanSeat = typeof seatOrShortName === 'number' ? seatOrShortName : parseInt(seatOrShortName, 10);
    const cleanName = typeof seatOrShortName === 'string' ? seatOrShortName.trim().toLowerCase() : null;

    let participated = 0;
    let votedFor = 0;
    let dissents = 0;
    let passCount = 0;
    const recordedVotes = [];

    sessions.forEach(s => {
      if (!s.votes || !Array.isArray(s.votes)) return;
      const v = s.votes.find(vote => {
        if (!isNaN(cleanSeat) && vote.seat === cleanSeat) return true;
        if (cleanName) {
          const vName = (vote.name || vote.persona || '').toLowerCase();
          const vShort = (vote.shortName || '').toLowerCase();
          return vName.includes(cleanName) || vShort === cleanName;
        }
        return false;
      });

      if (v) {
        participated++;
        const voteUpper = (v.vote || '').toUpperCase();
        if (voteUpper === 'ADD') {
          votedFor++;
        } else if (voteUpper === 'REDUCE') {
          dissents++;
        } else {
          passCount++;
          // PASS counts as dissent if the final chamber verdict was ADD
          if (s.verdict && s.verdict.outcome === 'ADD') {
            dissents++;
          }
        }

        recordedVotes.push({
          sessionId: s.id,
          ticker: s.ticker,
          assetName: s.assetName || s.ticker,
          vote: voteUpper,
          rationale: v.rationale || v.reason || '',
          outcome: s.verdict ? s.verdict.outcome : null,
          date: s.createdAt ? s.createdAt.slice(0, 10) : ''
        });
      }
    });

    return {
      sessions: participated,
      votedFor,
      dissents,
      passCount,
      votes: recordedVotes
    };
  }

  /**
   * Reset to default initial seed data
   */
  function resetDemoData() {
    if (typeof BourseMockData !== 'undefined' && BourseMockData.SEED_SESSIONS) {
      if (isLocalStorageAvailable()) {
        window.localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(BourseMockData.SEED_SESSIONS));
      }
      memorySessions = JSON.parse(JSON.stringify(BourseMockData.SEED_SESSIONS));
    }
  }

  return {
    init,
    getSessions,
    getSessionById,
    saveSession,
    getLedgerMetrics,
    getAgentVotingRecord,
    resetDemoData
  };
})();

// Export for window or Node/CommonJS
if (typeof window !== 'undefined') {
  window.BourseStorage = BourseStorage;
}
if (typeof global !== 'undefined') {
  global.BourseStorage = BourseStorage;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BourseStorage;
}
