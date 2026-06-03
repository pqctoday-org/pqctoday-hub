// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Network, ExternalLink, Container } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { NICE_COMPETENCY_AREAS, NICE_WORK_ROLES } from '@/data/niceFramework'
import type {
  NiceCompetencyAreaId,
  NiceProficiencyTier,
  NiceWorkRoleId,
} from '@/data/niceFramework'
import { getToolsForCompetencyArea } from '@/data/toolNiceMapping'
import type { WorkshopTool } from '../workshopRegistry'

// Same canonical CA order as Learn's NiceView for visual consistency
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

const CA_BADGE: Record<NiceCompetencyAreaId, string> = {
  'CA-CRYPTO': 'bg-primary/10 text-primary border-primary/20',
  'CA-SYSARCH': 'bg-muted-foreground/15 text-muted-foreground border-border',
  'CA-SECPROG': 'bg-status-success/10 text-status-success border-status-success/20',
  'CA-NETDEF': 'bg-status-info/10 text-status-info border-status-info/20',
  'CA-IDENT': 'bg-primary/15 text-primary border-primary/20',
  'CA-DATASEC': 'bg-status-warning/15 text-status-warning border-status-warning/20',
  'CA-RISK': 'bg-status-warning/10 text-status-warning border-status-warning/20',
  'CA-GOVCOMP': 'bg-status-error/10 text-status-error border-status-error/20',
}

const CA_STRIP: Record<NiceCompetencyAreaId, string> = {
  'CA-CRYPTO': 'bg-primary',
  'CA-SYSARCH': 'bg-muted-foreground',
  'CA-SECPROG': 'bg-status-success',
  'CA-NETDEF': 'bg-status-info',
  'CA-IDENT': 'bg-primary',
  'CA-DATASEC': 'bg-status-warning',
  'CA-RISK': 'bg-status-warning',
  'CA-GOVCOMP': 'bg-status-error',
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
    className: 'bg-status-warning/10 text-status-warning border border-status-warning/20',
  },
  {
    id: 'expert',
    label: 'Expert',
    className: 'bg-status-error/10 text-status-error border border-status-error/20',
  },
]

const PERSONA_DEFAULT_ROLE: Record<string, NiceWorkRoleId> = {
  architect: 'security-architect',
  developer: 'security-developer',
  ops: 'system-administrator',
  executive: 'is-security-manager',
  researcher: 'systems-security-analyst',
}

interface PlaygroundNiceViewProps {
  tools: WorkshopTool[]
  activePersonaId?: string | null
}

export const PlaygroundNiceView: React.FC<PlaygroundNiceViewProps> = ({
  tools,
  activePersonaId,
}) => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Computed at render time so `NICE_WORK_ROLES` is guaranteed loaded — module
  // top-level `Object.keys(NICE_WORK_ROLES)` crashes in production when Vite's
  // chunk-splitter places niceFramework in a chunk that loads after this one.
  const validRoleIds = useMemo(() => new Set<string>(Object.keys(NICE_WORK_ROLES)), [])

  const defaultRole: NiceWorkRoleId | 'all' = (() => {
    const urlRole = searchParams.get('role')
    if (urlRole && validRoleIds.has(urlRole)) return urlRole as NiceWorkRoleId
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

  // Per-CA tool buckets — computed once for the current filtered tool set
  const caBuckets = useMemo(() => {
    const buckets = new Map<NiceCompetencyAreaId, ReturnType<typeof getToolsForCompetencyArea>>()
    for (const caId of CA_ORDER) {
      buckets.set(caId, getToolsForCompetencyArea(caId, tools))
    }
    return buckets
  }, [tools])

  return (
    <div className="space-y-5">
      {/* ── Role selector ── */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Network size={15} className="text-primary shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Your Role</span>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            — pick a NICE Work Role to focus your tools
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
          </div>
        )}
      </div>

      {/* ── Competency Area sections ── */}
      {CA_ORDER.map((caId) => {
        const ca = NICE_COMPETENCY_AREAS[caId]
        const allCaRefs = caBuckets.get(caId) ?? []
        if (allCaRefs.length === 0) return null

        const isCoreForRole =
          selectedRole !== 'all' && NICE_WORK_ROLES[selectedRole].competencyAreas.includes(caId)

        // When a specific role is picked, hide non-core CAs entirely and filter tools
        // to those tagged for that role. "All Roles" keeps the full catalog visible.
        if (selectedRole !== 'all' && !isCoreForRole) return null
        const caRefs =
          selectedRole === 'all'
            ? allCaRefs
            : allCaRefs.filter((r) => r.ref.workRoles.includes(selectedRole))
        if (caRefs.length === 0) return null

        const byTier: Record<NiceProficiencyTier, typeof caRefs> = {
          awareness: caRefs.filter((r) => r.ref.tier === 'awareness'),
          practitioner: caRefs.filter((r) => r.ref.tier === 'practitioner'),
          expert: caRefs.filter((r) => r.ref.tier === 'expert'),
        }

        return (
          <div key={caId} className="glass-panel overflow-hidden">
            {/* CA header */}
            <div className="flex gap-0">
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
                    {caRefs.length} {caRefs.length === 1 ? 'tool' : 'tools'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ca.description}</p>
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
                      {tierRefs.map(({ tool, isPrimary }) => {
                        const Icon = tool.icon
                        const isSandbox = tool.category === 'Sandbox'
                        return (
                          <Link
                            key={tool.id}
                            to={`/playground/${tool.id}`}
                            className={clsx(
                              'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-all',
                              isSandbox ? 'border-status-info/30' : 'border-border',
                              !isPrimary && 'opacity-60'
                            )}
                            title={isSandbox ? 'Sandbox scenario (Docker container)' : undefined}
                          >
                            {isSandbox ? (
                              <Container
                                size={11}
                                className="text-status-info shrink-0"
                                aria-hidden="true"
                              />
                            ) : (
                              <Icon
                                size={11}
                                className="text-primary shrink-0"
                                aria-hidden="true"
                              />
                            )}
                            <span className="text-foreground max-w-[180px] truncate">
                              {tool.name}
                            </span>
                            {isSandbox && (
                              <span
                                className="text-[9px] font-mono px-1 py-0.5 rounded bg-status-info/10 text-status-info border border-status-info/20 shrink-0"
                                aria-label="Sandbox scenario"
                              >
                                SBX
                              </span>
                            )}
                            <ExternalLink
                              size={10}
                              className="text-muted-foreground shrink-0 ml-0.5"
                              aria-hidden="true"
                            />
                          </Link>
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
