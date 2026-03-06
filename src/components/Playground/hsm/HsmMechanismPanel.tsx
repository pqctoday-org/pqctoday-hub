// SPDX-License-Identifier: GPL-3.0-only
/**
 * HsmMechanismPanel — PKCS#11 v3.2 Mechanism Discovery
 *
 * Calls C_GetMechanismList + C_GetMechanismInfo on the active slot to enumerate
 * every mechanism the token supports, then displays them grouped by family with
 * their capability flags (SIGN, VERIFY, ENCRYPT, DERIVE, ENCAPSULATE, …).
 *
 * Requires token initialization (slotRef must be set). Session login is not needed —
 * mechanism discovery only requires a slotID, not an open session.
 */
import { useState } from 'react'
import { ShieldCheck, Search, ChevronDown, ChevronRight, Database } from 'lucide-react'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
import { Input } from '../../ui/input'
import { FilterDropdown } from '../../common/FilterDropdown'
import {
  hsm_getAllMechanisms,
  type MechanismInfo,
  type MechanismFamily,
} from '../../../wasm/softhsm'
import { useHsmContext } from './HsmContext'

// ── Constants ─────────────────────────────────────────────────────────────────

const FAMILY_META: Record<
  MechanismFamily,
  { label: string; border: string; text: string; bg: string }
> = {
  pqc: {
    label: 'PQC',
    border: 'border-l-accent',
    text: 'text-accent',
    bg: 'bg-accent/5',
  },
  asymmetric: {
    label: 'Classical Asymmetric',
    border: 'border-l-primary',
    text: 'text-primary',
    bg: 'bg-primary/5',
  },
  symmetric: {
    label: 'Symmetric',
    border: 'border-l-status-success',
    text: 'text-status-success',
    bg: 'bg-status-success/5',
  },
  hash: {
    label: 'Hash & HMAC',
    border: 'border-l-status-warning',
    text: 'text-status-warning',
    bg: 'bg-status-warning/5',
  },
  kdf: {
    label: 'KDF & Key Agreement',
    border: 'border-l-status-info',
    text: 'text-status-info',
    bg: 'bg-status-info/5',
  },
  other: {
    label: 'Other',
    border: 'border-l-border',
    text: 'text-muted-foreground',
    bg: 'bg-muted/30',
  },
}

const FLAG_STYLE: Record<string, string> = {
  SIGN: 'text-status-success bg-status-success/10',
  VERIFY: 'text-status-success bg-status-success/10',
  ENCRYPT: 'text-primary bg-primary/10',
  DECRYPT: 'text-primary bg-primary/10',
  DERIVE: 'text-accent bg-accent/10',
  DIGEST: 'text-muted-foreground bg-muted',
  GENERATE: 'text-secondary bg-secondary/10',
  KEY_PAIR_GEN: 'text-secondary bg-secondary/10',
  WRAP: 'text-status-info bg-status-info/10',
  UNWRAP: 'text-status-info bg-status-info/10',
  ENCAPSULATE: 'text-status-info bg-status-info/10',
  DECAPSULATE: 'text-status-info bg-status-info/10',
}

const FAMILY_ORDER: MechanismFamily[] = ['pqc', 'asymmetric', 'symmetric', 'hash', 'kdf', 'other']

const FAMILY_FILTER_ITEMS = [
  { id: 'pqc', label: 'PQC' },
  { id: 'asymmetric', label: 'Classical Asymmetric' },
  { id: 'symmetric', label: 'Symmetric' },
  { id: 'hash', label: 'Hash & HMAC' },
  { id: 'kdf', label: 'KDF & Key Agreement' },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

const FlagBadge = ({ flag }: { flag: string }) => (
  <span
    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${FLAG_STYLE[flag] ?? 'text-muted-foreground bg-muted'}`}
  >
    {flag}
  </span>
)

const KeySizeLabel = ({ min, max }: { min: number; max: number }) => {
  if (min === 0 && max === 0) return <span className="text-muted-foreground">—</span>
  if (min === max) return <span>{min}b</span>
  return (
    <span>
      {min}–{max}b
    </span>
  )
}

const MechRow = ({ mech }: { mech: MechanismInfo }) => (
  <div className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0 text-xs">
    {/* Name + type code */}
    <div className="flex-1 min-w-0">
      <div className="font-mono text-foreground truncate">{mech.name}</div>
      <div className="text-muted-foreground font-mono text-[10px]">{mech.typeHex}</div>
    </div>
    {/* Flag badges */}
    <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
      {mech.flagNames.length === 0 ? (
        <span className="text-muted-foreground text-[10px]">—</span>
      ) : (
        mech.flagNames.map((f) => <FlagBadge key={f} flag={f} />)
      )}
    </div>
    {/* Key size */}
    <div className="text-muted-foreground font-mono text-[10px] w-20 text-right shrink-0">
      <KeySizeLabel min={mech.ulMinKeySize} max={mech.ulMaxKeySize} />
    </div>
  </div>
)

interface FamilyGroupProps {
  family: MechanismFamily
  mechs: MechanismInfo[]
  expanded: boolean
  onToggle: () => void
}

const FamilyGroup = ({ family, mechs, expanded, onToggle }: FamilyGroupProps) => {
  const meta = FAMILY_META[family]
  return (
    <div className={`border-l-2 pl-3 ${meta.border}`}>
      {/* Group header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 w-full py-1.5 text-left hover:opacity-80 transition-opacity"
      >
        {expanded ? (
          <ChevronDown size={13} className={meta.text} />
        ) : (
          <ChevronRight size={13} className={meta.text} />
        )}
        <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>
        <span
          className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded ${meta.text} ${meta.bg}`}
        >
          {mechs.length}
        </span>
      </button>
      {/* Mechanism rows */}
      {expanded && (
        <div className="mt-0.5 mb-1">
          {mechs.map((m) => (
            <MechRow key={m.type} mech={m} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export const HsmMechanismPanel = () => {
  const { moduleRef, slotRef, phase, addHsmLog } = useHsmContext()

  const [mechanisms, setMechanisms] = useState<MechanismInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [search, setSearch] = useState('')
  const [familyFilter, setFamilyFilter] = useState<string>('All')
  const [expanded, setExpanded] = useState<Set<MechanismFamily>>(new Set(FAMILY_ORDER))

  const slotReady = phase !== 'idle' && slotRef.current !== null

  const handleQuery = async () => {
    const M = moduleRef.current
    const slotId = slotRef.current
    if (!M || slotId === null) return
    setLoading(true)
    setError(null)
    try {
      const mechs = hsm_getAllMechanisms(M, slotId)
      setMechanisms(mechs)
      setSearched(true)
      // Expand all groups after first query
      setExpanded(new Set(FAMILY_ORDER))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mechanism discovery failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleFamily = (f: MechanismFamily) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })

  // Filter mechanisms by family + search text
  const filtered = mechanisms.filter((m) => {
    if (familyFilter !== 'All' && m.family !== familyFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    }
    return true
  })

  // Group filtered mechanisms by family (preserving order)
  const groups = FAMILY_ORDER.map((f) => ({
    family: f,
    mechs: filtered.filter((m) => m.family === f),
  })).filter((g) => g.mechs.length > 0)

  // Suppress addHsmLog unused warning — logging is handled by the WASM proxy
  void addHsmLog

  return (
    <div className="glass-panel p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent" />
            <h3 className="font-semibold text-foreground text-sm">Mechanism Discovery</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            C_GetMechanismList · C_GetMechanismInfo
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleQuery}
          disabled={!slotReady || loading}
          className="shrink-0"
        >
          {loading ? (
            <>
              <span className="animate-spin mr-1.5">⟳</span>
              Querying…
            </>
          ) : (
            <>
              <Database size={13} className="mr-1.5" />
              Query Slot
            </>
          )}
        </Button>
      </div>

      {/* Not-ready hint */}
      {!slotReady && (
        <p className="text-xs text-muted-foreground">
          Initialize the token above, then click <strong>Query Slot</strong> to enumerate all
          supported mechanisms via C_GetMechanismList / C_GetMechanismInfo.
        </p>
      )}

      {/* Error */}
      {error && <ErrorAlert message={error} />}

      {/* Results */}
      {searched && mechanisms.length > 0 && (
        <>
          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <FilterDropdown
              items={FAMILY_FILTER_ITEMS}
              selectedId={familyFilter}
              onSelect={(id: string) => setFamilyFilter(id)}
              defaultLabel="All families"
              noContainer
            />
            <div className="relative flex-1 min-w-[140px]">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mechanisms…"
                className="pl-7 h-8 text-xs"
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono shrink-0">
              {filtered.length}/{mechanisms.length} mechanisms
            </span>
          </div>

          {/* Table header */}
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-0.5">
            <span className="flex-1">Mechanism</span>
            <span className="w-[200px] text-right">Operations</span>
            <span className="w-20 text-right">Key Size</span>
          </div>

          {/* Groups */}
          <div className="space-y-2">
            {groups.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No mechanisms match your filter.
              </p>
            ) : (
              groups.map(({ family, mechs }) => (
                <FamilyGroup
                  key={family}
                  family={family}
                  mechs={mechs}
                  expanded={expanded.has(family)}
                  onToggle={() => toggleFamily(family)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Empty state after query with no results */}
      {searched && mechanisms.length === 0 && !loading && !error && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No mechanisms returned by C_GetMechanismList.
        </p>
      )}
    </div>
  )
}

export default HsmMechanismPanel
