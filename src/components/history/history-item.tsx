import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { Activity, DollarSign, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency } from '~/lib/i18n'

interface EventData {
  id: string
  type: string
  timestamp: Date
  payload: any
}

interface HistoryItemProps {
  event: EventData
  showSeparator: boolean
}

export function HistoryItem({ event, showSeparator }: HistoryItemProps) {
  const { t } = useTranslation('common');
  
  const getEventTypeTranslation = (type: string) => {
    switch (type) {
      case 'TRADE_EXECUTED':
        return t('trade.tradeExecuted')
      case 'DIVIDEND_RECEIVED':
        return t('trade.dividendReceived')
      default:
        return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const getEventIcon = (type: string, payload?: any) => {
    switch (type) {
      case 'TRADE_EXECUTED':
        // Use direction-specific icons for better visual clarity
        return payload?.direction === 'BUY' 
          ? <TrendingDown className="h-4 w-4 text-red-500" />
          : <TrendingUp className="h-4 w-4 text-green-500" />
      case 'DIVIDEND_RECEIVED':
        return <DollarSign className="h-4 w-4 text-green-500" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getEventColor = (type: string, payload: any) => {
    if (type === 'TRADE_EXECUTED') {
      // Cash flow perspective: BUY = money out (red), SELL = money in (green)
      return payload.direction === 'BUY' ? 'text-red-600' : 'text-green-600'
    }
    if (type === 'DIVIDEND_RECEIVED') {
      return 'text-green-600'
    }
    return 'text-muted-foreground'
  }

  const getEventAmount = (type: string, payload: any) => {
    if (type === 'TRADE_EXECUTED') {
      return payload.direction === 'BUY' ? -Math.abs(payload.totalAmount) : Math.abs(payload.totalAmount)
    }
    if (type === 'DIVIDEND_RECEIVED') {
      return payload.totalAmount || payload.dividendAmount
    }
    return 0
  }

  const amount = getEventAmount(event.type, event.payload)
  const color = getEventColor(event.type, event.payload)

  return (
    <div>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted mt-1">
            {getEventIcon(event.type, event.payload)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium">
                {getEventTypeTranslation(event.type)}
              </p>
              <Badge variant="outline" className="text-xs">
                {event.type}
              </Badge>
            </div>
            
            {event.type === 'TRADE_EXECUTED' && (
              <div className="text-sm text-muted-foreground">
                <p>
                  {event.payload.direction === 'BUY' ? t('trade.buy') : t('trade.sell')} {event.payload.quantity} {event.payload.symbol} @ {formatCurrency(event.payload.price)}
                </p>
                <p>
                  {event.payload.brokerName} • {event.payload.assetType}
                </p>
              </div>
            )}
            
            {event.type === 'DIVIDEND_RECEIVED' && (
              <div className="text-sm text-muted-foreground">
                <p>
                  {event.payload.symbol} • {event.payload.sharesHeld} {t('common.shares')}
                </p>
                <p>
                  {formatCurrency(event.payload.dividendAmount)} {t('common.perShare')}
                </p>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(event.timestamp), 'MMM d, yyyy \'at\' h:mm a')}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className={`text-sm font-medium ${color}`}>
            {amount !== 0 && (
              <>
                {amount > 0 ? '+' : ''}{formatCurrency(amount)}
              </>
            )}
          </p>
          {event.type === 'TRADE_EXECUTED' && (
            <span className="text-xs text-muted-foreground mt-1 block">
              {event.payload.direction}
            </span>
          )}
        </div>
      </div>
      {showSeparator && <Separator className="mt-4" />}
    </div>
  )
}