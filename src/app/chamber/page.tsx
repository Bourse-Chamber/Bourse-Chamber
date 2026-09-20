import React from 'react';
import { AGENTS } from '../../lib/agents';

export default function ChamberPage() {
  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Session Metadata Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 600, margin: '0 0 4px 0' }}>Session floor</h1>
          <p style={{ fontSize: '0.82rem', color: '#9A9A9A', margin: 0 }}>
            Put a ticker or a thesis on the table. All nine speak in turn, two cross-examine, then the vote is tallied and recorded.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', border: '1px solid #242424', padding: '6px 14px', background: '#0A0A0A' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF' }} />
            FLOOR READY
          </span>
          <span style={{ color: '#6E6E6E' }}>|</span>
          <span>Seats present: <b>9 / 9</b></span>
          <span style={{ color: '#6E6E6E' }}>|</span>
          <span>AI: <b>OpenRouter / Fallback</b></span>
        </div>
      </div>

      {/* Stage Container */}
      <div style={{ background: '#080808', border: '1px solid #242424', minHeight: '480px', padding: '24px', position: 'relative', marginBottom: '24px' }}>
        {/* Central Live Transcript Hub */}
        <div style={{ maxWidth: '640px', margin: '0 auto', background: '#0A0A0A', border: '1px solid #242424', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #242424', paddingBottom: '10px', marginBottom: '14px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#9A9A9A' }}>
            <span>CENTRAL TRANSCRIPT FEED</span>
            <span>00:00:00 UTC</span>
          </div>

          <div style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem', lineHeight: 1.5 }}>
            <div style={{ borderLeft: '2px solid #FFFFFF', paddingLeft: '12px' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#6E6E6E', marginBottom: '2px' }}>CHAIR · CONVENING</div>
              <div style={{ color: '#FFFFFF' }}>Chamber floor is clear. Present a crypto ticker or investment thesis below to convene the council.</div>
            </div>
          </div>
        </div>

        {/* 9 Seats Flank Preview */}
        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
          {AGENTS.map((agent) => (
            <div key={agent.seat} style={{ border: '1px solid #1A1A1A', background: '#050505', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#6E6E6E' }}>SEAT 0{agent.seat}</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#FFF' }}>{agent.shortName}</div>
              <div style={{ fontSize: '0.65rem', color: '#9A9A9A', marginTop: '2px' }}>WAITING</div>
            </div>
          ))}
        </div>
      </div>

      {/* Composer Section */}
      <div style={{ background: '#0A0A0A', border: '1px solid #242424', padding: '16px 20px' }}>
        <form style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Present a ticker or a thesis to the committee (e.g. BTC, or @graham is SOL an enduring moat?)"
            style={{
              flex: 1,
              minWidth: '280px',
              background: '#050505',
              border: '1px solid #242424',
              color: '#FFFFFF',
              padding: '12px 16px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              background: '#FFFFFF',
              color: '#000000',
              border: 'none',
              padding: '12px 24px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ask the full bench (9)
          </button>
        </form>
      </div>
    </div>
  );
}
