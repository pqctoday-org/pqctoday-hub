// SPDX-License-Identifier: AGPL-3.0-only
import { BadgeCheck, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VALIDATION_DISCLAIMER } from '@/data/validationDisclaimer'
import {
  EVIDENCE_CLASS_LABEL,
  NON_CERTIFICATION_NOTICE,
  evidenceForTool,
  type ToolEvidenceClass,
} from './toolEvidence'

const TONE: Record<ToolEvidenceClass, string> = {
  'real-crypto': 'border-status-success/40 bg-status-success/10 text-status-success',
  'protocol-model': 'border-primary/35 bg-primary/10 text-primary',
  calculator: 'border-secondary/35 bg-secondary/10 text-secondary',
  'deterministic-demo': 'border-status-warning/40 bg-status-warning/10 text-status-warning',
  'synthetic-simulation': 'border-border bg-muted/60 text-muted-foreground',
}

export function ToolEvidenceBadges({
  toolId,
  compact = false,
}: {
  toolId: string
  compact?: boolean
}) {
  const profile = evidenceForTool(toolId)
  if (!profile) return null
  const classes = [profile.primary, ...(profile.secondary ? [profile.secondary] : [])]
  return (
    <span className="inline-flex flex-wrap items-center gap-1" aria-label="How this tool runs">
      {classes.map((kind) => (
        <span
          key={kind}
          className={cn(
            'inline-flex items-center rounded border font-semibold',
            compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
            TONE[kind]
          )}
        >
          {EVIDENCE_CLASS_LABEL[kind]}
        </span>
      ))}
    </span>
  )
}

export function ToolEvidenceNotice({
  toolId,
  resultBoundary = false,
}: {
  toolId: string
  resultBoundary?: boolean
}) {
  const profile = evidenceForTool(toolId)
  if (!profile) return null
  return (
    <aside
      aria-label={resultBoundary ? 'What these results prove' : 'How this tool runs'}
      className={cn(
        'rounded-lg border p-3 text-sm',
        resultBoundary && profile.certificationBoundary
          ? 'border-status-warning/35 bg-status-warning/5'
          : 'border-border bg-muted/20'
      )}
    >
      <div className="flex items-start gap-2.5">
        {resultBoundary ? (
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        ) : (
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        )}
        <div className="min-w-0 space-y-1.5">
          <ToolEvidenceBadges toolId={toolId} />
          <p className="leading-relaxed text-muted-foreground">{profile.summary}</p>
          {resultBoundary && profile.certificationBoundary && (
            <p
              className="font-medium leading-relaxed text-foreground"
              data-testid={profile.validationDisclaimer ? 'validation-disclaimer' : undefined}
            >
              {profile.validationDisclaimer ? VALIDATION_DISCLAIMER : NON_CERTIFICATION_NOTICE}
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
