// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Runs a small set of NIST ACVP-Server ML-KEM-768 encapDecap cases through the
 * module's own ML-KEM engine and compares each answer with NIST's expected
 * result. The cases come from the repository's manifest-gated vector files
 * (src/data/acvp/mlkem_encap_aft_test.json and mlkem_encapdecap_val_test.json),
 * which are byte copies from one pinned commit of usnistgov/ACVP-Server; the
 * unit test checks them against the byte-exact fixture copy of the NIST files.
 *
 * Four kinds of case, as in the ACVP ML-KEM encapDecap test types
 * (draft-celi-acvp-ml-kem-01, section 6.1):
 *  - encapsulation (AFT): NIST gives ek and m; the engine must return NIST's
 *    ciphertext c and shared secret k. m is a test input this engine accepts
 *    outside the PKCS#11 standard.
 *  - decapsulation (VAL): NIST gives dk and c; the engine must return NIST's k,
 *    for a valid ciphertext and for a modified one (implicit rejection returns
 *    a pseudo-random k, not an error).
 *  - encapsulationKeyCheck / decapsulationKeyCheck (VAL): the engine must accept
 *    a valid key and reject an invalid one (FIPS 203 sections 7.2 and 7.3).
 *
 * A case passes only when the engine's answer equals NIST's; an engine error is
 * reported as an error, never as a successful rejection. These are public
 * reference samples, not vectors issued by an ACVTS session: a pass here
 * establishes no validation. Shared secrets and private keys are never printed.
 */
import { hexToBytes } from '@/utils/dataInputUtils'
import { hsm_extractKeyValue, rvName } from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { KatStatus } from '@/utils/katRunner'

export const PARAMETER_SET = 'ML-KEM-768'
const VARIANT = 768
const CT_LEN = 1088 // FIPS 203 Table 3, ML-KEM-768
const CKR_OK = 0

export type EncapDecapFunction =
  'encapsulation' | 'decapsulation' | 'encapsulationKeyCheck' | 'decapsulationKeyCheck'

export interface EncapDecapCase {
  function: EncapDecapFunction
  tgId: number
  tcId: number
  /** NIST's label for the case (the ACVP "reason"), or a fixed label for the AFT group. */
  label: string
  /** What NIST expects, in words. */
  expects: string
  /** Input sizes in bytes, for the table. */
  inputs: string
  // Raw ACVP fields (hex), present as the case type needs them.
  ek?: string
  m?: string
  c?: string
  k?: string
  dk?: string
  testPassed?: boolean
}

export interface EncapDecapResult extends EncapDecapCase {
  status: KatStatus
  /** What the engine did, in words. */
  observed: string
}

interface AftCase {
  tcId: number
  ek: string
  m: string
  c: string
  k: string
}
interface ValCase {
  tcId: number
  reason: string
  testPassed?: boolean
  dk?: string
  ek?: string
  c?: string
  k?: string
}
interface Group<T> {
  tgId: number
  parameterSet: string
  function?: string
  tests: T[]
}

const bytes = (hex: string | undefined) => (hex ? hex.length / 2 : 0)

/**
 * The cases shown: the first three ML-KEM-768 encapsulation AFT cases, the
 * decapsulation VAL cases the vector file keeps (two valid, two modified
 * ciphertext), and one valid and one invalid key of each check type.
 */
export async function loadEncapDecapCases(): Promise<EncapDecapCase[]> {
  const [aft, val] = await Promise.all([
    import('@/data/acvp/mlkem_encap_aft_test.json'),
    import('@/data/acvp/mlkem_encapdecap_val_test.json'),
  ])
  const aftGroup = (aft.default.testGroups as unknown as Group<AftCase>[]).find(
    (g) => g.parameterSet === PARAMETER_SET && g.function === 'encapsulation'
  )
  const valGroups = (val.default.testGroups as unknown as Group<ValCase>[]).filter(
    (g) => g.parameterSet === PARAMETER_SET
  )
  const out: EncapDecapCase[] = []

  for (const t of aftGroup?.tests.slice(0, 3) ?? []) {
    out.push({
      function: 'encapsulation',
      tgId: aftGroup!.tgId,
      tcId: t.tcId,
      label: 'encapsulation with NIST m',
      expects: 'ciphertext c and shared secret k equal NIST’s',
      inputs: `ek ${bytes(t.ek).toLocaleString('en-US')} B, m ${bytes(t.m)} B`,
      ek: t.ek,
      m: t.m,
      c: t.c,
      k: t.k,
    })
  }
  for (const g of valGroups.filter((x) => x.function === 'decapsulation')) {
    for (const t of g.tests) {
      const modified = t.reason === 'modified ciphertext'
      out.push({
        function: 'decapsulation',
        tgId: g.tgId,
        tcId: t.tcId,
        label: t.reason,
        expects: modified
          ? 'no error; the implicit-rejection value k from NIST'
          : 'shared secret k equal to NIST’s',
        inputs: `dk ${bytes(t.dk).toLocaleString('en-US')} B, c ${bytes(t.c).toLocaleString('en-US')} B`,
        dk: t.dk,
        c: t.c,
        k: t.k,
      })
    }
  }
  for (const fn of ['encapsulationKeyCheck', 'decapsulationKeyCheck'] as const) {
    for (const g of valGroups.filter((x) => x.function === fn)) {
      for (const t of g.tests) {
        out.push({
          function: fn,
          tgId: g.tgId,
          tcId: t.tcId,
          label: t.reason,
          expects: t.testPassed ? 'key accepted' : 'key rejected',
          inputs:
            fn === 'encapsulationKeyCheck'
              ? `ek ${bytes(t.ek).toLocaleString('en-US')} B`
              : `dk ${bytes(t.dk).toLocaleString('en-US')} B`,
          ek: t.ek,
          dk: t.dk,
          testPassed: t.testPassed,
        })
      }
    }
  }
  return out
}

type Sections = {
  kem: typeof import('@/components/Playground/hsm/acvp/sections/mlkemAcvp')
  opt: typeof import('@/components/Playground/hsm/acvp/sections/optionalInputAcvp')
  common: typeof import('@/components/Playground/hsm/acvp/sections/mldsaAcvp')
}

// The ACVP section helpers pull in the engine bindings; load them on first run.
async function loadSections(): Promise<Sections> {
  const [kem, opt, common] = await Promise.all([
    import('@/components/Playground/hsm/acvp/sections/mlkemAcvp'),
    import('@/components/Playground/hsm/acvp/sections/optionalInputAcvp'),
    import('@/components/Playground/hsm/acvp/sections/mldsaAcvp'),
  ])
  return { kem, opt, common }
}

function runCase(
  M: SoftHSMModule,
  h: number,
  s: Sections,
  c: EncapDecapCase
): { status: KatStatus; observed: string } {
  const { kem, opt, common } = s
  switch (c.function) {
    case 'encapsulation': {
      const r = opt.runEncapCase(M, h, PARAMETER_SET, {
        tcId: c.tcId,
        ek: c.ek!,
        m: c.m!,
        c: c.c!,
        k: c.k!,
      })
      return { status: r.ok ? 'pass' : 'fail', observed: r.details }
    }
    case 'decapsulation': {
      let priv = 0
      let sec = 0
      try {
        const imp = kem.importPrivate(M, h, VARIANT, hexToBytes(c.dk!))
        if (imp.rv !== CKR_OK) return { status: 'fail', observed: 'private key import was refused' }
        priv = imp.handle
        const r = kem.decapsulateRv(M, h, priv, hexToBytes(c.c!))
        sec = r.handle
        if (r.rv !== CKR_OK)
          return { status: 'fail', observed: `decapsulation returned ${rvName(r.rv)}` }
        const k = new Uint8Array(hsm_extractKeyValue(M, h, sec))
        const diff = common.firstDiff(k, hexToBytes(c.k!))
        return diff === 'identical'
          ? { status: 'pass', observed: 'shared secret equals NIST’s' }
          : { status: 'fail', observed: `shared secret differs (${diff})` }
      } finally {
        common.destroy(M, h, sec)
        common.destroy(M, h, priv)
      }
    }
    default: {
      const isDk = c.function === 'decapsulationKeyCheck'
      let key = 0
      let sec = 0
      try {
        const imp = isDk
          ? kem.importPrivate(M, h, VARIANT, hexToBytes(c.dk!))
          : kem.importPublic(M, h, VARIANT, hexToBytes(c.ek!))
        key = imp.handle
        let accepted = false
        if (imp.rv === CKR_OK) {
          const r = isDk
            ? kem.decapsulateRv(M, h, key, new Uint8Array(CT_LEN))
            : kem.encapsulateRv(M, h, key, CT_LEN)
          sec = r.handle
          accepted = r.rv === CKR_OK
        }
        const ok = accepted === c.testPassed
        return {
          status: ok ? 'pass' : 'fail',
          observed: `key ${accepted ? 'accepted' : 'rejected'}${
            ok ? '' : c.testPassed ? ', but NIST marks it valid' : ', but NIST marks it invalid'
          }`,
        }
      } finally {
        common.destroy(M, h, sec)
        common.destroy(M, h, key)
      }
    }
  }
}

export async function runEncapDecapSample(
  M: SoftHSMModule,
  hSession: number,
  onResult?: (r: EncapDecapResult) => void
): Promise<EncapDecapResult[]> {
  const [cases, sections] = await Promise.all([loadEncapDecapCases(), loadSections()])
  const out: EncapDecapResult[] = []
  for (const c of cases) {
    let result: EncapDecapResult
    try {
      result = { ...c, ...runCase(M, hSession, sections, c) }
    } catch (e) {
      result = {
        ...c,
        status: 'error',
        observed: `Engine error: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
    out.push(result)
    onResult?.(result)
  }
  return out
}
