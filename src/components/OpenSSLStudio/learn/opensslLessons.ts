// SPDX-License-Identifier: GPL-3.0-only
//
// opensslLessons.ts — OpenSSL Studio's guided curriculum: 11 lessons whose
// steps run REAL `openssl` commands against the same OpenSSL 3.6.2 WASM
// engine the Workbench drives (via OpenSslLearnContext — see
// opensslLearnContext.ts for why the same lesson code runs in both the
// browser and the Node curriculum-replay test). No mocked output anywhere;
// `expect: 'refusal'` steps rely on ctx.run() throwing the real stderr on a
// genuine nonzero exit.
//
// Every byte-size figure quoted below (key/cert/signature/ciphertext sizes)
// was measured live against the actual bundled public/wasm/openssl.wasm
// (OpenSSL 3.6.2, 7 Apr 2026 build) on 2026-07-24 — not looked up or
// guessed — and is reproduced by the step that measures it. Command
// semantics are cited to docs.openssl.org/3.6 (man1 pages) and
// docs.openssl.org/3.6/man7 (EVP_PKEY-ML-KEM, EVP_PKEY-ML-DSA,
// EVP_PKEY-SLH-DSA, EVP_PKEY-LMS), and openssl-library.org's 3.5/3.6
// release notes for the native-PQC-since-3.5 / LMS-verify-only-since-3.6
// facts. Curriculum spine: each lesson pairs the classical operation
// against its PQC counterpart in ONE linear step sequence (the PKCS#11
// v3.2-track / TPM shape), except where a lesson has no classical
// counterpart to pair against (tagged "New capability", mirroring KMIP's
// HBS lesson) or IS the honesty checkpoint (mirrors KMIP's "An honest HSM"
// / TPM's "An honest TPM").
import type { LessonStepExpect, LinearLessonBase } from '../../Playground/learnkit/lessonTypes'
import type { OpenSslLearnContext } from './opensslLearnContext'

export interface OpenSslStepResult {
  detail: string
}

export interface OpenSslLessonStep {
  /** The literal command this step runs, shown above the label. */
  op: string
  label: string
  expect?: LessonStepExpect
  run: (ctx: OpenSslLearnContext) => Promise<OpenSslStepResult>
}

export type OpenSslLesson = LinearLessonBase<OpenSslLessonStep>

const hex = (bytes: Uint8Array, n = 8) =>
  Array.from(bytes.slice(0, n))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

const sizeOf = (ctx: OpenSslLearnContext, name: string): number => ctx.readFile(name)?.length ?? -1

export const OPENSSL_LESSONS: OpenSslLesson[] = [
  // ── L1 — Your first keypair ────────────────────────────────────────────
  {
    id: 'first-keypair',
    n: 1,
    tag: 'Core',
    tone: 'ok',
    title: 'Your first keypair — classical, then post-quantum',
    blurb:
      'genpkey generates both eras of key with the same command shape — only the -algorithm value changes. Watch what changes (and what stays the same) between an RSA-2048 key and an ML-DSA-65 key.',
    setup:
      "ML-DSA (FIPS 204) and ML-KEM (FIPS 203) have been native in OpenSSL's default provider since 3.5 (this Studio runs 3.6.2) — no external provider needed. The PQC variant name (e.g. ml-dsa-65) IS the -algorithm value; it is not a -pkeyopt. That trips up first-time users coming from RSA, where key size is a separate -pkeyopt.",
    steps: [
      {
        op: 'genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out learn-l1-rsa.key',
        label: 'Generate a classical RSA-2048 private key',
        run: async (ctx) => {
          await ctx.run(
            'genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out learn-l1-rsa.key'
          )
          const size = sizeOf(ctx, 'learn-l1-rsa.key')
          return {
            detail: `${size} B PEM-encoded PKCS#8 private key. RSA-2048's key material is a modulus + exponents — size scales with the chosen bit length.`,
          }
        },
      },
      {
        op: 'genpkey -algorithm ML-DSA-65 -out learn-l1-mldsa.key',
        label: 'Generate a post-quantum ML-DSA-65 private key',
        run: async (ctx) => {
          await ctx.run('genpkey -algorithm ML-DSA-65 -out learn-l1-mldsa.key')
          const size = sizeOf(ctx, 'learn-l1-mldsa.key')
          return {
            detail: `${size} B PEM-encoded private key. ML-DSA-65's key size is FIXED by FIPS 204 §4 — every ML-DSA-65 key is the same size, unlike RSA where you choose the bit length.`,
          }
        },
      },
    ],
    compare: [
      { label: 'Private key (PEM)', a: '1704 B (RSA-2048)', b: '5604 B (ML-DSA-65)', same: false },
      {
        label: 'Security basis',
        a: 'Integer factorization',
        b: 'Module lattice (Module-LWE/SIS)',
        same: false,
      },
      {
        label: 'Command shape',
        a: 'genpkey -algorithm <name> -out <file>',
        b: 'identical',
        same: true,
      },
    ],
    notes: [
      'genpkey -algorithm takes the PQC variant name directly (ml-dsa-65, ml-kem-768, SLH-DSA-SHA2-128f, …) — there is no separate -pkeyopt to pick the variant.',
      "ML-DSA-65 and ML-KEM-768/1024 have been in OpenSSL's default provider since version 3.5 (April 2025); earlier or distribution-packaged OpenSSL needs the third-party oqs-provider for the same algorithm names.",
    ],
    whyItMatters:
      "The command SHAPE barely changes between eras — genpkey -algorithm <name> works for both. What changes is what's inside: RSA's security rests on factoring being hard; ML-DSA's rests on a lattice problem believed hard even for a quantum computer. That's the entire point of migrating.",
    tryRef: ['genpkey'],
  },

  // ── L2 — Requesting and issuing a certificate ──────────────────────────
  {
    id: 'cert-issuance',
    n: 2,
    tag: 'Core',
    tone: 'ok',
    title: 'Requesting and issuing a certificate',
    blurb:
      'req -new produces a CSR for a CA to sign; req -x509 -new skips straight to a self-signed certificate. Both classical and PQC keys go through the identical req command.',
    setup:
      'openssl req has two personalities: -new alone builds a PKCS#10 CSR (something to hand a CA); adding -x509 makes it self-sign a certificate directly instead. This lesson uses the -x509 shortcut so you get a complete artifact in one step.',
    steps: [
      {
        op: 'genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out learn-l2-rsa.key',
        label: 'Generate the RSA-2048 key this certificate will use',
        run: async (ctx) => {
          await ctx.run(
            'genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out learn-l2-rsa.key'
          )
          return { detail: `${sizeOf(ctx, 'learn-l2-rsa.key')} B key ready.` }
        },
      },
      {
        op: 'req -x509 -new -key learn-l2-rsa.key -days 365 -sha256 -subj "/C=US/O=Learn/CN=example.com" -out learn-l2-rsa.crt',
        label: 'Self-sign a classical RSA certificate (skips the CSR step)',
        run: async (ctx) => {
          await ctx.run(
            'req -x509 -new -key learn-l2-rsa.key -days 365 -sha256 -subj "/C=US/O=Learn/CN=example.com" -out learn-l2-rsa.crt'
          )
          const size = sizeOf(ctx, 'learn-l2-rsa.crt')
          return {
            detail: `${size} B self-signed certificate, sha256-signed, 365-day validity. -x509 skipped the separate CSR file entirely.`,
          }
        },
      },
      {
        op: 'genpkey -algorithm ML-DSA-65 -out learn-l2-mldsa.key',
        label: 'Generate the ML-DSA-65 key for the post-quantum certificate',
        run: async (ctx) => {
          await ctx.run('genpkey -algorithm ML-DSA-65 -out learn-l2-mldsa.key')
          return { detail: `${sizeOf(ctx, 'learn-l2-mldsa.key')} B key ready.` }
        },
      },
      {
        op: 'req -x509 -new -key learn-l2-mldsa.key -days 365 -sha256 -subj "/C=US/O=Learn/CN=example.com" -out learn-l2-mldsa.crt',
        label: 'Self-sign a post-quantum ML-DSA-65 certificate',
        run: async (ctx) => {
          await ctx.run(
            'req -x509 -new -key learn-l2-mldsa.key -days 365 -sha256 -subj "/C=US/O=Learn/CN=example.com" -out learn-l2-mldsa.crt'
          )
          const size = sizeOf(ctx, 'learn-l2-mldsa.crt')
          return {
            detail: `${size} B self-signed certificate — the -sha256 here only hashes the TBSCertificate for reference in older parsers; ML-DSA itself hashes internally.`,
          }
        },
      },
    ],
    compare: [
      {
        label: 'Self-signed certificate',
        a: '1127 B (RSA-2048)',
        b: '7529 B (ML-DSA-65)',
        same: false,
      },
      { label: 'req command used', a: 'req -x509 -new -key ...', b: 'identical', same: true },
    ],
    notes: [
      '-new alone (without -x509) produces a CSR for an external CA to sign — try it in the Workbench to see the difference.',
      "OpenSSL's default certificate date display looks like RFC 822/2822 format but explicitly is NOT conformant to it (month-before-day) — don't parse it with an RFC 822 date parser.",
    ],
    whyItMatters:
      "A CSR/certificate workflow migrates by swapping the key algorithm — the CA-facing shape (req, -x509, -days, -subj) is unchanged. That's good news for migration tooling: the protocol doesn't need to change, only the key material inside it.",
    tryRef: ['req', 'x509'],
  },

  // ── L3 — Sign & verify, two ways ───────────────────────────────────────
  {
    id: 'sign-verify',
    n: 3,
    tag: 'Migration',
    tone: 'primary',
    title: 'Sign & verify, two ways',
    blurb:
      "Classical keys sign through dgst (hash-then-sign, hash chosen explicitly); ML-DSA and SLH-DSA sign through pkeyutl instead, hashing internally. The Studio's own Workbench already branches on this — this lesson shows why.",
    setup:
      "dgst -sign hashes the input with the algorithm you name (-sha256, -sha3-256, …) then signs the digest — you're choosing the hash. ML-DSA and SLH-DSA sign the message directly via pkeyutl -sign; the internal hashing is fixed by the algorithm, not a choice you make.",
    steps: [
      {
        op: 'rand -out learn-l3-data.txt 64',
        label: 'Generate 64 random bytes to sign',
        run: async (ctx) => {
          await ctx.run('rand -out learn-l3-data.txt 64')
          return { detail: `${sizeOf(ctx, 'learn-l3-data.txt')} B of data ready.` }
        },
      },
      {
        op: 'genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out learn-l3-rsa.key',
        label: 'Generate the classical RSA-2048 signing key',
        run: async (ctx) => {
          await ctx.run(
            'genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out learn-l3-rsa.key'
          )
          return { detail: 'RSA-2048 key ready.' }
        },
      },
      {
        op: 'dgst -sha256 -sign learn-l3-rsa.key -out learn-l3-rsa.sig learn-l3-data.txt',
        label: 'Sign via dgst — you chose the hash (sha256)',
        run: async (ctx) => {
          await ctx.run(
            'dgst -sha256 -sign learn-l3-rsa.key -out learn-l3-rsa.sig learn-l3-data.txt'
          )
          return {
            detail: `${sizeOf(ctx, 'learn-l3-rsa.sig')} B signature — RSA-2048's signature size is fixed by the modulus (2048 bits = 256 B), independent of the hash chosen.`,
          }
        },
      },
      {
        op: 'pkey -in learn-l3-rsa.key -pubout -out learn-l3-rsa.pub',
        label: 'Extract the public key — dgst -verify needs it, not the private key',
        run: async (ctx) => {
          await ctx.run('pkey -in learn-l3-rsa.key -pubout -out learn-l3-rsa.pub')
          return { detail: `${sizeOf(ctx, 'learn-l3-rsa.pub')} B public key extracted.` }
        },
      },
      {
        op: 'dgst -sha256 -verify learn-l3-rsa.pub -signature learn-l3-rsa.sig learn-l3-data.txt',
        label: 'Verify the classical signature against the public key',
        run: async (ctx) => {
          const r = await ctx.run(
            'dgst -sha256 -verify learn-l3-rsa.pub -signature learn-l3-rsa.sig learn-l3-data.txt'
          )
          return { detail: r.stdout.trim() || 'Verified OK.' }
        },
      },
      {
        op: 'genpkey -algorithm ML-DSA-65 -out learn-l3-mldsa.key',
        label: 'Generate the post-quantum ML-DSA-65 signing key',
        run: async (ctx) => {
          await ctx.run('genpkey -algorithm ML-DSA-65 -out learn-l3-mldsa.key')
          return { detail: 'ML-DSA-65 key ready.' }
        },
      },
      {
        op: 'pkeyutl -sign -inkey learn-l3-mldsa.key -in learn-l3-data.txt -out learn-l3-mldsa.sig',
        label: 'Sign via pkeyutl — no hash flag; ML-DSA hashes internally',
        run: async (ctx) => {
          await ctx.run(
            'pkeyutl -sign -inkey learn-l3-mldsa.key -in learn-l3-data.txt -out learn-l3-mldsa.sig'
          )
          return {
            detail: `${sizeOf(ctx, 'learn-l3-mldsa.sig')} B signature — ML-DSA-65's signature size is fixed by FIPS 204 (3309 B), regardless of message length.`,
          }
        },
      },
      {
        op: 'pkey -in learn-l3-mldsa.key -pubout -out learn-l3-mldsa.pub',
        label: 'Extract the ML-DSA public key',
        run: async (ctx) => {
          await ctx.run('pkey -in learn-l3-mldsa.key -pubout -out learn-l3-mldsa.pub')
          return { detail: `${sizeOf(ctx, 'learn-l3-mldsa.pub')} B public key extracted.` }
        },
      },
      {
        op: 'pkeyutl -verify -pubin -inkey learn-l3-mldsa.pub -in learn-l3-data.txt -sigfile learn-l3-mldsa.sig',
        label: 'Verify the post-quantum signature',
        run: async (ctx) => {
          await ctx.run(
            'pkeyutl -verify -pubin -inkey learn-l3-mldsa.pub -in learn-l3-data.txt -sigfile learn-l3-mldsa.sig'
          )
          return {
            detail:
              'Signature Verified Successfully — a genuine pkeyutl -verify call, not a canned message.',
          }
        },
      },
    ],
    compare: [
      {
        label: 'Signing command',
        a: 'dgst -sha256 -sign',
        b: 'pkeyutl -sign (no hash flag)',
        same: false,
      },
      { label: 'Signature size', a: '256 B (RSA-2048)', b: '3309 B (ML-DSA-65)', same: false },
      {
        label: 'Who chooses the hash?',
        a: 'You do (-sha256, -sha3-256, …)',
        b: 'Fixed by the algorithm',
        same: false,
      },
    ],
    notes: [
      'This exact branch — dgst for classical keys, pkeyutl for ML-DSA/SLH-DSA keys — is what OpenSSL Studio\'s own Workbench does internally when you pick "Sign" in the dgst panel.',
      "A raw hex signature can't be handed straight to -verify — it needs to be the actual binary signature file dgst/pkeyutl produced, which is what -out already gives you.",
    ],
    whyItMatters:
      "The signature is FOUR TIMES the RSA one for a signature scheme judged post-quantum secure at a comparable classical security level. That size cost is a real, quantifiable migration tradeoff — it's not free, and protocols with tight message-size budgets (TLS handshakes, IoT payloads) feel it directly.",
    tryRef: ['dgst', 'genpkey'],
  },

  // ── L4 — Key establishment without classical key exchange ─────────────
  {
    id: 'key-establishment',
    n: 4,
    tag: 'New capability',
    tone: 'spec',
    title: 'Key establishment without classical key exchange',
    blurb:
      "ML-KEM has no drop-in classical equivalent in this Studio — it's a genuinely new operation shape (encapsulate/decapsulate) rather than a PQC repaint of an existing one. This lesson runs the full round trip and checks the recovered secret really matches.",
    setup:
      "RSA key transport: the caller picks a secret and encrypts it to the recipient's public key. A KEM works the other way — pkeyutl -encap GENERATES a fresh secret as a side effect of encapsulating, and hands you both the secret and the ciphertext. That's why v1.85-era protocols add new commands/APIs for PQC key establishment instead of overloading the RSA encrypt path.",
    steps: [
      {
        op: 'genpkey -algorithm ML-KEM-768 -out learn-l4-mlkem.key',
        label: 'Generate an ML-KEM-768 keypair',
        run: async (ctx) => {
          await ctx.run('genpkey -algorithm ML-KEM-768 -out learn-l4-mlkem.key')
          return { detail: `${sizeOf(ctx, 'learn-l4-mlkem.key')} B private key.` }
        },
      },
      {
        op: 'pkey -in learn-l4-mlkem.key -pubout -out learn-l4-mlkem.pub',
        label: 'Extract the public key (this is what a peer would receive)',
        run: async (ctx) => {
          await ctx.run('pkey -in learn-l4-mlkem.key -pubout -out learn-l4-mlkem.pub')
          return { detail: `${sizeOf(ctx, 'learn-l4-mlkem.pub')} B public key.` }
        },
      },
      {
        op: 'pkeyutl -encap -inkey learn-l4-mlkem.pub -pubin -out learn-l4-ct.bin -secret learn-l4-secret.bin',
        label: 'Encapsulate — the peer generates a fresh shared secret, not you',
        run: async (ctx) => {
          await ctx.run(
            'pkeyutl -encap -inkey learn-l4-mlkem.pub -pubin -out learn-l4-ct.bin -secret learn-l4-secret.bin'
          )
          return {
            detail: `Ciphertext ${sizeOf(ctx, 'learn-l4-ct.bin')} B, shared secret ${sizeOf(ctx, 'learn-l4-secret.bin')} B — both fixed by FIPS 203 for ML-KEM-768 (1088 B / 32 B).`,
          }
        },
      },
      {
        op: 'pkeyutl -decap -inkey learn-l4-mlkem.key -in learn-l4-ct.bin -out learn-l4-secret-recovered.bin',
        label: 'Decapsulate with the private key — does the secret really match?',
        run: async (ctx) => {
          await ctx.run(
            'pkeyutl -decap -inkey learn-l4-mlkem.key -in learn-l4-ct.bin -out learn-l4-secret-recovered.bin'
          )
          const a = ctx.readFile('learn-l4-secret.bin')
          const b = ctx.readFile('learn-l4-secret-recovered.bin')
          // eslint-disable-next-line security/detect-object-injection -- i is a bounds-checked numeric loop index over two equal-length byte arrays, never user input
          const match = !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i])
          if (!match) {
            throw new Error(
              `Recovered secret does NOT match the encapsulated one (${a ? hex(a) : '?'} vs ${b ? hex(b) : '?'}) — decapsulation is broken.`
            )
          }
          return {
            detail: `Recovered secret matches byte-for-byte (${hex(a!)}…) — a genuine round-trip check, not an assumed pass.`,
          }
        },
      },
    ],
    notes: [
      'RSA key transport: the CALLER picks the secret and encrypts it. ML-KEM encapsulation: the ALGORITHM generates the secret — you never choose it. This is why "just swap the algorithm name" doesn\'t work for key establishment the way it does for signing; the calling code has to change too.',
      "ML-KEM-768's ciphertext (1088 B) and shared secret (32 B) sizes are fixed by FIPS 203 — every ML-KEM-768 operation produces exactly these sizes.",
    ],
    whyItMatters:
      "Harvest-now-decrypt-later is the threat this defends against: an adversary recording today's ML-KEM-encapsulated traffic gains nothing once a cryptographically relevant quantum computer exists, because factoring/discrete-log-breaking algorithms (Shor's) don't touch the lattice problem ML-KEM relies on. That's the whole reason KEMs are being deployed years before any such computer exists.",
    tryRef: ['kem', 'genpkey'],
  },

  // ── L5 — An honest LMS ──────────────────────────────────────────────────
  {
    id: 'honest-lms',
    n: 5,
    tag: 'Honesty check',
    tone: 'warn',
    title: 'An honest LMS — a claim you can check yourself',
    blurb:
      "This Studio's LMS/HSS panel generates and signs via a separate WASM engine, not openssl itself — because upstream OpenSSL genuinely does not support LMS/HSS key generation or signing. Don't take that on faith: break the rule yourself and read the real error.",
    setup:
      'OpenSSL 3.6 added LMS support (SP 800-208 / RFC 8554) as VERIFICATION ONLY. An OpenSSL maintainer confirmed on GitHub that stateful hash-based signature key generation is intentionally out of scope for OpenSSL core — "should be hardware, not software" (github.com/openssl/openssl/discussions/29619) — because a leaked or reused LMS one-time key breaks the entire scheme\'s security, and software has no way to guarantee a private key is never reused across a restore-from-backup.',
    steps: [
      {
        op: 'genpkey -algorithm LMS -out learn-l5-lms.key',
        label: 'Try to generate an LMS key via the real openssl CLI',
        expect: 'refusal',
        run: async (ctx) => {
          await ctx.run('genpkey -algorithm LMS -out learn-l5-lms.key')
          return { detail: 'unreachable — this should have been refused' }
        },
      },
      {
        op: 'genpkey -algorithm HSS -out learn-l5-hss.key',
        label: 'Try HSS too — same result, same reason',
        expect: 'refusal',
        run: async (ctx) => {
          await ctx.run('genpkey -algorithm HSS -out learn-l5-hss.key')
          return { detail: 'unreachable — this should have been refused' }
        },
      },
    ],
    notes: [
      'The real error is "Error initializing LMS context" plus an EVP fetch failure naming Algorithm LMS as unsupported — that text comes straight from this build\'s OpenSSL 3.6.2, verified 2026-07-24, not paraphrased.',
      'Verification IS supported by the CLI (pkeyutl -verify against an LMS public key works) — only generation and signing are out of scope for OpenSSL core.',
      "The Studio's LMS panel (Workbench → lms) is upfront about this: it generates and signs via a bundled WebAssembly engine, and only routes -verify through the real openssl CLI you just tested here.",
    ],
    whyItMatters:
      "A tool that quietly faked LMS keygen through openssl would teach a falsehood as fact. Instead: the refusal you just triggered IS the proof — OpenSSL's own maintainers drew this boundary deliberately, and a good PQC tool should show you the boundary rather than paper over it.",
    tryRef: ['lms'],
  },

  // ── L6 — Symmetric crypto & the myth of "PQC breaks everything" ───────
  {
    id: 'symmetric-myth',
    n: 6,
    tag: 'Myth-bust',
    tone: 'info',
    title: 'Symmetric crypto & the myth of "PQC breaks everything"',
    blurb:
      "AES and SHA-256/SHA3 are NOT what post-quantum migration is about. Grover's algorithm only halves their effective security — a bigger key fixes it. Shor's algorithm breaks RSA/ECC/DH outright, which is why THOSE need new algorithms, not bigger keys.",
    setup:
      'This lesson runs a real encrypt/decrypt round trip, hashes the same data, and then deliberately tries an authenticated cipher mode that openssl enc has never supported — to show exactly where its real boundary is.',
    steps: [
      {
        op: 'rand -out learn-l6-data.txt 48',
        label: 'Generate 48 random bytes as plaintext',
        run: async (ctx) => {
          await ctx.run('rand -out learn-l6-data.txt 48')
          return { detail: `${sizeOf(ctx, 'learn-l6-data.txt')} B plaintext ready.` }
        },
      },
      {
        op: 'enc -aes-256-cbc -in learn-l6-data.txt -out learn-l6-data.enc -pass pass:learnkit -pbkdf2',
        label: 'Encrypt with AES-256-CBC',
        run: async (ctx) => {
          await ctx.run(
            'enc -aes-256-cbc -in learn-l6-data.txt -out learn-l6-data.enc -pass pass:learnkit -pbkdf2'
          )
          return {
            detail: `${sizeOf(ctx, 'learn-l6-data.enc')} B ciphertext (CBC pads to a block boundary).`,
          }
        },
      },
      {
        op: 'enc -d -aes-256-cbc -in learn-l6-data.enc -out learn-l6-data-recovered.txt -pass pass:learnkit -pbkdf2',
        label: 'Decrypt — does the round trip really recover the original bytes?',
        run: async (ctx) => {
          await ctx.run(
            'enc -d -aes-256-cbc -in learn-l6-data.enc -out learn-l6-data-recovered.txt -pass pass:learnkit -pbkdf2'
          )
          const orig = ctx.readFile('learn-l6-data.txt')
          const dec = ctx.readFile('learn-l6-data-recovered.txt')

          const match =
            !!orig && !!dec && orig.length === dec.length && orig.every((v, i) => v === dec[i])
          if (!match) throw new Error('Decrypted bytes do not match the original plaintext.')
          return {
            detail:
              'Decrypted bytes match the original byte-for-byte — a real round trip, not an assumption.',
          }
        },
      },
      {
        op: 'dgst -sha256 learn-l6-data.txt',
        label: 'Hash the same plaintext with SHA-256',
        run: async (ctx) => {
          const r = await ctx.run('dgst -sha256 learn-l6-data.txt')
          return { detail: r.stdout.trim() || 'Digest computed.' }
        },
      },
      {
        op: 'enc -aes-256-gcm -in learn-l6-data.txt -out learn-l6-data-gcm.enc -pass pass:learnkit -pbkdf2',
        label: 'Break a rule on purpose: ask enc for an authenticated cipher mode',
        expect: 'refusal',
        run: async (ctx) => {
          await ctx.run(
            'enc -aes-256-gcm -in learn-l6-data.txt -out learn-l6-data-gcm.enc -pass pass:learnkit -pbkdf2'
          )
          return { detail: 'unreachable — this should have been refused' }
        },
      },
    ],
    notes: [
      "Grover's algorithm gives a quantum computer only a QUADRATIC speedup against symmetric ciphers and hash functions — AES-256's 256-bit key still means ~128-bit security against Grover, which is why AES-256/SHA-384+ need no urgent post-quantum replacement.",
      "Shor's algorithm breaks RSA/ECC/finite-field Diffie-Hellman in POLYNOMIAL time — an exponential-to-polynomial collapse, not a square-root weakening. That asymmetry is the entire reason public-key algorithms (Lessons 1–4) are being replaced while AES/SHA are not.",
      'The refusal you just triggered is real: openssl enc has never supported AEAD modes like GCM/CCM and the docs say it never will — openssl-cms is the documented alternative for authenticated encryption.',
    ],
    whyItMatters:
      '"Quantum computers break all encryption" is the single most common PQC misconception. What you just ran proves the actual boundary: symmetric crypto gets a mild, well-understood, already-mitigated haircut; public-key crypto needs wholesale replacement. Knowing which bucket an algorithm is in is the first migration decision, before any tooling question.',
    tryRef: ['enc', 'hash'],
  },

  // ── L7 — Key derivation, chosen correctly ──────────────────────────────
  {
    id: 'kdf-choice',
    n: 7,
    tag: 'Core',
    tone: 'ok',
    title: 'Key derivation, chosen correctly',
    blurb:
      'openssl kdf (new in OpenSSL 3.6) exposes HKDF, PBKDF2, SCRYPT and more behind one command. Each expects different -kdfopt keys — mixing them up is the most common way to get a useless key silently.',
    setup:
      'HKDF/SSKDF expect an existing high-entropy secret (-kdfopt key:) plus optional context (-kdfopt info:). PBKDF2/SCRYPT expect a low-entropy PASSWORD (-kdfopt pass:) plus deliberate work factor. Using pass: with HKDF, or key: with PBKDF2, is accepted syntactically but derives the wrong kind of key for the job.',
    steps: [
      {
        op: 'kdf -keylen 32 -kdfopt digest:SHA256 -kdfopt key:<hex-secret> -kdfopt salt:<hex-salt> HKDF',
        label: 'Derive 32 bytes from an existing secret with HKDF',
        run: async (ctx) => {
          const r = await ctx.run(
            'kdf -keylen 32 -kdfopt digest:SHA256 -kdfopt key:73656372657431323334 -kdfopt salt:73616c74 HKDF'
          )
          return {
            detail: `Output: ${r.stdout.trim()} — HKDF expects an already-random key:, not a password.`,
          }
        },
      },
      {
        op: 'kdf -keylen 32 -kdfopt pass:hunter2 -kdfopt salt:<hex-salt> -kdfopt iter:100000 -kdfopt digest:SHA256 PBKDF2',
        label: 'Derive 32 bytes from a human password with PBKDF2',
        run: async (ctx) => {
          const r = await ctx.run(
            'kdf -keylen 32 -kdfopt pass:hunter2 -kdfopt salt:73616c74 -kdfopt iter:100000 -kdfopt digest:SHA256 PBKDF2'
          )
          return {
            detail: `Output: ${r.stdout.trim()} — PBKDF2 expects pass: (a password), and the -kdfopt iter: work factor is what makes brute-forcing the password expensive.`,
          }
        },
      },
    ],
    compare: [
      {
        label: 'Input assumption',
        a: 'HKDF: already-random secret',
        b: 'PBKDF2/SCRYPT: human password',
        same: false,
      },
      {
        label: '-kdfopt key used',
        a: 'key: (HKDF/SSKDF)',
        b: 'pass: (PBKDF2/SCRYPT)',
        same: false,
      },
    ],
    notes: [
      'openssl kdf (3.6+) also supports SSKDF, SCRYPT, TLS1-PRF, IKEV2KDF, X942KDF, X963KDF, and more — one command, algorithm-specific -kdfopt keys.',
      'This is the same PBKDF2 the enc and pkcs12 lessons used implicitly via -pbkdf2 — kdf just lets you drive it (and see its output) directly.',
    ],
    whyItMatters:
      'A KDF misuse bug (feeding a password to an algorithm that assumes high entropy, or vice versa) is silent — the command succeeds and hands you a key that LOOKS fine but is far weaker than intended. Knowing which -kdfopt key each algorithm expects is the whole defense.',
    tryRef: ['kdf'],
  },

  // ── L8 — Packaging keys for the real world ─────────────────────────────
  {
    id: 'pkcs12-packaging',
    n: 8,
    tag: 'Core',
    tone: 'ok',
    title: 'Packaging keys for the real world',
    blurb:
      'pkcs12 bundles a key + certificate (+ chain) into one password-protected file — the format most browsers and app servers actually import. Classical and PQC keys bundle identically.',
    setup:
      "OpenSSL 3.x defaults pkcs12 -export to AES-256-CBC + PBKDF2. The -legacy flag reverts to RC2/3DES for compatibility with very old software that can't read the modern format — it is a compatibility downgrade, not a security improvement, so only use it when you must.",
    steps: [
      {
        op: 'genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out learn-l8-rsa.key',
        label: 'Generate the key to bundle',
        run: async (ctx) => {
          await ctx.run(
            'genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out learn-l8-rsa.key'
          )
          return { detail: 'RSA-2048 key ready.' }
        },
      },
      {
        op: 'req -x509 -new -key learn-l8-rsa.key -days 365 -sha256 -subj "/C=US/O=Learn/CN=example.com" -out learn-l8-rsa.crt',
        label: 'Self-sign a certificate for that key',
        run: async (ctx) => {
          await ctx.run(
            'req -x509 -new -key learn-l8-rsa.key -days 365 -sha256 -subj "/C=US/O=Learn/CN=example.com" -out learn-l8-rsa.crt'
          )
          return { detail: `${sizeOf(ctx, 'learn-l8-rsa.crt')} B certificate ready.` }
        },
      },
      {
        op: 'pkcs12 -export -in learn-l8-rsa.crt -inkey learn-l8-rsa.key -out learn-l8-bundle.p12 -passout pass:learnkit123',
        label: 'Bundle key + certificate into one PKCS#12 file',
        run: async (ctx) => {
          await ctx.run(
            'pkcs12 -export -in learn-l8-rsa.crt -inkey learn-l8-rsa.key -out learn-l8-bundle.p12 -passout pass:learnkit123'
          )
          return {
            detail: `${sizeOf(ctx, 'learn-l8-bundle.p12')} B .p12 file — AES-256-CBC + PBKDF2 by default in OpenSSL 3.x, no -legacy flag needed.`,
          }
        },
      },
      {
        op: 'pkcs12 -in learn-l8-bundle.p12 -out learn-l8-restored.pem -passin pass:learnkit123 -nodes',
        label: 'Unpack it back to a PEM bundle',
        run: async (ctx) => {
          await ctx.run(
            'pkcs12 -in learn-l8-bundle.p12 -out learn-l8-restored.pem -passin pass:learnkit123 -nodes'
          )
          return { detail: `${sizeOf(ctx, 'learn-l8-restored.pem')} B PEM — key + cert restored.` }
        },
      },
    ],
    notes: [
      "A bundle isn't guaranteed to have the matching cert listed first if it contains a chain — -clcerts isolates just the client (leaf) certificate when you need to be sure.",
      "-nodes here (as the Studio's own Workbench emits it) is the older name for what current OpenSSL docs call -noenc — same effect, don't re-encrypt the extracted private key.",
    ],
    whyItMatters:
      'Generating a key/cert pair is only half the job — most real deployment targets (browsers, load balancers, app servers) want ONE password-protected file, not three loose PEM files. This is the packaging step that actually gets a PQC (or classical) identity into production tooling.',
    tryRef: ['pkcs12'],
  },

  // ── L9 — Randomness, honestly sourced ──────────────────────────────────
  {
    id: 'randomness',
    n: 9,
    tag: 'Core',
    tone: 'ok',
    title: 'Randomness, honestly sourced',
    blurb:
      'Every key this Studio has generated so far leaned on openssl rand under the hood. This lesson calls it directly and looks at what it actually promises.',
    setup:
      'openssl rand draws from RAND_bytes() — a CSPRNG seeded from the OS entropy source. It is documented to provide full security strength ONLY if it managed to seed itself successfully; if entropy seeding fails, OpenSSL is designed to fail loudly (nonzero exit) rather than silently hand you predictable bytes.',
    steps: [
      {
        op: 'rand -hex 32',
        label: 'Draw 32 random bytes, hex-encoded to stdout',
        run: async (ctx) => {
          const r = await ctx.run('rand -hex 32')
          return {
            detail: `${r.stdout.trim()} — 64 hex characters = 32 bytes, printed directly, no file needed.`,
          }
        },
      },
      {
        op: 'rand -out learn-l9-random.bin 4096',
        label: 'Draw 4 KB of random bytes to a file',
        run: async (ctx) => {
          await ctx.run('rand -out learn-l9-random.bin 4096')
          const bytes = ctx.readFile('learn-l9-random.bin')
          return {
            detail: `${bytes?.length ?? -1} B written. First 8 bytes: ${bytes ? hex(bytes) : '?'}… — every genpkey call in this curriculum drew from this same source.`,
          }
        },
      },
    ],
    notes: [
      'This is the SAME entropy source every genpkey call in Lessons 1–4 and 8 used, classical and post-quantum alike — key generation quality is era-independent; what differs is what the algorithm DOES with the randomness afterward.',
      'A CSPRNG that silently degraded to weak output on entropy failure would be far more dangerous than one that simply refuses to run — openssl rand is documented to do the latter.',
    ],
    whyItMatters:
      'Every algorithm in this Studio — RSA, ML-KEM, ML-DSA, AES — is only as strong as the randomness feeding its key generation. A perfect post-quantum algorithm fed a broken RNG is still broken. This is the one dependency every lesson so far has silently relied on.',
    tryRef: ['rand'],
  },

  // ── L10 — Config files demystified ──────────────────────────────────────
  {
    id: 'config-files',
    n: 10,
    tag: 'Core',
    tone: 'ok',
    title: 'Config files demystified',
    blurb:
      'openssl.cnf quietly supplies defaults every req/x509 call in this curriculum relied on. openssl configutl (new in OpenSSL 3.6) parses and re-dumps a config file so you can see exactly what it resolves to.',
    setup:
      'configutl -config <file> -out <file> parses a config file and writes back its LINEARIZED, EXPANDED form — comments stripped, includes resolved, whitespace normalized. It has no -dump flag; -out alone is what triggers the write.',
    steps: [
      {
        op: '(seed) learn-l10-test.cnf',
        label: 'Write a small test config file (mirrors typing into the File Editor)',
        run: async (ctx) => {
          ctx.writeFile('learn-l10-test.cnf', '[req]\ndefault_bits = 2048\ndefault_md = sha256\n')
          return { detail: "learn-l10-test.cnf seeded — this step doesn't run openssl itself." }
        },
      },
      {
        op: 'configutl -config learn-l10-test.cnf -out learn-l10-dumped.txt',
        label: 'Parse and re-dump the config',
        run: async (ctx) => {
          await ctx.run('configutl -config learn-l10-test.cnf -out learn-l10-dumped.txt')
          const dumped = ctx.readFile('learn-l10-dumped.txt')
          const text = dumped ? new TextDecoder().decode(dumped) : ''
          return {
            detail: `Re-dumped: "${text.trim().replace(/\n/g, ' \\n ')}" — linearized and expanded from the original, exactly as the docs describe.`,
          }
        },
      },
    ],
    notes: [
      "req -subj in Lessons 2 and 8 overrode the subject entirely, so this curriculum never depended on openssl.cnf's [req_distinguished_name] defaults — but a real deployment without -subj absolutely does.",
      'configutl is one of the two brand-new subcommands in OpenSSL 3.6 alongside kdf (Lesson 7) — both postdate most existing OpenSSL tutorials.',
    ],
    whyItMatters:
      'Every req/x509 call in this whole curriculum silently trusted a config file for defaults you never saw. configutl is how you stop trusting blindly and actually inspect what a config resolves to — useful the moment a CSR comes out with an unexpected extension or default.',
    tryRef: ['configutl'],
  },

  // ── L11 — Capstone: from workbench to wire ─────────────────────────────
  {
    id: 'capstone-tls',
    n: 11,
    tag: 'Capstone',
    tone: 'primary',
    title: 'Capstone — from workbench to wire',
    blurb:
      "Every artifact so far has stayed inside the Workbench's virtual filesystem. This lesson generates one final certificate, then hands off to the Studio's TLS Simulator — a separate tool that runs a real TLS 1.3 handshake in WASM — to see a certificate actually used on the wire.",
    setup:
      "Per docs.openssl.org's TLS introduction guide, TLS 1.3's handshake is ClientHello → ServerHello → both sides send Finished — notably the SERVER sends Finished before the client, the opposite order from TLS 1.2. The TLS Simulator supports hybrid post-quantum key shares (e.g. X25519MLKEM768) alongside pure ML-DSA certificates.",
    steps: [
      {
        op: 'genpkey -algorithm ML-DSA-65 -out learn-l11-mldsa.key',
        label: 'Generate the ML-DSA-65 key for the handshake certificate',
        run: async (ctx) => {
          await ctx.run('genpkey -algorithm ML-DSA-65 -out learn-l11-mldsa.key')
          return { detail: 'ML-DSA-65 key ready — the same command as Lesson 1.' }
        },
      },
      {
        op: 'req -x509 -new -key learn-l11-mldsa.key -days 365 -sha256 -subj "/C=US/O=Learn/CN=example.com" -out learn-l11-mldsa.crt',
        label: 'Self-sign the certificate this handshake will present',
        run: async (ctx) => {
          await ctx.run(
            'req -x509 -new -key learn-l11-mldsa.key -days 365 -sha256 -subj "/C=US/O=Learn/CN=example.com" -out learn-l11-mldsa.crt'
          )
          return {
            detail: `${sizeOf(ctx, 'learn-l11-mldsa.crt')} B certificate ready — this is the artifact the TLS Simulator will present as the server's identity.`,
          }
        },
      },
    ],
    notes: [
      "TLS 1.3 changed the Finished-message order from TLS 1.2: the SERVER sends its Finished before the client does — a detail visible in the Simulator's step-by-step trace.",
      'The Simulator supports pure ML-DSA-44/65/87 certificates AND hybrid key-exchange groups (X25519MLKEM768, SecP256r1MLKEM768, SecP384r1MLKEM1024) — authentication and key exchange migrate as two INDEPENDENT properties, both needed for a fully post-quantum handshake.',
      'The Simulator is honest about its own limits — composite certificates and HSM-backed signing are explicitly labeled as not yet built, not faked.',
    ],
    whyItMatters:
      'A certificate sitting in a file is not the same as a certificate doing its job in a real protocol exchange. This capstone connects everything this curriculum built — keys, signatures, certificates — to the one place in this Studio where they get used the way a browser or server actually would.',
    tryRef: ['genpkey', 'x509'],
    crossPlaygroundLink: {
      to: '/playground?tool=tls-simulator',
      label: 'Continue in the TLS Simulator',
    },
  },
]
