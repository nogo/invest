import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group"
import { Search, X, Calendar, ArrowRight } from "lucide-react"
import { DateRangePicker } from 'data/date-range-picker'
import { subDays, subMonths, subYears, format } from 'date-fns'
import { Toggle } from '~/components/ui/toggle'

interface PortfolioFilterProps {
  query?: string | undefined
  tradeType?: string | undefined
  assetType?: string | undefined
  dateFrom?: string | undefined
  dateTo?: string | undefined
  customDateMode?: string | undefined
}

export function PortfolioFilter({
  query,
  assetType,
  dateFrom,
  dateTo,
  customDateMode
}: PortfolioFilterProps) {
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: {
      q: query || '',
      dateFrom: dateFrom || '',
      dateTo: dateTo || '',
      assetType: assetType || 'ALL',
      customDateMode: customDateMode === 'true' || false
    },
    onSubmit: async ({ value }) => {
      navigate({
        search: (prev: any) => ({
          ...prev,
          q: value.q.trim() || undefined,
          assetType: (value.assetType && value.assetType !== 'ALL') ? value.assetType : undefined,
          // Handle empty strings explicitly for date clearing
          dateFrom: value.dateFrom === '' ? undefined : (value.dateFrom || prev.dateFrom),
          dateTo: value.dateTo === '' ? undefined : (value.dateTo || prev.dateTo),
          // Handle custom date mode
          customDateMode: value.customDateMode ? true : undefined,
        }),
        replace: true
      })
    },
  })

  // Check if any filters are active
  const hasActiveFilters = !!(query || (assetType && assetType !== 'ALL') || dateFrom || dateTo)

  // Helper function to get the currently active date range
  const getActiveDateRange = () => {
    // If custom date mode is active, show nothing selected in toggle group
    if (customDateMode === 'true') return ""

    if (!dateFrom || !dateTo) return "all" // "All time" is active when no dates are set

    const now = new Date()
    const nowStr = format(now, 'yyyy-MM-dd')

    const ranges = [
      { key: "90d", fromDate: format(subDays(now, 90), 'yyyy-MM-dd') },
      { key: "6m", fromDate: format(subMonths(now, 6), 'yyyy-MM-dd') },
      { key: "1y", fromDate: format(subYears(now, 1), 'yyyy-MM-dd') },
      { key: "3y", fromDate: format(subYears(now, 3), 'yyyy-MM-dd') },
      { key: "5y", fromDate: format(subYears(now, 5), 'yyyy-MM-dd') }
    ]

    for (const range of ranges) {
      if (dateFrom === range.fromDate && dateTo === nowStr) {
        return range.key
      }
    }

    return "" // No preset matches, don't highlight any toggle
  }

  const handleDateRangeChange = (value: string) => {
    if (value === 'all') {
      form.setFieldValue("dateFrom", '');
      form.setFieldValue("dateTo", '');
      form.setFieldValue("customDateMode", false);
      form.handleSubmit();
      return;
    }

    const now = new Date()

    let fromDate: string
    switch (value) {
      case "90d":
        fromDate = format(subDays(now, 90), 'yyyy-MM-dd')
        break
      case "6m":
        fromDate = format(subMonths(now, 6), 'yyyy-MM-dd')
        break
      case "1y":
        fromDate = format(subYears(now, 1), 'yyyy-MM-dd')
        break
      case "3y":
        fromDate = format(subYears(now, 3), 'yyyy-MM-dd')
        break
      case "5y":
        fromDate = format(subYears(now, 5), 'yyyy-MM-dd')
        break
      default:
        fromDate = '';
    }

    form.setFieldValue("dateFrom", fromDate);
    form.setFieldValue("dateTo", format(now, 'yyyy-MM-dd'));
    form.setFieldValue("customDateMode", false);
    form.handleSubmit();
  }

  return (
    <div className="mb-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        {/* Filters Below - Right Aligned */}
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-end sm:items-start">

          {/* Asset Type */}
          <form.Field
            name="assetType"
            children={(field) => {
              return <Select
                name={field.name}
                value={assetType || 'ALL'}
                onValueChange={(value) => { field.handleChange(value); form.handleSubmit(); }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All asset type</SelectItem>
                  <SelectItem value="STOCK">Stock</SelectItem>
                  <SelectItem value="ETF">ETF</SelectItem>
                </SelectContent>
              </Select>
            }}
          />


          {/* Date Range Selection - Combined Toggle Group and Custom Dates */}
          {/* Toggle Group for Quick Date Ranges */}
          <ToggleGroup
            type="single"
            value={getActiveDateRange()}
            onValueChange={(value) => value && handleDateRangeChange(value)}
            variant="outline"
          >
            <ToggleGroupItem value="90d">90d</ToggleGroupItem>
            <ToggleGroupItem value="6m">6m</ToggleGroupItem>
            <ToggleGroupItem value="1y">1y</ToggleGroupItem>
            <ToggleGroupItem value="3y">3y</ToggleGroupItem>
            <ToggleGroupItem value="5y">5y</ToggleGroupItem>
            <ToggleGroupItem value="all">All</ToggleGroupItem>
          </ToggleGroup>

          <form.Field
            name="customDateMode"
            children={(field) => {
              return <>
                <Toggle
                  variant="outline"
                  pressed={field.state.value}
                  onPressedChange={() => { field.handleChange(!field.state.value); }}
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </Toggle>
              </>
            }} />



          {/* Custom Date Range - Show when custom mode is active */}
          <form.Subscribe
            selector={(state) => state.values.customDateMode}
            children={(customDateMode) => {
              return (customDateMode && (
                <div className="flex items-center gap-2">
                  <form.Field name="dateFrom">
                    {(field) => (
                      <Input
                        type="date"
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value)
                          // Auto-submit after a short delay
                          setTimeout(() => form.handleSubmit(), 100)
                        }}
                        placeholder="From"
                      />
                    )}
                  </form.Field>
                  <span className="text-muted-foreground text-xs">to</span>
                  <form.Field name="dateTo">
                    {(field) => (
                      <Input
                        type="date"
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value)
                          // Auto-submit after a short delay
                          setTimeout(() => form.handleSubmit(), 100)
                        }}
                        placeholder="To"
                      />
                    )}
                  </form.Field>
                </div>
              ))
            }} />
        </div>

        {/* Main Search Input - Full Width */}
        <div className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <form.Field name="q">
              {(field) => (
                <Input
                  type="text"
                  placeholder="Search or filter: @AAPL $robinhood..."
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="pl-10 pr-20 w-full"
                />
              )}
            </form.Field>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    form.setFieldValue("q", "")
                    form.handleSubmit()
                  }}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    disabled={!canSubmit || isSubmitting}
                    className="h-6 px-2 text-xs"
                  >
                    {isSubmitting ? "..." : <ArrowRight />}
                  </Button>
                )}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Use @symbol for assets, $broker for brokers, or search by name
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <>
                {query && (
                  <Badge variant="secondary" className="text-xs">
                    Query: {query}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        form.setFieldValue("q", "")
                        form.handleSubmit()
                      }}
                      className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {assetType && assetType !== 'ALL' && (
                  <Badge variant="secondary" className="text-xs">
                    {assetType}s only
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        form.setFieldValue("assetType", "ALL")
                        form.handleSubmit()
                      }}
                      className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {dateFrom && (
                  <Badge variant="secondary" className="text-xs">
                    From: {dateFrom}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        form.setFieldValue("dateFrom", "")
                        form.handleSubmit()
                      }}
                      className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {dateTo && (
                  <Badge variant="secondary" className="text-xs">
                    To: {dateTo}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        form.setFieldValue("dateTo", "")
                        form.handleSubmit()
                      }}
                      className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}