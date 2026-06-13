// SPDX-License-Identifier: GPL-3.0-only
/**
 * PhaseRail — the persistent, collapsible "Migration Program" **left rail**.
 *
 * Renders the Applied Quantum Phase 0–7 + Foundations journey as a cross-page
 * lens over the NIST CSWP.39 spine. Implements PHASE-OVERLAY-SPEC.md §4 (the
 * visible rail) and §4.1 (navigation model): cadence-aware vertical layout,
 * store-driven node status, click-to-route with `?phase=<id>`, and a persona
 * "≈ your view" badge derived from the role crosswalk.
 *
 * Orientation: a sticky left sidebar on `lg+` (hidden below `lg` for now — a
 * mobile drawer is a follow-up). Minimize/expand is a persisted store flag
 * (`railCollapsed`): expanded shows labels + taglines (w-56); collapsed shows a
 * number + status-dot icon strip (w-14) with hover tooltips.
 *
 * The rail is *derived* — cadence from `FrameworkPhase.cadence`, status from
 * `useMigrationWorkflowStore.phaseStatus`, persona ownership from
 * `personaToRoles` × `ROLE_CROSSWALK` — so it cannot drift from the model.
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Check, Circle, CircleDot, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '../ui/button'
import {
  FRAMEWORK_PHASES,
  PHASE_ORDER,
  type FrameworkPhase,
  type PhaseId,
  type Route,
} from '../../data/frameworkPhases'
import { ROLE_CROSSWALK, personaToRoles, type FrameworkRoleId } from '../../data/roleCrosswalk'
import { PERSONAS } from '../../data/learningPersonas'
import { useMigrationWorkflowStore, type PhaseStatus } from '../../store/useMigrationWorkflowStore'
import { usePersonaStore } from '../../store/usePersonaStore'

/**
 * The phase's primary surface route (spec §4.1):
 *   diagnose?.route ?? produce?.[0]?.route ?? surfaces[0]
 */
function primaryRoute(phase: FrameworkPhase): Route {
  return phase.diagnose?.route ?? phase.produce?.[0]?.route ?? phase.surfaces[0]
}

/** Compute the set of phases the current persona owns (via role crosswalk). */
function useOwnedPhases(): Set<PhaseId> {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  return useMemo(() => {
    const owned = new Set<PhaseId>()
    if (!selectedPersona) return owned
    const roles = personaToRoles[selectedPersona] ?? []
    for (const roleId of roles) {
      for (const phaseId of ROLE_CROSSWALK[roleId].phases) owned.add(phaseId)
    }
    return owned
  }, [selectedPersona])
}

/** Human-readable list of the owning roles for a phase (for the badge tooltip). */
function owningRoles(phaseId: PhaseId): FrameworkRoleId[] {
  return Object.values(ROLE_CROSSWALK)
    .filter((r) => r.phases.includes(phaseId))
    .map((r) => r.id)
}

const STATUS_ICON: Record<PhaseStatus, typeof Check> = {
  done: Check,
  active: CircleDot,
  todo: Circle,
}

function statusColor(status: PhaseStatus): string {
  return status === 'done'
    ? 'text-emerald-500'
    : status === 'active'
      ? 'text-primary'
      : 'text-muted-foreground'
}

interface NodeProps {
  phase: FrameworkPhase
  status: PhaseStatus
  owned: boolean
  collapsed: boolean
  onNavigate: (phase: FrameworkPhase) => void
}

function PhaseNode({ phase, status, owned, collapsed, onNavigate }: NodeProps) {
  const Icon = STATUS_ICON[status]
  const numberGlyph = phase.number === null ? 'F' : String(phase.number)
  const label = phase.number === null ? phase.name : `${phase.number} · ${phase.name}`
  const roles = owned ? owningRoles(phase.id) : []
  const roleLabels = roles.map((r) => ROLE_CROSSWALK[r].label).join(', ')
  const stateWord = status === 'done' ? '(done)' : status === 'active' ? '(current)' : '(to-do)'

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onNavigate(phase)}
      aria-current={status === 'active' ? 'step' : undefined}
      aria-label={`Phase ${label} — ${phase.tagline} ${stateWord}${
        owned ? ` — your view (${roleLabels})` : ''
      }. Go to phase`}
      title={
        collapsed
          ? `${label} — ${phase.tagline}${owned ? ' · ≈ your view' : ''}`
          : owned
            ? `${roleLabels} · ≈ your view`
            : roleLabels || undefined
      }
      className={clsx(
        'group flex h-auto w-full items-center rounded-md border text-left transition-colors',
        collapsed ? 'justify-center px-0 py-1.5' : 'gap-2 px-2 py-1.5',
        status === 'active'
          ? 'border-primary/40 bg-primary/10'
          : status === 'done'
            ? 'border-border bg-muted/40 hover:bg-muted/60'
            : 'border-border bg-transparent hover:bg-muted/40',
        owned && 'ring-1 ring-primary/30'
      )}
    >
      {collapsed ? (
        <span className="flex flex-col items-center leading-none">
          <Icon size={12} aria-hidden="true" className={statusColor(status)} />
          <span className="mt-0.5 text-[10px] font-semibold text-foreground">{numberGlyph}</span>
          {owned && <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" aria-hidden="true" />}
        </span>
      ) : (
        <>
          <Icon size={13} aria-hidden="true" className={clsx('shrink-0', statusColor(status))} />
          <span className="min-w-0 flex-1">
            <span
              className={clsx(
                'block truncate text-xs font-semibold',
                status === 'active' ? 'text-primary' : 'text-foreground'
              )}
            >
              {label}
            </span>
            <span className="block truncate text-[10px] text-muted-foreground">
              {phase.tagline}
            </span>
          </span>
          {owned && (
            <span
              className="shrink-0 text-[10px] font-semibold text-primary"
              aria-hidden="true"
              title="≈ your view"
            >
              ★
            </span>
          )}
        </>
      )}
    </Button>
  )
}

/** A bordered cadence group (parallel / iterative pair, continuous, foundations). */
function Group({
  label,
  marker,
  collapsed,
  dashed,
  children,
}: {
  label: string
  marker?: string
  collapsed: boolean
  dashed?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={clsx(
        'rounded-md border',
        dashed ? 'border-dashed border-border/70' : 'border-border bg-muted/20',
        collapsed ? 'p-0.5' : 'p-1'
      )}
      aria-label={label}
    >
      {!collapsed && (
        <div className="px-1 pb-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
          {marker ? `${marker} ` : ''}
          {label}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  )
}

/** Vertical connector between sequential nodes (hidden when collapsed). */
function Connector({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return null
  return (
    <div className="flex justify-center py-0.5 text-muted-foreground/60" aria-hidden="true">
      ↓
    </div>
  )
}

export function PhaseRail() {
  const navigate = useNavigate()
  const phaseStatus = useMigrationWorkflowStore((s) => s.phaseStatus)
  const collapsed = useMigrationWorkflowStore((s) => s.railCollapsed)
  const toggleCollapsed = useMigrationWorkflowStore((s) => s.toggleRailCollapsed)
  const ownedPhases = useOwnedPhases()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)

  const handleNavigate = (phase: FrameworkPhase) => {
    navigate(`${primaryRoute(phase)}?phase=${phase.id}`)
  }

  const yourViewLabel = useMemo(() => {
    if (!selectedPersona || ownedPhases.size === 0) return null
    return PERSONAS[selectedPersona]?.label ?? null
  }, [selectedPersona, ownedPhases])

  const has = (id: PhaseId) => PHASE_ORDER.includes(id)
  const node = (id: PhaseId) =>
    has(id) ? (
      <PhaseNode
        phase={FRAMEWORK_PHASES[id]}
        status={phaseStatus[id]}
        owned={ownedPhases.has(id)}
        collapsed={collapsed}
        onNavigate={handleNavigate}
      />
    ) : null

  return (
    <aside
      aria-label="Migration Program phases"
      className={clsx(
        'hidden shrink-0 self-start rounded-lg border border-border bg-card/40 transition-[width] duration-200 lg:flex lg:flex-col lg:sticky lg:top-4 print:hidden',
        'max-h-[calc(100dvh-6rem)] overflow-y-auto',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Header + minimize/expand toggle */}
      <div
        className={clsx(
          'flex items-center gap-1 border-b border-border/60 px-2 py-2',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Migration Program
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand phase rail' : 'Minimize phase rail'}
          title={collapsed ? 'Expand' : 'Minimize'}
          className="h-7 w-7 shrink-0 p-0"
        >
          {collapsed ? (
            <PanelLeftOpen size={16} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={16} aria-hidden="true" />
          )}
        </Button>
      </div>

      {yourViewLabel && !collapsed && (
        <div className="px-2 pt-2">
          <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            your view: {yourViewLabel}
          </span>
        </div>
      )}

      <div className="space-y-1 p-2">
        {node('p0')}
        {has('p0') && (has('p1') || has('p2')) && <Connector collapsed={collapsed} />}

        {(has('p1') || has('p2')) && (
          <Group label="parallel" marker="∥" collapsed={collapsed} dashed>
            {node('p1')}
            {node('p2')}
          </Group>
        )}

        {(has('p1') || has('p2')) && has('p3') && <Connector collapsed={collapsed} />}
        {node('p3')}
        {has('p3') && has('p4') && <Connector collapsed={collapsed} />}
        {node('p4')}
        {has('p4') && (has('p5') || has('p6')) && <Connector collapsed={collapsed} />}

        {(has('p5') || has('p6')) && (
          <Group label="iterative" marker="⇄" collapsed={collapsed} dashed>
            {node('p5')}
            {node('p6')}
          </Group>
        )}

        {has('p7') && (
          <Group label="continuous" collapsed={collapsed}>
            {node('p7')}
          </Group>
        )}

        {has('foundations') && (
          <Group label="Foundations" collapsed={collapsed}>
            {node('foundations')}
          </Group>
        )}

        {!collapsed && (
          <p className="px-1 pt-1 text-[10px] text-muted-foreground">
            ✓ done · ● current · ○ to-do
          </p>
        )}
      </div>
    </aside>
  )
}
