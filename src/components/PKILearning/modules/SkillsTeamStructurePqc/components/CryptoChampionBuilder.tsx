// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import { Award, AlertTriangle } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { ExportableArtifact } from '../../../common/executive'
import { Button } from '@/components/ui/button'
import { CHAMPION_PLATFORMS, type ChampionPlatform } from '../data/teamModel'

/** Whether a champion has completed each of the four readiness commitments
 *  (p. 164): foundations training, quarterly briefings, design-review sign-off,
 *  and shepherding library upgrades. */
interface ChampionRow {
  /** Named individual (free text). */
  name: string
  trained: boolean
  briefings: boolean
  signOff: boolean
  upgrades: boolean
}

function emptyRow(): ChampionRow {
  return { name: '', trained: false, briefings: false, signOff: false, upgrades: false }
}

const COMMITMENTS: { key: keyof Omit<ChampionRow, 'name'>; label: string; help: string }[] = [
  { key: 'trained', label: 'Foundations', help: 'Attended PQC foundations training' },
  { key: 'briefings', label: 'Briefings', help: 'Joins quarterly crypto-agility briefings' },
  { key: 'signOff', label: 'Sign-off', help: 'Signs off on crypto readiness in design reviews' },
  { key: 'upgrades', label: 'Upgrades', help: 'Shepherds PQC library upgrades in their domain' },
]

export const CryptoChampionBuilder: React.FC = () => {
  const [rows, setRows] = useState<Record<ChampionPlatform, ChampionRow>>(() => {
    const acc = {} as Record<ChampionPlatform, ChampionRow>
    for (const p of CHAMPION_PLATFORMS) acc[p] = emptyRow()
    return acc
  })
  const { addExecutiveDocument } = useModuleStore()

  const setName = useCallback((platform: ChampionPlatform, name: string) => {
    setRows((prev) => ({ ...prev, [platform]: { ...prev[platform], name } }))
  }, [])

  const toggle = useCallback((platform: ChampionPlatform, key: keyof Omit<ChampionRow, 'name'>) => {
    setRows((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], [key]: !prev[platform][key] },
    }))
  }, [])

  const unstaffed = useMemo(() => CHAMPION_PLATFORMS.filter((p) => !rows[p].name.trim()), [rows])

  const incompleteReadiness = useMemo(
    () =>
      CHAMPION_PLATFORMS.filter((p) => {
        const r = rows[p]
        return r.name.trim() && !(r.trained && r.briefings && r.signOff && r.upgrades)
      }),
    [rows]
  )

  const exportMarkdown = useMemo(() => {
    let md = '# Crypto Champion Program Roster\n\n'
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`
    md += '| Platform | Champion | Foundations | Briefings | Sign-off | Upgrades |\n'
    md += '|----------|----------|-------------|-----------|----------|----------|\n'
    for (const p of CHAMPION_PLATFORMS) {
      const r = rows[p]
      const mark = (b: boolean) => (b ? '✓' : '—')
      md += `| ${p} | ${r.name.trim() || '_(unassigned)_'} | ${mark(r.trained)} | ${mark(r.briefings)} | ${mark(r.signOff)} | ${mark(r.upgrades)} |\n`
    }
    md +=
      '\nEach platform/application team designates one crypto champion who liaises between the PQC program and their team, signs off on crypto readiness in design reviews, and shepherds PQC library upgrades (Applied Quantum PQC Migration Framework, p. 164).\n'
    return md
  }, [rows])

  const handleExport = useCallback(() => {
    addExecutiveDocument({
      id: `champions-${Date.now()}`,
      moduleId: 'skills-team-structure',
      type: 'skills-team-plan',
      title: 'Crypto Champion Program Roster',
      data: exportMarkdown,
      createdAt: Date.now(),
    })
  }, [addExecutiveDocument, exportMarkdown])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Designate one crypto champion per platform or application team, and track the four readiness
        commitments each champion takes on. A platform with no named champion is a program gap.
      </p>

      {/* Roster table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 border-b border-border text-foreground font-semibold min-w-[110px]">
                Platform
              </th>
              <th className="text-left p-2 border-b border-border text-foreground font-semibold min-w-[160px]">
                Champion
              </th>
              {COMMITMENTS.map((c) => (
                <th
                  key={c.key}
                  className="text-center p-2 border-b border-border text-foreground font-semibold min-w-[90px]"
                  title={c.help}
                >
                  <span className="text-xs">{c.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CHAMPION_PLATFORMS.map((platform) => {
              const r = rows[platform]
              return (
                <tr key={platform} className="hover:bg-muted/30 transition-colors">
                  <td className="p-2 border-b border-border text-foreground font-medium text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <Award size={14} className="text-secondary" />
                      {platform}
                    </span>
                  </td>
                  <td className="p-2 border-b border-border">
                    <input
                      type="text"
                      value={r.name}
                      onChange={(e) => setName(platform, e.target.value)}
                      placeholder="Named individual"
                      aria-label={`${platform} crypto champion name`}
                      className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </td>
                  {COMMITMENTS.map((c) => {
                    const checked = r[c.key]
                    return (
                      <td key={c.key} className="p-1 border-b border-border text-center">
                        <Button
                          variant="ghost"
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          aria-label={`${platform} — ${c.help}`}
                          onClick={() => toggle(platform, c.key)}
                          className={`w-full text-center text-xs font-bold rounded border px-1 py-1.5 min-h-[32px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
                            checked
                              ? 'bg-success/20 text-success border-success/40'
                              : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          {checked ? '✓' : '—'}
                        </Button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Validation */}
      {unstaffed.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-sm">
          <AlertTriangle size={16} className="text-status-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Unstaffed platforms</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              A platform with no named champion is a program risk. Missing: {unstaffed.join(', ')}.
            </p>
          </div>
        </div>
      )}
      {incompleteReadiness.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30 text-sm">
          <AlertTriangle size={16} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Incomplete champion readiness</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              These champions have not yet met all four commitments (foundations, briefings,
              sign-off, upgrades): {incompleteReadiness.join(', ')}.
            </p>
          </div>
        </div>
      )}

      {/* Export */}
      <ExportableArtifact
        title="Crypto Champion Roster Export"
        exportData={exportMarkdown}
        filename="pqc-crypto-champion-roster"
        formats={['markdown', 'pdf']}
        onExport={handleExport}
        wideTable
      >
        <p className="text-sm text-muted-foreground">Export your champion roster as Markdown.</p>
      </ExportableArtifact>
    </div>
  )
}
