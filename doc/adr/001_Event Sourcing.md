# ADR-001: Event Sourcing for Portfolio Management

## Status
Accepted

## Context
Invest needs to track financial transactions across multiple brokers with absolute accuracy. Key requirements include:
- Complete audit trail of all financial movements
- Ability to recalculate portfolio state at any point in time
- Support for corrections without losing history
- Complex performance calculations (TWR, MWR) that depend on transaction timing
- Legal compliance requiring immutable transaction records

## Decision
We will implement Event Sourcing as the primary data persistence pattern, where:
- All state changes are captured as immutable events
- Current state is derived by replaying events
- Events are the single source of truth

## Consequences

### Positive
- **Audit Trail**: Every change is permanently recorded with timestamp and context
- **Time Travel**: Can reconstruct portfolio state at any historical point
- **Performance Calculations**: Accurate TWR/MWR calculations with proper event ordering
- **Error Correction**: Add compensating events instead of modifying history
- **Debugging**: Complete history aids in understanding how state evolved
- **Compliance**: Immutable records satisfy financial regulations

### Negative
- **Complexity**: Requires understanding of event sourcing patterns
- **Storage**: Events accumulate over time (mitigated by SQLite efficiency)
- **Learning Curve**: Team needs to think in events rather than CRUD
- **Eventual Consistency**: Read models may lag behind events (acceptable for this use case)

## Implementation Details

### Event Store Structure
```typescript
interface Event {
  id: string
  aggregateId: string
  aggregateType: string
  eventType: string
  eventVersion: number
  payload: unknown
  metadata: {
    timestamp: Date
    userId: string
    correlationId?: string
  }
}
```

### Read Model Generation
- Use Prisma to store denormalized read models
- Rebuild projections by replaying events
- Cache current positions for performance

### Event Categories
1. **Money Flow Events**: Deposits, withdrawals
2. **Trading Events**: Buy, sell, transfer
3. **Income Events**: Dividends, interest, tax
4. **Correction Events**: Adjustments, splits, mergers

## Alternatives Considered

### Traditional CRUD with History Tables
- Rejected: Complex to maintain accurate history
- Would require triggers/timestamps on every change

### Change Data Capture (CDC)
- Rejected: Overkill for single-user application
- Adds infrastructure complexity

### State-based with Snapshots
- Rejected: Loses transaction-level detail
- Cannot accurately calculate time-weighted returns

## References
- [Martin Fowler - Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Event Store Documentation](https://www.eventstore.com/event-sourcing)
- Financial calculations require event-level granularity