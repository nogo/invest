import { resources } from '~/lib/i18n'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: typeof resources['en']
  }
}

// Type-safe translation key paths
export type TranslationKeys = {
  'navigation.dashboard': string
  'navigation.history': string
  'navigation.portfolio': string
  'navigation.settings': string
  'actions.import': string
  'actions.export': string
  'actions.newTrade': string
  'actions.save': string
  'actions.cancel': string
  'actions.edit': string
  'actions.delete': string
  'actions.search': string
  'actions.filter': string
  'actions.clear': string
  'portfolio.summary': string
  'portfolio.moneyInvested': string
  'portfolio.currentValue': string
  'portfolio.totalReturn': string
  'portfolio.totalReturnPercent': string
  'portfolio.dailyChange': string
  'portfolio.unrealizedGains': string
  'portfolio.realizedGains': string
  'trade.recordTrade': string
  'trade.tradeType': string
  'trade.buy': string
  'trade.sell': string
  'trade.symbol': string
  'trade.isin': string
  'trade.quantity': string
  'trade.price': string
  'trade.totalAmount': string
  'trade.fees': string
  'trade.date': string
  'trade.broker': string
  'trade.account': string
  'trade.assetType': string
  'trade.stock': string
  'trade.etf': string
  'trade.bond': string
  'trade.crypto': string
  'history.tradeHistory': string
  'history.noTrades': string
  'history.searchPlaceholder': string
  'common.loading': string
  'common.error': string
  'common.success': string
  'common.confirmation': string
  'common.yes': string
  'common.no': string
  'common.close': string
}