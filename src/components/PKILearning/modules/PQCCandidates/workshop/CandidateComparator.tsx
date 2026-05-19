// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CANDIDATES } from '../data/candidates'
import { FAMILIES, type FamilyId } from '../data/families'

interface CandidateComparatorProps {
  initialCandidateId?: string
}

type SortKey = 'name' | 'family' | 'publicKey' | 'signature' | 'combined'
type SortDir = 'asc' | 'desc'

const USE_CASES = [
  {
    id: 'iot',
    label: 'IoT / firmware update',
    pickerHint: 'Minimise combined pk+sig — total wire bytes per signed update',
    score: (pk: number, sig: number) => pk + sig,
    lowerIsBetter: true,
  },
  {
    id: 'tls',
    label: 'TLS / web certificates',
    pickerHint: 'Minimise signature — handshake bandwidth budget',
    score: (_pk: number, sig: number) => sig,
    lowerIsBetter: true,
  },
  {
    id: 'long-lived',
    label: 'Long-lived offline keys',
    pickerHint: 'Minimise public key — small certs that travel everywhere',
    score: (pk: number) => pk,
    lowerIsBetter: true,
  },
  {
    id: 'archival',
    label: 'Archival / batch verification',
    pickerHint: 'Combined size matters less than verification cost — not yet modeled here',
    score: (pk: number, sig: number) => pk + sig,
    lowerIsBetter: true,
  },
]

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  stable: {
    label: 'Stable',
    tone: 'bg-status-success/15 text-status-success border-status-success/40',
  },
  shrunk: {
    label: 'Shrunk',
    tone: 'bg-status-warning/15 text-status-warning border-status-warning/40',
  },
  reparameterised: {
    label: 'Reparameterised',
    tone: 'bg-status-info/15 text-status-info border-status-info/40',
  },
  advancing: { label: 'Advancing', tone: 'bg-primary/15 text-primary border-primary/40' },
}

export const CandidateComparator: React.FC<CandidateComparatorProps> = ({ initialCandidateId }) => {
  const [sortKey, setSortKey] = useState<SortKey>('combined')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [familyFilter, setFamilyFilter] = useState<FamilyId | 'all'>('all')
  const [useCaseId, setUseCaseId] = useState<string>('iot')

  const useCase = USE_CASES.find((u) => u.id === useCaseId) ?? USE_CASES[0]

  const sorted = useMemo(() => {
    const rows = CANDIDATES.filter((c) => familyFilter === 'all' || c.family === familyFilter)
    const sgn = sortDir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return sgn * a.name.localeCompare(b.name)
        case 'family':
          return sgn * a.family.localeCompare(b.family)
        case 'publicKey':
          return sgn * (a.publicKeyBytes - b.publicKeyBytes)
        case 'signature':
          return sgn * (a.signatureBytes - b.signatureBytes)
        case 'combined':
        default:
          return sgn * (a.publicKeyBytes + a.signatureBytes - (b.publicKeyBytes + b.signatureBytes))
      }
    })
  }, [familyFilter, sortKey, sortDir])

  const winner = useMemo(() => {
    return CANDIDATES.reduce((best, c) => {
      const score = useCase.score(c.publicKeyBytes, c.signatureBytes)
      const bestScore = useCase.score(best.publicKeyBytes, best.signatureBytes)
      return useCase.lowerIsBetter ? (score < bestScore ? c : best) : score > bestScore ? c : best
    }, CANDIDATES[0])
  }, [useCase])

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(key)
      setSortDir(key === 'name' || key === 'family' ? 'asc' : 'asc')
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-panel p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
              Family filter
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={familyFilter === 'all' ? 'gradient' : 'outline'}
                onClick={() => setFamilyFilter('all')}
                className="text-xs"
              >
                All
              </Button>
              {Object.values(FAMILIES).map((f) => (
                <Button
                  key={f.id}
                  variant={familyFilter === f.id ? 'gradient' : 'outline'}
                  onClick={() => setFamilyFilter(f.id)}
                  className="text-xs"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
              Use case (highlights the winner)
            </div>
            <div className="flex flex-wrap gap-2">
              {USE_CASES.map((u) => (
                <Button
                  key={u.id}
                  variant={useCaseId === u.id ? 'gradient' : 'outline'}
                  onClick={() => setUseCaseId(u.id)}
                  className="text-xs"
                >
                  {u.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-md border border-border bg-card/40 p-3 flex items-center gap-2">
          <Trophy size={16} className="text-status-success shrink-0" />
          <span className="text-xs text-foreground">
            <strong>Winner for "{useCase.label}":</strong> {winner.name} —{' '}
            <span className="text-muted-foreground">{useCase.pickerHint}</span>
          </span>
        </div>
      </div>

      {/* Comparison table */}
      <div className="glass-panel p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card/60 border-b border-border">
              <tr>
                <SortHeader
                  label="Candidate"
                  active={sortKey === 'name'}
                  dir={sortDir}
                  onClick={() => toggleSort('name')}
                />
                <SortHeader
                  label="Family"
                  active={sortKey === 'family'}
                  dir={sortDir}
                  onClick={() => toggleSort('family')}
                />
                <SortHeader
                  label="Public key (B)"
                  active={sortKey === 'publicKey'}
                  dir={sortDir}
                  onClick={() => toggleSort('publicKey')}
                  align="right"
                />
                <SortHeader
                  label="Signature (B)"
                  active={sortKey === 'signature'}
                  dir={sortDir}
                  onClick={() => toggleSort('signature')}
                  align="right"
                />
                <SortHeader
                  label="Combined (B)"
                  active={sortKey === 'combined'}
                  dir={sortDir}
                  onClick={() => toggleSort('combined')}
                  align="right"
                />
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Ref
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const fam = FAMILIES[c.family]
                const isWinner = c.id === winner.id
                const isInitial = c.id === initialCandidateId
                const status = STATUS_LABEL[c.status]
                return (
                  <tr
                    key={c.id}
                    className={`border-b border-border/50 ${
                      isWinner
                        ? 'bg-status-success/10'
                        : isInitial
                          ? 'bg-primary/5'
                          : 'hover:bg-card/40'
                    }`}
                  >
                    <td className="px-3 py-2 font-semibold text-foreground">
                      {isWinner && <Trophy size={12} className="inline mr-1 text-status-success" />}
                      {c.name}
                    </td>
                    <td className={`px-3 py-2 ${fam.colorClass}`}>{fam.label}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-foreground/80">
                      {c.publicKeyBytes.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-foreground/80">
                      {c.signatureBytes.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs font-bold text-foreground">
                      {(c.publicKeyBytes + c.signatureBytes).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${status?.tone ?? ''}`}
                      >
                        {status?.label ?? c.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <a
                        href={c.referenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Spec <ExternalLink size={11} />
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-candidate caveats — expanded for the winner */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-base font-bold text-foreground">Why this winner?</h3>
        <p className="text-sm text-muted-foreground italic">{winner.whyAdvanced}</p>
        <div className="rounded-md border border-status-warning/30 bg-status-warning/5 p-3">
          <div className="text-[10px] uppercase tracking-wider text-status-warning font-bold mb-1">
            Caveats
          </div>
          <p className="text-xs text-foreground/85 leading-relaxed">{winner.caveats}</p>
        </div>
      </div>
    </div>
  )
}

const SortHeader: React.FC<{
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  align?: 'left' | 'right'
}> = ({ label, active, dir, onClick, align = 'left' }) => (
  <th
    className={`px-3 py-2 ${align === 'right' ? 'text-right' : 'text-left'} text-[10px] uppercase tracking-wider font-bold`}
  >
    <Button
      variant="ghost"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-0 py-0 h-auto text-[10px] uppercase tracking-wider font-bold ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {label}
      {active && (dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
    </Button>
  </th>
)
