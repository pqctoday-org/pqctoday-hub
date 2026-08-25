// SPDX-License-Identifier: GPL-3.0-only
import { useNavigate } from 'react-router'
import type { PersonaId } from '@/data/learningPersonas'
import { NAV_PATH_LABELS } from '@/data/personaConfig'
import { Button } from '@/components/ui/button'
import {
  getRailSections,
  getForYouGroups,
  getGroupAbsences,
  getUngatedGroupablePaths,
  RAIL_ICON_MAP,
  FOR_YOU_GROUP_BLURBS,
  FOR_YOU_GROUP_LABELS,
  type ForYouGroupId,
} from '@/components/Layout/railNav'
import { MobileSheet } from '../primitives/Sheet'
import { mobileGroupDisplayPaths } from './mobileNavGroups'

export interface MobileGroupPanelProps {
  groupId: ForYouGroupId
  open: boolean
  onClose: () => void
  persona: PersonaId | null
}

/**
 * One of the bottom bar's three group panels (Workflow / Practice /
 * Reference) — the handoff's "3-column grid of icon tiles" mirroring the
 * desktop rail's own grouping. Reads getRailSections/getForYouGroups exactly
 * as the desktop rail does (railNav.ts): a page a persona can't reach here
 * is a page they can't reach there either, and the "not offered for your
 * role — why" footer notices are the SAME PERSONA_ABSENT_PATHS reasons the
 * rail already shows, not new copy.
 *
 * No persona selected: getForYouGroups(forYou) would return zero groups
 * (there's nothing gated to group), so this falls back to
 * getUngatedGroupablePaths() — the same "everything, unfiltered" the
 * desktop rail's own no-persona state shows, just grouped into tiles
 * instead of a flat list, since the bottom bar's three tabs are fixed UI
 * slots that need to show something regardless of persona.
 *
 * Tile positions reuse computeGroupDisplayPaths (railNav.ts) via
 * mobileGroupDisplayPaths — the exact same Timeline/Threats-in-Reference and
 * Business-Tools-in-Practice display additions the desktop rail applies, not
 * the raw persona-gated bucketing alone. Both are RAIL_ALWAYS_VISIBLE_PATHS
 * / render-only additions on desktop, reachable by every persona and never
 * persona-gated, so unlike the rest of this panel's tile set they need no
 * absence handling. '/explore' is filtered out for mobile specifically
 * (confirmed decision, 2026-08-23 — dropped from mobile entirely).
 */
export function MobileGroupPanel({ groupId, open, onClose, persona }: MobileGroupPanelProps) {
  const navigate = useNavigate()
  const { forYou } = getRailSections(persona)
  const groupablePaths = persona ? forYou : getUngatedGroupablePaths()
  const groups = getForYouGroups(groupablePaths)
  const group = groups.find((g) => g.id === groupId)
  const absences = getGroupAbsences(persona, groupId)
  const paths = mobileGroupDisplayPaths({ id: groupId, paths: group?.paths ?? [] }, groupablePaths)

  const handleSelect = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={FOR_YOU_GROUP_LABELS[groupId]}
      titleId={`mobile-group-panel-${groupId}-title`}
      testId={`mobile-group-panel-${groupId}`}
    >
      <p className="mb-4 text-[11.5px] text-muted-foreground">{FOR_YOU_GROUP_BLURBS[groupId]}</p>

      {paths.length === 0 && absences.length === 0 && (
        <p className="text-[12.5px] text-muted-foreground">Nothing here for your role yet.</p>
      )}

      {paths.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {paths.map((path) => {
            const Icon = RAIL_ICON_MAP[path]
            const label = NAV_PATH_LABELS[path] ?? path
            return (
              <Button
                key={path}
                type="button"
                variant="ghost"
                onClick={() => handleSelect(path)}
                className="flex h-auto min-h-[76px] flex-col items-center gap-1.5 whitespace-normal rounded-[11px] border border-border bg-muted/30 p-3 text-center hover:bg-muted/50"
              >
                {Icon && <Icon size={20} aria-hidden="true" className="text-foreground" />}
                <span className="text-[10px] font-bold leading-tight text-foreground">{label}</span>
              </Button>
            )
          })}
        </div>
      )}

      {absences.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-border pt-3">
          {absences.map((a) => (
            <div key={a.path} className="text-[11.5px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {NAV_PATH_LABELS[a.path] ?? a.path}
              </span>{' '}
              is not offered for your role — {a.reason}{' '}
              <Button
                type="button"
                variant="link"
                onClick={() => handleSelect(a.insteadPath)}
                className="h-auto p-0 text-[11.5px] font-semibold text-primary underline underline-offset-2"
              >
                {a.insteadLabel}
              </Button>
            </div>
          ))}
        </div>
      )}
    </MobileSheet>
  )
}
