// SPDX-License-Identifier: GPL-3.0-only
//
// certDiscoveryCore.ts — the "Discovering certificates" lesson's engine work,
// independent of where it runs (a dedicated Web Worker in the browser, a
// fresh vitest module graph in the local test). It drives a RAW Rust
// softhsmrustv3 wasm32 instance through its _C_* exports and records every
// call, so the lesson can show the real trace and per-function counts.
//
// The two flows list slot ID + CKA_LABEL + CKA_SUBJECT + CKA_ID for every
// CKO_CERTIFICATE on every slot (PKCS#11 v3.2):
//   SHORT — C_Initialize, one pre-sized C_GetSlotList (§5.5.1: "multiple
//           calls ... are by no means required"), per slot C_OpenSession +
//           C_FindObjectsInit({CKA_CLASS=CKO_CERTIFICATE}) + ONE C_FindObjects
//           (a short count means the search is complete, §5.7.8), ONE
//           C_GetAttributeValue per certificate with pre-sized buffers,
//           C_Finalize (which closes the sessions and their searches).
//   LONG  — C_Initialize, C_GetSlotList size query + fill, per slot
//           C_GetTokenInfo (skip uninitialized tokens), C_OpenSession,
//           C_FindObjectsInit, C_FindObjects in batches until it returns 0,
//           per certificate C_GetAttributeValue length query + value fetch,
//           C_CloseSession; then C_Finalize.
//
// wasm32 ABI: CK_ULONG and pointers are 4 bytes; CK_ATTRIBUTE and
// CK_MECHANISM are three consecutive u32 words.

/** The subset of the softhsmrustv3 wasm-bindgen exports this lesson calls. */
export interface DiscoveryEngine {
  _C_Initialize(pInitArgs: number): number
  _C_Finalize(pReserved: number): number
  _C_GetSlotList(tokenPresent: number, pSlotList: number, pulCount: number): number
  _C_GetTokenInfo(slotID: number, pInfo: number): number
  _C_InitToken(slotID: number, pPin: number, ulPinLen: number, pLabel: number): number
  _C_InitPIN(hSession: number, pPin: number, ulPinLen: number): number
  _C_OpenSession(
    slotID: number,
    flags: number,
    pApp: number,
    notify: number,
    phSession: number
  ): number
  _C_CloseSession(hSession: number): number
  _C_Login(hSession: number, userType: number, pPin: number, ulPinLen: number): number
  _C_Logout(hSession: number): number
  _C_CreateObject(hSession: number, pTemplate: number, ulCount: number, phObject: number): number
  _C_GenerateKeyPair(
    hSession: number,
    pMechanism: number,
    pPubTemplate: number,
    ulPubCount: number,
    pPrvTemplate: number,
    ulPrvCount: number,
    phPub: number,
    phPrv: number
  ): number
  _C_FindObjectsInit(hSession: number, pTemplate: number, ulCount: number): number
  _C_FindObjects(hSession: number, phObject: number, ulMax: number, pulCount: number): number
  _C_FindObjectsFinal(hSession: number): number
  _C_GetAttributeValue(
    hSession: number,
    hObject: number,
    pTemplate: number,
    ulCount: number
  ): number
  _malloc(size: number): number
  _free(ptr: number): void
  memory(): WebAssembly.Memory
}

export interface CallRecord {
  fn: string
  args: string
  rv: number
  ms: number
}

export interface CertRow {
  slot: number
  handle: number
  label: string
  subject: string
  id: string
  rv: number
}

export interface FlowResult {
  calls: CallRecord[]
  /** C_* name → number of calls, in first-call order. */
  counts: [string, number][]
  rows: CertRow[]
  /** Slots C_GetSlotList reported. */
  slots: number[]
  /** Slots skipped because their token is not initialized (long flow). */
  skipped: number[]
}

export interface ProvisionResult {
  calls: CallRecord[]
  slots: number[]
  certsPerSlot: number
  keyPairsPerSlot: number
}

export const FIXTURE = { slots: 3, certsPerSlot: 6, keyPairsPerSlot: 3 } as const
/** Batch size of the long flow's C_FindObjects loop. */
export const LONG_FLOW_BATCH = 4

// ── PKCS#11 v3.2 constants (pkcs11t.h) ────────────────────────────────────
const CKR_OK = 0
const CKF_RW_SESSION = 0x2
const CKF_SERIAL_SESSION = 0x4
const CKF_TOKEN_INITIALIZED = 0x400
const CKU_SO = 0
const CKU_USER = 1
const CKA_CLASS = 0x0
const CKA_TOKEN = 0x1
const CKA_PRIVATE = 0x2
const CKA_LABEL = 0x3
const CKA_VALUE = 0x11
const CKA_CERTIFICATE_TYPE = 0x80
const CKA_SUBJECT = 0x101
const CKA_ID = 0x102
const CKA_SIGN = 0x108
const CKA_VERIFY = 0x10a
const CKA_EC_PARAMS = 0x180
const CKO_CERTIFICATE = 0x1
const CKC_X_509 = 0x0
const CKM_EC_KEY_PAIR_GEN = 0x1040
const CK_UNAVAILABLE_INFORMATION = 0xffffffff
/** DER OID 1.2.840.10045.3.1.7 (P-256), the CKA_EC_PARAMS value. */
const P256_OID = [0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07]
const SO_PIN = 'lesson-so-pin'
const USER_PIN = 'lesson-user-pin'

const RV_NAMES: Record<number, string> = {
  0x0: 'CKR_OK',
  0x7: 'CKR_ARGUMENTS_BAD',
  0x12: 'CKR_ATTRIBUTE_TYPE_INVALID',
  0x101: 'CKR_USER_NOT_LOGGED_IN',
  0x150: 'CKR_BUFFER_TOO_SMALL',
  0x190: 'CKR_CRYPTOKI_NOT_INITIALIZED',
  0x191: 'CKR_CRYPTOKI_ALREADY_INITIALIZED',
}
export const rvName = (rv: number): string =>
  RV_NAMES[rv] ?? `0x${rv.toString(16).padStart(8, '0')}`

export const hexOf = (b: Uint8Array): string =>
  Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
const fromHex = (h: string): Uint8Array =>
  Uint8Array.from(h.match(/../g) ?? [], (x) => parseInt(x, 16))

// ── minimal DER helpers (definite length only) ─────────────────────────────
/** (tag, content, total bytes) of the TLV at the front of `b`, or null. */
const tlv = (b: Uint8Array): [number, Uint8Array, number] | null => {
  if (b.length < 2) return null
  const lenByte = b[1]
  let len = lenByte
  let hdr = 2
  if (lenByte & 0x80) {
    const n = lenByte & 0x7f
    if (n === 0 || n > 3 || b.length < 2 + n) return null
    len = 0
    for (let k = 0; k < n; k++) len = (len << 8) | b[2 + k]
    hdr = 2 + n
  }
  if (b.length < hdr + len) return null
  return [b[0], b.subarray(hdr, hdr + len), hdr + len]
}

/** The DER-encoded subject Name of an X.509 certificate (RFC 5280 §4.1:
 * tbsCertificate = [0] version?, serialNumber, signature, issuer, validity,
 * subject, ...). The lesson stores it as CKA_SUBJECT, which §4.6.3 Table 22
 * requires at creation. */
export const x509Subject = (cert: Uint8Array): Uint8Array => {
  const outer = tlv(cert)
  if (!outer || outer[0] !== 0x30) throw new Error('not a DER certificate')
  const tbs = tlv(outer[1])
  if (!tbs || tbs[0] !== 0x30) throw new Error('no tbsCertificate')
  let rest = tbs[1]
  const fields: Uint8Array[] = []
  const tags: number[] = []
  while (rest.length > 0 && fields.length < 6) {
    const t = tlv(rest)
    if (!t) throw new Error('truncated tbsCertificate')
    tags.push(t[0])
    fields.push(rest.subarray(0, t[2]))
    rest = rest.subarray(t[2])
  }
  const skip = tags[0] === 0xa0 ? 1 : 0
  const subject = fields[skip + 4]
  if (!subject || subject[0] !== 0x30) throw new Error('no subject Name')
  return subject
}

/** "O=…, CN=…" for the attribute types this lesson's certificates use. */
export const nameToString = (name: Uint8Array): string => {
  const seq = tlv(name)
  if (!seq) return '<undecodable>'
  const parts: string[] = []
  let rdns = seq[1]
  while (rdns.length > 0) {
    const set = tlv(rdns)
    if (!set) break
    const atv = tlv(set[1])
    if (atv) {
      const oid = tlv(atv[1])
      const val = oid ? tlv(atv[1].subarray(oid[2])) : null
      if (oid && val) {
        const o = hexOf(oid[1])
        const key = o === '55040a' ? 'O' : o === '550403' ? 'CN' : `OID(${o})`
        parts.push(`${key}=${new TextDecoder().decode(val[1])}`)
      }
    }
    rdns = rdns.subarray(set[2])
  }
  return parts.join(', ')
}

// ── engine memory + call recording ─────────────────────────────────────────
class Session {
  readonly calls: CallRecord[] = []
  private allocs: number[] = []

  private readonly E: DiscoveryEngine

  constructor(E: DiscoveryEngine) {
    this.E = E
  }

  private view(): DataView {
    // Fresh view on every access: wasm memory may grow and detach old buffers.
    return new DataView(this.E.memory().buffer)
  }
  bytes(ptr: number, len: number): Uint8Array {
    return new Uint8Array(this.E.memory().buffer, ptr, len).slice()
  }
  alloc(n: number): number {
    const p = this.E._malloc(Math.max(n, 4))
    this.allocs.push(p)
    new Uint8Array(this.E.memory().buffer, p, Math.max(n, 4)).fill(0)
    return p
  }
  put(data: Uint8Array): number {
    const p = this.alloc(data.length)
    new Uint8Array(this.E.memory().buffer, p, data.length).set(data)
    return p
  }
  u32(v: number): number {
    const p = this.alloc(4)
    this.view().setUint32(p, v >>> 0, true)
    return p
  }
  read32(p: number): number {
    return this.view().getUint32(p, true)
  }
  write32(p: number, v: number): void {
    this.view().setUint32(p, v >>> 0, true)
  }
  /** CK_ATTRIBUTE[] — each value already allocated, or 0/len for queries. */
  template(entries: [number, number, number][]): number {
    const p = this.alloc(entries.length * 12)
    entries.forEach(([t, ptr, len], i) => {
      this.write32(p + i * 12, t)
      this.write32(p + i * 12 + 4, ptr)
      this.write32(p + i * 12 + 8, len)
    })
    return p
  }
  /** Value entry helpers. */
  vBytes(t: number, b: Uint8Array): [number, number, number] {
    return [t, this.put(b), b.length]
  }
  vBool(t: number, v: boolean): [number, number, number] {
    return this.vBytes(t, Uint8Array.of(v ? 1 : 0))
  }
  vUlong(t: number, v: number): [number, number, number] {
    return [t, this.u32(v), 4]
  }
  vText(t: number, s: string): [number, number, number] {
    return this.vBytes(t, new TextEncoder().encode(s))
  }
  call(fn: string, args: string, thunk: () => number): number {
    const t0 = performance.now()
    const rv = thunk() >>> 0
    this.calls.push({ fn, args, rv, ms: Math.round((performance.now() - t0) * 100) / 100 })
    return rv
  }
  must(fn: string, args: string, thunk: () => number): void {
    const rv = this.call(fn, args, thunk)
    if (rv !== CKR_OK) throw new Error(`${fn}(${args}) -> ${rvName(rv)}`)
  }
  release(): void {
    for (const p of this.allocs) this.E._free(p)
    this.allocs = []
  }
}

const countsOf = (calls: CallRecord[]): [string, number][] => {
  const m = new Map<string, number>()
  for (const c of calls) m.set(c.fn, (m.get(c.fn) ?? 0) + 1)
  return [...m.entries()]
}

const getSlots = (S: Session, E: DiscoveryEngine, sizeQuery: boolean): number[] => {
  const pCount = S.u32(0)
  if (sizeQuery) {
    S.must('C_GetSlotList', 'tokenPresent=FALSE, pSlotList=NULL', () =>
      E._C_GetSlotList(0, 0, pCount)
    )
    const n = S.read32(pCount)
    const list = S.alloc(n * 4)
    S.must('C_GetSlotList', `tokenPresent=FALSE, pSlotList[${n}]`, () =>
      E._C_GetSlotList(0, list, pCount)
    )
    return Array.from({ length: S.read32(pCount) }, (_, i) => S.read32(list + i * 4))
  }
  const CAP = 64
  const list = S.alloc(CAP * 4)
  S.write32(pCount, CAP)
  S.must('C_GetSlotList', `tokenPresent=FALSE, pSlotList[${CAP}] (pre-sized, no size query)`, () =>
    E._C_GetSlotList(0, list, pCount)
  )
  return Array.from({ length: S.read32(pCount) }, (_, i) => S.read32(list + i * 4))
}

/** CK_TOKEN_INFO as the Rust engine writes it on wasm32 (160 bytes):
 * label[32]@0, serialNumber[16]@80, flags@96. */
const tokenInfo = (S: Session, E: DiscoveryEngine, slot: number) => {
  const p = S.alloc(160)
  S.must('C_GetTokenInfo', `slot=${slot}`, () => E._C_GetTokenInfo(slot, p))
  const b = S.bytes(p, 160)
  return {
    label: new TextDecoder().decode(b.subarray(0, 32)).trimEnd(),
    flags: new DataView(b.buffer).getUint32(96, true),
  }
}

const openSession = (S: Session, E: DiscoveryEngine, slot: number, rw: boolean): number => {
  const ph = S.u32(0)
  const flags = CKF_SERIAL_SESSION | (rw ? CKF_RW_SESSION : 0)
  S.must(
    'C_OpenSession',
    `slot=${slot}, flags=CKF_SERIAL_SESSION${rw ? '|CKF_RW_SESSION' : ''}`,
    () => E._C_OpenSession(slot, flags, 0, 0, ph)
  )
  return S.read32(ph)
}

// ── 1. provisioning ────────────────────────────────────────────────────────
/**
 * Builds the lesson's fixture on a FRESH engine: FIXTURE.slots tokens, each
 * with FIXTURE.certsPerSlot X.509 certificates and FIXTURE.keyPairsPerSlot
 * EC P-256 key pairs (whose CKA_ID matches certificates 0..k-1, the pairing
 * Profiles §5.5 condition 8b describes). New slots come from the engine's
 * spare-slot rule: a C_GetSlotList size query adds an uninitialized slot
 * once every existing token is initialized.
 */
export const provisionFixture = (
  E: DiscoveryEngine,
  certsDerHex: readonly string[]
): ProvisionResult => {
  const S = new Session(E)
  try {
    S.must('C_Initialize', 'NULL', () => E._C_Initialize(0))
    const slots: number[] = []
    const so = new TextEncoder().encode(SO_PIN)
    const user = new TextEncoder().encode(USER_PIN)
    for (let s = 0; s < FIXTURE.slots; s++) {
      const list = getSlots(S, E, true)
      const slot = list.find((id) => !(tokenInfo(S, E, id).flags & CKF_TOKEN_INITIALIZED))
      if (slot === undefined) throw new Error('No uninitialized slot offered by C_GetSlotList')
      const label = new Uint8Array(32).fill(0x20)
      label.set(new TextEncoder().encode(`lesson-token-${s}`))
      const pSo = S.put(so)
      S.must('C_InitToken', `slot=${slot}, label="lesson-token-${s}"`, () =>
        E._C_InitToken(slot, pSo, so.length, S.put(label))
      )
      const h = openSession(S, E, slot, true)
      S.must('C_Login', `h=${h}, CKU_SO`, () => E._C_Login(h, CKU_SO, pSo, so.length))
      const pUser = S.put(user)
      S.must('C_InitPIN', `h=${h}`, () => E._C_InitPIN(h, pUser, user.length))
      S.must('C_Logout', `h=${h}`, () => E._C_Logout(h))
      S.must('C_Login', `h=${h}, CKU_USER`, () => E._C_Login(h, CKU_USER, pUser, user.length))

      for (let i = 0; i < FIXTURE.certsPerSlot; i++) {
        const der = fromHex(certsDerHex[i % certsDerHex.length])
        const t = [
          S.vUlong(CKA_CLASS, CKO_CERTIFICATE),
          S.vUlong(CKA_CERTIFICATE_TYPE, CKC_X_509),
          S.vBool(CKA_TOKEN, true),
          S.vText(CKA_LABEL, `slot${s}-cert-${i}`),
          S.vBytes(CKA_SUBJECT, x509Subject(der)),
          S.vBytes(CKA_ID, Uint8Array.of(s, i)),
          S.vBytes(CKA_VALUE, der),
        ]
        const ph = S.u32(0)
        S.must('C_CreateObject', `h=${h}, CKO_CERTIFICATE "slot${s}-cert-${i}"`, () =>
          E._C_CreateObject(h, S.template(t), t.length, ph)
        )
      }
      for (let k = 0; k < FIXTURE.keyPairsPerSlot; k++) {
        const mech = S.template([[CKM_EC_KEY_PAIR_GEN, 0, 0]])
        const id = Uint8Array.of(s, k)
        const pub = [
          S.vBool(CKA_TOKEN, true),
          S.vBool(CKA_VERIFY, true),
          S.vBytes(CKA_EC_PARAMS, Uint8Array.from(P256_OID)),
          S.vBytes(CKA_ID, id),
          S.vText(CKA_LABEL, `slot${s}-ec-${k}`),
        ]
        const prv = [
          S.vBool(CKA_TOKEN, true),
          S.vBool(CKA_PRIVATE, true),
          S.vBool(CKA_SIGN, true),
          S.vBytes(CKA_ID, id),
          S.vText(CKA_LABEL, `slot${s}-ec-${k}`),
        ]
        const phPub = S.u32(0)
        const phPrv = S.u32(0)
        S.must('C_GenerateKeyPair', `h=${h}, CKM_EC_KEY_PAIR_GEN P-256, CKA_ID=${hexOf(id)}`, () =>
          E._C_GenerateKeyPair(
            h,
            mech,
            S.template(pub),
            pub.length,
            S.template(prv),
            prv.length,
            phPub,
            phPrv
          )
        )
      }
      S.must('C_Logout', `h=${h}`, () => E._C_Logout(h))
      S.must('C_CloseSession', `h=${h}`, () => E._C_CloseSession(h))
      slots.push(slot)
    }
    S.must('C_Finalize', 'NULL', () => E._C_Finalize(0))
    return {
      calls: S.calls,
      slots,
      certsPerSlot: FIXTURE.certsPerSlot,
      keyPairsPerSlot: FIXTURE.keyPairsPerSlot,
    }
  } finally {
    S.release()
  }
}

const certClassTemplate = (S: Session): number => S.template([S.vUlong(CKA_CLASS, CKO_CERTIFICATE)])

const decodeRow = (
  S: Session,
  slot: number,
  handle: number,
  rv: number,
  t: number,
  bufs: [number, number, number]
): CertRow => {
  const len = (i: number) => S.read32(t + i * 12 + 8)
  const val = (i: number) => {
    const l = len(i)
    // No buffer was supplied for an attribute the length query reported
    // unavailable — nothing to read back.
    return l === CK_UNAVAILABLE_INFORMATION || bufs[i] === 0 ? null : S.bytes(bufs[i], l)
  }
  const label = val(0)
  const subject = val(1)
  const id = val(2)
  return {
    slot,
    handle,
    rv,
    label: label ? new TextDecoder().decode(label) : '<unavailable>',
    subject: subject ? (subject.length ? nameToString(subject) : '') : '<unavailable>',
    id: id ? hexOf(id) : '<unavailable>',
  }
}

// ── 2. the short flow ──────────────────────────────────────────────────────
export const runShortFlow = (E: DiscoveryEngine): FlowResult => {
  const S = new Session(E)
  try {
    S.must('C_Initialize', 'NULL', () => E._C_Initialize(0))
    const slots = getSlots(S, E, false)
    const rows: CertRow[] = []
    for (const slot of slots) {
      const h = openSession(S, E, slot, false)
      S.must('C_FindObjectsInit', `h=${h}, {CKA_CLASS=CKO_CERTIFICATE}`, () =>
        E._C_FindObjectsInit(h, certClassTemplate(S), 1)
      )
      const MAX = 256
      const objs = S.alloc(MAX * 4)
      const pN = S.u32(0)
      S.must('C_FindObjects', `h=${h}, ulMaxObjectCount=${MAX}`, () =>
        E._C_FindObjects(h, objs, MAX, pN)
      )
      const n = S.read32(pN)
      for (let j = 0; j < n; j++) {
        const obj = S.read32(objs + j * 4)
        const bufs: [number, number, number] = [S.alloc(128), S.alloc(512), S.alloc(64)]
        const t = S.template([
          [CKA_LABEL, bufs[0], 128],
          [CKA_SUBJECT, bufs[1], 512],
          [CKA_ID, bufs[2], 64],
        ])
        const rv = S.call(
          'C_GetAttributeValue',
          `h=${h}, obj=${obj}, {LABEL[128], SUBJECT[512], ID[64]}`,
          () => E._C_GetAttributeValue(h, obj, t, 3)
        )
        rows.push(decodeRow(S, slot, obj, rv, t, bufs))
      }
    }
    // C_Finalize closes every session and its active search (§5.4.2).
    S.must('C_Finalize', 'NULL', () => E._C_Finalize(0))
    return { calls: S.calls, counts: countsOf(S.calls), rows, slots, skipped: [] }
  } finally {
    S.release()
  }
}

// ── 3. the long flow ───────────────────────────────────────────────────────
export const runLongFlow = (E: DiscoveryEngine): FlowResult => {
  const S = new Session(E)
  try {
    S.must('C_Initialize', 'NULL', () => E._C_Initialize(0))
    const slots = getSlots(S, E, true)
    const rows: CertRow[] = []
    const skipped: number[] = []
    for (const slot of slots) {
      if (!(tokenInfo(S, E, slot).flags & CKF_TOKEN_INITIALIZED)) {
        skipped.push(slot)
        continue
      }
      const h = openSession(S, E, slot, false)
      S.must('C_FindObjectsInit', `h=${h}, {CKA_CLASS=CKO_CERTIFICATE}`, () =>
        E._C_FindObjectsInit(h, certClassTemplate(S), 1)
      )
      const handles: number[] = []
      const batch = S.alloc(LONG_FLOW_BATCH * 4)
      const pN = S.u32(0)
      for (;;) {
        S.must('C_FindObjects', `h=${h}, ulMaxObjectCount=${LONG_FLOW_BATCH}`, () =>
          E._C_FindObjects(h, batch, LONG_FLOW_BATCH, pN)
        )
        const n = S.read32(pN)
        if (n === 0) break
        for (let j = 0; j < n; j++) handles.push(S.read32(batch + j * 4))
      }
      for (const obj of handles) {
        const q = S.template([
          [CKA_LABEL, 0, 0],
          [CKA_SUBJECT, 0, 0],
          [CKA_ID, 0, 0],
        ])
        S.call(
          'C_GetAttributeValue',
          `h=${h}, obj=${obj}, {LABEL, SUBJECT, ID} pValue=NULL (lengths)`,
          () => E._C_GetAttributeValue(h, obj, q, 3)
        )
        const lens = [0, 1, 2].map((i) => S.read32(q + i * 12 + 8))
        const bufs = lens.map((l) => (l === CK_UNAVAILABLE_INFORMATION ? 0 : S.alloc(l))) as [
          number,
          number,
          number,
        ]
        const t = S.template([
          [CKA_LABEL, bufs[0], bufs[0] ? lens[0] : 0],
          [CKA_SUBJECT, bufs[1], bufs[1] ? lens[1] : 0],
          [CKA_ID, bufs[2], bufs[2] ? lens[2] : 0],
        ])
        const rv = S.call(
          'C_GetAttributeValue',
          `h=${h}, obj=${obj}, {LABEL[${lens[0]}], SUBJECT[${lens[1]}], ID[${lens[2]}]}`,
          () => E._C_GetAttributeValue(h, obj, t, 3)
        )
        rows.push(decodeRow(S, slot, obj, rv, t, bufs))
      }
      S.must('C_CloseSession', `h=${h}`, () => E._C_CloseSession(h))
    }
    S.must('C_Finalize', 'NULL', () => E._C_Finalize(0))
    return { calls: S.calls, counts: countsOf(S.calls), rows, slots, skipped }
  } finally {
    S.release()
  }
}
