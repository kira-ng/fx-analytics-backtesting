import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell,
} from 'recharts';
import type { Trade } from '../types';
import * as A from '../utils/analytics';

const MONO: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };
const SERIF: React.CSSProperties = { fontFamily: 'Fraunces, serif' };
const BULL = '#00d4a8';
const BEAR = '#ff3b6b';
const ACCENT = '#ffb547';

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

interface TipProps { active?: boolean; payload?: { value: number; name: string }[]; label?: string }
function DdTip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '8px 12px', ...MONO, fontSize: 11 }}>
      <div style={{ color: 'var(--text-dim)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: BEAR }}>{p.name}: {fmt(Number(p.value), 2)}%</div>
      ))}
    </div>
  );
}

function MaeTip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '8px 12px', ...MONO, fontSize: 11 }}>
      <div style={{ color: 'var(--text-dim)', marginBottom: 4 }}>MAE {label}R</div>
      <div style={{ color: BEAR }}>Trades: {payload[0]?.value}</div>
    </div>
  );
}

function SectionHeader({ title, info }: { title: string; info?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <span style={{ display: 'inline-block', width: 20, height: 2, background: 'var(--accent)', flexShrink: 0 }} />
      <span style={{ ...SERIF, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text)' }}>{title}</span>
      {info && <span title={info} style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)' }}>ⓘ</span>}
    </div>
  );
}

function MiniStat({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '14px 18px' }}>
      <div style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ ...SERIF, fontSize: 24, fontWeight: 600, color: color ?? 'var(--text)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function Drawdown({ trades }: { trades: Trade[] }) {
  const closed = A.getClosedTrades(trades);
  const { maxDD, avgDD } = A.calcDrawdown(closed);
  const recovery = A.calcTimeToRecovery(closed);
  const mae = A.calcMAE(closed);
  const initialBalance = trades[0]?.initialBalance ?? 0;

  // DD curve data
  let peak = initialBalance;
  let bal = initialBalance;
  let inDD = false;
  let ddCount = 0;
  let peakB = initialBalance;
  let balB = initialBalance;
  for (const t of closed) {
    balB += t.rPnL;
    if (balB > peakB) { peakB = balB; if (inDD) { ddCount++; inDD = false; } }
    else if (balB < peakB) inDD = true;
  }
  if (inDD) ddCount++;

  const ddData = closed.map((t, i) => {
    bal += t.rPnL;
    if (bal > peak) peak = bal;
    const dd = peak > 0 ? ((peak - bal) / peak) * 100 : 0;
    const date = t.dateStart.split(' ')[0].replace(/\//g, '-');
    return { i: String(i + 1), date, dd: -dd };
  });

  // MAE histogram — buckets 0.0 to ≥1.0 in 0.1 steps
  const buckets = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  const maeHisto = buckets.map((lo, i) => {
    const hi = buckets[i + 1] ?? Infinity;
    const label = lo >= 1.0 ? '≥1.0' : lo.toFixed(1);
    const count = mae.values.filter(v => v >= lo && (hi === Infinity ? true : v < hi)).length;
    return { label, count };
  });

  return (
    <div>
      {/* ── DRAWDOWN ON EQUITY ── */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader title="Drawdown on Equity" info="Percentage drawdown from peak equity over time" />
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={ddData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ddg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BEAR} stopOpacity={0.4} />
                <stop offset="95%" stopColor={BEAR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 9 }} />
            <YAxis tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 9 }} tickFormatter={v => v + '%'} width={44} />
            <Tooltip content={<DdTip />} />
            <ReferenceLine y={0} stroke="var(--text-dim)" strokeWidth={1} />
            <Area type="monotone" dataKey="dd" name="Drawdown" stroke={BEAR} fill="url(#ddg)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', marginTop: 16 }}>
          <MiniStat label="Max Drawdown" value={fmt(maxDD, 2) + '%'} color={BEAR} />
          <MiniStat label="Avg Drawdown on Equity" value={fmt(avgDD, 2) + '%'} color={BEAR} />
          <MiniStat label="Time to Recovery" value={recovery + ' days'} color={ACCENT} />
          <MiniStat label="Drawdown Frequency" value={ddCount} />
        </div>
      </div>

      {/* ── MAXIMUM ADVERSE EXCURSION ── */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader title="Maximum Adverse Excursion (MAE)" info="The biggest drop in your account from the highest point to the lowest." />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={maeHisto} margin={{ top: 4, right: 8, left: 0, bottom: 24 }}>
            <defs>
              <linearGradient id="maeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BEAR} stopOpacity={0.7} />
                <stop offset="95%" stopColor={BEAR} stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 9 }}
              label={{ value: 'MAE (in R)', position: 'insideBottom', offset: -14, style: { ...MONO, fill: 'var(--text-dim)', fontSize: 10 } }}
            />
            <YAxis tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 9 }} allowDecimals={false} width={28} />
            <Tooltip content={<MaeTip />} />
            <Bar dataKey="count" name="Trades" radius={[2, 2, 0, 0]}>
              {maeHisto.map((_, i) => (
                <Cell key={i} fill="url(#maeg)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>Drawdown on Winning Trades</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
          <MiniStat label="Avg Drawdown RR" value={fmt(mae.avg)} color={ACCENT} />
          <MiniStat label="Min Drawdown RR" value={fmt(mae.min)} color={BULL} />
          <MiniStat label="Max Drawdown RR" value={fmt(mae.max)} color={BEAR} />
        </div>
      </div>
    </div>
  );
}
