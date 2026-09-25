// SPDX-License-Identifier: GPL-3.0-only
import { Info } from 'lucide-react'
import clsx from 'clsx'
import { VALIDATION_DISCLAIMER } from '@/data/validationDisclaimer'
import { KAT_EVIDENCE_META, type KatEvidenceClass } from '@/utils/katEvidence'

/**
 * The required validation disclaimer (remediation plan §2.2), rendered
 * verbatim from the one shared constant. Always visible — never behind a
 * disclosure — so a reader sees it without opening anything.
 */
export const ValidationDisclaimer = ({ className }: { className?: string }) => (
  <p
    data-testid="validation-disclaimer"
    className={clsx(
      'flex items-start gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground',
      className
    )}
  >
    <Info size={13} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
    <span>{VALIDATION_DISCLAIMER}</span>
  </p>
)

/** Small per-row chip naming the evidence class of a result's expected value. */
export const KatEvidenceChip = ({ evidence }: { evidence: KatEvidenceClass }) => (
  <span
    data-testid="kat-evidence-chip"
    data-evidence={evidence}
    title={KAT_EVIDENCE_META[evidence].label}
    className={clsx(
      'inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-medium',
      evidence === 'nist-acvp-reference-sample'
        ? 'border-primary/30 bg-primary/10 text-primary'
        : evidence === 'unverified-provenance'
          ? 'border-status-warning/30 bg-status-warning/10 text-status-warning'
          : 'border-border bg-muted/40 text-muted-foreground'
    )}
  >
    {KAT_EVIDENCE_META[evidence].short}
  </span>
)
