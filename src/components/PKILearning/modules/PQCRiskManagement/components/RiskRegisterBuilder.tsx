// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useMemo } from 'react'
import { Plus, Trash2, Copy, Check, FileType2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CompleteStepAction } from '../../../common/CompleteStepAction'
import { useModuleStore } from '@/store/useModuleStore'
import { markdownToPdf } from '@/services/export/pdfExport'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { copyToClipboard } from '@/utils/clipboard'
// Single source of truth for the illustrative demo entries (shared with the
// store + standalone adapter) so the two can't drift.
import { DEFAULT_RISK_ENTRIES, useRiskRegisterStore } from '@/store/useRiskRegisterStore'
import { EducationalGuide } from './RiskHeatmapGenerator'

interface RiskEntry {
  id: string
  assetName: string
  currentAlgorithm: string
  threatVector: string
  likelihood: number
  impact: number
  mitigation: string
}

interface RiskRegisterBuilderProps {
  riskEntries: RiskEntry[]
  onRiskEntriesChange: (entries: RiskEntry[]) => void
  /** Show the "example entries" banner when the register is still the seeded
   *  illustrative defaults. Default true; set false when a wrapper (e.g. the
   *  BusinessCenter standalone adapter) already renders its own banner. */
  showExampleBanner?: boolean
  /** CRQC arrival year set in Step 1 (CRQCScenarioPlanner). When provided,
   *  a context banner is shown at the top of the register. */
  scenarioCrqcYear?: number | null
}

const THREAT_VECTORS = [
  { value: 'hndl', label: 'Harvest Now, Decrypt Later (HNDL)' },
  { value: 'shor', label: 'Shor\u2019s Algorithm (Key Exchange/Signing)' },
  { value: 'grover', label: 'Grover\u2019s Algorithm (Symmetric Weakening)' },
  { value: 'forgery', label: 'Signature Forgery (Code Signing / Certs)' },
  { value: 'impersonation', label: 'Identity Impersonation (TLS / Auth)' },
  { value: 'supply-chain', label: 'Supply Chain Attack (Firmware / Updates)' },
]

const ALGORITHM_OPTIONS = [
  'RSA-2048',
  'RSA-3072',
  'RSA-4096',
  'ECDSA P-256',
  'ECDSA P-384',
  'ECDH / X25519',
  'DH-2048',
  'AES-128',
  'AES-256',
  'SHA-256',
  'SHA-384',
  '3DES',
  'Other',
]

function getRiskLevel(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 20)
    return { label: 'Critical', color: 'text-status-error', bgColor: 'bg-status-error/10' }
  if (score >= 12)
    return { label: 'High', color: 'text-status-warning', bgColor: 'bg-status-warning/10' }
  if (score >= 6) return { label: 'Medium', color: 'text-primary', bgColor: 'bg-primary/10' }
  return { label: 'Low', color: 'text-status-success', bgColor: 'bg-status-success/10' }
}

/** Extracted (07192026, Batch 2) so the simulation's real-tool doc generator
 *  renders THIS logic — the component's export memo delegates here, so the
 *  two can never drift. Entries type comes from the shared store. */
export function buildRiskRegisterMarkdown(
  riskEntries: Pick<
    RiskEntry,
    'assetName' | 'currentAlgorithm' | 'threatVector' | 'likelihood' | 'impact' | 'mitigation'
  >[]
): string {
  let md = '# Quantum Risk Register\n\n'
  md += `Generated: ${new Date().toLocaleDateString()}\n\n`
  md += '---\n\n'
  md += '| # | Asset | Algorithm | Threat Vector | L | I | Score | Level | Mitigation |\n'
  md += '|---|-------|-----------|---------------|---|---|-------|-------|------------|\n'

  riskEntries.forEach((entry, idx) => {
    const score = entry.likelihood * entry.impact
    const level = getRiskLevel(score)
    const threat =
      THREAT_VECTORS.find((t) => t.value === entry.threatVector)?.label ?? entry.threatVector
    md += `| ${idx + 1} | ${entry.assetName || 'Unnamed'} | ${entry.currentAlgorithm} | ${threat} | ${entry.likelihood} | ${entry.impact} | ${score} | ${level.label} | ${entry.mitigation || 'None specified'} |\n`
  })

  md += '\n\n## Risk Summary\n\n'
  const critical = riskEntries.filter((e) => e.likelihood * e.impact >= 20).length
  const high = riskEntries.filter(
    (e) => e.likelihood * e.impact >= 12 && e.likelihood * e.impact < 20
  ).length
  const medium = riskEntries.filter(
    (e) => e.likelihood * e.impact >= 6 && e.likelihood * e.impact < 12
  ).length
  const low = riskEntries.filter((e) => e.likelihood * e.impact < 6).length

  md += `- **Critical:** ${critical}\n`
  md += `- **High:** ${high}\n`
  md += `- **Medium:** ${medium}\n`
  md += `- **Low:** ${low}\n`
  md += `- **Total Entries:** ${riskEntries.length}\n`

  md += '\n---\n\n'
  md +=
    '*Aligned to NIST CSWP 39 §5 (Strategic Plan) and §6.5 (Maturity Assessment for Crypto Agility). https://doi.org/10.6028/NIST.CSWP.39-upd1*\n'

  return md
}

export const RiskRegisterBuilder: React.FC<RiskRegisterBuilderProps> = ({
  riskEntries,
  onRiskEntriesChange,
  showExampleBanner = true,
  scenarioCrqcYear,
}) => {
  const [copied, setCopied] = React.useState(false)
  const [guideOpen, setGuideOpen] = React.useState(false)
  // Persisted (not local useState) so the indicator doesn't falsely flip back
  // to "unsaved" on remount while the underlying register is still intact.
  const lastSavedKey = useRiskRegisterStore((s) => s.lastSavedKey)
  const setLastSavedKey = useRiskRegisterStore((s) => s.setLastSavedKey)
  const wasSaved = lastSavedKey !== null
  const { addExecutiveDocument } = useModuleStore()

  // Initialize with the illustrative demo entries if empty (labelled as examples
  // by the standalone adapter's banner so they aren't mistaken for real data).
  React.useEffect(() => {
    if (riskEntries.length === 0) {
      onRiskEntriesChange(DEFAULT_RISK_ENTRIES)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addEntry = useCallback(() => {
    const newEntry: RiskEntry = {
      id: `entry-${Date.now()}`,
      assetName: '',
      currentAlgorithm: 'RSA-2048',
      threatVector: 'hndl',
      likelihood: 3,
      impact: 3,
      mitigation: '',
    }
    onRiskEntriesChange([...riskEntries, newEntry])
  }, [riskEntries, onRiskEntriesChange])

  const removeEntry = useCallback(
    (id: string) => {
      onRiskEntriesChange(riskEntries.filter((e) => e.id !== id))
    },
    [riskEntries, onRiskEntriesChange]
  )

  const updateEntry = useCallback(
    (id: string, field: keyof RiskEntry, value: string | number) => {
      onRiskEntriesChange(riskEntries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
    },
    [riskEntries, onRiskEntriesChange]
  )

  const exportMarkdown = useMemo(() => buildRiskRegisterMarkdown(riskEntries), [riskEntries])

  const editedSince = wasSaved && lastSavedKey !== null && exportMarkdown !== lastSavedKey

  const handleExport = useCallback(() => {
    if (lastSavedKey !== null && exportMarkdown === lastSavedKey) return
    addExecutiveDocument({
      id: `risk-register-${Date.now()}`,
      type: 'risk-register',
      title: 'Quantum Risk Register',
      data: exportMarkdown,
      createdAt: Date.now(),
      moduleId: 'pqc-risk-management',
    })
    setLastSavedKey(exportMarkdown)
  }, [exportMarkdown, addExecutiveDocument, lastSavedKey, setLastSavedKey])

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(exportMarkdown)
    if (!ok) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [exportMarkdown])

  const handleDownloadPdf = useCallback(async () => {
    await markdownToPdf(exportMarkdown, 'quantum-risk-register', 'Quantum Risk Register', {
      wideTable: true,
    })
  }, [exportMarkdown])

  const showingExamples =
    riskEntries.length > 0 && riskEntries.every((e) => e.id.startsWith('default-'))

  return (
    <div className="space-y-6">
      {typeof scenarioCrqcYear === 'number' && (
        <div className="glass-panel p-3 border-l-4 border-primary/50">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              CRQC modelled to arrive {scenarioCrqcYear}
            </span>{' '}
            — assets with data lifetime extending past this year are high-urgency. Consider
            assigning likelihood: 5 and impact: 5 to those entries.
          </p>
        </div>
      )}
      {showExampleBanner && showingExamples && (
        <div className="rounded-lg border border-status-warning/30 bg-status-warning/5 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Example entries</span> — illustrative
          placeholders, not your data. Edit or replace them to build your own register.
        </div>
      )}
      <EducationalGuide
        open={guideOpen}
        onToggle={() => setGuideOpen(!guideOpen)}
        variant="register"
      />
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={addEntry}>
          <Plus size={14} />
          <span className="ml-1.5">Add Risk Entry</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span className="ml-1.5">{copied ? 'Copied' : 'Copy Markdown'}</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
          <FileType2 size={14} />
          <span className="ml-1.5">.pdf</span>
        </Button>
        <CompleteStepAction
          recordsArtifact
          saved={wasSaved}
          editedSinceSave={editedSince}
          onClick={handleExport}
        />
        <span className="text-xs text-muted-foreground ml-auto">
          {riskEntries.length} {riskEntries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Risk entries */}
      <div className="space-y-4">
        {riskEntries.map((entry, idx) => {
          const score = entry.likelihood * entry.impact
          const risk = getRiskLevel(score)
          return (
            <div key={entry.id} className="glass-panel p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${risk.color} ${risk.bgColor}`}
                  >
                    Score: {score} ({risk.label})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => removeEntry(entry.id)}
                  className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-status-error transition-colors"
                  title="Remove entry"
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Asset Name */}
                <div>
                  <label
                    htmlFor={`asset-name-${entry.id}`}
                    className="block text-xs font-medium text-muted-foreground mb-1"
                  >
                    Asset Name
                  </label>
                  <input
                    id={`asset-name-${entry.id}`}
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    placeholder="e.g., TLS Certificates, VPN Gateway"
                    value={entry.assetName}
                    onChange={(e) => updateEntry(entry.id, 'assetName', e.target.value)}
                  />
                </div>

                {/* Current Algorithm */}
                <div>
                  <span className="block text-xs font-medium text-muted-foreground mb-1">
                    Current Algorithm
                  </span>
                  <FilterDropdown
                    noContainer
                    selectedId={entry.currentAlgorithm}
                    onSelect={(id) => updateEntry(entry.id, 'currentAlgorithm', id)}
                    items={ALGORITHM_OPTIONS.map((algo) => ({ id: algo, label: algo }))}
                  />
                </div>

                {/* Threat Vector */}
                <div>
                  <span className="block text-xs font-medium text-muted-foreground mb-1">
                    Threat Vector
                  </span>
                  <FilterDropdown
                    noContainer
                    selectedId={entry.threatVector}
                    onSelect={(id) => updateEntry(entry.id, 'threatVector', id)}
                    items={THREAT_VECTORS.map((tv) => ({ id: tv.value, label: tv.label }))}
                  />
                </div>

                {/* Likelihood & Impact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs font-medium text-muted-foreground mb-1">
                      Likelihood (1-5)
                    </span>
                    <FilterDropdown
                      noContainer
                      selectedId={String(entry.likelihood)}
                      onSelect={(id) => updateEntry(entry.id, 'likelihood', Number(id))}
                      items={[
                        { id: '1', label: '1 \u2014 Rare' },
                        { id: '2', label: '2 \u2014 Unlikely' },
                        { id: '3', label: '3 \u2014 Possible' },
                        { id: '4', label: '4 \u2014 Likely' },
                        { id: '5', label: '5 \u2014 Almost Certain' },
                      ]}
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-muted-foreground mb-1">
                      Impact (1-5)
                    </span>
                    <FilterDropdown
                      noContainer
                      selectedId={String(entry.impact)}
                      onSelect={(id) => updateEntry(entry.id, 'impact', Number(id))}
                      items={[
                        { id: '1', label: '1 \u2014 Negligible' },
                        { id: '2', label: '2 \u2014 Minor' },
                        { id: '3', label: '3 \u2014 Moderate' },
                        { id: '4', label: '4 \u2014 Major' },
                        { id: '5', label: '5 \u2014 Catastrophic' },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Mitigation Strategy */}
              <div>
                <label
                  htmlFor={`mitigation-${entry.id}`}
                  className="block text-xs font-medium text-muted-foreground mb-1"
                >
                  Mitigation Strategy
                </label>
                <textarea
                  id={`mitigation-${entry.id}`}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[60px] resize-y text-sm"
                  placeholder="Describe the recommended PQC migration or mitigation approach..."
                  value={entry.mitigation}
                  onChange={(e) => updateEntry(entry.id, 'mitigation', e.target.value)}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      {riskEntries.length > 0 && (
        <div className="glass-panel p-6">
          <h3 className="text-base font-semibold text-foreground mb-3">Risk Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Critical',
                count: riskEntries.filter((e) => e.likelihood * e.impact >= 20).length,
                color: 'text-status-error',
                bg: 'bg-status-error/10',
              },
              {
                label: 'High',
                count: riskEntries.filter(
                  (e) => e.likelihood * e.impact >= 12 && e.likelihood * e.impact < 20
                ).length,
                color: 'text-status-warning',
                bg: 'bg-status-warning/10',
              },
              {
                label: 'Medium',
                count: riskEntries.filter(
                  (e) => e.likelihood * e.impact >= 6 && e.likelihood * e.impact < 12
                ).length,
                color: 'text-primary',
                bg: 'bg-primary/10',
              },
              {
                label: 'Low',
                count: riskEntries.filter((e) => e.likelihood * e.impact < 6).length,
                color: 'text-status-success',
                bg: 'bg-status-success/10',
              },
            ].map((cat) => (
              <div key={cat.label} className={`rounded-lg p-3 ${cat.bg} text-center`}>
                <div className={`text-2xl font-bold ${cat.color}`}>{cat.count}</div>
                <div className="text-xs text-muted-foreground">{cat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
