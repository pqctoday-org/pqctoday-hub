// SPDX-License-Identifier: AGPL-3.0-only
//
// A link from an architecture lesson to the architect's decision editor in the
// Command Center's architecture pack, opened on that lesson's template. Shown
// only to the security architect, the persona the pack panel is shown to.

import { Link } from 'react-router'
import { ClipboardPen } from 'lucide-react'
import { usePersonaStore } from '@/store/usePersonaStore'
import { DECISION_TEMPLATES, type DecisionTopic } from '@/services/architectureArtifacts'

export function RecordDecisionLink({ topic }: { topic: Exclude<DecisionTopic, 'other'> }) {
  const persona = usePersonaStore((s) => s.selectedPersona)
  if (persona !== 'architect') return null
  const label = DECISION_TEMPLATES.find((t) => t.topic === topic)?.label ?? 'decision'
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm"
      data-testid={`record-decision-${topic}`}
    >
      <ClipboardPen size={16} className="shrink-0 text-primary" aria-hidden="true" />
      <span className="text-muted-foreground">Made a call on this for your own systems?</span>
      <Link to={`/business?adr=${topic}`} className="font-medium text-primary hover:underline">
        Record it as a decision: {label.toLowerCase()}
      </Link>
    </div>
  )
}
