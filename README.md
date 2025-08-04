# Invest 📊

A personal portfolio management application for consolidated oversight across multiple brokerage accounts.

## 🎯 Problem

When using multiple brokers (neobrokers, direct banks, specialty providers), it's easy to lose track of:
- Actual invested capital
- Total performance across all accounts
- Received dividends
- Portfolio value development over time

## ✨ Core Features (MVP)

- **Transaction History**: Record all trades using event sourcing
- **Invested Capital**: Clear overview of deposits and withdrawals
- **Dividend Tracking**: Central recording of all distributions
- **Performance Calculation**: Time-weighted and money-weighted returns
- **Multi-Broker Consolidation**: Total overview across all brokers

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Tanstack Start](https://tanstack.com/start) (Full-Stack React)
- **UI**: React + TypeScript + Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
- **Forms**: [Tanstack Form](https://tanstack.com/form)
- **Database**: SQLite + [Prisma](https://www.prisma.io/)
- **Auth**: [better-auth](https://www.better-auth.com/)
- **Architecture**: Event-Driven / Event Sourcing

## 📁 Project Structure

```
invest/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── public/                 # Static assets
├── src/
│   ├── components/          # React components
│   ├── routes/             # Tanstack Start routes
│   ├── lib/                # Utilities & helpers
└── tests/                  # Test files
```

## 🏗️ Event-Driven Architecture

All changes are stored as events:

```typescript
// Example events
type PortfolioEvent = 
  | { type: 'DEPOSIT_CREATED', amount: number, date: Date, broker: string }
  | { type: 'WITHDRAWAL_CREATED', amount: number, date: Date, broker: string }
  | { type: 'TRADE_EXECUTED', symbol: string, quantity: number, price: number, date: Date }
  | { type: 'DIVIDEND_RECEIVED', symbol: string, amount: number, date: Date }
```

## 🚀 Getting Started

```bash
# Installation
bun install

# Database setup
bun prisma migrate dev

# Development
bun dev

# Build
bun build
```

## 🔄 Import Strategy

1. **Phase 1**: Manual transaction entry
2. **Phase 2**: CSV/PDF import parsers for common brokers
3. **Phase 3**: API integration (where available)

## 🎯 Roadmap

### Version 1.0 (MVP)
- [ ] Basic data model with event sourcing
- [ ] Manual transaction entry
- [ ] Portfolio overview
- [ ] Invested capital calculation
- [ ] Simple performance metrics

### Version 2.0
- [ ] CSV/PDF import
- [ ] Advanced charts
- [ ] Asset allocation analysis
- [ ] Tax reporting basics

### Version 3.0
- [ ] API integrations
- [ ] Mobile app
- [ ] Multi-currency support
- [ ] Benchmarking

## 🤝 Contributing

This is currently a personal project. Feel free to reach out if interested in collaboration!

## 📝 License

MIT License

---

Built with ❤️ by [Danilo](https://github.com/[your-github]) @ SynapsenWerkstatt
