import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Calendar } from "lucide-react"
import { historyQueries } from '~/services/queries'
import { HistoryItem } from "./history-item"


interface HistoryListProps {
  searchQuery?: string;
}

export function HistoryList({ searchQuery }: HistoryListProps) {
  const { data: events = [], isLoading } = useQuery(historyQueries.list(searchQuery))

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Loading trade history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
        <CardDescription>
          Recent trade events
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No events found</p>
            <p className="text-sm text-muted-foreground">Record your first trade to get started</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {events.map((event, index) => (
                <HistoryItem
                  key={event.id}
                  event={event}
                  showSeparator={index < events.length - 1}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}