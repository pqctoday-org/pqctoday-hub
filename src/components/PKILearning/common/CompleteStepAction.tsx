// SPDX-License-Identifier: GPL-3.0-only
/**
 * CompleteStepAction — the single primary button for finishing a step, shared by
 * the executive save components and the simulation embed header so tools and
 * embeds look identical.
 *
 * Two words, by step nature (remediation plan §1):
 *   - recordsArtifact → "Save" / "Saved" (a document is recorded to the Command Center)
 *   - review-only      → "Mark complete" / "Completed"
 *
 * The done-state is PERSISTENT (it survives edits). For artifact steps, once the
 * content changes after a save it reads "Saved · edited since" rather than
 * flickering back to the action label — so a live-recomputed artifact (sliders,
 * calculators) keeps showing it was saved.
 */
import { Check, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SAVE_LABEL,
  SAVE_DONE_LABEL,
  COMPLETE_LABEL,
  COMPLETE_DONE_LABEL,
} from './completionLabels'

interface CompleteStepActionProps {
  /** true → artifact step ("Save"/"Saved"); false → review-only ("Mark complete"/"Completed"). */
  recordsArtifact?: boolean
  /** Persistent done-state — stays set across edits. */
  saved?: boolean
  /** Artifact edited after a save (only meaningful when recordsArtifact && saved). */
  editedSinceSave?: boolean
  onClick: () => void
  disabled?: boolean
  title?: string
  className?: string
  /** Preserve legacy tour/coachmark anchors (data-workshop-target) on the button. */
  dataWorkshopTarget?: string
}

export function CompleteStepAction({
  recordsArtifact = true,
  saved = false,
  editedSinceSave = false,
  onClick,
  disabled,
  title,
  className,
  dataWorkshopTarget,
}: CompleteStepActionProps) {
  const actionLabel = recordsArtifact ? SAVE_LABEL : COMPLETE_LABEL
  const doneLabel = recordsArtifact ? SAVE_DONE_LABEL : COMPLETE_DONE_LABEL
  const label = saved
    ? recordsArtifact && editedSinceSave
      ? `${doneLabel} · edited since`
      : doneLabel
    : actionLabel
  return (
    <Button
      variant="gradient"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={className}
      data-workshop-target={dataWorkshopTarget}
    >
      {saved || !recordsArtifact ? <Check size={14} /> : <Save size={14} />}
      <span className="ml-1.5">{label}</span>
    </Button>
  )
}
