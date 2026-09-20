import React from 'react';
import { AGENTS } from '../lib/agents';

export default function HomePage() {
  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Hero Section */}
      <section style={{ marginBottom: '64px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#9A9A9A', letterSpacing: '0.08em', marginBottom: '16px' }}>
          BOURSE CHAMBER · NINE PERSONAS · ONE VERDICT
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 20px 0' }}>
          Nine economists.<br />
          One market that refuses to behave.
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#9A9A9A', maxWidth: '640px', lineHeight: 1.5, margin: '0 0 32px 0' }}>
          The courtroom where Graham, Munger, Lynch, Wood, Damodaran, Taleb, Pabrai, Ackman, and Burry debate your crypto thesis in real time, cast immutable ballots, and generate a permanent ledger verdict.
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <a
            href="/chamber"
            style={{
              background: '#FFFFFF',
              color: '#000000',
              padding: '12px 24px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.88rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Convene the Council Floor →
          </a>
          <a
            href="/verdict/BC-0411"
            style={{
              border: '1px solid #242424',
              color: '#FFFFFF',
              padding: '12px 24px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.88rem',
              textDecoration: 'none',
            }}
          >
            Inspect Demo Verdict (SOL)
          </a>
        </div>
      </section>

      {/* 9 Seats Grid */}
      <section style={{ marginBottom: '64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #242424', paddingBottom: '12px', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem', letterSpacing: '0.04em', margin: 0 }}>
            THE NINE PERMANENT SEATS
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#6E6E6E', fontFamily: "'JetBrains Mono', monospace" }}>
            9 SEATS · UNCOMPROMISING REASONING
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {AGENTS.map((agent) => (
            <div
              key={agent.seat}
              style={{
                background: '#0A0A0A',
                border: '1px solid #242424',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#6E6E6E' }}>
                    SEAT 0{agent.seat}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#FFFFFF', border: '1px solid #242424', padding: '2px 6px' }}>
                    {agent.discipline}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', fontWeight: 600 }}>{agent.name}</h3>
                <p style={{ fontSize: '0.78rem', color: '#9A9A9A', margin: '0 0 14px 0', lineHeight: 1.4 }}>{agent.bio}</p>
              </div>

              <div style={{ borderTop: '1px solid #1A1A1A', paddingTop: '10px', fontSize: '0.72rem', color: '#6E6E6E', fontFamily: "'JetBrains Mono', monospace" }}>
                "{agent.firstQuestion}"
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
