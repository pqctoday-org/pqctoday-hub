// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { Users } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { FilterDropdown } from './FilterDropdown'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'

interface RoleFilterProps {
  className?: string
  /** When true, changes to selectedPersona in persona store sync to the role URL param */
  syncWithPersona?: boolean
}

// NICE / PQC overlay role options — maps to persona aliases
const ROLE_OPTIONS = [
  {
    id: 'PQC-ROLE-CISO',
    label: 'CISO / Security Executive',
    personaAlias: 'executive' as PersonaId,
  },
  {
    id: 'PQC-ROLE-CRYPTOENGINEER',
    label: 'Cryptographic Engineer',
    personaAlias: 'developer' as PersonaId,
  },
  { id: 'PQC-ROLE-SYSARCH', label: 'Security Architect', personaAlias: 'architect' as PersonaId },
  {
    id: 'PQC-ROLE-RESEARCHER',
    label: 'Cryptography Researcher',
    personaAlias: 'researcher' as PersonaId,
  },
  { id: 'PQC-ROLE-OPSEC', label: 'Security Operations', personaAlias: 'ops' as PersonaId },
]

const PERSONA_TO_ROLE: Record<PersonaId, string> = {
  executive: 'PQC-ROLE-CISO',
  developer: 'PQC-ROLE-CRYPTOENGINEER',
  architect: 'PQC-ROLE-SYSARCH',
  researcher: 'PQC-ROLE-RESEARCHER',
  ops: 'PQC-ROLE-OPSEC',
  curious: 'PQC-ROLE-CISO',
}

export function RoleFilter({ className, syncWithPersona = false }: RoleFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = searchParams.getAll('role')
  const { selectedPersona, setPersona } = usePersonaStore()

  // Sync persona store → role URL param when persona changes
  useEffect(() => {
    if (!syncWithPersona || !selectedPersona) return
    const roleCode = PERSONA_TO_ROLE[selectedPersona]
    const current = searchParams.getAll('role')
    if (!current.includes(roleCode)) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('role')
          next.append('role', roleCode)
          return next
        },
        { replace: true }
      )
    }
  }, [selectedPersona, syncWithPersona]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(codes: string[]) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('role')
        for (const c of codes) next.append('role', c)
        return next
      },
      { replace: true }
    )

    // Sync role URL param → persona store when filter changes
    if (syncWithPersona && codes.length === 1) {
      const roleOpt = ROLE_OPTIONS.find((r) => r.id === codes[0])
      if (roleOpt) setPersona(roleOpt.personaAlias)
    }
  }

  return (
    <FilterDropdown
      items={ROLE_OPTIONS.map((r) => ({ id: r.id, label: r.label }))}
      selectedId=""
      onSelect={() => {}}
      multiSelectedIds={selected}
      onMultiSelect={handleChange}
      defaultLabel="All Roles"
      defaultIcon={<Users size={14} className="text-primary" />}
      className={className}
    />
  )
}

/** Read role filter state from URL */
export function useRoleFilter(): string[] {
  const [searchParams] = useSearchParams()
  return searchParams.getAll('role')
}

/** Returns true when value matches any selected role code (or no roles selected) */
export function matchesRoleFilter(
  roleFilter: string[],
  applicableRoles: string | string[]
): boolean {
  if (roleFilter.length === 0) return true
  const arr = Array.isArray(applicableRoles) ? applicableRoles : [applicableRoles]
  return roleFilter.some((code) => {
    const roleOpt = ROLE_OPTIONS.find((r) => r.id === code)
    if (!roleOpt) return false
    return arr.some(
      (v) =>
        v === code ||
        v === roleOpt.personaAlias ||
        v.toLowerCase().includes(roleOpt.personaAlias.toLowerCase())
    )
  })
}
