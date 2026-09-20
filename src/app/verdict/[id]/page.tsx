import React from 'react';
import { db } from '../../../lib/db';
import { notFound } from 'next/navigation';

export default async function VerdictPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await db.getSession(id);

  if (!session || !session.verdict) {
    notFound();
  }

  const { verdict, evidence } = session;

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Header Record */}
      <div style={{ borderBottom: '1px solid #242424', paddingBottom: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#9A9A9A' }}>
            VERDICT RECORD · {session.id}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#6E6E6E' }}>
            CONVENED: {session.createdAt}
          </span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: '0 0 12px 0' }}>{session.question}</h1>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: '#BDBDBD' }}>
          ASSET: <b>{session.assetName} ({session.ticker})</b>
        </div>
      </div>

      {/* Decision Summary Card */}
      <div
        style={{
          border: '1px solid #FFFFFF',
          background: '#0A0A0A',
          padding: '32px',
          marginBottom: '36px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
        }}
      >
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#6E6E6E', marginBottom: '6px' }}>
            COUNCIL OUTCOME
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 600, letterSpacing: '-0.02em' }}>{verdict.outcome}</div>
        </div>

        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#6E6E6E', marginBottom: '6px' }}>
            MAJORITY RATIO
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600 }}>{verdict.majorityRatio}</div>
          <div style={{ fontSize: '0.78rem', color: '#9A9A9A', marginTop: '4px' }}>{verdict.dissentBreakdown}</div>
        </div>

        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#6E6E6E', marginBottom: '6px' }}>
            TALEB POSITION SIZE BAND
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600 }}>{verdict.positionSizeBand}</div>
          <div style={{ fontSize: '0.78rem', color: '#9A9A9A', marginTop: '4px' }}>Conservative capital allocation</div>
        </div>
      </div>

      {/* Synthesis Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '36px' }}>
        <div style={{ border: '1px solid #242424', background: '#0A0A0A', padding: '24px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#FFFFFF', marginBottom: '8px' }}>
            KEY AGREEMENT
          </div>
          <p style={{ fontSize: '0.82rem', color: '#9A9A9A', margin: 0, lineHeight: 1.5 }}>{verdict.keyAgreement}</p>
        </div>

        <div style={{ border: '1px solid #242424', background: '#0A0A0A', padding: '24px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#FFFFFF', marginBottom: '8px' }}>
            KEY DISAGREEMENT
          </div>
          <p style={{ fontSize: '0.82rem', color: '#9A9A9A', margin: 0, lineHeight: 1.5 }}>{verdict.keyDisagreement}</p>
        </div>
      </div>

      {/* 9 Seats Individual Ballots */}
      <div style={{ marginBottom: '36px' }}>
        <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem', marginBottom: '16px', letterSpacing: '0.04em' }}>
          NINE-SEAT VOTING RECORD
        </h2>
        <div style={{ border: '1px solid #242424', background: '#0A0A0A' }}>
          {session.votes.map((v) => (
            <div
              key={v.seat}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 180px 100px 1fr',
                padding: '14px 20px',
                borderBottom: '1px solid #1A1A1A',
                fontSize: '0.82rem',
                alignItems: 'center',
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#6E6E6E' }}>SEAT 0{v.seat}</span>
              <span style={{ fontWeight: 600 }}>{v.persona}</span>
              <span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.75rem',
                    border: '1px solid #FFFFFF',
                    padding: '2px 8px',
                    background: v.vote === 'ADD' ? '#FFFFFF' : 'transparent',
                    color: v.vote === 'ADD' ? '#000000' : '#FFFFFF',
                  }}
                >
                  {v.vote}
                </span>
              </span>
              <span style={{ color: '#9A9A9A', fontSize: '0.78rem' }}>{v.rationale}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Triggers Section */}
      <div style={{ border: '1px solid #242424', background: '#0A0A0A', padding: '24px', marginBottom: '36px' }}>
        <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.88rem', margin: '0 0 12px 0' }}>
          PERMANENT REVIEW TRIGGERS
        </h2>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: '#9A9A9A', lineHeight: 1.6 }}>
          {verdict.reviewTriggers.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>

      {/* F8 Dynamic OG Link */}
      <div style={{ textAlign: 'center', borderTop: '1px solid #242424', paddingTop: '24px' }}>
        <a
          href={`/api/og?id=${session.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#FFFFFF', textDecoration: 'underline' }}
        >
          View 1200×630 Dynamic Open Graph Social Card Preview →
        </a>
      </div>
    </div>
  );
}
