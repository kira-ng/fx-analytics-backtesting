export interface Trade {
  id: string;
  dateStart: string;
  dateEnd: string;
  pair: string;
  uPnL: number;
  rPnL: number;
  side: 'buy' | 'sell';
  entryPrice: number;
  initalSL: number;
  maxTP: number;
  idealTP: number;
  amount: number;
  amountClosed: number;
  status: 'closed' | 'open';
  day: number;
  tags: string;
  avgClosePrice: number;
  avgRiskReward: number;
  maxRiskReward: number;
  exchangeRate: number;
  initialBalance: number;
  currentRealizedBalance: number;
}
