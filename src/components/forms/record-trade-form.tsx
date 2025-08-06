import { useForm } from '@tanstack/react-form'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { TradeExecutedPayload } from "~/lib/events/trading-events"
import { z } from 'zod/v4'
import { useRecordTradeMutation } from '~/services/queries'

// Form schema for trade execution
const tradeFormSchema = z.object({
  isin: z.string().min(12, 'ISIN must be 12 characters').max(12, 'ISIN must be 12 characters'),
  symbol: z.string().min(1, 'Symbol is required'),
  assetType: z.enum(['STOCK', 'ETF', 'OPTION', 'BOND', 'MUTUAL_FUND']),
  direction: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
  tradeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  settlementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  commission: z.number().min(0, 'Commission cannot be negative'),
  fees: z.number().min(0, 'Fees cannot be negative'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'CHF', 'JPY']),
  accountId: z.string().min(1, 'Account ID is required'),
  brokerName: z.string().min(1, 'Broker name is required'),
  exchange: z.string().optional(),
  notes: z.string().optional(),
})

type TradeFormData = z.infer<typeof tradeFormSchema>

interface AddTransactionSidebarProps {
  onTransactionAdded?: () => void
}

export function RecordTradeForm({ onTransactionAdded }: AddTransactionSidebarProps) {
  const recordTrade = useRecordTradeMutation();

  const form = useForm({
    defaultValues: {
      isin: '',
      symbol: '',
      assetType: 'STOCK' as const,
      direction: 'BUY' as const,
      quantity: 0,
      price: 0,
      tradeDate: new Date().toISOString().split('T')[0],
      settlementDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // T+2
      commission: 0,
      fees: 0,
      currency: 'USD' as const,
      accountId: '',
      brokerName: '',
      exchange: '',
      notes: '',
    },
    onSubmit: async ({ formApi, value }) => {
      // Calculate total amount
      const totalAmount = value.direction === 'BUY'
        ? (value.quantity * value.price) + value.commission + value.fees
        : (value.quantity * value.price) - value.commission - value.fees

      // Create the trade payload
      const tradePayload: TradeExecutedPayload = {
        tradeId: `T${Date.now()}`, // Generate a simple trade ID
        isin: value.isin,
        symbol: value.symbol.toUpperCase(),
        assetType: value.assetType,
        direction: value.direction,
        quantity: value.quantity,
        price: value.price,
        totalAmount,
        tradeDate: value.tradeDate,
        settlementDate: value.settlementDate,
        commission: value.commission,
        fees: value.fees,
        currency: value.currency,
        exchangeRate: 1, // Default to 1, will be enhanced later
        accountId: value.accountId,
        brokerName: value.brokerName,
        exchange: value.exchange,
        marketType: 'REGULAR',
        notes: value.notes,
      }

      await recordTrade.mutateAsync({ data: value });
      formApi.reset();

    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      {/* Asset Information */}
      <div className="space-y-2">
        <form.Field
          name="symbol"
          children={(field) => (
            <>
              <Label htmlFor={field.name}>Symbol *</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                placeholder="AAPL"
              />
              {field.state.meta.errors && (
                <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
              )}
            </>
          )}
        />
      </div>

      <div className="space-y-2">
        <form.Field
          name="isin"
          children={(field) => (
            <>
              <Label htmlFor={field.name}>ISIN *</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                placeholder="US0378331005"
                maxLength={12}
              />
              {field.state.meta.errors && (
                <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
              )}
            </>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <form.Field
            name="assetType"
            children={(field) => (
              <>
                <Label htmlFor={field.name}>Type *</Label>
                <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STOCK">Stock</SelectItem>
                    <SelectItem value="ETF">ETF</SelectItem>
                    <SelectItem value="OPTION">Option</SelectItem>
                    <SelectItem value="BOND">Bond</SelectItem>
                    <SelectItem value="MUTUAL_FUND">Mutual Fund</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          />
        </div>

        <div className="space-y-2">
          <form.Field
            name="direction"
            children={(field) => (
              <>
                <Label htmlFor={field.name}>Direction *</Label>
                <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          />
        </div>
      </div>

      {/* Trade Details */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <form.Field
            name="quantity"
            children={(field) => (
              <>
                <Label htmlFor={field.name}>Quantity *</Label>
                <Input
                  id={field.name}
                  type="number"
                  min="0"
                  step="1"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  placeholder="100"
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
                )}
              </>
            )}
          />
        </div>

        <div className="space-y-2">
          <form.Field
            name="price"
            children={(field) => (
              <>
                <Label htmlFor={field.name}>Price *</Label>
                <Input
                  id={field.name}
                  type="number"
                  min="0"
                  step="0.01"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  placeholder="150.67"
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
                )}
              </>
            )}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-2">
        <form.Field
          name="tradeDate"
          children={(field) => (
            <>
              <Label htmlFor={field.name}>Trade Date *</Label>
              <Input
                id={field.name}
                type="date"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors && (
                <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
              )}
            </>
          )}
        />
      </div>

      {/* Costs */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <form.Field
            name="commission"
            children={(field) => (
              <>
                <Label htmlFor={field.name}>Commission</Label>
                <Input
                  id={field.name}
                  type="number"
                  min="0"
                  step="0.01"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  placeholder="1.00"
                />
              </>
            )}
          />
        </div>

        <div className="space-y-2">
          <form.Field
            name="fees"
            children={(field) => (
              <>
                <Label htmlFor={field.name}>Fees</Label>
                <Input
                  id={field.name}
                  type="number"
                  min="0"
                  step="0.01"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  placeholder="0.50"
                />
              </>
            )}
          />
        </div>
      </div>

      {/* Broker Information */}
      <div className="space-y-2">
        <form.Field
          name="brokerName"
          children={(field) => (
            <>
              <Label htmlFor={field.name}>Broker *</Label>
              <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select broker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interactive Brokers">Interactive Brokers</SelectItem>
                  <SelectItem value="DKB">DKB</SelectItem>
                  <SelectItem value="Scalable Capital">Scalable Capital</SelectItem>
                  <SelectItem value="Trade Republic">Trade Republic</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {field.state.meta.errors && (
                <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
              )}
            </>
          )}
        />
      </div>

      <div className="space-y-2">
        <form.Field
          name="accountId"
          children={(field) => (
            <>
              <Label htmlFor={field.name}>Account ID *</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="U123456789"
              />
              {field.state.meta.errors && (
                <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
              )}
            </>
          )}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <form.Field
          name="notes"
          children={(field) => (
            <>
              <Label htmlFor={field.name}>Notes</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Optional notes"
              />
            </>
          )}
        />
      </div>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Recording...' : 'Save Trade'}
          </Button>
        )}
      />
    </form>
  )
}