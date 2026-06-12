// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
//
// TLS 1.3 simulation combination matrix — runs the SHIPPED public/wasm/openssl.wasm
// through execute_tls_simulation (the same entry point the workshop UI calls) and
// asserts on the trace: negotiated cipher suite, key-exchange group, signature
// algorithm, keylog secrets (the "Derived Session Secrets" panel), and the
// per-message handshake log. This is the automated form of the manual
// verification matrix in tasks/implementation-plans/tls-workshop-sim-gaps.md.
import { describe, it, expect, beforeAll } from 'vitest'
import { createRequire } from 'module'
import path from 'path'
import fs from 'fs'
import os from 'os'
import {
  DEFAULT_SERVER_CERT,
  DEFAULT_SERVER_KEY,
  DEFAULT_ROOT_CA,
  DEFAULT_MLDSA_SERVER_CERT,
  DEFAULT_MLDSA_SERVER_KEY,
  DEFAULT_MLDSA_ROOT_CA,
  DEFAULT_MLDSA87_SERVER_CERT,
  DEFAULT_MLDSA87_SERVER_KEY,
  DEFAULT_MLDSA87_ROOT_CA,
} from '@/components/PKILearning/modules/TLSBasics/utils/defaultCertificates'

interface TraceEvent {
  side: string
  event: string
  details: string
}
interface SimResult {
  trace: TraceEvent[]
  status: string
  error?: string
}

/* eslint-disable @typescript-eslint/no-explicit-any */
let mod: any
let exec: (c: string, s: string, cmd: string) => string

const WASM_DIR = path.join(process.cwd(), 'public', 'wasm')

interface SimOptions {
  clientGroups: string
  serverGroups: string
  ciphers?: string
  cert?: { crt: string; key: string; ca: string }
}

function makeConf(groups: string, ciphers?: string): string {
  return [
    'openssl_conf = default_conf',
    '',
    '[ default_conf ]',
    'ssl_conf = ssl_sect',
    '',
    '[ ssl_sect ]',
    'system_default = system_default_sect',
    '',
    '[ system_default_sect ]',
    ...(ciphers ? [`Ciphersuites = ${ciphers}`] : []),
    `Groups = ${groups}`,
    'MinProtocol = TLSv1.3',
    'MaxProtocol = TLSv1.3',
    '',
  ].join('\n')
}

function runSim(opts: SimOptions): SimResult {
  const cert = opts.cert ?? {
    crt: DEFAULT_SERVER_CERT,
    key: DEFAULT_SERVER_KEY,
    ca: DEFAULT_ROOT_CA,
  }
  const write = (p: string, c: string) => mod.FS.writeFile(p, c)
  write('/ssl/client.cnf', makeConf(opts.clientGroups, opts.ciphers))
  write('/ssl/server.cnf', makeConf(opts.serverGroups, opts.ciphers))
  write('/ssl/server.crt', cert.crt.trim() + '\n')
  write('/ssl/server.key', cert.key.trim() + '\n')
  write('/ssl/client-ca.crt', cert.ca.trim() + '\n')
  write('/ssl/commands.txt', 'CLIENT_SEND: ping\nSERVER_SEND: pong\nCLIENT_DISCONNECT\n')
  return JSON.parse(exec('/ssl/client.cnf', '/ssl/server.cnf', '/ssl/commands.txt')) as SimResult
}

const find = (r: SimResult, event: string) => r.trace.filter((e) => e.event === event)
const detail = (r: SimResult, event: string) => find(r, event)[0]?.details ?? ''
const handshakeMsgs = (r: SimResult) => find(r, 'handshake_msg').map((e) => e.details.split(' ')[0])

beforeAll(async () => {
  // The repo's package.json declares "type": "module", which makes node treat
  // public/wasm/openssl.js as ESM and the Emscripten UMD export never fires.
  // Copy the glue as .cjs (forcing CommonJS) next to the .wasm in a temp dir.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tls-sim-wasm-'))
  fs.copyFileSync(path.join(WASM_DIR, 'openssl.js'), path.join(tmp, 'openssl.cjs'))
  fs.copyFileSync(path.join(WASM_DIR, 'openssl.wasm'), path.join(tmp, 'openssl.wasm'))
  const require = createRequire(import.meta.url)
  const factory = require(path.join(tmp, 'openssl.cjs'))
  mod = await factory({ print: () => {}, printErr: () => {} })
  try {
    mod.FS.mkdir('/ssl')
  } catch {
    /* already exists on re-init */
  }
  exec = mod.cwrap('execute_tls_simulation', 'string', ['string', 'string', 'string'])
}, 60_000)

// ── Key exchange groups ──────────────────────────────────────────────────────
// Every group the UI offers, spelled exactly as configGenerator emits it.
// `negotiated` is the name SSL_group_to_name reports back.
const GROUPS: { config: string; negotiated: string; kind: string }[] = [
  { config: 'X25519', negotiated: 'x25519', kind: 'classical' },
  { config: 'P-256', negotiated: 'secp256r1', kind: 'classical' },
  { config: 'P-384', negotiated: 'secp384r1', kind: 'classical' },
  { config: 'P-521', negotiated: 'secp521r1', kind: 'classical' },
  { config: 'MLKEM512', negotiated: 'MLKEM512', kind: 'pqc' },
  { config: 'MLKEM768', negotiated: 'MLKEM768', kind: 'pqc' },
  { config: 'MLKEM1024', negotiated: 'MLKEM1024', kind: 'pqc' },
  { config: 'X25519MLKEM768', negotiated: 'X25519MLKEM768', kind: 'hybrid' },
  { config: 'SecP256r1MLKEM768', negotiated: 'SecP256r1MLKEM768', kind: 'hybrid' },
  { config: 'SecP384r1MLKEM1024', negotiated: 'SecP384r1MLKEM1024', kind: 'hybrid' },
]

describe('key exchange group matrix', () => {
  it.each(GROUPS)('$kind $config negotiates $negotiated', ({ config, negotiated }) => {
    const r = runSim({ clientGroups: config, serverGroups: config })
    expect(r.status).toBe('success')
    expect(detail(r, 'key_exchange')).toBe(`Key Exchange: ${negotiated}`)
    expect(find(r, 'error')).toHaveLength(0)
    // 1-RTT: same single group on both sides never triggers HRR
    expect(detail(r, 'round_trips')).toBe('1')
  })
})

// ── Cipher suites ────────────────────────────────────────────────────────────
// Every suite the UI offers. TLS_AES_128_CCM_8_SHA256 is NOT offered (and
// asserted separately below): OpenSSL rejects its 64-bit auth tag at the
// default security level, so it can never negotiate in this build.
const CIPHER_SUITES = [
  'TLS_AES_256_GCM_SHA384',
  'TLS_AES_128_GCM_SHA256',
  'TLS_CHACHA20_POLY1305_SHA256',
  'TLS_AES_128_CCM_SHA256',
]

describe('cipher suite matrix', () => {
  it.each(CIPHER_SUITES.map((c) => ({ cipher: c })))('negotiates $cipher', ({ cipher }) => {
    const r = runSim({
      clientGroups: 'X25519MLKEM768',
      serverGroups: 'X25519MLKEM768',
      ciphers: cipher,
    })
    expect(r.status).toBe('success')
    expect(detail(r, 'established')).toBe(`Negotiated: ${cipher}`)
  })

  it('TLS_AES_128_CCM_8_SHA256 fails loudly at the default security level', () => {
    const r = runSim({
      clientGroups: 'X25519',
      serverGroups: 'X25519',
      ciphers: 'TLS_AES_128_CCM_8_SHA256',
    })
    // If this ever starts succeeding (e.g. a future build lowers SECLEVEL),
    // re-add the suite to the UI panels' CIPHER_SUITES lists.
    expect(r.status).toBe('failed')
    const errors = find(r, 'error').map((e) => e.details)
    expect(errors.some((d) => d.includes('no ciphers available'))).toBe(true)
  })
})

// ── Certificate / signature algorithms ───────────────────────────────────────
const CERTS = [
  {
    name: 'RSA-2048',
    scheme: 'rsa_pss_rsae_sha256',
    cert: { crt: DEFAULT_SERVER_CERT, key: DEFAULT_SERVER_KEY, ca: DEFAULT_ROOT_CA },
  },
  {
    name: 'ML-DSA-44',
    scheme: 'mldsa44',
    cert: {
      crt: DEFAULT_MLDSA_SERVER_CERT,
      key: DEFAULT_MLDSA_SERVER_KEY,
      ca: DEFAULT_MLDSA_ROOT_CA,
    },
  },
  {
    name: 'ML-DSA-87',
    scheme: 'mldsa87',
    cert: {
      crt: DEFAULT_MLDSA87_SERVER_CERT,
      key: DEFAULT_MLDSA87_SERVER_KEY,
      ca: DEFAULT_MLDSA87_ROOT_CA,
    },
  },
]

describe('certificate signature matrix', () => {
  it.each(CERTS)('$name server cert yields $scheme CertificateVerify', ({ scheme, cert }) => {
    const r = runSim({
      clientGroups: 'X25519MLKEM768',
      serverGroups: 'X25519MLKEM768',
      cert,
    })
    expect(r.status).toBe('success')
    expect(detail(r, 'signature_algorithm')).toBe(`Peer Signature Algorithm: ${scheme}`)
  })
})

// ── Log completeness (what the workshop panels consume) ─────────────────────
describe('trace log completeness', () => {
  it('emits the full handshake message sequence and keylog secrets', () => {
    const r = runSim({ clientGroups: 'MLKEM768', serverGroups: 'MLKEM768' })
    const msgs = handshakeMsgs(r)
    for (const expected of [
      'ClientHello',
      'ServerHello',
      'EncryptedExtensions',
      'Certificate',
      'CertificateVerify',
      'Finished',
      'NewSessionTicket',
    ]) {
      expect(msgs, `missing ${expected} in handshake_msg trace`).toContain(expected)
    }

    // Keylog drives the "Derived Session Secrets" panel: both sides log
    // handshake + application traffic secrets.
    const keylogs = find(r, 'keylog')
    for (const side of ['client', 'server']) {
      const labels = keylogs.filter((e) => e.side === side).map((e) => e.details.split(' ')[0])
      expect(labels).toContain('CLIENT_HANDSHAKE_TRAFFIC_SECRET')
      expect(labels).toContain('SERVER_HANDSHAKE_TRAFFIC_SECRET')
      expect(labels).toContain('CLIENT_TRAFFIC_SECRET_0')
      expect(labels).toContain('SERVER_TRAFFIC_SECRET_0')
    }

    // Application data flows both ways
    const received = find(r, 'message_received').map((e) => e.details)
    expect(received.some((d) => d.includes('ping'))).toBe(true)
    expect(received.some((d) => d.includes('pong'))).toBe(true)
  })
})

// ── HelloRetryRequest ────────────────────────────────────────────────────────
describe('HelloRetryRequest', () => {
  it('detects HRR and reports 2-RTT when the server rejects the offered key share', () => {
    // Client sends a key share for its first group (P-256); server only
    // accepts X25519 → ServerHello is an HRR and the client retries.
    const r = runSim({ clientGroups: 'P-256:X25519', serverGroups: 'X25519' })
    expect(r.status).toBe('success')
    expect(find(r, 'hello_retry').length).toBeGreaterThan(0)
    expect(detail(r, 'round_trips')).toBe('2')
    expect(detail(r, 'key_exchange')).toBe('Key Exchange: x25519')
  })
})

// ── Misconfiguration is loud, not silent ─────────────────────────────────────
describe('invalid group names', () => {
  it('logs a visible error and falls back to OpenSSL defaults', () => {
    // The pre-fix UI spelling — exactly the bug this guards against
    const r = runSim({ clientGroups: 'ML-KEM-768', serverGroups: 'X25519MLKEM768:X25519' })
    expect(r.status).toBe('success')
    const errors = find(r, 'error').map((e) => e.details)
    expect(errors.some((d) => d.includes("Failed to set Groups 'ML-KEM-768'"))).toBe(true)
    // Defaults negotiate the hybrid — the UI must surface the error so this
    // is not mistaken for a pure-PQC run
    expect(detail(r, 'key_exchange')).toBe('Key Exchange: X25519MLKEM768')
  })
})
