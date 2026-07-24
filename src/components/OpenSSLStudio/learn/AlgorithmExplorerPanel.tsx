// SPDX-License-Identifier: GPL-3.0-only
//
// AlgorithmExplorerPanel — OpenSSL Studio's live "what does THIS build
// actually support" discovery panel, mirroring HsmMechanismPanel.tsx (the
// PKCS#11 playground's live C_GetMechanismList discovery view). Every row
// comes from a real `openssl list ...` call against the same WASM engine
// the Workbench and Learn tab share (via the runCommand prop, sourced once
// from useOpenSSL() at OpenSSLStudioView — see WorkbenchPreview.tsx).
//
// The one thing this panel refuses to do: trust `list -providers`'s
// self-reported "active" status at face value. Every non-default provider
// gets a real functional probe (genpkey through it) before its algorithms
// are shown as usable — see algorithmListParser.ts's provider-honesty
// section and openssl-studio-phase3-algorithm-explorer-plan-07242026.md.
import { useState } from 'react'
import { Search, ChevronDown, ChevronRight, Database, ShieldCheck, ShieldAlert } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { FilterDropdown } from '../../common/FilterDropdown'
import { Term } from '../../Playground/learnkit/Term'
import { GlossaryRail } from '../../Playground/learnkit/GlossaryRail'
import {
  parseProviders,
  parseKeyManagersSection,
  parseFlatProvidedList,
  parseLegacySection,
  pickProbeTarget,
  probeProviderFunctional,
  type AlgorithmEntry,
  type AlgorithmFamily,
  type ProviderStatus,
  type ProviderProbeResult,
} from './algorithmListParser'

const FAMILY_META: Record<AlgorithmFamily, { label: string; border: string; text: string }> = {
  pqc: { label: 'PQC', border: 'border-l-accent', text: 'text-accent' },
  'classical-asymmetric': {
    label: 'Classical Asymmetric',
    border: 'border-l-primary',
    text: 'text-primary',
  },
  symmetric: { label: 'Symmetric', border: 'border-l-status-success', text: 'text-status-success' },
  'hash-hmac': {
    label: 'Hash & HMAC',
    border: 'border-l-status-warning',
    text: 'text-status-warning',
  },
  kdf: { label: 'KDF', border: 'border-l-status-info', text: 'text-status-info' },
  other: { label: 'Other', border: 'border-l-border', text: 'text-muted-foreground' },
}
const FAMILY_ORDER: AlgorithmFamily[] = [
  'pqc',
  'classical-asymmetric',
  'symmetric',
  'hash-hmac',
  'kdf',
  'other',
]
const FAMILY_FILTER_ITEMS = FAMILY_ORDER.map((f) => ({ id: f, label: FAMILY_META[f].label }))

const LIST_QUERIES: { flag: string; sourceList: string }[] = [
  { flag: '-kem-algorithms', sourceList: 'kem-algorithms' },
  { flag: '-signature-algorithms', sourceList: 'signature-algorithms' },
  { flag: '-kdf-algorithms', sourceList: 'kdf-algorithms' },
  { flag: '-mac-algorithms', sourceList: 'mac-algorithms' },
  { flag: '-cipher-algorithms', sourceList: 'cipher-algorithms' },
  { flag: '-digest-algorithms', sourceList: 'digest-algorithms' },
]

function dedupe(entries: AlgorithmEntry[]): AlgorithmEntry[] {
  const byKey = new Map<string, AlgorithmEntry>()
  for (const e of entries) {
    const key = `${e.provider}::${e.name}`
    if (!byKey.has(key)) byKey.set(key, e)
  }
  return [...byKey.values()]
}

const EntryRow = ({ entry }: { entry: AlgorithmEntry }) => (
  <div className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0 text-xs">
    <div className="flex-1 min-w-0">
      <div className="font-mono text-foreground truncate">
        <Term glossaryKey={entry.name}>{entry.name}</Term>
        {entry.aliases.length > 1 && (
          <span className="ml-1.5 text-[10px] text-muted-foreground">
            ({entry.aliases.slice(1, 4).join(', ')}
            {entry.aliases.length > 4 ? ', …' : ''})
          </span>
        )}
      </div>
      {entry.oids.length > 0 && (
        <div className="text-muted-foreground font-mono text-[10px] truncate">{entry.oids[0]}</div>
      )}
    </div>
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
        entry.provider === 'legacy'
          ? 'bg-muted text-muted-foreground'
          : 'bg-primary/10 text-primary'
      }`}
    >
      @ {entry.provider}
    </span>
  </div>
)

interface FamilyGroupProps {
  family: AlgorithmFamily
  entries: AlgorithmEntry[]
  expanded: boolean
  onToggle: () => void
}

const FamilyGroup = ({ family, entries, expanded, onToggle }: FamilyGroupProps) => {
  const meta = FAMILY_META[family]
  return (
    <div className={`border-l-2 pl-3 ${meta.border}`}>
      <Button
        variant="ghost"
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
          className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded ${meta.text} bg-muted/40`}
        >
          {entries.length}
        </span>
      </Button>
      {expanded && (
        <div className="mt-0.5 mb-1">
          {entries.map((e) => (
            <EntryRow key={`${e.provider}::${e.name}`} entry={e} />
          ))}
        </div>
      )}
    </div>
  )
}

const ProviderRow = ({
  provider,
  probe,
}: {
  provider: ProviderStatus
  probe: ProviderProbeResult | undefined
}) => {
  const functional = probe?.functional
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-2.5 text-xs">
      {functional === false ? (
        <ShieldAlert size={15} className="mt-0.5 shrink-0 text-status-warning" />
      ) : (
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-status-success" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{provider.displayName}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {provider.key} · v{provider.version}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              functional === false
                ? 'bg-status-warning/15 text-status-warning'
                : functional === true
                  ? 'bg-status-success/15 text-status-success'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {functional === false
              ? 'Registered, NOT functional'
              : functional === true
                ? 'Verified functional'
                : 'Not yet probed'}
          </span>
        </div>
        {provider.buildInfo && (
          <p className="mt-1 text-[11px] text-muted-foreground">Build: {provider.buildInfo}</p>
        )}
        {functional === false && probe?.error && (
          <p className="mt-1 border-l-2 border-status-warning/60 bg-status-warning/5 py-1 pl-2 text-[11px] text-status-warning">
            Real error from probing with{' '}
            <span className="font-mono">-algorithm {probe.probedWith}</span>: {probe.error}
          </p>
        )}
      </div>
    </div>
  )
}

export function AlgorithmExplorerPanel({
  isReady,
  runCommand,
}: {
  isReady: boolean
  runCommand: (cmd: string) => Promise<{ stdout: string }>
}) {
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [probes, setProbes] = useState<Record<string, ProviderProbeResult>>({})
  const [entries, setEntries] = useState<AlgorithmEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queried, setQueried] = useState(false)
  const [search, setSearch] = useState('')
  const [familyFilter, setFamilyFilter] = useState<string>('All')
  const [expanded, setExpanded] = useState<Set<AlgorithmFamily>>(new Set(FAMILY_ORDER))

  const handleQuery = async () => {
    setLoading(true)
    setError(null)
    try {
      const providersRaw = (await runCommand('list -providers -verbose')).stdout
      const parsedProviders = parseProviders(providersRaw)

      const pubKeyRaw = (await runCommand('list -public-key-algorithms')).stdout
      const keyManagerEntries = parseKeyManagersSection(pubKeyRaw)

      const flat: AlgorithmEntry[] = []
      for (const { flag, sourceList } of LIST_QUERIES) {
        const raw = (await runCommand(`list ${flag}`)).stdout
        flat.push(...parseFlatProvidedList(raw, sourceList), ...parseLegacySection(raw, sourceList))
      }

      const merged = dedupe([...keyManagerEntries, ...flat])
      setEntries(merged)
      setProviders(parsedProviders)

      const nextProbes: Record<string, ProviderProbeResult> = {}
      for (const p of parsedProviders) {
        if (p.key === 'default') {
          nextProbes[p.key] = {
            functional: true,
            probedWith: '(trusted — everything else here already depends on it)',
          }
          continue
        }
        const target = pickProbeTarget(merged, p.key)
        nextProbes[p.key] = target
          ? await probeProviderFunctional(runCommand, p.key, target)
          : {
              functional: false,
              error: "No probe target found among this provider's own registrations.",
            }
      }
      setProbes(nextProbes)
      setQueried(true)
      setExpanded(new Set(FAMILY_ORDER))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algorithm discovery failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleFamily = (f: AlgorithmFamily) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })

  const filtered = entries.filter((e) => {
    if (familyFilter !== 'All' && e.family !== familyFilter) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      return (
        e.name.toLowerCase().includes(q) ||
        e.aliases.some((a) => a.toLowerCase().includes(q)) ||
        e.provider.toLowerCase().includes(q)
      )
    }
    return true
  })

  const groups = FAMILY_ORDER.map((family) => ({
    family,
    entries: filtered.filter((e) => e.family === family),
  })).filter((g) => g.entries.length > 0)

  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="glass-panel p-4 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Database size={16} className="text-accent" />
                <h3 className="font-semibold text-foreground text-sm">Algorithm Explorer</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                openssl list -providers / -public-key-algorithms / -kem-algorithms / …
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuery}
              disabled={!isReady || loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-1.5">⟳</span>
                  Querying…
                </>
              ) : (
                <>
                  <Database size={13} className="mr-1.5" />
                  Query this build
                </>
              )}
            </Button>
          </div>

          {!isReady && (
            <p className="text-xs text-muted-foreground">
              Waiting for the OpenSSL WASM engine to initialize — click{' '}
              <strong>Query this build</strong> once it&apos;s ready.
            </p>
          )}
          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          {queried && providers.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Providers — self-reported vs. actually verified
              </p>
              {providers.map((p) => (
                <ProviderRow key={p.key} provider={p} probe={probes[p.key]} />
              ))}
            </div>
          )}

          {queried && entries.length > 0 && (
            <>
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
                    placeholder="Search algorithms…"
                    className="pl-7 h-8 text-xs"
                  />
                </div>
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {filtered.length}/{entries.length} algorithms
                </span>
              </div>

              <div className="space-y-2">
                {groups.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No algorithms match your filter.
                  </p>
                ) : (
                  groups.map(({ family, entries: familyEntries }) => (
                    <FamilyGroup
                      key={family}
                      family={family}
                      entries={familyEntries}
                      expanded={expanded.has(family)}
                      onToggle={() => toggleFamily(family)}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <GlossaryRail />
    </div>
  )
}

export default AlgorithmExplorerPanel
