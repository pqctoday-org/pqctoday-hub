// SPDX-License-Identifier: GPL-3.0-only
import { Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ComplianceHint } from '@/data/compliancePersonaHints'
import type { MobileSection } from './useComplianceUrlState'

interface PersonaHintCtaProps {
  /** Display label that contextualises the hint, e.g. "Finance & Banking focus". */
  label: string
  hint: ComplianceHint
  onNavigate: (section: MobileSection) => void
  onDismiss?: () => void
}

/**
 * Converts the persona / region hint from editorial copy into a one-click
 * navigation primitive. The gradient CTA jumps directly to the recommended
 * compliance section; the rationale stays underneath for context.
 *
 * The `hint.section` value is constrained to the MobileSection union (see
 * compliancePersonaHints.ts — every entry resolves to 'certification' today).
 * If a new section value is introduced, extend the cast at the call site.
 */
export function PersonaHintCta({ label, hint, onNavigate, onDismiss }: PersonaHintCtaProps) {
  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5 text-sm"
      data-workshop-target="compliance-persona-hint"
    >
      <div className="flex items-start gap-3">
        <Info size={16} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-semibold text-foreground">{label}:</span>
            <Button
              type="button"
              variant="gradient"
              size="sm"
              onClick={() => onNavigate(hint.section as MobileSection)}
              data-workshop-target="compliance-persona-hint-cta"
              aria-label={`Go to ${hint.sectionLabel}`}
              className="h-auto text-xs px-3 py-1.5"
            >
              Go to {hint.sectionLabel}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">{hint.rationale}</p>
        </div>
        {onDismiss && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            aria-label="Dismiss persona hint"
            className="h-auto text-xs px-2 py-1 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X size={14} />
          </Button>
        )}
      </div>
    </div>
  )
}
