// SPDX-License-Identifier: GPL-3.0-only
//
// KmipPlaygroundView — the in-browser crypto-agile KMIP 3.0 playground. Drives
// the pqctoday-kmip control plane + softhsmrustv3 engine, compiled to wasm and
// running entirely in this tab (no server, no Docker). Three planes, guided:
//
//   Plane 1 · Agility  — pick a policy; watch the same ops get allowed,
//                        denied, or auto-rekeyed.
//   Plane 2 · KMIP     — Create → Activate → Sign/Verify (or Encap/Decap),
//                        each a REAL KMIP request; see the TTLV wire response.
//   Plane 3 · PKCS#11  — the keystore the engine actually populated, plus the
//                        cross-plane audit trail every op emits.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  Cpu,
  KeyRound,
  ScrollText,
  Play,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  SkipForward,
  RotateCcw,
  Wand2,
  ShieldCheck,
  Layers,
  Info,
  Route,
  Sparkles,
  Ban,
  ArrowRight,
  Workflow,
  Clock,
  BookOpen,
  X,
  Code2,
} from 'lucide-react'
import { MarkdownView } from '@/components/ui/MarkdownView'
import { Button } from '@/components/ui/button'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { usePersonaStore } from '@/store/usePersonaStore'
import { cn } from '@/lib/utils'
import {
  getKmipEngine,
  decisionOf,
  type KmipEngine,
  type OpResult,
  type OpSpec,
  type KmipObject,
  type AuditEvent,
  type PolicyStatus,
} from '@/wasm/kmip/kmipEngine'
import { ALGORITHMS, AUTO_ALGO, POLICY_PRESETS, type PolicyPreset } from '@/wasm/kmip/kmipMeta'
import { arrayBufferToHex, getRandomBytes } from '@/utils/webCrypto'
import { PolicyControlStrip } from './PolicyControlStrip'
import { PolicyScenario } from './PolicyScenario'
import { Inspector } from './Inspector'
import { PolicyView } from './PolicyView'
import { Kmip3View } from './Kmip3View'
import { MigrationView } from './migration/MigrationView'
import { AgilityStoryPanel } from './AgilityStoryPanel'
import { loadCacpSession, saveCacpPresetSession, saveCacpDraft } from './cacpSessionStorage'
import {
  useLessonsTour,
  LessonsHub,
  TourOverlay,
  clickByText,
  dragRangeToMax,
  type Lesson,
} from './LessonsTour'

/** Jargon glossary (A-grade review item #8) — hover/focus definitions for the
 * three protocol acronyms a first-time visitor hits in the very first
 * sentence, before anything else on the page explains them. Native `<abbr
 * title>` — no extra dependency, keyboard-focusable, works with a screen
 * reader's "expand abbreviation" behavior for free. */
const GLOSSARY = {
  KMIP: 'Key Management Interoperability Protocol — the standard wire protocol for talking to a key manager / HSM.',
  'PKCS#11':
    'The "Cryptoki" C API applications use to drive an HSM; the engine speaks it under the hood.',
  HSM: 'Hardware Security Module — tamper-resistant hardware that generates and guards keys.',
} as const
function Term({ t }: { t: keyof typeof GLOSSARY }) {
  return (
    <abbr
      // eslint-disable-next-line security/detect-object-injection -- `t` is typed `keyof typeof GLOSSARY`, a closed 3-value literal union, never user input.
      title={GLOSSARY[t]}
      className="cursor-help border-b border-dotted border-muted-foreground/60 no-underline"
    >
      {t}
    </abbr>
  )
}

/** Top-level surface of the CACP playground. */
type Plane = 'agility' | 'policy' | 'kmip3' | 'migration'

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Progressive-disclosure mode. Guided = newcomer (hides the wire, raw bytes,
 * secondary KMIP ops, PKCS#11 mechanism strings, and keystore UIDs; shows a
 * plain-English "what this means" callout). Expert = full fidelity. */
type ViewMode = 'guided' | 'expert'

const readMode = (): ViewMode => {
  try {
    return localStorage.getItem('cacp-mode') === 'expert' ? 'expert' : 'guided'
  } catch {
    return 'guided'
  }
}

const readWhyDismissed = (): boolean => {
  try {
    return localStorage.getItem('cacp-why-dismissed') === '1'
  } catch {
    return false
  }
}

/** A synthetic failed [`OpResult`] for surfacing a thrown engine error (a wasm
 * panic comes back as a JS Error; a malformed return throws in `JSON.parse`).
 * Without this the catch-less call sites would swallow the throw and leave the
 * UI showing a stale result. */
function engineError(operation: string, err: unknown): OpResult {
  return {
    ok: false,
    operation,
    status: 'Error',
    resultReason: null,
    message: err instanceof Error ? err.message : String(err),
    summary: {},
    responseWireHex: '',
    responseWireLen: 0,
    responseTree: { tag: '', type: '' },
    audit: [],
  }
}

/** A synthetic [`OpResult`] for an algorithm `kmipMeta.isRunnable` marks
 * non-runnable — no KMIP request is even attempted. Distinct from a policy
 * `Deny` (the policy forbids it) or an engine `Error` (a real request that
 * failed) — this is "the tool can't do this at all" (A-grade review A1). */
function skipResult(algo: string): OpResult {
  return {
    ok: false,
    operation: 'CreateKeyPair',
    status: 'Skip',
    resultReason: null,
    message: `${algo} is real PQC vocabulary a policy can reference (allow/denylist it, gate on it) — but this in-browser engine doesn't implement it, so no key can actually be created. Pick a runnable algorithm to drive the lifecycle by hand.`,
    summary: {},
    responseWireHex: '',
    responseWireLen: 0,
    responseTree: { tag: '', type: '' },
    audit: [],
  }
}

/** Friendly one-liner describing what an op result means. */
function narrate(r: OpResult): string {
  const s = r.summary
  if (r.status === 'Skip') return r.message ?? 'Not runnable in this browser engine.'
  if (!r.ok) return r.message ? `Refused: ${r.message}` : 'Operation failed.'
  switch (r.operation) {
    case 'CreateKeyPair':
      return `Generated a key pair. Private ${str(s.privateKeyUid).slice(0, 28)}…, public ${str(s.publicKeyUid).slice(0, 28)}….`
    case 'Create':
      return `Created a ${str(s.objectType)} (${str(s.uid).slice(0, 28)}…).`
    case 'Activate':
      return `Activated — the key is now ${str(s.state)} and usable.`
    case 'Sign':
      return `Signed your message. Signature is ${Number(s.signatureLen) || 0} bytes.`
    case 'SignatureVerify':
      return `Signature verification result: ${str(s.validity)}.`
    case 'Encapsulate':
      return `Encapsulated a shared secret — ${Number(s.ciphertextLen) || 0}-byte ciphertext for the private-key holder.`
    case 'Decapsulate':
      return `Decapsulated — the same shared secret is re-derived from the ciphertext.`
    case 'Encrypt':
      return `Encrypted your message with AES-GCM — ${str(s.ciphertextHex).length / 2} bytes of ciphertext + a ${str(s.tagHex).length / 2}-byte authentication tag.`
    case 'Decrypt':
      return `Decrypted — recovered the original message.`
    case 'Query':
      return `Server reports vendor "${str(s.vendorIdentification)}" and ${Number(s.operationCount) || 0} supported operations.`
    case 'Locate':
      return `Located ${(s.uids as unknown[] | undefined)?.length ?? 0} object(s).`
    case 'Revoke':
    case 'Destroy':
      return `${r.operation} → object is now ${str(s.state)}.`
    default:
      return 'Done.'
  }
}

/** Guided-mode "what this means" — one extra sentence of context tying the raw
 * result back to the crypto-agility story. Returns null when there's nothing
 * useful to add (so the callout doesn't render an empty box). */
/** KMIP 3.0 §9.2 ResultReason wire codepoint for WrongKeyLifecycleState
 * (0x43) — a base-protocol lifecycle gate, not a Plane-1 policy decision, so
 * `decisionOf` sees no `PolicyDecided` audit event for it at all. */
const WRONG_KEY_LIFECYCLE_STATE = 0x43

function whatThisMeans(r: OpResult): string | null {
  if (r.status === 'Skip')
    return 'Not a policy denial — the algorithm itself has no implementation here. A real appliance (or a different demo scoped to it) would actually run this.'
  if (!r.ok && r.operation === 'Sign' && r.resultReason === WRONG_KEY_LIFECYCLE_STATE)
    return "This is refused before the policy even runs — Sign requires an Active key by protocol, and Revoke just moved this one out of Active. No policy has to name this rule; it's built into the KMIP lifecycle itself."
  const d = decisionOf(r)
  if (d.kind === 'Rekey')
    return `The policy didn't just allow this — it migrated the key to ${d.algorithm ?? 'a quantum-safe algorithm'}. The old key was retired automatically; your application code never changed.`
  if (d.kind === 'Deny')
    return 'The active policy forbids this algorithm, so the request was refused before any key was used. Switch to a policy that permits it, or pick a compliant algorithm.'
  if (d.kind === 'Allow' && d.algorithm)
    return `You asked for an operation and let the policy choose the algorithm — it resolved to ${d.algorithm}. Flip the policy above and the same request resolves differently.`
  if (!r.ok) return null
  switch (r.operation) {
    case 'CreateKeyPair':
    case 'Create':
      return 'Nothing is usable yet — a fresh key starts inactive. Activate it next, then use it (sign, encapsulate, or encrypt).'
    case 'Activate':
      return 'The key is now live and the policy will govern every operation you run against it.'
    case 'Sign':
      return 'This signature was produced by the HSM engine itself — the same Rust code the appliance ships, running here in your tab.'
    case 'SignatureVerify':
      return 'Verification re-runs the math against the public key; a valid result proves the signature and message match.'
    case 'Decrypt':
      return 'The plaintext you get back should exactly match what you encrypted — same key, same IV, real AES-GCM in the HSM engine.'
    default:
      return null
  }
}

export function KmipPlaygroundView() {
  const role = usePersonaStore((s) => s.selectedPersona)
  const [engine, setEngine] = useState<KmipEngine | null>(null)
  const [bootError, setBootError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  /** WS-4c (2026-08-28 gaps-remediation plan) — set when a restored session's
   * policy fingerprint(s) no longer match what was active last visit (the
   * shipped file changed server-side meanwhile). Restore still proceeds with
   * the CURRENT file; this only controls whether the notice banner shows. */
  const [staleNotice, setStaleNotice] = useState(false)

  const [policy, setPolicy] = useState<PolicyStatus>({ active: false })
  const [policyYaml, setPolicyYaml] = useState<string | null>(null)
  const [objects, setObjects] = useState<KmipObject[]>([])
  const [audit, setAudit] = useState<AuditEvent[]>([])
  const [result, setResult] = useState<OpResult | null>(null)
  const [lastSpec, setLastSpec] = useState<OpSpec | null>(null)

  const [mode, setMode] = useState<ViewMode>(readMode)
  const expert = mode === 'expert'
  // Supports deep-linking straight to a plane, e.g. the persona board's
  // architect CTA "See the seven-key estate" -> /playground/cacp?plane=migration.
  const [searchParams] = useSearchParams()
  const [plane, setPlane] = useState<Plane>(() => {
    const requested = searchParams.get('plane')
    return requested === 'agility' ||
      requested === 'policy' ||
      requested === 'kmip3' ||
      requested === 'migration'
      ? requested
      : 'agility'
  })
  const chooseMode = (m: ViewMode) => {
    setMode(m)
    try {
      localStorage.setItem('cacp-mode', m)
    } catch {
      /* ignore */
    }
  }

  const [whyDismissed, setWhyDismissed] = useState<boolean>(readWhyDismissed)
  const dismissWhy = () => {
    setWhyDismissed(true)
    try {
      localStorage.setItem('cacp-why-dismissed', '1')
    } catch {
      /* ignore */
    }
  }

  const [algo, setAlgo] = useState('ML-DSA-65')
  // Key-size/curve for RSA/ECDSA (A-grade review item #18) — `undefined` lets
  // the engine apply its own default (RSA-2048 / P-256). Reset whenever the
  // algorithm changes so a stale curve choice can't leak onto a PQC pick.
  const [keyLength, setKeyLength] = useState<number | undefined>(undefined)
  const onSelectAlgo = (value: string) => {
    setAlgo(value)
    setKeyLength(ALGORITHMS.find((a) => a.value === value)?.sizes?.[0]?.length)
  }
  const [message, setMessage] = useState('hello post-quantum world')
  /** CACP guide overlay — the canonical markdown guide is staged next to the
   * policies by scripts/build-kmip-wasm.sh, so it always matches the shipped
   * policy set. Fetched lazily on first open. */
  const [guideOpen, setGuideOpen] = useState(false)
  const [guideMd, setGuideMd] = useState<string | null>(null)
  const openGuide = () => {
    setGuideOpen(true)
    if (guideMd === null) {
      fetch('/kmip-policies/CACP_GUIDE.md')
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then(setGuideMd)
        .catch(() => setGuideMd('# Guide unavailable\n\nCould not load CACP_GUIDE.md.'))
    }
  }
  // Keyboard-accessible dismissal (the backdrop's click-to-close is
  // pointer-only) — Escape closes the guide overlay while it's open.
  useEffect(() => {
    if (!guideOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGuideOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [guideOpen])

  // Share lives ONLY in the top bar (2026-08-27 remediation) — register this
  // page's title/text so the global ShareButton (MainLayout.tsx) shows the
  // right copy instead of the generic route fallback.
  useEffect(() => {
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      shareTitle: 'KMIP Control Plane — PQC Today',
      shareText: 'A real KMIP 3.0 control plane + PKCS#11 HSM running in the browser',
    })
    return () => clearPageActions()
  }, [])

  /** Governance x-attributes attached at Create/CreateKeyPair, as free text
   * "name=value, name=value" (x- prefix optional). Policies like cnsa-2.0 /
   * bsi-tr-02102 / pqc-migration-2030 REQUIRE one at key creation — without
   * this input those policies were untestable from the workbench (2026-07-04). */
  const [govAttrsText, setGovAttrsText] = useState('')
  const govAttrs = useMemo((): Record<string, string> | undefined => {
    const entries = govAttrsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const eq = s.indexOf('=')
        const name = (eq >= 0 ? s.slice(0, eq) : s).trim()
        const value = eq >= 0 ? s.slice(eq + 1).trim() : 'true'
        return [name, value] as const
      })
      .filter(([n]) => n.length > 0)
    return entries.length ? Object.fromEntries(entries) : undefined
  }, [govAttrsText])
  const [priv, setPriv] = useState<string | null>(null)
  const [pub, setPub] = useState<string | null>(null)
  const [sigHex, setSigHex] = useState<string | null>(null)
  const [ctHex, setCtHex] = useState<string | null>(null)
  /** Symmetric Encrypt's IV — the engine won't auto-generate one for a plain
   * `Create`d key, so it's carried from Encrypt's response into Decrypt's
   * request (mirrors `ctHex`, which for the symmetric path holds
   * ciphertext+tag concatenated, ready to hand straight back to Decrypt). */
  const [encIvHex, setEncIvHex] = useState<string | null>(null)

  const chosen = ALGORITHMS.find((a) => a.value === algo)
  const isKem = chosen?.kind === 'kem'
  const isSymmetric = chosen?.kind === 'symmetric'
  const isSpecOnly = chosen?.runnable === false

  // The active policy's friendly label (built-in permissive aliases the
  // training-permissive preset) — shown in the policy-test panel.
  const activePreset = POLICY_PRESETS.find(
    (p) =>
      p.name === policy.name ||
      (p.name === 'training-permissive' && policy.name === 'built-in-permissive')
  )
  const policyLabel = activePreset?.label ?? 'Built-in permissive'

  // Boot the wasm control plane once.
  useEffect(() => {
    let alive = true
    getKmipEngine()
      .then((e) => {
        if (!alive) return
        setEngine(e)
        setPolicy(e.policyStatus())
        setObjects(e.listObjects())
        setAudit(e.auditSnapshot())
      })
      .catch((e: unknown) => alive && setBootError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [])

  const refresh = useCallback((e: KmipEngine) => {
    setObjects(e.listObjects())
    setAudit(e.auditSnapshot())
    setPolicy(e.policyStatus())
  }, [])

  // Run one KMIP op, refresh the views, return the result for chaining.
  const run = useCallback(
    async (spec: OpSpec): Promise<OpResult | null> => {
      if (!engine) return null
      setBusy(true)
      setLastSpec(spec)
      // Yield so the spinner paints before the (synchronous) wasm call.
      await new Promise((r) => setTimeout(r, 0))
      try {
        const r = engine.runOp(spec)
        setResult(r)
        refresh(engine)
        return r
      } catch (err) {
        setResult(engineError(spec.op, err))
        return null
      } finally {
        setBusy(false)
      }
    },
    [engine, refresh]
  )

  const onCreate = async () => {
    if (isSpecOnly) {
      setPriv(null)
      setPub(null)
      setSigHex(null)
      setCtHex(null)
      setEncIvHex(null)
      setResult(skipResult(algo))
      return
    }
    if (isSymmetric) {
      const r = await run({ op: 'Create', algorithm: algo, length: 256, attrs: govAttrs })
      if (r?.ok) {
        setPriv(str(r.summary.uid))
        setPub(null)
        setSigHex(null)
        setCtHex(null)
        setEncIvHex(null)
      }
      return
    }
    const spec: OpSpec = chosen?.auto
      ? { op: 'CreateKeyPair', intent: 'sign', attrs: govAttrs }
      : {
          op: 'CreateKeyPair',
          algorithm: algo,
          length: chosen?.sizes ? keyLength : undefined,
          attrs: govAttrs,
        }
    const r = await run(spec)
    if (r?.ok) {
      setPriv(str(r.summary.privateKeyUid))
      setPub(str(r.summary.publicKeyUid))
      setSigHex(null)
      setCtHex(null)
      setEncIvHex(null)
    }
  }
  const onActivate = async () => {
    if (priv) await run({ op: 'Activate', uid: priv })
    if (pub) await run({ op: 'Activate', uid: pub })
  }
  const onSign = async () => {
    if (!priv) return
    const r = await run({ op: 'Sign', uid: priv, text: message })
    if (r?.ok) setSigHex(str(r.summary.signatureHex))
  }
  const onVerify = async () => {
    if (pub && sigHex)
      await run({ op: 'SignatureVerify', uid: pub, text: message, signature: sigHex })
  }
  const onEncapsulate = async () => {
    if (!pub) return
    const r = await run({ op: 'Encapsulate', uid: pub })
    if (r?.ok) setCtHex(str(r.summary.ciphertextHex))
  }
  const onDecapsulate = async () => {
    if (priv && ctHex) await run({ op: 'Decapsulate', uid: priv, data: ctHex })
  }
  const onEncrypt = async () => {
    if (!priv) return
    const ivHex = arrayBufferToHex(getRandomBytes(12).buffer as ArrayBuffer)
    const r = await run({ op: 'Encrypt', uid: priv, text: message, ivHex })
    if (r?.ok) {
      setCtHex(str(r.summary.ciphertextHex) + str(r.summary.tagHex))
      setEncIvHex(ivHex)
    }
  }
  const onDecrypt = async () => {
    if (priv && ctHex && encIvHex)
      await run({ op: 'Decrypt', uid: priv, data: ctHex, ivHex: encIvHex })
  }
  const onGet = async () => {
    if (priv) await run({ op: 'Get', uid: priv })
  }
  const onRevoke = async () => {
    if (priv) await run({ op: 'Revoke', uid: priv })
  }
  // A-grade review C3/lifecycle-state-gate demo: Revoke, then immediately
  // retry the exact same Sign — no policy needed to deny this, the base KMIP
  // lifecycle gate (Sign requires Active) refuses it. Leaves `result` on the
  // (denied) Sign attempt, not the Revoke, so that's what the learner sees.
  const onRevokeThenRetrySign = async () => {
    if (!priv) return
    await run({ op: 'Revoke', uid: priv })
    await run({ op: 'Sign', uid: priv, text: message })
  }

  // Reset the workbench scratch state — the audit/activity trail, the last result,
  // and the working-key references (so the numbered lifecycle buttons disable
  // again for a fresh run). Deliberately does NOT touch the active policy or the
  // Guided/Expert mode (those are user context, not per-run scratch). The engine
  // exposes no "drop all objects" call, so previously-created keys stay in the
  // keystore — clearing the refs just detaches this UI flow from them.
  const onReset = () => {
    if (!engine) return
    engine.clearAudit()
    setAudit([])
    setResult(null)
    setLastSpec(null)
    setPriv(null)
    setPub(null)
    setSigHex(null)
    setCtHex(null)
    setEncIvHex(null)
  }

  const onLoadPolicy = async (preset: PolicyPreset) => {
    if (!engine) return
    setBusy(true)
    try {
      if (preset.files && preset.files.length > 0) {
        // Modular-policy plan (2026-08-28) — fetch every module file first
        // (so a network failure can't leave the engine half-switched), THEN
        // activate them all in one synchronous batch. `policyYaml` becomes
        // the concatenation, purely for the List/YAML/Visual tabs' display —
        // `parsePolicyModel` just scans for `- type:` lines, so it merges
        // every file's rules into one model regardless of the boundary.
        const yamls = await Promise.all(
          preset.files.map((f) => fetch(`/kmip-policies/${f}`).then((r) => r.text()))
        )
        setPolicyYaml(yamls.join('\n\n# ── next module ──\n\n'))
        const res = engine.activateModulePreset(preset.name, yamls)
        if (!res.ok) setResult(engineError('LoadPolicy', res.error ?? 'policy load failed'))
        else {
          const modStatus = engine.policyModulesStatus()
          saveCacpPresetSession({
            presetFile: preset.file,
            moduleFiles: preset.files,
            uncoveredOps: modStatus.uncoveredOps,
            fingerprints: modStatus.modules.map((m) => m.fingerprint),
          })
        }
      } else {
        const yaml = await fetch(`/kmip-policies/${preset.file}`).then((r) => r.text())
        setPolicyYaml(yaml)
        const res = engine.loadPolicy(yaml)
        if (!res.ok) setResult(engineError('LoadPolicy', res.error ?? 'policy load failed'))
        else
          saveCacpPresetSession({
            presetFile: preset.file,
            moduleFiles: null,
            uncoveredOps: 'deny',
            fingerprints: [engine.policyStatus().fingerprint ?? ''],
          })
      }
      refresh(engine)
    } catch (err) {
      // fetch failure (missing/!ok policy file) or a wasm panic loading it.
      setResult(engineError('LoadPolicy', err))
    } finally {
      setBusy(false)
    }
  }

  // Apply an edited policy (from the visual editor) to the engine and surface it
  // site-wide — the graph is the source of truth, so List/Timeline/YAML + every
  // plane reflect the edit. Returns the loader result (warnings feed the editor).
  const onApplyYaml = (yaml: string) => {
    if (!engine) return undefined
    const res = engine.loadPolicy(yaml)
    setPolicyYaml(yaml)
    refresh(engine)
    return res
  }

  // WS-4c (2026-08-28 gaps-remediation plan) — restore the last-active
  // preset/modules once the engine boots, then layer the one global draft
  // back on top if it was edited under that same preset. Runs exactly once
  // per page life (guarded by the ref, not by an empty dep array — `engine`
  // itself flips from null to set exactly once, but re-running on every
  // re-render of THIS effect for other reasons would re-restore a session
  // the user has since moved on from).
  const restoredRef = useRef(false)
  useEffect(() => {
    if (!engine || restoredRef.current) return
    restoredRef.current = true
    const saved = loadCacpSession()
    if (!saved.presetFile) return
    const preset = POLICY_PRESETS.find((p) => p.file === saved.presetFile)
    if (!preset) return
    const isModular = Boolean(preset.files && preset.files.length > 0)
    void onLoadPolicy(preset).then(() => {
      const fresh = isModular
        ? engine.policyModulesStatus().modules.map((m) => m.fingerprint)
        : [engine.policyStatus().fingerprint ?? '']
      const changed =
        fresh.length !== saved.fingerprints.length ||
        fresh.some((f, i) => f !== saved.fingerprints[i])
      if (changed) setStaleNotice(true)
      // Drafts only ever apply to an editable (single-file) preset — the
      // visual editor is `readOnly` for a multi-module one, so no draft
      // could have been made under it in the first place.
      if (!isModular && saved.draftYaml && saved.draftPresetFile === saved.presetFile) {
        const res = onApplyYaml(saved.draftYaml)
        if (res?.ok) saveCacpDraft(saved.presetFile, saved.draftYaml)
      }
    })
    // onLoadPolicy/onApplyYaml are fresh closures every render; this effect
    // must run exactly once (per the ref guard above), not on every render
    // a new closure identity would otherwise trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine])

  // ── Guided lessons (A-grade review item #19) ───────────────────────────────
  // Five cross-tab lessons that drive the REAL controls — every `act` below
  // calls the exact same handler a click would. A `setAlgo`/`setPolicy`-style
  // state update commits on the NEXT render, so a step never both changes a
  // setting AND immediately acts on the new value in one `act` — each is its
  // own tour step, letting the state settle before the following step reads
  // it (avoids a stale-closure read of `algo`, e.g. `onCreate` seeing the
  // value from before an `onSelectAlgo` in the same step would have committed).
  const loadPolicyByFile = (file: string) => {
    const preset = POLICY_PRESETS.find((p) => p.file === file)
    return preset ? onLoadPolicy(preset) : undefined
  }
  const lessons: Lesson[] = [
    {
      id: 'flip',
      title: 'The agility flip',
      icon: Sparkles,
      plane: 'agility',
      blurb: 'Same request, two policies, two algorithms — the core idea.',
      steps: [
        {
          title: 'Why crypto-agility?',
          body: 'A "harvest-now, decrypt-later" attacker is already recording your encrypted traffic, betting a future quantum computer will crack it. The defence isn\'t a one-time swap to PQC — it\'s changing algorithms by policy, with no code change. Watch that happen live.',
        },
        {
          title: 'Start on the "before"',
          target: '[data-tour="policy-chip-classical.yaml"]',
          act: () => loadPolicyByFile('classical.yaml'),
          body: 'The Classical policy is the pre-migration world — its defaults resolve new keys to RSA / ECDSA. Notice the resolved defaults update instantly.',
        },
        {
          title: 'Ask with "Auto"',
          target: '[data-testid="kmip-algo"]',
          act: () => onSelectAlgo(AUTO_ALGO),
          body: 'Instead of naming an algorithm, we set the picker to Auto — let the policy decide. Your app asks for a signing key and lets policy choose.',
        },
        {
          title: 'Create it',
          target: '[data-tour="create-btn"]',
          act: () => onCreate(),
          body: 'Under Classical, the policy resolved it to a classical algorithm. See the verdict and the plain-English explanation below.',
        },
        {
          title: 'Flip the policy',
          target: '[data-tour="policy-chip-pqc.yaml"]',
          act: () => loadPolicyByFile('pqc.yaml'),
          body: 'Switch the active policy to PQC. Nothing else changes — not the picker, not your request. This one control governs everything below it.',
        },
        {
          title: 'Create again — identical action',
          target: '[data-tour="create-btn"]',
          act: () => onCreate(),
          body: 'The exact same Auto Create now resolves to a PQC algorithm. Same request, zero code change, now quantum-safe. That is crypto-agility.',
        },
        {
          title: "That's the loop",
          body: 'One policy switch changed every downstream decision. Try the next lessons: denials, rekey-on-use, and how a policy actually decides.',
        },
      ],
    },
    {
      id: 'deny',
      title: 'When a policy says no',
      icon: Ban,
      plane: 'agility',
      blurb: 'A denial names the rule — and how to satisfy it.',
      steps: [
        {
          title: 'Activate PQC',
          target: '[data-tour="policy-chip-pqc.yaml"]',
          act: () => loadPolicyByFile('pqc.yaml'),
          body: 'The PQC policy forbids creating new classical asymmetric keys.',
        },
        {
          title: 'Force a classical key',
          target: '[data-testid="kmip-algo"]',
          act: () => onSelectAlgo('RSA'),
          body: 'We explicitly ask for RSA while PQC is active — overriding Auto.',
        },
        {
          title: 'Watch the denial',
          target: '[data-tour="create-btn"]',
          act: () => onCreate(),
          body: 'Denied before any key was created. The result names the exact rule (algorithm_denylist) and, in Guided mode, what it means. A denial is a next step, not a dead end.',
        },
        {
          title: 'Read the trail',
          target: '[data-tour="insp-audit-tab"]',
          act: () => clickByText('[data-tour="insp-audit-tab"]', 'Activity'),
          body: 'Every step is logged across all three planes — policy decision (P1), KMIP op (P2), PKCS#11 mechanism (P3).',
        },
      ],
    },
    {
      id: 'rekey',
      title: 'Rekey on first use',
      icon: ArrowRight,
      plane: 'agility',
      blurb: 'A legacy key migrates the moment you use it.',
      steps: [
        {
          title: 'Start on Classical',
          target: '[data-tour="policy-chip-classical.yaml"]',
          act: () => loadPolicyByFile('classical.yaml'),
          body: 'A key made here is the "legacy" one — Auto resolves to ECDSA-P256 under this policy.',
        },
        {
          title: 'Ask with "Auto"',
          target: '[data-testid="kmip-algo"]',
          act: () => onSelectAlgo(AUTO_ALGO),
          body: 'Under Classical, Auto resolves to ECDSA-P256 — a real classical key, not a stand-in for one.',
        },
        {
          title: 'Create a classical signing key',
          target: '[data-tour="create-btn"]',
          act: () => onCreate(),
          body: "This key's algorithm — ECDSA-P256 — is exactly what auto-migrate-on-use.yaml's rekey rule watches for at Sign time. That's not a coincidence: the two policies are designed to hand off to each other.",
        },
        {
          title: 'Activate it',
          target: '[data-tour="activate-btn"]',
          act: () => onActivate(),
          body: 'Bring the key to Active while it can still be created under Classical — auto-migrate-on-use denies creating NEW classical keys outright, so this has to happen first.',
        },
        {
          title: 'Switch to Auto-migrate',
          act: () => loadPolicyByFile('auto-migrate-on-use.yaml'),
          body: "This policy lets an EXISTING classical key keep working, but rekeys it to PQC the moment it's used — no flag day, no re-issue.",
        },
        {
          title: 'Sign — and watch it migrate',
          target: '[data-tour="sign-btn"]',
          act: () => onSign(),
          body: 'The moment you Sign, the policy rekeys ECDSA-P256 → ML-DSA-65 and signs with the new key — a new key is minted and the old one is deactivated and superseded. The handle keeps working because the engine follows the supersedes link.',
        },
      ],
    },
    {
      id: 'decide',
      title: 'How a policy decides',
      icon: Workflow,
      plane: 'policy',
      blurb: 'Read the decision pipeline: resolve, then gate.',
      steps: [
        {
          title: 'The policy library',
          target: '[data-tour="policy-library"]',
          body: "Every policy lives here. Let's look at how one actually reaches a verdict.",
        },
        {
          title: 'Open the Visual editor',
          target: '[data-tour="policy-subtabs"] button',
          targetText: 'Visual',
          act: () => clickByText('[data-tour="policy-subtabs"] button', 'Visual'),
          body: 'This is the decision pipeline: a request enters the top and flows through the rules, in order, to an Allow / Rekey / Deny terminal.',
        },
        {
          title: 'Run a request',
          target: '[data-tour="run-simulate-btn"]',
          act: () => clickByText('[data-tour="run-simulate-btn"]', 'Run through the pipeline'),
          body: 'The token animates along the path the engine actually took. The verdict shows which rule decided — and, on a deny, how to satisfy it.',
        },
        {
          title: 'Two passes, first match wins',
          target: '[data-tour="precedence-explainer"]',
          body: 'Resolve runs first (Default / Rekey can change the algorithm); then Gate checks the resolved request in order. The first rule that denies wins — reorder rules and the outcome can change.',
        },
      ],
    },
    {
      id: 'time',
      title: 'Time-travel a policy',
      icon: Clock,
      plane: 'policy',
      blurb: 'Move the clock and watch a cutoff bite.',
      steps: [
        {
          title: 'Pick a dated policy',
          target: '[data-tour="policy-library"]',
          act: () => loadPolicyByFile('pqc-migration-2030.yaml'),
          body: "The 2030-cutoff policy bans classical signing after a date. Let's let the calendar change the verdict.",
        },
        {
          title: 'Open the Timeline',
          target: '[data-tour="policy-subtabs"] button',
          targetText: 'Timeline',
          act: () => clickByText('[data-tour="policy-subtabs"] button', 'Timeline'),
          body: 'Each time-bounded rule is a bar on a year axis. Drag the slider to move the "as-of" clock.',
        },
        {
          title: 'Cross 2030',
          target: 'input[aria-label="As-of date"]',
          act: () => dragRangeToMax('input[aria-label="As-of date"]'),
          body: 'Past 2030-01-01 the classical-signing cutoff comes into force — and the List matrix + simulator now evaluate at that date too. That is temporal agility.',
        },
      ],
    },
    {
      id: 'honest',
      title: "What's new: the honest maximum",
      icon: Layers,
      plane: 'kmip3',
      blurb: 'Split keys, async jobs, and an engine that proves every claim.',
      steps: [
        {
          title: 'A server that only claims what it does',
          body: 'Engine 0.12/0.13 closed the gap between what this KMIP server SAYS and what it DOES: real M-of-N key splitting, real asynchronous jobs, Destroy that genuinely scrubs key material, and a Query response with zero advertised-but-fake capabilities. This tour shows you where to run each one.',
        },
        {
          title: 'Learn it hands-on',
          target: '[data-tour="kmip3-subtabs"]',
          body: 'Walkthroughs 7–9 in the Learn tab run the new capabilities live: split a key 3-of-5 and watch 2 shares honestly fail to recover it; queue a background job and redeem its correlation value; try to sneak a read-only attribute past the server.',
        },
        {
          title: 'Every operation, honestly labelled',
          target: '[data-tour="kmip3-subtabs"] button',
          targetText: 'Commands',
          act: () => clickByText('[data-tour="kmip3-subtabs"] button', 'Commands'),
          body: '62 of the 66 operations in KMIP 3.0 CSD02 (the current OASIS committee draft) genuinely run here — split keys and the async quartet included, with real parameter forms. The 4 that cannot run say exactly why (Notify and Put are server-to-client by definition; Delegated Login and Re-Provision have no handler) instead of pretending.',
        },
        {
          title: 'The Dev tab: pipeline builder and corpus replay',
          target: '[data-tour="kmip3-subtabs"] button',
          targetText: 'Dev',
          act: () => clickByText('[data-tour="kmip3-subtabs"] button', 'Dev'),
          body: 'The pipeline builder and the OASIS corpus replay harness both live here — the engineering-workbench surfaces of the KMIP3.0 tab, folded together the same way the PKCS#11 side folds its Pipeline/ACVP/Conformance tools.',
        },
        {
          title: 'Prove it against the OASIS suite',
          target: '[data-tour="kmip-dev-subtabs"] button',
          targetText: 'Corpus Replay',
          act: () => clickByText('[data-tour="kmip-dev-subtabs"] button', 'Corpus Replay'),
          body: "Replay the official conformance corpus right in this tab. The engine's CI pins an exact 97-pass baseline on the 102 OASIS tests, and the in-browser run matches it exactly — zero skips, zero failures tolerated.",
        },
        {
          title: 'Rollback that reaches everything',
          target: '[data-tour="kmip3-subtabs"] button',
          targetText: 'Batch & Macros',
          act: () => clickByText('[data-tour="kmip3-subtabs"] button', 'Batch & Macros'),
          body: 'Batch Undo now rolls back even the UID-minting KEM and split-key operations — run the "Rollback reaches Encapsulate" recipe and watch every minted object disappear when a later item fails.',
        },
      ],
    },
    {
      id: 'developer-lifecycle',
      title: 'Build a governed KMIP sequence',
      icon: Code2,
      plane: 'kmip3',
      blurb: 'The Dev tab: a real pqctoday_kmip.KmipClient script, step by step.',
      steps: [
        {
          title: 'The Dev tab',
          target: '[data-tour="kmip3-subtabs"] button',
          targetText: 'Dev',
          act: () => clickByText('[data-tour="kmip3-subtabs"] button', 'Dev'),
          body: "Pipeline is the Dev tab's default sub-tab — the pipeline builder opens straight away.",
        },
        {
          title: 'Start from a template',
          target: '[data-tour="kmip-dev-templates"]',
          act: () => clickByText('[data-tour="kmip-dev-templates"] button', 'Governed lifecycle'),
          body: 'Each template is a real ordered list of pqctoday_kmip.KmipClient calls — create, activate, sign, revoke, destroy — the same object lifecycle a production KMIP client walks through.',
        },
        {
          title: 'Four kinds of step',
          target: '[data-tour="kmip-dev-steps"]',
          body: 'A lifecycle op (create/activate/sign/…), a policy load, a dry-run, or an "expect deny" step — the list on the right shows exactly what will run, in order, before you press anything.',
        },
        {
          title: 'Run it for real',
          target: '[data-tour="kmip-dev-run"]',
          act: () => clickByText('[data-tour="kmip-dev-run"]', 'Run'),
          body: 'This compiles the step list into real Python and runs it against the same in-page KMIP/CACP engine the rest of this playground uses — not a simulation.',
        },
        {
          title: 'The refusal IS the lesson',
          target: '[data-tour="kmip-dev-step-deny"]',
          body: 'Signing with a key before it\'s Activated is refused by the engine — and that refusal is graded as a PASS, not a failure. This is the crypto-agility control plane doing its job: an honest "no" instead of a silent allow.',
        },
      ],
    },
  ]
  const tour = useLessonsTour(lessons, setPlane)

  if (bootError) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle size={18} />{' '}
          <span className="font-semibold">Couldn’t start the in-browser KMIP engine</span>
        </div>
        <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto">{bootError}</pre>
      </div>
    )
  }
  if (!engine) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-6">
        <Loader2 size={18} className="animate-spin" /> Booting the KMIP + PKCS#11 engine in your
        browser…
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto animate-fade-in p-1">
      {/* B+ remediation 4.5 (2026-08-10). This was an ExecutiveRedirectBanner
          — "this is a hands-on engineering workbench", plus three links away.
          The site's clearest demonstration of crypto agility answered its most
          important audience by pointing at the door, which is why the CACP
          executive cells graded C/C+/C/A-. Replaced with the three-step story
          the console can actually deliver, sharing its wording with the
          sandbox's agility console via agilityNarration.ts. The three links
          survive inside the panel as an exit AFTER the story rather than as an
          alternative to it. */}
      {role === 'executive' && <AgilityStoryPanel className="mb-4" />}
      {/* WS-4c (2026-08-28 gaps-remediation plan) — the restored preset's
          fingerprint no longer matched what was active last visit; the
          CURRENT server file is what's loaded, this is just disclosure. */}
      {staleNotice && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-status-warning/40 bg-status-warning/5 px-3 py-2 text-xs text-foreground">
          <AlertTriangle size={14} className="shrink-0 text-status-warning" />
          <span>Policy updated since your last visit — showing the current version.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStaleNotice(false)}
            className="ml-auto h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            dismiss
          </Button>
        </div>
      )}
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Cpu size={20} className="text-primary" /> KMIP Control Plane
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            A real <Term t="KMIP" /> 3.0 control plane + <Term t="PKCS#11" /> <Term t="HSM" />,
            compiled to WebAssembly and running{' '}
            <span className="font-medium text-foreground">entirely in this tab</span> — no server,
            no Docker. Every operation is a genuine KMIP request answered by the same Rust engine
            the appliance ships.
          </p>
          {/* In-scope chip (A-grade review item #8) — this sandbox proves the
              control-plane decision + key-management-at-rest path; it does not
              stand in for a TLS handshake or persistent storage. */}
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            <span className="mr-1.5 rounded bg-muted/60 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-foreground">
              In scope
            </span>
            control plane + key management{' '}
            <span className="font-medium text-foreground">at rest</span>{' '}
            <ShieldCheck size={11} className="inline text-status-success" /> ·{' '}
            <span className="italic">TLS handshake &amp; persistence → full Docker sandbox</span>
          </p>
          {/* Spec-status disclosure. "Real KMIP 3.0" is true of the engine but
              says nothing about the standard's maturity, and KMIP 3.0 is NOT a
              ratified OASIS Standard — it is committee draft CSD02 (7 May 2026),
              whose public review closed 13 Aug 2026. Without this line a visitor
              who never opens the guide reasonably reads "KMIP 3.0" as ratified.
              These three strings are the complete set to update on ratification:
              here, the Commands op-count claim, and CorpusReplayView's heading. */}
          <p className="mt-1 text-[11px] text-muted-foreground">
            <span className="mr-1.5 rounded bg-muted/60 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-foreground">
              Spec status
            </span>
            KMIP 3.0 is an{' '}
            <span className="font-medium text-foreground">OASIS committee draft</span> (CSD02, May
            2026), not yet a ratified Standard —{' '}
            <Button
              variant="link"
              onClick={openGuide}
              data-testid="cacp-spec-status-link"
              className="h-auto p-0 align-baseline text-[11px] font-normal text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              what that means
            </Button>
          </p>
        </div>
        {/* VIEW · Guided / Expert progressive-disclosure toggle */}
        <div className="shrink-0 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={openGuide}
            data-testid="cacp-guide-btn"
            className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <BookOpen size={13} /> Guide
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={tour.openHub}
            className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Route size={13} /> Lessons
          </Button>
          <span className="hidden sm:inline text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
            View
          </span>
          <div
            role="group"
            aria-label="Detail level"
            className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5"
          >
            {(['guided', 'expert'] as const).map((m) => (
              <Button
                key={m}
                size="sm"
                variant="ghost"
                aria-pressed={mode === m}
                onClick={() => chooseMode(m)}
                className={`min-h-[44px] md:min-h-0 md:h-7 px-3 text-xs capitalize rounded-md ${
                  mode === m
                    ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {m}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Why crypto-agility, not just "post-quantum" (A-grade review E1) ── */}
      {!whyDismissed && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-status-warning/30 bg-status-warning/10 p-3.5">
          <Info size={16} className="mt-0.5 shrink-0 text-status-warning" />
          <div className="min-w-0 flex-1 text-xs text-foreground">
            <p className="font-semibold">Why crypto-agility, not just "post-quantum"</p>
            <p className="mt-1 text-muted-foreground">
              Data encrypted today with classical algorithms can be harvested now and decrypted
              later, once a cryptographically-relevant quantum computer exists —{' '}
              <span className="font-medium text-foreground">harvest-now, decrypt-later</span>. The
              fix isn't swapping in a PQC algorithm once; it's a control plane that can migrate keys
              again whenever the roadmap changes,{' '}
              <span className="font-medium text-foreground">
                with no flag day and no application code change
              </span>
              . Everything below is that idea made hands-on — flip the policy strip and watch the
              same request behave differently.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissWhy}
            className="h-6 shrink-0 px-2 text-[10px] text-muted-foreground hover:text-foreground"
          >
            Got it
          </Button>
        </div>
      )}

      {/* ── Top-level tabs ───────────────────────────────────────────────── */}
      <div className="overflow-x-auto no-scrollbar mb-4">
        <div
          role="tablist"
          aria-label="KMIP Control Plane surface"
          className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1 w-max min-w-full"
        >
          {(
            [
              { id: 'agility', label: 'Agility & Workbench', icon: Wand2 },
              { id: 'policy', label: 'Policy', icon: ShieldCheck },
              { id: 'kmip3', label: 'KMIP3.0', icon: Layers },
              { id: 'migration', label: 'Migration', icon: ArrowRight },
            ] as const
          ).map((t) => {
            const on = plane === t.id
            const Icon = t.icon
            return (
              <Button
                key={t.id}
                role="tab"
                aria-selected={on}
                variant="ghost"
                size="sm"
                onClick={() => setPlane(t.id)}
                className={`h-8 gap-1.5 rounded-md px-3 text-xs ${
                  on ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <Icon size={14} /> {t.label}
              </Button>
            )
          })}
        </div>
      </div>

      {plane === 'agility' && (
        <>
          {/* ── Plane 1 · the persistent policy "brain" ─────────────────── */}
          <PolicyControlStrip
            engine={engine}
            policy={policy}
            policyYaml={policyYaml}
            busy={busy}
            expert={expert}
            onLoadPolicy={onLoadPolicy}
            onOpenLibrary={() => setPlane('policy')}
          />

          {/* ── Validated test scenarios tied to the SELECTED policy ── */}
          <div className="mb-4">
            <PolicyScenario
              engine={engine}
              policyFile={activePreset?.file ?? 'training-permissive.yaml'}
              policyFingerprint={policy.fingerprint}
              policyLabel={policyLabel}
              busy={busy}
              onBusyChange={setBusy}
            />
          </div>

          {/* ── Manual workbench: operate → result → inspect ─────────────────── */}
          <div className="mt-6 mb-3 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Manual Workbench
            </span>
            <span className="text-xs text-muted-foreground">
              — drive the lifecycle yourself; the active policy still governs every call.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="ml-auto h-7 gap-1.5 px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <RotateCcw size={13} /> Reset
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
            {/* ── Left · Operate (Plane 2 — KMIP lifecycle) ─────────────────── */}
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold flex items-center gap-2 text-primary">
                <KeyRound size={16} /> Plane 2 · KMIP Lifecycle
              </h3>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Each button sends a real KMIP 3.0 request.
              </p>

              <p className="text-xs font-medium text-muted-foreground mb-1">Algorithm</p>
              <div className="mb-3" data-testid="kmip-algo">
                <FilterDropdown
                  items={ALGORITHMS.map((a) => ({
                    id: a.value,
                    label: a.auto
                      ? a.label
                      : a.runnable === false
                        ? a.label
                        : a.pqc
                          ? `${a.label} · PQC`
                          : a.label,
                    icon: a.auto ? <Wand2 size={13} className="text-primary" /> : undefined,
                  }))}
                  selectedId={algo}
                  onSelect={onSelectAlgo}
                  label="Algorithm"
                  className="w-full"
                />
              </div>
              {isSpecOnly && (
                <p className="mb-3 -mt-2 text-[10.5px] text-status-warning">
                  Spec-only: a real algorithm policies can reference, but this in-browser engine
                  can't create one — see what happens below.
                </p>
              )}
              {chosen?.sizes && (
                <div className="mb-3 -mt-2" data-testid="kmip-key-size">
                  <p className="mb-1 text-[10px] font-medium text-muted-foreground">
                    {algo === 'RSA' ? 'Key size' : 'Curve'} — a real request parameter, not a label;
                    policies with a minimum (FIPS-only, BSI, 2030 roadmap) gate on it.
                  </p>
                  <div className="flex gap-1.5">
                    {chosen.sizes.map((s) => (
                      <Button
                        key={s.length}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setKeyLength(s.length)}
                        className={cn(
                          'h-auto rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium',
                          keyLength === s.length
                            ? 'border-primary/60 bg-primary/10 text-primary'
                            : 'border-border bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        )}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3" data-testid="kmip-gov-attrs">
                <p className="mb-1 text-[10px] font-medium text-muted-foreground">
                  Key tags (governance attributes) — some policies require one at key creation, e.g.
                  CNSA 2.0 needs{' '}
                  <code className="font-mono">x-pqctoday-cnsa-classification=Secret</code>
                </p>
                <input
                  type="text"
                  value={govAttrsText}
                  onChange={(e) => setGovAttrsText(e.target.value)}
                  placeholder="name=value, name=value (optional)"
                  className="w-full rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  disabled={busy}
                  onClick={onCreate}
                  data-tour="create-btn"
                  className="col-span-2 gap-1.5"
                >
                  <Play size={14} />{' '}
                  {isSpecOnly
                    ? '1 · Try to create (not runnable)'
                    : isSymmetric
                      ? '1 · Create symmetric key'
                      : `1 · Create ${isKem ? 'KEM' : 'signing'} key pair`}
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy || !priv}
                  onClick={onActivate}
                  data-tour="activate-btn"
                  className="col-span-2"
                >
                  2 · Activate
                </Button>
                {isKem ? (
                  <>
                    <Button variant="secondary" disabled={busy || !pub} onClick={onEncapsulate}>
                      3 · Encapsulate
                    </Button>
                    <Button variant="secondary" disabled={busy || !ctHex} onClick={onDecapsulate}>
                      4 · Decapsulate
                    </Button>
                  </>
                ) : isSymmetric ? (
                  <>
                    <Button variant="secondary" disabled={busy || !priv} onClick={onEncrypt}>
                      3 · Encrypt
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busy || !ctHex || !encIvHex}
                      onClick={onDecrypt}
                    >
                      4 · Decrypt
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      disabled={busy || !priv}
                      onClick={onSign}
                      data-tour="sign-btn"
                    >
                      3 · Sign
                    </Button>
                    <Button variant="secondary" disabled={busy || !sigHex} onClick={onVerify}>
                      4 · Verify
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busy || !priv}
                      onClick={onRevokeThenRetrySign}
                      className="col-span-2"
                    >
                      5 · Revoke, then try to Sign again
                    </Button>
                  </>
                )}
              </div>

              {!isKem && (
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="message to sign"
                  className="w-full mt-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                />
              )}

              {expert && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => run({ op: 'Query' })}
                    className="text-xs"
                  >
                    Query
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => run({ op: 'Locate' })}
                    className="text-xs"
                  >
                    Locate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy || !priv}
                    onClick={onGet}
                    className="text-xs"
                  >
                    Get
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy || !priv}
                    onClick={onRevoke}
                    className="text-xs"
                  >
                    Revoke
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy || !priv}
                    onClick={() => priv && run({ op: 'Destroy', uid: priv })}
                    className="text-xs"
                  >
                    Destroy
                  </Button>
                </div>
              )}
            </section>

            {/* ── Right · Result + Inspector ────────────────────────────────── */}
            <div className="flex flex-col gap-4">
              <section className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold flex items-center gap-2 text-foreground">
                  <ScrollText size={16} /> Result
                </h3>
                {!result ? (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Run a step to see what happened.
                  </p>
                ) : (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {result.status === 'Skip' ? (
                        <SkipForward size={16} className="text-status-warning" />
                      ) : result.ok ? (
                        <CheckCircle2 size={16} className="text-status-success" />
                      ) : (
                        <XCircle size={16} className="text-destructive" />
                      )}
                      <span className="text-sm font-medium">{result.operation}</span>
                      <span
                        className={`text-xs ${result.status === 'Skip' ? 'text-status-warning' : result.ok ? 'text-status-success' : 'text-destructive'}`}
                      >
                        {result.status}
                      </span>
                      {(() => {
                        const d = decisionOf(result)
                        if (d.kind === 'Unknown') return null
                        const tone =
                          d.kind === 'Allow'
                            ? 'text-status-success'
                            : d.kind === 'Rekey'
                              ? 'text-status-warning'
                              : 'text-destructive'
                        return (
                          <span
                            className={`text-[10px] px-1.5 rounded bg-muted font-semibold ${tone}`}
                          >
                            policy: {d.kind}
                            {d.algorithm ? ` → ${d.algorithm}` : ''}
                          </span>
                        )
                      })()}
                    </div>
                    <p className="text-sm text-foreground mt-1.5">{narrate(result)}</p>
                    {!expert &&
                      (() => {
                        const wtm = whatThisMeans(result)
                        return wtm ? (
                          <p className="mt-2 border-l-2 border-primary/60 bg-muted/30 pl-2.5 py-1.5 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              What this means ·{' '}
                            </span>
                            {wtm}
                          </p>
                        ) : null
                      })()}
                    {busy && (
                      <Loader2 size={14} className="animate-spin text-muted-foreground mt-2" />
                    )}
                  </div>
                )}
              </section>

              {/* ── Inspector · Keystore / KMIP Wire (Expert) / Audit ─────────── */}
              <Inspector
                objects={objects}
                audit={audit}
                result={result}
                lastSpec={lastSpec}
                policy={policy}
                policyYaml={policyYaml}
                expert={expert}
                onClearAudit={() => {
                  engine.clearAudit()
                  setAudit([])
                }}
              />
            </div>
          </div>
        </>
      )}

      {plane === 'policy' && (
        <PolicyView
          engine={engine}
          policy={policy}
          policyYaml={policyYaml}
          busy={busy}
          expert={expert}
          onLoadPolicy={onLoadPolicy}
          onApplyYaml={onApplyYaml}
        />
      )}

      {plane === 'kmip3' && (
        <Kmip3View
          engine={engine}
          busy={busy}
          expert={expert}
          onBusyChange={setBusy}
          onChanged={() => refresh(engine)}
        />
      )}

      {/* Migration runs its OWN engine instance on a dedicated slot — the
          estate keystore is hermetic beside the workbench's slot-0 engine. */}
      {plane === 'migration' && <MigrationView />}

      <p className="text-[11px] text-muted-foreground mt-4">
        Want the full-fidelity version with TLS transport and the REST control plane? Run the real{' '}
        <code className="text-foreground">pqctoday-kmip</code> server from the{' '}
        <a className="text-primary hover:underline" href="/playground/sandbox">
          Docker sandbox
        </a>
        .
      </p>

      {tour.hubOpen && (
        <LessonsHub
          lessons={lessons}
          done={tour.doneLessons}
          onStart={tour.startLesson}
          onClose={tour.closeHub}
        />
      )}
      {tour.activeLesson && tour.tourStep >= 0 && (
        <TourOverlay
          lessonTitle={tour.activeLesson.title}
          step={tour.activeLesson.steps[tour.tourStep]}
          stepIndex={tour.tourStep}
          stepCount={tour.activeLesson.steps.length}
          rect={tour.tourRect}
          onNext={tour.nextStep}
          onBack={tour.backStep}
          onEnd={tour.endTour}
        />
      )}

      {/* CACP guide overlay — policy language + workbench testing + KMIP 3.0
          hybrid status; content staged beside the policies so it matches the
          shipped engine. */}
      {guideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Decorative click-to-dismiss backdrop; not a tab stop — keyboard
              users dismiss via Escape (handled above) or the close button. */}
          <div
            className="absolute inset-0 bg-black/60"
            aria-hidden="true"
            onClick={() => setGuideOpen(false)}
          />
          <div
            className="relative flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="KMIP Control Plane guide"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <BookOpen size={14} className="text-primary" /> CACP guide
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGuideOpen(false)}
                aria-label="Close guide"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4" data-testid="cacp-guide-body">
              {guideMd === null ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={13} className="animate-spin" /> Loading guide…
                </p>
              ) : (
                <MarkdownView content={guideMd} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KmipPlaygroundView
