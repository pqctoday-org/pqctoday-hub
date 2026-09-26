// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Core (Shared author)
/**
 * Workshop step `scheme-selector` (plan r1 Workshop 1, r2 Common Core 1).
 * Part A: pick an anchor customer and delivery model → which schemes apply,
 * may apply or do not answer, plus clarification questions. Part B: match
 * procurement claims to the scheme whose record can answer them.
 *
 * Deliberately never ranks schemes or recommends "the highest level"
 * (plan r1 W1): the output explains the question and the scope instead.
 */
import { useMemo, useState, type FC } from 'react'
import { CheckCircle2, CircleHelp, MinusCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import type { CertWorkshopStepProps } from '../data/types'
import {
  ANCHOR_CUSTOMER_PROFILES,
  ANCHOR_SCENARIO,
  type AnchorCustomerId,
} from '../data/anchorScenario'
import {
  CUSTOMER_APPLICABILITY,
  SELECTOR_ANSWERS,
  SELECTOR_CLAIMS,
  type Applicability,
  type Deployment,
  type SelectorAnswerId,
} from '../data/coreData'
import { Callout, FictionalBadge } from '../components/sections/CoreSections'

const CUSTOMER_IDS = ANCHOR_SCENARIO.customers.map((c) => c.id)

const isCustomer = (v: unknown): v is AnchorCustomerId =>
  typeof v === 'string' && (CUSTOMER_IDS as string[]).includes(v)

const STATUS = new Map<
  Applicability,
  { label: string; className: string; icon: FC<{ size?: number; className?: string }> }
>([
  ['applies', { label: 'Applies', className: 'text-status-success', icon: CheckCircle2 }],
  ['may-apply', { label: 'May apply — ask', className: 'text-status-warning', icon: CircleHelp }],
  [
    'does-not-answer',
    {
      label: 'Does not answer this requirement',
      className: 'text-muted-foreground',
      icon: MinusCircle,
    },
  ],
])

type ClaimFilter = 'timed' | 'all' | AnchorCustomerId

export const SchemeSelector: FC<CertWorkshopStepProps> = ({ config }) => {
  const cfgCustomer = config?.customer
  const initialCustomer = isCustomer(cfgCustomer) ? cfgCustomer : 'us-federal-agency'
  const [customer, setCustomer] = useState<AnchorCustomerId>(initialCustomer)
  const [deployment, setDeployment] = useState<Deployment>(
    config?.deployment === 'cloud' ? 'cloud' : 'appliance'
  )
  const [filter, setFilter] = useState<ClaimFilter>(
    config?.claimSet === 'all' ? 'all' : isCustomer(cfgCustomer) ? cfgCustomer : 'timed'
  )
  const [answers, setAnswers] = useState<Record<string, SelectorAnswerId>>({})

  const applicability = CUSTOMER_APPLICABILITY[customer]
  const profile = ANCHOR_CUSTOMER_PROFILES[customer]
  const customerLabel = (id: AnchorCustomerId) =>
    ANCHOR_SCENARIO.customers.find((c) => c.id === id)?.label ?? id

  const claims = useMemo(
    () =>
      SELECTOR_CLAIMS.filter((c) =>
        filter === 'timed' ? c.timed : filter === 'all' ? true : c.customer === filter
      ),
    [filter]
  )
  const answered = claims.filter((c) => answers[c.id] !== undefined)
  const correct = answered.filter((c) => answers[c.id] === c.answer)

  return (
    <div className="space-y-6">
      <div className="glass-panel space-y-2 p-5">
        <h3 className="text-lg font-semibold text-foreground">
          Which scheme answers the question?
        </h3>
        <p className="text-sm text-muted-foreground">
          The {ANCHOR_SCENARIO.name}
          <FictionalBadge /> is sold to four customers. Each one asks a different question. Part A
          shows which schemes can answer a customer’s question; Part B asks you to match real
          procurement claims to the right record.
        </p>
        <Callout tone="info">
          <p>
            This selector never recommends “the highest level”. A level is chosen for a defined
            boundary from the threat and the environment; the useful output is the question each
            scheme answers and what is still missing.
          </p>
        </Callout>
      </div>

      {/* Part A */}
      <section className="glass-panel space-y-4 p-5" aria-labelledby="selector-part-a">
        <h4 id="selector-part-a" className="font-semibold text-foreground">
          Part A — Customer applicability
        </h4>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FilterDropdown
            label="Customer"
            ariaLabel="Customer"
            items={ANCHOR_SCENARIO.customers.map((c) => ({ id: c.id, label: c.label }))}
            selectedId={customer}
            onSelect={(id) => isCustomer(id) && setCustomer(id)}
            hideDefaultOption
          />
          <div className="flex gap-2" role="group" aria-label="Delivery model">
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
        </div>

        <p className="text-sm text-foreground">
          <strong>{customerLabel(customer)} asks:</strong> “{profile.asks}”
        </p>

        <ul className="space-y-2" aria-label="Scheme applicability">
          {applicability.rows.map((row) => {
            const s = STATUS.get(row.status)
            const Icon = s?.icon ?? CircleHelp
            return (
              <li key={row.scheme} className="rounded-lg border border-border p-3">
                <p
                  className={`flex items-center gap-2 text-sm font-semibold ${s?.className ?? ''}`}
                >
                  <Icon size={16} aria-hidden="true" />
                  {row.scheme} — {s?.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{row.note}</p>
              </li>
            )
          })}
        </ul>

        {deployment === 'cloud' ? (
          <Callout tone="warning" title="Multi-tenant cloud offering">
            <p>{applicability.cloudNote}</p>
          </Callout>
        ) : null}

        <div>
          <p className="text-sm font-semibold text-foreground">
            Missing evidence and questions to ask first
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {applicability.clarify.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Part B */}
      <section className="glass-panel space-y-4 p-5" aria-labelledby="selector-part-b">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 id="selector-part-b" className="font-semibold text-foreground">
            Part B — Match each claim to the record that can answer it
          </h4>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filter === 'timed' ? 'gradient' : 'outline'}
              aria-pressed={filter === 'timed'}
              onClick={() => setFilter('timed')}
            >
              4 core claims
            </Button>
            <Button
              size="sm"
              variant={filter === 'all' ? 'gradient' : 'outline'}
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All {SELECTOR_CLAIMS.length} claims
            </Button>
          </div>
        </div>
        {isCustomer(filter) ? (
          <p className="text-xs text-muted-foreground">
            Showing the claims from the {customerLabel(filter).toLowerCase()}.
          </p>
        ) : null}

        <ol className="space-y-4">
          {claims.map((c, i) => {
            const chosen = answers[c.id]
            const done = chosen !== undefined
            const right = chosen === c.answer
            return (
              <li key={c.id} className="rounded-lg border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Claim {i + 1} · {customerLabel(c.customer)}
                </p>
                <p className="mt-1 text-sm text-foreground">“{c.claim}”</p>
                <div
                  className="mt-3 flex flex-wrap gap-2"
                  role="group"
                  aria-label={`Answer for claim ${i + 1}`}
                >
                  {SELECTOR_ANSWERS.map((a) => (
                    <Button
                      key={a.id}
                      size="sm"
                      variant={chosen === a.id ? 'gradient' : 'outline'}
                      aria-pressed={chosen === a.id}
                      onClick={() => setAnswers((prev) => ({ ...prev, [c.id]: a.id }))}
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
                {done ? (
                  <div className="mt-3" aria-live="polite">
                    <Callout
                      tone={right ? 'success' : 'error'}
                      title={
                        right
                          ? 'Right record'
                          : `Not that one — the answer is: ${SELECTOR_ANSWERS.find((a) => a.id === c.answer)?.label}`
                      }
                    >
                      <p>{c.why}</p>
                    </Callout>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>

        <p className="flex items-center gap-2 text-sm text-foreground" aria-live="polite">
          {answered.length === claims.length && claims.length > 0 ? (
            correct.length === claims.length ? (
              <CheckCircle2 size={16} className="text-status-success" aria-hidden="true" />
            ) : (
              <XCircle size={16} className="text-status-warning" aria-hidden="true" />
            )
          ) : null}
          {correct.length} of {claims.length} matched · {answered.length} answered
        </p>
      </section>
    </div>
  )
}
