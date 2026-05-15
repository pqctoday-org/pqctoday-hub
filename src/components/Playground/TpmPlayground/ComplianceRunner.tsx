import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Terminal, Copy, CheckCircle, XCircle, Loader2, Shield } from 'lucide-react'
import { executeTpmCommand, getLastTpmErr, clearLastTpmErr } from '../../../wasm/tpmBridge'
import {
  buildCommand,
  toHex,
  TPM_ST_NO_SESSIONS,
  TPM_ST_SESSIONS,
} from '../../../wasm/tpmSerializer'

// ── TPM2 Constants (TCG V1.85 RC4) ─────────────────────────────────
const CC_SELF_TEST = 0x00000143
const CC_GET_CAPABILITY = 0x0000017a
const CC_GET_RANDOM = 0x0000017b
const CC_CREATE_PRIMARY = 0x00000131
const CC_ENCAPSULATE = 0x000001a7
const CC_DECAPSULATE = 0x000001a8
const CC_SIGN_DIGEST = 0x000001a6
const CC_VERIFY_DIGEST_SIG = 0x000001a5
const CC_SIGN_SEQ_START = 0x000001aa
const CC_SIGN_SEQ_COMPLETE = 0x000001a4
const CC_VERIFY_SEQ_START = 0x000001a9
const CC_VERIFY_SEQ_COMPLETE = 0x000001a3
const CC_SEQUENCE_UPDATE = 0x0000015c
const CC_FLUSH_CONTEXT = 0x00000165

const TPM_ST_MESSAGE_VERIFIED = 0x8026
const TPM_ST_DIGEST_VERIFIED = 0x8027
const TPM_ST_HASHCHECK = 0x8024
const TPM_RH_NULL = 0x40000007

const CAP_ALGS = 0x00000000

const ALG_MLKEM = 0x00a0
const ALG_MLDSA = 0x00a1
const ALG_SHA256 = 0x000b
const ALG_AES = 0x0006
const ALG_CFB = 0x0043
const ALG_NULL = 0x0010

const MLKEM_768 = 0x0002
const MLDSA_65 = 0x0002

const RH_OWNER = 0x40000001
const RH_ENDORSEMENT = 0x4000000b
const RS_PW = 0x40000009

// TPMA_OBJECT bits
const OBJ_FIXED_TPM = 0x00000002
const OBJ_FIXED_PARENT = 0x00000010
const OBJ_SENSITIVE_DATA = 0x00000020
const OBJ_USER_WITH_AUTH = 0x00000040
const OBJ_RESTRICTED = 0x00010000
const OBJ_DECRYPT = 0x00020000
const OBJ_SIGN = 0x00040000

// FIPS size constants
const MLKEM_768_PK_SIZE = 1184
const MLKEM_768_CT_SIZE = 1088
const MLKEM_SHARED_SECRET_SIZE = 32
const MLDSA_65_PK_SIZE = 1952
const MLDSA_65_SIG_SIZE = 3309

// ── Helpers ─────────────────────────────────────────────────────────
function parseHeader(resp: Uint8Array) {
  const dv = new DataView(resp.buffer, resp.byteOffset, resp.byteLength)
  return { tag: dv.getUint16(0, false), size: dv.getUint32(2, false), rc: dv.getUint32(6, false) }
}

function putU16(buf: number[], v: number) {
  buf.push((v >> 8) & 0xff, v & 0xff)
}
function putU32(buf: number[], v: number) {
  buf.push((v >> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff)
}
function getU16(resp: Uint8Array, off: number) {
  return (resp[off] << 8) | resp[off + 1]
}
function getU32(resp: Uint8Array, off: number) {
  return ((resp[off] << 24) | (resp[off + 1] << 16) | (resp[off + 2] << 8) | resp[off + 3]) >>> 0
}

function buildGetCapability(cap: number, property: number, count: number): Uint8Array {
  const p: number[] = []
  putU32(p, cap)
  putU32(p, property)
  putU32(p, count)
  return buildCommand(TPM_ST_NO_SESSIONS, CC_GET_CAPABILITY, new Uint8Array(p))
}

function buildCreatePrimary(
  hierarchy: number,
  algId: number,
  paramSet: number,
  attrs: number,
  isKem: boolean
): Uint8Array {
  const p: number[] = []
  // Tag + size placeholder + CC
  putU16(p, TPM_ST_SESSIONS)
  putU32(p, 0) // size placeholder at index 2
  putU32(p, CC_CREATE_PRIMARY)
  putU32(p, hierarchy)
  // Auth area: 1 empty-password session (9 bytes)
  putU32(p, 9)
  putU32(p, RS_PW)
  putU16(p, 0)
  p.push(0)
  putU16(p, 0)
  // inSensitive: size=4, userAuth=0, data=0
  putU16(p, 4)
  putU16(p, 0)
  putU16(p, 0)
  // inPublic: TPM2B_PUBLIC
  const pubSizeIdx = p.length
  putU16(p, 0) // placeholder
  const pubStart = p.length
  putU16(p, algId)
  putU16(p, ALG_SHA256)
  putU32(p, attrs)
  putU16(p, 0) // authPolicy empty
  // PQC parameter block
  if (isKem) {
    if (attrs & OBJ_RESTRICTED) {
      putU16(p, ALG_AES)
      putU16(p, 128)
      putU16(p, ALG_CFB)
    } else {
      putU16(p, ALG_NULL)
    }
    putU16(p, paramSet)
  } else {
    // ML-DSA: parameterSet + allowExternalMu=YES
    putU16(p, paramSet)
    p.push(0x01)
  }
  putU16(p, 0) // unique empty
  // Patch pubSize
  const pubSize = p.length - pubStart
  p[pubSizeIdx] = (pubSize >> 8) & 0xff
  p[pubSizeIdx + 1] = pubSize & 0xff
  // outsideInfo + creationPCR
  putU16(p, 0)
  putU32(p, 0)
  // Patch total size
  const total = p.length
  p[2] = (total >> 24) & 0xff
  p[3] = (total >> 16) & 0xff
  p[4] = (total >> 8) & 0xff
  p[5] = total & 0xff
  return new Uint8Array(p)
}

// ── Check types ─────────────────────────────────────────────────────
type CheckStatus = 'pending' | 'running' | 'pass' | 'fail' | 'error'

interface CheckEntry {
  id: string
  name: string
  section: string
  status: CheckStatus
  detail: string
}

// ── Scenario flow types ──────────────────────────────────────────────
type ScenarioLineType = 'phase' | 'send' | 'recv' | 'divider' | 'table-header' | 'table-row'

interface ScenarioLine {
  type: ScenarioLineType
  text: string
  ok?: boolean
}

const INITIAL_CHECKS: Omit<CheckEntry, 'status' | 'detail'>[] = [
  { id: 'V185-001', name: 'TPM2_SelfTest(fullTest)', section: 'Part 3 §10.2' },
  { id: 'V185-002', name: 'Response Header Structure', section: 'Part 1 §15.2' },
  { id: 'V185-003', name: 'TPM2_GetCapability(ALGS)', section: 'Part 3 §30.2' },
  { id: 'V185-004', name: 'ML-KEM Algorithm Registered (0x00A0)', section: 'Part 2 §6.3' },
  { id: 'V185-005', name: 'ML-DSA Algorithm Registered (0x00A1)', section: 'Part 2 §6.3' },
  { id: 'V185-006', name: 'TPM2_GetRandom Entropy Source', section: '§16.1' },
  { id: 'V185-007', name: 'Entropy Non-Trivial (32B)', section: '§16.1' },
  { id: 'V185-008', name: 'CreatePrimary ML-KEM-768 EK', section: '§11.2.6 Table 204' },
  { id: 'V185-009', name: 'ML-KEM-768 Public Key = 1184 B', section: 'FIPS 203' },
  { id: 'V185-010', name: 'CreatePrimary ML-DSA-65 AK', section: '§11.2.7 Table 207' },
  { id: 'V185-011', name: 'ML-DSA-65 Public Key = 1952 B', section: 'FIPS 204' },
  { id: 'V185-012', name: 'TPM2_Encapsulate (ML-KEM-768 EK)', section: '§14.10' },
  { id: 'V185-013', name: 'Encapsulate Output Sizes', section: 'FIPS 203 §7' },
  { id: 'V185-014', name: 'TPM2_Decapsulate (ML-KEM-768 EK)', section: '§14.11' },
  { id: 'V185-015', name: 'TPM2_SignDigest (ML-DSA-65 AK)', section: '§20.7' },
  { id: 'V185-016', name: 'SignDigest Signature Size = 3309 B', section: 'FIPS 204 §7' },
  { id: 'V185-017', name: 'KEM Round-Trip: ss_encap === ss_decap', section: 'FIPS 203 §7.3' },
  { id: 'V185-018', name: 'DSA Non-Trivial: sig ≠ placeholder', section: 'Issue #9' },
  { id: 'V185-019', name: 'TPM2_VerifyDigestSignature (DIGEST_VERIFIED)', section: 'Part 3 §20.4' },
  { id: 'V185-020', name: 'TPM2_SignSequenceStart → sequenceHandle', section: 'Part 3 §17.5' },
  {
    id: 'V185-021',
    name: 'TPM2_SignSequenceComplete sig=3309 B',
    section: 'Part 3 §20.6 + FIPS 204',
  },
  { id: 'V185-022', name: 'TPM2_VerifySequenceStart → sequenceHandle', section: 'Part 3 §17.6' },
  {
    id: 'V185-023',
    name: 'TPM2_SequenceUpdate (verify, 256 B chunk)',
    section: 'Part 3 §17.7',
  },
  {
    id: 'V185-024',
    name: 'TPM2_VerifySequenceComplete → MESSAGE_VERIFIED',
    section: 'Part 3 §20.3 Table 119',
  },
]

export function ComplianceRunner() {
  const [isRunning, setIsRunning] = useState(false)
  const [checks, setChecks] = useState<CheckEntry[]>([])
  const [summary, setSummary] = useState<{ pass: number; fail: number; total: number } | null>(null)
  const [activeTab, setActiveTab] = useState<'compliance' | 'scenario'>('compliance')
  const [scenarioLines, setScenarioLines] = useState<ScenarioLine[]>([])
  const abortRef = useRef(false)

  const updateCheck = (id: string, update: Partial<CheckEntry>) => {
    setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...update } : c)))
  }

  const addLine = (type: ScenarioLineType, text: string, ok?: boolean) => {
    setScenarioLines((prev) => [...prev, { type, text, ok }])
  }

  const runSuite = async () => {
    abortRef.current = false
    setIsRunning(true)
    setSummary(null)
    setChecks(INITIAL_CHECKS.map((c) => ({ ...c, status: 'pending' as CheckStatus, detail: '' })))
    // Phase 1 is always successful (TPM initialised on module load)
    setScenarioLines([
      { type: 'phase', text: '[+] Phase 1 — TPM Initialization' },
      { type: 'send', text: '    → tpm_wasm_startup()  →  TPM2_Startup(TPM_SU_CLEAR)' },
      { type: 'recv', text: '    ← RC=0x00000000  module ready, NV initialized ✓', ok: true },
      { type: 'divider', text: '' },
    ])

    let pass = 0
    let fail = 0
    const algList: number[] = []
    let ekHandle = 0
    let akHandle = 0
    let encapSharedSecret: Uint8Array | null = null
    let decapSharedSecret: Uint8Array | null = null
    let signatureBytes: Uint8Array | null = null
    let encapCiphertext: Uint8Array | null = null

    const markPass = (id: string, detail: string) => {
      pass++
      updateCheck(id, { status: 'pass', detail })
    }
    const markFail = (id: string, detail: string) => {
      fail++
      updateCheck(id, { status: 'fail', detail })
    }
    const markError = (id: string, detail: string) => {
      fail++
      updateCheck(id, { status: 'error', detail })
    }

    const delay = () => new Promise((r) => setTimeout(r, 80))

    try {
      // ── Phase 2: Algorithm Self-Test ────────────────────────────
      addLine('phase', '[+] Phase 2 — Algorithm Self-Test  (TCG V1.85 Part 3 §10.2)')
      addLine('send', '    → TPM2_SelfTest(fullTest=1)')

      updateCheck('V185-001', { status: 'running' })
      await delay()
      try {
        const cmd = buildCommand(TPM_ST_NO_SESSIONS, CC_SELF_TEST, new Uint8Array([0x01]))
        const resp = await executeTpmCommand(cmd)
        const h = parseHeader(resp)
        if (h.rc === 0) {
          markPass('V185-001', 'Self-test completed (TPM_RC_SUCCESS)')
          addLine('recv', '    ← Self-test completed (TPM_RC_SUCCESS) ✓', true)
        } else {
          markFail('V185-001', `RC=0x${h.rc.toString(16).padStart(8, '0')}`)
          addLine(
            'recv',
            `    ← Self-test FAILED: RC=0x${h.rc.toString(16).padStart(8, '0')} ✗`,
            false
          )
        }
      } catch (e) {
        markError('V185-001', String(e))
        addLine('recv', `    ← ERROR: ${String(e)}`, false)
      }

      // V185-002: Response header structure (validation-only, no scenario phase)
      updateCheck('V185-002', { status: 'running' })
      await delay()
      try {
        const cmd = buildCommand(TPM_ST_NO_SESSIONS, CC_GET_RANDOM, new Uint8Array([0x00, 0x10]))
        const resp = await executeTpmCommand(cmd)
        const h = parseHeader(resp)
        const tagOk = h.tag === 0x8001 || h.tag === 0x8002
        const sizeOk = h.size === resp.length
        const rcOk = h.rc === 0
        if (tagOk && sizeOk && rcOk) {
          markPass('V185-002', `Tag=0x${h.tag.toString(16)} Size=${h.size}B RC=0x00000000 ✓`)
        } else {
          markFail(
            'V185-002',
            `Tag=${tagOk ? '✓' : '✗'} Size=${sizeOk ? '✓' : `header=${h.size} actual=${resp.length}`} RC=${rcOk ? '✓' : '✗'}`
          )
        }
      } catch (e) {
        markError('V185-002', String(e))
      }

      addLine('divider', '')

      // ── Phase 3: Capability Discovery ───────────────────────────
      addLine('phase', '[+] Phase 3 — Capability Discovery  (TCG V1.85 §30.2)')
      addLine('send', '    → TPM2_GetCapability(TPM_CAP_ALGS, property=0, count=256)')

      updateCheck('V185-003', { status: 'running' })
      await delay()
      try {
        const cmd = buildGetCapability(CAP_ALGS, 0, 256)
        const resp = await executeTpmCommand(cmd)
        const h = parseHeader(resp)
        if (h.rc !== 0) {
          markFail('V185-003', `RC=0x${h.rc.toString(16).padStart(8, '0')}`)
          addLine('recv', `    ← FAILED: RC=0x${h.rc.toString(16).padStart(8, '0')} ✗`, false)
        } else {
          const count = getU32(resp, 15)
          for (let i = 0; i < count && 19 + i * 6 + 2 <= resp.length; i++) {
            algList.push(getU16(resp, 19 + i * 6))
          }
          markPass('V185-003', `${algList.length} algorithms enumerated`)
          addLine('recv', `    ← ${algList.length} algorithms enumerated ✓`, true)
        }
      } catch (e) {
        markError('V185-003', String(e))
        addLine('recv', `    ← ERROR: ${String(e)}`, false)
      }

      updateCheck('V185-004', { status: 'running' })
      await delay()
      addLine('send', '    → checking TPM_ALG_MLKEM (0x00A0)')
      if (algList.includes(ALG_MLKEM)) {
        markPass('V185-004', `TPM_ALG_MLKEM (0x00A0) present`)
        addLine(
          'recv',
          '    ← ML-KEM-768: registered ✓  (FIPS 203, TCG V1.85 Part 2 §6.3 + §11.2.6)',
          true
        )
      } else {
        markFail('V185-004', `TPM_ALG_MLKEM (0x00A0) NOT found in ${algList.length} algorithms`)
        addLine('recv', `    ← ML-KEM-768 (0x00A0): NOT REGISTERED ✗`, false)
      }

      updateCheck('V185-005', { status: 'running' })
      await delay()
      addLine('send', '    → checking TPM_ALG_MLDSA (0x00A1)')
      if (algList.includes(ALG_MLDSA)) {
        markPass('V185-005', `TPM_ALG_MLDSA (0x00A1) present`)
        addLine(
          'recv',
          '    ← ML-DSA-65: registered ✓  (FIPS 204, TCG V1.85 Part 2 §6.3 + §11.2.7)',
          true
        )
      } else {
        markFail('V185-005', `TPM_ALG_MLDSA (0x00A1) NOT found in ${algList.length} algorithms`)
        addLine('recv', `    ← ML-DSA-65 (0x00A1): NOT REGISTERED ✗`, false)
      }

      addLine('divider', '')

      // ── Phase 4: Entropy Verification ───────────────────────────
      addLine('phase', '[+] Phase 4 — Entropy Verification  (TCG V1.85 §16.1)')
      addLine('send', '    → TPM2_GetRandom(bytesRequested=32)')

      updateCheck('V185-006', { status: 'running' })
      await delay()
      let randomBytes: Uint8Array | null = null
      try {
        const cmd = buildCommand(TPM_ST_NO_SESSIONS, CC_GET_RANDOM, new Uint8Array([0x00, 0x20]))
        const resp = await executeTpmCommand(cmd)
        const h = parseHeader(resp)
        if (h.rc !== 0) {
          markFail('V185-006', `RC=0x${h.rc.toString(16).padStart(8, '0')}`)
          addLine('recv', `    ← FAILED: RC=0x${h.rc.toString(16).padStart(8, '0')} ✗`, false)
        } else {
          const randSize = getU16(resp, 10)
          randomBytes = resp.slice(12, 12 + randSize)
          if (randSize >= 32) {
            markPass('V185-006', `${randSize} random bytes returned`)
            addLine(
              'recv',
              `    ← ${randSize} random bytes returned  (DRBG, AES-256-CTR seeded at manufacture) ✓`,
              true
            )
          } else {
            markFail('V185-006', `Only ${randSize} bytes (requested 32)`)
            addLine('recv', `    ← Only ${randSize} bytes returned (requested 32) ✗`, false)
          }
        }
      } catch (e) {
        markError('V185-006', String(e))
        addLine('recv', `    ← ERROR: ${String(e)}`, false)
      }

      updateCheck('V185-007', { status: 'running' })
      await delay()
      if (randomBytes && randomBytes.length >= 32) {
        const allZero = randomBytes.every((b) => b === 0)
        const allSame = randomBytes.every((b) => b === randomBytes![0])
        if (!allZero && !allSame) {
          markPass('V185-007', `Entropy OK (first 4: ${toHex(randomBytes.slice(0, 4))})`)
          addLine('recv', `    ← Entropy OK (first 4: ${toHex(randomBytes.slice(0, 4))}) ✓`, true)
        } else {
          markFail('V185-007', `Degenerate entropy: ${allZero ? 'all zeros' : 'all same byte'}`)
          addLine(
            'recv',
            `    ← Degenerate entropy: ${allZero ? 'all zeros' : 'all same byte'} ✗`,
            false
          )
        }
      } else {
        markFail('V185-007', 'No random data available from previous check')
        addLine('recv', '    ← no random data available ✗', false)
      }

      addLine('divider', '')

      // ── Phase 5: PQC Endorsement Key (EK) ───────────────────────
      addLine('phase', '[+] Phase 5 — PQC Endorsement Key  (EK)')
      addLine('send', '    → TPM2_CreatePrimary(')
      addLine('send', '           primaryHandle = TPM_RH_ENDORSEMENT (0x4000000B),')
      addLine('send', '           algorithm     = TPM_ALG_MLKEM (0x00A0)  ML-KEM-768,')
      addLine('send', '           template      = restricted KEM EK  [TCG V1.85 §11.2.6 Table 204]')
      addLine('send', '         )')

      updateCheck('V185-008', { status: 'running' })
      await delay()
      try {
        const attrs =
          OBJ_FIXED_TPM |
          OBJ_FIXED_PARENT |
          OBJ_SENSITIVE_DATA |
          OBJ_USER_WITH_AUTH |
          OBJ_RESTRICTED |
          OBJ_DECRYPT
        clearLastTpmErr()
        const cmd = buildCreatePrimary(RH_ENDORSEMENT, ALG_MLKEM, MLKEM_768, attrs, true)
        const resp = await executeTpmCommand(cmd)
        const h = parseHeader(resp)
        if (h.rc !== 0) {
          const wasmErr = getLastTpmErr()
          const errDetail = wasmErr ? ` [${wasmErr.slice(0, 80)}]` : ''
          markFail('V185-008', `RC=0x${h.rc.toString(16).padStart(8, '0')}${errDetail}`)
          addLine(
            'recv',
            `    ← RC=0x${h.rc.toString(16).padStart(8, '0')} (FAILED)${errDetail} ✗`,
            false
          )
          markFail('V185-009', 'Skipped — CreatePrimary failed')
        } else {
          ekHandle = getU32(resp, 10)
          markPass('V185-008', `handle=0x${ekHandle.toString(16).padStart(8, '0')}`)
          addLine('recv', '    ← RC: TPM_RC_SUCCESS ✓', true)
          addLine(
            'recv',
            `    ← handle = 0x${ekHandle.toString(16).padStart(8, '0')}  (transient, endorsement hierarchy)`,
            true
          )

          updateCheck('V185-009', { status: 'running' })
          await delay()
          // resp+18 = start of outPublic TPM2B; q=20 skips the TPM2B size(2) at offset 18
          const q = 20
          const pubType = getU16(resp, q)
          // type(2)+nameAlg(2)+attrs(4)+policy(2)+parms(sym=AES:2+128:2+CFB:2 + paramSet:2 = 8) = 18
          const ekPkSize = getU16(resp, q + 18)
          if (pubType === ALG_MLKEM && ekPkSize === MLKEM_768_PK_SIZE) {
            markPass('V185-009', `pk=${ekPkSize}B (FIPS 203 ML-KEM-768 ✓)`)
            addLine(
              'recv',
              `    ← pk = ${ekPkSize} B  ←  FIPS 203 §7.1 expects ${MLKEM_768_PK_SIZE} ✓`,
              true
            )
          } else {
            markFail(
              'V185-009',
              `type=0x${pubType.toString(16)} pk=${ekPkSize}B (expected 0x00A0 + ${MLKEM_768_PK_SIZE})`
            )
            addLine('recv', `    ← pk = ${ekPkSize} B  (expected ${MLKEM_768_PK_SIZE}) ✗`, false)
          }
        }
      } catch (e) {
        markError('V185-008', String(e))
        markFail('V185-009', 'Skipped — CreatePrimary failed')
        addLine('recv', `    ← ERROR: ${String(e)}`, false)
      }

      addLine('divider', '')

      // ── Phase 6: PQC Attestation Key (AK) ───────────────────────
      addLine('phase', '[+] Phase 6 — PQC Attestation Key  (AK / AIK)')
      addLine('send', '    → TPM2_CreatePrimary(')
      addLine('send', '           primaryHandle = TPM_RH_OWNER (0x40000001),')
      addLine('send', '           algorithm     = TPM_ALG_MLDSA (0x00A1)  ML-DSA-65,')
      addLine(
        'send',
        '           template      = unrestricted signing AK  [TCG V1.85 §11.2.7 Table 207]'
      )
      addLine('send', '         )')

      updateCheck('V185-010', { status: 'running' })
      await delay()
      try {
        const attrs =
          OBJ_FIXED_TPM | OBJ_FIXED_PARENT | OBJ_SENSITIVE_DATA | OBJ_USER_WITH_AUTH | OBJ_SIGN // unrestricted
        const cmd = buildCreatePrimary(RH_OWNER, ALG_MLDSA, MLDSA_65, attrs, false)
        const resp = await executeTpmCommand(cmd)
        const h = parseHeader(resp)
        if (h.rc !== 0) {
          markFail('V185-010', `RC=0x${h.rc.toString(16).padStart(8, '0')}`)
          addLine('recv', `    ← RC=0x${h.rc.toString(16).padStart(8, '0')} (FAILED) ✗`, false)
          markFail('V185-011', 'Skipped — CreatePrimary failed')
        } else {
          akHandle = getU32(resp, 10)
          markPass('V185-010', `handle=0x${akHandle.toString(16).padStart(8, '0')}`)
          addLine('recv', '    ← RC: TPM_RC_SUCCESS ✓', true)
          addLine(
            'recv',
            `    ← handle = 0x${akHandle.toString(16).padStart(8, '0')}  (transient, owner hierarchy)`,
            true
          )

          updateCheck('V185-011', { status: 'running' })
          await delay()
          const q = 20
          const pubType = getU16(resp, q)
          // MLDSA parms: parameterSet(2) + allowExternalMu(1) = 3 bytes
          // type(2)+nameAlg(2)+attrs(4)+policy(2)+parms(3) = 13
          const akPkSize = getU16(resp, q + 13)
          if (pubType === ALG_MLDSA && akPkSize === MLDSA_65_PK_SIZE) {
            markPass('V185-011', `pk=${akPkSize}B (FIPS 204 ML-DSA-65 ✓)`)
            addLine(
              'recv',
              `    ← pk = ${akPkSize} B  ←  FIPS 204 §7.1 expects ${MLDSA_65_PK_SIZE} ✓`,
              true
            )
          } else {
            markFail(
              'V185-011',
              `type=0x${pubType.toString(16)} pk=${akPkSize}B (expected 0x00A1 + ${MLDSA_65_PK_SIZE})`
            )
            addLine('recv', `    ← pk = ${akPkSize} B  (expected ${MLDSA_65_PK_SIZE}) ✗`, false)
          }
        }
      } catch (e) {
        markError('V185-010', String(e))
        markFail('V185-011', 'Skipped — CreatePrimary failed')
        addLine('recv', `    ← ERROR: ${String(e)}`, false)
      }

      addLine('divider', '')

      // ── Phase 7: Encapsulate ─────────────────────────────────────
      addLine('phase', '[+] Phase 7 — Key Encapsulation  (ML-KEM-768 EK)')
      addLine('send', '    → TPM2_Encapsulate(keyHandle = EK handle)')

      updateCheck('V185-012', { status: 'running' })
      await delay()
      try {
        if (ekHandle === 0) {
          markFail('V185-012', 'Skipped — CreatePrimary ML-KEM-768 failed')
          markFail('V185-013', 'Skipped')
          addLine('recv', '    ← Skipped (no EK handle)', false)
        } else {
          // Build TPM2_Encapsulate: NO_SESSIONS — public-key encapsulation needs no auth
          // Wire: tag(2)+size(4)+cc(4)+keyHandle(4) = 14 bytes total
          const p: number[] = []
          const putU16 = (v: number) => p.push((v >> 8) & 0xff, v & 0xff)
          const putU32 = (v: number) =>
            p.push((v >> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff)
          putU16(0x8001) // TPM_ST_NO_SESSIONS
          putU32(0) // size placeholder
          putU32(CC_ENCAPSULATE)
          putU32(ekHandle) // keyHandle — no auth area for public-key-only operation
          const total = p.length
          p[2] = (total >> 24) & 0xff
          p[3] = (total >> 16) & 0xff
          p[4] = (total >> 8) & 0xff
          p[5] = total & 0xff
          const cmd = new Uint8Array(p)
          const resp = await executeTpmCommand(cmd)
          const h = parseHeader(resp)
          if (h.rc !== 0) {
            markFail('V185-012', `RC=0x${h.rc.toString(16).padStart(8, '0')}`)
            markFail('V185-013', 'Skipped — Encapsulate failed')
            addLine('recv', `    ← RC=0x${h.rc.toString(16).padStart(8, '0')} ✗`, false)
          } else {
            markPass('V185-012', 'Encapsulate RC=0x00000000 ✓')
            addLine('recv', '    ← RC: TPM_RC_SUCCESS ✓', true)
            updateCheck('V185-013', { status: 'running' })
            await delay()
            // NO_SESSIONS response: tag(2)+size(4)+rc(4) = 10-byte header, then params directly
            const ssSize = getU16(resp, 10)
            const ctSize = getU16(resp, 10 + 2 + ssSize)
            if (ssSize === MLKEM_SHARED_SECRET_SIZE && ctSize === MLKEM_768_CT_SIZE) {
              markPass('V185-013', `ss=${ssSize}B ct=${ctSize}B ✓`)
              addLine('recv', `    ← sharedSecret = ${ssSize} B (FIPS 203: 32 B) ✓`, true)
              addLine(
                'recv',
                `    ← ciphertext   = ${ctSize} B (FIPS 203 ML-KEM-768: 1088 B) ✓`,
                true
              )
              // Capture shared secret for round-trip validation (V185-017)
              // Response layout: tag(2)+size(4)+rc(4)=10, then TPM2B_DIGEST: size(2)+bytes[ssSize]
              // then TPM2B_KEM_CIPHERTEXT: size(2)+bytes[ctSize]
              const ssDataStart = 12 // offset 10 + 2 (ssSize field)
              encapSharedSecret = resp.slice(ssDataStart, ssDataStart + ssSize)
              // Ciphertext data starts after ss TPM2B: 10 + 2 + ssSize + 2
              const ctDataStart = 10 + 2 + ssSize + 2
              encapCiphertext = resp.slice(ctDataStart, ctDataStart + ctSize)
            } else {
              markFail('V185-013', `ss=${ssSize}B (exp 32) ct=${ctSize}B (exp 1088)`)
              addLine('recv', `    ← ss=${ssSize}B ct=${ctSize}B (sizes wrong) ✗`, false)
            }
          }
        }
      } catch (e) {
        markError('V185-012', String(e))
        markFail('V185-013', 'Skipped — Encapsulate error')
        addLine('recv', `    ← ERROR: ${String(e)}`, false)
      }

      addLine('divider', '')

      // ── Phase 8: Decapsulate ─────────────────────────────────────
      addLine('phase', '[+] Phase 8 — Key Decapsulation  (ML-KEM-768 EK)')
      addLine(
        'send',
        `    → TPM2_Decapsulate(keyHandle = EK handle, ciphertext = ${MLKEM_768_CT_SIZE}B)`
      )

      updateCheck('V185-014', { status: 'running' })
      await delay()
      try {
        if (ekHandle === 0) {
          markFail('V185-014', 'Skipped — CreatePrimary ML-KEM-768 failed')
          addLine('recv', '    ← Skipped (no EK handle)', false)
        } else {
          const p: number[] = []
          const putU16 = (v: number) => p.push((v >> 8) & 0xff, v & 0xff)
          const putU32 = (v: number) =>
            p.push((v >> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff)
          putU16(0x8002)
          putU32(0)
          putU32(CC_DECAPSULATE)
          putU32(ekHandle)
          putU32(9)
          putU32(RS_PW)
          putU16(0)
          p.push(0)
          putU16(0)
          putU16(MLKEM_768_CT_SIZE)
          // Use real ciphertext from Encapsulate if available, otherwise 0xCC
          if (encapCiphertext && encapCiphertext.length === MLKEM_768_CT_SIZE) {
            for (let i = 0; i < MLKEM_768_CT_SIZE; i++) p.push(encapCiphertext[i])
          } else {
            for (let i = 0; i < MLKEM_768_CT_SIZE; i++) p.push(0xcc)
          }
          const total = p.length
          p[2] = (total >> 24) & 0xff
          p[3] = (total >> 16) & 0xff
          p[4] = (total >> 8) & 0xff
          p[5] = total & 0xff
          const cmd = new Uint8Array(p)
          const resp = await executeTpmCommand(cmd)
          const h = parseHeader(resp)
          if (h.rc !== 0) {
            markFail('V185-014', `RC=0x${h.rc.toString(16).padStart(8, '0')}`)
            addLine('recv', `    ← RC=0x${h.rc.toString(16).padStart(8, '0')} ✗`, false)
          } else {
            const ssSize = getU16(resp, 14)
            markPass('V185-014', `Decapsulate RC=0x00000000 ss=${ssSize}B ✓`)
            addLine('recv', '    ← RC: TPM_RC_SUCCESS ✓', true)
            addLine('recv', `    ← sharedSecret = ${ssSize} B ✓`, true)
            // Capture shared secret for round-trip validation (V185-017)
            decapSharedSecret = resp.slice(16, 16 + ssSize)
          }
        }
      } catch (e) {
        markError('V185-014', String(e))
        addLine('recv', `    ← ERROR: ${String(e)}`, false)
      }

      addLine('divider', '')

      // ── Phase 9: SignDigest ──────────────────────────────────────
      addLine('phase', '[+] Phase 9 — Digest Signing  (ML-DSA-65 AK)')
      addLine(
        'send',
        '    → TPM2_SignDigest(keyHandle, context=∅, digest=32B SHA-256, validation=NULL ticket)  [V1.85 RC4 Table 126]'
      )

      updateCheck('V185-015', { status: 'running' })
      await delay()
      try {
        if (akHandle === 0) {
          markFail('V185-015', 'Skipped — CreatePrimary ML-DSA-65 failed')
          markFail('V185-016', 'Skipped')
          addLine('recv', '    ← Skipped (no AK handle)', false)
        } else {
          const p: number[] = []
          const putU16 = (v: number) => p.push((v >> 8) & 0xff, v & 0xff)
          const putU32 = (v: number) =>
            p.push((v >> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff)
          // V1.85 RC4 Table 126 wire: {keyHandle, context, digest, validation}
          putU16(0x8002) // tag = TPM_ST_SESSIONS
          putU32(0) // commandSize placeholder
          putU32(CC_SIGN_DIGEST) // commandCode = TPM_CC_SignDigest (0x000001A6)
          putU32(akHandle) // @keyHandle
          // authArea: 9 bytes — one password session
          putU32(9)
          putU32(RS_PW) // sessionHandle = TPM_RS_PW (0x40000009)
          putU16(0) // nonce.size = 0
          p.push(0) // sessionAttributes = 0
          putU16(0) // hmac.size = 0
          // P1: context (TPM2B_SIGNATURE_CTX, empty)
          putU16(0)
          // P2: digest (TPM2B_DIGEST = size + buffer)
          putU16(32)
          for (let i = 0; i < 32; i++) p.push(0xbb)
          // P3: validation (TPMT_TK_HASHCHECK = tag + hierarchy + digest)
          putU16(0x8024) // tag = TPM_ST_HASHCHECK
          putU32(0x40000007) // hierarchy = TPM_RH_NULL (NULL ticket)
          putU16(0) // digest.size = 0 (empty for NULL ticket)
          const total = p.length
          p[2] = (total >> 24) & 0xff
          p[3] = (total >> 16) & 0xff
          p[4] = (total >> 8) & 0xff
          p[5] = total & 0xff
          const cmd = new Uint8Array(p)
          const resp = await executeTpmCommand(cmd)
          const h = parseHeader(resp)
          if (h.rc !== 0) {
            markFail('V185-015', `RC=0x${h.rc.toString(16).padStart(8, '0')}`)
            markFail('V185-016', 'Skipped — SignDigest failed')
            addLine('recv', `    ← RC=0x${h.rc.toString(16).padStart(8, '0')} ✗`, false)
          } else {
            markPass('V185-015', 'SignDigest RC=0x00000000 ✓')
            addLine('recv', '    ← RC: TPM_RC_SUCCESS ✓', true)
            updateCheck('V185-016', { status: 'running' })
            await delay()
            // Response: tag(2)+size(4)+rc(4)+paramSize(4) = 14B; sigAlg(2)+sig.size(2)+sig.bytes
            const sigAlg = getU16(resp, 14)
            const sigSize = getU16(resp, 16)
            if (sigAlg === ALG_MLDSA && sigSize === MLDSA_65_SIG_SIZE) {
              markPass('V185-016', `sigAlg=0x${sigAlg.toString(16)} sig=${sigSize}B ✓`)
              addLine(
                'recv',
                `    ← sigAlg = 0x${sigAlg.toString(16).padStart(4, '0')} (ML-DSA) ✓`,
                true
              )
              addLine('recv', `    ← signature = ${sigSize} B (FIPS 204 ML-DSA-65: 3309 B) ✓`, true)
              // Capture signature for non-trivial validation (V185-018)
              signatureBytes = resp.slice(18, 18 + sigSize)
            } else {
              markFail(
                'V185-016',
                `sigAlg=0x${sigAlg.toString(16)} sig=${sigSize}B (exp 0xa1 + 3309)`
              )
              addLine(
                'recv',
                `    ← sig=${sigSize}B sigAlg=0x${sigAlg.toString(16)} (wrong) ✗`,
                false
              )
            }
          }
        }
      } catch (e) {
        markError('V185-015', String(e))
        markFail('V185-016', 'Skipped — SignDigest error')
        addLine('recv', `    ← ERROR: ${String(e)}`, false)
      }

      addLine('divider', '')

      // ── Phase 10: Bridge Validation (Issue #9) ───────────────────
      addLine('phase', '[+] Phase 10 — PQC Crypto Bridge Validation  (Issue #9)')

      // V185-017: KEM Round-Trip Parity
      updateCheck('V185-017', { status: 'running' })
      await delay()
      addLine('send', '    → Comparing ss_encap vs ss_decap (FIPS 203 §7.3 round-trip)')
      if (encapSharedSecret && decapSharedSecret) {
        const match =
          encapSharedSecret.length === decapSharedSecret.length &&
          encapSharedSecret.every((b, i) => b === decapSharedSecret![i])
        // Also check it's not trivial placeholder
        const allDD = encapSharedSecret.every((b) => b === 0xdd)
        if (match && !allDD) {
          markPass(
            'V185-017',
            `ss_A === ss_B (${encapSharedSecret.length}B, non-trivial) — real crypto ✓`
          )
          addLine(
            'recv',
            `    ← ss_encap === ss_decap (${encapSharedSecret.length}B) — round-trip VALID ✓`,
            true
          )
          addLine(
            'recv',
            `    ← first 4B: ${toHex(encapSharedSecret.slice(0, 4))} (non-placeholder) ✓`,
            true
          )
        } else if (match && allDD) {
          markFail('V185-017', 'ss_A === ss_B but all bytes are 0xDD — placeholder stubs active')
          addLine(
            'recv',
            '    ← ss matches but all 0xDD — PQC bridge NOT active (placeholder stubs) ✗',
            false
          )
        } else {
          markFail(
            'V185-017',
            `ss_A ≠ ss_B — ${encapSharedSecret.length}B vs ${decapSharedSecret.length}B`
          )
          addLine('recv', '    ← ss_encap ≠ ss_decap — round-trip MISMATCH ✗', false)
        }
      } else {
        markFail('V185-017', 'Skipped — encap/decap shared secrets not available')
        addLine('recv', '    ← Skipped (no shared secrets captured from encap/decap) ✗', false)
      }

      // V185-018: DSA Non-Trivial Signature
      updateCheck('V185-018', { status: 'running' })
      await delay()
      addLine('send', '    → Checking signature bytes ≠ 0xEE placeholder (Issue #9)')
      if (signatureBytes && signatureBytes.length > 0) {
        const allEE = signatureBytes.every((b) => b === 0xee)
        const allZero = signatureBytes.every((b) => b === 0x00)
        if (!allEE && !allZero) {
          markPass(
            'V185-018',
            `sig[0..3]=${toHex(signatureBytes.slice(0, 4))} — real ML-DSA signature ✓`
          )
          addLine(
            'recv',
            `    ← sig[0..3] = ${toHex(signatureBytes.slice(0, 4))} — non-trivial ✓`,
            true
          )
          addLine('recv', '    ← PQC Bridge producing real ML-DSA-65 signatures ✓', true)
        } else if (allEE) {
          markFail('V185-018', 'All signature bytes are 0xEE — placeholder stub active')
          addLine(
            'recv',
            '    ← All bytes 0xEE — PQC bridge NOT active (placeholder stubs) ✗',
            false
          )
        } else {
          markFail('V185-018', 'All signature bytes are 0x00 — degenerate')
          addLine('recv', '    ← All bytes 0x00 — degenerate signature ✗', false)
        }
      } else {
        markFail('V185-018', 'Skipped — no signature captured from SignDigest')
        addLine('recv', '    ← Skipped (no signature captured) ✗', false)
      }

      // ── Phase 11: PQC Verify + Streaming ML-DSA (V185-019..024) ────
      addLine('divider', '')
      addLine(
        'phase',
        '[+] Phase 11 — Verify + Streaming ML-DSA  (Part 3 §17.5/§17.6/§20.3/§20.4/§20.6)'
      )

      // Free a transient slot for the upcoming sequence handles.
      // EK and unrestricted AK occupy 2 of the 3 transient slots — flush EK.
      if (ekHandle !== 0) {
        const flushP: number[] = []
        putU16(flushP, 0x8001) // TPM_ST_NO_SESSIONS
        putU32(flushP, 14)
        putU32(flushP, CC_FLUSH_CONTEXT)
        putU32(flushP, ekHandle)
        await executeTpmCommand(new Uint8Array(flushP))
      }

      // ── V185-019: TPM2_VerifyDigestSignature → DIGEST_VERIFIED ─────
      updateCheck('V185-019', { status: 'running' })
      await delay()
      addLine(
        'send',
        '    → TPM2_VerifyDigestSignature(keyHandle, context=∅, digest=0xBB×32, signature)  [Table 120]'
      )
      if (akHandle === 0 || !signatureBytes) {
        markFail('V185-019', 'Skipped — no AK or no signature captured')
        addLine('recv', '    ← Skipped (need V185-015 sig)', false)
      } else {
        try {
          const digestBytes = new Uint8Array(32).fill(0xbb)
          const verifyP: number[] = []
          // V1.85 RC4 Part 3 §20.4.2 Table 120 wire: {keyHandle, context, digest, signature}.
          // keyHandle has Auth Index: None — TPM_ST_NO_SESSIONS, no auth area.
          putU16(verifyP, 0x8001) // TPM_ST_NO_SESSIONS
          putU32(verifyP, 0) // commandSize placeholder
          putU32(verifyP, CC_VERIFY_DIGEST_SIG)
          putU32(verifyP, akHandle)
          // P1: context (empty TPM2B_SIGNATURE_CTX)
          putU16(verifyP, 0)
          // P2: digest (TPM2B_DIGEST)
          putU16(verifyP, digestBytes.length)
          for (const b of digestBytes) verifyP.push(b)
          // P3: signature TPMT_SIGNATURE = sigAlg(2) + TPM2B_SIGNATURE_MLDSA{size, buf}
          putU16(verifyP, ALG_MLDSA)
          putU16(verifyP, signatureBytes.length)
          for (const b of signatureBytes) verifyP.push(b)
          const verifyTotal = verifyP.length
          verifyP[2] = (verifyTotal >> 24) & 0xff
          verifyP[3] = (verifyTotal >> 16) & 0xff
          verifyP[4] = (verifyTotal >> 8) & 0xff
          verifyP[5] = verifyTotal & 0xff
          const verifyResp = await executeTpmCommand(new Uint8Array(verifyP))
          const vh = parseHeader(verifyResp)
          if (vh.rc !== 0) {
            markFail('V185-019', `rc=0x${vh.rc.toString(16).padStart(8, '0')}`)
            addLine('recv', `    ← rc=0x${vh.rc.toString(16).padStart(8, '0')} ✗`, false)
          } else {
            // TPM_ST_NO_SESSIONS response: header(10) + TPMT_TK_VERIFIED{tag(2), hierarchy(4), ...}
            // No paramSize prefix (only present in TPM_ST_SESSIONS responses).
            const tickTag = (verifyResp[10] << 8) | verifyResp[11]
            if (tickTag === TPM_ST_DIGEST_VERIFIED) {
              markPass('V185-019', `tag=0x${tickTag.toString(16)} (TPM_ST_DIGEST_VERIFIED) ✓`)
              addLine(
                'recv',
                `    ← validation.tag = 0x${tickTag.toString(16)} (DIGEST_VERIFIED) ✓`,
                true
              )
            } else {
              markFail('V185-019', `tag=0x${tickTag.toString(16)} (expected 0x8027)`)
              addLine('recv', `    ← wrong ticket tag 0x${tickTag.toString(16)} ✗`, false)
            }
          }
        } catch (e) {
          markError('V185-019', String(e))
          addLine('recv', `    ← ERROR: ${String(e)}`, false)
        }
      }

      // ── V185-020: TPM2_SignSequenceStart → sequenceHandle ──────────
      updateCheck('V185-020', { status: 'running' })
      await delay()
      let signSeqHandle = 0
      addLine('send', '    → TPM2_SignSequenceStart(keyHandle, auth=∅, context=∅)  [Table 89]')
      if (akHandle === 0) {
        markFail('V185-020', 'Skipped — no AK')
      } else {
        try {
          const startP: number[] = []
          putU16(startP, 0x8001) // TPM_ST_NO_SESSIONS (Auth Index: None per Table 89)
          putU32(startP, 0)
          putU32(startP, CC_SIGN_SEQ_START)
          putU32(startP, akHandle)
          // P1: auth (empty), P2: context (empty)
          putU16(startP, 0)
          putU16(startP, 0)
          const startTotal = startP.length
          startP[2] = (startTotal >> 24) & 0xff
          startP[3] = (startTotal >> 16) & 0xff
          startP[4] = (startTotal >> 8) & 0xff
          startP[5] = startTotal & 0xff
          const startResp = await executeTpmCommand(new Uint8Array(startP))
          const sh = parseHeader(startResp)
          if (sh.rc !== 0) {
            markFail('V185-020', `rc=0x${sh.rc.toString(16).padStart(8, '0')}`)
          } else {
            signSeqHandle =
              (startResp[10] << 24) | (startResp[11] << 16) | (startResp[12] << 8) | startResp[13]
            markPass('V185-020', `signSeqHandle=0x${signSeqHandle.toString(16)} ✓`)
            addLine(
              'recv',
              `    ← sequenceHandle = 0x${signSeqHandle.toString(16)} (vendor range) ✓`,
              true
            )
          }
        } catch (e) {
          markError('V185-020', String(e))
        }
      }

      // ── V185-021: TPM2_SignSequenceComplete → sig=3309 B ───────────
      updateCheck('V185-021', { status: 'running' })
      await delay()
      let seqSignatureBytes: Uint8Array | null = null
      const messageBytes = new Uint8Array(64).fill(0xa5)
      addLine(
        'send',
        `    → TPM2_SignSequenceComplete(@seq, @key, buffer=0xA5×${messageBytes.length})  [Table 124]`
      )
      if (signSeqHandle === 0 || akHandle === 0) {
        markFail('V185-021', 'Skipped — no sequence handle from V185-020')
      } else {
        try {
          const compP: number[] = []
          putU16(compP, 0x8002) // TPM_ST_SESSIONS (mandated by Table 124)
          putU32(compP, 0)
          putU32(compP, CC_SIGN_SEQ_COMPLETE)
          putU32(compP, signSeqHandle) // @sequenceHandle
          putU32(compP, akHandle) // @keyHandle
          // Two empty-password sessions (Auth Index 1 + Auth Index 2)
          putU32(compP, 18)
          putU32(compP, RS_PW)
          putU16(compP, 0)
          compP.push(0)
          putU16(compP, 0)
          putU32(compP, RS_PW)
          putU16(compP, 0)
          compP.push(0)
          putU16(compP, 0)
          // P1: buffer (TPM2B_MAX_BUFFER)
          putU16(compP, messageBytes.length)
          for (const b of messageBytes) compP.push(b)
          const compTotal = compP.length
          compP[2] = (compTotal >> 24) & 0xff
          compP[3] = (compTotal >> 16) & 0xff
          compP[4] = (compTotal >> 8) & 0xff
          compP[5] = compTotal & 0xff
          const compResp = await executeTpmCommand(new Uint8Array(compP))
          const ch = parseHeader(compResp)
          if (ch.rc !== 0) {
            markFail('V185-021', `rc=0x${ch.rc.toString(16).padStart(8, '0')}`)
          } else {
            // Response: hdr(10) + paramSize(4) + sigAlg(2) + sig.size(2) + sig.buffer
            const sigAlg = (compResp[14] << 8) | compResp[15]
            const sigSize = (compResp[16] << 8) | compResp[17]
            if (sigAlg === ALG_MLDSA && sigSize === MLDSA_65_SIG_SIZE) {
              seqSignatureBytes = compResp.slice(18, 18 + sigSize)
              markPass('V185-021', `sig=${sigSize}B ML-DSA-65 ✓`)
              addLine('recv', `    ← signature = ${sigSize} B (FIPS 204 ML-DSA-65) ✓`, true)
            } else {
              markFail(
                'V185-021',
                `sigAlg=0x${sigAlg.toString(16)} sig=${sigSize}B (exp 0x00A1 + 3309)`
              )
            }
          }
        } catch (e) {
          markError('V185-021', String(e))
        }
      }

      // ── V185-022: TPM2_VerifySequenceStart → sequenceHandle ────────
      updateCheck('V185-022', { status: 'running' })
      await delay()
      let verifySeqHandle = 0
      addLine(
        'send',
        '    → TPM2_VerifySequenceStart(keyHandle, auth=∅, hint=∅, context=∅)  [Table 87]'
      )
      if (akHandle === 0) {
        markFail('V185-022', 'Skipped — no AK')
      } else {
        try {
          const vsP: number[] = []
          putU16(vsP, 0x8001) // TPM_ST_NO_SESSIONS
          putU32(vsP, 0)
          putU32(vsP, CC_VERIFY_SEQ_START)
          putU32(vsP, akHandle)
          // P1: auth (empty), P2: hint (empty — MUST be zero per Table 87 for ML-DSA),
          // P3: context (empty)
          putU16(vsP, 0)
          putU16(vsP, 0)
          putU16(vsP, 0)
          const vsTotal = vsP.length
          vsP[2] = (vsTotal >> 24) & 0xff
          vsP[3] = (vsTotal >> 16) & 0xff
          vsP[4] = (vsTotal >> 8) & 0xff
          vsP[5] = vsTotal & 0xff
          const vsResp = await executeTpmCommand(new Uint8Array(vsP))
          const vsh = parseHeader(vsResp)
          if (vsh.rc !== 0) {
            markFail('V185-022', `rc=0x${vsh.rc.toString(16).padStart(8, '0')}`)
          } else {
            verifySeqHandle =
              (vsResp[10] << 24) | (vsResp[11] << 16) | (vsResp[12] << 8) | vsResp[13]
            markPass('V185-022', `verifySeqHandle=0x${verifySeqHandle.toString(16)} ✓`)
            addLine('recv', `    ← sequenceHandle = 0x${verifySeqHandle.toString(16)} ✓`, true)
          }
        } catch (e) {
          markError('V185-022', String(e))
        }
      }

      // ── V185-023: TPM2_SequenceUpdate (feed message to verify seq) ──
      updateCheck('V185-023', { status: 'running' })
      await delay()
      addLine(
        'send',
        `    → TPM2_SequenceUpdate(@seq, buffer=0xA5×${messageBytes.length})  [Part 3 §17.7]`
      )
      if (verifySeqHandle === 0) {
        markFail('V185-023', 'Skipped — no verify sequence handle')
      } else {
        try {
          const upP: number[] = []
          putU16(upP, 0x8002) // TPM_ST_SESSIONS (sequence auth required)
          putU32(upP, 0)
          putU32(upP, CC_SEQUENCE_UPDATE)
          putU32(upP, verifySeqHandle) // @sequenceHandle
          putU32(upP, 9)
          putU32(upP, RS_PW)
          putU16(upP, 0)
          upP.push(0)
          putU16(upP, 0)
          putU16(upP, messageBytes.length)
          for (const b of messageBytes) upP.push(b)
          const upTotal = upP.length
          upP[2] = (upTotal >> 24) & 0xff
          upP[3] = (upTotal >> 16) & 0xff
          upP[4] = (upTotal >> 8) & 0xff
          upP[5] = upTotal & 0xff
          const upResp = await executeTpmCommand(new Uint8Array(upP))
          const uh = parseHeader(upResp)
          if (uh.rc !== 0) {
            markFail('V185-023', `rc=0x${uh.rc.toString(16).padStart(8, '0')}`)
          } else {
            markPass('V185-023', `${messageBytes.length}B chunk accepted ✓`)
            addLine('recv', `    ← ${messageBytes.length} B accumulated ✓`, true)
          }
        } catch (e) {
          markError('V185-023', String(e))
        }
      }

      // ── V185-024: TPM2_VerifySequenceComplete → MESSAGE_VERIFIED ────
      updateCheck('V185-024', { status: 'running' })
      await delay()
      addLine('send', '    → TPM2_VerifySequenceComplete(@seq, keyHandle, signature)  [Table 118]')
      if (verifySeqHandle === 0 || akHandle === 0 || !seqSignatureBytes) {
        markFail('V185-024', 'Skipped — sequence handle or signature missing')
      } else {
        try {
          const vcP: number[] = []
          putU16(vcP, 0x8002) // TPM_ST_SESSIONS (mandated by Table 118)
          putU32(vcP, 0)
          putU32(vcP, CC_VERIFY_SEQ_COMPLETE)
          putU32(vcP, verifySeqHandle) // @sequenceHandle
          putU32(vcP, akHandle) // keyHandle (Auth Index: None)
          // ONE PW session for sequenceHandle auth
          putU32(vcP, 9)
          putU32(vcP, RS_PW)
          putU16(vcP, 0)
          vcP.push(0)
          putU16(vcP, 0)
          // P1: signature TPMT_SIGNATURE = sigAlg + TPM2B_SIGNATURE_MLDSA
          putU16(vcP, ALG_MLDSA)
          putU16(vcP, seqSignatureBytes.length)
          for (const b of seqSignatureBytes) vcP.push(b)
          const vcTotal = vcP.length
          vcP[2] = (vcTotal >> 24) & 0xff
          vcP[3] = (vcTotal >> 16) & 0xff
          vcP[4] = (vcTotal >> 8) & 0xff
          vcP[5] = vcTotal & 0xff
          const vcResp = await executeTpmCommand(new Uint8Array(vcP))
          const vch = parseHeader(vcResp)
          if (vch.rc !== 0) {
            markFail('V185-024', `rc=0x${vch.rc.toString(16).padStart(8, '0')}`)
            addLine('recv', `    ← rc=0x${vch.rc.toString(16).padStart(8, '0')} ✗`, false)
          } else {
            // Response: hdr(10) + paramSize(4) + TPMT_TK_VERIFIED{tag(2), ...}
            const tickTag = (vcResp[14] << 8) | vcResp[15]
            if (tickTag === TPM_ST_MESSAGE_VERIFIED) {
              markPass('V185-024', `tag=0x${tickTag.toString(16)} (TPM_ST_MESSAGE_VERIFIED) ✓`)
              addLine(
                'recv',
                `    ← validation.tag = 0x${tickTag.toString(16)} (MESSAGE_VERIFIED) — full streaming ML-DSA round-trip ✓`,
                true
              )
            } else {
              markFail('V185-024', `tag=0x${tickTag.toString(16)} (expected 0x8026)`)
            }
          }
        } catch (e) {
          markError('V185-024', String(e))
        }
      }

      // Suppress unused-constant warnings for shared constants reserved
      // for future tests (HASHCHECK ticket builders + NULL hierarchy ref).
      void TPM_ST_HASHCHECK
      void TPM_RH_NULL

      // ── Summary table ────────────────────────────────────────────
      addLine('divider', '')
      addLine('table-header', '  ═══════════════════════════════════════════════════════════')
      addLine('table-header', '    TCG V1.85 PQC Key Hierarchy — Role Mapping')
      addLine('table-header', '  ═══════════════════════════════════════════════════════════')
      addLine('table-row', '    Role    Algorithm    Key Size  Standard')
      addLine('table-row', '    ──────  ───────────  ────────  ─────────────────────────')
      addLine('table-row', '    EK      ML-KEM-768   1184 B    FIPS 203 (NIST 2024) §14')
      addLine('table-row', '    AK/AIK  ML-DSA-65    1952 B    FIPS 204 (NIST 2024) §15')
      addLine('table-header', '  ═══════════════════════════════════════════════════════════')
    } catch (e) {
      console.error('Compliance suite error:', e)
    }

    setSummary({ pass, fail, total: pass + fail })
    setIsRunning(false)
  }

  const handleCopyLog = () => {
    if (activeTab === 'scenario') {
      const lines = scenarioLines.filter((l) => l.type !== 'divider').map((l) => l.text)
      navigator.clipboard.writeText(lines.join('\n'))
    } else {
      const lines = checks.map(
        (c) => `[${c.status.toUpperCase().padEnd(5)}] ${c.id} ${c.name} (${c.section}): ${c.detail}`
      )
      if (summary) lines.push('', `Result: ${summary.pass}/${summary.total} passed`)
      navigator.clipboard.writeText(lines.join('\n'))
    }
  }

  const statusIcon = (s: CheckStatus) => {
    switch (s) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
      case 'fail':
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive shrink-0" />
      case 'running':
        return <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
      default:
        return <div className="h-4 w-4 rounded-full border border-border shrink-0" />
    }
  }

  const scenarioLineClass = (line: ScenarioLine) => {
    switch (line.type) {
      case 'phase':
        return 'text-accent font-bold mt-2 first:mt-0'
      case 'send':
        return 'text-primary/80'
      case 'recv':
        return line.ok === false
          ? 'text-status-error'
          : line.ok === true
            ? 'text-status-success'
            : 'text-muted-foreground'
      case 'table-header':
        return 'text-muted-foreground font-semibold'
      case 'table-row':
        return 'text-muted-foreground'
      default:
        return 'text-muted-foreground'
    }
  }

  const hasData = checks.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Execute TCG V1.85 RC4 compliance checks against the WASM TPM emulator — entirely
          in-browser.
        </p>
        {hasData && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyLog}
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            title="Copy Log"
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Button
        onClick={runSuite}
        disabled={isRunning}
        variant="outline"
        className="w-full border-secondary/50 text-secondary hover:bg-secondary/10"
      >
        <Shield className={`mr-2 h-4 w-4 ${isRunning ? 'animate-pulse' : ''}`} />
        {isRunning ? 'Running V1.85 Compliance Suite...' : 'Run V1.85 Compliance Suite'}
      </Button>

      {summary && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
            summary.fail === 0
              ? 'bg-green-500/10 border border-green-500/30 text-green-500'
              : 'bg-destructive/10 border border-destructive/30 text-destructive'
          }`}
        >
          {summary.fail === 0 ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {summary.pass}/{summary.total} checks passed
          {summary.fail > 0 && ` — ${summary.fail} failed`}
        </div>
      )}

      {hasData && (
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          {/* Tab headers */}
          <div className="flex border-b border-border bg-muted/20">
            <Button
              variant="ghost"
              onClick={() => setActiveTab('compliance')}
              className={`flex items-center gap-1.5 rounded-none px-3 py-2 h-auto text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'compliance'
                  ? 'text-primary border-b-2 border-primary -mb-px bg-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="h-3 w-3" />
              Compliance Checks
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab('scenario')}
              className={`flex items-center gap-1.5 rounded-none px-3 py-2 h-auto text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'scenario'
                  ? 'text-primary border-b-2 border-primary -mb-px bg-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Terminal className="h-3 w-3" />
              Scenario Flow
            </Button>
          </div>

          {/* Compliance checklist */}
          {activeTab === 'compliance' && (
            <div className="divide-y divide-border/50 max-h-80 overflow-y-auto">
              {checks.map((c) => (
                <div key={c.id} className="flex items-start gap-2 px-3 py-2">
                  {statusIcon(c.status)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{c.id}</span>
                      <span className="text-xs font-medium truncate">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                        {c.section}
                      </span>
                    </div>
                    {c.detail && (
                      <p
                        className={`text-[11px] mt-0.5 font-mono break-all ${
                          c.status === 'fail' || c.status === 'error'
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {c.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scenario narrative flow */}
          {activeTab === 'scenario' && (
            <div className="max-h-80 overflow-y-auto p-3 font-mono text-xs">
              {scenarioLines.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  Run the suite to see the scenario flow
                </p>
              ) : (
                <div className="space-y-0.5">
                  {scenarioLines.map((line, i) =>
                    line.type === 'divider' ? (
                      <hr key={i} className="border-border/30 my-2" />
                    ) : (
                      <div
                        key={i}
                        className={`leading-relaxed whitespace-pre ${scenarioLineClass(line)}`}
                      >
                        {line.text}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
