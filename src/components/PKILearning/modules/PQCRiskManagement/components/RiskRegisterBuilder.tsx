// SPDX-License-Identifier: AGPL-3.0-only
import { ScenarioComparison } from '@/components/PKILearning/common/executive/ScenarioComparison'
import { decisionModelToCsv } from '@/services/export/decisionModelCsv'
import { downloadCsv } from '@/utils/csvExport'
import { withEducationNoticeCsv } from '@/data/educationNotice'
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
import {
  DEFAULT_RISK_ENTRIES,
  isUnownedRiskEntry,
  useRiskRegisterStore,
  type RiskEntry,
} from '@/store/useRiskRegisterStore'
import { scopedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { EducationalGuide } from './RiskHeatmapGenerator'

/** Scope stamp on saved `inputs`: the PQC GRC Exception Register also saves
 *  as `risk-register`, so restores must not pick up its shape. */
export const RISK_REGISTER_INPUT_SCOPE = 'risk-register-builder'
export interface SavedRiskRegisterInputs {
  entries?: RiskEntry[]
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

const WORKSHEET_SCOPE =
  'Record an asset, algorithm, threat, likelihood, impact, proposed mitigation, an owner role and a next review date. An entry without an owner role and a review date is a note, not a risk: no one is answerable for treating it and nothing brings it back for review. Use functional roles such as “PKI lead”, not people’s names; recording a role is not a sign-off, and the worksheet does not track treatment status.'
export const UNOWNED_ENTRY_LABEL = 'Note, not a risk yet — add an owner role and a review date'
export const AUTOMATIC_RISK_RATING_SCOPE =
  'Where automatic starting ratings are used, they are adjustable teaching ratings, not event probabilities or measured risk. Confidentiality algorithm rows start at likelihood 5 when the assessment HNDL flag is true; signing and symmetric/hash rows do not receive that increase. Otherwise algorithm rows start at 4 for migration not started and 3 otherwise. Product bookmarks create worksheet candidates with an assumed starting likelihood of 4; a bookmark does not establish deployment, algorithm exposure or calibrated risk. Threat rows start at 5 for critical, 4 for high and 3 otherwise. Starting impact uses recorded sensitivity text: 5 for critical/classified, otherwise 4 for high/regulated, 3 for medium, 2 for low and 3 when none matches. Framework bookmarks do not change these ratings or establish applicability. Values may be edited or saved from earlier inputs, so current entries can differ from these initial rules.'
const PRODUCTION_CAPABILITIES =
  'In production tools, look for named (not just role) risk and treatment owners, scheduled reviews with reminders, treatment status and change history. Check that these remain linked to the risk’s scope and assumptions when records are edited or exported. These capabilities support follow-through; completing a record does not demonstrate risk reduction.'

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

const RISK_LEVELS = {
  Critical: { color: 'text-status-error', bg: 'bg-status-error/10' },
  High: { color: 'text-status-warning', bg: 'bg-status-warning/10' },
  Medium: { color: 'text-primary', bg: 'bg-primary/10' },
  Low: { color: 'text-status-success', bg: 'bg-status-success/10' },
}

function getRiskLevel(score: number): keyof typeof RISK_LEVELS {
  if (score >= 20) return 'Critical'
  if (score >= 12) return 'High'
  if (score >= 6) return 'Medium'
  return 'Low'
}

function summarizeRiskEntries(
  entries: Pick<RiskEntry, 'likelihood' | 'impact' | 'ownerRole' | 'nextReview'>[]
) {
  const summary = { Critical: 0, High: 0, Medium: 0, Low: 0, notes: 0 }
  for (const entry of entries) {
    if (isUnownedRiskEntry(entry)) {
      summary.notes++
    } else {
      summary[getRiskLevel(entry.likelihood * entry.impact)]++
    }
  }
  return summary
}

/** Extracted (07192026, Batch 2) so the simulation's real-tool doc generator
 *  renders THIS logic — the component's export memo delegates here, so the
 *  two can never drift. Entries type comes from the shared store. */
export function buildRiskRegisterMarkdown(
  riskEntries: Pick<
    RiskEntry,
    | 'assetName'
    | 'currentAlgorithm'
    | 'threatVector'
    | 'likelihood'
    | 'impact'
    | 'mitigation'
    | 'ownerRole'
    | 'nextReview'
  >[]
): string {
  let md = '# Quantum Risk Register\n\n'
  md += `Generated: ${new Date().toLocaleDateString()}\n\n`
  md += `**Sample risk worksheet.** ${WORKSHEET_SCOPE}\n\n`
  md += `## Starting-rating scope\n\n${AUTOMATIC_RISK_RATING_SCOPE}\n\n`
  md += '---\n\n'
  md +=
    '| # | Asset | Algorithm | Threat Vector | L | I | Score | Level | Mitigation | Owner role | Next review |\n'
  md +=
    '|---|-------|-----------|---------------|---|---|-------|-------|------------|------------|-------------|\n'

  riskEntries.forEach((entry, idx) => {
    const score = entry.likelihood * entry.impact
    const level = isUnownedRiskEntry(entry) ? 'Pending assignment' : getRiskLevel(score)
    const threat =
      THREAT_VECTORS.find((t) => t.value === entry.threatVector)?.label ?? entry.threatVector
    md += `| ${idx + 1} | ${entry.assetName || 'Unnamed'} | ${entry.currentAlgorithm} | ${threat} | ${entry.likelihood} | ${entry.impact} | ${score} | ${level} | ${entry.mitigation || 'None specified'} | ${entry.ownerRole?.trim() || 'Unassigned'} | ${entry.nextReview?.trim() || 'Not scheduled'} |\n`
  })

  md += '\n\n## Risk Summary\n\n'
  const summary = summarizeRiskEntries(riskEntries)
  md += 'Counts include entries with an owner role and next review date.\n\n'
  md += `- **Critical:** ${summary.Critical}\n`
  md += `- **High:** ${summary.High}\n`
  md += `- **Medium:** ${summary.Medium}\n`
  md += `- **Low:** ${summary.Low}\n`
  md += `- **Total Entries:** ${riskEntries.length}\n`
  md += `- **Notes, not yet risks (no owner role or review date):** ${summary.notes}\n`

  md += `\n## Production-tool capabilities to evaluate\n\n${PRODUCTION_CAPABILITIES}\n`
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
      ownerRole: '',
      nextReview: '',
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

  const summary = useMemo(() => summarizeRiskEntries(riskEntries), [riskEntries])
  const exportMarkdown = useMemo(() => buildRiskRegisterMarkdown(riskEntries), [riskEntries])

  const editedSince = wasSaved && lastSavedKey !== null && exportMarkdown !== lastSavedKey

  const handleExport = useCallback(() => {
    if (lastSavedKey !== null && exportMarkdown === lastSavedKey) return
    addExecutiveDocument({
      id: `risk-register-${Date.now()}`,
      type: 'risk-register',
      title: 'Quantum Risk Register',
      data: exportMarkdown,
      inputs: scopedArtifactInputs(RISK_REGISTER_INPUT_SCOPE, {
        entries: riskEntries,
      } satisfies SavedRiskRegisterInputs),
      createdAt: Date.now(),
      moduleId: 'pqc-risk-management',
    })
    setLastSavedKey(exportMarkdown)
  }, [exportMarkdown, addExecutiveDocument, lastSavedKey, setLastSavedKey, riskEntries])

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
      <ScenarioComparison reportId="risk-register" report={exportMarkdown} />
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
      <aside
        aria-label="Risk worksheet scope"
        className="rounded-lg border border-border p-3 text-xs text-muted-foreground space-y-2"
      >
        <p>
          <strong className="text-foreground">Sample risk worksheet.</strong> {WORKSHEET_SCOPE}
        </p>
        <p>{PRODUCTION_CAPABILITIES}</p>
      </aside>
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
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              withEducationNoticeCsv(
                decisionModelToCsv({
                  entries: riskEntries.map((entry) => {
                    const score = entry.likelihood * entry.impact
                    const pending = isUnownedRiskEntry(entry)
                    return {
                      ...entry,
                      score,
                      status: pending ? 'Draft note' : 'Tracked risk',
                      riskLevel: pending ? 'Pending assignment' : getRiskLevel(score),
                    }
                  }),
                  summary,
                  decisionBrief: exportMarkdown,
                })
              ),
              'risk-register.csv'
            )
          }
        >
          Download CSV
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
          const riskLevel = getRiskLevel(score)
          const pending = isUnownedRiskEntry(entry)
          const risk = RISK_LEVELS[riskLevel]
          return (
            <div key={entry.id} className="glass-panel p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${pending ? 'text-muted-foreground bg-muted' : `${risk.color} ${risk.bg}`}`}
                  >
                    {pending ? `Provisional score: ${score}` : `Score: ${score} (${riskLevel})`}
                  </span>
                  {pending && (
                    <span className="text-xs px-2 py-0.5 rounded font-medium text-status-warning bg-status-warning/10">
                      {UNOWNED_ENTRY_LABEL}
                    </span>
                  )}
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

              {/* Owner role & next review */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={`owner-role-${entry.id}`}
                    className="block text-xs font-medium text-muted-foreground mb-1"
                  >
                    Owner role
                  </label>
                  <input
                    id={`owner-role-${entry.id}`}
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    placeholder="A role, not a name — e.g., PKI lead"
                    value={entry.ownerRole ?? ''}
                    onChange={(e) => updateEntry(entry.id, 'ownerRole', e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`next-review-${entry.id}`}
                    className="block text-xs font-medium text-muted-foreground mb-1"
                  >
                    Next review date
                  </label>
                  <input
                    id={`next-review-${entry.id}`}
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    value={entry.nextReview ?? ''}
                    onChange={(e) => updateEntry(entry.id, 'nextReview', e.target.value)}
                  />
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
          <h2 className="text-base font-semibold text-foreground mb-3">Risk Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(RISK_LEVELS) as (keyof typeof RISK_LEVELS)[]).map((label) => {
              // eslint-disable-next-line security/detect-object-injection -- label comes from RISK_LEVELS
              const { color, bg } = RISK_LEVELS[label]
              return (
                <div key={label} className={`rounded-lg p-3 ${bg} text-center`}>
                  <div className={`text-2xl font-bold ${color}`}>{summary[label]}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              Notes, not yet risks: {summary.notes}
            </span>
            . A note enters the summary once it has an owner role and a next review date.
          </p>
        </div>
      )}
    </div>
  )
}
