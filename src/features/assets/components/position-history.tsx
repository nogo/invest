import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Progress } from "~/components/ui/progress"
import { TrendingUp, TrendingDown, Minus, DollarSign, Percent } from "lucide-react"
import { formatNumber, formatCurrency, formatPercent } from '~/lib/i18n'
import type { EnrichedPosition } from '~/features/portfolio/domain/portfolio-aggregator'

interface PositionHistoryProps {
  position: EnrichedPosition
}

export function PositionHistory({ position }: PositionHistoryProps) {
  // Calculate some derived metrics
  const hasRealizedGains = position.totalRealizedGain !== 0
  const hasPosition = position.currentQuantity > 0

  const getPerformanceIcon = (gain: number) => {
    if (gain > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (gain < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const getPerformanceColor = (gain: number) => {
    if (gain > 0) return 'text-green-600'
    if (gain < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Position Analysis</CardTitle>
        <CardDescription>
          Detailed breakdown of your {position.symbol} holdings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Position Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Investment Breakdown
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Bought</span>
                <span className="font-medium">{position.totalBought} shares</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Sold</span>
                <span className="font-medium">{position.totalSold} shares</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Current Holdings</span>
                <span className="text-lg font-bold">{position.currentQuantity} shares</span>
              </div>

              {/* Position Progress Bar */}
              {position.totalBought > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Sold</span>
                    <span>Holding</span>
                  </div>
                  <Progress 
                    value={(position.currentQuantity / position.totalBought) * 100}
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Performance Metrics
            </h3>
            
            <div className="space-y-3">
              {hasPosition && position.priceData && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Unrealized P&L</span>
                    <div className="text-right">
                      <div className={`font-medium ${getPerformanceColor(position.unrealizedGain)}`}>
                        {formatCurrency(position.unrealizedGain, position.currency)}
                      </div>
                      <div className={`text-xs ${getPerformanceColor(position.unrealizedGain)}`}>
                        {formatPercent(position.unrealizedGainPercent, true)}
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {hasRealizedGains && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Realized P&L</span>
                  <div className="text-right">
                    <div className={`font-medium ${getPerformanceColor(position.totalRealizedGain)}`}>
                      {formatCurrency(position.totalRealizedGain, position.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      From {position.realizedGains.length} sell{position.realizedGains.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )}

              {hasPosition && position.priceData && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Total P&L</span>
                  <div className="text-right">
                    <div className={`text-lg font-bold flex items-center gap-1 ${getPerformanceColor(position.totalGain)}`}>
                      {getPerformanceIcon(position.totalGain)}
                      {formatCurrency(position.totalGain, position.currency)}
                    </div>
                    <div className={`text-xs ${getPerformanceColor(position.totalGain)}`}>
                      {formatPercent(position.totalGainPercent, true)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cost Basis Breakdown */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Cost Basis Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Original Investment</h4>
              <p className="text-lg font-bold">
                {formatCurrency(position.totalBuyValue, position.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                Gross purchase value
              </p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Fees & Commissions</h4>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(position.totalFeesAndCommissions, position.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total trading costs
              </p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Current Cost Basis</h4>
              <p className="text-lg font-bold">
                {formatCurrency(position.totalCostBasis, position.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                FIFO remaining cost
              </p>
            </div>
          </div>
        </div>

        {/* Remaining Lots (FIFO) */}
        {position.remainingLots.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Remaining Buy Lots (FIFO Order)</h3>
            
            <div className="space-y-2">
              {position.remainingLots.slice(0, 5).map((lot, index) => (
                <div key={lot.tradeId} className="flex items-center justify-between p-3 bg-muted/30 rounded border-l-4 border-blue-500">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      Lot {index + 1}
                    </Badge>
                    <span className="text-sm">
                      {lot.remainingQuantity} shares @ {formatCurrency(lot.costPerShare, position.currency)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(lot.remainingQuantity * lot.costPerShare, position.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Cost basis
                    </div>
                  </div>
                </div>
              ))}
              
              {position.remainingLots.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  ... and {position.remainingLots.length - 5} more lot{position.remainingLots.length - 5 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Trading Activity Summary */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground">Trading Activity</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{position.tradeCount}</p>
              <p className="text-xs text-muted-foreground">Total Trades</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Math.round((new Date().getTime() - position.firstTradeDate.getTime()) / (1000 * 60 * 60 * 24))}
              </p>
              <p className="text-xs text-muted-foreground">Days Held</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{position.realizedGains.length}</p>
              <p className="text-xs text-muted-foreground">Sell Transactions</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {position.totalFeesAndCommissions > 0 && position.totalBuyValue > 0
                  ? formatNumber((position.totalFeesAndCommissions / position.totalBuyValue) * 100, 2)
                  : formatNumber(0, 2)
                }%
              </p>
              <p className="text-xs text-muted-foreground">Fee Percentage</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}