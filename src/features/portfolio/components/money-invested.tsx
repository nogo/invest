import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '~/lib/i18n'
import { portfolioQueries } from '../api/queries';
import { usePortfolioFilters } from '../hooks/usePortfolioFilters'

interface MoneyInvestedProps {
  className?: string
}

export function MoneyInvested({ className }: MoneyInvestedProps) {
  const { t } = useTranslation('common');
  const filters = usePortfolioFilters()
  
  const { data: summary, isLoading, isError } = useQuery(portfolioQueries.summary(filters))

  if (isLoading) {
    return (
      <div className={className}>
        <h2 className="text-sm font-medium text-muted-foreground">{t('portfolio.moneyInvested')}</h2>
        <div className="flex items-center space-x-2">
          <div className="animate-pulse bg-muted rounded h-8 w-32"></div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{t('portfolio.totalDeposits')}</p>
      </div>
    )
  }

  if (isError || !summary) {
    return (
      <div className={className}>
        <h2 className="text-sm font-medium text-muted-foreground">{t('portfolio.moneyInvested')}</h2>
        <div className="flex items-center space-x-2">
          <span className="text-3xl font-bold text-blue-600">{formatCurrency(0)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{t('portfolio.startTrading')}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <h2 className="text-sm font-medium text-muted-foreground">{t('portfolio.moneyInvested')}</h2>
      <div className="flex items-center space-x-2">
        <span className="text-3xl font-bold text-blue-600">{formatCurrency(summary.investedCapital)}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{t('portfolio.startTrading')}</p>
    </div>
  )
}