import { useForm } from '@tanstack/react-form'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
import { useRecordTradeMutation, brokerQueries } from '~/services/queries'
import { Combobox } from '../ui/combobox'

interface AddTransactionSidebarProps {
  onTransactionAdded?: () => void
}

export function RecordTradeForm({ onTransactionAdded }: AddTransactionSidebarProps) {
  const { t } = useTranslation('common');
  const recordTrade = useRecordTradeMutation();
  const { data: brokers = [] } = useQuery(brokerQueries.list());

  const brokerOptions = brokers.map(broker => ({
    value: broker.brokerName + ' [' + broker.accountId + ']',
    label: broker.brokerName + ' / ' + broker.accountId,
  }));

  // Function to extract account ID from broker selection
  const extractAccountId = (brokerValue: string): string => {
    if (!brokerValue) return '';
    const match = brokerValue.match(/\[(.+)\]$/);
    return match?.[1] || '';
  };

  // Function to extract broker name from broker selection
  const extractBrokerName = (brokerValue: string): string => {
    if (!brokerValue) return '';
    const match = brokerValue.match(/^(.+)\s\[.+\]$/);
    return match?.[1] || brokerValue; // Return original value if no pattern match (custom entry)
  };

  const form = useForm({
    defaultValues: {
      isin: '',
      symbol: '',
      assetType: 'STOCK' as const,
      direction: 'BUY' as const,
      quantity: 0,
      price: 0,
      tradeDate: format(new Date(), 'yyyy-MM-dd'),
      commission: 0,
      fees: 0,
      currency: 'USD' as const,
      accountId: '',
      broker: '',
      exchange: '',
      notes: '',
    },
    onSubmit: async ({ formApi, value }) => {
      // Ensure required fields have values before sending
      const formData = {
        isin: value.isin,
        symbol: value.symbol,
        assetType: value.assetType,
        direction: value.direction,
        quantity: value.quantity,
        price: value.price,
        tradeDate: (value.tradeDate || format(new Date(), 'yyyy-MM-dd')) as string,
        commission: value.commission,
        fees: value.fees,
        currency: value.currency,
        accountId: value.accountId,
        brokerName: extractBrokerName(value.broker),
        exchange: value.exchange || undefined,
        notes: value.notes || undefined,
      };

      await recordTrade.mutateAsync({ data: formData });
      formApi.reset();
      onTransactionAdded?.();
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
      {/* Asset Information */}<div className="space-y-2">
        <form.Field
          name="isin"
          children={(field) => (
            <>
              <Label htmlFor={field.name}>{t('trade.isin')} *</Label>
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

      <div className="space-y-2">
        <form.Field
          name="symbol"
          children={(field) => (
            <>
              <Label htmlFor={field.name}>{t('trade.symbol')}</Label>
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

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <form.Field
            name="assetType"
            children={(field) => (
              <>
                <Label htmlFor={field.name}>{t('trade.assetType')} *</Label>
                <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STOCK">{t('trade.stock')}</SelectItem>
                    <SelectItem value="ETF">{t('trade.etf')}</SelectItem>
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
                <Label htmlFor={field.name}>{t('trade.tradeType')} *</Label>
                <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">{t('trade.buy')}</SelectItem>
                    <SelectItem value="SELL">{t('trade.sell')}</SelectItem>
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
                <Label htmlFor={field.name}>{t('trade.quantity')} *</Label>
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
                <Label htmlFor={field.name}>{t('trade.price')} *</Label>
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
              <Label htmlFor={field.name}>{t('trade.tradeDate')} *</Label>
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
                <Label htmlFor={field.name}>{t('trade.commission')}</Label>
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
                <Label htmlFor={field.name}>{t('trade.fees')}</Label>
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
          name="broker"
          children={(field) => (
            <>
              <Label htmlFor={field.name}>{t('trade.broker')} *</Label>
              <Combobox
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
                options={brokerOptions}
                placeholder={t('trade.selectBroker')}
                searchPlaceholder={t('trade.searchBrokers')}
                emptyText={t('trade.noBroker')}
                allowCustom={true}
              />
              {field.state.meta.errors && (
                <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
              )}
            </>
          )}
        />
      </div>

      <form.Subscribe
        selector={(state) => state.values.broker}
        children={(broker) => {
          // Auto-update account ID when broker changes
          const currentAccountId = form.getFieldValue('accountId') as string;
          const expectedAccountId = extractAccountId(broker);
          
          // Only update if the expected account ID is different and not empty
          if (expectedAccountId && currentAccountId !== expectedAccountId) {
            form.setFieldValue('accountId', expectedAccountId);
          }

          return (
            <div className="space-y-2">
              <form.Field
                name="accountId"
                children={(field) => (
                  <>
                    <Label htmlFor={field.name}>{t('trade.accountId')}</Label>
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
          );
        }}
      />

      {/* Notes */}
      <div className="space-y-2">
        <form.Field
          name="notes"
          children={(field) => (
            <>
              <Label htmlFor={field.name}>{t('trade.notes')}</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t('trade.optionalNotes')}
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
            {isSubmitting ? t('trade.recording') : t('trade.saveTrade')}
          </Button>
        )}
      />
    </form>
  )
}