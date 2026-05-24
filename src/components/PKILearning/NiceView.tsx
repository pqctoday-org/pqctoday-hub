// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Network, CheckCircle2, Circle, Clock } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useModuleStore } from '@/store/useModuleStore'
import { NICE_COMPETENCY_AREAS, NICE_WORK_ROLES } from '@/data/niceFramework'
import type {
  NiceCompetencyAreaId,
  NiceWorkRoleId,
  NiceProficiencyTier,
} from '@/data/niceFramework'
import { getModulesForCompetencyArea } from '@/data/niceModuleMapping'
import { MODULE_CATALOG } from './moduleData'

// Canonical CA display order — foundational → technical → governance
const CA_ORDER: NiceCompetencyAreaId[] = [
  'CA-CRYPTO',
  'CA-SYSARCH',
  'CA-SECPROG',
  'CA-NETDEF',
  'CA-IDENT',
  'CA-DATASEC',
  'CA-RISK',
  'CA-GOVCOMP',
]

// Matches the CA_COLORS pattern established in NiceGapReportSection.tsx
const CA_BADGE: Record<NiceCompetencyAreaId, string> = {
  'CA-CRYPTO': 'bg-primary/10 text-primary border-primary/20',
  'CA-SYSARCH': 'bg-muted-foreground/15 text-muted-foreground border-border',
  'CA-SECPROG': 'bg-success/10 text-success border-success/20',
  'CA-NETDEF': 'bg-success/15 text-success border-success/20',
  'CA-IDENT': 'bg-primary/15 text-primary border-primary/20',
  'CA-DATASEC': 'bg-warning/15 text-warning border-warning/20',
  'CA-RISK': 'bg-warning/10 text-warning border-warning/20',
  'CA-GOVCOMP': 'bg-destructive/10 text-destructive border-destructive/20',
}

// Left accent strip color per CA
const CA_STRIP: Record<NiceCompetencyAreaId, string> = {
  'CA-CRYPTO': 'bg-primary',
  'CA-SYSARCH': 'bg-muted-foreground',
  'CA-SECPROG': 'bg-success',
  'CA-NETDEF': 'bg-success',
  'CA-IDENT': 'bg-primary',
  'CA-DATASEC': 'bg-warning',
  'CA-RISK': 'bg-warning',
  'CA-GOVCOMP': 'bg-destructive',
}

const TIER_ROWS: { id: NiceProficiencyTier; label: string; className: string }[] = [
  {
    id: 'awareness',
    label: 'Awareness',
    className: 'bg-primary/10 text-primary border border-primary/20',
  },
  {
    id: 'practitioner',
    label: 'Practitioner',
    className: 'bg-warning/10 text-warning border border-warning/20',
  },
  {
    id: 'expert',
    label: 'Expert',
    className: 'bg-destructive/10 text-destructive border border-destructive/20',
  },
]

// pqctoday persona → best-fit NICE Work Role for auto-selection
const PERSONA_DEFAULT_ROLE: Record<string, NiceWorkRoleId> = {
  architect: 'security-architect',
  developer: 'security-developer',
  ops: 'system-administrator',
  executive: 'is-security-manager',
  researcher: 'systems-security-analyst',
}

interface NiceViewProps {
  navigate: (path: string) => void
  activePersonaId?: string | null
}

const VALID_ROLE_IDS = new Set<string>(Object.keys(NICE_WORK_ROLES))

export function NiceView({ navigate, activePersonaId }: NiceViewProps) {
  const moduleStates = useModuleStore((s) => s.modules)
  const [searchParams, setSearchParams] = useSearchParams()

  // URL param wins over persona default so shared links land on the right role
  const defaultRole: NiceWorkRoleId | 'all' = (() => {
    const urlRole = searchParams.get('role')
    if (urlRole && VALID_ROLE_IDS.has(urlRole)) return urlRole as NiceWorkRoleId
    if (activePersonaId && PERSONA_DEFAULT_ROLE[activePersonaId])
      return PERSONA_DEFAULT_ROLE[activePersonaId]
    return 'all'
  })()

  const [selectedRole, setSelectedRole] = useState<NiceWorkRoleId | 'all'>(defaultRole)

  const handleRoleChange = useCallback(
    (role: NiceWorkRoleId | 'all') => {
      setSelectedRole(role)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (role === 'all') next.delete('role')
          else next.set('role', role)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const workRoles = Object.values(NICE_WORK_ROLES)
  const selectedRoleData = selectedRole !== 'all' ? NICE_WORK_ROLES[selectedRole] : null

  // Total role-relevant modules + completed count for the header summary
  const roleSummary = useMemo(() => {
    if (selectedRole === 'all') return null
    const allRoleRefs = CA_ORDER.flatMap((caId) =>
      getModulesForCompetencyArea(caId).filter((m) => m.workRoles.includes(selectedRole))
    )
    // de-duplicate by moduleId (a module can appear in multiple CAs)
    const seen = new Set<string>()
    const unique = allRoleRefs.filter((m) => {
      if (seen.has(m.moduleId)) return false
      seen.add(m.moduleId)
      return true
    })
    const completed = unique.filter((m) => moduleStates[m.moduleId]?.status === 'completed').length
    return { total: unique.length, completed }
  }, [selectedRole, moduleStates])

  return (
    <div className="space-y-5">
      {/* ── Role selector ── */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Network size={15} className="text-primary shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Your Role</span>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            — pick a NICE Work Role to focus your curriculum
          </span>
        </div>

        {/* Mobile: compact dropdown */}
        <div className="sm:hidden">
          <FilterDropdown
            items={[
              { id: 'all', label: 'All Roles' },
              ...workRoles.map((r) => ({ id: r.id, label: r.title })),
            ]}
            selectedId={selectedRole}
            onSelect={(id) => handleRoleChange(id as NiceWorkRoleId | 'all')}
            defaultLabel="All Roles"
            size="sm"
          />
        </div>

        {/* Desktop: chip strip */}
        <div
          className="hidden sm:flex flex-wrap gap-1.5"
          role="radiogroup"
          aria-label="NICE Work Role filter"
        >
          <Button
            variant="ghost"
            size="sm"
            role="radio"
            aria-checked={selectedRole === 'all'}
            onClick={() => handleRoleChange('all')}
            className={clsx(
              'text-xs rounded-full px-3 py-1 h-auto border transition-all',
              selectedRole === 'all'
                ? 'bg-primary/10 text-primary border-primary/30 font-medium'
                : 'text-muted-foreground border-border hover:text-foreground'
            )}
          >
            All Roles
          </Button>
          {workRoles.map((role) => {
            const isPersonaMatch =
              activePersonaId && PERSONA_DEFAULT_ROLE[activePersonaId] === role.id
            return (
              <Button
                key={role.id}
                variant="ghost"
                size="sm"
                role="radio"
                aria-checked={selectedRole === role.id}
                onClick={() => handleRoleChange(selectedRole === role.id ? 'all' : role.id)}
                className={clsx(
                  'text-xs rounded-full px-3 py-1 h-auto border transition-all',
                  selectedRole === role.id
                    ? 'bg-primary/10 text-primary border-primary/30 font-medium'
                    : 'text-muted-foreground border-border hover:text-foreground'
                )}
              >
                {role.title}
                {isPersonaMatch && (
                  <span className="ml-1 text-primary" aria-label="matches your persona">
                    ★
                  </span>
                )}
              </Button>
            )
          })}
        </div>

        {selectedRoleData && (
          <div className="border-t border-border pt-2 flex items-start gap-3 flex-wrap">
            <span className="text-xs font-mono text-primary shrink-0">
              {selectedRoleData.niceCode}
            </span>
            <p className="text-xs text-muted-foreground flex-1">{selectedRoleData.description}</p>
            {roleSummary && (
              <span className="text-xs text-muted-foreground shrink-0">
                <span className="text-foreground font-semibold">{roleSummary.completed}</span>
                {' / '}
                <span className="font-semibold">{roleSummary.total}</span>
                {' relevant modules completed'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Competency Area sections ── */}
      {CA_ORDER.map((caId) => {
        const ca = NICE_COMPETENCY_AREAS[caId]
        const caRefs = getModulesForCompetencyArea(caId)
        if (caRefs.length === 0) return null

        const isCoreForRole =
          selectedRole !== 'all' && NICE_WORK_ROLES[selectedRole].competencyAreas.includes(caId)
        const isDimmed = selectedRole !== 'all' && !isCoreForRole

        const caCompleted = caRefs.filter(
          (m) => moduleStates[m.moduleId]?.status === 'completed'
        ).length

        const byTier: Record<NiceProficiencyTier, typeof caRefs> = {
          awareness: caRefs.filter((m) => m.tier === 'awareness'),
          practitioner: caRefs.filter((m) => m.tier === 'practitioner'),
          expert: caRefs.filter((m) => m.tier === 'expert'),
        }

        return (
          <div
            key={caId}
            className={clsx(
              'glass-panel overflow-hidden transition-opacity duration-200',
              isDimmed ? 'opacity-40' : 'opacity-100'
            )}
          >
            {/* CA header */}
            <div className="flex gap-0">
              {/* Accent strip */}
              <div className={clsx('w-1 shrink-0', CA_STRIP[caId])} aria-hidden="true" />

              <div className="flex-1 min-w-0 p-4 border-b border-border/50">
                <div className="flex items-start gap-2 flex-wrap">
                  <span
                    className={clsx(
                      'text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0',
                      CA_BADGE[caId]
                    )}
                  >
                    {caId}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{ca.title}</h3>
                  {isCoreForRole && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium whitespace-nowrap">
                      Core for {selectedRoleData?.title}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground shrink-0 tabular-nums">
                    {caCompleted}/{caRefs.length}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ca.description}</p>

                {/* TKS sample chips */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {ca.tksSample.slice(0, 5).map((tks) => (
                    <span
                      key={tks.id}
                      title={tks.label}
                      className="text-[10px] font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground border border-border/50 cursor-default"
                    >
                      {tks.type}·{tks.id}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tier rows */}
            <div className="divide-y divide-border/30">
              {TIER_ROWS.map(({ id: tierId, label, className }) => {
                const tierRefs = byTier[tierId]
                if (tierRefs.length === 0) return null
                return (
                  <div key={tierId} className="p-3 pl-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={clsx(
                          'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                          className
                        )}
                      >
                        {label}
                      </span>
                      <span className="text-xs text-muted-foreground">{tierRefs.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tierRefs.map((ref) => {
                        const mod = MODULE_CATALOG[ref.moduleId]
                        if (!mod) return null
                        const status = moduleStates[ref.moduleId]?.status ?? 'not-started'
                        const isRoleMatch =
                          selectedRole !== 'all' && ref.workRoles.includes(selectedRole)
                        const isSecondaryCA = ref.competencyAreas[0] !== caId

                        return (
                          <Button
                            key={ref.moduleId}
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(ref.moduleId)}
                            className={clsx(
                              'flex items-center gap-1.5 text-xs px-2.5 py-1.5 h-auto rounded-lg border transition-all',
                              status === 'completed'
                                ? 'border-success/40 bg-success/5 hover:bg-success/10'
                                : status === 'in-progress'
                                  ? 'border-info/40 bg-info/5 hover:bg-info/10'
                                  : 'border-border bg-muted/20 hover:bg-muted/40',
                              isRoleMatch && 'ring-1 ring-primary/50',
                              isSecondaryCA && 'opacity-60'
                            )}
                          >
                            <ModuleStatusIcon status={status} />
                            <span className="text-foreground max-w-[160px] truncate">
                              {mod.title}
                            </span>
                            <span className="text-muted-foreground shrink-0 ml-0.5">
                              {mod.duration}
                            </span>
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ModuleStatusIcon({ status }: { status: 'not-started' | 'in-progress' | 'completed' }) {
  if (status === 'completed')
    return <CheckCircle2 size={11} className="text-success shrink-0" aria-label="completed" />
  if (status === 'in-progress')
    return <Clock size={11} className="text-info shrink-0" aria-label="in progress" />
  return <Circle size={11} className="text-muted-foreground/50 shrink-0" aria-label="not started" />
}
