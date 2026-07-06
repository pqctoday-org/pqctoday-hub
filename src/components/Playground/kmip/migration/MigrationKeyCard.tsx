// SPDX-License-Identifier: GPL-3.0-only
//
// One estate key card: generate LABEL-ONLY, then drive that key's real
// crypto by hand. Every input AND output is an editable field — edit a
// signature or a ciphertext and re-verify/decrypt to watch it fail; that
// tamper path is a feature, not an error state.

import { useCallback, useState } from 'react'
import {
  KeyRound,
  Loader2,
  Lock,
  LockOpen,
  PenLine,
  BadgeCheck,
  ShieldAlert,
  ShieldCheck,
  Handshake,
} from 'lucide-react'
import { ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AuditEvent, KmipEngine, OpResult } from '@/wasm/kmip/kmipEngine'
import { getRandomBytes, arrayBufferToHex } from '@/utils/webCrypto'
import type { MigrationKeyConfig } from './migrationKeys'

interface Props {
  config: MigrationKeyConfig
  engine: KmipEngine
  /** Called after any op that changed the keystore (estate summary refresh). */
  onKeystoreChange: () => void
  /** The policy mode active right now — every op this card runs is tagged with
   * it in the card's own KMIP log so you can compare classical vs hybrid vs
   * full-PQC runs of the SAME operation, in place. */
  activeMode: 'classical' | 'hybrid' | 'pqc'
  /** Reset epoch — bump to clear the card back to "not generated". */
  epoch: number
}

/** One KMIP operation's audit trail on this card, tagged with the mode it ran
 * under. */
interface CardLogEntry {
  op: string
  mode: 'classical' | 'hybrid' | 'pqc'
  ok: boolean
  message: string | null
  events: AuditEvent[]
}

const MODE_LABEL: Record<CardLogEntry['mode'], string> = {
  classical: 'Classical',
  hybrid: 'Hybrid',
  pqc: 'Full PQC',
}

interface KeyIds {
  priv: string
  pub: string
}

const fieldCls =
  'w-full rounded-md border border-border bg-background p-2 font-mono text-[11px] leading-snug ' +
  'focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50'

const labelCls = 'text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground'

/** Editable field with a tiny label — the tab's editable-everything contract. */
function Field({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
  testId,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  testId?: string
}) {
  return (
    <div className="space-y-1">
      <span className={labelCls}>{label}</span>
      <textarea
        className={fieldCls}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        spellCheck={false}
      />
    </div>
  )
}

export function MigrationKeyCard({ config, engine, onKeystoreChange, activeMode, epoch }: Props) {
  const [label, setLabel] = useState(config.defaultLabel)
  const [ids, setIds] = useState<KeyIds | null>(null)
  const [algorithm, setAlgorithm] = useState<string | null>(null)
  const [quantumSafe, setQuantumSafe] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  // Editable crypto fields (inputs AND outputs).
  const [plaintext, setPlaintext] = useState('the customer record to protect')
  const [ciphertext, setCiphertext] = useState('') // ct ‖ GCM tag, hex
  const [iv, setIv] = useState('')
  const [decrypted, setDecrypted] = useState<string | null>(null)
  const [message, setMessage] = useState('approve build 2026-07-05')
  const [signature, setSignature] = useState('')
  const [verdict, setVerdict] = useState<string | null>(null)
  const [kemCiphertext, setKemCiphertext] = useState('')
  const [secretA, setSecretA] = useState('')
  const [secretB, setSecretB] = useState('')
  // This card's own KMIP log — one flat, chronological list of every op this
  // key ran, each tagged with the mode it ran under. Lives IN the tile so the
  // log is unambiguously tied to this use case.
  const [opLog, setOpLog] = useState<CardLogEntry[]>([])

  // Reset epoch: parent bumps after "Reset estate".
  const [seenEpoch, setSeenEpoch] = useState(epoch)
  if (epoch !== seenEpoch) {
    setSeenEpoch(epoch)
    setIds(null)
    setAlgorithm(null)
    setQuantumSafe(null)
    setError(null)
    setNote(null)
    setCiphertext('')
    setIv('')
    setDecrypted(null)
    setSignature('')
    setVerdict(null)
    setKemCiphertext('')
    setSecretA('')
    setSecretB('')
    setOpLog([])
  }

  /** Run one op; surface engine refusals as the card's error line and append
   * the op's audit trail to THIS card's log (tagged with the active mode). */
  const run = useCallback(
    (spec: Parameters<KmipEngine['runOp']>[0]): OpResult | null => {
      const r = engine.runOp(spec)
      setOpLog((log) => [
        ...log,
        { op: spec.op, mode: activeMode, ok: r.ok, message: r.message, events: r.audit ?? [] },
      ])
      if (!r.ok) {
        setError(r.message ?? `${spec.op} failed`)
        return null
      }
      return r
    },
    [engine, activeMode],
  )

  /** Re-resolve this card's key by its LABEL and update the shown algorithm +
   * risk badge + op uids. The label survives a crypto-agility rekey (the
   * engine copies it onto the successor), so this is how the card FOLLOWS its
   * key across a migration: after a rekey-on-use the old key is Deactivated and
   * a new Active key carries the same label. Returns the algorithm now in force
   * so the caller can narrate a change. */
  const resyncByLabel = useCallback((): string | null => {
    const objs = engine.listObjects()
    const activeWith = (t: string) =>
      objs.find((o) => o.name === label && o.state === 'Active' && o.objectType === t)
    if (config.kind === 'symmetric') {
      const rec = activeWith('SymmetricKey')
      if (!rec) return null
      setAlgorithm(rec.algorithm)
      setQuantumSafe(rec.quantumSafe)
      setIds({ priv: rec.uid, pub: rec.uid })
      return rec.algorithm
    }
    const priv = activeWith('PrivateKey')
    const pub = activeWith('PublicKey')
    if (!priv) return null
    setAlgorithm(priv.algorithm)
    setQuantumSafe(priv.quantumSafe)
    setIds({ priv: priv.uid, pub: pub?.uid ?? priv.uid })
    return priv.algorithm
  }, [engine, label, config.kind])

  const withBusy = useCallback(
    (fn: () => void) => {
      setBusy(true)
      setError(null)
      setNote(null)
      const before = algorithm
      try {
        fn()
      } catch (e) {
        setError(String(e))
      } finally {
        // Follow the key across any rekey the op triggered, and narrate a
        // migration when the algorithm actually changed.
        const after = resyncByLabel()
        if (after && before && after !== before) {
          setNote(`migrated ${before} ➜ ${after} — old key deactivated, label carried over`)
        }
        setBusy(false)
        onKeystoreChange()
      }
    },
    [onKeystoreChange, resyncByLabel, algorithm],
  )

  const refreshFromStore = useCallback(
    (privUid: string) => {
      const rec = engine.listObjects().find((o) => o.uid === privUid)
      if (rec) {
        setAlgorithm(rec.algorithm)
        setQuantumSafe(rec.quantumSafe)
      }
    },
    [engine],
  )

  // ── Generate: label-only — no algorithm, no length, no curve ─────────────
  const onGenerate = () =>
    withBusy(() => {
      if (config.kind === 'symmetric') {
        const r = run({ op: 'Create', name: label })
        if (!r) return
        const uid = String(r.summary.uid)
        const act = run({ op: 'Activate', uid })
        if (!act) return
        setIds({ priv: uid, pub: uid })
        refreshFromStore(uid)
      } else {
        const r = run({
          op: 'CreateKeyPair',
          intent: config.kind === 'kem' ? 'kem' : 'sign',
          name: label,
        })
        if (!r) return
        const priv = String(r.summary.privateKeyUid)
        const pub = String(r.summary.publicKeyUid)
        if (!run({ op: 'Activate', uid: priv })) return
        if (!run({ op: 'Activate', uid: pub })) return
        setIds({ priv, pub })
        refreshFromStore(priv)
      }
      setNote('generated + activated — the algorithm above was the policy’s choice, not ours')
    })

  // ── Symmetric ops ─────────────────────────────────────────────────────────
  const onEncrypt = () =>
    withBusy(() => {
      if (!ids) return
      const ivHex = arrayBufferToHex(getRandomBytes(12).buffer as ArrayBuffer)
      const r = run({ op: 'Encrypt', uid: ids.priv, text: plaintext, ivHex })
      if (!r) return
      const ct = String(r.summary.ciphertextHex ?? '') + String(r.summary.tagHex ?? '')
      setCiphertext(ct)
      setIv(String(r.summary.ivHex ?? ivHex))
      setDecrypted(null)
    })

  const onDecrypt = () =>
    withBusy(() => {
      if (!ids) return
      const r = run({ op: 'Decrypt', uid: ids.priv, data: ciphertext.trim(), ivHex: iv.trim() })
      if (!r) {
        setDecrypted(null)
        setNote('decrypt refused — an edited ciphertext or IV fails the AES-GCM integrity check')
        return
      }
      const hex = String(r.summary.plaintextHex ?? '')
      const bytes = hex.match(/../g)?.map((h) => parseInt(h, 16)) ?? []
      setDecrypted(new TextDecoder().decode(Uint8Array.from(bytes)))
    })

  // ── Signing ops ───────────────────────────────────────────────────────────
  const onSign = () =>
    withBusy(() => {
      if (!ids) return
      const r = run({ op: 'Sign', uid: ids.priv, text: message })
      if (!r) return
      setSignature(String(r.summary.signatureHex ?? ''))
      setVerdict(null)
    })

  const onVerify = () =>
    withBusy(() => {
      if (!ids) return
      const r = run({
        op: 'SignatureVerify',
        uid: ids.pub,
        text: message,
        signature: signature.trim(),
      })
      if (!r) return
      const v = String(r.summary.validity ?? '')
      setVerdict(
        /Valid/.test(v)
          ? 'valid — signature matches this exact message'
          : 'INVALID — the message or signature was changed since signing',
      )
    })

  // ── Key-agreement ops ─────────────────────────────────────────────────────
  const secretOf = (uid: string): string => {
    const g = run({ op: 'Get', uid })
    return g ? String(g.summary.keyMaterialHex ?? '') : ''
  }

  const onEstablish = () =>
    withBusy(() => {
      if (!ids) return
      const r = run({ op: 'Encapsulate', uid: ids.pub })
      if (!r) return
      setKemCiphertext(String(r.summary.ciphertextHex ?? ''))
      setSecretA(secretOf(String(r.summary.uid)))
      setSecretB('')
    })

  const onDecapsulate = () =>
    withBusy(() => {
      if (!ids) return
      const r = run({ op: 'Decapsulate', uid: ids.priv, data: kemCiphertext.trim() })
      if (!r) return
      setSecretB(secretOf(String(r.summary.uid)))
    })

  const secretsMatch = secretA !== '' && secretB !== '' && secretA === secretB

  const KindIcon = config.kind === 'symmetric' ? Lock : config.kind === 'kem' ? Handshake : PenLine

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 space-y-3"
      data-testid={`migration-card-${config.id}`}
    >
      {/* header: label (editable) + risk badge */}
      <div className="flex items-start gap-2">
        <KindIcon size={15} className="mt-1 shrink-0 text-primary" />
        <div className="min-w-0 flex-1 space-y-1">
          <input
            className={cn(fieldCls, 'p-1.5 text-xs font-semibold')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={ids !== null}
            aria-label="Key label"
            data-testid={`migration-label-${config.id}`}
          />
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {config.operation}
          </p>
          <p className="text-[11px] text-muted-foreground">{config.blurb}</p>
        </div>
        {quantumSafe !== null &&
          (quantumSafe ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-status-success/10 px-2 py-0.5 text-[10px] font-semibold text-status-success">
              <ShieldCheck size={11} /> quantum-safe
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-status-error/10 px-2 py-0.5 text-[10px] font-semibold text-status-error">
              <ShieldAlert size={11} /> at risk
            </span>
          ))}
      </div>

      {/* generate + resolved algorithm */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant={ids ? 'outline' : 'default'}
          className="h-7 gap-1.5 px-2.5 text-[11px]"
          onClick={onGenerate}
          disabled={busy || ids !== null}
          data-testid={`migration-generate-${config.id}`}
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
          Generate (label only)
        </Button>
        {algorithm && (
          <span
            className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary"
            data-testid={`migration-algo-${config.id}`}
          >
            policy chose {algorithm}
          </span>
        )}
      </div>

      {/* per-kind operate area — every field editable */}
      {ids && config.kind === 'symmetric' && (
        <div className="space-y-2">
          <Field label="Data to encrypt" value={plaintext} onChange={setPlaintext} testId={`migration-plaintext-${config.id}`} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-[11px]" onClick={onEncrypt} disabled={busy}>
              <Lock size={12} /> Encrypt
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-[11px]" onClick={onDecrypt} disabled={busy || !ciphertext}>
              <LockOpen size={12} /> Decrypt
            </Button>
          </div>
          {(ciphertext || iv) && (
            <>
              <Field label="Ciphertext + tag (hex — edit me and try Decrypt)" value={ciphertext} onChange={setCiphertext} rows={3} testId={`migration-ciphertext-${config.id}`} />
              <Field label="IV (hex)" value={iv} onChange={setIv} rows={1} />
            </>
          )}
          {decrypted !== null && (
            <p className="text-[11px]">
              <span className={labelCls}>Decrypted → </span>
              <span className="font-mono">{decrypted}</span>
            </p>
          )}
        </div>
      )}

      {ids && config.kind === 'sign' && (
        <div className="space-y-2">
          <Field label="Message to sign" value={message} onChange={setMessage} testId={`migration-message-${config.id}`} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-[11px]" onClick={onSign} disabled={busy}>
              <PenLine size={12} /> Sign
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-[11px]" onClick={onVerify} disabled={busy || !signature}>
              <BadgeCheck size={12} /> Verify
            </Button>
          </div>
          {signature && (
            <Field label="Signature (hex — edit me and try Verify)" value={signature} onChange={setSignature} rows={3} testId={`migration-signature-${config.id}`} />
          )}
          {verdict && (
            <p
              className={cn(
                'text-[11px] font-medium',
                verdict.startsWith('valid') ? 'text-status-success' : 'text-status-error',
              )}
              data-testid={`migration-verdict-${config.id}`}
            >
              {verdict}
            </p>
          )}
        </div>
      )}

      {ids && config.kind === 'kem' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-[11px]" onClick={onEstablish} disabled={busy}>
              <Handshake size={12} /> Establish shared secret
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-[11px]" onClick={onDecapsulate} disabled={busy || !kemCiphertext}>
              <LockOpen size={12} /> Decapsulate
            </Button>
          </div>
          {kemCiphertext && (
            <Field label="KEM ciphertext (hex — edit me and try Decapsulate)" value={kemCiphertext} onChange={setKemCiphertext} rows={2} testId={`migration-kemct-${config.id}`} />
          )}
          {secretA && (
            <Field label="Shared secret · encapsulator (hex)" value={secretA} onChange={setSecretA} rows={2} />
          )}
          {secretB && (
            <>
              <Field label="Shared secret · decapsulator (hex)" value={secretB} onChange={setSecretB} rows={2} />
              <p
                className={cn(
                  'text-[11px] font-medium',
                  secretsMatch ? 'text-status-success' : 'text-status-error',
                )}
                data-testid={`migration-kem-match-${config.id}`}
              >
                {secretsMatch
                  ? 'secrets match — both sides derived the same key'
                  : 'secrets DIFFER — an edited ciphertext derives a different key'}
              </p>
            </>
          )}
        </div>
      )}

      {note && !error && <p className="text-[10.5px] text-muted-foreground">{note}</p>}
      {error && (
        <p className="text-[11px] text-status-error" data-testid={`migration-error-${config.id}`}>
          {error}
        </p>
      )}

      {/* This use-case's own KMIP log — flat + chronological, each op tagged
          with the mode it ran under. */}
      {opLog.length > 0 && (
        <details className="rounded-lg border border-border bg-background" data-testid={`migration-log-${config.id}`}>
          <summary className="cursor-pointer select-none px-2.5 py-1.5 text-[11px] font-medium">
            <ScrollText size={12} className="mr-1 inline text-primary" />
            KMIP log
            <span className="ml-1.5 font-normal text-muted-foreground">
              — {opLog.length} operation{opLog.length === 1 ? '' : 's'} on this key
            </span>
          </summary>
          <ol className="space-y-1 px-2.5 pb-2.5 pt-1">
            {opLog.map((e, i) => (
              <li key={i} className="rounded border border-border/60 bg-card p-1.5 text-[10.5px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-primary/10 px-1 py-0.5 text-[9px] font-semibold text-primary">
                    {MODE_LABEL[e.mode]}
                  </span>
                  <span className="font-mono font-semibold text-foreground">{e.op}</span>
                  <span
                    className={cn(
                      'rounded px-1 py-0.5 text-[9px] font-semibold',
                      e.ok
                        ? 'bg-status-success/15 text-status-success'
                        : 'bg-status-error/15 text-status-error',
                    )}
                  >
                    {e.ok ? 'OK' : 'refused'}
                  </span>
                  {!e.ok && e.message && <span className="text-status-error">{e.message}</span>}
                </div>
                {e.events.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 font-mono text-[9.5px] text-muted-foreground">
                    {e.events.map((ev, j) => (
                      <span
                        key={j}
                        className="rounded bg-muted px-1 py-0.5"
                        title={JSON.stringify(ev.event)}
                      >
                        {({ p1: 'policy', p2: 'kmip', p3: 'pkcs11' } as Record<string, string>)[
                          ev.plane
                        ] ?? ev.plane}
                        :{String(ev.event.type ?? '?')}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  )
}
