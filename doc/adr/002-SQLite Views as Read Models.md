# ADR-002: SQLite Views as Read Models

## Status
Accepted

## Context
Following ADR-001's decision to use Event Sourcing, we need to implement read models for queries. Traditional event sourcing uses separate projection tables updated by event handlers. However, for a single-user investment tracking application, we can leverage SQLite's view capabilities for a simpler architecture.

## Decision
We will use SQLite views as our primary read models, calculating projections directly from the event store on-demand rather than maintaining separate projection tables.

## Consequences

### Positive
- **Zero Sync Lag**: Views always reflect the current state of events
- **Simpler Architecture**: No projection handlers, no eventual consistency to manage
- **Faster Development**: Change a view definition instead of writing migration + handler
- **Automatic Consistency**: Impossible for projections to drift from events
- **Storage Efficient**: No duplicate data in projection tables
- **Time Travel Built-in**: Query historical state with WHERE clauses on timestamp

### Negative
- **Query Performance**: Complex aggregations computed on each query (mitigated by SQLite's efficiency and proper indexing)
- **Limited to SQL**: Can't use complex business logic in projections (acceptable for financial calculations)
- **Prisma Limitations**: Views have limited support in Prisma (use raw queries when needed)
- **Scale Limits**: May need optimization for millions of events (not a concern for personal use)

## Implementation Guidelines

### Essential Indexes
```sql
CREATE INDEX idx_event_aggregate_time ON Event(aggregateId, timestamp);
CREATE INDEX idx_event_type_time ON Event(eventType, timestamp);
CREATE INDEX idx_event_json_symbol ON Event(json_extract(payload, '$.symbol'));
```

### View Patterns
1. **Current State Views**: `CurrentPosition`, `PortfolioPerformance`
2. **Historical Views**: `TransactionHistory`, `DividendMonthly`
3. **Aggregate Views**: `CashFlowSummary`, `PortfolioDailyValue`

### Performance Thresholds
- If a view query takes >100ms, consider:
  1. Adding specific indexes
  2. Simplifying the view logic
  3. Creating a materialized view for that specific case

## Alternatives Considered

### Traditional Projection Tables
- Rejected: Adds complexity without benefit for single-user app
- Would require event handlers and consistency management

### In-Memory Projections
- Rejected: Would need to replay all events on startup
- Loses SQLite's query optimization capabilities

### GraphQL Resolvers
- Rejected: Still need to calculate somewhere
- Views provide better performance than application-level aggregation

## Migration Path
If scale requires traditional projections later:
1. Keep views as "reference implementation"
2. Add projection tables alongside views
3. Verify consistency between views and projections
4. Gradually move queries to projection tables
5. Keep views for ad-hoc analysis

## References
- [SQLite View Performance](https://www.sqlite.org/queryplanner.html)
- [Event Sourcing without Projections](https://eventstore.com/blog/event-sourcing-projections/)