// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Shared author
/**
 * Optional workshop step `evidence-exchange` (plan r1 Workshop 5, r2 Q11):
 * a SYNTHETIC teaching demo. (1) Classify each evidence item as vendor
 * assertion, automated result, lab attestation or authority decision.
 * (2) Submit a mock evidence package incrementally and fix the avoidable
 * round-trip errors. Nothing here is an official NIST, CC/EUCC or PCI format.
 */
import { useMemo, useState, type FC } from 'react'
import { CheckCircle2, FlaskConical, RotateCcw, Send, Wrench, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CertWorkshopStepProps } from '../data/types'
import { ANCHOR_RELEASES, ANCHOR_SCENARIO } from '../data/anchorScenario'
import {
  EVIDENCE_ITEMS,
  EVIDENCE_PACKAGES,
  EVIDENCE_ROLES,
  EXCHANGE_DISCLAIMER,
  EXCHANGE_MANIFEST_VERSION,
  LOCAL_EVIDENCE_CLASSES,
  validatePackages,
  type EvidenceRole,
  type PackageIssue,
} from '../data/sharedData'
import { Callout, FictionalBadge } from '../components/sections/CoreSections'

export const EvidenceExchange: FC<CertWorkshopStepProps> = () => {
  const [roles, setRoles] = useState<Record<string, EvidenceRole>>({})
  const [fixed, setFixed] = useState<Set<string>>(new Set())
  const [submissions, setSubmissions] = useState<PackageIssue[][]>([])
  const issues = useMemo(() => validatePackages(EVIDENCE_PACKAGES, fixed), [fixed])
  const last = submissions.at(-1)
  const accepted = last !== undefined && last.length === 0
  const classified = EVIDENCE_ITEMS.filter((i) => roles[i.id] !== undefined)
  const correct = classified.filter((i) => roles[i.id] === i.role)

  return (
    <div className="space-y-6">
      <div className="glass-panel space-y-2 p-5">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <FlaskConical size={18} className="text-primary" aria-hidden="true" /> Evidence exchange
          demo
        </h3>
        <p className="text-sm text-muted-foreground">
          The {ANCHOR_SCENARIO.name}
          <FictionalBadge /> moves from firmware {ANCHOR_RELEASES[0]?.firmware} to{' '}
          {ANCHOR_RELEASES[1]?.firmware}. Sort the evidence by who stands behind it, then send a
          mock package and fix what bounces.
        </p>
        <Callout tone="warning" title="Teaching model">
          <p data-testid="exchange-disclaimer">{EXCHANGE_DISCLAIMER}</p>
        </Callout>
      </div>

      <section className="glass-panel space-y-4 p-5" aria-labelledby="exchange-part-1">
        <h4 id="exchange-part-1" className="font-semibold text-foreground">
          1 — Who stands behind each item?
        </h4>
        <ol className="space-y-3">
          {EVIDENCE_ITEMS.map((item, i) => {
            const chosen = roles[item.id]
            const cls = item.evidenceClass ? LOCAL_EVIDENCE_CLASSES[item.evidenceClass] : undefined
            return (
              <li key={item.id} className="rounded-lg border border-border p-3">
                <p className="text-sm text-foreground">
                  {i + 1}. {item.text}
                </p>
                <div
                  className="mt-2 flex flex-wrap gap-2"
                  role="group"
                  aria-label={`Role of item ${i + 1}`}
                >
                  {EVIDENCE_ROLES.map((r) => (
                    <Button
                      key={r.id}
                      size="sm"
                      variant={chosen === r.id ? 'gradient' : 'outline'}
                      aria-pressed={chosen === r.id}
                      onClick={() => setRoles((prev) => ({ ...prev, [item.id]: r.id }))}
                    >
                      {r.label}
                    </Button>
                  ))}
                </div>
                {chosen ? (
                  <p
                    className={`mt-2 flex items-start gap-2 text-xs ${chosen === item.role ? 'text-status-success' : 'text-status-error'}`}
                  >
                    {chosen === item.role ? (
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <XCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      {chosen === item.role
                        ? ''
                        : `It is a ${EVIDENCE_ROLES.find((r) => r.id === item.role)?.label.toLowerCase()}. `}
                      <span className="text-foreground/85">{item.why}</span>
                      {cls ? (
                        <span className="block text-muted-foreground">
                          Evidence class: {cls.label} — permitted claim: “{cls.permittedClaim}”.
                        </span>
                      ) : null}
                    </span>
                  </p>
                ) : null}
              </li>
            )
          })}
        </ol>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {correct.length} of {EVIDENCE_ITEMS.length} classified correctly · {classified.length}{' '}
          answered
        </p>
      </section>

      <section className="glass-panel space-y-4 p-5" aria-labelledby="exchange-part-2">
        <h4 id="exchange-part-2" className="font-semibold text-foreground">
          2 — Send the package, fix the round trips
        </h4>
        <p className="text-xs text-muted-foreground">
          The mock endpoint checks only completeness and consistency against the capability manifest
          (version {EXCHANGE_MANIFEST_VERSION}). It has no opinion on whether the evidence is
          enough.
        </p>
        <ul className="space-y-2">
          {EVIDENCE_PACKAGES.map((p) => {
            const own = issues.filter((x) => x.packageId === p.id)
            return (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{p.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    declares {fixed.has(p.id) ? EXCHANGE_MANIFEST_VERSION : p.declaredVersion}
                    {own.length ? '' : ' · complete'}
                  </p>
                </div>
                {own.length && last?.some((x) => x.packageId === p.id) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFixed((prev) => new Set(prev).add(p.id))}
                  >
                    <Wrench size={14} className="mr-1.5" aria-hidden="true" /> Fix and re-attach
                  </Button>
                ) : null}
              </li>
            )
          })}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="gradient"
            size="sm"
            onClick={() => setSubmissions((prev) => [...prev, issues])}
          >
            <Send size={14} className="mr-1.5" aria-hidden="true" /> Submit package
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFixed(new Set())
              setSubmissions([])
            }}
          >
            <RotateCcw size={14} className="mr-1.5" aria-hidden="true" /> Reset
          </Button>
        </div>
        {last ? (
          <div aria-live="polite">
            {accepted ? (
              <Callout
                tone="success"
                title={`Acknowledged after ${submissions.length} submission(s)`}
              >
                <p>
                  “Payload received, schema valid.” That is an automated result about the payload —
                  not a test verdict, not a lab attestation and not a validation decision. Every
                  earlier bounce was an avoidable round trip that structured data caught before a
                  human reviewer had to.
                </p>
              </Callout>
            ) : (
              <Callout tone="error" title={`Returned: ${last.length} issue(s)`}>
                <ul className="list-disc space-y-0.5 pl-4">
                  {last.map((x) => (
                    <li key={`${x.packageId}-${x.issue}`}>
                      {EVIDENCE_PACKAGES.find((p) => p.id === x.packageId)?.label}: {x.issue}
                    </li>
                  ))}
                </ul>
              </Callout>
            )}
          </div>
        ) : null}
      </section>

      <p className="text-xs text-muted-foreground">
        What still needs people: whether the evidence is sufficient, how the change is classified,
        and whether the certificate changes. Only the lab can attest, and only the authority can
        decide.
      </p>
    </div>
  )
}
