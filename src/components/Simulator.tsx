import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Trade } from '../types';
import * as A from '../utils/analytics';

const MONO: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };
const SERIF: React.CSSProperties = { fontFamily: 'Fraunces, serif' };
const BULL = '#00d4a8';
const BEAR = '#ff3b6b';
const ACCENT = '#ffb547';
const BLUE = '#4a9eff';

// Palette for RR scenario lines
const PALETTE = ['#ffb547', '#00d4a8', '#4a9eff', '#ff6b9d', '#c084fc', '#fb923c'];

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtPnL(n: number) {
  return (n >= 0 ? '+$' : '-$') + fmt(Math.abs(n));
}

function Section({ title, info, children }: { title: string; info?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ display: 'inline-block', width: 20, height: 2, background: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ ...SERIF, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text)' }}>{title}</span>
        {info && <span title={info} style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)' }}>ⓘ</span>}
      </div>
      {children}
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--text)',
    padding: '7px 11px', ...MONO, fontSize: 12, width: '100%', outline: 'none', borderRadius: 2,
  };
}

export default function Simulator({ trades }: { trades: Trade[] }) {
  const closed = A.getClosedTrades(trades);
  const origWR = A.calcWinRate(closed);
  const origRR = A.calcAvgRR(closed);
  const initialBalance = trades[0]?.initialBalance ?? 0;
  const origPnL = closed.reduce((s, t) => s + t.rPnL, 0);

  // RR Simulator — rows of (rr, wr) scenarios
  const defaultRows = [
    { rr: fmt(origRR), wr: fmt(origWR, 1) },
    { rr: fmt(origRR * 1.5, 1), wr: fmt(origWR, 1) },
    { rr: fmt(origRR * 2, 1), wr: fmt(origWR + 5, 1) },
    { rr: fmt(origRR * 0.5, 1), wr: fmt(origWR - 5, 1) },
  ];
  const [rows, setRows] = useState(defaultRows);
  const [mcIter, setMcIter] = useState(200);

  const scenarios = useMemo(() => rows.map((r, i) => {
    const rr = parseFloat(r.rr) || 0;
    const wr = parseFloat(r.wr) || 0;
    const sim = A.runRRSimulator(closed, rr, wr);
    const curve = A.buildRREquityCurve(closed, rr, wr);
    return { rr, wr, sim, curve, color: PALETTE[i % PALETTE.length] };
  }), [rows, closed]);

  // Build chart data — one point per trade index
  const rrChartData = useMemo(() => {
    const len = closed.length + 1;
    return Array.from({ length: len }, (_, i) => {
      const pt: Record<string, number> = { trade: i };
      scenarios.forEach((s, si) => { pt[`s${si}`] = s.curve[i] ?? 0; });
      return pt;
    });
  }, [scenarios, closed.length]);

  // Monte Carlo paths
  const mcPaths = useMemo(() => A.runMonteCarloPaths(closed, mcIter), [closed, mcIter]);
  const mcFinals = useMemo(() => mcPaths.map(p => p[p.length - 1]).sort((a, b) => a - b), [mcPaths]);

  const p10 = mcFinals[Math.floor(mcFinals.length * 0.1)] ?? 0;
  const p50 = mcFinals[Math.floor(mcFinals.length * 0.5)] ?? 0;
  const p90 = mcFinals[Math.floor(mcFinals.length * 0.9)] ?? 0;
  const probProfit = mcFinals.filter(v => v > initialBalance).length / (mcFinals.length || 1) * 100;

  // MC chart: sample up to 100 paths to avoid overdrawing
  const mcSample = useMemo(() => {
    const step = Math.max(1, Math.floor(mcPaths.length / 100));
    return mcPaths.filter((_, i) => i % step === 0);
  }, [mcPaths]);

  const mcChartData = useMemo(() => {
    const len = closed.length + 1;
    return Array.from({ length: len }, (_, i) => {
      const pt: Record<string, number> = { trade: i };
      mcSample.forEach((path, pi) => { pt[`p${pi}`] = path[i] ?? 0; });
      return pt;
    });
  }, [mcSample, closed.length]);

  function updateRow(i: number, field: 'rr' | 'wr', val: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }
  function addRow() {
    setRows(prev => [...prev, { rr: '2.0', wr: '50.0' }]);
  }
  function removeRow(i: number) {
    setRows(prev => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      {/* ── RR SIMULATOR ── */}
      <Section title="RR Simulator" info="Test different risk-reward setups to see how your trades would've performed under new conditions">
        {/* Equity curve chart */}
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rrChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="trade" tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 9 }} label={{ value: 'Trade #', position: 'insideBottom', offset: -2, style: { ...MONO, fill: 'var(--text-dim)', fontSize: 9 } }} />
            <YAxis tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 9 }} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} width={52} />
            <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--line)', ...MONO, fontSize: 10 }} labelFormatter={l => `Trade ${l}`} />
            <ReferenceLine y={initialBalance} stroke="var(--text-dim)" strokeDasharray="4 3" strokeWidth={1} />
            {scenarios.map((s, i) => (
              <Line key={i} type="monotone" dataKey={`s${i}`} stroke={s.color} strokeWidth={1.5} dot={false} name={`RR ${s.rr} / WR ${s.wr}%`} />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10, marginBottom: 20 }}>
          {scenarios.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 2, background: s.color }} />
              <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>RR {s.rr} / WR {s.wr}%</span>
            </div>
          ))}
        </div>

        {/* Results table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...MONO, fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                {['Input RR', 'Win Rate', 'Sim Wins', 'Sim Losses', 'Sim PnL', 'vs Original', ''].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-dim)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s, i) => {
                const diff = s.sim.simPnL - origPnL;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        <input type="number" step="0.1" min="0" value={rows[i].rr} onChange={e => updateRow(i, 'rr', e.target.value)} style={{ ...inputStyle(), width: 64 }} />
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <input type="number" step="1" min="0" max="100" value={rows[i].wr} onChange={e => updateRow(i, 'wr', e.target.value)} style={{ ...inputStyle(), width: 72 }} />
                    </td>
                    <td style={{ padding: '10px 12px', color: BULL }}>{s.sim.wins}</td>
                    <td style={{ padding: '10px 12px', color: BEAR }}>{s.sim.losses}</td>
                    <td style={{ padding: '10px 12px', color: s.sim.simPnL >= 0 ? BULL : BEAR, fontWeight: 700 }}>{fmtPnL(s.sim.simPnL)}</td>
                    <td style={{ padding: '10px 12px', color: diff >= 0 ? BULL : BEAR }}>{diff >= 0 ? '+' : ''}{fmtPnL(diff)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {rows.length > 1 && (
                        <button onClick={() => removeRow(i)} style={{ ...MONO, fontSize: 10, background: 'transparent', border: '1px solid var(--line)', color: 'var(--text-dim)', padding: '2px 8px', borderRadius: 2, cursor: 'pointer' }}>✕</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button onClick={addRow} style={{ ...MONO, fontSize: 10, letterSpacing: '0.1em', marginTop: 12, background: 'transparent', border: '1px solid var(--line)', color: 'var(--text-dim)', padding: '6px 16px', borderRadius: 2, cursor: 'pointer' }}>+ ADD SCENARIO</button>
      </Section>

      {/* ── MONTE CARLO ── */}
      <Section title="Monte Carlo Simulation" info="Randomly shuffles trade order across many iterations to estimate the probability distribution of outcomes">
        {/* Iteration selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.12em' }}>ITERATIONS</span>
          {[100, 200, 500, 1000].map(n => (
            <button key={n} onClick={() => setMcIter(n)} style={{
              ...MONO, fontSize: 10, padding: '4px 12px', borderRadius: 2, cursor: 'pointer',
              background: mcIter === n ? ACCENT + '22' : 'transparent',
              border: mcIter === n ? `1px solid ${ACCENT}` : '1px solid var(--line)',
              color: mcIter === n ? ACCENT : 'var(--text-dim)',
            }}>{n}</button>
          ))}
        </div>

        {/* Spaghetti equity paths chart */}
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={mcChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="trade" tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 9 }} label={{ value: 'Trade #', position: 'insideBottom', offset: -2, style: { ...MONO, fill: 'var(--text-dim)', fontSize: 9 } }} />
            <YAxis tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 9 }} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} width={52} />
            <ReferenceLine y={initialBalance} stroke={ACCENT} strokeDasharray="4 3" strokeWidth={1} />
            {mcSample.map((_, pi) => {
              const final = mcSample[pi][mcSample[pi].length - 1] ?? 0;
              const color = final >= initialBalance ? BULL : BEAR;
              return <Line key={pi} type="monotone" dataKey={`p${pi}`} stroke={color} strokeWidth={0.6} dot={false} strokeOpacity={0.25} isAnimationActive={false} />;
            })}
          </LineChart>
        </ResponsiveContainer>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', marginTop: 16, marginBottom: 12 }}>
          {[
            { label: '10th Percentile', value: '$' + fmt(p10), color: BEAR },
            { label: 'Median (50th)', value: '$' + fmt(p50), color: ACCENT },
            { label: '90th Percentile', value: '$' + fmt(p90), color: BULL },
            { label: 'Prob. Profitable', value: fmt(probProfit, 1) + '%', color: probProfit >= 50 ? BULL : BEAR },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-2)', padding: '14px 16px' }}>
              <div style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>{s.label}</div>
              <div style={{ ...SERIF, fontSize: 20, fontWeight: 600, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
          {[
            { label: 'Best Case', value: '$' + fmt(mcFinals[mcFinals.length - 1] ?? 0), color: BULL },
            { label: 'Worst Case', value: '$' + fmt(mcFinals[0] ?? 0), color: BEAR },
            { label: 'Initial Balance', value: '$' + fmt(initialBalance), color: BLUE },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-2)', padding: '14px 16px' }}>
              <div style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>{s.label}</div>
              <div style={{ ...SERIF, fontSize: 20, fontWeight: 600, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
