import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Badge } from '~/components/ui/badge'
import { formatCurrency, formatPercent } from '~/lib/i18n'
import { portfolioQueries } from '../api/queries'

interface CurrentValueProps {
  className?: string
}

export function CurrentValue({ className }: CurrentValueProps) {
  const { t } = useTranslation('common');
  const { data: summary, isLoading, isError } = useQuery(portfolioQueries.summary())

  if (isLoading) {
    return (
      <div className={className}>
        <h2 className="text-sm font-medium text-muted-foreground">{t('portfolio.currentValue')}</h2>
        <div className="flex items-center space-x-2">
          <div className="animate-pulse bg-muted rounded h-8 w-32"></div>
          <div className="animate-pulse bg-muted rounded h-5 w-16"></div>
        </div>
        <div className="flex items-center mt-1">
          <div className="animate-pulse bg-muted rounded h-4 w-24"></div>
        </div>
      </div>
    )
  }

  if (isError || !summary) {
    return (
      <div className={className}>
        <h2 className="text-sm font-medium text-muted-foreground">{t('portfolio.currentValue')}</h2>
        <div className="flex items-center space-x-2">
          <span className="text-3xl font-bold">{formatCurrency(0)}</span>
        </div>
        <div className="flex items-center mt-1">
          <span className="text-sm font-medium text-muted-foreground">{t('portfolio.noGains')}</span>
        </div>
      </div>
    )
  }

  const {
    totalValue,
    totalReturn,
    totalReturnPercent,
    dayChange,
  } = summary

  const isPositiveReturn = totalReturn >= 0
  const isPositiveDayChange = dayChange >= 0

  return (
    <div className={className}>
      <h2 className="text-sm font-medium text-muted-foreground">{t('portfolio.currentValue')}</h2>
      <div className="flex items-center space-x-2">
        <span className="text-3xl font-bold">{formatCurrency(totalValue)}</span>
        <Badge variant={isPositiveDayChange ? "default" : "destructive"} className="text-xs">
          {isPositiveDayChange ? "+" : ""}{formatCurrency(dayChange)} {t('portfolio.today')}
        </Badge>
      </div>
      <div className="flex items-center mt-1">
        <span className={`text-sm font-medium ${isPositiveReturn ? "text-green-600" : "text-red-600"}`}>
          {isPositiveReturn ? "+" : ""}{formatCurrency(totalReturn)} ({formatPercent(totalReturnPercent)}) {t('portfolio.totalGain')}
        </span>
      </div>
    </div>
  )
}