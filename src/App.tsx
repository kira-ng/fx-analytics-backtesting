import { useState, useEffect } from 'react';
import type { Trade } from './types';
import CsvUpload from './components/CsvUpload';
import Performance from './components/Performance';
import Drawdown from './components/Drawdown';
import Simulator from './components/Simulator';

type Tab = 'performance' | 'drawdown' | 'simulation';
const TABS: { id: Tab; num: string; label: string }[] = [
  { id: 'performance', num: '01', label: 'PERFORMANCE' },
  { id: 'drawdown',    num: '02', label: 'DRAWDOWN' },
  { id: 'simulation',  num: '03', label: 'SIMULATOR' },
];

function getDateRange(trades: Trade[]) {
  if (!trades.length) return '';
  const dates = trades.map(t => t.dateStart.split(' ')[0].replace(/\//g, '-')).sort();
  return `${dates[0]} — ${dates[dates.length - 1]}`;
}

const MONO: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };
const SERIF: React.CSSProperties = { fontFamily: 'Fraunces, serif' };

export default function App() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('performance');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark');
  const hasTrades = trades.length > 0;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      {/* subtle grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: theme === 'dark'
          ? 'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)'
          : 'linear-gradient(rgba(0,0,0,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.03) 1px,transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Header — only shown when trades loaded */}
      {hasTrades && <header style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        {/* Top mini bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 32,
        }}>
          {/* Left: dot + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--bull)', boxShadow: '0 0 8px var(--bull)',
              display: 'inline-block', animation: 'pulse 2s infinite',
            }} />
            <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.18em' }}>BACKTEST ANALYTICS</span>
          </div>

          {/* Right: theme + upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              style={{
                ...MONO, height: 28, width: 28, borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: '1px solid var(--line)',
                color: 'var(--text-dim)', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-dim)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'; }}
            >{theme === 'dark' ? '☀' : '☾'}</button>

            <button
              onClick={() => setTrades([])}
              style={{
                ...MONO, height: 28, fontSize: 10, letterSpacing: '0.12em',
                background: 'transparent', border: '1px solid var(--line)',
                color: 'var(--text-dim)', padding: '0 14px', borderRadius: 2,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-dim)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'; }}
            >UPLOAD NEW CSV</button>
          </div>
        </div>

        {/* Hero title */}
        <div style={{ paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, lineHeight: 1 }}>
            <span style={{ fontFamily: 'Inter Tight, sans-serif', fontSize: 42, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>FX</span>
            <span style={{ ...SERIF, fontSize: 42, fontWeight: 600, fontStyle: 'italic', color: 'var(--accent)', letterSpacing: '-0.01em' }}>Analytics</span>
          </div>
          {hasTrades && (
            <div style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', marginTop: 4, letterSpacing: '0.04em' }}>
              {trades[0]?.pair} · {getDateRange(trades)}
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0,
          paddingTop: 28,
          borderBottom: '1px solid var(--line)',
        }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                ...MONO, fontSize: 11, letterSpacing: '0.13em',
                padding: '10px 28px', marginBottom: '-1px',
                background: 'transparent', border: 'none',
                borderBottom: active ? '3px solid var(--accent)' : '3px solid transparent',
                color: active ? 'var(--text)' : 'var(--text-dim)',
                fontWeight: active ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <span style={{ color: active ? 'var(--accent)' : 'var(--text-faint)', marginRight: 7, fontSize: 10 }}>{tab.num}</span>
                <span style={{ marginRight: 7, opacity: 0.3 }}>—</span>
                {tab.label}
              </button>
            );
          })}
        </div>
        </div>{/* end maxWidth wrapper */}
      </header>}

      {!hasTrades ? (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <CsvUpload onLoad={t => { setTrades(t); setActiveTab('performance'); }} />
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 28px 80px' }}>
            {activeTab === 'performance' && <Performance trades={trades} />}
            {activeTab === 'drawdown'    && <Drawdown trades={trades} />}
            {activeTab === 'simulation'  && <Simulator trades={trades} />}
          </main>
        </div>
      )}
    </div>
  );
}
