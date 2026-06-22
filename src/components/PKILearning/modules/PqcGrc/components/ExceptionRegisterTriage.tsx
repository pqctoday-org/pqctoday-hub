// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useMemo } from 'react'
import { AlertTriangle, ShieldOff, Bell } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { Button } from '@/components/ui/button'
import { ExportableArtifact } from '../../../common/executive'

const MODULE_ID = 'pqc-grc'

/**
 * Exception Register Triage.
 *
 * The framework (GRC-SOC Handoff, p. 184) makes the exception / deferral
 * register a *dynamic suppression list* the SOC ingests: legitimately deferred
 * legacy systems must NOT alarm the cryptographic-drift detection rules. But the
 * operational KRI "Open Exceptions / Deferrals" (p. 179) says any exception that
 * has run > 6 months without a remediation plan must trigger escalation rather
 * than keep silencing alerts. This workshop has the learner classify each entry
 * and decide its disposition under exactly that rule.
 */

type Disposition = 'suppress' | 'escalate' | null

interface ExceptionEntry {
  id: string
  system: string
  reason: string
  ageMonths: number
  hasRemediationPlan: boolean
  hndlRelevant: boolean
}

const ENTRIES: ExceptionEntry[] = [
  {
    id: 'legacy-mainframe',
    system: 'Claims mainframe (COBOL TLS terminator)',
    reason: 'No vendor PQC cipher-suite support; replacement on the 2028 roadmap.',
    ageMonths: 3,
    hasRemediationPlan: true,
    hndlRelevant: false,
  },
  {
    id: 'b2b-edi',
    system: 'B2B EDI gateway (partner-pinned ECDH)',
    reason: 'Trading partner cannot negotiate hybrid; joint migration scheduled Q1 next year.',
    ageMonths: 5,
    hasRemediationPlan: true,
    hndlRelevant: false,
  },
  {
    id: 'iot-fleet',
    system: 'Field IoT fleet (RSA-2048 firmware signing)',
    reason: 'Firmware-update channel not yet crypto-agile; OTA pipeline rework needed.',
    ageMonths: 9,
    hasRemediationPlan: false,
    hndlRelevant: false,
  },
  {
    id: 'archive-store',
    system: 'Long-term archive store (classical KEM at rest)',
    reason: 'Holds 25-year-retention records; re-encryption deferred for capacity reasons.',
    ageMonths: 8,
    hasRemediationPlan: false,
    hndlRelevant: true,
  },
  {
    id: 'analytics-warehouse',
    system: 'Analytics warehouse (TLS to managed service)',
    reason: 'Awaiting provider hybrid TLS GA; provider committed to a dated rollout.',
    ageMonths: 2,
    hasRemediationPlan: true,
    hndlRelevant: false,
  },
]

/** The framework rule: an exception is safe to suppress only while it is fresh
 *  (<= 6 months) AND carries a remediation plan. Anything stale or plan-less
 *  must escalate instead of silently silencing the SOC's drift alerts. Entries
 *  touching HNDL-relevant data raise the stakes of getting this wrong. */
function recommendedDisposition(e: ExceptionEntry): Exclude<Disposition, null> {
  return e.ageMonths <= 6 && e.hasRemediationPlan ? 'suppress' : 'escalate'
}

export const ExceptionRegisterTriage: React.FC = () => {
  const { addExecutiveDocument } = useModuleStore()
  const [choices, setChoices] = useState<Record<string, Disposition>>(() =>
    Object.fromEntries(ENTRIES.map((e) => [e.id, null]))
  )
  const [revealed, setRevealed] = useState(false)

  const setChoice = useCallback((id: string, d: Exclude<Disposition, null>) => {
    setChoices((prev) => ({ ...prev, [id]: prev[id] === d ? null : d }))
  }, [])

  const allAnswered = useMemo(() => ENTRIES.every((e) => choices[e.id] !== null), [choices])

  const score = useMemo(
    () => ENTRIES.filter((e) => choices[e.id] === recommendedDisposition(e)).length,
    [choices]
  )

  const exportMarkdown = useMemo(() => {
    let md = '# PQC GRC — Exception Register Triage\n\n'
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`
    md +=
      'Rule: an exception is safe to add to the SOC suppression list only while it is ' +
      '≤ 6 months old AND has a documented remediation plan. Older or plan-less exceptions ' +
      'escalate instead of suppressing drift alerts.\n\n'
    md += '| System | Age (mo) | Plan | HNDL | Disposition |\n'
    md += '|--------|----------|------|------|-------------|\n'
    for (const e of ENTRIES) {
      const d = choices[e.id] ?? recommendedDisposition(e)
      md += `| ${e.system} | ${e.ageMonths} | ${e.hasRemediationPlan ? 'Yes' : 'No'} | ${e.hndlRelevant ? 'Yes' : 'No'} | ${d === 'suppress' ? 'Suppress (→ SOC list)' : 'Escalate'} |\n`
    }
    const suppress = ENTRIES.filter(
      (e) => (choices[e.id] ?? recommendedDisposition(e)) === 'suppress'
    )
    md += '\n## SOC Suppression List\n\n'
    if (suppress.length === 0) {
      md += '_No entries qualify for suppression — all exceptions escalate._\n'
    } else {
      for (const e of suppress) md += `- ${e.system}\n`
    }
    return md
  }, [choices])

  const handleExport = useCallback(() => {
    addExecutiveDocument({
      id: `exception-triage-${Date.now()}`,
      moduleId: MODULE_ID,
      type: 'risk-register',
      title: 'PQC GRC — Exception Register Triage',
      data: exportMarkdown,
      createdAt: Date.now(),
    })
  }, [addExecutiveDocument, exportMarkdown])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        The exception and deferral register is the SOC&apos;s dynamic suppression list: legitimately
        deferred systems must not drown drift detection in false alerts. But the operational KRI
        says any exception older than 6 months without a remediation plan should{' '}
        <strong>escalate</strong>, not keep silencing alarms. Decide each entry&apos;s disposition.
      </p>

      <div className="space-y-3">
        {ENTRIES.map((e) => {
          const rec = recommendedDisposition(e)
          const choice = choices[e.id]
          const correct = revealed && choice === rec
          const wrong = revealed && choice !== null && choice !== rec
          return (
            <div
              key={e.id}
              className={`glass-panel p-4 ${correct ? 'border-status-success/40' : wrong ? 'border-status-error/40' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <div className="text-sm font-bold text-foreground">{e.system}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{e.reason}</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded border border-border bg-muted/50 text-muted-foreground">
                      Age: {e.ageMonths} mo
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border ${e.hasRemediationPlan ? 'border-status-success/40 text-status-success bg-status-success/10' : 'border-status-error/40 text-status-error bg-status-error/10'}`}
                    >
                      {e.hasRemediationPlan ? 'Has remediation plan' : 'No remediation plan'}
                    </span>
                    {e.hndlRelevant && (
                      <span className="px-2 py-0.5 rounded border border-status-warning/40 text-status-warning bg-status-warning/10">
                        HNDL-relevant data
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2" role="group" aria-label={`Disposition for ${e.system}`}>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setChoice(e.id, 'suppress')}
                    aria-pressed={choice === 'suppress'}
                    className={`flex items-center gap-1.5 text-xs font-bold rounded border px-3 py-1.5 min-h-[36px] focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      choice === 'suppress'
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'bg-background text-muted-foreground border-border'
                    }`}
                  >
                    <ShieldOff size={14} /> Suppress
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setChoice(e.id, 'escalate')}
                    aria-pressed={choice === 'escalate'}
                    className={`flex items-center gap-1.5 text-xs font-bold rounded border px-3 py-1.5 min-h-[36px] focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      choice === 'escalate'
                        ? 'bg-status-error/20 text-status-error border-status-error/40'
                        : 'bg-background text-muted-foreground border-border'
                    }`}
                  >
                    <Bell size={14} /> Escalate
                  </Button>
                </div>
              </div>
              {revealed && (
                <div
                  className={`mt-3 text-xs flex items-start gap-2 ${correct ? 'text-status-success' : 'text-status-error'}`}
                >
                  {!correct && <AlertTriangle size={14} className="shrink-0 mt-0.5" />}
                  <span>
                    Recommended: <strong>{rec === 'suppress' ? 'Suppress' : 'Escalate'}</strong>
                    {' — '}
                    {rec === 'suppress'
                      ? 'fresh (≤ 6 mo) with a remediation plan, so it belongs on the SOC suppression list.'
                      : `${e.ageMonths > 6 ? 'older than 6 months' : 'no remediation plan'}${e.hndlRelevant ? ' and touches HNDL-relevant data' : ''}, so it must escalate rather than silence drift alerts.`}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Button
          variant="gradient"
          type="button"
          disabled={!allAnswered}
          onClick={() => setRevealed(true)}
          className="px-5 py-2 font-bold rounded-lg disabled:opacity-50"
        >
          Check Triage
        </Button>
        {revealed && (
          <span className="text-sm text-muted-foreground">
            {score} / {ENTRIES.length} match the framework rule.
          </span>
        )}
        {!allAnswered && (
          <span className="text-xs text-muted-foreground">Classify every entry to check.</span>
        )}
      </div>

      <ExportableArtifact
        title="Exception Register Export"
        exportData={exportMarkdown}
        filename="pqc-grc-exception-register"
        formats={['markdown', 'pdf']}
        onExport={handleExport}
        wideTable
      >
        <p className="text-sm text-muted-foreground">
          Export the triaged register and its derived SOC suppression list to your learning
          portfolio.
        </p>
      </ExportableArtifact>
    </div>
  )
}
