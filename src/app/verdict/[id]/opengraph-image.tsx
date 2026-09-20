import { ImageResponse } from 'next/og';
import { db } from '../../../lib/db';

export const runtime = 'edge';
export const alt = 'Bourse Chamber Verdict Record';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await db.getSession(id);

  const asset = session?.ticker || 'SOL';
  const verdict = session?.verdict?.outcome || 'REDUCE';
  const ratio = session?.verdict?.majorityRatio || '5 / 9';
  const sizeBand = session?.verdict?.positionSizeBand || '1.0 – 2.0%';
  const isAdd = verdict === 'ADD';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#050505',
          padding: '60px 80px',
          border: '8px solid #242424',
          fontFamily: 'monospace',
          color: '#FFFFFF',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#FFFFFF' }} />
            <span style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '0.04em' }}>
              BOURSE CHAMBER
            </span>
          </div>
          <span style={{ fontSize: '20px', color: '#9A9A9A' }}>
            SESSION {id}
          </span>
        </div>

        {/* Center Verdict Block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '22px', color: '#6E6E6E', letterSpacing: '0.08em' }}>
            PERMANENT COUNCIL VERDICT · ASSET: {asset}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            <div
              style={{
                backgroundColor: isAdd ? '#FFFFFF' : '#1A1A1A',
                color: isAdd ? '#000000' : '#FFFFFF',
                border: '3px solid #FFFFFF',
                padding: '16px 40px',
                fontSize: '64px',
                fontWeight: 'bold',
                letterSpacing: '0.04em',
              }}
            >
              {verdict}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{ratio} MAJORITY</div>
              <div style={{ fontSize: '20px', color: '#9A9A9A' }}>
                Position Size Band: {sizeBand}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '2px solid #242424',
            paddingTop: '24px',
            fontSize: '18px',
            color: '#6E6E6E',
          }}
        >
          <span>NINE PERSONAS · ONE VERDICT · IMMUTABLE LEDGER</span>
          <span>bourse-chamber.vercel.app</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
