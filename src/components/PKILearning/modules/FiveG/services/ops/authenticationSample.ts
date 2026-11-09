// SPDX-License-Identifier: AGPL-3.0-only
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { MilenageService } from '../MilenageService'

export const AUTHENTICATION_STAGES = [
  'retrieve_creds',
  'gen_rand',
  'compute_milenage',
  'compute_autn',
  'derive_kausf',
  'verify_ue',
  'verify_seaf',
  'verify_ausf',
] as const
export type AuthenticationStage = (typeof AUTHENTICATION_STAGES)[number]
export interface AuthenticationSnapshot {
  stageComplete: Record<AuthenticationStage, boolean>
  networkSqnHex: string
  nextNetworkSqnHex: string
  ueNextSqnHex: string
  networkKHex: string
  subscriberKHex: string
  networkOPcHex: string
  subscriberOPcHex: string
  randHex: string
  autnHex: string
  receivedAutnHex: string
  kausfHex: string
  xresStarHex: string
  hxresStarHex: string
  ueResStarHex: string
  receivedResStarHex: string
  hresStarHex: string
  accepted: boolean
  consumed: boolean
  canReplay: boolean
}
export interface AuthenticationStageResult {
  output: string
  snapshot: AuthenticationSnapshot
}
export interface AuthenticationSampleInputs {
  kHex: string
  opHex: string
  subscriberKHex: string
  firstSqnHex: string
  amfHex: string
  snn: string
}
const DEFAULT_INPUTS: AuthenticationSampleInputs = {
  kHex: '33'.repeat(16),
  opHex: '55'.repeat(16),
  subscriberKHex: '33'.repeat(16),
  firstSqnHex: '010101010101',
  amfHex: '8000',
  snn: '5G:mnc260.mcc310.3gppnetwork.org',
}
export class AuthenticationSampleError extends Error {
  readonly kind:
    | 'input'
    | 'mac'
    | 'sequence'
    | 'separation'
    | 'response'
    | 'replay'
    | 'operation'
    | 'stale'
    | 'busy'
    | 'prerequisite'

  constructor(kind: AuthenticationSampleError['kind'], message: string) {
    super(message)
    this.kind = kind
    this.name = 'AuthenticationSampleError'
  }
}

const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
function bytes(value: string, length: number, label: string): Uint8Array {
  if (value.length !== length * 2 || !/^[0-9a-fA-F]+$/.test(value))
    throw new AuthenticationSampleError(
      'input',
      `${label} must contain exactly ${length} bytes of hexadecimal.`
    )
  return new Uint8Array(value.match(/../g)!.map((b) => Number.parseInt(b, 16)))
}
function join(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}
function same(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let difference = 0
  for (let i = 0; i < a.length; i++) difference |= a.at(i)! ^ b.at(i)!
  return difference === 0
}
function sequence(value: string): bigint {
  bytes(value, 6, 'SQN')
  return BigInt('0x' + value)
}
function increment(value: string): string {
  const n = sequence(value)
  if (n === 0xffffffffffffn)
    throw new AuthenticationSampleError(
      'sequence',
      'The fictional 48-bit counter cannot wrap; reset the fictional session.'
    )
  return (n + 1n).toString(16).padStart(12, '0')
}
const length16 = (value: Uint8Array) => new Uint8Array([value.length >>> 8, value.length & 255])
function kdfInput(fc: number, ...parameters: Uint8Array[]): Uint8Array {
  return join(new Uint8Array([fc]), ...parameters.flatMap((p) => [p, length16(p)]))
}
type MilenageOutput = Awaited<ReturnType<MilenageService['compute']>>
type SavedChallenge = Pick<
  AuthenticationSnapshot,
  'networkSqnHex' | 'randHex' | 'autnHex' | 'kausfHex' | 'xresStarHex' | 'hxresStarHex'
>
interface OperationArtifacts {
  networkResult: MilenageOutput | null
  lastAccepted: SavedChallenge | null
  servingResponse: string
}
let instanceCounter = 0

/** Local fictional check state. This does not implement NAS, a production SQN window or AUTS. */
export class AuthenticationSample {
  private readonly inputs: AuthenticationSampleInputs
  private readonly milenage = new MilenageService()
  private readonly filePrefix = `auth_sample_${Date.now()}_${++instanceCounter}`
  private fileCounter = 0
  private revision = 0
  private busy = false
  private disposed = false
  private completed = new Set<AuthenticationStage>()
  private networkResult: MilenageOutput | null = null
  private lastAccepted: SavedChallenge | null = null
  private servingResponse = ''
  private state: AuthenticationSnapshot

  constructor(inputs: Partial<AuthenticationSampleInputs> = {}) {
    this.inputs = { ...DEFAULT_INPUTS, ...inputs }
    if (inputs.kHex !== undefined && inputs.subscriberKHex === undefined)
      this.inputs.subscriberKHex = inputs.kHex
    this.state = this.initialState()
  }
  private initialState(): AuthenticationSnapshot {
    return {
      stageComplete: Object.fromEntries(AUTHENTICATION_STAGES.map((s) => [s, false])) as Record<
        AuthenticationStage,
        boolean
      >,
      networkSqnHex: this.inputs.firstSqnHex,
      nextNetworkSqnHex: this.inputs.firstSqnHex,
      ueNextSqnHex: this.inputs.firstSqnHex,
      networkKHex: this.inputs.kHex,
      subscriberKHex: this.inputs.subscriberKHex,
      networkOPcHex: '',
      subscriberOPcHex: '',
      randHex: '',
      autnHex: '',
      receivedAutnHex: '',
      kausfHex: '',
      xresStarHex: '',
      hxresStarHex: '',
      ueResStarHex: '',
      receivedResStarHex: '',
      hresStarHex: '',
      accepted: false,
      consumed: false,
      canReplay: false,
    }
  }
  getSnapshot(): AuthenticationSnapshot {
    return {
      ...this.state,
      stageComplete: Object.fromEntries(
        AUTHENTICATION_STAGES.map((stage) => [stage, this.completed.has(stage)])
      ) as Record<AuthenticationStage, boolean>,
    }
  }
  private current(revision: number) {
    if (this.disposed || revision !== this.revision)
      throw new AuthenticationSampleError(
        'stale',
        'Inputs changed or this fictional session was closed; run the current step again.'
      )
  }
  private clearFrom(stage: AuthenticationStage) {
    const index = AUTHENTICATION_STAGES.indexOf(stage)
    for (const s of AUTHENTICATION_STAGES.slice(index)) this.completed.delete(s)
    if (index <= 0) {
      this.state.networkOPcHex = ''
      this.state.subscriberOPcHex = ''
    }
    if (index <= 1) this.state.randHex = ''
    if (index <= 2) this.networkResult = null
    if (index <= 3) {
      this.state.autnHex = ''
      this.state.receivedAutnHex = ''
    }
    if (index <= 4) {
      this.state.kausfHex = ''
      this.state.xresStarHex = ''
      this.state.hxresStarHex = ''
      this.state.consumed = false
    }
    if (index <= 5) {
      this.state.ueResStarHex = ''
      this.state.receivedResStarHex = ''
    }
    if (index <= 6) {
      this.state.hresStarHex = ''
      this.servingResponse = ''
    }
    this.state.accepted = false
  }
  setChallengeSqn(value: string): AuthenticationSnapshot {
    this.revision++
    this.clearFrom('gen_rand')
    this.state.networkSqnHex = value
    return this.getSnapshot()
  }
  setReceivedAutn(value: string): AuthenticationSnapshot {
    this.revision++
    this.clearFrom('verify_ue')
    this.state.receivedAutnHex = value
    return this.getSnapshot()
  }
  setReceivedResponse(value: string): AuthenticationSnapshot {
    this.revision++
    this.clearFrom('verify_seaf')
    this.state.receivedResStarHex = value
    return this.getSnapshot()
  }
  newChallenge(): AuthenticationSnapshot {
    this.revision++
    this.clearFrom('gen_rand')
    this.state.networkSqnHex = this.state.nextNetworkSqnHex
    return this.getSnapshot()
  }
  reset(): AuthenticationSnapshot {
    this.revision++
    this.completed.clear()
    this.state = this.initialState()
    this.networkResult = null
    this.lastAccepted = null
    this.servingResponse = ''
    return this.getSnapshot()
  }
  dispose(): void {
    this.revision++
    this.disposed = true
    this.clearFrom('retrieve_creds')
  }
  replayLastChallenge(): AuthenticationSnapshot {
    if (!this.lastAccepted)
      throw new AuthenticationSampleError(
        'prerequisite',
        'Accept one genuine sample challenge before replaying it.'
      )
    this.revision++
    this.clearFrom('gen_rand')
    Object.assign(this.state, this.lastAccepted)
    for (const s of AUTHENTICATION_STAGES.slice(0, 5)) this.completed.add(s)
    this.state.receivedAutnHex = this.state.autnHex
    this.state.consumed = true
    return this.getSnapshot()
  }
  private async digest(data: Uint8Array, revision: number, key?: Uint8Array): Promise<Uint8Array> {
    this.current(revision)
    const name = `${this.filePrefix}_${++this.fileCounter}.bin`
    const command = key
      ? `openssl dgst -sha256 -mac HMAC -macopt hexkey:${hex(key)} ${name}`
      : `openssl dgst -sha256 ${name}`
    let result
    try {
      result = await openSSLService.execute(command, [{ name, data }])
      this.current(revision)
      if (result.error || result.stderr?.trim())
        throw new AuthenticationSampleError(
          'operation',
          'The requested OpenSSL digest operation failed; no authentication result was accepted.'
        )
      const match = /(?:^|=)\s*([a-fA-F0-9]{64})\s*$/.exec(result.stdout ?? '')
      if (!match)
        throw new AuthenticationSampleError(
          'operation',
          'The requested OpenSSL digest operation did not return a complete SHA-256 result.'
        )
      return bytes(match[1], 32, 'Digest')
    } finally {
      await openSSLService.deleteFile(name)
    }
  }
  private require(stage: AuthenticationStage) {
    if (!this.completed.has(stage))
      throw new AuthenticationSampleError(
        'prerequisite',
        'Run the current prerequisite step before this authentication check.'
      )
  }
  async execute(stage: AuthenticationStage): Promise<AuthenticationStageResult> {
    if (!AUTHENTICATION_STAGES.includes(stage))
      throw new AuthenticationSampleError('input', 'Unknown authentication stage.')
    if (this.busy)
      throw new AuthenticationSampleError('busy', 'A sample operation is still running.')
    this.current(this.revision)
    this.busy = true
    const revision = this.revision
    this.clearFrom(stage)
    try {
      // Stage changes, especially sequence advancement, publish only after the final ownership check.
      const draft = { ...this.state, stageComplete: { ...this.state.stageComplete } }
      const artifacts: OperationArtifacts = {
        networkResult: this.networkResult,
        lastAccepted: this.lastAccepted,
        servingResponse: this.servingResponse,
      }
      const output = await this.perform(stage, revision, draft, artifacts)
      this.current(revision)
      this.state = draft
      this.networkResult = artifacts.networkResult
      this.lastAccepted = artifacts.lastAccepted
      this.servingResponse = artifacts.servingResponse
      this.completed.add(stage)
      return { output, snapshot: this.getSnapshot() }
    } catch (error) {
      if (revision === this.revision && !this.disposed) this.clearFrom(stage)
      throw error
    } finally {
      this.busy = false
    }
  }
  private async perform(
    stage: AuthenticationStage,
    revision: number,
    s: AuthenticationSnapshot,
    artifacts: OperationArtifacts
  ): Promise<string> {
    if (stage === 'retrieve_creds') {
      const k = bytes(this.inputs.kHex, 16, 'Network K'),
        op = bytes(this.inputs.opHex, 16, 'OP')
      const ueK = bytes(this.inputs.subscriberKHex, 16, 'Subscriber K')
      bytes(this.inputs.amfHex, 2, 'AMF')
      sequence(s.networkSqnHex)
      sequence(s.ueNextSqnHex)
      const networkOPc = await this.milenage.computeOPc(k, op)
      this.current(revision)
      const subscriberOPc = await this.milenage.computeOPc(ueK, new Uint8Array(op))
      this.current(revision)
      s.networkOPcHex = hex(networkOPc)
      s.subscriberOPcHex = hex(subscriberOPc)
      return `[EXECUTED] Loaded separate fictional credential copies in browser memory. No subscriber database or HSM was accessed.\nNetwork K: ${s.networkKHex}\nSubscriber K: ${s.subscriberKHex}\nOperator OP: ${this.inputs.opHex}\nAMF: ${this.inputs.amfHex}\nServing network name: ${this.inputs.snn}\nNetwork OPc: ${s.networkOPcHex}\nSubscriber OPc: ${s.subscriberOPcHex}\nNetwork challenge SQN: ${s.networkSqnHex}\nUE next expected SQN: ${s.ueNextSqnHex}\n[POLICY] This fictional session accepts only its exact next sequence value; no production window or resynchronization is implemented.`
    }
    this.require('retrieve_creds')
    if (stage === 'gen_rand') {
      const rand = new Uint8Array(16)
      window.crypto.getRandomValues(rand)
      s.randHex = hex(rand)
      return `[EXECUTED] Browser CSPRNG RAND: ${s.randHex}\nChallenge SQN: ${s.networkSqnHex}`
    }
    this.require('gen_rand')
    if (stage === 'compute_milenage') {
      const result = await this.milenage.compute(
        bytes(s.networkKHex, 16, 'Network K'),
        bytes(s.networkOPcHex, 16, 'Network OPc'),
        bytes(s.randHex, 16, 'RAND'),
        bytes(s.networkSqnHex, 6, 'SQN'),
        bytes(this.inputs.amfHex, 2, 'AMF')
      )
      this.current(revision)
      artifacts.networkResult = result
      return `[EXECUTED] Network MILENAGE\nMAC-A: ${hex(result.MAC)}\nXRES: ${hex(result.RES)}\nCK: ${hex(result.CK)}\nIK: ${hex(result.IK)}\nAK: ${hex(result.AK)}`
    }
    if (stage === 'compute_autn' || stage === 'derive_kausf') {
      this.require('compute_milenage')
      if (!artifacts.networkResult)
        throw new AuthenticationSampleError('prerequisite', 'Network MILENAGE output is missing.')
      const v = artifacts.networkResult,
        sqn = bytes(s.networkSqnHex, 6, 'SQN')
      const concealed = sqn.map((b, i) => b ^ v.AK.at(i)!)
      if (stage === 'compute_autn') {
        s.autnHex = hex(join(concealed, bytes(this.inputs.amfHex, 2, 'AMF'), v.MAC))
        s.receivedAutnHex = s.autnHex
        return `[EXECUTED] AUTN = (SQN XOR AK) || AMF || MAC-A\nAUTN: ${s.autnHex}\nThis is the sender's token; it has not yet been accepted by the UE.`
      }
      this.require('compute_autn')
      const key = join(v.CK, v.IK),
        snn = new TextEncoder().encode(this.inputs.snn),
        rand = bytes(s.randHex, 16, 'RAND')
      const kausf = await this.digest(kdfInput(0x6a, snn, concealed), revision, key)
      this.current(revision)
      const xres = await this.digest(kdfInput(0x6b, snn, rand, v.RES), revision, key)
      this.current(revision)
      const xresStar = xres.slice(16),
        hxres = await this.digest(join(rand, xresStar), revision)
      this.current(revision)
      const next = increment(s.networkSqnHex)
      s.kausfHex = hex(kausf)
      s.xresStarHex = hex(xresStar)
      s.hxresStarHex = hex(hxres.slice(16))
      if (sequence(next) > sequence(s.nextNetworkSqnHex)) s.nextNetworkSqnHex = next
      return `[EXECUTED] Complete local home-network vector\nRAND: ${s.randHex}\nAUTN: ${s.autnHex}\nXRES*: ${s.xresStarHex}\nKAUSF: ${s.kausfHex}\nHXRES*: ${s.hxresStarHex}\n[NOT YET CHECKED] UE acceptance and serving/home response checks. No NAS exchange or deployed authentication is established.`
    }
    this.require('derive_kausf')
    if (stage === 'verify_ue') {
      const autn = bytes(s.receivedAutnHex, 16, 'Received AUTN'),
        rand = bytes(s.randHex, 16, 'RAND'),
        k = bytes(s.subscriberKHex, 16, 'Subscriber K'),
        opc = bytes(s.subscriberOPcHex, 16, 'Subscriber OPc')
      const initial = await this.milenage.compute(
        k,
        opc,
        rand,
        bytes(s.ueNextSqnHex, 6, 'UE expected SQN'),
        autn.slice(6, 8)
      )
      this.current(revision)
      const recovered = autn.slice(0, 6).map((b, i) => b ^ initial.AK.at(i)!)
      const v = await this.milenage.compute(k, opc, rand, recovered, autn.slice(6, 8))
      this.current(revision)
      if (!same(v.MAC, autn.slice(8)))
        throw new AuthenticationSampleError(
          'mac',
          'UE MAC-A check failed. No subscriber response was released.'
        )
      if ((autn[6] & 0x80) === 0)
        throw new AuthenticationSampleError(
          'separation',
          'UE AMF separation check failed. No subscriber response was released.'
        )
      if (!same(recovered, bytes(s.ueNextSqnHex, 6, 'UE expected SQN')))
        throw new AuthenticationSampleError(
          'sequence',
          `UE sequence check failed: received ${hex(recovered)}, next expected ${s.ueNextSqnHex}. This next-sequence-only sample rejects stale, replayed or out-of-sequence challenges.`
        )
      const next = increment(hex(recovered)),
        snn = new TextEncoder().encode(this.inputs.snn)
      const response = await this.digest(
        kdfInput(0x6b, snn, rand, v.RES),
        revision,
        join(v.CK, v.IK)
      )
      this.current(revision)
      s.ueResStarHex = hex(response.slice(16))
      s.receivedResStarHex = s.ueResStarHex
      s.ueNextSqnHex = next
      return `[EXECUTED] UE independently recomputed MILENAGE from its own credential copy.\nReceived MAC-A: ${hex(autn.slice(8))}\nUE XMAC: ${hex(v.MAC)}\nMAC-A: matched\nAMF separation: accepted\nRecovered SQN: ${hex(recovered)}\nNext-sequence check: matched\nRES*: ${s.ueResStarHex}\nUE next expected SQN is now ${s.ueNextSqnHex}.\n[NOT YET CHECKED] Serving and home response checks.`
    }
    if (s.consumed)
      throw new AuthenticationSampleError(
        'replay',
        'This sample network challenge was already accepted and consumed; its response cannot be accepted again.'
      )
    this.require('verify_ue')
    const received = bytes(s.receivedResStarHex, 16, 'Received RES*')
    if (stage === 'verify_seaf') {
      const digest = await this.digest(join(bytes(s.randHex, 16, 'RAND'), received), revision)
      this.current(revision)
      const hres = digest.slice(16)
      if (!same(hres, bytes(s.hxresStarHex, 16, 'Expected HXRES*')))
        throw new AuthenticationSampleError(
          'response',
          'SEAF HRES*/HXRES* check failed. The home-network check has not accepted this response.'
        )
      s.hresStarHex = hex(hres)
      artifacts.servingResponse = hex(received)
      return `[EXECUTED] Serving-network response check\nHRES*: ${s.hresStarHex}\nHXRES*: ${s.hxresStarHex}\nComparison: matched\n[NOT YET CHECKED] AUSF RES*/XRES* equality. This is not final sample acceptance.`
    }
    this.require('verify_seaf')
    if (artifacts.servingResponse !== hex(received))
      throw new AuthenticationSampleError(
        'prerequisite',
        'The response changed after its serving-network check; check the current response again.'
      )
    if (!same(received, bytes(s.xresStarHex, 16, 'Expected XRES*')))
      throw new AuthenticationSampleError(
        'response',
        'AUSF RES*/XRES* check failed. The sample is not accepted.'
      )
    s.accepted = true
    s.consumed = true
    s.canReplay = true
    artifacts.lastAccepted = {
      networkSqnHex: s.networkSqnHex,
      randHex: s.randHex,
      autnHex: s.autnHex,
      kausfHex: s.kausfHex,
      xresStarHex: s.xresStarHex,
      hxresStarHex: s.hxresStarHex,
    }
    return `[EXECUTED] Home-network response check\nRES*: ${s.receivedResStarHex}\nXRES*: ${s.xresStarHex}\nComparison: matched\n[SAMPLE ACCEPTED] Actual UE MAC/separation/next-sequence checks, serving hash check and home response check passed for this local challenge.\nThe pending challenge is consumed. Replay will fail. This does not establish NAS transport, a production sequence window, resynchronization, durable state or a deployed 5G session.`
  }
}
