import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { PortfolioSummary } from '~/features/portfolio/components/portfolio-summary'
import { PortfolioFilter } from '~/features/portfolio/components/portfolio-filter'
import { InvestmentChart } from '~/features/portfolio/components/investment-chart'
import { HoldingsList } from '~/features/portfolio/components/holdings-list'

const searchSchema = z.object({
  q: z.string().optional(),
  tradeType: z.enum(['BUY', 'SELL', 'ALL']).optional(),
  assetType: z.enum(['STOCK', 'ETF', 'ALL']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const Route = createFileRoute('/')({
  component: Home,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    return {
      search
    }
  }
})

function Home() {
  const { search } = Route.useLoaderData();
  const { t } = useTranslation('common');

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Filter Toolbar - Positioned above everything else */}
      <PortfolioFilter 
        query={search.q}
        tradeType={search.tradeType}
        assetType={search.assetType}
        dateFrom={search.dateFrom}
        dateTo={search.dateTo}
      />

      {/* Portfolio Summary & Actions */}
      <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center mb-8">
        <PortfolioSummary />
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            {t('actions.import')}
          </Button>
          <Link to="/history/create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('actions.newTrade')}
            </Button>
          </Link>
        </div>
      </div>

      <InvestmentChart />

      <div className="mt-8">
        <HoldingsList />
      </div>
    </div>
  )
}
