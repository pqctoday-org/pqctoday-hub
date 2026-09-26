// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Core (Shared author)
/**
 * Workshop step `boundary-drawer` (plan r2 Common Core 2): place each Orrin N7
 * component inside or outside a FIPS module boundary, a CC / EUCC TOE or a PCI
 * device, for the appliance or the cloud offering. The step explains the
 * consequence of each choice and previews what the resulting record would —
 * and would not — cover. It teaches consequences; it is not a certification
 * determination.
 */
import { useMemo, useState, type FC } from 'react'
import { AlertTriangle, CheckCircle2, Info, RotateCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CertWorkshopStepProps } from '../data/types'
import {
  ANCHOR_COMPONENT_DETAILS,
  ANCHOR_RELEASES,
  ANCHOR_SCENARIO,
  type AnchorComponentId,
} from '../data/anchorScenario'
import {
  BOUNDARY_LENSES,
  EXPECTED_INSIDE,
  evaluateBoundary,
  type BoundaryLens,
  type Deployment,
  type FindingSeverity,
} from '../data/coreData'
import { Callout, FictionalBadge } from '../components/sections/CoreSections'

const COMPONENT_IDS = ANCHOR_SCENARIO.components.map((c) => c.id)
const isComponent = (v: unknown): v is AnchorComponentId =>
  typeof v === 'string' && (COMPONENT_IDS as string[]).includes(v)
const isLens = (v: unknown): v is BoundaryLens => v === 'fips' || v === 'cc' || v === 'pci'

const SEVERITY = new Map<FindingSeverity, { label: string; className: string; Icon: typeof Info }>([
  ['error', { label: 'Breaks the boundary', className: 'text-status-error', Icon: XCircle }],
  ['warning', { label: 'Consequence', className: 'text-status-warning', Icon: AlertTriangle }],
  ['info', { label: 'Note', className: 'text-primary', Icon: Info }],
])

export const BoundaryDrawer: FC<CertWorkshopStepProps> = ({ config }) => {
  const cfgLens = config?.lens
  const cfgInside = config?.inside
  const [lens, setLens] = useState<BoundaryLens>(isLens(cfgLens) ? cfgLens : 'fips')
  const [deployment, setDeployment] = useState<Deployment>(
    config?.deployment === 'cloud' ? 'cloud' : 'appliance'
  )
  const [inside, setInside] = useState<Set<AnchorComponentId>>(
    () =>
      new Set(
        Array.isArray(cfgInside) ? cfgInside.filter(isComponent) : ([] as AnchorComponentId[])
      )
  )

  const findings = useMemo(
    () => evaluateBoundary(lens, deployment, inside),
    [lens, deployment, inside]
  )
  const errors = findings.filter((f) => f.severity === 'error').length
  const lensMeta = BOUNDARY_LENSES.find((l) => l.id === lens)
  const baseline = ANCHOR_RELEASES.find((r) => r.id === 'baseline')
  const label = (id: AnchorComponentId) =>
    ANCHOR_SCENARIO.components.find((c) => c.id === id)?.label ?? id

  const toggle = (id: AnchorComponentId) =>
    setInside((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const insideList = COMPONENT_IDS.filter((id) => inside.has(id))
  const outsideList = COMPONENT_IDS.filter((id) => !inside.has(id))

  return (
    <div className="space-y-6">
      <div className="glass-panel space-y-2 p-5">
        <h3 className="text-lg font-semibold text-foreground">Draw the certification boundary</h3>
        <p className="text-sm text-muted-foreground">
          Choose a scheme and a delivery model, then place each {ANCHOR_SCENARIO.name}
          <FictionalBadge /> component inside or outside what that scheme evaluates. The findings
          explain the consequence of each choice; the preview shows what the record would cover.
        </p>
      </div>

      <section className="glass-panel space-y-4 p-5" aria-label="Boundary settings">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Scheme lens">
          {BOUNDARY_LENSES.map((l) => (
            <Button
              key={l.id}
              size="sm"
              variant={lens === l.id ? 'gradient' : 'outline'}
              aria-pressed={lens === l.id}
              onClick={() => setLens(l.id)}
            >
              {l.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Delivery model">
          {(['appliance', 'cloud'] as const).map((d) => (
            <Button
              key={d}
              size="sm"
              variant={deployment === d ? 'gradient' : 'outline'}
              aria-pressed={deployment === d}
              onClick={() => setDeployment(d)}
            >
              {d === 'appliance' ? 'Appliance' : 'Multi-tenant cloud'}
            </Button>
          ))}
        </div>

        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Components">
          {ANCHOR_SCENARIO.components.map((c) => {
            const on = inside.has(c.id)
            const d = ANCHOR_COMPONENT_DETAILS[c.id]
            return (
              <li
                key={c.id}
                className={`rounded-lg border p-3 ${on ? 'border-primary/40 bg-primary/5' : 'border-border'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{c.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Runs on: {deployment === 'cloud' ? d.cloud : d.appliance}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={on ? 'gradient' : 'outline'}
                    aria-pressed={on}
                    aria-label={`${c.label}: ${on ? 'inside' : 'outside'} the boundary`}
                    onClick={() => toggle(c.id)}
                  >
                    {on ? 'Inside' : 'Outside'}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setInside(new Set(EXPECTED_INSIDE[lens]))}
          >
            Show the usual boundary
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setInside(new Set())}>
            <RotateCcw size={14} className="mr-1.5" aria-hidden="true" /> Clear
          </Button>
        </div>
      </section>

      <section
        className="glass-panel space-y-3 p-5"
        aria-labelledby="boundary-findings"
        aria-live="polite"
      >
        <h4 id="boundary-findings" className="font-semibold text-foreground">
          Findings — {lensMeta?.label}
        </h4>
        {findings.length === 0 ? (
          <Callout tone="success" title="A coherent boundary">
            <p>Nothing in this boundary contradicts how the scheme defines its object.</p>
          </Callout>
        ) : (
          <ul className="space-y-2">
            {findings.map((f) => {
              const s = SEVERITY.get(f.severity)
              const Icon = s?.Icon ?? Info
              return (
                <li
                  key={`${f.severity}-${f.component}`}
                  className="rounded-lg border border-border p-3"
                >
                  <p
                    className={`flex items-center gap-2 text-xs font-semibold ${s?.className ?? ''}`}
                  >
                    <Icon size={14} aria-hidden="true" />
                    {s?.label} · {label(f.component)}
                  </p>
                  <p className="mt-1 text-xs text-foreground/85">{f.text}</p>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="glass-panel space-y-3 p-5" aria-labelledby="boundary-preview">
        <h4 id="boundary-preview" className="font-semibold text-foreground">
          What the record would say
        </h4>
        {errors > 0 ? (
          <Callout tone="error">
            <p>
              Fix the {errors === 1 ? 'finding' : `${errors} findings`} marked “Breaks the boundary”
              first — no {lensMeta?.object} is described this way.
            </p>
          </Callout>
        ) : (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p>
              <strong>Object:</strong> {ANCHOR_SCENARIO.name} {lensMeta?.object}, firmware{' '}
              {baseline?.firmware},{' '}
              {deployment === 'cloud' ? 'as used in the cloud offering' : 'appliance'}
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-status-success"
                aria-hidden="true"
              />
              <span>
                <strong>Covers:</strong>{' '}
                {insideList.length ? insideList.map(label).join(', ') : 'nothing yet'}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <XCircle
                size={16}
                className="mt-0.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span>
                <strong>Says nothing about:</strong>{' '}
                {outsideList.length ? outsideList.map(label).join(', ') : 'none'}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Only now, the level:</strong> {lensMeta?.level}
            </p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Any claim about a component on the “says nothing about” line must not borrow this record.
          That is the scope-before-level rule in one sentence.
        </p>
      </section>
    </div>
  )
}
