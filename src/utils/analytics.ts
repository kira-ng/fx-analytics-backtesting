import type { Trade } from '../types';

export function getClosedTrades(trades: Trade[]): Trade[] {
  return trades.filter(t => t.status === 'closed');
}

export function getWinners(trades: Trade[]): Trade[] {
  return trades.filter(t => t.rPnL > 0);
}

export function getLosers(trades: Trade[]): Trade[] {
  return trades.filter(t => t.rPnL < 0);
}

export function getBreakevens(trades: Trade[], threshold = 0): Trade[] {
  return trades.filter(t => Math.abs(t.rPnL) <= threshold);
}

export function calcWinRate(trades: Trade[]): number {
  if (!trades.length) return 0;
  return (getWinners(trades).length / trades.length) * 100;
}

export function calcAvgRR(trades: Trade[]): number {
  const winners = trades.filter(t => t.rPnL > 0);
  if (!winners.length) return 0;
  return winners.reduce((s, t) => s + t.avgRiskReward, 0) / winners.length;
}

function calcTradeIdealRR(trade: Trade): number {
  const risk = Math.abs(trade.entryPrice - trade.initalSL);
  if (!risk || !trade.idealTP) return 0;
  const profit = trade.side === 'buy'
    ? trade.idealTP - trade.entryPrice
    : trade.entryPrice - trade.idealTP;
  return Math.max(0, profit / risk);
}

export function calcIdealAvgRR(trades: Trade[]): number {
  // Average ideal RR of winning trades only
  const winners = trades.filter(t => t.rPnL > 0);
  if (!winners.length) return 0;
  const rrs = winners.map(calcTradeIdealRR).filter(r => r > 0);
  if (!rrs.length) return 0;
  return rrs.reduce((s, r) => s + r, 0) / rrs.length;
}

export function calcMaxIdealRR(trades: Trade[]): number {
  const winners = trades.filter(t => t.rPnL > 0);
  const rrs = winners.map(calcTradeIdealRR).filter(r => r > 0);
  return rrs.length ? Math.max(...rrs) : 0;
}

export function calcCouldHaveProfit(trades: Trade[]): { count: number; maxIdealRR: number } {
  const losers = getLosers(trades);
  const couldHave = losers.filter(t => calcTradeIdealRR(t) > 0);
  const rrs = couldHave.map(calcTradeIdealRR);
  return {
    count: couldHave.length,
    maxIdealRR: rrs.length ? Math.max(...rrs) : 0,
  };
}

export function calcExpectancy(trades: Trade[]): number {
  if (!trades.length) return 0;
  const total = trades.length;
  const winners = getWinners(trades);
  const losers = getLosers(trades);
  const winRate = winners.length / total;         // tỉ lệ win thực tế
  const lossRate = losers.length / total;         // tỉ lệ loss thực tế (breakeven không tính vào)
  const avgWin = winners.length ? winners.reduce((s, t) => s + t.rPnL, 0) / winners.length : 0;
  const avgLoss = losers.length ? Math.abs(losers.reduce((s, t) => s + t.rPnL, 0) / losers.length) : 0;
  return winRate * avgWin - lossRate * avgLoss;
}

export function calcProfitFactor(trades: Trade[]): number {
  const grossProfit = getWinners(trades).reduce((s, t) => s + t.rPnL, 0);
  const grossLoss = Math.abs(getLosers(trades).reduce((s, t) => s + t.rPnL, 0));
  if (!grossLoss) return grossProfit > 0 ? Infinity : 0;
  return grossProfit / grossLoss;
}

export function calcMaxConsecutive(trades: Trade[], type: 'win' | 'loss'): number {
  let max = 0, cur = 0;
  for (const t of trades) {
    const match = type === 'win' ? t.rPnL > 0 : t.rPnL < 0;
    if (match) { cur++; max = Math.max(max, cur); } else cur = 0;
  }
  return max;
}

export function calcAvgConsecutive(trades: Trade[], type: 'win' | 'loss'): number {
  const runs: number[] = [];
  let cur = 0;
  for (const t of trades) {
    const match = type === 'win' ? t.rPnL > 0 : t.rPnL < 0;
    if (match) { cur++; }
    else { if (cur > 0) runs.push(cur); cur = 0; }
  }
  if (cur > 0) runs.push(cur);
  return runs.length ? runs.reduce((s, r) => s + r, 0) / runs.length : 0;
}

export function calcAvgDuration(trades: Trade[]): string {
  if (!trades.length) return '0m';
  const totalMs = trades.reduce((s, t) => {
    const start = new Date(t.dateStart.replace(/\//g, '-')).getTime();
    const end = new Date(t.dateEnd.replace(/\//g, '-')).getTime();
    return s + (end - start);
  }, 0);
  const avgMs = totalMs / trades.length;
  const hours = Math.floor(avgMs / 3600000);
  const mins = Math.floor((avgMs % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function calcDrawdown(trades: Trade[]): { maxDD: number; avgDD: number; equity: number[] } {
  let peak = trades[0]?.initialBalance ?? 0;
  const equity: number[] = [];
  const drawdowns: number[] = [];

  let balance = trades[0]?.initialBalance ?? 0;
  equity.push(balance);

  for (const t of trades) {
    balance += t.rPnL;
    equity.push(balance);
    if (balance > peak) peak = balance;
    const dd = ((peak - balance) / peak) * 100;
    if (dd > 0) drawdowns.push(dd);
  }

  return {
    maxDD: drawdowns.length ? Math.max(...drawdowns) : 0,
    avgDD: drawdowns.length ? drawdowns.reduce((s, d) => s + d, 0) / drawdowns.length : 0,
    equity,
  };
}

export function calcMAE(trades: Trade[]): { avg: number; min: number; max: number; values: number[] } {
  const winners = getWinners(trades);
  if (!winners.length) return { avg: 0, min: 0, max: 0, values: [] };
  // MAE in R for each winning trade:
  // = biggest drop from peak to trough relative to initial risk (1R)
  // Approximated as: (maxRiskReward - avgRiskReward) when maxRR > avgRR (trade gave back some gains)
  // Falls back to avgRR/idealRR when maxRR == avgRR (no data on giveback)
  const rrs = winners.map(t => {
    if (t.maxRiskReward > t.avgRiskReward) {
      return Math.max(0, t.maxRiskReward - t.avgRiskReward);
    }
    // Fallback: estimate from idealRR
    const risk = Math.abs(t.entryPrice - t.initalSL);
    if (!risk || !t.idealTP) return 0;
    const idealProfit = t.side === 'buy'
      ? t.idealTP - t.entryPrice
      : t.entryPrice - t.idealTP;
    const idealRR = Math.max(idealProfit / risk, 0.001);
    return Math.max(0, t.avgRiskReward / idealRR);
  });
  return {
    avg: rrs.reduce((s, r) => s + r, 0) / rrs.length,
    min: Math.min(...rrs),
    max: Math.max(...rrs),
    values: rrs,
  };
}

function getTradeHour(trade: Trade): number {
  return new Date(trade.dateStart.replace(/\//g, '-')).getUTCHours();
}

// Session hours (UTC):
// Sydney:   22:00 – 07:00
// Tokyo:    00:00 – 09:00
// London:   08:00 – 17:00
// New York: 13:00 – 22:00
const SESSION_DEFS = [
  { name: 'Sydney',   test: (h: number) => h >= 22 || h < 7  },
  { name: 'Tokyo',    test: (h: number) => h >= 0  && h < 9  },
  { name: 'London',   test: (h: number) => h >= 8  && h < 17 },
  { name: 'New York', test: (h: number) => h >= 13 && h < 22 },
];

export function calcBySession(trades: Trade[]) {
  return SESSION_DEFS.map(s => {
    const filtered = trades.filter(t => s.test(getTradeHour(t)));
    return {
      session: s.name,
      trades: filtered.length,
      winRate: calcWinRate(filtered),
      avgRR: calcAvgRR(filtered),
      profit: filtered.reduce((s, t) => s + t.rPnL, 0),
    };
  });
}

export function calcByHour(trades: Trade[]) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return hours.map(h => {
    const filtered = trades.filter(t => getTradeHour(t) === h);
    return {
      hour: h,
      trades: filtered.length,
      winRate: calcWinRate(filtered),
      profit: filtered.reduce((s, t) => s + t.rPnL, 0),
    };
  });
}

export function calcByDay(trades: Trade[]) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => {
    const filtered = trades.filter(t => {
      const d = new Date(t.dateStart.replace(/\//g, '-')).getUTCDay();
      const idx = d === 0 ? 6 : d - 1;
      return idx === i;
    });
    return {
      day,
      trades: filtered.length,
      winRate: calcWinRate(filtered),
      profit: filtered.reduce((s, t) => s + t.rPnL, 0),
    };
  });
}

export function calcByMonth(trades: Trade[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month, i) => {
    const filtered = trades.filter(t => {
      const m = new Date(t.dateStart.replace(/\//g, '-')).getUTCMonth();
      return m === i;
    });
    return {
      month,
      trades: filtered.length,
      winRate: calcWinRate(filtered),
      profit: filtered.reduce((s, t) => s + t.rPnL, 0),
    };
  });
}

export function calcCalendar(trades: Trade[]) {
  const map: Record<string, { profit: number; trades: number }> = {};
  for (const t of trades) {
    const date = t.dateStart.split(' ')[0].replace(/\//g, '-');
    if (!map[date]) map[date] = { profit: 0, trades: 0 };
    map[date].profit += t.rPnL;
    map[date].trades += 1;
  }
  return map;
}

export function calcFrequency(trades: Trade[]) {
  if (!trades.length) return { perDay: 0, perWeek: 0, perMonth: 0 };
  const dates = trades.map(t => new Date(t.dateStart.replace(/\//g, '-')).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const days = Math.max(1, (maxDate - minDate) / 86400000);
  return {
    perDay: +(trades.length / days).toFixed(2),
    perWeek: +(trades.length / (days / 7)).toFixed(2),
    perMonth: +(trades.length / (days / 30)).toFixed(2),
  };
}

export function calcBySide(trades: Trade[]) {
  const buys = trades.filter(t => t.side === 'buy');
  const sells = trades.filter(t => t.side === 'sell');
  return {
    buy: { trades: buys.length, winRate: calcWinRate(buys), profit: buys.reduce((s, t) => s + t.rPnL, 0) },
    sell: { trades: sells.length, winRate: calcWinRate(sells), profit: sells.reduce((s, t) => s + t.rPnL, 0) },
  };
}

export function calcTimeToRecovery(trades: Trade[]): number {
  let peak = trades[0]?.initialBalance ?? 0;
  let balance = peak;
  let inDD = false;
  let ddStart = 0;
  let totalRecoveryDays = 0;
  let recoveries = 0;

  for (let i = 0; i < trades.length; i++) {
    balance += trades[i].rPnL;
    if (balance > peak) {
      if (inDD) {
        const start = new Date(trades[ddStart].dateStart.replace(/\//g, '-')).getTime();
        const end = new Date(trades[i].dateEnd.replace(/\//g, '-')).getTime();
        totalRecoveryDays += (end - start) / 86400000;
        recoveries++;
        inDD = false;
      }
      peak = balance;
    } else if (!inDD && balance < peak) {
      inDD = true;
      ddStart = i;
    }
  }
  return recoveries ? Math.round(totalRecoveryDays / recoveries) : 0;
}

export function runRRSimulator(trades: Trade[], newRR: number, newWinRate: number) {
  const total = trades.length;
  const wins = Math.round(total * (newWinRate / 100));
  const avgLoss = trades.filter(t => t.rPnL < 0).reduce((s, t) => s + Math.abs(t.rPnL), 0) / (trades.filter(t => t.rPnL < 0).length || 1);
  const avgWin = avgLoss * newRR;
  const simPnL = wins * avgWin - (total - wins) * avgLoss;
  const origPnL = trades.reduce((s, t) => s + t.rPnL, 0);
  return { simPnL, origPnL, wins, losses: total - wins };
}

// Build equity curve for a given RR/WR scenario
export function buildRREquityCurve(trades: Trade[], rr: number, wr: number): number[] {
  const initial = trades[0]?.initialBalance ?? 0;
  const avgLoss = trades.filter(t => t.rPnL < 0).reduce((s, t) => s + Math.abs(t.rPnL), 0) / (trades.filter(t => t.rPnL < 0).length || 1) || 1000;
  const avgWin = avgLoss * rr;
  let bal = initial;
  const curve: number[] = [initial];
  trades.forEach((_, i) => {
    const isWin = (i / trades.length) * 100 < wr;
    bal += isWin ? avgWin : -avgLoss;
    curve.push(bal);
  });
  return curve;
}

// Monte Carlo: return equity paths (array of curves) + sorted final balances
export function runMonteCarlo(trades: Trade[], iterations = 200): number[] {
  const pnls = trades.map(t => t.rPnL);
  const results: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const shuffled = [...pnls].sort(() => Math.random() - 0.5);
    const finalBalance = (trades[0]?.initialBalance ?? 0) + shuffled.reduce((s, p) => s + p, 0);
    results.push(finalBalance);
  }
  return results.sort((a, b) => a - b);
}

export function runMonteCarloPaths(trades: Trade[], iterations = 200): number[][] {
  const pnls = trades.map(t => t.rPnL);
  const initial = trades[0]?.initialBalance ?? 0;
  const paths: number[][] = [];
  for (let i = 0; i < iterations; i++) {
    const shuffled = [...pnls].sort(() => Math.random() - 0.5);
    let bal = initial;
    const path: number[] = [initial];
    for (const p of shuffled) { bal += p; path.push(bal); }
    paths.push(path);
  }
  return paths;
}
