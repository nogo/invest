import { PrismaClient, EventType } from "../src/generated/prisma/client";
import { PrismaBunSQLite } from "@synapsenwerkstatt/prisma-bun-sqlite-adapter";
import type {
  TradeExecutedPayload,
  DividendReceivedPayload,
} from "../src/lib/events/trading-events";

// Create adapter and Prisma client for seeding
const adapter = new PrismaBunSQLite({ url: process.env.DATABASE_URL || "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

// Define event structure for seeding
interface SeedTradeEvent {
  eventType: EventType;
  timestamp: Date;
  payload: TradeExecutedPayload;
}

interface SeedDividendEvent {
  eventType: EventType;
  timestamp: Date;
  payload: DividendReceivedPayload;
}

// Sample trade events data
const sampleTradeEvents: SeedTradeEvent[] = [
  // Initial Apple purchase
  {
    eventType: EventType.TRADE_EXECUTED,
    timestamp: new Date('2024-01-15T10:30:00Z'),
    payload: {
      tradeId: "T20240115001",
      isin: "US0378331005",
      symbol: "AAPL",
      assetType: "STOCK",
      direction: "BUY",
      quantity: 100,
      price: 185.25,
      totalAmount: 18526.00,
      tradeDate: "2024-01-15",
      settlementDate: "2024-01-17",
      commission: 1.00,
      fees: 0.00,
      currency: "USD",
      exchangeRate: 1,
      accountId: "U123456789",
      brokerName: "Interactive Brokers",
      exchange: "NASDAQ",
      marketType: "REGULAR"
    }
  },
  
  // Microsoft purchase
  {
    eventType: EventType.TRADE_EXECUTED,
    timestamp: new Date('2024-01-22T14:15:00Z'),
    payload: {
      tradeId: "T20240122001",
      isin: "US5949181045",
      symbol: "MSFT",
      assetType: "STOCK",
      direction: "BUY",
      quantity: 50,
      price: 412.80,
      totalAmount: 20641.00,
      tradeDate: "2024-01-22",
      settlementDate: "2024-01-24",
      commission: 1.00,
      fees: 0.00,
      currency: "USD",
      exchangeRate: 1,
      accountId: "U123456789",
      brokerName: "Interactive Brokers",
      exchange: "NASDAQ",
      marketType: "REGULAR"
    }
  },

  // VWRL ETF purchase at DKB
  {
    eventType: EventType.TRADE_EXECUTED,
    timestamp: new Date('2024-02-05T09:00:00Z'),
    payload: {
      tradeId: "T20240205001",
      isin: "IE00B3RBWM25",
      symbol: "VWRL",
      assetType: "ETF",
      direction: "BUY",
      quantity: 250,
      price: 102.45,
      totalAmount: 25612.95,
      tradeDate: "2024-02-05",
      settlementDate: "2024-02-07",
      commission: 0.00,
      fees: 0.45,
      currency: "EUR",
      exchangeRate: 1.08,
      accountId: "1234-5678",
      brokerName: "DKB",
      exchange: "XETRA",
      marketType: "REGULAR",
      notes: "Monthly ETF savings plan"
    }
  },

  // Google purchase
  {
    eventType: EventType.TRADE_EXECUTED,
    timestamp: new Date('2024-02-28T11:45:00Z'),
    payload: {
      tradeId: "T20240228001",
      isin: "US02079K3059",
      symbol: "GOOGL",
      assetType: "STOCK",
      direction: "BUY",
      quantity: 25,
      price: 139.50,
      totalAmount: 3488.50,
      tradeDate: "2024-02-28",
      settlementDate: "2024-03-01",
      commission: 1.00,
      fees: 0.50,
      currency: "USD",
      exchangeRate: 1,
      accountId: "U123456789",
      brokerName: "Interactive Brokers",
      exchange: "NASDAQ",
      marketType: "REGULAR"
    }
  },

  // Tesla purchase at Scalable Capital
  {
    eventType: EventType.TRADE_EXECUTED,
    timestamp: new Date('2024-03-10T13:20:00Z'),
    payload: {
      tradeId: "T20240310001",
      isin: "US88160R1014",
      symbol: "TSLA",
      assetType: "STOCK",
      direction: "BUY",
      quantity: 15,
      price: 178.85,
      totalAmount: 2682.75,
      tradeDate: "2024-03-10",
      settlementDate: "2024-03-12",
      commission: 0.99,
      fees: 0.00,
      currency: "USD",
      exchangeRate: 1,
      accountId: "TR987654",
      brokerName: "Scalable Capital",
      exchange: "NASDAQ",
      marketType: "REGULAR"
    }
  },

  // Apple additional purchase
  {
    eventType: EventType.TRADE_EXECUTED,
    timestamp: new Date('2024-04-15T10:00:00Z'),
    payload: {
      tradeId: "T20240415001",
      isin: "US0378331005",
      symbol: "AAPL",
      assetType: "STOCK",
      direction: "BUY",
      quantity: 50,
      price: 169.12,
      totalAmount: 8457.00,
      tradeDate: "2024-04-15",
      settlementDate: "2024-04-17",
      commission: 1.00,
      fees: 0.00,
      currency: "USD",
      exchangeRate: 1,
      accountId: "U123456789",
      brokerName: "Interactive Brokers",
      exchange: "NASDAQ",
      marketType: "REGULAR"
    }
  },

  // Partial Microsoft sale
  {
    eventType: EventType.TRADE_EXECUTED,
    timestamp: new Date('2024-05-20T15:30:00Z'),
    payload: {
      tradeId: "T20240520001",
      isin: "US5949181045",
      symbol: "MSFT",
      assetType: "STOCK",
      direction: "SELL",
      quantity: 20,
      price: 425.67,
      totalAmount: 8512.40,
      tradeDate: "2024-05-20",
      settlementDate: "2024-05-22",
      commission: 1.00,
      fees: 0.00,
      currency: "USD",
      exchangeRate: 1,
      accountId: "U123456789",
      brokerName: "Interactive Brokers",
      exchange: "NASDAQ",
      marketType: "REGULAR",
      notes: "Profit taking"
    }
  },

  // NVIDIA purchase
  {
    eventType: EventType.TRADE_EXECUTED,
    timestamp: new Date('2024-06-12T12:15:00Z'),
    payload: {
      tradeId: "T20240612001",
      isin: "US67066G1040",
      symbol: "NVDA",
      assetType: "STOCK",
      direction: "BUY",
      quantity: 10,
      price: 118.75,
      totalAmount: 1188.50,
      tradeDate: "2024-06-12",
      settlementDate: "2024-06-14",
      commission: 1.00,
      fees: 0.50,
      currency: "USD",
      exchangeRate: 1,
      accountId: "U123456789",
      brokerName: "Interactive Brokers",
      exchange: "NASDAQ",
      marketType: "REGULAR"
    }
  }
];

// Sample dividend events
const sampleDividendEvents: SeedDividendEvent[] = [
  // Apple dividend
  {
    eventType: EventType.DIVIDEND_RECEIVED,
    timestamp: new Date('2024-02-16T08:00:00Z'),
    payload: {
      isin: "US0378331005",
      symbol: "AAPL",
      dividendAmount: 0.24,
      totalAmount: 24.00,
      sharesHeld: 100,
      exDate: "2024-02-09",
      paymentDate: "2024-02-16",
      recordDate: "2024-02-12",
      currency: "USD",
      taxWithheld: 0,
      accountId: "U123456789",
      brokerName: "Interactive Brokers",
      dividendType: "QUALIFIED"
    }
  },

  // Microsoft dividend
  {
    eventType: EventType.DIVIDEND_RECEIVED,
    timestamp: new Date('2024-03-14T08:00:00Z'),
    payload: {
      isin: "US5949181045",
      symbol: "MSFT",
      dividendAmount: 0.75,
      totalAmount: 37.50,
      sharesHeld: 50,
      exDate: "2024-02-15",
      paymentDate: "2024-03-14",
      recordDate: "2024-02-16",
      currency: "USD",
      taxWithheld: 0,
      accountId: "U123456789",
      brokerName: "Interactive Brokers",
      dividendType: "QUALIFIED"
    }
  },

  // VWRL dividend
  {
    eventType: EventType.DIVIDEND_RECEIVED,
    timestamp: new Date('2024-04-02T08:00:00Z'),
    payload: {
      isin: "IE00B3RBWM25",
      symbol: "VWRL",
      dividendAmount: 0.438,
      totalAmount: 109.50,
      sharesHeld: 250,
      exDate: "2024-03-21",
      paymentDate: "2024-04-02",
      recordDate: "2024-03-22",
      currency: "USD",
      taxWithheld: 0,
      accountId: "1234-5678",
      brokerName: "DKB",
      dividendType: "QUALIFIED"
    }
  },

  // Apple second dividend (after additional purchase)
  {
    eventType: EventType.DIVIDEND_RECEIVED,
    timestamp: new Date('2024-05-17T08:00:00Z'),
    payload: {
      isin: "US0378331005",
      symbol: "AAPL",
      dividendAmount: 0.24,
      totalAmount: 36.00,
      sharesHeld: 150,
      exDate: "2024-05-10",
      paymentDate: "2024-05-17",
      recordDate: "2024-05-13",
      currency: "USD",
      taxWithheld: 0,
      accountId: "U123456789",
      brokerName: "Interactive Brokers",
      dividendType: "QUALIFIED"
    }
  }
];

async function main(): Promise<void> {
  console.log('🌱 Starting seed process...');

  // Clear existing events
  console.log('🧹 Clearing existing events...');
  await prisma.event.deleteMany({});

  // Insert trade events
  console.log('📈 Creating trade events...');
  for (const event of sampleTradeEvents) {
    await prisma.event.create({
      data: {
        eventType: event.eventType,
        timestamp: event.timestamp,
        payload: JSON.stringify(event.payload)
      }
    });
  }

  // Insert dividend events
  console.log('💰 Creating dividend events...');
  for (const event of sampleDividendEvents) {
    await prisma.event.create({
      data: {
        eventType: event.eventType,
        timestamp: event.timestamp,
        payload: JSON.stringify(event.payload)
      }
    });
  }

  const totalEvents = sampleTradeEvents.length + sampleDividendEvents.length;
  console.log(`✅ Seed completed! Created ${totalEvents} events.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });