# Invest MVP - Trade Tracking Tool

## Core Concept
**Invest tracks trades, not portfolios**. Every buy and sell is recorded, and the portfolio emerges naturally from your trading history.

## User Interface Structure

### 🏠 Main Dashboard
```
┌─────────────────────────────────────────────────┐
│ 🔍 Search / Filter               [Add Trade] 🟢 │
├─────────────────────────────────────────────────┤
│ 💰 Invested         📈 Market Value   🎯 P&L    │
│   €25,450             €28,750         +€3,300   │
│                                       (+12.9%)   │
├─────────────────────────────────────────────────┤
│                  📊 Chart                       │
│         Portfolio Value Over Time               │
│                                                 │
├─────────────────────────────────────────────────┤
│ 🏦 Current Holdings                             │
│ ┌─────────────────────────────────────────────┐│
│ │ AAPL    150 shares   €22,500   +15.2%    📊 ││
│ │ MSFT     50 shares   € 5,750   +8.5%     📊 ││
│ │ TSLA     10 shares   € 2,500   -5.3%     📊 ││
│ └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### 📊 Asset Detail Page
```
┌─────────────────────────────────────────────────┐
│ ← Back           AAPL - Apple Inc.              │
├─────────────────────────────────────────────────┤
│ 📊 Price Chart with Buy/Sell Markers            │
│                                                 │
│     📈 with 🟢 (buys) and 🔴 (sells)           │
│                                                 │
├─────────────────────────────────────────────────┤
│ 📈 Position Summary                             │
│ Current: 150 shares @ €150 avg                 │
│ Invested: €22,500                              │
│ Value: €25,875                                 │
│ Unrealized: +€3,375 (+15%)                     │
│ Realized: +€450 (from previous sells)          │
├─────────────────────────────────────────────────┤
│ 📜 Trade History                                │
│ 2024-12-01  SELL   50 @ €165    +€750         │
│ 2024-10-15  BUY   100 @ €145   -€14,500       │
│ 2024-08-20  BUY   100 @ €155   -€15,500       │
└─────────────────────────────────────────────────┘
```

## Simplified Feature Set for MVP

### ✅ Core Features

1. **Trade Recording**
   - Buy trades: Symbol, Quantity, Price, Date, Fees
   - Sell trades: Same fields + automatic P&L calculation
   - Edit/Delete trades
   - Trade notes (optional)

2. **Automatic Position Calculation**
   - Current holdings derived from all trades
   - Average cost basis (FIFO for sells)
   - Unrealized P&L per position
   - Realized P&L from closed trades

3. **Dashboard Metrics**
   - Total Invested: Sum of all buy trades
   - Market Value: Current holdings × current price
   - Total P&L: Realized + Unrealized gains
   - Performance percentage

4. **Search & Filter**
   - Global search affecting all views
   - Filter by: Symbol, Date range, Buy/Sell
   - Filter applies to chart, holdings, metrics

5. **Asset Detail View**
   - Chart with buy/sell markers
   - Trade history for that asset
   - Running position calculation
   - Realized gains from sells

### 🚫 NOT in MVP
- Portfolio management
- Deposits/Withdrawals
- Dividend tracking
- Tax reports
- Import/Export (maybe just export)
- Multi-currency (start with EUR only)

## Key Calculations

### Position Building
```typescript
// Derive positions from trades
positions = trades
  .groupBy(symbol)
  .map(trades => {
    const buys = trades.filter(t => t.type === 'BUY')
    const sells = trades.filter(t => t.type === 'SELL')
    
    const totalBought = sum(buys.quantity)
    const totalSold = sum(sells.quantity)
    const currentQty = totalBought - totalSold
    
    // FIFO cost basis
    const costBasis = calculateFIFO(buys, sells)
    
    return {
      symbol,
      quantity: currentQty,
      avgPrice: costBasis / currentQty,
      invested: costBasis
    }
  })
```

### Realized Gains (FIFO)
```typescript
// When selling, match against oldest buys first
function calculateRealizedGain(sells: Trade[], buys: Trade[]) {
  let remainingSells = [...sells]
  let remainingBuys = [...buys].sort(byDate)
  let realizedGain = 0
  
  // Match sells to buys FIFO
  // Calculate gain/loss for each match
  
  return realizedGain
}
```

## User Flow (Simplified)

### Adding a Trade
1. Click "Add Trade" button
2. Enter: Symbol, Buy/Sell, Quantity, Price, Date
3. Save → Updates everything automatically

### Viewing Performance  
1. Dashboard shows total P&L at a glance
2. Click any asset to see detailed trades
3. Chart shows when you bought/sold

### Finding Information
1. Use global search to filter by symbol
2. See only relevant trades and positions
3. Metrics update based on filter

## Technical Benefits of This Approach

1. **Simpler Events**: Only BUY/SELL events
2. **No State Management**: Positions calculated from trades
3. **Clear Mental Model**: Track trades → See portfolio
4. **Easier Reconciliation**: Compare trade list with broker

## Next Development Steps

1. **Create Add Trade Form**
   - Quick entry with good defaults
   - Real-time validation
   - Immediate feedback

2. **Build Position Calculator**
   - FIFO logic for cost basis
   - Handle partial sells correctly

3. **Dashboard Analytics**
   - Real-time calculation from trades
   - Performance over time chart

4. **Asset Detail Page**
   - Trade timeline
   - Buy/sell chart overlay
   - P&L breakdown

Does this align better with your vision? The focus is entirely on tracking individual trades and letting the portfolio emerge from that data.