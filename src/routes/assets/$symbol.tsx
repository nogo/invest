import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from "~/components/ui/card"
import { assetQueries } from '~/features/assets/api/queries'
import { TradeTimeline } from '~/features/assets/components/trade-timeline'
import { PositionHistory } from '~/features/assets/components/position-history'
import { AssetChart } from '~/features/assets/components/asset-chart'
import { PositionSummary } from '~/features/assets/components/position-summary'

export const Route = createFileRoute('/assets/$symbol')({
  component: AssetDetail
})

function AssetDetail() {
  const { symbol } = Route.useParams()

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

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
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

      <div className="grid gap-6">
        {/* Price Chart */}
        <AssetChart
          symbol={position.symbol}
          trades={trades}
          priceData={priceData}
        />

        {/* Position Summary */}
        <PositionSummary position={position} priceData={priceData} />

        {/* Position History */}
        <PositionHistory position={position} />

        {/* Trade Timeline with Chart and List Views */}
        <TradeTimeline trades={trades} symbol={position.symbol} />
      </div>
    </div>
  )
}