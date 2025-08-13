import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { portfolioQueries } from '~/services/queries'


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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('portfolio.investmentTimeline')}</CardTitle>
        <CardDescription>
          Your investment journey over time - comparing money invested vs portfolio value ({investmentTimelineData.length} data points)
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
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(value)
              }
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