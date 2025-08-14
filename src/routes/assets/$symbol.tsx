import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { assetQueries } from '~/features/assets/api/queries'
import { TradeTimeline } from '~/features/assets/components/trade-timeline'
import { PositionHistory } from '~/features/assets/components/position-history'
import { AssetChart } from '~/features/assets/components/asset-chart'
import { formatCurrency } from '~/lib/i18n'
import { formatPercent, numberColor } from '~/lib/format'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/assets/$symbol')({
  component: AssetDetail,
})

function AssetDetail() {
  const { symbol } = Route.useParams()
  const { t } = useTranslation('common')

  const { data: assetData, isLoading, isError } = useQuery(
    assetQueries.assetDetail(symbol.toUpperCase())
  )

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="animate-pulse bg-muted rounded h-8 w-48"></div>
        </div>
        <div className="grid gap-6">
          <div className="animate-pulse bg-muted rounded h-64"></div>
          <div className="animate-pulse bg-muted rounded h-32"></div>
        </div>
      </div>
    )
  }

  if (isError || !assetData) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{symbol.toUpperCase()}</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {isError ? 'Error loading asset data' : 'Asset not found'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Make sure you have trades recorded for this symbol.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { position, trades, priceData } = assetData
  const hasValidPrice = priceData && !position.priceError
  const currentPrice = position.currentPrice || 0

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{position.symbol}</h1>
            <p className="text-muted-foreground">
              {priceData?.name || 'Asset Details'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{position.assetType}</Badge>
          <Badge variant="outline">{position.currency}</Badge>
          {!hasValidPrice && (
            <Badge variant="destructive">No Current Price</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Price Chart */}
        <AssetChart
          symbol={position.symbol}
          trades={trades}
          priceData={priceData}
        />

        {/* Position Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Position Summary</CardTitle>
            <CardDescription>Current holdings and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Current Holdings</h3>
                <p className="text-2xl font-bold">
                  {position.currentQuantity} {t('common.shares')}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Average Cost</h3>
                <p className="text-2xl font-bold">
                  {formatCurrency(position.averageCostPerShare, position.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('common.perShare')}
                </p>
              </div>

              {hasValidPrice && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Current Price</h3>
                    <p className="text-2xl font-bold">
                      {formatCurrency(currentPrice, position.currency)}
                    </p>
                    {position.dailyChange !== undefined && (
                      <p className={cn("text-xs", numberColor(position.dailyChange))}>
                        {position.dailyChange > 0 ? '+' : ''}
                        {formatCurrency(position.dailyChange, position.currency)} today
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Unrealized P&L</h3>
                    <p className={cn("text-2xl font-bold", numberColor(position.unrealizedGain))}>
                      {formatCurrency(position.unrealizedGain, position.currency)}
                    </p>
                    <p className={cn("text-xs", numberColor(position.unrealizedGain))}>
                      {formatPercent(position.unrealizedGainPercent)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Investment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Invested</h3>
                <p className="text-xl font-semibold">
                  {formatCurrency(position.totalCostBasis, position.currency)}
                </p>
              </div>

              {hasValidPrice && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Current Value</h3>
                  <p className="text-xl font-semibold">
                    {formatCurrency(position.currentMarketValue, position.currency)}
                  </p>
                </div>
              )}

              {position.totalRealizedGain !== 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Realized Gains</h3>
                  <p className={cn("text-xl font-semibold", numberColor(position.totalRealizedGain))}>
                    {formatCurrency(position.totalRealizedGain, position.currency)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Position History */}
        <PositionHistory position={position} />

        {/* Trade Timeline with Chart and List Views */}
        <TradeTimeline trades={trades} symbol={position.symbol} />
      </div>
    </div>
  )
}