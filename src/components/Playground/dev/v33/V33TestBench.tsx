// SPDX-License-Identifier: AGPL-3.0-only
//
// V33TestBench — Build › "v3.3 draft": a hands-on bench for the PKCS#11 v3.3
// working-draft features (plan C3; owner decision D5 put it under Build).
//
//  - a picker for all 30 composite parameter sets, each with the draft sizes
//    and live support from C_GetMechanismInfo (and, once run, from a real
//    generate/sign/encapsulate round trip);
//  - "run a set": a real round trip with sizes, timing and the call log;
//  - known-answer checks in the browser against the IETF LAMPS vectors, with
//    the vector source and commit on every row;
//  - external-µ and CKA_KEYS_REMAINING checks.
//
// It calls the same functions as the conformance runner's "v3.3 draft
// features" group (v33DraftFeatures.ts), so the two cannot disagree. Nothing
// assumes the engine has v3.3: a mechanism it does not advertise reads
// "not in this engine yet".
import { useCallback, useMemo, useState } from 'react'
import {
  BookOpen,
  ExternalLink,
  FlaskConical,
  Loader2,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useHsmContext } from '../../hsm/HsmContext'
import { MiniPkcsLog } from '../../components/MiniPkcsLog'
import {
  COMPOSITE_KEM_SETS,
  COMPOSITE_SIG_SETS,
  V33_DRAFT_NOTE,
  V33_MECHANISMS,
  compositeDisplayName,
  hsm_detectV33Support,
  isBrainpoolSet,
  type CompositeKemSet,
  type CompositeSigSet,
  type V33Support,
} from '@/wasm/softhsm/v33'
import {
  KEM_VECTOR_SOURCE,
  KEM_VECTOR_URL,
  SIG_VECTOR_SOURCE,
  SIG_VECTOR_URL,
  loadV33Vectors,
  roundTripKemSet,
  roundTripSigSet,
  runExternalMuChecks,
  runKeysRemainingChecks,
  runV33Kats,
  type V33CheckRow,
  type V33CheckStatus,
} from '@/wasm/pkcs11ConformanceRunner/v33DraftFeatures'

type Family = 'sig' | 'kem'
type AnySet = CompositeSigSet | CompositeKemSet

const STATUS_TEXT: Record<V33CheckStatus, string> = {
  pass: 'Pass',
  fail: 'Fail',
  'not-in-engine': 'Not in this engine yet',
  'not-supported': 'Not supported by this engine',
  'pending-engine': 'Pending engine update',
}

export function StatusBadge({ status }: { status: V33CheckStatus }) {
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold',
        status === 'pass' && 'bg-status-success/15 text-status-success',
        status === 'fail' && 'bg-destructive/15 text-destructive',
        status !== 'pass' && status !== 'fail' && 'bg-muted text-muted-foreground'
      )}
    >
      {STATUS_TEXT[status]}
    </span>
  )
}

export function V33ResultTable({ rows, caption }: { rows: V33CheckRow[]; caption: string }) {
  if (rows.length === 0) return null
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-[11.5px]">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/30 text-left text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5 font-semibold">Check</th>
            <th className="px-2 py-1.5 font-semibold">Result</th>
            <th className="px-2 py-1.5 font-semibold">Observed</th>
            <th className="px-2 py-1.5 font-semibold">Expected</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border align-top">
              <td className="px-2 py-1.5">
                <span className="text-foreground">{r.title}</span>
                {r.source && (
                  <span className="block text-[10.5px] text-muted-foreground">
                    Vectors: {r.source}
                  </span>
                )}
                {r.citation && (
                  <span className="block text-[10.5px] text-muted-foreground">{r.citation}</span>
                )}
              </td>
              <td className="px-2 py-1.5">
                <StatusBadge status={r.status} />
                {r.ms !== undefined && (
                  <span className="block text-[10px] text-muted-foreground">{r.ms} ms</span>
                )}
              </td>
              <td className="break-all px-2 py-1.5 font-mono text-[10.5px] text-foreground">
                {r.observed}
              </td>
              <td className="px-2 py-1.5 text-muted-foreground">{r.expected}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Live support of one set before any round trip: is its mechanism
 * advertised, and does its public key size fall in C_GetMechanismInfo's range. */
export const setSupportHint = (support: V33Support | null, family: Family, set: AnySet): string => {
  if (!support) return 'not checked yet'
  const gen = family === 'sig' ? support.mechs.compSigKeyGen : support.mechs.compKemKeyGen
  if (!gen.advertised) return 'not in this engine yet'
  const info = gen.info
  if (!info || (info.ulMinKeySize === 0 && info.ulMaxKeySize === 0)) return 'advertised'
  const inRange = set.publicKeyBytes >= info.ulMinKeySize && set.publicKeyBytes <= info.ulMaxKeySize
  return inRange
    ? `advertised (key ${info.ulMinKeySize}–${info.ulMaxKeySize} B)`
    : `outside the advertised key range ${info.ulMinKeySize}–${info.ulMaxKeySize} B`
}

const sizeText = (n: number, max: boolean) => `${max ? '≤' : ''}${n.toLocaleString()} B`

const lessonFor: Record<string, { id: string; label: string }> = {
  sig: { id: 'v33-composite-mldsa', label: 'Lesson C2: Composite ML-DSA' },
  kem: { id: 'v33-composite-mlkem', label: 'Lesson C3: Composite ML-KEM' },
  mu: { id: 'v33-external-mu', label: 'Lesson C4: External µ' },
  remaining: { id: 'v33-keys-remaining', label: 'Lesson C5: Counting signatures left' },
}

export function V33TestBench({
  onOpenLesson,
  onOpenConformance,
}: {
  onOpenLesson?: (lessonId: string) => void
  onOpenConformance?: () => void
}) {
  const hsm = useHsmContext()
  const [support, setSupport] = useState<V33Support | null>(null)
  const [family, setFamily] = useState<Family>('kem')
  const [selected, setSelected] = useState<number>(COMPOSITE_KEM_SETS[3].ckp)
  const [setRows, setSetRows] = useState<Record<string, V33CheckRow>>({})
  const [katRows, setKatRows] = useState<V33CheckRow[]>([])
  const [extraRows, setExtraRows] = useState<V33CheckRow[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sets: readonly AnySet[] = family === 'sig' ? COMPOSITE_SIG_SETS : COMPOSITE_KEM_SETS
  const current = useMemo(() => sets.find((s) => s.ckp === selected) ?? sets[0], [sets, selected])

  /** Boot the engine when needed and return a fresh support read. */
  const ready = useCallback(async () => {
    if (!hsm.moduleRef.current || !hsm.hSessionRef.current) {
      const ok = await hsm.autoInit()
      if (!ok)
        throw new Error(
          `Engine boot failed${hsm.lastInitErrorRef.current ? `: ${hsm.lastInitErrorRef.current}` : ''}.`
        )
    }
    const M = hsm.moduleRef.current!
    const s = hsm_detectV33Support(M, hsm.slotRef.current)
    setSupport(s)
    return { M, hSession: hsm.hSessionRef.current, support: s }
  }, [hsm])

  const run = async (what: string, fn: () => Promise<void>) => {
    setBusy(what)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  const roundTrip = (ctx: Awaited<ReturnType<typeof ready>>, f: Family, s: AnySet) =>
    f === 'sig'
      ? roundTripSigSet(ctx, s as CompositeSigSet)
      : roundTripKemSet(ctx, s as CompositeKemSet)

  const runOne = () =>
    run('set', async () => {
      const ctx = await ready()
      const r = roundTrip(ctx, family, current)
      setSetRows((p) => ({ ...p, [r.id]: r }))
    })

  const runAll = () =>
    run('all', async () => {
      const ctx = await ready()
      for (const f of ['kem', 'sig'] as const) {
        for (const s of f === 'sig' ? COMPOSITE_SIG_SETS : COMPOSITE_KEM_SETS) {
          const r = roundTrip(ctx, f, s)
          setSetRows((p) => ({ ...p, [r.id]: r }))
          await new Promise((res) => setTimeout(res, 0))
        }
      }
    })

  const runKats = () =>
    run('kat', async () => {
      const ctx = await ready()
      const vectors = await loadV33Vectors()
      setKatRows(runV33Kats(ctx, vectors))
    })

  const runExtras = () =>
    run('extras', async () => {
      const ctx = await ready()
      setExtraRows([...runExternalMuChecks(ctx), ...runKeysRemainingChecks(ctx)])
    })

  const rowFor = (f: Family, s: AnySet) => setRows[`v33.coverage.${f}.${s.ckpName}`]
  const selectedRow = rowFor(family, current)

  return (
    <div className="space-y-4" data-testid="v33-test-bench">
      <div className="flex items-start gap-2 rounded-lg border border-status-warning/40 bg-status-warning/10 p-3 text-[12px] leading-relaxed">
        <FlaskConical
          size={15}
          className="mt-0.5 shrink-0 text-status-warning"
          aria-hidden="true"
        />
        <div>
          <p className="font-semibold text-foreground">PKCS#11 v3.3 test bench (working draft)</p>
          <p className="text-muted-foreground">{V33_DRAFT_NOTE}</p>
        </div>
      </div>

      {/* Engine status */}
      <section className="rounded-xl border border-border bg-card p-3" aria-label="Engine support">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] font-semibold text-foreground">
            Engine support{' '}
            {support && (
              <span className="font-normal text-muted-foreground">
                · reports Cryptoki {support.cryptokiVersion ?? 'unknown'}
              </span>
            )}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            disabled={!!busy}
            onClick={() => run('detect', async () => void (await ready()))}
          >
            {busy === 'detect' ? <Loader2 size={12} className="animate-spin" /> : 'Detect'}
          </Button>
        </div>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {V33_MECHANISMS.map((m) => {
            const s = support?.mechs[m.key]
            return (
              <li
                key={m.key}
                className={cn(
                  'rounded border px-1.5 py-0.5 font-mono text-[10.5px]',
                  !s
                    ? 'border-border text-muted-foreground'
                    : s.advertised
                      ? 'border-status-success/40 text-status-success'
                      : 'border-border text-muted-foreground'
                )}
                title={
                  !s
                    ? 'Press Detect'
                    : s.advertised
                      ? `C_GetMechanismInfo flags 0x${(s.info?.flags ?? 0).toString(16)}`
                      : 'not in this engine yet'
                }
              >
                {m.name}
                {s && !s.advertised ? ' — not in this engine yet' : ''}
              </li>
            )
          })}
        </ul>
      </section>

      {/* Parameter-set picker */}
      <section
        className="rounded-xl border border-border bg-card p-3"
        aria-label="Composite parameter sets"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[12px] font-semibold text-foreground">Composite parameter sets</p>
          <div className="flex gap-1" role="tablist" aria-label="Composite family">
            {(
              [
                ['kem', `ML-KEM (${COMPOSITE_KEM_SETS.length})`],
                ['sig', `ML-DSA (${COMPOSITE_SIG_SETS.length})`],
              ] as const
            ).map(([f, label]) => (
              <Button
                key={f}
                size="sm"
                role="tab"
                aria-selected={family === f}
                variant={family === f ? 'default' : 'outline'}
                className="h-7 text-[11px]"
                onClick={() => {
                  setFamily(f)
                  setSelected((f === 'sig' ? COMPOSITE_SIG_SETS : COMPOSITE_KEM_SETS)[0].ckp)
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="ml-auto flex gap-1.5">
            <Button size="sm" className="h-7 gap-1 text-[11px]" disabled={!!busy} onClick={runOne}>
              {busy === 'set' ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <PlayCircle size={12} />
              )}
              Run selected set
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              disabled={!!busy}
              onClick={runAll}
            >
              {busy === 'all' ? <Loader2 size={12} className="animate-spin" /> : 'Probe all 30'}
            </Button>
          </div>
        </div>

        <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-border">
          <table className="w-full text-[11px]">
            <caption className="sr-only">
              Composite parameter sets with draft sizes and live support
            </caption>
            <thead className="sticky top-0 bg-muted/60 text-left text-muted-foreground">
              <tr>
                <th className="px-2 py-1 font-semibold">CKA_PARAMETER_SET</th>
                <th className="px-2 py-1 font-semibold">Components</th>
                <th className="px-2 py-1 font-semibold">Public key</th>
                <th className="px-2 py-1 font-semibold">
                  {family === 'sig' ? 'Signature' : 'Ciphertext'}
                </th>
                <th className="px-2 py-1 font-semibold">This engine</th>
              </tr>
            </thead>
            <tbody>
              {sets.map((s) => {
                const r = rowFor(family, s)
                return (
                  <tr
                    key={s.ckp}
                    className={cn(
                      'cursor-pointer border-t border-border',
                      s.ckp === current.ckp ? 'bg-primary/10' : 'hover:bg-muted/30'
                    )}
                    onClick={() => setSelected(s.ckp)}
                  >
                    <td className="px-2 py-1 font-mono">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="v33-set"
                          checked={s.ckp === current.ckp}
                          onChange={() => setSelected(s.ckp)}
                        />
                        {s.ckpName}
                        <span className="text-muted-foreground">
                          0x{s.ckp.toString(16).padStart(2, '0')}
                        </span>
                      </label>
                    </td>
                    <td className="px-2 py-1">
                      {compositeDisplayName(s)}
                      {isBrainpoolSet(s) && (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          (engines may omit)
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1 tabular-nums">
                      {sizeText(s.publicKeyBytes, s.publicKeyIsMax)}
                    </td>
                    <td className="px-2 py-1 tabular-nums">
                      {'signatureBytes' in s
                        ? sizeText(s.signatureBytes, s.signatureIsMax)
                        : sizeText(s.ciphertextBytes, false)}
                    </td>
                    <td className="px-2 py-1">
                      {r ? (
                        <StatusBadge status={r.status} />
                      ) : (
                        <span className="text-muted-foreground">
                          {setSupportHint(support, family, s)}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-[10.5px] text-muted-foreground">
          Sizes from draft-ietf-lamps-pq-composite-{family === 'sig' ? 'sigs-19' : 'kem-23'}{' '}
          Appendix A (≤ marks a maximum: RSA and ECDSA encodings vary by a few bytes).{' '}
          {current.draftName}, OID {current.oid}.
        </p>
        {selectedRow && (
          <div className="mt-2">
            <V33ResultTable rows={[selectedRow]} caption="Selected set result" />
          </div>
        )}
        {onOpenLesson && (
          <Button
            size="sm"
            variant="link"
            className="h-6 gap-1 px-0 text-[11px]"
            onClick={() => onOpenLesson(lessonFor[family].id)}
          >
            <BookOpen size={12} aria-hidden="true" /> {lessonFor[family].label}
          </Button>
        )}
      </section>

      {/* Known-answer checks */}
      <section
        className="rounded-xl border border-border bg-card p-3 space-y-2"
        aria-label="Known-answer checks"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[12px] font-semibold text-foreground">
            Known-answer checks (all 30 sets)
          </p>
          <Button
            size="sm"
            className="ml-auto h-7 gap-1 text-[11px]"
            disabled={!!busy}
            onClick={runKats}
          >
            {busy === 'kat' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ShieldCheck size={12} />
            )}
            Run known-answer checks
          </Button>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Imports each published key with C_CreateObject, then decapsulates the published ciphertext
          (KEM: the secret must equal the published k) or verifies the published signatures (with
          and without the context). Encapsulation and signing are randomised, so these vectors prove
          decapsulation and verification; the round trips above cover the other direction. Sources:{' '}
          <a
            href={KEM_VECTOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {KEM_VECTOR_SOURCE} <ExternalLink size={10} className="inline" aria-hidden="true" />
          </a>
          ,{' '}
          <a
            href={SIG_VECTOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {SIG_VECTOR_SOURCE} <ExternalLink size={10} className="inline" aria-hidden="true" />
          </a>
          . These are the draft authors&rsquo; vectors, not a certification body&rsquo;s.
        </p>
        <V33ResultTable rows={katRows} caption="Known-answer check results" />
      </section>

      {/* External µ + keys remaining */}
      <section
        className="rounded-xl border border-border bg-card p-3 space-y-2"
        aria-label="External mu and keys remaining"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[12px] font-semibold text-foreground">
            External µ and CKA_KEYS_REMAINING
          </p>
          <Button
            size="sm"
            className="ml-auto h-7 gap-1 text-[11px]"
            disabled={!!busy}
            onClick={runExtras}
          >
            {busy === 'extras' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <PlayCircle size={12} />
            )}
            Run checks
          </Button>
        </div>
        <V33ResultTable rows={extraRows} caption="External mu and keys remaining results" />
        {onOpenLesson && (
          <div className="flex flex-wrap gap-3">
            {(['mu', 'remaining'] as const).map((k) => (
              <Button
                key={k}
                size="sm"
                variant="link"
                className="h-6 gap-1 px-0 text-[11px]"
                onClick={() => onOpenLesson(lessonFor[k].id)}
              >
                <BookOpen size={12} aria-hidden="true" /> {lessonFor[k].label}
              </Button>
            ))}
          </div>
        )}
      </section>

      {onOpenConformance && (
        <p className="text-[11px] text-muted-foreground">
          The same checks, plus the error paths with their return codes and citations, run as the
          separate &ldquo;v3.3 draft features&rdquo; group in{' '}
          <Button
            size="sm"
            variant="link"
            className="h-auto p-0 text-[11px]"
            onClick={onOpenConformance}
          >
            Build › Conformance
          </Button>
          , kept apart from the v3.2 results.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded border border-destructive/40 bg-destructive/5 p-2 text-[11.5px] text-destructive"
        >
          {error}
        </p>
      )}

      <MiniPkcsLog title="Calls made by the bench" />
    </div>
  )
}
