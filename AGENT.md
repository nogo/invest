# Project "Invest"

## Project Overview

Invest is a trade tracking application that records buy/sell trades and automatically calculates portfolio positions, performance metrics, and realized gains using FIFO methodology. Built with Tanstack Start, SQLite, and event sourcing.

## Build & Commands

- type-check and lint everything: `bun type-check`
- Run tests: `bun test --run --no-color`
- Run single test: `bun test --run src/file.test.ts`
- Start development server: `bun dev`
- Build for production: `bun build`
- Preview production build: `bun preview`

### Development Environment

- Dev server always runs at http://localhost:3000
- SQLite database

## Configuration

### Environment Variables

The project uses environment variables for configuration. Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

**Required Environment Variables:**
- `DATABASE_URL` - SQLite database file path
- `BETTER_AUTH_SECRET` - Secret key for authentication (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL` - Base URL for the application (e.g., `http://localhost:3000`)

**Development Setup:**
1. Copy `.env.example` to `.env`
2. Update environment variables with appropriate values
3. Run `bunx --bun prisma db push` to initialize the database
4. Run `bunx --bun prisma db seed` to populate with initial data (if seed files exist)

When adding new configuration options, update all relevant places:
1. Environment variables in `.env.example`
2. Configuration schemas in `src/config/`
3. Documentation in README.md

All configuration keys use consistent naming and MUST be documented.

## Architecture

### Tech Stack
- **Runtime**: Bun (JavaScript runtime)
- **Frontend**: React with TanStack Start (full-stack React framework)
- **Styling**: TailwindCSS v4 with shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **Authentication**: Better Auth with email/password
- **Forms**: TanStack Form with Zod validation
- **State Management**: TanStack Query for server state
- **Authentication**: better-auth
- **Architecture**: Event-Driven / Event Sourcing

### Core Architecture Pattern: Event Sourcing
- **Primary Pattern**: Event Sourcing with SQLite as event store (see `doc/adr/001_Event Sourcing.md`)
- **Read Models**: SQLite views for querying aggregated data (see `doc/adr/002-SQLite Views as Read Models.md`)
- **Purpose**: Track financial transactions with complete audit trail, enable time-travel queries, and support complex financial calculations (TWR, MWR)

### Project Structure

**Core Directories:**

- `src/routes/` - File-based routing with TanStack Router
- `src/components/` - Reusable React components organized by feature
- `src/features/` - Feature-based modules
- `src/lib/` - Common utility libraries (auth, database, storage, etc.)
- `tests/` - Test files
- `prisma/schema.prisma` - Database schema
- `prisma/seeds/` - Database seed files

**Key Architecture Patterns:**
- File-based routing in `src/routes/` with nested layouts
- API routes in `src/routes/api/` for server-side functionality
- Generated Prisma client in `src/generated/prisma/`
- Database schema in `prisma/schema.prisma` directory

## Code Style

- TypeScript: Strict mode with exactOptionalPropertyTypes, noUncheckedIndexedAccess
- Tabs for indentation (2 spaces for YAML/JSON/MD)
- Single quotes, no semicolons, trailing commas
- Use JSDoc docstrings for documenting TypeScript definitions, not `//` comments
- 120 character line limit
- Imports: Use consistent-type-imports
- Use descriptive variable/function names
- In CamelCase names, use "URL" (not "Url"), "API" (not "Api"), "ID" (not "Id")
- Prefer functional programming patterns
- Use TypeScript interfaces for public APIs
- NEVER use `@ts-expect-error` or `@ts-ignore` to suppress type errors

### Code Organization
- Components are organized by feature area (auth, tasks, workflows, etc.)
- UI components use shadcn/ui components with TailwindCSS styling
- Forms use TanStack Form with Zod schema validation
- Server state is managed with TanStack Query

### Feature Structure
- Features are organized in `src/features/` with domain-driven modules
- Each feature contains its own components, services, types, and business logic
- Feature folders use plural naming (e.g., `trades/`, `portfolio/`, `dividends/`)
- Shared components remain in `src/components/` for reuse across features

### Component Patterns
- Form components use TanStack Form with proper validation
- Data tables use custom data-table component with sorting/filtering
- Modals and dialogs use shadcn/ui Dialog component
- Status indicators use shadcn/ui Badge components with consistent styling
- When creating components with mapping logic, extract individual components for each map operation
- Each component should handle its own mapping logic and rendering for better organization and maintainability
- Keep all related components in the same file unless the component becomes too complex
- Component hierarchy should clearly reflect the data structure and document hierarchy

## Testing

- When writing tests, do it one test case at a time
- Use `expect(VALUE).toXyz(...)` instead of storing in variables
- Omit "should" from test names (e.g., `it("validates input")` not `it("should validate input")`)
- Vitest for unit testing
- Testing Library for component tests
- Test files: `*.test.ts` or `*.spec.ts`
- Mock external dependencies appropriately

## Git Workflow

- ALWAYS run `bun type-check` before committing
- Run `bun build` to verify type-check passes
- NEVER use `git push --force` on the main branch
- Use `git push --force-with-lease` for feature branches if needed
- Always verify current branch before force operations

## Security

Uses Better Auth with:
- Email/password authentication
- Session management with cookies
- Prisma adapter for data persistence
- Use appropriate data types that limit exposure of sensitive information
- Never commit secrets or API keys to repository
- Use environment variables for sensitive data
- Validate all user inputs on both client and server
- Use HTTPS in production
- Regular dependency updates
- Follow principle of least privilege

## Application Purpose

### Core Concept
Track trades, not portfolios. Users record individual buy/sell transactions, and the system derives portfolio state, positions, and performance metrics from the trade history.

### 1. Trade Management
- **Add Trade**: Record buy/sell transactions with symbol, quantity, price, date, and fees
- **Edit Trade**: Modify existing trades
- **Delete Trade**: Remove trades (creates compensating event)
- **Trade History**: View all trades chronologically

### 2. Position Tracking
- **Current Holdings**: Automatically calculated from trade history
- **Cost Basis**: FIFO-based average purchase price
- **Position Value**: Current quantity × current price (manual price entry for MVP)
- **Unrealized P&L**: Current value - cost basis

### 3. Performance Metrics
- **Total Invested**: Sum of all buy trades (quantity × price + fees)
- **Market Value**: Sum of all current position values
- **Total Return**: Market value - invested + realized gains
- **Return Percentage**: (Total return / invested) × 100

### 4. Asset Detail View
- **Trade Timeline**: All trades for specific symbol
- **Position History**: How position changed over time
- **Realized Gains**: Profit/loss from closed positions
- **Chart**: Price chart with buy/sell markers (basic version)

### 5. Search & Filter
- **Global Search**: Filter all views by symbol
- **Date Range**: Filter trades by date
- **Trade Type**: Show only buys or sells
- "Domain, lib functions and services need to have tests"
- use bun test for testing
- always create or update tests when you create domain logic