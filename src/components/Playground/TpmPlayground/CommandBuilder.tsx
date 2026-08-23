import { useState, useMemo, useRef } from 'react'
import { CheckCircle2, Circle, ChevronRight, Info, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { serializeDemoCommand, toHex, type DemoCommandExtras } from '../../../wasm/tpmSerializer'
import { executeTpmCommand } from '../../../wasm/tpmBridge'
import { useTpmBusy } from './useTpmBusy'
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
    label: 'Phase 4 — Streaming ML-DSA (chain Start → SequenceUpdate → Complete)',
    commands: [
      'TPM2_SignSequenceStart',
      'TPM2_SignSequenceComplete',
      'TPM2_VerifySequenceStart',
      'TPM2_SequenceUpdate',
      'TPM2_VerifySequenceComplete',
    ],
  },
  {
    label: 'Phase 4 — Driven by dedicated panels (info-only)',
    commands: [
      'TPM2_ReadPublic',
      'TPM2_Quote',
      'TPM2_Certify',
      'TPM2_NV_ReadPublic',
      'TPM2_NV_Read',
    ],
  },
  {
    label: 'Classical baseline — the commands V1.85 PQC modernizes',
    commands: [
      'TPM2_Sign',
      'TPM2_VerifySignature',
      'TPM2_RSA_Encrypt',
      'TPM2_RSA_Decrypt',
      'TPM2_HashSequenceStart',
      'TPM2_SequenceComplete',
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
const HASHMLDSA_ALGOS = ['HASHMLDSA-44', 'HASHMLDSA-65', 'HASHMLDSA-87']
// Classical RSA-2048 variants (Part 3 §24.1 published; live-probed WS0).
// ECC is deliberately absent: the shipped wasm build currently fails ECC
// CreatePrimary with TPM_RC_NO_RESULT (fork wasm bug, native build works) —
// don't offer what the engine can't honestly run.
const CLASSICAL_ALGOS = ['RSA-2048', 'RSA-2048-DEC', 'RSA-2048-AK']
const CLASSICAL_ALGO_LABELS: Record<string, string> = {
  'RSA-2048': 'RSA-2048 — classical signing key',
  'RSA-2048-DEC': 'RSA-2048 — classical decrypt key (OAEP)',
  'RSA-2048-AK': 'RSA-2048 — classical restricted AK (Quote)',
}
const ALL_ALGOS = [...KEM_ALGOS, ...DSA_ALGOS, ...HASHMLDSA_ALGOS]

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
  if (cmd === 'TPM2_CreatePrimary') return [...ALL_ALGOS, ...CLASSICAL_ALGOS]
  if (cmd === 'TPM2_Encapsulate' || cmd === 'TPM2_Decapsulate') return KEM_ALGOS
  if (cmd === 'TPM2_SignDigest' || cmd === 'TPM2_VerifyDigestSignature') return DSA_ALGOS
  if (
    cmd === 'TPM2_SignSequenceStart' ||
    cmd === 'TPM2_SignSequenceComplete' ||
    cmd === 'TPM2_VerifySequenceStart' ||
    cmd === 'TPM2_SequenceUpdate' ||
    cmd === 'TPM2_VerifySequenceComplete'
  ) {
    // HashML-DSA (0x00A2) is the primary use case for streaming sequence ops;
    // pure ML-DSA (0x00A1) is also valid — show both groups.
    return [...DSA_ALGOS, ...HASHMLDSA_ALGOS]
  }
  if (cmd === 'TPM2_NV_ReadPublic' || cmd === 'TPM2_NV_Read') {
    // Any of the 6 V2.7 EK cert NV slots can be read — the algorithm picker
    // selects which slot (see NV_CERT_INDEX_BY_ALGO in tpmSerializer.ts).
    return ALL_ALGOS
  }
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

// ── Cross-command result chaining ────────────────────────────────────────────
// Real bytes/handles captured from a prior command's response in this same
// session, so follow-up commands (Decapsulate, VerifyDigestSignature, the
// streaming sequence flow) send real chained data instead of synthetic
// placeholders. Each capture is keyed to the algorithm it was produced with —
// switching algorithms invalidates the capture, matching the same
// re-run-the-prerequisite behavior the Hybrid Labeled-KEM demo already uses.
interface ChainCaptures {
  encapCiphertext?: { algo: string; bytes: Uint8Array }
  digestSignature?: { algo: string; bytes: Uint8Array }
  signSeqHandle?: { algo: string; handle: number }
  verifySeqHandle?: { algo: string; handle: number }
  seqSignature?: { algo: string; bytes: Uint8Array }
  // Classical chaining. Hash-sequence captures are keyed to a fixed
  // 'SHA-256' pseudo-algorithm rather than the picker state — the hash
  // sequence involves no key object, so tying it to the algorithm dropdown
  // would spuriously invalidate the chain when the user switches commands.
  rsaSignature?: { algo: string; bytes: Uint8Array }
  rsaCiphertext?: { algo: string; bytes: Uint8Array }
  hashSeqHandle?: { algo: string; handle: number }
}

/** Parse a big-endian TPM response header: {tag, size, rc}. */
function parseRespHeader(resp: Uint8Array): { rc: number } {
  if (resp.length < 10) return { rc: -1 }
  const dv = new DataView(resp.buffer, resp.byteOffset, resp.byteLength)
  return { rc: dv.getUint32(6, false) }
}

/**
 * Capture whatever this response makes available for chaining into a later
 * command, given the response actually succeeded (rc === 0). Byte offsets
 * mirror the ones ComplianceRunner.tsx already proved out for the same wire
 * shapes — see TPM2_Encapsulate/SignDigest/SignSequenceStart/
 * VerifySequenceStart/SignSequenceComplete there.
 */
function captureChainedResult(
  commandType: string,
  algo: string,
  resp: Uint8Array,
  prev: ChainCaptures
): ChainCaptures {
  const dv = new DataView(resp.buffer, resp.byteOffset, resp.byteLength)
  try {
    if (commandType === 'TPM2_Encapsulate' && resp.length >= 12) {
      // NO_SESSIONS response: hdr(10) + TPM2B_DIGEST{size,ss} + TPM2B_KEM_CIPHERTEXT{size,ct}
      const ssSize = (resp[10] << 8) | resp[11]
      const ctSizeOff = 12 + ssSize
      if (resp.length >= ctSizeOff + 2) {
        const ctSize = (resp[ctSizeOff] << 8) | resp[ctSizeOff + 1]
        const ctStart = ctSizeOff + 2
        if (resp.length >= ctStart + ctSize) {
          return {
            ...prev,
            encapCiphertext: { algo, bytes: resp.slice(ctStart, ctStart + ctSize) },
          }
        }
      }
    } else if (commandType === 'TPM2_SignDigest' && resp.length >= 18) {
      // SESSIONS response: hdr(10) + paramSize(4) + sigAlg(2) + sig.size(2) + sig.buffer
      const sigAlg = dv.getUint16(14, false)
      const sigSize = dv.getUint16(16, false)
      if (sigAlg === 0x00a1 && resp.length >= 18 + sigSize) {
        return {
          ...prev,
          digestSignature: { algo, bytes: resp.slice(18, 18 + sigSize) },
        }
      }
    } else if (commandType === 'TPM2_SignSequenceStart' && resp.length >= 14) {
      // NO_SESSIONS response: hdr(10) + sequenceHandle(4)
      return { ...prev, signSeqHandle: { algo, handle: dv.getUint32(10, false) } }
    } else if (commandType === 'TPM2_VerifySequenceStart' && resp.length >= 14) {
      return { ...prev, verifySeqHandle: { algo, handle: dv.getUint32(10, false) } }
    } else if (commandType === 'TPM2_SignSequenceComplete' && resp.length >= 18) {
      const sigAlg = dv.getUint16(14, false)
      const sigSize = dv.getUint16(16, false)
      if (sigAlg === 0x00a1 && resp.length >= 18 + sigSize) {
        return {
          ...prev,
          seqSignature: { algo, bytes: resp.slice(18, 18 + sigSize) },
        }
      }
    } else if (commandType === 'TPM2_Sign' && resp.length >= 20) {
      // SESSIONS response: hdr(10) + paramSize(4) + sigAlg(2) + hashAlg(2) +
      // sig.size(2) + sig — TPMS_SIGNATURE_RSA embeds hashAlg (live-verified WS0).
      const sigAlg = dv.getUint16(14, false)
      const sigSize = dv.getUint16(18, false)
      if (sigAlg === 0x0014 && resp.length >= 20 + sigSize) {
        return { ...prev, rsaSignature: { algo, bytes: resp.slice(20, 20 + sigSize) } }
      }
    } else if (commandType === 'TPM2_RSA_Encrypt' && resp.length >= 12) {
      // NO_SESSIONS response: hdr(10) + TPM2B_PUBLIC_KEY_RSA{size, bytes}
      const ctSize = dv.getUint16(10, false)
      if (resp.length >= 12 + ctSize) {
        return { ...prev, rsaCiphertext: { algo, bytes: resp.slice(12, 12 + ctSize) } }
      }
    } else if (commandType === 'TPM2_HashSequenceStart' && resp.length >= 14) {
      // NO_SESSIONS response: hdr(10) + sequenceHandle(4). Fixed pseudo-algo
      // key — see ChainCaptures.
      return { ...prev, hashSeqHandle: { algo: 'SHA-256', handle: dv.getUint32(10, false) } }
    }
  } catch {
    // Malformed/short response — nothing to capture, leave prior state as-is.
  }
  return prev
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
  const tpmBusy = useTpmBusy()

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

  // Real results chained from prior commands in this session — see
  // ChainCaptures / captureChainedResult above.
  const [chain, setChain] = useState<ChainCaptures>({})

  const kemHandle = objects.find((o) => o.algorithm.startsWith('MLKEM'))?.handle ?? null
  const dsaHandle =
    objects.find((o) => o.algorithm.startsWith('MLDSA') || o.algorithm.startsWith('HASHMLDSA'))
      ?.handle ?? null
  const rsaSignHandle = objects.find((o) => o.algorithm === 'RSA-2048')?.handle ?? null
  const rsaDecHandle = objects.find((o) => o.algorithm === 'RSA-2048-DEC')?.handle ?? null

  const cmdDef = getCommandDef(commandType)
  const algoOptions = getAlgoOptionsForCommand(commandType)
  const algorithmLabel = isHybridCommand(commandType)
    ? 'Hybrid Algorithm (educational — not TCG V1.85)'
    : 'Algorithm (TCG V1.85)'

  // Determine if this command is gated on a handle
  const isGatedOnKem = cmdDef?.requiresKem && !kemHandle
  const isGatedOnDsa = cmdDef?.requiresDsa && !dsaHandle
  const isGatedOnRsaSign = cmdDef?.requiresRsaSign && !rsaSignHandle
  const isGatedOnRsaDecrypt = cmdDef?.requiresRsaDecrypt && !rsaDecHandle

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
      if (cmdDef?.requiresRsaSign && rsaSignHandle) return 'RSA-2048'
      if (cmdDef?.requiresRsaDecrypt && rsaDecHandle) return 'RSA-2048-DEC'
      // Hash-sequence commands involve no key object — pin their chain key
      // to the same fixed pseudo-algorithm captureChainedResult uses.
      if (commandType === 'TPM2_HashSequenceStart' || commandType === 'TPM2_SequenceComplete') {
        return 'SHA-256'
      }
      // SequenceUpdate serves both flows and has no key of its own: follow
      // whichever sequence is actually open (PQC verify seq wins, matching
      // the serializer's preference), so chain lookups resolve correctly.
      if (commandType === 'TPM2_SequenceUpdate') {
        return chain.verifySeqHandle?.algo ?? 'SHA-256'
      }
    }
    return algorithm
  }, [
    cmdDef,
    kemHandle,
    dsaHandle,
    rsaSignHandle,
    rsaDecHandle,
    commandType,
    algorithm,
    objects,
    chain.verifySeqHandle,
  ])

  // Resolve the numeric handle for commands that reference a loaded key
  const effectiveHandleNum = useMemo(() => {
    const h = cmdDef?.requiresKem
      ? kemHandle
      : cmdDef?.requiresDsa
        ? dsaHandle
        : cmdDef?.requiresRsaSign
          ? rsaSignHandle
          : cmdDef?.requiresRsaDecrypt
            ? rsaDecHandle
            : null
    return h ? parseInt(h, 16) : 0x80000000
  }, [cmdDef, kemHandle, dsaHandle, rsaSignHandle, rsaDecHandle])

  // Chained values for the current command+algorithm, if the prerequisite
  // command was run with this same algorithm. A mismatched or missing
  // algorithm is treated as "not chained" — the notice below tells the user
  // which command to (re-)run rather than silently sending placeholder bytes.
  const chainedCiphertext =
    chain.encapCiphertext?.algo === effectiveAlgo ? chain.encapCiphertext.bytes : undefined
  const chainedDigestSignature =
    chain.digestSignature?.algo === effectiveAlgo ? chain.digestSignature.bytes : undefined
  const chainedSignSeqHandle =
    chain.signSeqHandle?.algo === effectiveAlgo ? chain.signSeqHandle.handle : undefined
  const chainedVerifySeqHandle =
    chain.verifySeqHandle?.algo === effectiveAlgo ? chain.verifySeqHandle.handle : undefined
  const chainedSeqSignature =
    chain.seqSignature?.algo === effectiveAlgo ? chain.seqSignature.bytes : undefined
  const chainedRsaSignature =
    chain.rsaSignature?.algo === effectiveAlgo ? chain.rsaSignature.bytes : undefined
  const chainedRsaCiphertext =
    chain.rsaCiphertext?.algo === effectiveAlgo ? chain.rsaCiphertext.bytes : undefined
  // Hash-sequence chain uses the fixed 'SHA-256' pseudo-algo key (see ChainCaptures)
  const chainedHashSeqHandle =
    chain.hashSeqHandle?.algo === 'SHA-256' ? chain.hashSeqHandle.handle : undefined

  const missingChainPrereq: string | null =
    commandType === 'TPM2_Decapsulate' && !chainedCiphertext
      ? 'Run TPM2_Encapsulate with this algorithm first — Decapsulate needs its real ciphertext, not synthetic bytes.'
      : commandType === 'TPM2_VerifyDigestSignature' && !chainedDigestSignature
        ? 'Run TPM2_SignDigest with this algorithm first — Verify needs its real signature, not synthetic bytes.'
        : commandType === 'TPM2_SignSequenceComplete' && !chainedSignSeqHandle
          ? 'Run TPM2_SignSequenceStart with this algorithm first to obtain a real sequence handle.'
          : commandType === 'TPM2_SequenceUpdate' &&
              !chainedVerifySeqHandle &&
              !chainedHashSeqHandle
            ? 'Run TPM2_VerifySequenceStart (PQC) or TPM2_HashSequenceStart (classical) first to obtain a real sequence handle to feed.'
            : commandType === 'TPM2_VerifySequenceComplete' &&
                (!chainedVerifySeqHandle || !chainedSeqSignature)
              ? !chainedVerifySeqHandle
                ? 'Run TPM2_VerifySequenceStart with this algorithm first to obtain a real sequence handle.'
                : 'Run TPM2_SignSequenceStart then TPM2_SignSequenceComplete with this algorithm first to obtain a real signature to verify.'
              : commandType === 'TPM2_VerifySignature' && !chainedRsaSignature
                ? 'Run TPM2_Sign first — VerifySignature needs its real RSA signature, not synthetic bytes.'
                : commandType === 'TPM2_RSA_Decrypt' && !chainedRsaCiphertext
                  ? 'Run TPM2_RSA_Encrypt first — Decrypt needs its real OAEP ciphertext (unlike ML-KEM, OAEP fails loudly on garbage).'
                  : commandType === 'TPM2_SequenceComplete' && !chainedHashSeqHandle
                    ? 'Run TPM2_HashSequenceStart first to obtain a real hash-sequence handle.'
                    : null

  const isCommandDisabled =
    disabled ||
    isExecuting ||
    tpmBusy ||
    !!isGatedOnKem ||
    !!isGatedOnDsa ||
    !!isGatedOnRsaSign ||
    !!isGatedOnRsaDecrypt ||
    commandType === 'TPM2_Startup' ||
    !!missingChainPrereq

  const chainExtras: DemoCommandExtras = {
    ciphertext: chainedCiphertext,
    digestSignature: chainedDigestSignature,
    signSeqHandle: chainedSignSeqHandle,
    verifySeqHandle: chainedVerifySeqHandle,
    seqSignature: chainedSeqSignature,
    rsaSignature: chainedRsaSignature,
    rsaCiphertext: chainedRsaCiphertext,
    hashSeqHandle: chainedHashSeqHandle,
  }

  const serializedBytes = useMemo(
    () => serializeDemoCommand(commandType, effectiveAlgo, effectiveHandleNum, chainExtras),
    [
      commandType,
      effectiveAlgo,
      effectiveHandleNum,
      chainedCiphertext,
      chainedDigestSignature,
      chainedSignSeqHandle,
      chainedVerifySeqHandle,
      chainedSeqSignature,
      chainedRsaSignature,
      chainedRsaCiphertext,
      chainedHashSeqHandle,
    ]
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
          const description = effectiveAlgo.startsWith('RSA')
            ? effectiveAlgo === 'RSA-2048-AK'
              ? 'Classical restricted AK (pre-quantum)'
              : effectiveAlgo === 'RSA-2048-DEC'
                ? 'Classical decrypt key (pre-quantum)'
                : 'Classical signing key (pre-quantum)'
            : getAlgParams(effectiveAlgo).isKem
              ? 'PQC Endorsement Key (EK)'
              : 'PQC Attestation Key (AK)'
          onObjectUpdate({
            handle: `0x${handle.toString(16).padStart(8, '0')}`,
            description,
            algorithm: effectiveAlgo,
          })
        }
      }

      // Chain real results into follow-up commands (Decapsulate,
      // VerifyDigestSignature, the streaming sequence flow) instead of
      // leaving them stuck sending synthetic placeholder bytes.
      if (parseRespHeader(response).rc === 0) {
        setChain((prev) => captureChainedResult(commandType, effectiveAlgo, response, prev))
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
        {/*
          DOCUMENTED EXCEPTION to the <FilterDropdown> contract (WS22 Stage 2).
          This control needs two things FilterDropdown cannot express:
          (1) <optgroup> — the five COMMAND_GROUPS are the mental model of the
              TPM command set and flattening them loses the teaching structure;
          (2) per-option `disabled` — commands whose prerequisite key does not
              exist yet MUST be unselectable. FilterDropdown has no disabled
              option, so converting would let a learner dispatch e.g.
              TPM2_Decapsulate with no ML-KEM handle and hit a raw TPM error.
          Revisit if FilterDropdown ever grows grouped/disabled items.
        */}
        {/* eslint-disable-next-line no-restricted-syntax -- see exception note above */}
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
                  (def?.requiresRsaSign && !rsaSignHandle) ||
                  (def?.requiresRsaDecrypt && !rsaDecHandle) ||
                  cmd === 'TPM2_Startup'
                return (
                  <option key={cmd} value={cmd} disabled={!!locked}>
                    {cmd}
                    {def?.requiresKem && !kemHandle ? ' (create ML-KEM key first)' : ''}
                    {def?.requiresDsa && !dsaHandle ? ' (create ML-DSA key first)' : ''}
                    {def?.requiresRsaSign && !rsaSignHandle
                      ? ' (create RSA-2048 signing key first)'
                      : ''}
                    {def?.requiresRsaDecrypt && !rsaDecHandle
                      ? ' (create RSA-2048 decrypt key first)'
                      : ''}
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
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
            {algorithmLabel}
          </div>
          <FilterDropdown
            items={
              isHybridCommand(commandType)
                ? HYBRID_ALGOS.filter((a) => algoOptions.includes(a)).map((a) => {
                    const { mlkem, classical } = parseHybridAlgo(a)
                    return { id: a, label: `Hybrid: ${mlkem} + ${classical} (ML-KEM + ECDH)` }
                  })
                : [
                    ...KEM_ALGOS.filter((a) => algoOptions.includes(a)).map((a) => ({
                      id: a,
                      label: `${a} (0x00A0 ML-KEM)`,
                    })),
                    ...DSA_ALGOS.filter((a) => algoOptions.includes(a)).map((a) => ({
                      id: a,
                      label: `${a} (0x00A1 ML-DSA)`,
                    })),
                    ...CLASSICAL_ALGOS.filter((a) => algoOptions.includes(a)).map((a) => ({
                      id: a,
                      label: CLASSICAL_ALGO_LABELS[a] ?? a,
                    })),
                  ]
            }
            selectedId={algorithm}
            onSelect={(id) => setAlgorithm(id)}
            ariaLabel={algorithmLabel}
            disabled={disabled || isExecuting}
            hideDefaultOption
            noContainer
            className="w-full"
          />
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
            <div className="overflow-x-auto">
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
      {(isGatedOnKem || isGatedOnDsa || isGatedOnRsaSign || isGatedOnRsaDecrypt) && (
        <div className="text-xs text-status-warning bg-status-warning/10 border border-status-warning/30 rounded px-3 py-2">
          {isGatedOnKem
            ? 'Run TPM2_CreatePrimary with an ML-KEM algorithm first to obtain a key handle.'
            : isGatedOnDsa
              ? 'Run TPM2_CreatePrimary with an ML-DSA algorithm first to obtain a key handle.'
              : isGatedOnRsaSign
                ? 'Run TPM2_CreatePrimary with "RSA-2048 — classical signing key" first to obtain a key handle.'
                : 'Run TPM2_CreatePrimary with "RSA-2048 — classical decrypt key" first to obtain a key handle.'}
        </div>
      )}
      {!isGatedOnKem &&
        !isGatedOnDsa &&
        !isGatedOnRsaSign &&
        !isGatedOnRsaDecrypt &&
        missingChainPrereq && (
          <div className="text-xs text-status-warning bg-status-warning/10 border border-status-warning/30 rounded px-3 py-2">
            {missingChainPrereq}
          </div>
        )}
      {!missingChainPrereq &&
        (chainedCiphertext ||
          chainedDigestSignature ||
          chainedSignSeqHandle !== undefined ||
          (commandType === 'TPM2_VerifySignature' && chainedRsaSignature) ||
          (commandType === 'TPM2_RSA_Decrypt' && chainedRsaCiphertext) ||
          ((commandType === 'TPM2_SequenceUpdate' || commandType === 'TPM2_SequenceComplete') &&
            chainedHashSeqHandle !== undefined) ||
          (commandType === 'TPM2_VerifySequenceComplete' && chainedSeqSignature)) && (
          <div className="text-xs text-status-success bg-status-success/10 border border-status-success/30 rounded px-3 py-2">
            Using the real result captured from the prerequisite command above — not synthetic
            bytes.
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
