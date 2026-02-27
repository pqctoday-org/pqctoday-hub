import React, { useState, useMemo } from 'react'
import { Globe, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { ExportableArtifact } from '../../../common/executive'
import type { ComplianceFramework } from '@/data/complianceData'
import type { CountryData } from '@/data/timelineData'

interface JurisdictionConfig {
  id: string
  label: string
  region: string
  countryNames: string[]
}

const JURISDICTIONS: JurisdictionConfig[] = [
  { id: 'us', label: 'United States', region: 'North America', countryNames: ['United States'] },
  { id: 'eu', label: 'European Union', region: 'Europe', countryNames: ['European Union'] },
  { id: 'uk', label: 'United Kingdom', region: 'Europe', countryNames: ['United Kingdom'] },
  { id: 'fr', label: 'France', region: 'Europe', countryNames: ['France'] },
  { id: 'de', label: 'Germany', region: 'Europe', countryNames: ['Germany'] },
  { id: 'jp', label: 'Japan', region: 'Asia Pacific', countryNames: ['Japan'] },
  { id: 'kr', label: 'South Korea', region: 'Asia Pacific', countryNames: ['South Korea'] },
  { id: 'au', label: 'Australia', region: 'Asia Pacific', countryNames: ['Australia'] },
  { id: 'sg', label: 'Singapore', region: 'Asia Pacific', countryNames: ['Singapore'] },
  { id: 'ca', label: 'Canada', region: 'North America', countryNames: ['Canada'] },
]

function getEarliestDeadline(country: CountryData): number | null {
  let earliest: number | null = null
  for (const body of country.bodies) {
    for (const event of body.events) {
      if (event.phase === 'Regulation' || event.phase === 'Deadline') {
        if (!earliest || event.endYear < earliest) {
          earliest = event.endYear
        }
      }
    }
  }
  return earliest
}

function getDeadlineYear(framework: ComplianceFramework): number | null {
  const match = framework.deadline.match(/(\d{4})/)
  return match ? parseInt(match[1]) : null
}

function getDeadlineStatus(year: number | null): { label: string; color: string } {
  if (!year) return { label: 'TBD', color: 'text-muted-foreground' }
  const now = new Date().getFullYear()
  if (year <= now) return { label: 'Active', color: 'text-status-error' }
  if (year <= now + 2) return { label: 'Imminent', color: 'text-status-warning' }
  return { label: 'Upcoming', color: 'text-status-success' }
}

interface ConflictItem {
  description: string
  jurisdictions: string[]
  severity: 'high' | 'medium' | 'low'
}

function detectConflicts(
  selectedIds: string[],
  _frameworkMap: Map<string, ComplianceFramework[]>,
  countryDeadlineMap: Map<string, number | null>
): ConflictItem[] {
  const conflicts: ConflictItem[] = []
  if (selectedIds.length < 2) return conflicts

  // Check for deadline divergence
  const deadlines: { id: string; year: number | null }[] = []
  for (const id of selectedIds) {
    const jur = JURISDICTIONS.find((j) => j.id === id)
    if (!jur) continue
    const year = countryDeadlineMap.get(id) ?? null
    deadlines.push({ id, year })
  }

  const withDates = deadlines.filter((d) => d.year !== null)
  if (withDates.length >= 2) {
    const years = withDates.map((d) => d.year as number)
    const minYear = Math.min(...years)
    const maxYear = Math.max(...years)
    if (maxYear - minYear > 3) {
      const earliest = withDates.find((d) => d.year === minYear)
      const latest = withDates.find((d) => d.year === maxYear)
      const earliestLabel = JURISDICTIONS.find((j) => j.id === earliest?.id)?.label ?? ''
      const latestLabel = JURISDICTIONS.find((j) => j.id === latest?.id)?.label ?? ''
      conflicts.push({
        description: `${earliestLabel} (${minYear}) has a deadline ${maxYear - minYear} years earlier than ${latestLabel} (${maxYear}). Your migration must meet the earliest deadline.`,
        jurisdictions: [earliestLabel, latestLabel],
        severity: 'high',
      })
    }
  }

  // Check for framework coverage divergence
  const hasUS = selectedIds.includes('us')
  const hasEU =
    selectedIds.includes('eu') ||
    selectedIds.includes('fr') ||
    selectedIds.includes('de') ||
    selectedIds.includes('uk')

  if (hasUS && hasEU) {
    conflicts.push({
      description:
        'CNSA 2.0 requires ML-KEM-1024 and ML-DSA-87 minimum security levels for U.S. NSS. ANSSI/BSI recommend a hybrid classical+PQC approach during transition. These requirements are compatible: deploy hybrid mode at CNSA 2.0 minimum security levels to satisfy both.',
      jurisdictions: ['United States', 'EU/ANSSI/BSI'],
      severity: 'medium',
    })
  }

  // Check for algorithm preference differences
  const frOrDe = selectedIds.includes('fr') || selectedIds.includes('de')
  if (hasUS && frOrDe) {
    conflicts.push({
      description:
        'ANSSI (France) and BSI (Germany) emphasize hybrid mode as mandatory during transition, while NSA CNSA 2.0 focuses on pure PQC adoption. Plan for hybrid deployments that satisfy both.',
      jurisdictions: ['United States', 'France/Germany'],
      severity: 'low',
    })
  }

  return conflicts
}

export const JurisdictionMapper: React.FC = () => {
  const { frameworks, countryDeadlines } = useExecutiveModuleData()
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([])

  const toggleJurisdiction = (id: string) => {
    setSelectedJurisdictions((prev) =>
      prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]
    )
  }

  // Map each jurisdiction ID to matching compliance frameworks
  const frameworkMap = useMemo(() => {
    const map = new Map<string, ComplianceFramework[]>()
    for (const jur of JURISDICTIONS) {
      const matching = frameworks.filter((f) =>
        f.countries.some((c) =>
          jur.countryNames.some(
            (cn) =>
              c.toLowerCase().includes(cn.toLowerCase()) ||
              cn.toLowerCase().includes(c.toLowerCase())
          )
        )
      )
      map.set(jur.id, matching)
    }
    return map
  }, [frameworks])

  // Map each jurisdiction ID to its earliest country deadline
  const countryDeadlineMap = useMemo(() => {
    const map = new Map<string, number | null>()
    for (const jur of JURISDICTIONS) {
      let earliest: number | null = null
      for (const cn of jur.countryNames) {
        const countryData = countryDeadlines.find(
          (c) => c.countryName.toLowerCase() === cn.toLowerCase()
        )
        if (countryData) {
          const d = getEarliestDeadline(countryData)
          if (d && (!earliest || d < earliest)) earliest = d
        }
      }
      map.set(jur.id, earliest)
    }
    return map
  }, [countryDeadlines])

  const conflicts = useMemo(
    () => detectConflicts(selectedJurisdictions, frameworkMap, countryDeadlineMap),
    [selectedJurisdictions, frameworkMap, countryDeadlineMap]
  )

  // All frameworks across selected jurisdictions (deduplicated)
  const selectedFrameworks = useMemo(() => {
    const seen = new Set<string>()
    const result: (ComplianceFramework & { jurisdictionLabels: string[] })[] = []
    for (const id of selectedJurisdictions) {
      const jurLabel = JURISDICTIONS.find((j) => j.id === id)?.label ?? id
      const fws = frameworkMap.get(id) ?? []
      for (const fw of fws) {
        if (seen.has(fw.id)) {
          const existing = result.find((r) => r.id === fw.id)
          if (existing && !existing.jurisdictionLabels.includes(jurLabel)) {
            existing.jurisdictionLabels.push(jurLabel)
          }
        } else {
          seen.add(fw.id)
          result.push({ ...fw, jurisdictionLabels: [jurLabel] })
        }
      }
    }
    return result.sort((a, b) => {
      const aYear = getDeadlineYear(a)
      const bYear = getDeadlineYear(b)
      if (aYear && bYear) return aYear - bYear
      if (aYear) return -1
      if (bYear) return 1
      return 0
    })
  }, [selectedJurisdictions, frameworkMap])

  const exportMarkdown = useMemo(() => {
    let md = '# Jurisdiction Compliance Map\n\n'
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`
    md += `## Selected Jurisdictions\n\n`
    for (const id of selectedJurisdictions) {
      const jur = JURISDICTIONS.find((j) => j.id === id)
      const deadline = countryDeadlineMap.get(id)
      md += `- **${jur?.label}** — Earliest deadline: ${deadline ?? 'TBD'}\n`
    }
    md += '\n## Applicable Frameworks\n\n'
    md += '| Framework | Jurisdictions | Deadline | PQC Required |\n'
    md += '|-----------|--------------|----------|-------------|\n'
    for (const fw of selectedFrameworks) {
      md += `| ${fw.label} | ${fw.jurisdictionLabels.join(', ')} | ${fw.deadline} | ${fw.requiresPQC ? 'Yes' : 'No'} |\n`
    }
    if (conflicts.length > 0) {
      md += '\n## Conflicts & Overlaps\n\n'
      for (const c of conflicts) {
        md += `- **[${c.severity.toUpperCase()}]** ${c.description}\n`
      }
    }
    return md
  }, [selectedJurisdictions, selectedFrameworks, conflicts, countryDeadlineMap])

  const regions = useMemo(() => {
    const regionMap = new Map<string, JurisdictionConfig[]>()
    for (const jur of JURISDICTIONS) {
      const list = regionMap.get(jur.region) ?? []
      list.push(jur)
      regionMap.set(jur.region, list)
    }
    return regionMap
  }, [])

  return (
    <div className="space-y-6">
      {/* Jurisdiction Picker */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Select Your Operating Jurisdictions
        </h3>
        <p className="text-sm text-muted-foreground">
          Check each jurisdiction where your organization operates or must comply with regulations.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from(regions.entries()).map(([region, jurs]) => (
            <div key={region} className="space-y-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {region}
              </div>
              {jurs.map((jur) => {
                const isSelected = selectedJurisdictions.includes(jur.id)
                const fwCount = frameworkMap.get(jur.id)?.length ?? 0
                return (
                  <label
                    key={jur.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleJurisdiction(jur.id)}
                      className="rounded border-input"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{jur.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {fwCount} framework{fwCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {countryDeadlineMap.get(jur.id) && (
                      <span className="text-xs font-mono text-primary">
                        {countryDeadlineMap.get(jur.id)}
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Conflicts / Overlaps */}
      {conflicts.length > 0 && (
        <div className="glass-panel p-5 border-status-warning/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-status-warning" />
            <h3 className="text-lg font-semibold text-foreground">Conflicts &amp; Overlaps</h3>
          </div>
          <div className="space-y-3">
            {conflicts.map((conflict, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  conflict.severity === 'high'
                    ? 'border-status-error/30 bg-status-error/5'
                    : conflict.severity === 'medium'
                      ? 'border-status-warning/30 bg-status-warning/5'
                      : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      conflict.severity === 'high'
                        ? 'bg-status-error/20 text-status-error'
                        : conflict.severity === 'medium'
                          ? 'bg-status-warning/20 text-status-warning'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {conflict.severity}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {conflict.jurisdictions.join(' / ')}
                  </span>
                </div>
                <p className="text-sm text-foreground/80">{conflict.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Framework Deadline Table */}
      {selectedJurisdictions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            Applicable Frameworks &amp; Deadlines
          </h3>
          {selectedFrameworks.length === 0 ? (
            <div className="glass-panel p-6 text-center">
              <Globe size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No matching frameworks found for the selected jurisdictions. This may mean
                country-specific compliance data is not yet available.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground">
                      Framework
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground">
                      Jurisdictions
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground">
                      Deadline
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground">
                      PQC Required
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedFrameworks.map((fw) => {
                    const deadlineYear = getDeadlineYear(fw)
                    const status = getDeadlineStatus(deadlineYear)
                    return (
                      <tr key={fw.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-3">
                          <div className="font-medium text-foreground">{fw.label}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {fw.description}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {fw.jurisdictionLabels.join(', ')}
                        </td>
                        <td className="py-2 px-3 font-mono text-foreground">
                          {fw.deadline || 'TBD'}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-xs font-medium ${status.color}`}>
                            {deadlineYear ? (
                              <span className="flex items-center gap-1">
                                {status.label === 'Active' && <CheckCircle2 size={12} />}
                                {status.label === 'Imminent' && <Clock size={12} />}
                                {status.label}
                              </span>
                            ) : (
                              status.label
                            )}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-xs font-medium ${fw.requiresPQC ? 'text-status-error' : 'text-muted-foreground'}`}
                          >
                            {fw.requiresPQC ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Export */}
      {selectedJurisdictions.length > 0 && (
        <ExportableArtifact
          title="Jurisdiction Map Export"
          exportData={exportMarkdown}
          filename="jurisdiction-compliance-map"
          formats={['markdown', 'csv']}
        >
          <p className="text-sm text-muted-foreground">
            Export your jurisdiction compliance map with {selectedFrameworks.length} applicable
            frameworks across {selectedJurisdictions.length} jurisdictions.
          </p>
        </ExportableArtifact>
      )}
    </div>
  )
}
