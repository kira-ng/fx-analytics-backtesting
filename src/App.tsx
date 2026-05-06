import { useState, useEffect } from 'react';
import type { Trade } from './types';
import CsvUpload from './components/CsvUpload';
import Performance from './components/Performance';
import Drawdown from './components/Drawdown';
import Simulator from './components/Simulator';

type Tab = 'performance' | 'drawdown' | 'simulation';
const TABS: { id: Tab; label: string }[] = [
  { id: 'performance', label: '↗ Performance' },
  { id: 'drawdown',    label: '↘ Drawdown' },
  { id: 'simulation',  label: '⚙ Simulation' },
];

function getDateRange(trades: Trade[]) {
  if (!trades.length) return '';
  const dates = trades.map(t => t.dateStart.split(' ')[0]).sort();
  return `${dates[0]} — ${dates[dates.length - 1]}`;
}

const MONO: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

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

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        background: 'var(--bg-2)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line)',
        boxShadow: theme === 'dark' ? '0 1px 24px rgba(0,0,0,0.4)' : '0 1px 16px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* logo mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', width: 28, height: 28 }}>
              {/* chart bars icon */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="2"  y="16" width="5" height="10" rx="1" fill="#ffb547" opacity="0.9"/>
                <rect x="9"  y="10" width="5" height="16" rx="1" fill="#ffb547" opacity="0.7"/>
                <rect x="16" y="6"  width="5" height="20" rx="1" fill="#00d4a8" opacity="0.85"/>
                <rect x="23" y="12" width="5" height="14" rx="1" fill="#4a9eff" opacity="0.7"/>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{
                ...MONO, fontSize: 14, fontWeight: 800, letterSpacing: '0.12em', lineHeight: 1,
                color: 'var(--text)',
              }}>FX <span style={{
                background: 'linear-gradient(90deg, #ffb547, #ff8c00)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>ANALYTICS</span></span>
              <span style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.2em' }}>BACKTESTING</span>
            </div>
          </div>

          {hasTrades && <>
            <div style={{ width: 1, height: 28, background: 'var(--line)', margin: '0 4px' }} />
            {/* live dot */}
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--bull)', boxShadow: '0 0 8px var(--bull)',
              display: 'inline-block', animation: 'pulse 2s infinite', flexShrink: 0,
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ ...MONO, fontSize: 12, fontWeight: 700, color: 'var(--blue)', letterSpacing: '0.06em' }}>{trades[0]?.pair}</span>
              <span style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>{getDateRange(trades)}</span>
            </div>
          </>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              ...MONO, height: 32, width: 32, borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--line)',
              color: 'var(--text-dim)', fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-dim)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'; }}
          >{theme === 'dark' ? '☀' : '☾'}</button>

          <button
            onClick={() => setTrades([])}
            style={{
              ...MONO, height: 32, fontSize: 10, letterSpacing: '0.12em',
              background: 'transparent', border: '1px solid var(--line)',
              color: 'var(--text-dim)', padding: '0 16px', borderRadius: 2,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-dim)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'; }}
          >UPLOAD NEW CSV</button>
        </div>
      </header>

      {!hasTrades ? (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <CsvUpload onLoad={t => { setTrades(t); setActiveTab('performance'); }} />
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0,
            padding: '0 32px',
            background: 'var(--bg-2)',
            borderBottom: '1px solid var(--line)',
          }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  ...MONO, fontSize: 11, letterSpacing: '0.1em',
                  padding: '0 22px', height: 44,
                  background: 'transparent', border: 'none',
                  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                  color: active ? 'var(--text)' : 'var(--text-dim)',
                  fontWeight: active ? 700 : 400,
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  marginBottom: '-1px',
                }}>{tab.label}</button>
              );
            })}
          </div>

          {/* Content */}
          <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 28px 80px' }}>
            {activeTab === 'performance' && <Performance trades={trades} />}
            {activeTab === 'drawdown'    && <Drawdown trades={trades} />}
            {activeTab === 'simulation'  && <Simulator trades={trades} />}
          </main>
        </div>
      )}
    </div>
  );
}
