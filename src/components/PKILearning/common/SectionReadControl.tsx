// SPDX-License-Identifier: AGPL-3.0-only
import { useId } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { LEARN_SECTIONS } from '../moduleData'
import { requiredLearnSectionIdsFor } from '../manifest/learnPathScope'

interface SectionReadControlProps {
  moduleId: string
  sectionId: string
}

/**
 * Set on a section element whose own component renders the control (`data-section-read="own"`), or
 * on the host the control is mounted into for a plain anchored section. A section never gets two.
 */
export const SECTION_READ_ATTR = 'data-section-read'

/**
 * The one control at the end of a required lesson section: a tick box that records the section as
 * read, or takes the tick back. It is the manual way to do what scrolling through the section does
 * on its own, and it uses the same store action the old progress box used (`toggleLearnSection`).
 * A section that does not count toward completion (an optional reference, or off the active path)
 * has no control.
 */
export function SectionReadControl({ moduleId, sectionId }: SectionReadControlProps) {
  const id = useId()
  const activePath = useModuleStore((s) => s.modules[moduleId]?.activeLearnPath) // eslint-disable-line security/detect-object-injection
  const checked = useModuleStore(
    (s) => s.modules[moduleId]?.learnSectionChecks?.[sectionId] ?? false // eslint-disable-line security/detect-object-injection
  )
  const toggle = useModuleStore((s) => s.toggleLearnSection)

  const required = requiredLearnSectionIdsFor(moduleId, activePath).includes(sectionId)
  const section = (LEARN_SECTIONS[moduleId] ?? []).find((s) => s.id === sectionId)
  if (!required || !section) return null

  return (
    <div
      data-testid="section-read-control"
      className="mt-6 flex justify-end border-t border-border pt-3"
    >
      <label
        htmlFor={id}
        className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-foreground"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={() => toggle(moduleId, sectionId)}
          aria-label={`Mark section as read: ${section.label}`}
          className="h-5 w-5 shrink-0 cursor-pointer accent-primary"
        />
        <span aria-hidden="true">Mark section as read</span>
      </label>
    </div>
  )
}
