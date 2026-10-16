// SPDX-License-Identifier: GPL-3.0-only
/**
 * The scope step an unscoped register shows in place of a pointer elsewhere.
 *
 * The register needs a country and a sector. A new GRC or Executive reader has
 * neither (both personas start Global, with no sector), and the home board sends
 * them straight here — so the first screen used to be "set your sector in the
 * selector at the top right, and your country just above". This puts the two
 * pickers where the reader already is, offers only the ones still missing, and
 * disappears once both are set.
 *
 * It owns no state. Country goes through the page's own country handler (the
 * same one the scope bar's Country picker uses); sector goes through
 * `useScopeSector`, the same write the top bar's scope selector makes.
 */
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { AVAILABLE_INDUSTRIES } from '@/hooks/assessmentData'
import { useScopeSector } from '@/hooks/useScopeSector'

const ANY = 'All'

export interface InlineScopeStepProps {
  /** The country the register is using, or `All` when there is none. */
  country: string
  countryItems: string[]
  onCountryChange: (country: string) => void
  /** The sector the register is using, or `All` when there is none. */
  sector: string
  /** `card` sits inside the empty-register card; `strip` sits above a partial register. */
  variant?: 'card' | 'strip'
}

/**
 * A scope value as the register sees it: `All` when there is none. The stores
 * hold `''` (or null) for "not answered", and the engine treats the `Global`
 * country as no country (`isProfileEmpty`), so all three read as missing here.
 */
export function scopeValue(raw: string | null | undefined, ignore?: string): string {
  return !raw || raw === ANY || raw === ignore ? ANY : raw
}

/** True when the register is missing a country or a sector. */
export function isScopeIncomplete(country: string, sector: string): boolean {
  return country === ANY || sector === ANY
}

export function InlineScopeStep({
  country,
  countryItems,
  onCountryChange,
  sector,
  variant = 'card',
}: InlineScopeStepProps) {
  const setSector = useScopeSector()
  const needCountry = country === ANY
  const needSector = sector === ANY
  if (!needCountry && !needSector) return null

  const missing = [needCountry && 'country', needSector && 'sector'].filter(Boolean).join(' and ')

  const pickers = (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {needCountry && (
        <FilterDropdown
          items={countryItems.filter((c) => c !== ANY)}
          selectedId={ANY}
          onSelect={onCountryChange}
          size="sm"
          searchable
          defaultLabel="Choose…"
          hideDefaultOption
          label="Your country"
        />
      )}
      {needSector && (
        <FilterDropdown
          items={AVAILABLE_INDUSTRIES}
          selectedId={ANY}
          onSelect={setSector}
          size="sm"
          searchable
          defaultLabel="Choose…"
          hideDefaultOption
          label="Your sector"
        />
      )}
    </div>
  )

  if (variant === 'strip') {
    return (
      <div
        role="group"
        aria-label="Complete your scope"
        className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-3"
      >
        <p className="text-xs text-muted-foreground">
          Still unknown: <span className="font-medium text-foreground">{missing}</span>. Add it to
          see which of these are mandatory for you rather than merely relevant.
        </p>
        {pickers}
      </div>
    )
  }

  return (
    <div role="group" aria-label="Set your scope" className="mt-4 space-y-2">
      {pickers}
      <p className="text-[11px] text-muted-foreground">
        Still unknown: <span className="font-medium text-foreground">{missing}</span>. The sector
        you pick here becomes your sector across the site, as if you had set it in your role
        settings.
      </p>
    </div>
  )
}
