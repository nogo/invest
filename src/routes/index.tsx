import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { PortfolioSummary } from '~/features/portfolio/components/portfolio-summary'
import { PortfolioFilter } from '~/features/portfolio/components/portfolio-filter'
import { InvestmentChart } from '~/features/portfolio/components/investment-chart'
import { HoldingsList } from '~/features/portfolio/components/holdings-list'
import { HistoryList } from '~/features/history/components/history-list'

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute('/')({
  component: Home,
  validateSearch: searchSchema,
  loaderDeps: ({ search: { q } }) => ({ search: q }),
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

      <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
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

      <div className="my-8">
        <PortfolioFilter query={search} />
      </div>

      <InvestmentChart />

      <div className="mt-8">
        <HoldingsList searchQuery={search} />
      </div>

      <div className="mt-8">
        <HistoryList searchQuery={search} />
      </div>
    </div>
  )
}
