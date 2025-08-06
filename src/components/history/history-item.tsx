import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { Activity, DollarSign, Calendar, TrendingUp, TrendingDown } from "lucide-react"

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
  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'TRADE_EXECUTED':
        return <Activity className="h-4 w-4" />
      case 'DIVIDEND_RECEIVED':
        return <DollarSign className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getEventColor = (type: string, payload: any) => {
    if (type === 'TRADE_EXECUTED') {
      return payload.direction === 'BUY' ? 'text-green-600' : 'text-red-600'
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
            {getEventIcon(event.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium">
                {formatEventType(event.type)}
              </p>
              <Badge variant="outline" className="text-xs">
                {event.type}
              </Badge>
            </div>
            
            {event.type === 'TRADE_EXECUTED' && (
              <div className="text-sm text-muted-foreground">
                <p>
                  {event.payload.direction} {event.payload.quantity} {event.payload.symbol} @ {formatCurrency(event.payload.price)}
                </p>
                <p>
                  {event.payload.brokerName} " {event.payload.assetType}
                </p>
              </div>
            )}
            
            {event.type === 'DIVIDEND_RECEIVED' && (
              <div className="text-sm text-muted-foreground">
                <p>
                  {event.payload.symbol} " {event.payload.sharesHeld} shares
                </p>
                <p>
                  {formatCurrency(event.payload.dividendAmount)} per share
                </p>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(event.timestamp).toLocaleString()}
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
            <div className="flex items-center mt-1">
              {event.payload.direction === 'BUY' ? (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              ) : (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              )}
              <span className="text-xs text-muted-foreground">
                {event.payload.direction}
              </span>
            </div>
          )}
        </div>
      </div>
      {showSeparator && <Separator className="mt-4" />}
    </div>
  )
}