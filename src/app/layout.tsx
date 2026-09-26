import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Bourse Chamber — Nine Crypto Architects. One Market That Refuses to Behave.',
  description: 'AI-powered crypto investment courtroom where nine canonical crypto architects debate theses, cast recorded ballots, and generate permanent unalterable verdicts.',
  metadataBase: new URL('https://bourse-chamber.vercel.app'),
  openGraph: {
    title: 'Bourse Chamber — Nine Crypto Architects. One Market That Refuses to Behave.',
    description: 'AI-powered crypto investment courtroom. Nine crypto architects. One verdict.',
    url: 'https://bourse-chamber.vercel.app',
    siteName: 'Bourse Chamber',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bourse Chamber',
    description: 'Nine crypto architects. One market that refuses to behave.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ background: '#050505', color: '#FFFFFF' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#050505',
          color: '#FFFFFF',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          minHeight: '100vh',
        }}
      >
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'rgba(5, 5, 5, 0.92)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid #242424',
            padding: '12px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: '#FFFFFF',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              fontSize: '0.9rem',
              letterSpacing: '0.04em',
            }}
          >
            <span className="logo-mark-wrap">
              <img className="logo-mark-img" src="/img/logo-icon.png" alt="Bourse Chamber" width={24} height={24} style={{ display: 'block' }} />
            </span>
            <span>Bourse Chamber</span>
          </a>

          <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <a href="/" style={{ color: '#9A9A9A', textDecoration: 'none', fontSize: '0.85rem' }}>
              Overview
            </a>
            <a href="/chamber" style={{ color: '#9A9A9A', textDecoration: 'none', fontSize: '0.85rem' }}>
              Council Chamber
            </a>
            <a href="/crypto-bench" style={{ color: '#9A9A9A', textDecoration: 'none', fontSize: '0.85rem' }}>
              Crypto Bench
            </a>
            <a href="/ledger" style={{ color: '#9A9A9A', textDecoration: 'none', fontSize: '0.85rem' }}>
              Ledger
            </a>
            <a
              href="https://x.com/boursechamber"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#FFFFFF',
                border: '1px solid #242424',
                padding: '6px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
              title="Follow on X"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="/chamber"
              style={{
                background: '#FFFFFF',
                color: '#000000',
                padding: '6px 14px',
                textDecoration: 'none',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              Start Convening
            </a>
          </nav>
        </header>

        <main>{children}</main>

        <footer
          style={{
            borderTop: '1px solid #242424',
            padding: '24px',
            marginTop: '60px',
            fontSize: '0.75rem',
            color: '#6E6E6E',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            Educational simulation. AI personas built from published investing philosophies — not financial advice.
          </div>
          <div>© 2026 Bourse Chamber</div>
        </footer>
      </body>
    </html>
  );
}
