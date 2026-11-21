// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Search, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SAMPLE_REPO_FILES } from '../data/secretHuntData'
import { ClaimLine } from '../components/ClaimLine'

export const SecretHunt: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(SAMPLE_REPO_FILES[0].id)
  const [scanExecuted, setScanExecuted] = useState(false)
  const [remediatedIds, setRemediatedIds] = useState<ReadonlySet<string>>(() => new Set())

  const activeFile = SAMPLE_REPO_FILES.find((f) => f.id === selectedId) ?? SAMPLE_REPO_FILES[0]
  const isRemediated = remediatedIds.has(activeFile.id)

  const toggleRemediation = (id: string) => {
    setRemediatedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Search size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gradient">
                Step 1: Secret Hunt (Defensive CI &amp; Repo Hygiene)
              </h3>
              <p className="text-sm text-muted-foreground">
                Inspect this Hub-authored sample repository using dummy <code>EXAMPLE_FAKE_</code>{' '}
                tokens. Run deterministic pattern rules to see what simple regexes catch—and what
                commits, logs, and crash dumps hide.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant={scanExecuted ? 'secondary' : 'gradient'}
            onClick={() => setScanExecuted(true)}
            className="shrink-0"
          >
            {scanExecuted ? 'Pattern Scan Executed' : 'Run Sample Pattern Rules'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2" role="group" aria-label="Sample repository files">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sample Repository Artifacts ({remediatedIds.size}/{SAMPLE_REPO_FILES.length}{' '}
              remediated)
            </p>
            {SAMPLE_REPO_FILES.map((file) => {
              const active = file.id === activeFile.id
              const fixed = remediatedIds.has(file.id)
              return (
                <Button
                  key={file.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedId(file.id)}
                  aria-pressed={active}
                  className={`h-auto w-full flex-col items-stretch justify-start whitespace-normal text-left p-3 rounded-lg border transition-colors ${
                    active
                      ? 'bg-primary/10 border-primary/50 text-foreground'
                      : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-xs font-mono font-semibold text-foreground truncate">
                      {file.path}
                    </span>
                    {fixed ? (
                      <ShieldCheck size={14} className="text-status-success shrink-0" />
                    ) : scanExecuted ? (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${
                          file.regexDetectable
                            ? 'bg-status-success/15 text-status-success border-status-success/40'
                            : 'bg-status-warning/15 text-status-warning border-status-warning/40'
                        }`}
                      >
                        {file.regexDetectable ? 'Regex hit' : 'Missed'}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{file.label}</p>
                </Button>
              )
            })}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{activeFile.label}</span>
                <span className="text-xs font-mono text-muted-foreground">{activeFile.path}</span>
              </div>
              <pre className="p-3 rounded bg-card border border-border text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                {activeFile.snippet}
              </pre>

              {scanExecuted ? (
                <div
                  className={`p-3 rounded border text-xs space-y-1 ${
                    activeFile.regexDetectable
                      ? 'bg-status-success/10 border-status-success/30 text-foreground'
                      : 'bg-status-warning/10 border-status-warning/30 text-foreground'
                  }`}
                >
                  <p className="font-semibold flex items-center gap-1.5">
                    {activeFile.regexDetectable ? (
                      <>
                        <ShieldCheck size={14} className="text-status-success" /> Deterministic
                        pattern rule matched
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={14} className="text-status-warning" /> Simple pattern
                        rule missed this leak
                      </>
                    )}
                  </p>
                  <p className="text-muted-foreground">{activeFile.whyRegexMissesOrHits}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Click <strong>Run Sample Pattern Rules</strong> to compare deterministic secret
                  regex coverage against hidden leak classes.
                </p>
              )}

              <div className="p-3 rounded bg-card border border-border space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground">
                    Defensive Remediation: {activeFile.remediationTitle}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant={isRemediated ? 'secondary' : 'outline'}
                    onClick={() => toggleRemediation(activeFile.id)}
                  >
                    {isRemediated ? 'Marked Remediated' : 'Apply Control in Sample'}
                  </Button>
                </div>
                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                  {activeFile.remediationSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>

            <ClaimLine id={activeFile.relatedClaimId} chip="Linked Primary Evidence" />
          </div>
        </div>
      </section>
    </div>
  )
}
