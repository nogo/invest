import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { X, Search, ArrowRight, Loader2 } from "lucide-react"

interface PortfolioFilterProps {
  query?: string | undefined
}

export function PortfolioFilter({ query }: PortfolioFilterProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: {
      q: query || '',
    },
    onSubmit: async ({ value }) => {
      navigate({
        search: { q: value.q.trim() || undefined },
        replace: true
      })
    },
  })

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <form.Field name="q">
          {(field) => (
            <Input
              type="text"
              placeholder={t('portfolio.filterPlaceholder')}
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="pl-10 pr-32"
            />
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => state.values.q}
          children={(query) => (
            <Button
              onClick={() => { form.setFieldValue("q", ""); form.handleSubmit() }}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
              type="button"
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        />

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button size="sm" type="submit" disabled={!canSubmit}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0">
              {isSubmitting ? <Loader2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </Button>
          )}
        />
      </form>
      <p className="text-xs text-muted-foreground">
        {t('portfolio.filterHelp')}
      </p>
    </div>
  )
}