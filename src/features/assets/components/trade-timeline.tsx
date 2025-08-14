import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { ChevronUp, ChevronDown, Calendar } from "lucide-react"
import type { TradeExecution } from '~/features/portfolio/domain/position-calculator'

interface TradeTimelineProps {
  trades: TradeExecution[]
  symbol: string
}

interface TradeItemProps {
  trade: TradeExecution
  isFirst: boolean
  isLast: boolean
}

function TradeItem({ trade, isFirst, isLast }: TradeItemProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const isBuy = trade.direction === 'BUY'
  const totalWithFees = Math.abs(trade.totalCost)

  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-4 top-12 w-0.5 h-full bg-border" />
      )}
      
      <div className="flex items-start gap-4">
        {/* Timeline marker */}
        <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
          isBuy 
            ? 'bg-green-50 border-green-500 text-green-700' 
            : 'bg-red-50 border-red-500 text-red-700'
        }`}>
          {isBuy ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>

        {/* Trade details */}
        <div className="flex-1 pb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant={isBuy ? "default" : "destructive"} className="text-xs">
                {trade.direction}
              </Badge>
              <span className="text-sm font-medium">
                {trade.quantity} shares @ {formatCurrency(trade.price, trade.currency)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(trade.tradeDate, 'MMM dd, yyyy')}
            </span>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Total Value:</span>
              <span className="font-medium">
                {formatCurrency(trade.totalValue, trade.currency)}
              </span>
            </div>
            
            {(trade.fees > 0 || trade.commission > 0) && (
              <div className="flex justify-between">
                <span>Fees & Commission:</span>
                <span>
                  {formatCurrency(trade.fees + trade.commission, trade.currency)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between font-medium pt-1 border-t">
              <span>Total {isBuy ? 'Cost' : 'Proceeds'}:</span>
              <span className={isBuy ? 'text-red-600' : 'text-green-600'}>
                {isBuy ? '-' : '+'}{formatCurrency(totalWithFees, trade.currency)}
              </span>
            </div>
            
            {trade.brokerName && (
              <div className="flex justify-between text-xs">
                <span>Broker:</span>
                <span>{trade.brokerName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TradeTimeline({ trades, symbol }: TradeTimelineProps) {
  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>All trades for {symbol}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trades found for this asset</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalBought = trades
    .filter(t => t.direction === 'BUY')
    .reduce((sum, t) => sum + t.quantity, 0)
  
  const totalSold = trades
    .filter(t => t.direction === 'SELL')
    .reduce((sum, t) => sum + t.quantity, 0)
  
  const totalInvested = trades
    .filter(t => t.direction === 'BUY')
    .reduce((sum, t) => sum + t.totalCost, 0)
  
  const totalProceeds = trades
    .filter(t => t.direction === 'SELL')
    .reduce((sum, t) => sum + Math.abs(t.totalCost), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade History</CardTitle>
        <CardDescription>
          All {trades.length} trade{trades.length !== 1 ? 's' : ''} for {symbol}
        </CardDescription>
        
        {/* Trade Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-green-600">Total Bought</p>
            <p className="text-lg font-bold">{totalBought}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-red-600">Total Sold</p>
            <p className="text-lg font-bold">{totalSold}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Total Invested</p>
            <p className="text-lg font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: trades[0]?.currency || 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(totalInvested)}
            </p>
          </div>
          {totalProceeds > 0 && (
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Proceeds</p>
              <p className="text-lg font-bold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: trades[0]?.currency || 'EUR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(totalProceeds)}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {trades.map((trade, index) => (
            <TradeItem
              key={trade.id}
              trade={trade}
              isFirst={index === 0}
              isLast={index === trades.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}