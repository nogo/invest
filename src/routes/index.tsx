import { createFileRoute, Link } from '@tanstack/react-router'
import { HistoryList } from '~/components/history/history-list'
import { PortfolioFilter } from '~/components/portfolio/portfolio-filter'
import { PortfolioSummary } from '~/components/portfolio/portfolio-summary'
import { Button } from '~/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import { InvestmentChart } from '~/components/portfolio/investment-chart'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

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
        <PortfolioFilter searchQuery={search} />
      </div>

      <InvestmentChart />

      <div className="mt-8">
        <HistoryList searchQuery={search} />
      </div>
    </div>
  )
}