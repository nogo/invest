import { MoneyInvested } from './money-invested'
import { CurrentValue } from './current-value'
import { cn } from '~/lib/utils'

interface PortfolioSummaryProps {
  className?: string
}

export function PortfolioSummary({ className }: PortfolioSummaryProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
      <MoneyInvested />
      <CurrentValue />
    </div>
  )
}