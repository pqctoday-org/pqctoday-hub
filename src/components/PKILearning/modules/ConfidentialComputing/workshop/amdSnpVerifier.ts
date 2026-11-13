// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Browser-side appraisal of a recorded AMD SEV-SNP attestation report.
 *
 * The chain and signature checks run real cryptography on the recorded bytes (WebCrypto for
 * RSA-PSS and ECDSA P-384, @peculiar/x509 to read the certificates); validity, VCEK binding,
 * measurement and challenge are comparisons against values the verifier holds. Each check
 * reports pass or fail on its own, so a failure is attributed to the one thing that failed:
 *
 *   chain          VCEK -> ASK -> ARK signatures (RSA-PSS, SHA-384) and the pinned ARK fingerprint
 *   validity       all three certificates are inside their validity period at the evaluation time
 *   vcek-binding   the VCEK names the same chip and TCB levels the report claims
 *   signature      the report signature (ECDSA P-384, SHA-384) verifies under the VCEK
 *   measurement    the 48-byte launch measurement equals the value this verifier pinned
 *   challenge      report_data equals the challenge this verifier issued, and it was not used before
 *
 * The report is a recording from an open-source project. The challenge is therefore the recorded
 * one, not a fresh value, and AMD signs with ECDSA, not ML-DSA.
 */
import 'reflect-metadata'
import {
  Extension,
  X509Certificate,
  X509CertificateGenerator,
  cryptoProvider,
} from '@peculiar/x509'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'

export const SNP_SIGNED_LENGTH = 0x2a0
export const SNP_REPORT_LENGTH = 0x4a0
const SIG_FIELD_LENGTH = 72

/** SHA-256 of the AMD Root Key (ARK) certificate (DER) that this page pins as its trust anchor. */
export const PINNED_ARK_SHA256 = '69d063b45344d26a2e94e1f4210de49ef555308287d4c174445c95639a540bcd'

/** The recorded report's launch measurement: what this one recorded VM measured, not a vendor-registry value. */
export const PINNED_MEASUREMENT_HEX =
  'b07af9620f3b839b47996422ddec6058338951d984e312115131ea82705eaf5b6bdf8a9ece31a5a608eb0cf2e4872b01'

/** The recorded challenge: bytes 01 02 03 04 05 followed by 59 zero bytes. */
export const RECORDED_CHALLENGE: Uint8Array = (() => {
  const c = new Uint8Array(64)
  c.set([1, 2, 3, 4, 5])
  return c
})()

const OID_HWID = '1.3.6.1.4.1.3704.1.4'
const OID_SPL = {
  bl: '1.3.6.1.4.1.3704.1.3.1',
  tee: '1.3.6.1.4.1.3704.1.3.2',
  snp: '1.3.6.1.4.1.3704.1.3.3',
  ucode: '1.3.6.1.4.1.3704.1.3.8',
} as const

export type CheckId =
  'chain' | 'validity' | 'vcek-binding' | 'signature' | 'measurement' | 'challenge'

export interface CheckResult {
  id: CheckId
  label: string
  /** True once the check actually executed (a failure is still "ran"). */
  ran: boolean
  passed: boolean
  /** What executed, so a pass is attributed to a named operation and not to the page. */
  attributedTo: string
  detail: string
}

export interface SnpReport {
  version: number
  guestSvn: number
  policy: bigint
  vmpl: number
  signatureAlgorithm: number
  reportData: Uint8Array
  measurement: Uint8Array
  hostData: Uint8Array
  chipId: Uint8Array
  reportedTcb: { bl: number; tee: number; snp: number; ucode: number }
  signedBody: Uint8Array
  /** r and s, 72-byte little-endian fields as stored in the report. */
  sigR: Uint8Array
  sigS: Uint8Array
}

export interface SnpEvidence {
  report: Uint8Array
  vcekDer: Uint8Array
  chainPem: string
}

export interface SnpPolicy {
  arkSha256: string
  expectedMeasurementHex: string
}

export const DEFAULT_POLICY: SnpPolicy = {
  arkSha256: PINNED_ARK_SHA256,
  expectedMeasurementHex: PINNED_MEASUREMENT_HEX,
}

export interface VerificationResult {
  checks: CheckResult[]
  allPassed: boolean
  report: SnpReport | null
  evaluatedAt: Date
}

// ── Report parsing ─────────────────────────────────────────────────────────

export function parseSnpReport(bytes: Uint8Array): SnpReport {
  if (bytes.length < SNP_REPORT_LENGTH) {
    throw new Error(`SNP report must be at least ${SNP_REPORT_LENGTH} bytes, got ${bytes.length}`)
  }
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const version = dv.getUint32(0, true)
  if (version !== 2) throw new Error(`Unsupported SNP report version ${version} (expected 2)`)
  const tcb = bytes.subarray(0x180, 0x188)
  return {
    version,
    guestSvn: dv.getUint32(4, true),
    policy: dv.getBigUint64(8, true),
    vmpl: dv.getUint32(0x30, true),
    signatureAlgorithm: dv.getUint32(0x34, true),
    reportData: bytes.slice(0x50, 0x90),
    measurement: bytes.slice(0x90, 0xc0),
    hostData: bytes.slice(0xc0, 0xe0),
    chipId: bytes.slice(0x1a0, 0x1e0),
    reportedTcb: { bl: tcb[0], tee: tcb[1], snp: tcb[6], ucode: tcb[7] },
    signedBody: bytes.slice(0, SNP_SIGNED_LENGTH),
    sigR: bytes.slice(0x2a0, 0x2a0 + SIG_FIELD_LENGTH),
    sigS: bytes.slice(0x2a0 + SIG_FIELD_LENGTH, 0x2a0 + 2 * SIG_FIELD_LENGTH),
  }
}

/** Little-endian 72-byte integer field to the 48-byte big-endian value used by P-384. */
function leFieldToP384(field: Uint8Array): Uint8Array | null {
  for (let i = 48; i < field.length; i++) if (field[i] !== 0) return null
  return Uint8Array.from(field.subarray(0, 48)).reverse()
}

/** Report signature (r, s little-endian) as the 96-byte r||s form WebCrypto expects. */
function reportSignatureP1363(r: SnpReport): Uint8Array | null {
  const rr = leFieldToP384(r.sigR)
  const ss = leFieldToP384(r.sigS)
  if (!rr || !ss) return null
  const out = new Uint8Array(96)
  out.set(rr, 0)
  out.set(ss, 48)
  return out
}

function p1363ToReportFields(sig: Uint8Array): { r: Uint8Array; s: Uint8Array } {
  const r = new Uint8Array(SIG_FIELD_LENGTH)
  const s = new Uint8Array(SIG_FIELD_LENGTH)
  r.set(Uint8Array.from(sig.subarray(0, 48)).reverse())
  s.set(Uint8Array.from(sig.subarray(48, 96)).reverse())
  return { r, s }
}

// ── Challenge ledger ───────────────────────────────────────────────────────

export type ChallengeOutcome = 'fresh' | 'replayed' | 'not-issued'

/**
 * One outstanding challenge, single use. A challenge is marked used the first time a report
 * carrying it is presented, whether or not the other checks pass, so a presented challenge can
 * never be accepted again.
 */
export class ChallengeLedger {
  private outstanding: Uint8Array | null = null
  private used: Uint8Array[] = []

  issue(challenge: Uint8Array): void {
    this.outstanding = Uint8Array.from(challenge)
  }

  consume(presented: Uint8Array): ChallengeOutcome {
    if (this.outstanding && equalBytes(this.outstanding, presented)) {
      this.used.push(this.outstanding)
      this.outstanding = null
      return 'fresh'
    }
    if (this.used.some((u) => equalBytes(u, presented))) return 'replayed'
    return 'not-issued'
  }
}

export function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]
  return d === 0
}

// ── Certificate helpers ────────────────────────────────────────────────────

const PEM_BLOCK = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g

export function parseChain(pem: string): { ask: X509Certificate; ark: X509Certificate } {
  const certs = (pem.match(PEM_BLOCK) ?? []).map((b) => new X509Certificate(b))
  const ark = certs.find((c) => c.subject === c.issuer)
  const ask = certs.find((c) => c !== ark)
  if (!ark || !ask) throw new Error('chain file must hold an ASK and a self-issued ARK')
  return { ask, ark }
}

const subtle = (): SubtleCrypto => (cryptoProvider.get() as Crypto).subtle

/** A copy as a plain Uint8Array: safe to hand to WebCrypto whichever realm produced the input. */
const toBuf = (b: ArrayBuffer | Uint8Array): Uint8Array<ArrayBuffer> => {
  const src = b instanceof Uint8Array ? b : new Uint8Array(b)
  const out = new Uint8Array(src.length)
  out.set(src)
  return out
}

/** Length of the DER header (tag and length octets) and of the content at the start of `der`. */
function derHeader(der: Uint8Array): { header: number; length: number } {
  const first = der[1]
  if (first < 0x80) return { header: 2, length: first }
  const n = first & 0x7f
  let length = 0
  for (let i = 0; i < n; i++) length = length * 256 + der[2 + i]
  return { header: 2 + n, length }
}

/** The exact signed bytes: the first element (tbsCertificate) inside the certificate SEQUENCE. */
function tbsBytes(cert: X509Certificate): Uint8Array<ArrayBuffer> {
  const der = new Uint8Array(cert.rawData)
  const outer = derHeader(der)
  const inner = derHeader(der.subarray(outer.header))
  return toBuf(der.subarray(outer.header, outer.header + inner.header + inner.length))
}

/** AMD certificates are RSASSA-PSS with SHA-384, MGF1-SHA-384 and a 48-byte salt. */
async function verifyPssSha384(child: X509Certificate, parent: X509Certificate): Promise<boolean> {
  if (child.issuer !== parent.subject) return false
  const key = await subtle().importKey(
    'spki',
    toBuf(parent.publicKey.rawData),
    { name: 'RSA-PSS', hash: 'SHA-384' },
    false,
    ['verify']
  )
  return subtle().verify(
    { name: 'RSA-PSS', saltLength: 48 },
    key,
    toBuf(child.signature),
    tbsBytes(child)
  )
}

function extensionBytes(cert: X509Certificate, oid: string): Uint8Array | null {
  const e = cert.getExtension(oid)
  return e ? new Uint8Array(e.value) : null
}

const lastByte = (b: Uint8Array | null): number | null => (b && b.length ? b[b.length - 1] : null)

// ── The individual checks ──────────────────────────────────────────────────

async function checkChain(
  vcek: X509Certificate,
  chain: { ask: X509Certificate; ark: X509Certificate },
  policy: SnpPolicy
): Promise<CheckResult> {
  const base = {
    id: 'chain' as const,
    label: 'VCEK to ASK to ARK certificate chain',
    ran: true,
    attributedTo: 'WebCrypto RSA-PSS verify (SHA-384, salt 48) on each certificate; SHA-256 of ARK',
  }
  const arkSelf = await verifyPssSha384(chain.ark, chain.ark)
  const askByArk = await verifyPssSha384(chain.ask, chain.ark)
  const vcekByAsk = await verifyPssSha384(vcek, chain.ask)
  const arkFingerprint = bytesToHex(sha256(new Uint8Array(chain.ark.rawData)))
  const pinned = arkFingerprint === policy.arkSha256
  const parts = [
    `ARK self-signed: ${arkSelf ? 'ok' : 'FAIL'}`,
    `ASK signed by ARK: ${askByArk ? 'ok' : 'FAIL'}`,
    `VCEK signed by ASK: ${vcekByAsk ? 'ok' : 'FAIL'}`,
    `ARK is the pinned root (SHA-256 ${arkFingerprint.slice(0, 16)}...): ${pinned ? 'ok' : 'FAIL'}`,
  ]
  return { ...base, passed: arkSelf && askByArk && vcekByAsk && pinned, detail: parts.join('; ') }
}

function checkValidity(
  vcek: X509Certificate,
  chain: { ask: X509Certificate; ark: X509Certificate },
  now: Date
): CheckResult {
  const rows = [
    ['ARK', chain.ark],
    ['ASK', chain.ask],
    ['VCEK', vcek],
  ] as const
  const bad = rows.filter(([, c]) => now < c.notBefore || now > c.notAfter).map(([n]) => n)
  const span = rows
    .map(
      ([n, c]) =>
        `${n} ${c.notBefore.toISOString().slice(0, 10)} to ${c.notAfter.toISOString().slice(0, 10)}`
    )
    .join('; ')
  return {
    id: 'validity',
    label: 'Certificate validity periods',
    ran: true,
    passed: bad.length === 0,
    attributedTo: 'Certificate notBefore/notAfter compared with the evaluation time',
    detail: `evaluated ${now.toISOString().slice(0, 10)}; ${span}${bad.length ? `; outside validity: ${bad.join(', ')}` : ''}`,
  }
}

function checkVcekBinding(vcek: X509Certificate, report: SnpReport): CheckResult {
  const hwRaw = extensionBytes(vcek, OID_HWID)
  // The extension value is a DER OCTET STRING wrapping the 64-byte chip id.
  const hw = hwRaw && hwRaw.length === 66 ? hwRaw.subarray(2) : hwRaw
  const chipOk = !!hw && equalBytes(hw, report.chipId)
  const spl = {
    bl: lastByte(extensionBytes(vcek, OID_SPL.bl)),
    tee: lastByte(extensionBytes(vcek, OID_SPL.tee)),
    snp: lastByte(extensionBytes(vcek, OID_SPL.snp)),
    ucode: lastByte(extensionBytes(vcek, OID_SPL.ucode)),
  }
  const t = report.reportedTcb
  const tcbOk = spl.bl === t.bl && spl.tee === t.tee && spl.snp === t.snp && spl.ucode === t.ucode
  return {
    id: 'vcek-binding',
    label: 'VCEK names the chip and TCB levels in the report',
    ran: true,
    passed: chipOk && tcbOk,
    attributedTo:
      'VCEK certificate extensions (hwID, bootloader/TEE/SNP/microcode SPL) vs report fields',
    detail: `chip id match: ${chipOk ? 'ok' : 'FAIL'}; TCB levels (bl ${t.bl}, tee ${t.tee}, snp ${t.snp}, microcode ${t.ucode}) match: ${tcbOk ? 'ok' : 'FAIL'}`,
  }
}

async function checkSignature(vcek: X509Certificate, report: SnpReport): Promise<CheckResult> {
  const base = {
    id: 'signature' as const,
    label: 'Report signature (ECDSA P-384, SHA-384)',
    ran: true,
    attributedTo: 'WebCrypto ECDSA P-384 verify with SHA-384 over report bytes 0x000-0x29F',
  }
  if (report.signatureAlgorithm !== 1) {
    return {
      ...base,
      passed: false,
      detail: `signature algorithm field is ${report.signatureAlgorithm}, expected 1 (ECDSA P-384 with SHA-384)`,
    }
  }
  const sig = reportSignatureP1363(report)
  if (!sig) return { ...base, passed: false, detail: 'r or s does not fit in 48 bytes' }
  try {
    const key = await subtle().importKey(
      'spki',
      toBuf(vcek.publicKey.rawData),
      { name: 'ECDSA', namedCurve: 'P-384' },
      false,
      ['verify']
    )
    const ok = await subtle().verify(
      { name: 'ECDSA', hash: 'SHA-384' },
      key,
      toBuf(sig),
      toBuf(report.signedBody)
    )
    return {
      ...base,
      passed: ok,
      detail: ok
        ? "signature verifies under the public key in the supplied VCEK (this alone does not say the VCEK is AMD's; see the chain check)"
        : 'signature does not verify under the public key in the supplied VCEK',
    }
  } catch (e) {
    return { ...base, passed: false, detail: `could not verify: ${(e as Error).message}` }
  }
}

function checkMeasurement(report: SnpReport, policy: SnpPolicy): CheckResult {
  const expected = hexToBytes(policy.expectedMeasurementHex)
  const ok = equalBytes(report.measurement, expected)
  return {
    id: 'measurement',
    label: 'Launch measurement equals the pinned policy value',
    ran: true,
    passed: ok,
    attributedTo:
      'Byte comparison of the 48-byte measurement (report offset 0x90) with the pinned value',
    detail: ok
      ? `measurement ${bytesToHex(report.measurement).slice(0, 24)}... equals the pinned value`
      : `measurement ${bytesToHex(report.measurement).slice(0, 24)}... differs from the pinned ${policy.expectedMeasurementHex.slice(0, 24)}...`,
  }
}

function checkChallenge(report: SnpReport, ledger: ChallengeLedger): CheckResult {
  const outcome = ledger.consume(report.reportData)
  const detail: Record<ChallengeOutcome, string> = {
    fresh: 'report_data equals the outstanding challenge; the challenge is now marked used',
    replayed: 'report_data equals a challenge that was already used: replay rejected',
    'not-issued': 'report_data is not the challenge this verifier issued',
  }
  return {
    id: 'challenge',
    label: 'Challenge is the one issued and was not used before',
    ran: true,
    passed: outcome === 'fresh',
    attributedTo: 'Single-use challenge ledger compared with report_data (report offset 0x50)',
    detail: detail[outcome],
  }
}

/** A check that throws did not run: it is reported as not run and not passed, never as passed. */
async function guarded(
  id: CheckId,
  fn: () => CheckResult | Promise<CheckResult>
): Promise<CheckResult> {
  try {
    return await fn()
  } catch (e) {
    return {
      id,
      label: id,
      ran: false,
      passed: false,
      attributedTo: 'check did not execute',
      detail: `did not run: ${(e as Error).message}`,
    }
  }
}

// ── Appraisal ──────────────────────────────────────────────────────────────

/**
 * Runs every check, even after a failure, so each result is attributed to its own cause. The
 * overall result is true only if all of them ran and passed.
 */
export async function verifySnpEvidence(
  evidence: SnpEvidence,
  policy: SnpPolicy,
  ledger: ChallengeLedger,
  now: Date = new Date()
): Promise<VerificationResult> {
  const report = parseSnpReport(evidence.report)
  const vcek = new X509Certificate(toBuf(evidence.vcekDer))
  const chain = parseChain(evidence.chainPem)
  const checks: CheckResult[] = [
    await guarded('chain', () => checkChain(vcek, chain, policy)),
    await guarded('validity', () => checkValidity(vcek, chain, now)),
    await guarded('vcek-binding', () => checkVcekBinding(vcek, report)),
    await guarded('signature', () => checkSignature(vcek, report)),
    await guarded('measurement', () => checkMeasurement(report, policy)),
    await guarded('challenge', () => checkChallenge(report, ledger)),
  ]
  return { checks, allPassed: checks.every((c) => c.ran && c.passed), report, evaluatedAt: now }
}

// ── Scenarios used by the page and the tests ───────────────────────────────

/** Copy of the evidence with one bit of the report flipped. */
export function flipBit(evidence: SnpEvidence, byteOffset: number, bit = 0): SnpEvidence {
  const report = Uint8Array.from(evidence.report)
  report[byteOffset] ^= 1 << bit
  return { ...evidence, report }
}

/** Copy of the policy whose expected measurement differs from the recorded one by one bit. */
export function policyWithWrongMeasurement(policy: SnpPolicy): SnpPolicy {
  const m = hexToBytes(policy.expectedMeasurementHex)
  m[0] ^= 1
  return { ...policy, expectedMeasurementHex: bytesToHex(m) }
}

/** Byte offset of guest_svn: inside the signed body, outside every other check. */
export const TAMPER_OFFSET_GUEST_SVN = 0x04

/**
 * An attacker who generates their own P-384 key, re-signs the same report body with it and
 * supplies a certificate for that key that names the ASK as issuer and copies the real VCEK's
 * chip and TCB extensions. The signature verifies under the attacker's key; the certificate's
 * own signature is not the ASK's, so the chain check rejects it at the RSA-PSS step.
 */
export async function buildAttackerEvidence(evidence: SnpEvidence): Promise<SnpEvidence> {
  const real = new X509Certificate(toBuf(evidence.vcekDer))
  const report = parseSnpReport(evidence.report)
  const keys = (await subtle().generateKey({ name: 'ECDSA', namedCurve: 'P-384' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair
  const sig = new Uint8Array(
    await subtle().sign(
      { name: 'ECDSA', hash: 'SHA-384' },
      keys.privateKey,
      toBuf(report.signedBody)
    )
  )
  const { r, s } = p1363ToReportFields(sig)
  const forged = Uint8Array.from(evidence.report)
  forged.set(r, 0x2a0)
  forged.set(s, 0x2a0 + SIG_FIELD_LENGTH)
  const copied = real.extensions
    .filter((e) => e.type.startsWith('1.3.6.1.4.1.3704.1.'))
    .map((e) => new Extension(e.type, e.critical, e.value))
  // The forged certificate names the real ASK as its issuer, so the chain check has to reach the
  // signature and cannot reject it on the issuer name alone.
  const cert = await X509CertificateGenerator.create(
    {
      serialNumber: '01',
      subject: real.subject,
      issuer: parseChain(evidence.chainPem).ask.subject,
      notBefore: real.notBefore,
      notAfter: real.notAfter,
      signingAlgorithm: { name: 'ECDSA', hash: 'SHA-384' },
      publicKey: keys.publicKey,
      signingKey: keys.privateKey,
      extensions: copied,
    },
    cryptoProvider.get()
  )
  return { ...evidence, report: forged, vcekDer: new Uint8Array(cert.rawData) }
}

// ── Completing a channel ───────────────────────────────────────────────────

export interface ChannelBindingCheckLike {
  id: string
  ran: boolean
  passed: boolean
}

/**
 * A channel may be treated as established only when every required check ran and passed, each
 * attributed to its own result. A primitive signature check passing on its own is not enough.
 */
export function channelEstablished(
  appraisal: Pick<VerificationResult, 'checks'>,
  binding: readonly ChannelBindingCheckLike[]
): { established: boolean; missing: string[]; failed: string[] } {
  const required = [
    'chain',
    'validity',
    'vcek-binding',
    'signature',
    'measurement',
    'challenge',
    'key-binding',
    'ciphertext-binding',
  ]
  const all: ChannelBindingCheckLike[] = [...appraisal.checks, ...binding]
  const missing = required.filter((id) => !all.some((c) => c.id === id && c.ran))
  const failed = required.filter((id) => all.some((c) => c.id === id && c.ran && !c.passed))
  return { established: missing.length === 0 && failed.length === 0, missing, failed }
}
