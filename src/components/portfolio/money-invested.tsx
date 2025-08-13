import { useQuery } from '@tanstack/react-query'
import { portfolioQueries } from '~/services/queries'

interface MoneyInvestedProps {
  className?: string
}

export function MoneyInvested({ className }: MoneyInvestedProps) {
  const { data: summary, isLoading, isError } = useQuery(portfolioQueries.summary())

  if (isLoading) {
    return (
      <div className={className}>
        <h2 className="text-sm font-medium text-muted-foreground">Money Invested</h2>
        <div className="flex items-center space-x-2">
          <div className="animate-pulse bg-muted rounded h-8 w-32"></div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Total deposits - withdrawals</p>
      </div>
    )
  }

  if (isError || !summary) {
    return (
      <div className={className}>
        <h2 className="text-sm font-medium text-muted-foreground">Money Invested</h2>
        <div className="flex items-center space-x-2">
          <span className="text-3xl font-bold text-blue-600">$0</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Start trading to see your investments</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <h2 className="text-sm font-medium text-muted-foreground">Money Invested</h2>
      <div className="flex items-center space-x-2">
        <span className="text-3xl font-bold text-blue-600">${summary.investedCapital.toLocaleString()}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">Total deposits - withdrawals</p>
    </div>
  )
}