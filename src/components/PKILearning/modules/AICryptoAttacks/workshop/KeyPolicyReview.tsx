// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KEY_POLICY_TEMPLATES, POLICY_SETTING_META } from '../data/keyPolicyData'
import { ClaimLine, ReadingNote } from '../components/ClaimLine'

export const KeyPolicyReview: React.FC = () => {
  const [templateId, setTemplateId] = useState<string>(KEY_POLICY_TEMPLATES[0].id)
  const [flaggedKeys, setFlaggedKeys] = useState<ReadonlySet<string>>(() => new Set())
  const [checked, setChecked] = useState(false)

  const template = KEY_POLICY_TEMPLATES.find((t) => t.id === templateId) ?? KEY_POLICY_TEMPLATES[0]

  const selectTemplate = (id: string) => {
    setTemplateId(id)
    setFlaggedKeys(new Set())
    setChecked(false)
  }

  const toggleFlag = (key: string) => {
    setChecked(false)
    setFlaggedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const expectedRiskSet = new Set(template.riskyFlags)
  const exactMatch =
    flaggedKeys.size === expectedRiskSet.size &&
    [...expectedRiskSet].every((k) => flaggedKeys.has(k))

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <KeyRound size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">
              Step 2: KMS &amp; HSM Key-Policy Review (Configuration Simulator)
            </h3>
            <p className="text-sm text-muted-foreground">
              Review PKCS #11 v3.2 key templates and cloud Managed HSM policies. Flag every setting
              that lets a compromised session export or mutate a key—without emitting API call
              sequences or exporting any key material.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Key policy templates">
          {KEY_POLICY_TEMPLATES.map((t) => (
            <Button
              key={t.id}
              type="button"
              variant={t.id === template.id ? 'gradient' : 'outline'}
              onClick={() => selectTemplate(t.id)}
              className="text-xs"
              aria-pressed={t.id === template.id}
            >
              {t.name}
            </Button>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">{template.name}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-card border border-border text-muted-foreground">
              {template.plane}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {POLICY_SETTING_META.map((meta) => {
              const currentValue = template.settings[meta.key]
              const isSafe = currentValue === meta.expectedSafeValue
              const isFlagged = flaggedKeys.has(meta.key)
              return (
                <Button
                  key={meta.key}
                  type="button"
                  variant="ghost"
                  onClick={() => toggleFlag(meta.key)}
                  aria-pressed={isFlagged}
                  className={`h-auto w-full flex-col items-stretch justify-start whitespace-normal text-left p-3 rounded-lg border transition-colors ${
                    isFlagged
                      ? 'bg-status-warning/15 border-status-warning/50'
                      : 'bg-card border-border hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-xs font-semibold text-foreground">{meta.label}</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted text-foreground">
                      {String(currentValue)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{meta.meaning}</p>
                  {checked ? (
                    <p
                      className={`text-[11px] font-medium mt-1 ${
                        isSafe ? 'text-status-success' : 'text-status-error'
                      }`}
                    >
                      {isSafe
                        ? 'Aligned with policy'
                        : 'Risky setting: must be flagged and remediated'}
                    </p>
                  ) : (
                    <p className="text-[11px] text-primary mt-1">
                      {isFlagged ? 'Flagged as risky (click to unflag)' : 'Click to flag if risky'}
                    </p>
                  )}
                </Button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="gradient" onClick={() => setChecked(true)}>
              Verify Flagged Settings
            </Button>
            {checked ? (
              <span
                className={`text-xs font-semibold flex items-center gap-1.5 ${
                  exactMatch ? 'text-status-success' : 'text-status-warning'
                }`}
              >
                {exactMatch ? (
                  <>
                    <CheckCircle2 size={14} /> Accurate review ({expectedRiskSet.size} risky setting
                    {expectedRiskSet.size === 1 ? '' : 's'} identified)
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} /> Expected {expectedRiskSet.size} risky flag
                    {expectedRiskSet.size === 1 ? '' : 's'} for this template—compare below.
                  </>
                )}
              </span>
            ) : null}
          </div>

          {checked ? (
            <div className="p-3 rounded bg-card border border-border space-y-1.5 text-xs">
              <p className="font-semibold text-foreground">Assessment</p>
              <p className="text-muted-foreground">{template.explanation}</p>
              <p className="text-foreground">
                <strong>Remediation:</strong> {template.remediation}
              </p>
            </div>
          ) : null}
        </div>

        <ReadingNote title="Scope boundary: classical model checking vs hypothesised AI">
          <p>
            This configuration simulator checks static policy attributes and IAM separation only. It
            generates no PKCS #11 API call sequences, never exports keys, and distinguishes
            classical formal model checking (Tookan, <code>AI-5.1</code>) from{' '}
            <strong>hypothesised</strong> AI-automated API search (<code>AI-5.4</code>).
          </p>
        </ReadingNote>

        <div className="space-y-3">
          {template.claimIds.map((cid) => (
            <ClaimLine key={cid} id={cid} />
          ))}
        </div>
      </section>
    </div>
  )
}
