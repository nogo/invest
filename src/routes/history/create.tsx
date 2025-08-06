import { createFileRoute } from '@tanstack/react-router'
import { RecordTradeForm } from '~/components/forms/record-trade-form'

export const Route = createFileRoute('/history/create')({
  component: HistoryCreate,
})

function HistoryCreate() {
  return <div className="container mx-auto px-6 py-8">
    <RecordTradeForm />
  </div>
}