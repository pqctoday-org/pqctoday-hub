// SPDX-License-Identifier: GPL-3.0-only
/**
 * Every computed number the Learn tab quotes, derived from the same constants
 * and models the workshop uses. The Learn prose reads these; it never types a
 * computed figure by hand. IoTPQC.learnFacts.test.ts re-derives the headline
 * facts through the workshop functions and asserts they match.
 */
import { BENCH_SOURCES, algorithmById, type BenchSourceId } from './constants'
import {
  HANDSHAKE_KEMS,
  IEEE802154_PAYLOAD,
  MTC_HASH_BYTES,
  dtlsHandshake,
  edhocHandshake,
  fitSummary,
  pbAdvSegments,
  uniformChain,
} from './utils/sizing'
import { firmwareAirtime } from './utils/lpwanMath'
import { computeRotationPlan, HSM_OPS_PER_SEC } from './data/fleetData'
import { DEFAULT_FLEET } from './data/fleetTypes'

const mlkem768 = algorithmById('ml-kem-768')
const mldsa44 = algorithmById('ml-dsa-44')
const fndsa = algorithmById('fn-dsa-512')
const lms = algorithmById('lms-h10-w4')
const xmss = algorithmById('xmss-h10')
const frodo = algorithmById('frodokem-640')
const ecdh = algorithmById('ecdh-p256')

function ramRow(id: string, build: 'stack' | 'speed', label: string) {
  const a = algorithmById(id)
  const b = build === 'speed' && a.builds.speed ? a.builds.speed : a.builds.stack
  const light = a.type === 'KEM' ? b.ops.decaps! : b.ops.verify!
  const heavy = a.type === 'KEM' ? b.ops.keygen! : b.ops.sign!
  return {
    name: a.name,
    build: `${label} (${b.impl})`,
    light: light.stackBytes,
    heavy: heavy.stackBytes,
    source: b.source as BenchSourceId,
  }
}

/** Fastest benchmarked verify per signature algorithm, ascending. */
function verifyRanking() {
  return [
    'fn-dsa-512',
    'ecdsa-p256',
    'ml-dsa-44',
    'ml-dsa-65',
    'lms-h10-w4',
    'ml-dsa-87',
    'xmss-h10',
  ]
    .map((id) => {
      const a = algorithmById(id)
      const cycles = Math.min(
        ...[a.builds.stack, a.builds.speed]
          .filter((b) => b?.ops.verify)
          .map((b) => b!.ops.verify!.cycles)
      )
      return { name: a.name, cycles, mcycles: (cycles / 1e6).toFixed(2) }
    })
    .sort((x, y) => x.cycles - y.cycles)
}

const chainIds: [string, string, boolean][] = [
  ['ecdsa-p256', 'ECDSA P-256', false],
  ['rsa-2048', 'RSA-2048', false],
  ['fn-dsa-512', 'FN-DSA-512 (pre-standard)', true],
  ['lms-h10-w4', 'LMS H10/W4 (HSS)', true],
  ['ml-dsa-44', 'ML-DSA-44', true],
  ['ml-dsa-65', 'ML-DSA-65', true],
  ['ml-dsa-87', 'ML-DSA-87', true],
]
const chainTable = chainIds.map(([id, name, quantumSafe]) => ({
  name,
  quantumSafe,
  sent: uniformChain(id).sent,
}))

const fleet = computeRotationPlan(DEFAULT_FLEET)

const airtimeBase = {
  techId: 'nbiot' as const,
  firmwareBytes: 150 * 1024,
  keyBytes: 0,
  devicesPerCell: 1000,
  hops: 1,
  windowHours: 24,
}
const nbUni = firmwareAirtime({
  ...airtimeBase,
  signatureBytes: algorithmById('ml-dsa-87').outputBytes,
  multicast: false,
})
const nbMulti = firmwareAirtime({
  ...airtimeBase,
  signatureBytes: algorithmById('ml-dsa-87').outputBytes,
  multicast: true,
})
const share44 = firmwareAirtime({
  ...airtimeBase,
  signatureBytes: mldsa44.outputBytes,
  multicast: true,
}).signatureShare

export const LEARN_FACTS = {
  radioFramePayload: IEEE802154_PAYLOAD,
  mlkem768CtFrames: Math.ceil(mlkem768.outputBytes / IEEE802154_PAYLOAD),
  mlkem768CtNbIotSeconds: ((mlkem768.outputBytes * 8) / 26_000).toFixed(2),

  ramTable: [
    ramRow('ml-kem-768', 'stack', 'stack'),
    ramRow('ml-kem-768', 'speed', 'speed'),
    ramRow('ml-dsa-44', 'stack', 'stack'),
    ramRow('ml-dsa-44', 'speed', 'speed'),
    ramRow('fn-dsa-512', 'stack', 'only build'),
    ramRow('lms-h10-w4', 'stack', 'reference'),
    ramRow('ecdsa-p256', 'stack', 'assembly'),
  ],
  mlkem768StackDecaps: mlkem768.builds.stack.ops.decaps!.stackBytes,
  mlkem768SpeedDecaps: mlkem768.builds.speed!.ops.decaps!.stackBytes,
  mldsa44StackVerify: mldsa44.builds.stack.ops.verify!.stackBytes,
  mldsa44StackSign: mldsa44.builds.stack.ops.sign!.stackBytes,
  mldsa44SpeedVerify: mldsa44.builds.speed!.ops.verify!.stackBytes,
  fndsaVerify: fndsa.builds.stack.ops.verify!.stackBytes,
  fndsaSign: fndsa.builds.stack.ops.sign!.stackBytes,
  fndsaCode: fndsa.builds.stack.codeBytes!,
  lmsVerifyStack: lms.builds.stack.ops.verify!.stackBytes,
  frodoDecaps: frodo.builds.stack.ops.decaps!.stackBytes,
  ecdhStack: ecdh.builds.stack.ops.decaps!.stackBytes,
  class1Verify: fitSummary(1, 'verify', 'stack'),
  class1Kem: fitSummary(1, 'kem', 'stack'),

  verifyRanking: verifyRanking(),
  xmssOverLms: (xmss.builds.stack.ops.verify!.cycles / lms.builds.stack.ops.verify!.cycles).toFixed(
    1
  ),

  dtlsClassical: dtlsHandshake('x25519', 'ecdsa-p256'),
  dtlsPq: dtlsHandshake('ml-kem-768', 'ml-dsa-44'),
  edhocClassical: edhocHandshake('x25519', 'ecdsa-p256'),
  edhocPq: edhocHandshake('ml-kem-768', 'ml-dsa-44'),
  bleP256Segments: pbAdvSegments(64 + 1).segments,
  bleMlkem768Segments: pbAdvSegments(mlkem768.publicKeyBytes + 1).segments,

  chainTable,
  chainMax: Math.max(...chainTable.map((c) => c.sent)),
  chainMldsa65OverEcdsa: (uniformChain('ml-dsa-65').sent / uniformChain('ecdsa-p256').sent).toFixed(
    0
  ),
  mtcHashBytes: MTC_HASH_BYTES,

  fleet: {
    fleetSize: DEFAULT_FLEET.fleetSize,
    hsmOpsPerSec: HSM_OPS_PER_SEC[DEFAULT_FLEET.hsmCapacity],
    networkMinutesPerCell: Math.round(fleet.networkHoursPerCell * 60),
    hsmHours: fleet.hsmHours.toFixed(1),
    bottleneck: fleet.bottleneck,
  },

  airtime: {
    firmwareKB: airtimeBase.firmwareBytes / 1024,
    devices: airtimeBase.devicesPerCell,
    mldsa87SharePct: (nbUni.signatureShare * 100).toFixed(1),
    mldsa44SharePct: (share44 * 100).toFixed(1),
    nbiotUnicastHours: Math.round(nbUni.cellHours),
    nbiotMulticastMinutes: Math.round(nbMulti.cellHours * 60),
  },

  hybridExtraBytes:
    HANDSHAKE_KEMS['x25519-ml-kem-768'].sizes.publicKeyBytes -
    HANDSHAKE_KEMS['ml-kem-768'].sizes.publicKeyBytes,
  benchSources: BENCH_SOURCES,
} as const
