import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts"
import { useMemo } from 'react'
import { formatCurrencyCutted } from '~/lib/i18n'
import { portfolioQueries } from '../api/queries'


const chartConfig = {
  invested: {
    label: "Money Invested",
    color: "hsl(217, 91%, 60%)",
  },
  value: {
    label: "Portfolio Value", 
    color: "hsl(142, 71%, 45%)",
  },
} satisfies ChartConfig

interface InvestmentChartProps {
  className?: string
}

export function InvestmentChart({ className }: InvestmentChartProps) {
  const { t } = useTranslation('common');
  const { data: investmentTimelineData = [], isLoading, isError } = useQuery(portfolioQueries.timeline())

  const timelineMetrics = useMemo(() => {
    if (!investmentTimelineData || investmentTimelineData.length === 0) {
      return { yearSpan: 0, showAllMonths: true, yearRange: '' }
    }

    const dates = investmentTimelineData.map(d => d.date).sort()
    const firstYear = new Date(dates[0] + '-01').getFullYear()
    const lastYear = new Date(dates[dates.length - 1] + '-01').getFullYear()
    const yearSpan = lastYear - firstYear + 1
    
    const yearRange = yearSpan > 1 ? `${firstYear}–${lastYear}` : `${firstYear}`
    const showAllMonths = yearSpan <= 2

    return { yearSpan, showAllMonths, yearRange }
  }, [investmentTimelineData])

  const formatTick = useMemo(() => {
    return (value: string, index: number) => {
      const parts = value.split(' ')
      const monthName = parts[0]
      const year = parts[1]
      
      if (!monthName || !year) return ''
      
      if (timelineMetrics.showAllMonths) {
        const isFirstMonth = index === 0
        const isJanuary = monthName === 'Jan'
        
        if (isFirstMonth || isJanuary) {
          return `${monthName.slice(0, 3)}\n${year}`
        }
        return monthName.slice(0, 3)
      } else {
        const isJanuary = monthName === 'Jan'
        const showTick = index % 6 === 0 || isJanuary
        
        if (showTick) {
          return `${monthName.slice(0, 3)} '${year.slice(2)}`
        }
        return ''
      }
    }
  }, [timelineMetrics.showAllMonths])

  // Generate year boundaries for reference lines
  const getYearBoundaries = (data: typeof investmentTimelineData) => {
    const yearBoundaries: Array<{ year: string; index: number }> = []
    let currentYear = ''
    
    data.forEach((point, index) => {
      const year = point.date.split('-')[0]
      if (!year) return
      
      if (year !== currentYear && index > 0) {
        yearBoundaries.push({ year, index })
        currentYear = year
      } else if (index === 0) {
        currentYear = year
      }
    })
    
    return yearBoundaries
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{t('portfolio.investmentTimeline')}</CardTitle>
          <CardDescription>{t('portfolio.loadingInvestment')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError || investmentTimelineData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{t('portfolio.investmentTimeline')}</CardTitle>
          <CardDescription>{t('portfolio.noData')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {t('history.firstTrade')}
          </div>
        </CardContent>
      </Card>
    )
  }

  const yearBoundaries = getYearBoundaries(investmentTimelineData)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('portfolio.investmentTimeline')}</CardTitle>
        <CardDescription>
          Your investment journey over time - comparing money invested vs portfolio value 
          {timelineMetrics.yearRange && ` (${timelineMetrics.yearRange})`}
          {` • ${investmentTimelineData.length} data points`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={investmentTimelineData}
            margin={{
              left: 12,
              right: 12,
              bottom: timelineMetrics.showAllMonths ? 40 : 10,
              top: timelineMetrics.showAllMonths ? 10 : 25,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              interval="preserveStartEnd"
              tick={{ 
                fontSize: 12, 
                textAnchor: 'middle',
                dominantBaseline: 'hanging'
              }}
              tickFormatter={(value, index) => formatTick(value, index)}
              height={timelineMetrics.showAllMonths ? 40 : 30}
            />
            {/* Add subtle vertical lines at year boundaries for multi-year timelines */}
            {!timelineMetrics.showAllMonths && yearBoundaries.map((boundary, idx) => (
              <ReferenceLine 
                key={`year-${boundary.year}-${idx}`}
                x={investmentTimelineData[boundary.index]?.month}
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity={0.3}
                strokeDasharray="2 2"
                label={{
                  value: boundary.year,
                  position: "insideTopLeft",
                  offset: 5,
                  style: { 
                    fontSize: "11px", 
                    fontWeight: "500",
                    fill: "hsl(var(--muted-foreground))"
                  }
                }}
              />
            ))}
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatCurrencyCutted(value, 'USD')}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillInvested" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-invested)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-invested)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-value)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-value)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="invested"
              type="natural"
              fill="url(#fillInvested)"
              fillOpacity={0.4}
              stroke="var(--color-invested)"
              strokeWidth={2}
            />
            <Area
              dataKey="value"
              type="natural"
              fill="url(#fillValue)"
              fillOpacity={0.4}
              stroke="var(--color-value)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}