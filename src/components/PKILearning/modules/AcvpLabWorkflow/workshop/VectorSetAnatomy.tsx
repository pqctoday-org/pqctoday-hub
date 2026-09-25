// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { CheckCircle2, FileSearch, Loader2, XCircle } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { preparePrompt, type PrepareResult } from '@/services/acvp/run'
import { identifyKnownFixture } from '@/services/acvp/evidence'
import type { AcvpTestGroupIR, JsonValue } from '@/services/acvp/ir'
import { groupOutcomes, type Prediction } from './workshopLogic'
import { PUBLIC_FIXTURES, PUBLIC_FIXTURE_IDS, type PublicFixtureId } from '../data/publicFixtures'

const PREDICTIONS: { id: Prediction; label: string }[] = [
  { id: 'executes', label: 'Every test executes' },
  { id: 'partly', label: 'Some tests execute' },
  { id: 'unsupported', label: 'Unsupported — no PKCS#11 path' },
]

/** Group properties worth showing (everything except ids and the tests array). */
const groupFacts = (g: AcvpTestGroupIR): [string, JsonValue][] =>
  Object.entries(g.properties).filter(([k]) => k !== 'tgId' && k !== 'tests')

const truncate = (v: JsonValue): string => {
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  return s.length > 40 ? `${s.slice(0, 40)}… (${s.length} chars)` : s
}

/**
 * Workshop step 2 — open a public NIST ACVP-Server sample vector set with the
 * same parser the Hub's ACVP-format prototype uses (preparePrompt → IR →
 * execution plan), then predict, group by group, whether a PKCS#11 v3.2
 * interface can answer it. No engine runs here: the plan is engine-independent.
 */
export const VectorSetAnatomy: React.FC = () => {
  const [fixtureId, setFixtureId] = useState<PublicFixtureId>('ML-KEM-encapDecap-FIPS203')
  const [loading, setLoading] = useState(false)
  const [prepared, setPrepared] = useState<PrepareResult | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({})

  const load = async (id: PublicFixtureId) => {
    setFixtureId(id)
    setLoading(true)
    setPrepared(null)
    setLoadError(null)
    setPredictions({})
    try {
      setPrepared(await preparePrompt(await PUBLIC_FIXTURES[id].loadPrompt()))
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const ok = prepared?.ok ? prepared : null
  const outcomes = useMemo(() => (ok ? groupOutcomes(ok.plan.items) : null), [ok])
  const known = ok ? identifyKnownFixture(ok.promptSha256) : null
  const predicted = Object.keys(predictions).length
  const right = outcomes
    ? Object.entries(predictions).filter(([tg, p]) => outcomes.get(Number(tg))?.actual === p).length
    : 0

  return (
    <div className="space-y-4">
      <div className="glass-panel space-y-3 p-4 text-sm">
        <p className="text-foreground/80">
          Load one of the two public NIST ACVP-Server sample vector sets the Hub pins. It is parsed
          by the same code the Hub’s ACVP-format prototype uses, into the prompt’s own structure:
          one vector set (<code>vsId</code>), its test groups (<code>tgId</code>) and their test
          cases (<code>tcId</code>). Then decide, for each group, whether a PKCS#11 v3.2 interface
          can carry the inputs that group supplies.
        </p>
        <div role="group" aria-label="Public sample vector set" className="flex flex-wrap gap-2">
          {PUBLIC_FIXTURE_IDS.map((id) => (
            <Button
              key={id}
              size="sm"
              variant={fixtureId === id && (ok || loading) ? 'secondary' : 'outline'}
              aria-pressed={fixtureId === id && Boolean(ok || loading)}
              disabled={loading}
              onClick={() => void load(id)}
            >
              {loading && fixtureId === id ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <FileSearch className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              )}
              Load {PUBLIC_FIXTURES[id].label}
            </Button>
          ))}
        </div>
        {loadError ? (
          <p role="alert" className="text-status-error">
            Could not load the sample: {loadError}
          </p>
        ) : null}
        {prepared && !prepared.ok ? (
          <p role="alert" className="text-status-error">
            The parser rejected the sample: {prepared.diagnostics[0]?.reason}
          </p>
        ) : null}
      </div>

      {ok && outcomes ? (
        <>
          <div className="glass-panel space-y-1 p-4 text-xs" data-testid="vector-set-header">
            <p className="text-sm font-semibold text-foreground">
              {ok.schema.algorithm} / {ok.schema.mode} / {ok.schema.revision} · vsId {ok.ir.vsId}
            </p>
            <p className="text-muted-foreground">
              Framing: {ok.ir.framing === 'envelope' ? 'ACVTS envelope' : 'bare vector set'}
              {ok.ir.acvVersion ? ` (acvVersion ${ok.ir.acvVersion})` : ''} ·{' '}
              {ok.ir.testGroups.length} test groups · {ok.plan.items.length} test cases · isSample:{' '}
              {String(ok.ir.vectorSet.isSample)}
            </p>
            <p className="break-all text-muted-foreground">
              Prompt SHA-256 <code>{ok.promptSha256}</code>
            </p>
            <p className={known ? 'text-status-success' : 'text-status-warning'}>
              {known
                ? `Matches the pinned public sample ${known.upstreamPath} at ACVP-Server commit ${known.commit.slice(0, 7)} — evidence class: NIST ACVP-Server reference sample.`
                : 'Matches no pinned public sample.'}
            </p>
            <p className="text-muted-foreground">
              Note the isSample value: provenance comes from the hash match, not from any flag
              inside the file.
            </p>
          </div>

          <p className="text-xs text-muted-foreground" aria-live="polite">
            {predicted} of {ok.ir.testGroups.length} groups predicted · {right} correct
          </p>

          {ok.ir.testGroups.map((g) => {
            const o = outcomes.get(g.tgId)
            const p = predictions[g.tgId]
            return (
              <article
                key={g.tgId}
                className="glass-panel space-y-2 p-4"
                aria-labelledby={`tg-${g.tgId}`}
                data-testid={`tg-${g.tgId}`}
              >
                <h3 id={`tg-${g.tgId}`} className="text-sm font-semibold text-foreground">
                  tgId {g.tgId} · {g.testType} · {g.tests.length} test cases
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2">
                  {groupFacts(g).map(([k, v]) => (
                    <div key={k} className="flex gap-1">
                      <dt className="text-muted-foreground">{k}:</dt>
                      <dd className="font-mono text-foreground">{truncate(v)}</dd>
                    </div>
                  ))}
                  <div className="flex gap-1 sm:col-span-2">
                    <dt className="text-muted-foreground">test case fields:</dt>
                    <dd className="font-mono text-foreground">
                      {Object.keys(g.tests[0]?.fields ?? {}).join(', ')}
                    </dd>
                  </div>
                </dl>
                <div
                  role="group"
                  aria-label={`Prediction for tgId ${g.tgId}`}
                  className="flex flex-wrap gap-1.5"
                >
                  {PREDICTIONS.map((opt) => (
                    <Button
                      key={opt.id}
                      size="sm"
                      variant={p === opt.id ? 'secondary' : 'outline'}
                      aria-pressed={p === opt.id}
                      disabled={p !== undefined}
                      onClick={() => setPredictions((x) => ({ ...x, [g.tgId]: opt.id }))}
                      className="text-xs"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                {p !== undefined && o ? (
                  <div
                    className={clsx(
                      'space-y-1 rounded-md border p-3 text-xs',
                      p === o.actual
                        ? 'border-status-success/40 bg-status-success/10'
                        : 'border-status-error/40 bg-status-error/10'
                    )}
                  >
                    <p className="flex items-center gap-1.5 font-semibold text-foreground">
                      {p === o.actual ? (
                        <CheckCircle2
                          size={14}
                          className="text-status-success"
                          aria-hidden="true"
                        />
                      ) : (
                        <XCircle size={14} className="text-status-error" aria-hidden="true" />
                      )}
                      {o.execute} executable · {o.unsupported} unsupported
                    </p>
                    {o.reasons.map((r) => (
                      <p key={r} className="text-foreground/80">
                        {r}
                      </p>
                    ))}
                    {o.unsupported === 0 ? (
                      <p className="text-foreground/80">
                        Every input this group supplies has a PKCS#11 v3.2 route, so every case is
                        handed to the engine — which can still return an error or report the
                        mechanism as not advertised.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            )
          })}
        </>
      ) : null}
    </div>
  )
}
