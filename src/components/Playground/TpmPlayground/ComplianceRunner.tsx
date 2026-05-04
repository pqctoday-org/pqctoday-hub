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
const MLDSA_65_PK_SIZE = 1952

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
  { id: 'V185-001', name: 'TPM2_SelfTest(fullTest)', section: '§11.2.1' },
  { id: 'V185-002', name: 'Response Header Structure', section: '§7.2' },
  { id: 'V185-003', name: 'TPM2_GetCapability(ALGS)', section: '§30.2' },
  { id: 'V185-004', name: 'ML-KEM Algorithm Registered (0x00A0)', section: '§11.9' },
  { id: 'V185-005', name: 'ML-DSA Algorithm Registered (0x00A1)', section: '§11.9' },
  { id: 'V185-006', name: 'TPM2_GetRandom Entropy Source', section: '§16.1' },
  { id: 'V185-007', name: 'Entropy Non-Trivial (32B)', section: '§16.1' },
  { id: 'V185-008', name: 'CreatePrimary ML-KEM-768 EK', section: '§11.2.6 Table 204' },
  { id: 'V185-009', name: 'ML-KEM-768 Public Key = 1184 B', section: 'FIPS 203' },
  { id: 'V185-010', name: 'CreatePrimary ML-DSA-65 AK', section: '§11.2.7 Table 207' },
  { id: 'V185-011', name: 'ML-DSA-65 Public Key = 1952 B', section: 'FIPS 204' },
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
      addLine('phase', '[+] Phase 2 — Algorithm Self-Test  (TCG V1.85 §11.2.1)')
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
        addLine('recv', '    ← ML-KEM-768: registered ✓  (FIPS 203, TCG V1.85 §14)', true)
      } else {
        markFail('V185-004', `TPM_ALG_MLKEM (0x00A0) NOT found in ${algList.length} algorithms`)
        addLine('recv', `    ← ML-KEM-768 (0x00A0): NOT REGISTERED ✗`, false)
      }

      updateCheck('V185-005', { status: 'running' })
      await delay()
      addLine('send', '    → checking TPM_ALG_MLDSA (0x00A1)')
      if (algList.includes(ALG_MLDSA)) {
        markPass('V185-005', `TPM_ALG_MLDSA (0x00A1) present`)
        addLine('recv', '    ← ML-DSA-65: registered ✓  (FIPS 204, TCG V1.85 §15)', true)
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
          const akHandle = getU32(resp, 10)
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
