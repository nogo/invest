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
  ReferenceLine,
  ResponsiveContainer
} from "recharts"
import { TrendingUp, TrendingDown, BarChart3, Circle } from "lucide-react"
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

// Financial-optimized color scheme following industry standards
const chartConfig = {
  price: {
    label: "Trade Price",
    color: "hsl(var(--chart-1))",
  },
  avgCostBasis: {
    label: "Average Cost Basis",
    color: "hsl(var(--muted-foreground))",
  },
  buyTrade: {
    label: "Buy Orders",
    color: "hsl(142, 71%, 45%)", // Green for bullish actions
  },
  sellTrade: {
    label: "Sell Orders", 
    color: "hsl(0, 72%, 51%)", // Red for bearish actions
  },
  currentPrice: {
    label: "Current Price",
    color: "hsl(217, 91%, 60%)", // Blue for neutral information
  },
} satisfies ChartConfig

// Legend item component for better reusability
interface LegendItemProps {
  color: string
  label: string
  icon: 'triangle-up' | 'triangle-down' | 'circle'
}

function LegendItem({ color, label, icon }: LegendItemProps) {
  const renderIcon = () => {
    switch (icon) {
      case 'triangle-up':
        return (
          <div className={`w-3 h-3 rounded-full ${color} flex items-center justify-center`}>
            <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[4px] border-l-transparent border-r-transparent border-b-white" />
          </div>
        )
      case 'triangle-down':
        return (
          <div className={`w-3 h-3 rounded-full ${color} flex items-center justify-center`}>
            <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-white" />
          </div>
        )
      case 'circle':
        return (
          <div className={`w-4 h-4 rounded-full ${color} border-2 flex items-center justify-center`}>
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
        )
    }
  }

  return (
    <div className="flex items-center gap-2">
      {renderIcon()}
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

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

  // Enhanced tooltip with better information hierarchy and styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null
    
    const data = payload[0].payload as ChartDataPoint
    const currency = trades[0]?.currency || 'EUR'
    
    return (
      <div 
        className="rounded-lg border bg-card p-4 shadow-lg backdrop-blur-sm max-w-xs"
        role="tooltip"
        aria-label={`Trade details for ${data.formattedDate}`}
      >
        {/* Header with trade type indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {data.isCurrentPrice ? (
              <Circle className="h-3 w-3 fill-blue-500 text-blue-500" />
            ) : (
              <div className={`h-3 w-3 rounded-full ${
                data.direction === 'BUY' ? 'bg-green-500' : 'bg-red-500'
              }`} />
            )}
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {data.isCurrentPrice ? 'Current' : data.direction}
            </span>
          </div>
          <time className="text-xs text-muted-foreground" dateTime={data.date}>
            {data.dateLabel}
          </time>
        </div>
        
        {/* Primary information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Price</span>
            <span className="text-sm font-mono font-bold">
              {formatCurrency(data.price, currency)}
            </span>
          </div>
          
          {!data.isCurrentPrice && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium">{data.quantity.toLocaleString()} shares</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Value</span>
                <span className="font-medium font-mono">
                  {formatCurrency(data.totalCost, currency)}
                </span>
              </div>
            </>
          )}
        </div>
        
        {/* Position information */}
        {data.runningShares > 0 && (
          <>
            <hr className="my-3 border-border" />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Position Size</span>
                <span className="font-medium">{data.runningShares.toLocaleString()} shares</span>
              </div>
              {data.avgCostBasis > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg. Cost Basis</span>
                  <span className="font-medium font-mono">
                    {formatCurrency(data.avgCostBasis, currency)}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  // Optimized custom dot with better performance and accessibility
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    if (!payload) return null

    // Current price indicator
    if (payload.isCurrentPrice) {
      return (
        <g role="img" aria-label="Current price marker">
          <circle
            cx={cx}
            cy={cy}
            r={7}
            fill="hsl(217, 91%, 60%)"
            stroke="white"
            strokeWidth={2}
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          />
          <circle
            cx={cx}
            cy={cy}
            r={3}
            fill="white"
          />
        </g>
      )
    }

    // Trade markers with better visual distinction
    const isBuy = payload.direction === 'BUY'
    const baseColor = isBuy ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)'
    const strokeColor = isBuy ? 'hsl(142, 71%, 35%)' : 'hsl(0, 72%, 41%)'
    
    return (
      <g role="img" aria-label={`${payload.direction} trade marker`}>
        {/* Outer ring for better visibility */}
        <circle
          cx={cx}
          cy={cy}
          r={7}
          fill={baseColor}
          stroke={strokeColor}
          strokeWidth={2}
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
        />
        {/* Inner symbol using SVG paths for better performance */}
        {isBuy ? (
          // Triangle pointing up for buy
          <path
            d={`M${cx},${cy-3} L${cx-2.5},${cy+1.5} L${cx+2.5},${cy+1.5} Z`}
            fill="white"
            stroke="none"
          />
        ) : (
          // Triangle pointing down for sell
          <path
            d={`M${cx},${cy+3} L${cx-2.5},${cy-1.5} L${cx+2.5},${cy-1.5} Z`}
            fill="white"
            stroke="none"
          />
        )}
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
          {/* Enhanced responsive chart with better accessibility */}
          <div className="relative">
            <ChartContainer config={chartConfig} className="min-h-[300px] sm:min-h-[400px] lg:min-h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{
                    left: 8,
                    right: 8,
                    top: 20,
                    bottom: 60,
                  }}
                  accessibilityLayer
                >
                  <CartesianGrid 
                    strokeDasharray="2 2" 
                    vertical={false} 
                    stroke="hsl(var(--border))" 
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="dateLabel"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval="preserveStartEnd"
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => {
                      // Compact currency formatting for Y-axis
                      if (Math.abs(value) >= 1000) {
                        return formatCurrency(value / 1000, currency) + 'K'
                      }
                      return formatCurrency(value, currency)
                    }}
                  />
                  
                  {/* Average cost basis line - only show if meaningful */}
                  {chartData.some(d => d.avgCostBasis > 0) && (
                    <Line
                      type="stepAfter"
                      dataKey="avgCostBasis"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls={false}
                      strokeOpacity={0.7}
                      isAnimationActive={false}
                    />
                  )}
                  
                  {/* Trade price scatter plot */}
                  <Scatter
                    dataKey="price"
                    fill="var(--color-price)"
                    shape={<CustomDot />}
                    isAnimationActive={false}
                  />
                  
                  <ChartTooltip 
                    content={<CustomTooltip />}
                    cursor={{ 
                      strokeDasharray: '2 2', 
                      stroke: 'hsl(var(--muted-foreground))',
                      strokeOpacity: 0.5 
                    }}
                    animationDuration={150}
                    allowEscapeViewBox={{ x: false, y: true }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
            
            {/* Accessibility description */}
            <div className="sr-only" role="img" aria-label={`Price chart for ${symbol} showing ${chartData.length} data points including trades and current price`}>
              Chart displays trade history from {chartData[0]?.formattedDate} to {chartData[chartData.length - 1]?.formattedDate}
              with buy and sell trade markers and average cost basis line.
            </div>
          </div>

          {/* Enhanced legend with better mobile layout */}
          <div 
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm p-3 rounded-lg bg-muted/30 border"
            role="group"
            aria-label="Chart legend"
          >
            <LegendItem 
              color="bg-green-500 border-green-600" 
              label="Buy Orders"
              icon="triangle-up"
            />
            <LegendItem 
              color="bg-red-500 border-red-600" 
              label="Sell Orders"
              icon="triangle-down"
            />
            {currentPricePoint && (
              <LegendItem 
                color="bg-blue-500 border-blue-600" 
                label="Current Price"
                icon="circle"
              />
            )}
            {chartData.some(d => d.avgCostBasis > 0) && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-0.5 border-t-2 border-dashed opacity-70"
                  style={{ borderColor: 'hsl(var(--muted-foreground))' }}
                  aria-hidden="true"
                />
                <span>Avg. Cost Basis</span>
              </div>
            )}
          </div>

          {/* Enhanced price change indicator */}
          {currentPricePoint && priceData && (
            <div className="p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-medium text-muted-foreground">Today's Performance</span>
                <div className="flex items-center gap-3">
                  {priceData.changePercent !== undefined && (
                    <>
                      <div className="flex items-center gap-1">
                        {priceData.changePercent >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`font-semibold font-mono text-sm ${
                          priceData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {priceData.change ? formatCurrency(Math.abs(priceData.change), currency) : ''}
                        </span>
                      </div>
                      {priceData.changePercent && (
                        <Badge 
                          variant={priceData.changePercent >= 0 ? "default" : "destructive"}
                          className={`font-mono ${
                            priceData.changePercent >= 0 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {priceData.changePercent >= 0 ? '+' : ''}{formatPercent(priceData.changePercent)}
                        </Badge>
                      )}
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