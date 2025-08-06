import { useQuery } from '@tanstack/react-query'
import { Badge } from '~/components/ui/badge'
import { portfolioQueries } from '~/services/queries'

interface CurrentValueProps {
  className?: string
}

export function CurrentValue({ className }: CurrentValueProps) {
  const { data: summary, isLoading, isError } = useQuery(portfolioQueries.summary())

  if (isLoading) {
    return (
      <div className={className}>
        <h2 className="text-sm font-medium text-muted-foreground">Current Value</h2>
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
        <h2 className="text-sm font-medium text-muted-foreground">Current Value</h2>
        <div className="flex items-center space-x-2">
          <span className="text-3xl font-bold">$0</span>
        </div>
        <div className="flex items-center mt-1">
          <span className="text-sm font-medium text-muted-foreground">No gains yet</span>
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
      <h2 className="text-sm font-medium text-muted-foreground">Current Value</h2>
      <div className="flex items-center space-x-2">
        <span className="text-3xl font-bold">${totalValue.toLocaleString()}</span>
        <Badge variant={isPositiveDayChange ? "default" : "destructive"} className="text-xs">
          {isPositiveDayChange ? "+" : ""}${dayChange.toLocaleString()} today
        </Badge>
      </div>
      <div className="flex items-center mt-1">
        <span className={`text-sm font-medium ${isPositiveReturn ? "text-green-600" : "text-red-600"}`}>
          {isPositiveReturn ? "+" : ""}${totalReturn.toLocaleString()} ({totalReturnPercent.toFixed(2)}%) total gain
        </span>
      </div>
    </div>
  )
}