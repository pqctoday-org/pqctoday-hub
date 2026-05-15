import { useState, useMemo, useRef } from 'react'
import { CheckCircle2, Circle, ChevronRight, Info, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { serializeDemoCommand, toHex } from '../../../wasm/tpmSerializer'
import { executeTpmCommand } from '../../../wasm/tpmBridge'
import { getCommandDef, getAlgParams, parseHybridAlgo } from './tpmCommandDefs'
import {
  hybridLabeledKemEncap,
  hybridLabeledKemDecap,
  generateHybridLabeledKemPeer,
  type HybridLabeledKemClassicalAlg,
} from '../../../wasm/pqcCryptoBridge'
import type { TpmLogEntry, TpmObjectEntry } from './TpmPlayground'

interface CommandBuilderProps {
  disabled: boolean
  onLogUpdate: (log: TpmLogEntry) => void
  onObjectUpdate: (obj: TpmObjectEntry) => void
  objects: TpmObjectEntry[]
}

// ── Lifecycle phases ──────────────────────────────────────────────────────────

const PHASES = [
  { key: 'startup', label: 'Startup', short: '1' },
  { key: 'explore', label: 'Explore TPM', short: '2' },
  { key: 'create', label: 'Create Keys', short: '3' },
  { key: 'use', label: 'Use Keys', short: '4' },
] as const

type PhaseKey = (typeof PHASES)[number]['key']

// ── Command groups for the selector ──────────────────────────────────────────

const COMMAND_GROUPS = [
  {
    label: 'Phase 2 — Explore',
    commands: ['TPM2_SelfTest', 'TPM2_GetCapability', 'TPM2_GetRandom'],
  },
  { label: 'Phase 3 — Create Keys', commands: ['TPM2_CreatePrimary'] },
  {
    label: 'Phase 4 — Use Keys',
    commands: [
      'TPM2_Encapsulate',
      'TPM2_Decapsulate',
      'TPM2_SignDigest',
      'TPM2_VerifyDigestSignature',
    ],
  },
  {
    label: 'Phase 4 — Educational (not in TCG v1.85)',
    commands: ['TPM2_LabeledKEM_Hybrid_Encap', 'TPM2_LabeledKEM_Hybrid_Decap'],
  },
  { label: 'Phase 1 — Reference', commands: ['TPM2_Startup'] },
]

// Algorithm options by relevance
const KEM_ALGOS = ['MLKEM-512', 'MLKEM-768', 'MLKEM-1024']
const DSA_ALGOS = ['MLDSA-44', 'MLDSA-65', 'MLDSA-87']
const ALL_ALGOS = [...KEM_ALGOS, ...DSA_ALGOS]

// Hybrid Labeled-KEM combos (ML-KEM variant + classical curve). Educational
// construct atop TCG v1.85 §11 Labeled KEM — TCG itself does NOT standardize a
// hybrid mode.
const HYBRID_ALGOS = [
  'HYBRID:MLKEM-512+X25519',
  'HYBRID:MLKEM-768+X25519',
  'HYBRID:MLKEM-1024+X25519',
  'HYBRID:MLKEM-512+P-256',
  'HYBRID:MLKEM-768+P-256',
  'HYBRID:MLKEM-1024+P-256',
]

function isHybridCommand(cmd: string): boolean {
  return cmd === 'TPM2_LabeledKEM_Hybrid_Encap' || cmd === 'TPM2_LabeledKEM_Hybrid_Decap'
}

function getAlgoOptionsForCommand(cmd: string): string[] {
  if (cmd === 'TPM2_CreatePrimary') return ALL_ALGOS
  if (cmd === 'TPM2_Encapsulate' || cmd === 'TPM2_Decapsulate') return KEM_ALGOS
  if (cmd === 'TPM2_SignDigest' || cmd === 'TPM2_VerifyDigestSignature') return DSA_ALGOS
  if (isHybridCommand(cmd)) return HYBRID_ALGOS
  return []
}

function mlkemAlgoToParamSet(algo: string): number {
  if (algo === 'MLKEM-512') return 1
  if (algo === 'MLKEM-1024') return 3
  return 2
}

function toHexBytes(bytes: Uint8Array, maxLen = 64): string {
  const slice = bytes.subarray(0, Math.min(bytes.length, maxLen))
  let s = ''
  for (let i = 0; i < slice.length; i++) {
    s += slice[i].toString(16).padStart(2, '0')
  }
  return bytes.length > maxLen ? `${s}…(+${bytes.length - maxLen}B)` : s
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

function mlkemParamName(p: number): string {
  if (p === 1) return 'MLKEM-512'
  if (p === 2) return 'MLKEM-768'
  if (p === 3) return 'MLKEM-1024'
  return `MLKEM-?(${p})`
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CommandBuilder({
  disabled,
  onLogUpdate,
  onObjectUpdate,
  objects,
}: CommandBuilderProps) {
  const [commandType, setCommandType] = useState('TPM2_GetCapability')
  const [algorithm, setAlgorithm] = useState('MLKEM-768')
  const [isExecuting, setIsExecuting] = useState(false)

  // Cross-command state for the hybrid Labeled-KEM round trip. The Encap step
  // creates a peer classical key pair (stored here); the Decap step reads it
  // back so the round trip is reproducible from the UI alone.
  const hybridSessionRef = useRef<{
    classicalAlg: HybridLabeledKemClassicalAlg
    peerPrivKey: CryptoKey
    peerRawPub: Uint8Array
    encapMlkemCt: Uint8Array | null
    encapClassicalCt: Uint8Array | null
    encapCombinedSs: Uint8Array | null
    mlkemParamSet: number
  } | null>(null)

  const kemHandle = objects.find((o) => o.algorithm.startsWith('MLKEM'))?.handle ?? null
  const dsaHandle = objects.find((o) => o.algorithm.startsWith('MLDSA'))?.handle ?? null

  const cmdDef = getCommandDef(commandType)
  const algoOptions = getAlgoOptionsForCommand(commandType)

  // Determine if this command is gated on a handle
  const isGatedOnKem = cmdDef?.requiresKem && !kemHandle
  const isGatedOnDsa = cmdDef?.requiresDsa && !dsaHandle
  const isCommandDisabled =
    disabled || isExecuting || !!isGatedOnKem || !!isGatedOnDsa || commandType === 'TPM2_Startup'

  // Effective algorithm for param display (derive from available handle if use-phase)
  const effectiveAlgo = useMemo(() => {
    if (!cmdDef?.showAlgorithm) {
      if (cmdDef?.requiresKem && kemHandle) {
        const obj = objects.find((o) => o.handle === kemHandle)
        return obj?.algorithm ?? algorithm
      }
      if (cmdDef?.requiresDsa && dsaHandle) {
        const obj = objects.find((o) => o.handle === dsaHandle)
        return obj?.algorithm ?? algorithm
      }
    }
    return algorithm
  }, [cmdDef, kemHandle, dsaHandle, algorithm, objects])

  // Resolve the numeric handle for commands that reference a loaded key
  const effectiveHandleNum = useMemo(() => {
    const h = cmdDef?.requiresKem ? kemHandle : cmdDef?.requiresDsa ? dsaHandle : null
    return h ? parseInt(h, 16) : 0x80000000
  }, [cmdDef, kemHandle, dsaHandle])

  const serializedBytes = useMemo(
    () => serializeDemoCommand(commandType, effectiveAlgo, effectiveHandleNum),
    [commandType, effectiveAlgo, effectiveHandleNum]
  )

  // Lifecycle phase completion state
  const completedPhases = useMemo<Set<PhaseKey>>(() => {
    const s = new Set<PhaseKey>()
    if (!disabled) s.add('startup')
    if (kemHandle || dsaHandle) s.add('create')
    return s
  }, [disabled, kemHandle, dsaHandle])

  const activePhase = cmdDef?.phase ?? 'explore'

  const handleCommandChange = (cmd: string) => {
    setCommandType(cmd)
    const opts = getAlgoOptionsForCommand(cmd)
    if (opts.length > 0 && !opts.includes(algorithm)) {
      const preferredHybrid = 'HYBRID:MLKEM-768+X25519'
      if (isHybridCommand(cmd)) {
        setAlgorithm(opts.includes(preferredHybrid) ? preferredHybrid : opts[0])
      } else {
        setAlgorithm(opts.includes('MLKEM-768') ? 'MLKEM-768' : opts[0])
      }
    }
  }

  const handleExecute = async () => {
    setIsExecuting(true)

    // ── Hybrid Labeled-KEM (educational) — does NOT go through the TPM wire ──
    if (isHybridCommand(commandType)) {
      await handleHybridExecute()
      setIsExecuting(false)
      return
    }

    const effectiveHandle = cmdDef?.requiresKem ? kemHandle : cmdDef?.requiresDsa ? dsaHandle : null

    const req = new Uint8Array(serializedBytes)
    const logEntry: TpmLogEntry = {
      commandType,
      algorithm: effectiveAlgo,
      request: req,
      response: null,
    }

    try {
      const response = await executeTpmCommand(req)
      logEntry.response = response
      onLogUpdate(logEntry)

      if (commandType === 'TPM2_CreatePrimary' && response.length >= 14) {
        const dv = new DataView(response.buffer, response.byteOffset)
        const rc = dv.getUint32(6, false)
        if (rc === 0) {
          const handle = dv.getUint32(10, false)
          const { isKem } = getAlgParams(effectiveAlgo)
          onObjectUpdate({
            handle: `0x${handle.toString(16).padStart(8, '0')}`,
            description: isKem ? 'PQC Endorsement Key (EK)' : 'PQC Attestation Key (AK)',
            algorithm: effectiveAlgo,
          })
        }
      }
    } catch (err) {
      logEntry.error = String(err)
      onLogUpdate(logEntry)
    } finally {
      setIsExecuting(false)
    }

    void effectiveHandle
  }

  /**
   * Dispatch the educational hybrid Labeled-KEM commands. Calls the bridge
   * directly (no TPM wire) and synthesises a log entry that mirrors the layout
   * the rest of the UI expects. Every primitive invoked is real ML-KEM /
   * real ECDH / real HKDF — per the playground spec, no stub crypto.
   */
  const handleHybridExecute = async () => {
    const { mlkem, classical } = parseHybridAlgo(effectiveAlgo)
    const mlkemParamSet = mlkemAlgoToParamSet(mlkem)

    const logEntry: TpmLogEntry = {
      commandType,
      algorithm: effectiveAlgo,
      request: new Uint8Array(serializedBytes),
      response: null,
    }

    try {
      if (commandType === 'TPM2_LabeledKEM_Hybrid_Encap') {
        // Peer side: generate a real classical key pair so the encap has a
        // real recipient. The private half is stashed in the ref so the
        // matching Decap step can reproduce the same shared secret.
        const peer = await generateHybridLabeledKemPeer(classical)
        const result = await hybridLabeledKemEncap(mlkemParamSet, classical, peer.rawPub)

        hybridSessionRef.current = {
          classicalAlg: classical,
          peerPrivKey: peer.privKey,
          peerRawPub: peer.rawPub,
          encapMlkemCt: result.mlkemCt,
          encapClassicalCt: result.classicalCt,
          encapCombinedSs: result.combinedSs,
          mlkemParamSet,
        }

        const summary =
          `Hybrid Labeled-KEM Encap OK (educational, not TCG v1.85)\n` +
          `  mlkem        : ${mlkem}\n` +
          `  classical    : ${classical}\n` +
          `  ct(ML-KEM)   : ${result.mlkemCt.length} B  ${toHexBytes(result.mlkemCt)}\n` +
          `  ct(classical): ${result.classicalCt.length} B  ${toHexBytes(result.classicalCt)}\n` +
          `  ss(ML-KEM)   : ${result.mlkemSs.length} B  ${toHexBytes(result.mlkemSs)}\n` +
          `  ss(classical): ${result.classicalSs.length} B  ${toHexBytes(result.classicalSs)}\n` +
          `  ss(combined) : ${result.combinedSs.length} B  ${toHexBytes(result.combinedSs)}\n`
        logEntry.response = new TextEncoder().encode(summary)
      } else {
        // Decap path — requires matching Encap state.
        const session = hybridSessionRef.current
        if (
          !session ||
          !session.encapMlkemCt ||
          !session.encapClassicalCt ||
          !session.encapCombinedSs
        ) {
          throw new Error(
            'Run TPM2_LabeledKEM_Hybrid_Encap with this algorithm first; the playground needs the captured ciphertexts to demonstrate the round trip.'
          )
        }
        if (session.mlkemParamSet !== mlkemParamSet || session.classicalAlg !== classical) {
          throw new Error(
            `Hybrid algorithm mismatch — Encap used ${mlkemParamName(session.mlkemParamSet)} + ${session.classicalAlg}, Decap requested ${mlkem} + ${classical}. Re-run Encap with the same selection.`
          )
        }

        const decap = await hybridLabeledKemDecap(
          mlkemParamSet,
          session.encapMlkemCt,
          classical,
          session.encapClassicalCt,
          session.peerPrivKey
        )
        const matches = bytesEqual(decap.combinedSs, session.encapCombinedSs)

        const summary =
          `Hybrid Labeled-KEM Decap OK (educational, not TCG v1.85)\n` +
          `  mlkem            : ${mlkem}\n` +
          `  classical        : ${classical}\n` +
          `  ss(ML-KEM)       : ${decap.mlkemSs.length} B  ${toHexBytes(decap.mlkemSs)}\n` +
          `  ss(classical)    : ${decap.classicalSs.length} B  ${toHexBytes(decap.classicalSs)}\n` +
          `  ss(combined)     : ${decap.combinedSs.length} B  ${toHexBytes(decap.combinedSs)}\n` +
          `  round-trip match : ${matches ? 'YES — combined secret equals Encap output' : 'NO — mismatch (bug)'}\n`
        logEntry.response = new TextEncoder().encode(summary)
      }
      onLogUpdate(logEntry)
    } catch (err) {
      logEntry.error = String(err)
      onLogUpdate(logEntry)
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Lifecycle stepper ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          TPM Lifecycle
        </p>
        <div className="flex items-center gap-1">
          {PHASES.map((phase, i) => {
            const isDone = completedPhases.has(phase.key)
            const isActive = phase.key === activePhase
            return (
              <div key={phase.key} className="flex items-center gap-1">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                    isDone
                      ? 'bg-status-success/10 text-status-success border border-status-success/30'
                      : isActive
                        ? 'bg-primary/10 text-primary border border-primary/40'
                        : 'bg-muted/30 text-muted-foreground border border-border'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                  ) : (
                    <Circle className="h-3 w-3 shrink-0" />
                  )}
                  <span className="hidden sm:inline">{phase.label}</span>
                  <span className="sm:hidden">{phase.short}</span>
                </div>
                {i < PHASES.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Command selector ── */}
      <div>
        <label
          htmlFor="cmd-type"
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block"
        >
          Command
        </label>
        <select
          id="cmd-type"
          value={commandType}
          onChange={(e) => handleCommandChange(e.target.value)}
          disabled={disabled || isExecuting}
          className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:ring-primary focus:border-primary"
        >
          {COMMAND_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.commands.map((cmd) => {
                const def = getCommandDef(cmd)
                const locked =
                  (def?.requiresKem && !kemHandle) ||
                  (def?.requiresDsa && !dsaHandle) ||
                  cmd === 'TPM2_Startup'
                return (
                  <option key={cmd} value={cmd} disabled={!!locked}>
                    {cmd}
                    {def?.requiresKem && !kemHandle ? ' (create ML-KEM key first)' : ''}
                    {def?.requiresDsa && !dsaHandle ? ' (create ML-DSA key first)' : ''}
                    {cmd === 'TPM2_Startup' ? ' (auto-called at init)' : ''}
                  </option>
                )
              })}
            </optgroup>
          ))}
        </select>
      </div>

      {/* ── Algorithm selector (only for relevant commands) ── */}
      {algoOptions.length > 0 && (
        <div>
          <label
            htmlFor="cmd-alg"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block"
          >
            {isHybridCommand(commandType)
              ? 'Hybrid Algorithm (educational — not TCG V1.85)'
              : 'Algorithm (TCG V1.85)'}
          </label>
          <select
            id="cmd-alg"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            disabled={disabled || isExecuting}
            className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:ring-primary focus:border-primary"
          >
            {isHybridCommand(commandType)
              ? HYBRID_ALGOS.filter((a) => algoOptions.includes(a)).map((a) => {
                  const { mlkem, classical } = parseHybridAlgo(a)
                  return (
                    <option key={a} value={a}>
                      Hybrid: {mlkem} + {classical} (ML-KEM + ECDH)
                    </option>
                  )
                })
              : [
                  ...KEM_ALGOS.filter((a) => algoOptions.includes(a)).map((a) => (
                    <option key={a} value={a}>
                      {a} (0x00A0 ML-KEM)
                    </option>
                  )),
                  ...DSA_ALGOS.filter((a) => algoOptions.includes(a)).map((a) => (
                    <option key={a} value={a}>
                      {a} (0x00A1 ML-DSA)
                    </option>
                  )),
                ]}
          </select>
        </div>
      )}

      {/* ── Educational-construct banner ── */}
      {isHybridCommand(commandType) && (
        <div className="flex items-start gap-2 text-xs bg-status-warning/10 border border-status-warning/30 rounded px-3 py-2 text-status-warning">
          <FlaskConical className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Educational construct — TCG TPM 2.0 Library v1.85 §11 defines Labeled KEM but does NOT
            standardize a hybrid (classical + PQ) mode. Every primitive below is real (ML-KEM via
            softhsmv3 PKCS#11, ECDH via Web Crypto, HKDF-SHA256 via Web Crypto), but the composition
            itself is teaching-only and not interoperable with conforming TPM implementations.
          </span>
        </div>
      )}

      {/* ── Command info card ── */}
      {cmdDef && (
        <div className="bg-muted/20 border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-foreground">{cmdDef.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                  {cmdDef.section}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                  CC=0x{cmdDef.cc.toString(16).padStart(8, '0')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{cmdDef.description}</p>
              <p className="text-xs text-accent/90 leading-relaxed">
                <span className="font-semibold">Why: </span>
                {cmdDef.why}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Parameter table ── */}
      {cmdDef && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Parameters
          </p>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-[35%]">
                    Name
                  </th>
                  <th className="text-left px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-[25%]">
                    Type
                  </th>
                  <th className="text-left px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Value / Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {cmdDef.params(effectiveAlgo).map((param, i) => (
                  <tr key={i} className="hover:bg-muted/10">
                    <td className="px-2 py-2 font-mono text-[11px] text-foreground align-top">
                      {param.name}
                    </td>
                    <td className="px-2 py-2 font-mono text-[10px] text-secondary align-top">
                      {param.tpmType}
                    </td>
                    <td className="px-2 py-2 align-top space-y-0.5">
                      <div className="font-mono text-[10px] text-primary">{param.value}</div>
                      <div className="text-[10px] text-muted-foreground leading-snug">
                        {param.description}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Hex preview ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          Command Stream (Hex)
        </p>
        <div className="bg-muted/30 border border-border p-2.5 rounded font-mono text-[10px] text-muted-foreground break-all max-h-20 overflow-y-auto">
          {toHex(serializedBytes)}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Bytes are synchronized with the semantic builder above.
        </p>
      </div>

      {/* ── Notices ── */}
      {(isGatedOnKem || isGatedOnDsa) && (
        <div className="text-xs text-status-warning bg-status-warning/10 border border-status-warning/30 rounded px-3 py-2">
          {isGatedOnKem
            ? 'Run TPM2_CreatePrimary with an ML-KEM algorithm first to obtain a key handle.'
            : 'Run TPM2_CreatePrimary with an ML-DSA algorithm first to obtain a key handle.'}
        </div>
      )}
      {commandType === 'TPM2_Startup' && (
        <div className="text-xs text-muted-foreground bg-muted/20 border border-border rounded px-3 py-2">
          TPM2_Startup is called automatically when the WASM module loads. Executing it manually
          will return <span className="font-mono text-status-error">TPM_RC_INITIALIZE (0x100)</span>
          .
        </div>
      )}
      <Button
        onClick={handleExecute}
        disabled={isCommandDisabled}
        variant="gradient"
        className="w-full"
      >
        {isExecuting ? 'Executing...' : `Send ${commandType}`}
      </Button>
    </div>
  )
}
