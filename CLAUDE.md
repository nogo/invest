# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Package Manager**: Bun is used as the primary package manager and runtime.

```bash
# Install dependencies
bun install

# Development server (runs on port 3000)
bun dev

# Build for production
bun run build

# Start production server
bun start

# Deploy build (includes Prisma generation)
bun run deploy
```

**Database Commands**:
```bash
# Generate Prisma client
bun run db:generate

# Deploy migrations to database
bun run db:deploy

# Seed database with test data
bun run db:seed

# Create and apply new migration (development)
bunx prisma migrate dev

# Reset database (development)
bunx prisma migrate reset

# Open Prisma Studio
bunx prisma studio
```

**Testing and Type Checking**:
```bash
# Run tests with Bun's built-in test runner
bun test

# Type check with TypeScript
bunx tsc --noEmit
```

## Architecture Overview

This is a **personal investment tracking application** built with modern full-stack React architecture. The key architectural decisions are documented in ADRs:

### Core Architecture Pattern: Event Sourcing
- **Primary Pattern**: Event Sourcing with SQLite as event store (see `doc/adr/001_Event Sourcing.md`)
- **Read Models**: SQLite views for querying aggregated data (see `doc/adr/002-SQLite Views as Read Models.md`)
- **Purpose**: Track financial transactions with complete audit trail, enable time-travel queries, and support complex financial calculations (TWR, MWR)

### Tech Stack
- **Frontend**: TanStack React Start (full-stack React framework)
- **Routing**: TanStack Router with file-based routing
- **Database**: SQLite with Prisma ORM
- **Runtime**: Bun for both development and production
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Forms**: TanStack Form with Zod validation
- **Authentication**: better-auth
- **Architecture**: Event-Driven / Event Sourcing

### Key Directories
- `src/components/` - React components including shadcn/ui components
- `src/routes/` - File-based routing with TanStack Router
- `src/services/` - API layer with schema definitions and query functions
- `src/lib/` - Utilities and shared logic
- `prisma/` - Database schema and migrations
- `public/` - Static assets
- `tests/` - Test files
- `doc/adr/` - Architecture Decision Records

### Database Configuration
- **Runtime**: Bun adapter for Prisma
- **Output**: Generated client at `src/generated/prisma`
- **Features**: Views, relation joins, driver adapters, query compiler
- **Post-build**: Copies SQLite WASM file for production deployment

### TypeScript Configuration
- **Target**: ESNext with strict mode enabled
- **Module**: Preserve mode for bundler compatibility
- **Path Aliases**: `~/*` maps to `./src/*`
- **Strict Flags**: `noUncheckedIndexedAccess`, `noImplicitOverride` enabled

### Component System
- **UI Library**: shadcn/ui with "new-york" style
- **Base Color**: Neutral palette
- **Icons**: Lucide React
- **Path Aliases**: Configured for `~` prefix (components, lib, utils, ui, hooks)

### Event Sourcing Implementation
- All financial transactions stored as immutable events
- Current portfolio state derived by replaying events
- SQLite views provide read models without eventual consistency issues
- Supports historical portfolio reconstruction and time-weighted return calculations

## Application Purpose

This is a **personal portfolio management application** for consolidated oversight across multiple brokerage accounts. The core problem it solves:

- **Multi-Broker Tracking**: Consolidate investments across neobrokers, direct banks, and specialty providers
- **Capital Oversight**: Track actual invested capital vs. performance across all accounts
- **Dividend Management**: Central recording of all distributions
- **Performance Analysis**: Time-weighted and money-weighted returns calculation
- **Historical Analysis**: Portfolio value development over time

### Core MVP Features
- Transaction history recording using event sourcing
- Invested capital overview (deposits/withdrawals)
- Dividend tracking across all brokers
- Performance calculations (TWR/MWR)
- Multi-broker consolidation view

## Important Notes
- This is a single-user personal finance application
- Financial accuracy and audit trails are critical requirements
- Use event sourcing patterns for any transaction-related functionality
- Leverage SQLite views for complex queries rather than maintaining separate projection tables

### Component Patterns
- When creating components with mapping logic, extract individual components for each map operation
- Each component should handle its own mapping logic and rendering for better organization and maintainability
- Keep all related components in the same file unless the component becomes too complex
- Component hierarchy should clearly reflect the data structure and document hierarchy
- Form components use TanStack Form with proper validation
- Status indicators use shadcn/ui Badge components with consistent styling

### API Patterns
- Server functions defined in `src/services/*.api.ts`
- Schema validation in `src/services/*.schema.ts`
- Query definitions in `src/services/queries.ts`
- API routes in `src/routes/api/` for external integrations

### Event Type Examples
The application uses typed events for all state changes:
```typescript
type PortfolioEvent = 
  | { type: 'DEPOSIT_CREATED', amount: number, date: Date, broker: string }
  | { type: 'WITHDRAWAL_CREATED', amount: number, date: Date, broker: string }
  | { type: 'TRADE_EXECUTED', symbol: string, quantity: number, price: number, date: Date }
  | { type: 'DIVIDEND_RECEIVED', symbol: string, amount: number, date: Date }
```

### Import Strategy Roadmap
1. **Phase 1**: Manual transaction entry (MVP)
2. **Phase 2**: CSV/PDF import parsers for common brokers
3. **Phase 3**: API integration (where available)