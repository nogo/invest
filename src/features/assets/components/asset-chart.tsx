import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip
} from "~/components/ui/chart"
import { 
  ComposedChart, 
  Line, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ReferenceLine
} from "recharts"
import { ChevronUp, ChevronDown, BarChart3 } from "lucide-react"
import type { TradeExecution } from '~/features/portfolio/domain/position-calculator'
import type { PriceData } from '~/features/prices/domain/types'
import { formatCurrency, formatPercent } from '~/lib/i18n'

interface AssetChartProps {
  symbol: string
  trades: TradeExecution[]
  priceData?: PriceData
}

interface ChartDataPoint {
  date: string
  dateLabel: string
  price: number
  quantity: number
  direction: 'BUY' | 'SELL'
  totalCost: number
  runningShares: number
  avgCostBasis: number
  formattedDate: string
  isCurrentPrice?: boolean
}

const chartConfig = {
  price: {
    label: "Trade Price",
    color: "hsl(var(--chart-1))",
  },
  avgCostBasis: {
    label: "Average Cost",
    color: "hsl(var(--chart-3))",
  },
  buyTrade: {
    label: "Buy",
    color: "hsl(142, 71%, 45%)",
  },
  sellTrade: {
    label: "Sell", 
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig

export function AssetChart({ symbol, trades, priceData }: AssetChartProps) {
  const { t } = useTranslation('common')

  const chartData = useMemo(() => {
    if (trades.length === 0) return []

    // Sort trades by date (oldest first)
    const sortedTrades = [...trades].sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime())
    
    let runningShares = 0
    let totalCostBasis = 0
    const data: ChartDataPoint[] = []

    sortedTrades.forEach((trade) => {
      if (trade.direction === 'BUY') {
        totalCostBasis += trade.totalCost
        runningShares += trade.quantity
      } else {
        // For sells, reduce shares but keep cost basis calculation simple for chart
        runningShares -= trade.quantity
      }

      const avgCostBasis = runningShares > 0 ? totalCostBasis / runningShares : 0

      data.push({
        date: trade.tradeDate.getTime().toString(),
        dateLabel: format(trade.tradeDate, 'MMM dd'),
        price: trade.price,
        quantity: trade.quantity,
        direction: trade.direction,
        totalCost: Math.abs(trade.totalCost),
        runningShares: Math.max(0, runningShares),
        avgCostBasis: avgCostBasis,
        formattedDate: format(trade.tradeDate, 'MMM dd, yyyy')
      })
    })

    // Add current price point if available
    if (priceData?.price) {
      data.push({
        date: priceData.timestamp.getTime().toString(),
        dateLabel: format(priceData.timestamp, 'MMM dd'),
        price: priceData.price,
        quantity: 0,
        direction: 'BUY', // Just for display
        totalCost: 0,
        runningShares: runningShares,
        avgCostBasis: runningShares > 0 ? totalCostBasis / runningShares : 0,
        formattedDate: format(priceData.timestamp, 'MMM dd, yyyy'),
        isCurrentPrice: true
      })
    }

    return data.sort((a, b) => parseInt(a.date) - parseInt(b.date))
  }, [trades, priceData])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload as ChartDataPoint
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            {!data.isCurrentPrice && (
              <Badge variant={data.direction === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                {data.direction === 'BUY' ? (
                  <ChevronUp className="w-3 h-3 mr-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 mr-1" />
                )}
                {data.direction}
              </Badge>
            )}
            <span className="text-sm font-medium">{data.formattedDate}</span>
          </div>
          
          <div className="space-y-1 text-sm">
            {!data.isCurrentPrice && (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">{data.quantity} shares</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{formatCurrency(data.totalCost)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-medium">{formatCurrency(data.price)}</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t">
              <span className="text-muted-foreground">Holdings:</span>
              <span className="font-medium">{data.runningShares} shares</span>
            </div>
            {data.avgCostBasis > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Avg Cost:</span>
                <span className="font-medium">{formatCurrency(data.avgCostBasis)}</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    if (!payload) return null

    if (payload.isCurrentPrice) {
      return (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={8}
            fill="hsl(217, 91%, 60%)"
            stroke="hsl(217, 91%, 50%)"
            strokeWidth={3}
          />
          <circle
            cx={cx}
            cy={cy}
            r={4}
            fill="white"
          />
        </g>
      )
    }

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill={payload.direction === 'BUY' ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'}
          stroke={payload.direction === 'BUY' ? 'hsl(142, 71%, 35%)' : 'hsl(0, 84%, 50%)'}
          strokeWidth={2}
        />
        {/* Icon inside dot */}
        <foreignObject x={cx - 6} y={cy - 6} width={12} height={12}>
          <div className="flex items-center justify-center w-full h-full">
            {payload.direction === 'BUY' ? (
              <ChevronUp className="w-3 h-3 text-white" />
            ) : (
              <ChevronDown className="w-3 h-3 text-white" />
            )}
          </div>
        </foreignObject>
      </g>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
          <CardDescription>Price timeline with trade markers for {symbol}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trade data available for charting</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const tradeData = chartData.filter(p => !p.isCurrentPrice)
  const currentPricePoint = chartData.find(p => p.isCurrentPrice)
  const currency = trades[0]?.currency || 'EUR'
  
  const avgPrice = tradeData.length > 0 ? tradeData.reduce((sum, d) => sum + d.price, 0) / tradeData.length : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Chart</CardTitle>
        <CardDescription>
          Price timeline with trade markers for {symbol}
          {currentPricePoint && (
            <Badge variant="outline" className="ml-2">
              Current: {formatCurrency(currentPricePoint.price, currency)}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Professional Recharts visualization */}
          <ChartContainer config={chartConfig} className="min-h-[400px]">
            <ComposedChart
              data={chartData}
              margin={{
                left: 20,
                right: 20,
                top: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={-45}
                textAnchor="end"
                height={60}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => formatCurrency(value)}
              />
              
              {/* Average price reference line */}
              {avgPrice > 0 && (
                <ReferenceLine 
                  y={avgPrice} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="2 2" 
                  label={{ value: "Avg", position: "insideTopRight" }}
                />
              )}
              
              {/* Average cost basis line */}
              <Line
                type="stepAfter"
                dataKey="avgCostBasis"
                stroke="var(--color-avgCostBasis)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
              />
              
              {/* Trade price scatter plot */}
              <Scatter
                dataKey="price"
                fill="var(--color-price)"
                shape={<CustomDot />}
              />
              
              <ChartTooltip 
                content={<CustomTooltip />}
                cursor={{ strokeDasharray: '3 3' }}
              />
            </ComposedChart>
          </ChartContainer>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-600"></div>
              <span>Buy Trades</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-red-600"></div>
              <span>Sell Trades</span>
            </div>
            {currentPricePoint && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-600 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <span>Current Price</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-chart-3 opacity-80" style={{ borderTop: '2px dashed' }}></div>
              <span>Average Cost Basis</span>
            </div>
          </div>

          {/* Price change indicator */}
          {currentPricePoint && priceData && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm">Today's Change</span>
                <div className="flex items-center gap-2">
                  {priceData.changePercent !== undefined && (
                    <>
                      {priceData.changePercent >= 0 ? (
                        <ChevronUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        priceData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {priceData.change ? formatCurrency(priceData.change, currency) : ''}
                        {priceData.changePercent ? ` (${formatPercent(priceData.changePercent)})` : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}