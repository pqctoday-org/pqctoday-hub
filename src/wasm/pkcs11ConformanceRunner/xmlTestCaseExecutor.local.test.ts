// WS-11 Phase 3 — real-engine acceptance for the executor's new
// C_GetAttributeValue / C_SignInit / C_Sign handlers, the handle-array
// binding, text/hex template support, and the strict mechanism-list check.
//
// "no skip, no fake" governs this suite the same as the rest of WS-11: the
// sabotage tests (a wrong verification key, a reordered fixture, a missing
// mechanism) MUST fail the way they are supposed to, or the executor is
// lying about what it checks. A suite that only shows green tells you
// nothing was tested; these prove the checks are load-bearing.
//
// Venue: *.local.test.ts, real-wasm venue, both engines — same Node-load
// pattern as keyAttrCoverage.local.test.ts.
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import * as S from '../softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { runXmlTestCase } from './xmlTestCaseExecutor'
import { provisionAuthFixture, provisionCertFixture } from './profileFixtures'
import blM132Xml from '../../data/pkcs11-profiles/test-cases/BL-M-1-32.xml?raw'
import extM132Xml from '../../data/pkcs11-profiles/test-cases/EXT-M-1-32.xml?raw'
import authM132Xml from '../../data/pkcs11-profiles/test-cases/AUTH-M-1-32.xml?raw'
import certM132Xml from '../../data/pkcs11-profiles/test-cases/CERT-M-1-32.xml?raw'

const require_ = createRequire(import.meta.url)

const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  const gluePath = require_.resolve('@pqctoday/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const createSoftHSMModule = require_(gluePath) as (
    arg?: Record<string, unknown>
  ) => Promise<SoftHSMModule>
  return createSoftHSMModule({
    locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p),
  })
}

// The C++ WASM build uses a real file-backed object store
// (DEFAULT_OBJECTSTORE_BACKEND="file", DEFAULT_TOKENDIR=
// "/var/lib/softhsmv3/tokens/" — see build-wasm/config.h), not pure
// in-memory storage. Loading a "fresh" module instance per test (as this
// suite briefly did) still shares that simulated path across instances
// within one Node process, so tokens from earlier tests accumulate and
// silently corrupt later slot enumeration (WS-11 Phase 3, 2026-08-28 —
// root-caused via a repeated-instantiation diagnostic). Load ONE cpp
// instance per describe.each run instead, matching exactly how
// Pkcs11ConformanceRunner.tsx uses it in production: one loaded module,
// re-Finalized/re-Initialized between test cases, never reloaded.
let cachedCppModule: Promise<SoftHSMModule> | undefined
const getCppModule = (): Promise<SoftHSMModule> => {
  if (!cachedCppModule) cachedCppModule = loadCppEngineInNode()
  return cachedCppModule
}

const failingSteps = (
  steps: { rvOk: boolean; error?: string; findings: { exempt: boolean }[] }[]
) => steps.filter((s) => !s.rvOk || s.error || s.findings.some((f) => !f.exempt))

describe.each([
  ['rust' as const, () => S.getSoftHSMRustModule()],
  ['cpp' as const, () => getCppModule()],
])('WS-11 Phase 3 executor (%s engine)', (engineName, getModule) => {
  // hsm_getFirstSlot (NOT hsm_getFirstFreeSlot) — matches
  // Pkcs11ConformanceRunner.tsx exactly. The vendored test cases assume
  // exactly one token is discoverable (`${SlotList.SlotID[0]}` picks index
  // 0 of whatever C_GetSlotList(tokenPresent=true) returns); a fresh free
  // slot per test would accumulate multiple live tokens across a
  // describe.each run and silently point later test cases at an earlier
  // test's slot instead of their own fixture.
  const freshToken = async (label: string) => {
    const M = (await getModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', label)
    const hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')
    return { M, hSession }
  }

  it('BL-M-1-32 still passes (regression, unaffected by Phase 3 changes)', async () => {
    const { M, hSession } = await freshToken('BLREG')
    S.hsm_finalize(M, hSession)
    const result = await runXmlTestCase(M, 'BL-M-1-32', blM132Xml, engineName, { Pin: 'user1234' })
    expect(failingSteps(result.steps), JSON.stringify(failingSteps(result.steps))).toEqual([])
    expect(result.pass).toBe(true)
  }, 30000)

  it('EXT-M-1-32 still passes (regression, exercises the strict mechanism-list check)', async () => {
    const { M, hSession } = await freshToken('EXTREG')
    S.hsm_finalize(M, hSession)
    const result = await runXmlTestCase(M, 'EXT-M-1-32', extM132Xml, engineName, {
      Pin: 'user1234',
    })
    expect(failingSteps(result.steps), JSON.stringify(failingSteps(result.steps))).toEqual([])
    expect(result.pass).toBe(true)
  }, 30000)

  it('AUTH-M-1-32 passes end-to-end against a provisioned fixture (real C_GetAttributeValue/C_SignInit/C_Sign)', async () => {
    const { M, hSession } = await freshToken('AUTHFIX')
    const fixtureBindings = provisionAuthFixture(M, hSession)
    S.hsm_finalize(M, hSession)
    const result = await runXmlTestCase(M, 'AUTH-M-1-32', authM132Xml, engineName, {
      Pin: 'user1234',
      ...fixtureBindings,
    })
    expect(failingSteps(result.steps), JSON.stringify(failingSteps(result.steps))).toEqual([])
    expect(result.pass).toBe(true)

    // The ledger contains the two D1 entries this test case is documented
    // to need. (It may also carry the ordinary §3.1.1 provider-identity
    // exemptions, e.g. Info.ManufacturerID — those are pre-existing,
    // legitimate variations unrelated to D1, not checked here.)
    const exemptFields = result.steps.flatMap((s) =>
      s.findings.filter((f) => f.exempt).map((f) => f.field)
    )
    expect(exemptFields).toContain('Template.MODULUS.value')
    expect(exemptFields).toContain('Signature.value')
  }, 30000)

  it('sabotage: AUTH-M-1-32 fails when verified against the WRONG public key', async () => {
    const { M, hSession } = await freshToken('AUTHSAB')
    const fixtureBindings = provisionAuthFixture(M, hSession)
    // A second, unrelated key pair — its modulus/exponent do NOT belong to
    // the key that actually produced the real signature.
    const wrongKey = S.hsm_generateRSAKeyPair(M, hSession, 2048)
    const wrongModulusBytes = S.hsm_getKeyAttributes(M, hSession, wrongKey.pubHandle).ckModulus
    S.hsm_finalize(M, hSession)
    expect(wrongModulusBytes, 'test setup: wrong key must have a readable modulus').toBeTruthy()
    const wrongModulus = Array.from(wrongModulusBytes!)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    const result = await runXmlTestCase(M, 'AUTH-M-1-32', authM132Xml, engineName, {
      Pin: 'user1234',
      'Fixture.Modulus': wrongModulus,
      'Fixture.PublicExponent': fixtureBindings['Fixture.PublicExponent'],
    })
    const signStep = result.steps.find((s) => s.fn === 'C_Sign')
    expect(signStep, 'C_Sign step must run').toBeTruthy()
    const verifyFinding = signStep!.findings.find((f) => f.field === 'Signature.value')
    expect(verifyFinding?.exempt, 'verification against the wrong key must be a real failure').toBe(
      false
    )
    expect(verifyFinding?.actual).toContain('FAILED')
    expect(result.pass, 'a tampered verification key must not produce a green result').toBe(false)
  }, 30000)

  it('CERT-M-1-32 passes end-to-end against a provisioned fixture (index-addressable Object.Object bindings)', async () => {
    const { M, hSession } = await freshToken('CERTFIX')
    provisionCertFixture(M, hSession, certM132Xml)
    S.hsm_finalize(M, hSession)
    const result = await runXmlTestCase(M, 'CERT-M-1-32', certM132Xml, engineName, {})
    expect(failingSteps(result.steps), JSON.stringify(failingSteps(result.steps))).toEqual([])
    expect(result.pass).toBe(true)
  }, 30000)

  it('sabotage: CERT-M-1-32 fails when the fixture objects are created in the WRONG order', async () => {
    const { M, hSession } = await freshToken('CERTSAB')
    // Reverse of provisionCertFixture's steps 1-2: certificate created
    // BEFORE the "Mozilla Builtin Roots" data object, so an
    // app-objects-first C_FindObjectsInit puts the certificate at index 0
    // — where the XML expects the 22-byte text label.
    const certDerHex = /type="VALUE" value="([0-9a-f]+)"/.exec(certM132Xml)![1]
    const certDer = new Uint8Array(certDerHex.length / 2)
    for (let i = 0; i < certDer.length; i++) certDer[i] = parseInt(certDerHex.substr(i * 2, 2), 16)
    const subjectHex =
      '3057310b300906035504061302424531193017060355040a1310476c6f62616c5369676e206e762d73613110300e060355040b1307526f6f74204341311b301906035504031312476c6f62616c5369676e20526f6f74204341'
    const subjectDer = new Uint8Array(subjectHex.length / 2)
    for (let i = 0; i < subjectDer.length; i++)
      subjectDer[i] = parseInt(subjectHex.substr(i * 2, 2), 16)
    const serialDer = new Uint8Array([
      0x04, 0x00, 0x00, 0x00, 0x00, 0x01, 0x15, 0x4b, 0x5a, 0xc3, 0x94,
    ])

    const createObject = (attrs: S.AttrDef[]): number => {
      const tpl = S.buildTemplate(M, attrs)
      const hPtr = M._malloc(4)
      try {
        S.checkRV(M._C_CreateObject(hSession, tpl.ptr, attrs.length, hPtr), 'C_CreateObject')
        return M.getValue(hPtr, 'i32') >>> 0
      } finally {
        S.freeTemplate(M, tpl, attrs.length)
        M._free(hPtr)
      }
    }
    const valuePtr = S.writeBytes(M, certDer)
    const subjectPtr = S.writeBytes(M, subjectDer)
    const issuerPtr = S.writeBytes(M, subjectDer)
    const serialPtr = S.writeBytes(M, serialDer)
    // Certificate FIRST (the sabotage): a real conformance fixture must
    // never do this — proving that if it did, the test correctly fails.
    createObject([
      { type: S.CKA_CLASS, ulongVal: S.CKO_CERTIFICATE },
      { type: S.CKA_CERTIFICATE_TYPE, ulongVal: S.CKC_X_509 },
      { type: S.CKA_TOKEN, boolVal: true },
      { type: S.CKA_PRIVATE, boolVal: false },
      { type: S.CKA_VALUE, bytesPtr: valuePtr, bytesLen: certDer.length },
      { type: S.CKA_SUBJECT, bytesPtr: subjectPtr, bytesLen: subjectDer.length },
      { type: S.CKA_ISSUER, bytesPtr: issuerPtr, bytesLen: subjectDer.length },
      { type: S.CKA_SERIAL_NUMBER, bytesPtr: serialPtr, bytesLen: serialDer.length },
    ])
    const labelBytes = new Uint8Array([...new TextEncoder().encode('Mozilla Builtin Roots'), 0x00])
    const labelPtr = S.writeBytes(M, labelBytes)
    const dataValuePtr = S.writeBytes(M, new Uint8Array(0))
    createObject([
      { type: S.CKA_CLASS, ulongVal: S.CKO_DATA },
      { type: S.CKA_TOKEN, boolVal: true },
      { type: S.CKA_PRIVATE, boolVal: false },
      { type: S.CKA_LABEL, bytesPtr: labelPtr, bytesLen: labelBytes.length },
      { type: S.CKA_VALUE, bytesPtr: dataValuePtr, bytesLen: 0 },
    ])
    ;[valuePtr, subjectPtr, issuerPtr, serialPtr, labelPtr, dataValuePtr].forEach((p) => M._free(p))
    S.hsm_finalize(M, hSession)

    const result = await runXmlTestCase(M, 'CERT-M-1-32', certM132Xml, engineName, {})
    expect(result.pass, 'a reordered fixture must not produce a green result').toBe(false)
    // Which step actually caught the reordering can legitimately differ by
    // engine (e.g. C_FindObjects.Object.count on one, a LABEL/VALUE
    // mismatch in C_GetAttributeValue on another) — the load-bearing check
    // is that SOME step surfaces a real, non-exempt, non-swallowed defect.
    const hasRealFinding = result.steps.some(
      (s) => !s.rvOk || s.error || s.findings.some((f) => !f.exempt)
    )
    expect(hasRealFinding, 'the reordered fixture must surface a genuine finding').toBe(true)
  }, 30000)

  it('sabotage: C_GetMechanismList reports a missing mechanism as a real failure', async () => {
    const { M, hSession } = await freshToken('MECHSAB')
    S.hsm_finalize(M, hSession)
    const fakeXml = `<PKCS11>
      <C_Initialize/>
      <C_Initialize rv="OK"/>
      <C_GetSlotList>
        <TokenPresent value="true"/>
        <SlotList/>
      </C_GetSlotList>
      <C_GetSlotList rv="OK">
        <SlotList length="\${SlotList.length}"/>
      </C_GetSlotList>
      <C_GetSlotList>
        <TokenPresent value="true"/>
        <SlotList length="\${SlotList.length}"/>
      </C_GetSlotList>
      <C_GetSlotList rv="OK">
        <SlotList>
          <SlotID value="\${SlotList.SlotID[0]}"/>
        </SlotList>
      </C_GetSlotList>
      <C_GetMechanismList>
        <SlotID value="\${SlotList.SlotID[0]}"/>
        <MechanismList/>
      </C_GetMechanismList>
      <C_GetMechanismList rv="OK">
        <MechanismList length="\${MechanismList.length}"/>
      </C_GetMechanismList>
      <C_GetMechanismList>
        <SlotID value="\${SlotList.SlotID[0]}"/>
        <MechanismList length="\${MechanismList.length}"/>
      </C_GetMechanismList>
      <C_GetMechanismList rv="OK">
        <MechanismList>
          <Type value="SHA512"/>
          <Type value="RSA_PKCS_KEY_PAIR_GEN"/>
          <Type value="A_MECHANISM_NO_ENGINE_WILL_EVER_ADVERTISE"/>
        </MechanismList>
      </C_GetMechanismList>
      <C_Finalize/>
      <C_Finalize rv="OK"/>
    </PKCS11>`
    const result = await runXmlTestCase(M, 'synthetic-mech-check', fakeXml, engineName, {})
    const mechStep = result.steps.find(
      (s) => s.fn === 'C_GetMechanismList' && s.findings.length > 0
    )
    expect(mechStep, 'the strict presence check must report a finding').toBeTruthy()
    const finding = mechStep!.findings.find((f) => f.field === 'MechanismList.Type')
    expect(finding?.exempt).toBe(false)
    expect(result.pass).toBe(false)
  }, 30000)
})
