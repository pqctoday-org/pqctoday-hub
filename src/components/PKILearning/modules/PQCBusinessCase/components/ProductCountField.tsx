// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { MAX_PRODUCT_COUNT, type ProductCountSource } from './roiProductCount'

interface ProductCountFieldProps {
  /** What the learner has typed so far (may be invalid or empty). */
  text: string
  /** The last valid count, which the figures keep using while the text is invalid. */
  value: number
  source: ProductCountSource
  /** The reason the text cannot be used, or null when it can or the reader is still typing. */
  error: string | null
  onTextChange: (text: string) => void
  /** Whether the field has focus, so a half-typed entry such as "1," is not announced as an error. */
  onFocusChange: (focused: boolean) => void
  /** Keep a restored count as the learner's own. */
  onConfirm: () => void
}

/**
 * The learner's own count of systems or products to migrate: a labelled number field with the unit
 * under it, an "example" tag while the opening value is in place, and a polite message for an entry
 * that cannot be used. The Hub catalogue is context only and never sets or limits this number.
 */
export const ProductCountField: React.FC<ProductCountFieldProps> = ({
  text,
  value,
  source,
  error,
  onTextChange,
  onFocusChange,
  onConfirm,
}) => (
  <div>
    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
      <label htmlFor="roi-products" className="block text-sm font-medium text-foreground">
        Systems or products in your scenario (your own count)
      </label>
      {source === 'example' && (
        <span
          id="roi-products-source"
          className="rounded-full border border-status-warning/40 bg-status-warning/10 px-2 py-0.5 text-[11px] font-medium text-foreground"
        >
          Example: change to your own count
        </span>
      )}
    </div>
    <input
      id="roi-products"
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={text}
      onChange={(e) => onTextChange(e.target.value)}
      onFocus={() => onFocusChange(true)}
      onBlur={() => onFocusChange(false)}
      aria-invalid={error ? true : undefined}
      aria-describedby={[
        'roi-products-help',
        source === 'example' ? 'roi-products-source' : null,
        'roi-products-message',
      ]
        .filter(Boolean)
        .join(' ')}
      maxLength={20}
      className={`h-11 w-full rounded-md border bg-muted px-3 py-2 font-mono text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:h-10 md:text-sm ${
        error
          ? 'border-destructive/60 focus-visible:ring-destructive'
          : 'border-input focus-visible:ring-primary'
      }`}
    />
    <p id="roi-products-help" className="mt-1.5 text-xs text-muted-foreground">
      Count of product or system instances you plan to migrate (a whole number from 1 to{' '}
      {MAX_PRODUCT_COUNT.toLocaleString('en-US')}; commas are fine). This is not the Hub catalogue.
      To identify what is in your estate, browse the{' '}
      <Link to="/migrate" className="text-primary hover:underline">
        Migrate catalogue
      </Link>
      ; its product count is not used in this calculator.
    </p>
    {/* Always mounted so a screen reader hears the message when it appears. */}
    <p
      id="roi-products-message"
      role="status"
      aria-live="polite"
      className="mt-1 text-xs text-status-error empty:mt-0"
    >
      {error ? `${error} The figures on this page still use ${value.toLocaleString('en-US')}.` : ''}
    </p>
    {source === 'saved-model' && (
      <div className="mt-2 flex flex-col items-start gap-2">
        <p className="text-xs text-foreground">
          Count from your saved model; it was set against the Hub catalogue, not your inventory.
          Confirm or change it.
        </p>
        <Button
          variant="outline"
          type="button"
          onClick={onConfirm}
          className="h-auto min-h-11 py-2"
        >
          Use {value.toLocaleString('en-US')} as my count
        </Button>
      </div>
    )}
  </div>
)
