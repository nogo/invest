# Invest MVP Roadmap

This roadmap outlines the development tasks needed to complete the MVP based on the requirements in `doc/features/mvp.md` and analysis of the current codebase.

## Current State Analysis

### ✅ Already Implemented
- **Event Sourcing Architecture**: Core event store with SQLite
- **Add Trade Form**: Complete trade recording with validation (`RecordTradeForm`)
- **Enhanced Trade Form UI**: Reorganized into logical groups (Asset Information, Trade Details, Broker & Costs, Additional Information) with Card-based visual hierarchy
- **Domain-Driven Event Architecture**: Event schemas organized by domain boundaries:
  - `src/lib/events/base-types.ts` - Shared types across domains
  - `src/features/trades/domain/events.ts` - Trade-specific events
  - `src/features/corporate-actions/domain/events.ts` - Corporate action events  
  - `src/features/dividends/domain/events.ts` - Dividend events
- **Basic Dashboard Layout**: Main page structure with portfolio summary
- **Investment Chart**: Portfolio value timeline visualization
- **Trade History**: Event listing with search functionality
- **Database Schema**: Event sourcing with Views for read models
- **Internationalization**: Multi-language support (EN/DE)
- **Basic UI Components**: shadcn/ui component library
- **Development Environment**: Bun, TanStack Start, TypeScript setup

### 🔄 Partially Implemented
- **Portfolio Summary**: Basic metrics display but missing key calculations
- **Search/Filter**: Basic search exists but needs enhancement for MVP requirements
- **Position Calculation**: Infrastructure exists but FIFO logic needs implementation

## MVP Development Tasks

### 1. Core Position Calculation Engine 🚀 **HIGH PRIORITY**

#### 1.1 FIFO Position Calculator
- [X] **Create position calculation service** (`src/features/portfolio/domain/position-calculator.ts`)
  - Implement FIFO cost basis calculation for individual positions
  - Handle partial sells correctly (match oldest buys first)
  - Calculate realized gains/losses from completed sells
  - Calculate unrealized P&L for current holdings

#### 1.2 Portfolio Aggregation Service  
- [X] **Create portfolio aggregation service** (`src/features/portfolio/domain/portfolio-aggregator.ts`)
  - Aggregate all positions from trade events
  - Calculate total invested amount (sum of all buy trades)
  - Calculate total market value (positions × current prices)
  - Calculate total P&L (realized + unrealized)
  - Calculate performance percentage

#### 1.3 Read Model Views
- [ ] **Update database schema** (`prisma/schema.prisma`)
  - Add Views for current positions
  - Add Views for portfolio summary metrics
  - Add Views for realized gains summary

### 2. Current Holdings Display 📊 **HIGH PRIORITY**

#### 2.1 Holdings List Component
- [X] **Create holdings list component** (`src/features/portfolio/components/holdings-list.tsx`)
  - Display current positions with symbol, quantity, value, P&L
  - Show unrealized gains/losses with percentage
  - Include clickable links to asset detail pages
  - Handle empty state when no positions exist

#### 2.2 Position Detail Component
- [X] **Create position detail component** (`src/features/portfolio/components/position-detail.tsx`)
  - Show position summary (quantity, avg cost, current value)
  - Display unrealized P&L with percentage
  - Show cost basis calculation breakdown

### 3. Asset Detail Page 📈 **MEDIUM PRIORITY**

#### 3.1 Asset Detail Route
- [X] **Create asset detail route** (`src/routes/assets/$symbol.tsx`)
  - Dynamic route for individual asset viewing
  - Handle URL params for symbol identification
  - Integrate all asset-specific components

#### 3.2 Asset Detail Components
- [X] **Create trade timeline component** (`src/features/assets/components/trade-timeline.tsx`)
  - Show chronological list of all trades for the asset
  - Display buy/sell indicators with prices and dates
  - Show running position calculation after each trade

- [X] **Create position history component** (`src/features/assets/components/position-history.tsx`)
  - Track how position quantity/value changed over time
  - Show average cost basis evolution
  - Display realized gains from individual sells

#### 3.3 Price Chart with Trade Markers
- [X] **Create asset chart component** (`src/features/assets/components/asset-chart.tsx`)
  - Basic price chart (manual price entry for MVP)
  - Overlay buy/sell markers on price timeline
  - Show trade quantities and realized P&L on markers
  - Handle cases with no price data gracefully

### 4. ✅ Enhanced Dashboard Metrics 💰 **COMPLETED**

#### 4.1 Portfolio Summary Enhancements
- [X] **Update portfolio summary components**
  - ✅ `src/features/portfolio/components/money-invested.tsx` - Shows total invested with proper formatting and filter integration
  - ✅ `src/features/portfolio/components/current-value.tsx` - Shows market value with P&L, day change badges, and color-coded returns
  - ✅ `src/features/portfolio/components/portfolio-summary.tsx` - Combines metrics in responsive grid layout
  - ✅ Advanced features: loading states, error handling, internationalization, filter integration

#### 4.2 Dashboard Layout Updates
- [X] **Update main dashboard** (`src/routes/index.tsx`)
  - ✅ Add holdings list display with comprehensive position information
  - ✅ Improve metrics layout with responsive design
  - ✅ Ensure responsive design for mobile/desktop
  - ✅ Integrated with global filtering system

### 5. ✅ Enhanced Search & Filter 🔍 **COMPLETED**

#### 5.1 Global Filter Enhancement
- [X] **Enhance portfolio filter** (`src/features/portfolio/components/portfolio-filter.tsx`)
  - ✅ Add date range filtering capabilities with quick presets (90d, 6m, 1y, 3y, 5y, All)
  - ✅ Add custom date range selection with calendar inputs
  - ✅ Add asset type filtering (Stock/ETF/All)
  - ✅ Full-width search bar with enhanced UX
  - ✅ Toggle-group interface for date range selection
  - ✅ Form state management with URL parameters
  - ✅ Ensure filters apply to all dashboard components

#### 5.2 Filter Integration
- [X] **Update all components to respect global filters**
  - ✅ Investment chart filters by date/symbol
  - ✅ Holdings list filters by symbol/type
  - ✅ History list supports enhanced search and filtering
  - ✅ Portfolio metrics reflect filtered data
  - ✅ Filter state persists in URL parameters

### 6. Trade Management Features ✏️ **LOW PRIORITY**

#### 6.1 Trade Editing
- [ ] **Create edit trade functionality**
  - Add edit route (`src/routes/history/$eventId/edit.tsx`)
  - Create edit form component (extend existing RecordTradeForm)
  - Implement trade correction events (maintain event sourcing integrity)
  - Add edit links to history items

#### 6.2 Trade Deletion  
- [ ] **Create delete trade functionality**
  - Implement soft deletion via compensating events
  - Add confirmation dialog for trade deletions
  - Update history to show deleted/corrected trades
  - Ensure position calculations handle deleted trades correctly

### 7. Price Data Management 💱 **FUTURE/OPTIONAL**

#### 7.1 Manual Price Entry (MVP Requirement)
- [ ] **Create price management system**
  - Simple price entry form for current asset prices
  - Store latest prices for portfolio value calculation
  - Basic price history for chart functionality
  - Default to last traded price when available

## Implementation Order

### Phase 1: Core Functionality (Weeks 1-2)
1. FIFO Position Calculator
2. Portfolio Aggregation Service  
3. Holdings List Component
4. Enhanced Portfolio Summary

### Phase 2: Asset Details (Weeks 3-4)
1. Asset Detail Route and Components
2. Trade Timeline
3. Basic Price Chart with Trade Markers

### Phase 3: Enhanced Features (Weeks 5-6)
1. Enhanced Search/Filter
2. Trade Editing/Deletion
3. Manual Price Entry System

### Phase 4: Polish & Testing (Week 7)
1. Error handling and edge cases
2. Performance optimization
3. Mobile responsiveness
4. Testing and bug fixes

## Key Technical Decisions Needed

### Questions for Clarification:

1. **Price Data Source**: How should current asset prices be handled in MVP? 
   - Manual entry form for each asset?
   - Use last traded price as default?
   - External API integration (outside MVP scope)?

2. **Currency Handling**: MVP mentions "EUR only" - should we:
   - Hard-code EUR display everywhere?
   - Add currency field but limit to EUR in forms?
   - Store currency per trade for future multi-currency support?

3. **Trade Notes**: Current form has notes field - should this be:
   - Displayed in holdings/asset detail views?
   - Searchable in global filter?
   - Used for any specific calculations?

4. **Performance Considerations**: For large portfolios:
   - Should position calculations be cached in database views?
   - Real-time calculation vs. periodic updates?
   - Pagination for large trade histories?

## Success Criteria

The MVP will be considered complete when:

- [X] Users can add buy/sell trades with all required fields
- [X] Dashboard shows accurate total invested, market value, and P&L
- [X] Current holdings list displays all positions with correct FIFO cost basis
- [X] Asset detail pages show complete trade history and position evolution
- [X] Global search/filter works across all views
- [X] Basic price chart shows trade markers
- [X] All calculations follow FIFO methodology correctly
- [X] Enhanced dashboard metrics with comprehensive portfolio insights
- [X] Advanced filtering with date ranges and asset types
- [ ] Manual price entry system for current asset prices
- [ ] Application handles edge cases (no trades, no positions, etc.)

## Files That Need Creation

### ✅ New Components
- `src/features/portfolio/components/holdings-list.tsx`
- `src/features/portfolio/components/position-detail.tsx` 
- `src/features/portfolio/components/performance-metrics.tsx`
- `src/features/assets/components/trade-timeline.tsx`
- `src/features/assets/components/position-history.tsx`
- `src/features/assets/components/asset-chart.tsx`

### New Routes
- `src/routes/assets/$symbol.tsx`
- `src/routes/history/$eventId/edit.tsx`

### ✅  New Services/Domain Logic
- `src/features/portfolio/domain/position-calculator.ts`
- `src/features/portfolio/domain/portfolio-aggregator.ts`
- `src/features/assets/api/queries.ts`
- `src/features/assets/api/server.ts`

### ✅ Completed Domain Architecture
- `src/lib/events/base-types.ts` - Shared event types and validation schemas
- `src/features/trades/domain/events.ts` - Trade execution and correction events
- `src/features/corporate-actions/domain/events.ts` - Stock splits and symbol changes
- `src/features/dividends/domain/events.ts` - Dividend received events

### Database Updates
- Additional Views in `prisma/schema.prisma` for positions and metrics

This roadmap provides a clear path to MVP completion while maintaining the event-sourcing architecture and following the existing code patterns.