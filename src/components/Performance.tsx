import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie,
} from 'recharts';
import type { Trade } from '../types';
import * as A from '../utils/analytics';

/* ── helpers ── */
const MONO: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };
const SERIF: React.CSSProperties = { fontFamily: 'Fraunces, serif' };
const BULL = '#00d4a8';
const BEAR = '#ff3b6b';
const ACCENT = '#ffb547';
const BLUE = '#4a9eff';

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtPnL(n: number) {
  return (n >= 0 ? '+$' : '-$') + fmt(Math.abs(n));
}
function pnlColor(n: number) { return n >= 0 ? BULL : BEAR; }

/* ── tooltip ── */
interface TipProps { active?: boolean; payload?: { value: number; name: string }[]; label?: string }
function Tip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '8px 12px', ...MONO, fontSize: 11 }}>
      <div style={{ color: 'var(--text-dim)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: pnlColor(Number(p.value)) }}>{p.name}: {fmtPnL(Number(p.value))}</div>
      ))}
    </div>
  );
}

/* ── section wrapper ── */
function Section({ title, info, right, children }: { title: string; info?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Header nằm ngoài card */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-block', width: 20, height: 2, background: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ ...SERIF, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text)' }}>{title}</span>
          {info && <span title={info} style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', cursor: 'default' }}>ⓘ</span>}
        </div>
        {right}
      </div>
      {/* Card */}
      <div style={{
        background: 'var(--panel)', border: '1px solid var(--line)', overflow: 'hidden',
        padding: 20,
        backgroundImage: `repeating-linear-gradient(0deg,transparent 0,transparent 39px,rgba(255,255,255,0.018) 39px,rgba(255,255,255,0.018) 40px),
          repeating-linear-gradient(90deg,transparent 0,transparent 39px,rgba(255,255,255,0.018) 39px,rgba(255,255,255,0.018) 40px)`,
      }}>
        {children}
      </div>
    </div>
  );
}


/* ── stat row ── */
function StatRow({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ ...MONO, fontSize: 12, fontWeight: 700, color: color ?? 'var(--text)' }}>{value}</span>
        {sub && <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{sub}</span>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════ MAIN ══════════════════════════════════════ */
export default function Performance({ trades }: { trades: Trade[] }) {
  const closed = A.getClosedTrades(trades);
  const winners = A.getWinners(closed);
  const losers = A.getLosers(closed);
  const totalPnL = closed.reduce((s, t) => s + t.rPnL, 0);
  const initialBalance = trades[0]?.initialBalance ?? 0;
  const finalBalance = initialBalance + totalPnL;
  const winRate = A.calcWinRate(closed);
  const avgRR = A.calcAvgRR(closed);
  const maxRR = closed.length ? Math.max(...closed.map(t => t.maxRiskReward), 0) : 0;
  const idealAvgRR = A.calcIdealAvgRR(closed);
  const maxIdealRR = A.calcMaxIdealRR(closed);
  const couldHave = A.calcCouldHaveProfit(closed);
  const expectancy = A.calcExpectancy(closed);
  const profitFactor = A.calcProfitFactor(closed);
  const bySide = A.calcBySide(closed);
  const bySess = A.calcBySession(closed);
  const byHour = A.calcByHour(closed);
  const byDay = A.calcByDay(closed);
  const byMonth = A.calcByMonth(closed);
  const freq = A.calcFrequency(closed);

  const avgWin = winners.length ? winners.reduce((s, t) => s + t.rPnL, 0) / winners.length : 0;
  const avgLoss = losers.length ? Math.abs(losers.reduce((s, t) => s + t.rPnL, 0) / losers.length) : 0;
  const bestWin = winners.length ? Math.max(...winners.map(t => t.rPnL)) : 0;
  const worstLoss = losers.length ? Math.min(...losers.map(t => t.rPnL)) : 0;
  const maxConsWin = A.calcMaxConsecutive(closed, 'win');
  const maxConsLoss = A.calcMaxConsecutive(closed, 'loss');
  const avgConsWin = A.calcAvgConsecutive(closed, 'win');
  const avgConsLoss = A.calcAvgConsecutive(closed, 'loss');
  const avgDurWin = A.calcAvgDuration(winners);
  const avgDurLoss = A.calcAvgDuration(losers);

  // Cumulative PnL curve với date
  const pnlData: { date: string; pnl: number }[] = [{ date: closed[0]?.dateStart.split(' ')[0] ?? '', pnl: 0 }];
  let cumPnL = 0;
  closed.forEach(t => {
    cumPnL += t.rPnL;
    pnlData.push({ date: t.dateEnd.split(' ')[0].replace(/\//g, '-'), pnl: cumPnL });
  });

  // Profit factor ring (0-100 scale capped at 5)
  const pfCapped = Math.min(profitFactor, 5);
  const pfPct = (pfCapped / 5) * 100;
  const pfData = [{ v: pfPct }, { v: 100 - pfPct }];

  // Donut data
  const buyPct = closed.length ? (bySide.buy.trades / closed.length) * 100 : 50;
  const sellPct = 100 - buyPct;
  const buyWR = bySide.buy.winRate;
  const sellWR = bySide.sell.winRate;

  // Sessions for lollipop


  // By hour — keep all 24 for horizontal display
  const hourData = byHour.map(h => ({ name: `${String(h.hour).padStart(2, '0')}:00`, profit: h.profit, trades: h.trades }));
  const dayData = byDay.map(d => ({ name: d.day, profit: d.profit, winRate: d.winRate, trades: d.trades }));

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Calendar
  const cal = A.calcCalendar(closed);
  const calDates = Object.keys(cal).sort();
  const calMonths: string[] = [];
  calDates.forEach(d => { const m = d.slice(0,7); if (!calMonths.includes(m)) calMonths.push(m); });
  const maxCalAbs = Math.max(...Object.values(cal).map(v => Math.abs(v.profit)), 1);

  return (
    <div>

      {/* ── 1. PROFIT AND LOSS ── */}
      <div style={{ marginBottom: 32 }}>
        {/* Header ngoài card */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-block', width: 20, height: 2, background: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ ...SERIF, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text)' }}>Profit and loss</span>
            <span title="Total realized PnL from closed trades" style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', cursor: 'default' }}>ⓘ</span>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {['All','Day','1H','15M'].map((t, i) => (
              <button key={t} style={{
                ...MONO, fontSize: 10, padding: '3px 9px', borderRadius: 2,
                background: i === 0 ? 'var(--accent)' : 'transparent',
                border: i === 0 ? '1px solid var(--accent)' : '1px solid var(--line)',
                color: i === 0 ? 'var(--bg)' : 'var(--text-dim)',
                letterSpacing: '0.06em',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Top stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', marginBottom: 20 }}>
          {[
            { label: 'Total PnL', value: fmtPnL(totalPnL), color: pnlColor(totalPnL), pill: fmt(totalPnL / initialBalance * 100, 2) + '%', pillColor: pnlColor(totalPnL) },
            { label: 'Account Balance', value: '$' + fmt(finalBalance), color: pnlColor(finalBalance - initialBalance), sub: 'from $' + fmt(initialBalance) },
            { label: 'Win Rate', value: fmt(winRate, 1) + '%', color: winRate >= 50 ? BULL : BEAR },
            { label: 'Total Trades', value: closed.length },
            { label: 'Breakeven Trades', value: A.getBreakevens(closed).length },
            { label: 'Breakeven Threshold', value: '$0' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--panel)', padding: '14px 16px', borderBottom: `2px solid ${s.color ?? 'var(--line)'}` }}>
              <div style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ ...SERIF, fontSize: 24, fontWeight: 600, color: s.color ?? 'var(--text)' }}>{s.value}</span>
                {'pill' in s && s.pill && (
                  <span style={{ ...MONO, fontSize: 11, background: (s.pillColor ?? BULL) + '22', color: s.pillColor ?? BULL, borderRadius: 2, padding: '2px 7px' }}>{s.pill}</span>
                )}
              </div>
              {'sub' in s && s.sub && <div style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Cumulative PnL Chart */}
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={pnlData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={totalPnL >= 0 ? BULL : BEAR} stopOpacity={0.4} />
                <stop offset="95%" stopColor={totalPnL >= 0 ? BULL : BEAR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 9 }}
              interval="preserveStartEnd"
              tickFormatter={v => v ? String(v).slice(5) : ''}
            />
            <YAxis tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 9 }} tickFormatter={v => (v >= 0 ? '+$' : '-$') + Math.abs(v/1000).toFixed(1)+'k'} width={52} />
            <Tooltip content={<Tip />} />
            <ReferenceLine y={0} stroke="var(--text-dim)" strokeDasharray="4 3" strokeWidth={1} />
            <Area type="monotone" dataKey="pnl" name="PnL" stroke={totalPnL >= 0 ? BULL : BEAR} fill="url(#pnlGrad)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>

        {/* Bottom RR row — 3 paired cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 20 }}>
          {/* Card 1: Average RR + Max RR */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', gap: 1, background: 'var(--line)' }}>
              <div style={{ flex: 1, background: 'var(--bg-2)', padding: '10px 12px' }}>
                <div style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Average RR</div>
                <div style={{ ...SERIF, fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>{fmt(avgRR)}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--bg-2)', padding: '10px 12px' }}>
                <div style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Max RR</div>
                <div style={{ ...SERIF, fontSize: 22, fontWeight: 600, color: ACCENT }}>{fmt(maxRR)}</div>
              </div>
            </div>
          </div>
          {/* Card 2: Ideal Average RR + Max Ideal RR */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', gap: 1, background: 'var(--line)' }}>
              <div style={{ flex: 1, background: 'var(--bg-2)', padding: '10px 12px' }}>
                <div style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Ideal Avg RR</div>
                <div style={{ ...SERIF, fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>{fmt(idealAvgRR)}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--bg-2)', padding: '10px 12px' }}>
                <div style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Max Ideal RR</div>
                <div style={{ ...SERIF, fontSize: 22, fontWeight: 600, color: ACCENT }}>{fmt(maxIdealRR)}</div>
              </div>
            </div>
          </div>
          {/* Card 3: Could have profit/BE + Max Ideal RR (losers) */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', gap: 1, background: 'var(--line)' }}>
              <div style={{ flex: 1, background: 'var(--bg-2)', padding: '10px 12px' }}>
                <div style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Could have profit/BE</div>
                <div style={{ ...SERIF, fontSize: 22, fontWeight: 600, color: BULL }}>{couldHave.count} trade{couldHave.count !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--bg-2)', padding: '10px 12px' }}>
                <div style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Max Ideal RR</div>
                <div style={{ ...SERIF, fontSize: 22, fontWeight: 600, color: ACCENT }}>{fmt(couldHave.maxIdealRR)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. EXPECTANCY & PROFIT FACTOR ── */}
      {/* ── 2. EXPECTANCY & PROFIT FACTOR (no card) ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ display: 'inline-block', width: 20, height: 2, background: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ ...SERIF, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text)' }}>Expectancy & Profit Factor</span>
          <span title="Expectancy = average $ per trade. Profit Factor = gross profit / gross loss" style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', cursor: 'default' }}>ⓘ</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Left: Expectancy */}
          <div style={{ border: '1px solid var(--line)', borderLeft: `3px solid ${BULL}`, background: 'var(--bg-2)', padding: 16 }}>
            <div style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Expectancy</div>
            <div style={{ ...SERIF, fontSize: 28, fontWeight: 600, color: pnlColor(expectancy), marginBottom: 12 }}>${fmt(expectancy)}</div>
            <div style={{ position: 'relative', height: 28, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 2, overflow: 'hidden' }}>
              {(() => {
                const grossW = winners.reduce((s,t) => s + t.rPnL, 0);
                const grossL = Math.abs(losers.reduce((s,t) => s + t.rPnL, 0));
                const total = grossW + grossL || 1;
                const wPct = (grossW / total) * 100;
                return <>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: wPct + '%', background: BULL + '33' }} />
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: (100-wPct) + '%', background: BEAR + '33' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
                    <span style={{ ...MONO, fontSize: 10, color: BULL }}>${fmt(grossW)}</span>
                    <span style={{ ...MONO, fontSize: 10, color: BEAR }}>-${fmt(grossL)}</span>
                  </div>
                </>;
              })()}
            </div>
          </div>
          {/* Right: Profit Factor */}
          <div style={{ border: '1px solid var(--line)', borderLeft: `3px solid ${ACCENT}`, background: 'var(--bg-2)', padding: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
              <PieChart width={90} height={90}>
                <Pie data={pfData} dataKey="v" innerRadius={32} outerRadius={42} startAngle={90} endAngle={-270} stroke="none">
                  <Cell fill={BULL} />
                  <Cell fill="var(--line)" />
                </Pie>
              </PieChart>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ ...SERIF, fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{isFinite(profitFactor) ? fmt(profitFactor) : '∞'}</span>
              </div>
            </div>
            <div>
              <div style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Profit Factor</div>
              <div style={{ ...SERIF, fontSize: 28, fontWeight: 600, color: profitFactor >= 1 ? BULL : BEAR }}>{isFinite(profitFactor) ? fmt(profitFactor) : '∞'}</div>
              <div style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{profitFactor >= 1 ? 'Profitable strategy' : 'Losing strategy'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. WINNERS AND LOSERS ── */}
      {/* ── 3. WINNERS AND LOSERS (no card) ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ display: 'inline-block', width: 20, height: 2, background: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ ...SERIF, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text)' }}>Winners and Losers</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ border: '1px solid var(--line)', borderLeft: `3px solid ${BULL}`, background: 'var(--bg-2)', padding: 16 }}>
            <div style={{ ...MONO, fontSize: 11, color: BULL, letterSpacing: '0.1em', marginBottom: 12 }}>WINNERS</div>
            <StatRow label="Total winners" value={winners.length} color={BULL} />
            <StatRow label="Best win" value={fmtPnL(bestWin)} color={BULL} sub={fmt(bestWin / initialBalance * 100, 2) + '%'} />
            <StatRow label="Average win" value={fmtPnL(avgWin)} color={BULL} sub={fmt(avgWin / initialBalance * 100, 2) + '%'} />
            <StatRow label="Average duration" value={avgDurWin} />
            <StatRow label="Max consecutive wins" value={maxConsWin} />
            <StatRow label="Avg consecutive wins" value={fmt(avgConsWin, 1)} />
          </div>
          <div style={{ border: '1px solid var(--line)', borderLeft: `3px solid ${BEAR}`, background: 'var(--bg-2)', padding: 16 }}>
            <div style={{ ...MONO, fontSize: 11, color: BEAR, letterSpacing: '0.1em', marginBottom: 12 }}>LOSERS</div>
            <StatRow label="Total losers" value={losers.length} color={BEAR} />
            <StatRow label="Worst loss" value={fmtPnL(worstLoss)} color={BEAR} sub={fmt(worstLoss / initialBalance * 100, 2) + '%'} />
            <StatRow label="Average loss" value={fmtPnL(-avgLoss)} color={BEAR} sub={fmt(-avgLoss / initialBalance * 100, 2) + '%'} />
            <StatRow label="Average duration" value={avgDurLoss} />
            <StatRow label="Max consecutive losses" value={maxConsLoss} />
            <StatRow label="Avg consecutive losses" value={fmt(avgConsLoss, 1)} />
          </div>
        </div>
      </div>

      {/* ── 4. PERFORMANCE BY SIDE (no card) ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ display: 'inline-block', width: 20, height: 2, background: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ ...SERIF, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text)' }}>Performance by side</span>
          <span title="Buy vs Sell breakdown" style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', cursor: 'default' }}>ⓘ</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <DonutPanel
            title="Total Trades"
            centerLabel={String(closed.length)}
            segments={[
              { label: 'Buy', value: bySide.buy.trades, pct: buyPct, color: BLUE },
              { label: 'Sell', value: bySide.sell.trades, pct: sellPct, color: 'var(--text-dim)' },
            ]}
          />
          <DonutPanel
            title="Win Rate"
            centerLabel={fmt(winRate, 1) + '%'}
            segments={[
              { label: 'Buy', value: Math.round(buyWR), pct: buyWR, color: BLUE },
              { label: 'Sell', value: Math.round(sellWR), pct: sellWR, color: 'var(--text-dim)' },
            ]}
          />
        </div>
      </div>

      {/* ── 5. PERFORMANCE BY SESSION (no card) ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ display: 'inline-block', width: 20, height: 2, background: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ ...SERIF, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text)' }}>Performance by session</span>
          <span title="Sydney 10pm–7am | Tokyo 12am–9am | London 8am–5pm | New York 1pm–10pm (UTC)" style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', cursor: 'default' }}>ⓘ</span>
        </div>
        {(() => {
          const SESSION_COLORS: Record<string, string> = { Sydney: '#ffb547', Tokyo: '#ff6b9d', London: '#4a9eff', 'New York': '#00d4a8' };
          const SESSION_TIMES: Record<string, string> = { Sydney: '22:00–07:00', Tokyo: '00:00–09:00', London: '08:00–17:00', 'New York': '13:00–22:00' };
          const maxProfit = Math.max(...bySess.map(s => Math.abs(s.profit)), 1);
          const maxTrades = Math.max(...bySess.map(s => s.trades), 1);
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {bySess.map(s => {
                const color = SESSION_COLORS[s.session] ?? BLUE;
                const profitPct = Math.abs(s.profit) / maxProfit * 100;
                const tradesPct = s.trades / maxTrades * 100;
                return (
                  <div key={s.session} style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderTop: `3px solid ${color}`, padding: '16px 16px 14px' }}>
                    {/* Session name */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ ...SERIF, fontSize: 17, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>{s.session}</div>
                      <div style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>{SESSION_TIMES[s.session]} UTC</div>
                    </div>

                    {/* Metrics */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Trades */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>TRADES</span>
                          <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{s.trades}</span>
                        </div>
                        <div style={{ height: 3, background: 'var(--line)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: tradesPct + '%', background: color, borderRadius: 2, opacity: 0.7 }} />
                        </div>
                      </div>
                      {/* Win Rate */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>WIN RATE</span>
                          <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: s.winRate >= 50 ? BULL : BEAR }}>{fmt(s.winRate, 1)}%</span>
                        </div>
                        <div style={{ height: 3, background: 'var(--line)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: s.winRate + '%', background: s.winRate >= 50 ? BULL : BEAR, borderRadius: 2, opacity: 0.7 }} />
                        </div>
                      </div>
                      {/* Avg RR */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>AVG RR</span>
                          <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{fmt(s.avgRR)}</span>
                        </div>
                      </div>
                      {/* Profit */}
                      <div style={{ paddingTop: 6, borderTop: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>PROFIT</span>
                          <span style={{ ...MONO, fontSize: 12, fontWeight: 700, color: s.profit >= 0 ? BULL : BEAR }}>{fmtPnL(s.profit)}</span>
                        </div>
                        <div style={{ height: 3, background: 'var(--line)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: profitPct + '%', background: s.profit >= 0 ? BULL : BEAR, borderRadius: 2, opacity: 0.7 }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ── 6. PERFORMANCE BY TIME ── */}
      <Section
        title="Performance by time"
        info="Analytics by trade entry hour (UTC)"
        right={<span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>Total Profit/Loss ▾</span>}
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={hourData.filter(h => h.trades > 0)} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" type="category" tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 9 }} />
            <YAxis type="number" tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 9 }} tickFormatter={v => '$' + v} width={55} />
            <Tooltip content={<Tip />} />
            <ReferenceLine y={0} stroke="var(--text-dim)" strokeWidth={1} />
            <Bar dataKey="profit" name="Profit" radius={[2, 2, 0, 0]}>
              {hourData.filter(h => h.trades > 0).map((h, i) => (
                <Cell key={i} fill={h.profit >= 0 ? BULL : BEAR} fillOpacity={0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── 7. PERFORMANCE BY DAY ── */}
      <Section title="Performance by day" info="PnL and win rate by day of week">
        <div style={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayData} layout="vertical" margin={{ left: 8, right: 80 }}>
              <XAxis type="number" tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 9 }} tickFormatter={v => '$' + v} />
              <YAxis dataKey="name" type="category" tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 9 }} width={32} />
              <Tooltip content={<Tip />} />
              <ReferenceLine x={0} stroke="var(--text-dim)" strokeWidth={1} />
              <Bar dataKey="profit" name="Profit" radius={[0, 2, 2, 0]}>
                {dayData.map((d, i) => (
                  <Cell key={i} fill={d.profit >= 0 ? BULL : BEAR} fillOpacity={d.trades ? 0.75 : 0.1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 8. PERFORMANCE BY MONTH ── */}
      <Section title="Performance by month" info="Monthly PnL breakdown">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...MONO, fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--line)', color: 'var(--text-dim)', fontWeight: 400, letterSpacing: '0.1em' }}>Year</th>
                {monthNames.map(m => (
                  <th key={m} style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid var(--line)', color: 'var(--text-dim)', fontWeight: 400, letterSpacing: '0.1em' }}>{m}</th>
                ))}
                <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid var(--line)', color: ACCENT, fontWeight: 700, letterSpacing: '0.1em' }}>YTD</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const years: Record<string, Trade[]> = {};
                closed.forEach(t => {
                  const y = t.dateStart.slice(0, 4);
                  if (!years[y]) years[y] = [];
                  years[y].push(t);
                });
                return Object.entries(years).map(([yr, yTrades]) => {
                  const ytd = yTrades.reduce((s, t) => s + t.rPnL, 0);
                  return (
                    <tr key={yr}>
                      <td style={{ padding: '8px 12px', color: 'var(--text-dim)', borderBottom: '1px solid var(--line)' }}>{yr}</td>
                      {byMonth.map((_m, i) => {
                        const mTrades = yTrades.filter(t => new Date(t.dateStart.replace(/\//g,'-')).getUTCMonth() === i);
                        const mPnL = mTrades.reduce((s, t) => s + t.rPnL, 0);
                        return (
                          <td key={i} style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid var(--line)' }}>
                            {mTrades.length ? (
                              <span style={{
                                display: 'inline-block', padding: '2px 8px', borderRadius: 2,
                                background: (mPnL >= 0 ? BULL : BEAR) + '22',
                                color: mPnL >= 0 ? BULL : BEAR, fontSize: 10, fontWeight: 700,
                              }}>
                                {mPnL >= 0 ? '+' : ''}{fmt(mPnL / (yTrades[0]?.initialBalance || 1) * 100, 2)}%
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>—</span>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid var(--line)' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 2,
                          background: (ytd >= 0 ? BULL : BEAR) + '22',
                          color: ytd >= 0 ? BULL : BEAR, fontSize: 10, fontWeight: 700,
                        }}>
                          {ytd >= 0 ? '+' : ''}{fmt(ytd / (initialBalance || 1) * 100, 2)}%
                        </span>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 9. PERFORMANCE CALENDAR ── */}
      <Section title="Performance calendar" info="Daily PnL heatmap">
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(calMonths.length, 3)}, 1fr)`, gap: 24, width: '100%' }}>
          {calMonths.map(month => {
            const [y, m] = month.split('-').map(Number);
            const firstDay = new Date(y, m - 1, 1).getDay(); // 0=Sun
            const blanks = firstDay === 0 ? 6 : firstDay - 1; // Mon-first
            const daysInMonth = new Date(y, m, 0).getDate();
            const cells: { date: string; profit: number; count: number; blank: boolean }[] = [
              ...Array(blanks).fill(null).map(() => ({ date: '', profit: 0, count: 0, blank: true })),
            ];
            for (let d = 1; d <= daysInMonth; d++) {
              const ds = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              cells.push({ date: ds, profit: cal[ds]?.profit ?? 0, count: cal[ds]?.trades ?? 0, blank: false });
            }
            return (
              <div key={month} style={{ width: '100%' }}>
                <div style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.12em', marginBottom: 10 }}>
                  {new Date(y, m-1).toLocaleString('en', { month: 'long', year: 'numeric' }).toUpperCase()}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
                    <div key={i} style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', textAlign: 'center', paddingBottom: 4 }}>{d}</div>
                  ))}
                  {cells.map((cell, i) => {
                    if (cell.blank) return <div key={i} />;
                    const hasData = cell.count > 0;
                    const alpha = hasData ? 0.25 + 0.6 * (Math.abs(cell.profit) / maxCalAbs) : 0;
                    const bg = hasData
                      ? cell.profit > 0
                        ? `rgba(0,212,168,${alpha})`
                        : cell.profit < 0
                        ? `rgba(255,59,107,${alpha})`
                        : 'rgba(255,255,255,0.06)'
                      : 'rgba(255,255,255,0.02)';
                    return (
                      <div key={i} title={hasData ? `${cell.date}: ${fmtPnL(cell.profit)} (${cell.count} trade${cell.count !== 1 ? 's' : ''})` : cell.date} style={{
                        background: bg,
                        border: `1px solid ${hasData ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                        borderRadius: 2, padding: '4px 5px', minHeight: 64,
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      }}>
                        <span style={{ ...MONO, fontSize: 9, color: hasData ? 'rgba(255,255,255,0.9)' : 'var(--text-dim)' }}>
                          {new Date(cell.date + 'T00:00:00').getDate()}
                        </span>
                        {hasData && <>
                          <span style={{ ...MONO, fontSize: 8, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{cell.count}t</span>
                          <span style={{ ...MONO, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.95)', marginTop: 1 }}>
                            {fmtPnL(cell.profit)}
                          </span>
                        </>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── 10. AVERAGE TRADE FREQUENCY ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ display: 'inline-block', width: 20, height: 2, background: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ ...SERIF, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text)' }}>Average trade frequency</span>
          <span title="How often trades occur on average" style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', cursor: 'default' }}>ⓘ</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {/* Trades / day — actual count per trading day */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Trades / day</span>
              <span style={{ ...MONO, fontSize: 10, color: BLUE, background: BLUE + '22', borderRadius: 2, padding: '2px 8px' }}>Avg {fmt(freq.perDay, 1)}</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={Object.entries(cal).sort(([a],[b])=>a.localeCompare(b)).map(([date, v]) => ({ name: date.slice(5), v: v.trades }))} margin={{ top: 4, bottom: 4, left: 8, right: 4 }}>
                <XAxis dataKey="name" tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 8 }} />
                <YAxis tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 8 }} allowDecimals={false} width={20} />
                <Bar dataKey="v" fill={BLUE} fillOpacity={0.5} radius={[1,1,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Trades / week — actual count per ISO week */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Trades / week</span>
              <span style={{ ...MONO, fontSize: 10, color: BLUE, background: BLUE + '22', borderRadius: 2, padding: '2px 8px' }}>Avg {fmt(freq.perWeek, 1)}</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={(() => {
                const wkMap: Record<string, number> = {};
                closed.forEach(t => {
                  const d = new Date(t.dateStart.replace(/\//g, '-'));
                  const jan1 = new Date(d.getUTCFullYear(), 0, 1);
                  const wk = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
                  const key = `${d.getUTCFullYear()}-W${String(wk).padStart(2,'0')}`;
                  wkMap[key] = (wkMap[key] ?? 0) + 1;
                });
                return Object.entries(wkMap).sort(([a],[b])=>a.localeCompare(b)).map(([name, v]) => ({ name, v }));
              })()} margin={{ top: 4, bottom: 4, left: 8, right: 4 }}>
                <XAxis dataKey="name" tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 8 }} />
                <YAxis tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 8 }} allowDecimals={false} width={20} />
                <Bar dataKey="v" fill={BLUE} fillOpacity={0.5} radius={[1,1,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Trades / month — actual count per month */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Trades / month</span>
              <span style={{ ...MONO, fontSize: 10, color: BLUE, background: BLUE + '22', borderRadius: 2, padding: '2px 8px' }}>Avg {fmt(freq.perMonth, 1)}</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={byMonth.filter(m => m.trades > 0).map(m => ({ name: m.month, v: m.trades }))} margin={{ top: 4, bottom: 4, left: 8, right: 4 }}>
                <XAxis dataKey="name" tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 8 }} />
                <YAxis tick={{ ...(MONO as object), fill: 'var(--text-dim)', fontSize: 8 }} allowDecimals={false} width={20} />
                <Bar dataKey="v" fill={BLUE} fillOpacity={0.5} radius={[1,1,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── DonutPanel component ── */
function DonutPanel({ title, centerLabel, segments }: {
  title: string;
  centerLabel: string;
  segments: { label: string; value: number; pct: number; color: string }[];
}) {
  const data = segments.map(s => ({ value: s.pct }));
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: 16 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <PieChart width={100} height={100}>
            <Pie data={data} dataKey="value" innerRadius={34} outerRadius={46} startAngle={90} endAngle={-270} stroke="none">
              {segments.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Pie>
          </PieChart>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 600, color: 'var(--text)',
          }}>{centerLabel}</div>
        </div>
        <div style={{ flex: 1 }}>
          {segments.map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-dim)' }}>{s.label}</span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
