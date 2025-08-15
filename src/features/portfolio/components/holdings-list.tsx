import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react"
import { formatCurrency, formatPercent } from '~/lib/i18n'
import { portfolioQueries } from '../api/queries'
import type { EnrichedPosition } from '../domain/portfolio-aggregator'
import { usePortfolioFilters } from '../hooks/usePortfolioFilters'

interface HoldingsListProps {
	className?: string
}

interface PositionItemProps {
	position: EnrichedPosition
}

function PositionItem({ position }: PositionItemProps) {
	const { t } = useTranslation('common')

	const getGainBadgeVariant = (gain: number) => {
		if (gain > 0) return 'default' // Green
		if (gain < 0) return 'destructive' // Red
		return 'secondary' // Gray for zero
	}

	const getGainIcon = (gain: number) => {
		if (gain > 0) return <TrendingUp className="h-3 w-3" />
		if (gain < 0) return <TrendingDown className="h-3 w-3" />
		return <Minus className="h-3 w-3" />
	}

	const currentPrice = position.currentPrice || 0
	const hasValidPrice = position.priceData && !position.priceError

	return (
		<Link 
			to="/assets/$symbol" 
			params={{ symbol: position.symbol }}
			className="block"
		>
			<div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer">
				<div className="flex-1 space-y-1">
					<div className="flex items-center gap-3">
						<div className="flex flex-col">
							<div className="flex items-center gap-2">
								<span className="font-semibold text-sm">{position.symbol}</span>
								<Badge variant="outline" className="text-xs">
									{position.assetType}
								</Badge>
								{!hasValidPrice && (
									<Badge variant="destructive" className="text-xs">
										No Price
									</Badge>
								)}
							</div>
							<span className="text-xs text-muted-foreground truncate max-w-48">
								{position.priceData?.name || position.symbol}
							</span>
						</div>
					</div>
					
					<div className="flex items-center gap-4 text-sm">
						<span className="text-muted-foreground">
							{position.currentQuantity} {t('common.shares')}
						</span>
						<span className="text-muted-foreground">
							{formatCurrency(position.averageCostPerShare, position.currency)} {t('common.perShare')}
						</span>
						{hasValidPrice && (
							<span className="text-muted-foreground">
								{formatCurrency(currentPrice, position.currency)} current
							</span>
						)}
					</div>
				</div>

				<div className="flex flex-col items-end space-y-2">
					<div className="text-right">
						<div className="font-semibold">
							{hasValidPrice 
								? formatCurrency(position.currentMarketValue, position.currency)
								: formatCurrency(position.totalCostBasis, position.currency)
							}
						</div>
						<div className="text-xs text-muted-foreground">
							{t('portfolio.currentValue')}
						</div>
					</div>

					{hasValidPrice && (
						<div className="flex items-center gap-2">
							<Badge variant={getGainBadgeVariant(position.unrealizedGain)} className="text-xs">
								<span className="flex items-center gap-1">
									{getGainIcon(position.unrealizedGain)}
									{formatCurrency(position.unrealizedGain, position.currency)}
								</span>
							</Badge>
							<span className={`text-xs font-medium ${
								position.unrealizedGain > 0 ? 'text-green-600' : 
								position.unrealizedGain < 0 ? 'text-red-600' : 'text-gray-600'
							}`}>
								{formatPercent(position.unrealizedGainPercent, true)}
							</span>
						</div>
					)}

					{position.dailyChange !== undefined && hasValidPrice && (
						<div className="text-xs text-muted-foreground">
							{position.dailyChange > 0 ? '+' : ''}{formatCurrency(position.dailyChange, position.currency)} today
						</div>
					)}
				</div>

				{/* Chevron indicator */}
				<div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
					<ChevronRight className="h-4 w-4 text-muted-foreground" />
				</div>
			</div>
		</Link>
	)
}

export function HoldingsList({ className }: HoldingsListProps) {
	const { t } = useTranslation('common')
	const filters = usePortfolioFilters()
	
	const { data: positions = [], isLoading, isError } = useQuery(portfolioQueries.enrichedPositions(filters))

	// Positions are already filtered on the server side based on the filters

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle>{t('portfolio.summary')}</CardTitle>
					<CardDescription>Loading current holdings...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
					</div>
				</CardContent>
			</Card>
		)
	}

	if (isError || positions.length === 0) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle>Current Holdings</CardTitle>
					<CardDescription>
						{isError ? 'Error loading holdings' : 'No current positions'}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-muted-foreground">
						{isError ? 'Unable to load your holdings. Please try again.' : t('portfolio.startTrading')}
					</div>
				</CardContent>
			</Card>
		)
	}

	const positionsWithoutPrices = positions.filter(p => !p.priceData).length
	const totalPositions = positions.length

	return (
		<Card className={className}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Current Holdings</CardTitle>
						<CardDescription>
							{totalPositions} position{totalPositions !== 1 ? 's' : ''}
							{positionsWithoutPrices > 0 && ` • ${positionsWithoutPrices} without current prices`}
							{(filters.q || filters.tradeType || filters.assetType || filters.dateFrom || filters.dateTo) && ` • filtered`}
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-0">
				{positions.map((position, index) => (
					<div key={position.isin}>
						<PositionItem position={position} />
						{index < positions.length - 1 && <Separator />}
					</div>
				))}
			</CardContent>
		</Card>
	)
}