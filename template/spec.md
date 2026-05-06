Tôi muốn xây dựng trang web với tính năng update CSV chua data backtest (mẫu template/data-template.csv)
Sử dụng UI giống (template/ui-templatet.html)                                                                     
Sau đó đưa ra phân tích theo các mục dưới:

1. Performance
- Profit and loss
  - Total Pnl
  - Account Balance
  - Win Rate
  - Total Trades
  - Breakeven Trades
  - Breakeven Threshold
- Average RR
- Ideal Average RR (note Ideal Average RR The ideal RR is the max profit a trade could have given you if you held it up to a week after opening it. This statistic shows the average ideal RR for all of your trades. The more peaks you see in the small graph below, the more trades you may have taken profits too early.)
- Could have profit/BE (Max Ideal RR)
- Expectancy & Profit Factor
  - Expectancy
  - Profit factor
- Winners and Losers
  - Winners
    - Total winners
    - Best win
    - Average win
    - Average duration
    - Max consecutive wins
    - Avg consecutive wins
  - Losers
    - (Tương tự)
- Performance by side
  - Total Trades (buy/sell)
  - Win Rate  (buy/sell)
- Performance by session (note Check your strategy's performance during the 3 key sessions: NY (8 a.m - 4 p.m), London (7 a.m - 2:59 p.m), Asia (9 a.m - 2:59 p.m). If performance is poor in a session, consider avoiding)
  - Win Rate (Your strategy's win rate in each session)
  - Total Trades
  - Avg RR
  - Profit
- Performance by time (note: This chart displays analytics by trade hour. Change the chart type using the dropdown on the right.)
- Performance by day
- Performance by month
- Performance calendar
- Average trade frequency
  - Trades / day
  - Trades / week
  - Trades / month

2. Drawdown
- Drawdown on Equity
  - Max Drawdown
  - AVG Drawdown on equity
  - Time to recovery (days)
  - Drawdown frequency
- Maximum Adverse Excursion
  - Drawdown on Winning Trades
  - AVG Drawdown RR
  - Min Drawdown RR
  - Max Drawdown RR

3. Simulator
- RR Simulator (note: RR Simulator Test different risk-reward setups to see how your trades would've performed under new conditions - no need to re-backtest.)
- Montecarlo Simulation (note: Performance calendar By performing Monte Carlo Simulations, you can estimate how effective your trading strategy is.)

