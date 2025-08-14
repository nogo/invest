import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { formatCurrency } from '~/lib/i18n'
import { formatPercent } from '~/lib/i18n'
import { numberColor } from '~/lib/format'
import { cn } from '~/lib/utils'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

interface PositionSummaryProps {
  position: {
    symbol: string
    currentQuantity: number
    averageCostPerShare: number
    currency: string
    currentPrice?: number
    dailyChange?: number
    unrealizedGain: number
    unrealizedGainPercent: number
    totalCostBasis: number
    currentMarketValue: number
    totalRealizedGain: number
    priceError?: string
    assetType: string
  }
  priceData?: {
    name?: string
  }
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  isHighlighted = false,
  className 
}: {
  title: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  isHighlighted?: boolean
  className?: string
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null
  
  return (
    <div className={cn(
      "space-y-2 p-4 rounded-lg transition-all duration-200",
      isHighlighted && "bg-muted/50 border border-border",
      className
    )}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {TrendIcon && (
          <TrendIcon className={cn(
            "h-4 w-4",
            trend === 'up' ? "text-green-600" : "text-red-600"
          )} />
        )}
      </div>
      <p className={cn(
        "font-bold leading-none",
        isHighlighted ? "text-3xl" : "text-2xl"
      )}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}

export function PositionSummary({ position, priceData }: PositionSummaryProps) {
  const { t } = useTranslation('common')
  
  const hasValidPrice = priceData && !position.priceError
  const currentPrice = position.currentPrice || 0
  const hasGains = position.unrealizedGain !== 0
  const hasDailyChange = position.dailyChange !== undefined
  const hasRealizedGains = position.totalRealizedGain !== 0

  const unrealizedTrend = position.unrealizedGain > 0 ? 'up' : position.unrealizedGain < 0 ? 'down' : 'neutral'
  const dailyTrend = position.dailyChange && position.dailyChange > 0 ? 'up' : 
                     position.dailyChange && position.dailyChange < 0 ? 'down' : 'neutral'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">Position Summary</CardTitle>
            <CardDescription>Current holdings and performance metrics</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">{position.assetType}</Badge>
            <Badge variant="outline" className="text-xs">{position.currency}</Badge>
            {!hasValidPrice && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                No Current Price
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Key Performance Metrics - Highlighted Section */}
        {hasValidPrice && hasGains && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Performance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCard
                title="Unrealized P&L"
                value={formatCurrency(position.unrealizedGain, position.currency)}
                subtitle={formatPercent(position.unrealizedGainPercent)}
                trend={unrealizedTrend}
                isHighlighted={true}
                className={cn(
                  position.unrealizedGain >= 0 ? "bg-green-50 border-green-200 dark:bg-green-950/20" : 
                  "bg-red-50 border-red-200 dark:bg-red-950/20"
                )}
              />
              <MetricCard
                title="Current Value"
                value={formatCurrency(position.currentMarketValue, position.currency)}
                subtitle="Market value of holdings"
                isHighlighted={true}
              />
            </div>
          </div>
        )}

        {/* Position Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Position Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Holdings"
              value={`${position.currentQuantity}`}
              subtitle={`${t('common.shares')}`}
            />
            
            <MetricCard
              title="Average Cost"
              value={formatCurrency(position.averageCostPerShare, position.currency)}
              subtitle={`${t('common.perShare')}`}
            />

            {hasValidPrice && (
              <MetricCard
                title="Current Price"
                value={formatCurrency(currentPrice, position.currency)}
                subtitle={hasDailyChange ? 
                  `${position.dailyChange! > 0 ? '+' : ''}${formatCurrency(position.dailyChange!, position.currency)} today` : 
                  undefined
                }
                trend={dailyTrend}
                className={hasDailyChange ? cn(
                  "text-sm",
                  numberColor(position.dailyChange!)
                ) : undefined}
              />
            )}

            <MetricCard
              title="Total Invested"
              value={formatCurrency(position.totalCostBasis, position.currency)}
              subtitle="Cost basis"
            />
          </div>
        </div>

        {/* Additional Metrics */}
        {hasRealizedGains && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Historical Performance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCard
                title="Realized Gains"
                value={formatCurrency(position.totalRealizedGain, position.currency)}
                subtitle="From closed positions"
                trend={position.totalRealizedGain > 0 ? 'up' : position.totalRealizedGain < 0 ? 'down' : 'neutral'}
                className={cn(
                  position.totalRealizedGain >= 0 ? "bg-green-50 border-green-200 dark:bg-green-950/20" : 
                  "bg-red-50 border-red-200 dark:bg-red-950/20"
                )}
              />
            </div>
          </div>
        )}

        {/* No Price Data State */}
        {!hasValidPrice && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Price Data Unavailable</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Current price data is not available for this position.
              Performance metrics will be calculated once price data becomes available.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}