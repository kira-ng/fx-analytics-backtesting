import Papa from 'papaparse';
import type { Trade } from '../types';

export function parseCSV(file: File): Promise<Trade[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const trades = (results.data as Record<string, string>[]).map(row => ({
          id: row.id,
          dateStart: row.dateStart,
          dateEnd: row.dateEnd,
          pair: row.pair,
          uPnL: parseFloat(row.uPnL) || 0,
          rPnL: parseFloat(row.rPnL) || 0,
          side: row.side as 'buy' | 'sell',
          entryPrice: parseFloat(row.entryPrice) || 0,
          initalSL: parseFloat(row.initalSL) || 0,
          maxTP: parseFloat(row.maxTP) || 0,
          idealTP: parseFloat(row.idealTP) || 0,
          amount: parseFloat(row.amount) || 0,
          amountClosed: parseFloat(row.amountClosed) || 0,
          status: row.status as 'closed' | 'open',
          day: parseInt(row.day) || 0,
          tags: row.tags || '',
          avgClosePrice: parseFloat(row.avgClosePrice) || 0,
          avgRiskReward: parseFloat(row.avgRiskReward) || 0,
          maxRiskReward: parseFloat(row.maxRiskReward) || 0,
          exchangeRate: parseFloat(row.exchangeRate) || 1,
          initialBalance: parseFloat(row.initialBalance) || 0,
          currentRealizedBalance: parseFloat(row.currentRealizedBalance) || 0,
        }));
        resolve(trades);
      },
      error: reject,
    });
  });
}
