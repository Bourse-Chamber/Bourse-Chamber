import React from 'react';
import { CRYPTO_AGENTS } from '../../lib/crypto-agents';

export default function CryptoBenchPage() {
  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ borderBottom: '1px solid #242424', paddingBottom: '20px', marginBottom: '36px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: '0 0 8px 0' }}>The Crypto Bench</h1>
        <p style={{ fontSize: '0.9rem', color: '#9A9A9A', margin: 0, maxWidth: '680px' }}>
          Nine architects, five crypto schools, one standard: no narrative survives without code and incentives. Inspect the doctrines, questioning criteria, and evaluation frameworks of the nine crypto pioneers.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {CRYPTO_AGENTS.map((agent) => (
          <div
            key={agent.seat}
            style={{
              background: '#0A0A0A',
              border: '1px solid #242424',
              padding: '28px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#6E6E6E' }}>
                  SEAT 0{agent.seat}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#FFFFFF', border: '1px solid #242424', padding: '2px 8px' }}>
                  {agent.era}
                </span>
              </div>
              <h2 style={{ fontSize: '1.4rem', margin: '0 0 4px 0', fontWeight: 600 }}>{agent.name}</h2>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#9A9A9A', marginBottom: '16px' }}>
                {agent.discipline}
              </div>
              <p style={{ fontSize: '0.82rem', color: '#BDBDBD', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                {agent.bio}
              </p>
              <div style={{ borderLeft: '2px solid #FFFFFF', paddingLeft: '12px', fontStyle: 'italic', fontSize: '0.82rem', color: '#9A9A9A' }}>
                "{agent.quote}"
              </div>
            </div>

            <div style={{ background: '#050505', border: '1px solid #1A1A1A', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#6E6E6E', marginBottom: '4px' }}>PRIMARY EVALUATION METRIC</div>
                <div style={{ fontSize: '0.82rem', color: '#FFFFFF' }}>{agent.primaryMetric}</div>
              </div>

              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#6E6E6E', marginBottom: '4px' }}>FATAL FLAW IN CRYPTO</div>
                <div style={{ fontSize: '0.82rem', color: '#9A9A9A' }}>{agent.fatalFlaw}</div>
              </div>

              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#6E6E6E', marginBottom: '4px' }}>FIRST QUESTION ON CONVENING</div>
                <div style={{ fontSize: '0.82rem', color: '#FFFFFF', fontFamily: "'JetBrains Mono', monospace" }}>"{agent.firstQuestion}"</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
