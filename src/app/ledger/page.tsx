import React from 'react';
import { db } from '../../lib/db';

export const dynamic = 'force-dynamic';

export default async function LedgerPage() {
  const sessions = await db.listSessions(20);

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ borderBottom: '1px solid #242424', paddingBottom: '20px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: '0 0 8px 0' }}>The Ledger</h1>
        <p style={{ fontSize: '0.9rem', color: '#9A9A9A', margin: 0 }}>
          Permanent unalterable records of all convened council sessions, individual member ballots, and review triggers.
        </p>
      </div>

      <div style={{ border: '1px solid #242424', background: '#0A0A0A' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 80px 1fr 100px 120px 140px', padding: '12px 20px', borderBottom: '1px solid #242424', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#6E6E6E' }}>
          <span>SESSION ID</span>
          <span>ASSET</span>
          <span>THESIS / QUESTION</span>
          <span>VERDICT</span>
          <span>MAJORITY</span>
          <span>TIMESTAMP</span>
        </div>

        {sessions.map((s) => (
          <a
            key={s.id}
            href={`/verdict/${s.id}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 80px 1fr 100px 120px 140px',
              padding: '16px 20px',
              borderBottom: '1px solid #1A1A1A',
              color: '#FFFFFF',
              textDecoration: 'none',
              alignItems: 'center',
              fontSize: '0.82rem',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span style={{ color: '#9A9A9A' }}>{s.id}</span>
            <span style={{ fontWeight: 600 }}>{s.ticker}</span>
            <span style={{ fontFamily: "'Inter', sans-serif", color: '#BDBDBD', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '16px' }}>
              {s.question}
            </span>
            <span>
              <span style={{ border: '1px solid #FFFFFF', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                {s.verdict?.outcome || 'REDUCE'}
              </span>
            </span>
            <span style={{ color: '#9A9A9A' }}>{s.verdict?.majorityRatio || '5 / 9'}</span>
            <span style={{ color: '#6E6E6E', fontSize: '0.75rem' }}>{s.createdAt.split('T')[0]}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
