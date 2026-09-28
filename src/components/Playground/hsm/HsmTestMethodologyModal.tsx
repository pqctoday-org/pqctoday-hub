// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { X, FlaskConical, ShieldCheck, GitCompare, BookOpen, Construction } from 'lucide-react'
import { Button } from '../../ui/button'
import { ValidationDisclaimer } from '@/components/shared/ValidationDisclaimer'

interface HsmTestMethodologyModalProps {
  onClose: () => void
}

/**
 * Layer 1 rows. `tested` must name only operations/modes that have a real
 * test in hsm/acvp/useAcvpSuite.ts (section numbers in brackets); anything
 * else belongs in `limits`. ACVP remediation plan WS-A, A-3 (2026-09-24).
 */
const METHODOLOGY_ROWS: { algo: string; tested: string; limits: string }[] = [
  {
    algo: 'ML-KEM',
    tested:
      'ML-KEM-512 / 768 / 1024: decapsulation of one NIST ACVP-Server AFT sample per parameter set (imported private key, shared secret compared byte-for-byte) [§7]; encapsulate + decapsulate round-trip with a freshly generated key pair, no external expected value [§8].',
    limits:
      'key generation and encapsulation against NIST expected values, more than one AFT case per set, invalid or modified ciphertext (implicit rejection).',
  },
  {
    algo: 'ML-DSA',
    tested:
      "ML-DSA-44 / 65 / 87: dedicated NIST ACVP-Server sigVer cases in pure mode — per set one positive and four negatives (NIST's own modified-message / modified-signature cases), asserting CKR_OK or CKR_SIGNATURE_INVALID — plus two product-authored negatives (public-key and context bit flips, labelled as not NIST) [§5d]; deterministic signing with the NIST private key imported, byte-compared to the NIST signature (one pure and one pre-hash case per set) [§5d]; key generation from the NIST seed via CKA_SEED, public key byte-compared [§5d]; verification of sigGen-derived tuples, including one non-empty-context and one pre-hash case per set [§5, §5b]; sign + verify round-trips with fresh key pairs [§6, §28]. External Mu cases run only through the vendor-defined mechanism 0x403c (not a PKCS#11 v3.2 mechanism) and show as skip rows where an engine does not advertise it.",
    limits:
      'hedged (randomized) signing against expected values, the internal signing interface, pre-hash functions with no PKCS#11 mechanism (SHA2-512/224, SHA2-512/256 — shown as skip rows), more than one case per upstream group.',
  },
  {
    algo: 'SLH-DSA',
    tested:
      'All 12 parameter sets: one positive verification per set of a NIST ACVP-Server sigGen output (pure mode, with context) [§9b]; sign + verify round-trip per set [§9]; for SHA2-128s only, context binding (a different or empty context must fail) and deterministic-mode repeatability, both self-checks with no external expected value [§21, §22].',
    limits:
      'pre-hash (HashSLH-DSA) modes, the separate NIST sigVer test set, negative verification from reference data, signature generation against expected values.',
  },
  {
    algo: 'AES-GCM',
    tested:
      "AES-256-GCM decryption of a NIST CAVP published example (gcmDecrypt256.rsp: AES-256, 96-bit IV, no AAD, 128-bit tag) — a published-standard KAT from NIST's legacy CAVP test vectors, not an ACVP-Server sample [§1].",
    limits:
      'the published GCM Test Case 16 itself, ACVP AES-GCM vectors, encryption against expected values, other key / IV / tag lengths, authentication-failure cases.',
  },
  {
    algo: 'AES-KW',
    tested:
      'AES-KW (CKM_AES_KEY_WRAP) wrap of the RFC 3394 §4.6 example (256-bit KEK) compared to the published output [§19]; AES-KWP wrap + unwrap round-trip, no external expected value [§20].',
    limits:
      'ACVP AES-KW/KWP vectors, unwrap against expected values, other KEK sizes, unaligned-length KWP expected values, integrity-failure cases.',
  },
]

export const HsmTestMethodologyModal = ({ onClose }: HsmTestMethodologyModalProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 embed-backdrop z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 embed-backdrop bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-2xl bg-card border border-border rounded-xl shadow-xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex items-start gap-3">
            <FlaskConical size={20} className="text-primary mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-foreground">
                  SoftHSMv3 WASM — Test Methodology
                </h2>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30">
                  <Construction size={10} />
                  WIP
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                PKCS#11 v3.2 emulation exercised through several evidence layers, each labelled
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0 -mt-1 -mr-1">
            <X size={16} />
          </Button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto text-sm">
          {/* Intro */}
          <p className="text-muted-foreground leading-relaxed">
            This playground hosts a browser-native PKCS#11 v3.2 emulator (SoftHSMv3 compiled to
            WebAssembly via Emscripten). It is exercised through four layers of evidence, listed
            below from strongest to weakest; the fourth (oracle comparison) is disclosed separately
            rather than folded into the NIST-backed layer, since it rests on weaker evidence. The
            PQC mechanisms it emulates (CKM_ML_KEM, CKM_ML_DSA, CKM_SLH_DSA) are defined in{' '}
            <span className="font-semibold text-foreground">
              OASIS PKCS#11 v3.2, an OASIS Standard since 3 June 2026
            </span>
            ; the preceding PKCS #11 v3.1 (23 July 2023) does not include these PQC mechanisms.
          </p>

          {/* Layer 1: reference samples + published KATs. Every row below maps to a
              real section of hsm/acvp/useAcvpSuite.ts (numbers in brackets) —
              keep it that way; list a limitation rather than an untested mode. */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={15} className="text-primary shrink-0" />
              <h3 className="font-semibold text-foreground">
                Layer 1 — Sampled reference vectors and published KATs
              </h3>
            </div>
            <div className="pl-5 space-y-2 text-muted-foreground">
              <p className="leading-relaxed">
                Selected cases are replayed from{' '}
                <span className="font-medium text-foreground">
                  public NIST ACVP-Server reference samples
                </span>{' '}
                (copied from the public repository, not vectors issued to an ACVTS session) and, for
                some algorithms, from a published standard&apos;s own example. Each result row is
                tagged with its evidence tier. Coverage is a sample — typically one case per
                parameter set — not the ACVP test matrix.
              </p>
              <ul className="space-y-2 mt-2">
                {METHODOLOGY_ROWS.map(({ algo, tested, limits }) => (
                  <li key={algo} className="flex gap-2">
                    <span className="text-xs font-mono font-bold text-primary shrink-0 mt-0.5 w-16">
                      {algo}
                    </span>
                    <span className="text-xs leading-relaxed">
                      {tested}
                      <span className="block text-status-warning">Not tested: {limits}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs leading-relaxed pt-1">
                <span className="font-medium text-foreground">Seeds and response files:</span> the
                workbench asks each engine for a fixed test seed (the shipped C++ build rejects it
                and runs unseeded), but no test compares seeded randomized output (encapsulation,
                hedged signing) with a NIST expected value. The NIST-backed checks use imported
                keys, NIST-supplied seeds (ML-DSA key generation via CKA_SEED) and deterministic
                operations (decapsulation, verification, deterministic signing, digest, MAC,
                decryption). No ACVP response file is generated or submitted.
              </p>
            </div>
          </section>

          {/* Layer 2: Industry KAT */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={15} className="text-secondary shrink-0" />
              <h3 className="font-semibold text-foreground">
                Layer 2 — Industry & Interoperability KAT
              </h3>
            </div>
            <div className="pl-5 space-y-2 text-muted-foreground">
              <p className="leading-relaxed">
                Beyond NIST vectors, the emulator is cross-checked against industry working-group
                reference implementations to verify interoperability at the wire level.
              </p>
              <ul className="space-y-1.5 mt-2">
                {[
                  {
                    src: 'IETF / OASIS',
                    detail:
                      'PKCS#11 v3.2 mechanism conformance — CKM_ML_KEM_*, CKM_ML_DSA_*, CKM_HASH_ML_DSA_*, CKM_SLH_DSA_*, CKM_AES_* per §5.x tables',
                  },
                  {
                    src: 'OpenSSL 3.6',
                    detail:
                      'Underlying EVP calls validated against OpenSSL test suite (openssl/test/recipes); all PQC providers via oqs-provider for parity',
                  },
                  {
                    src: 'IETF RFC 5649 / 3394',
                    detail:
                      'AES Key Wrap (CKM_AES_KW / CKM_AES_KWP) — one RFC 3394 example wrap plus a KWP round-trip; no NIST CAVP/ACVP key-wrap vectors are used',
                  },
                  {
                    src: 'PKCS#11 v3.2 §4.10.2',
                    detail:
                      'CKA_CHECK_VALUE (KCV) — stored and returned in clear for all key classes; SHA-256(CKA_VALUE)[0:3] for asymmetric keys, AES-ECB zero-block for AES',
                  },
                ].map(({ src, detail }) => (
                  <li key={src} className="flex gap-2">
                    <span className="text-xs font-mono font-bold text-secondary shrink-0 mt-0.5 w-28 leading-relaxed">
                      {src}
                    </span>
                    <span className="text-xs leading-relaxed">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Layer 3: Dual-engine cross-check */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <GitCompare size={15} className="text-accent shrink-0" />
              <h3 className="font-semibold text-foreground">
                Layer 3 — Dual-Engine C++ ↔ Rust Cross-Check
              </h3>
            </div>
            <div className="pl-5 space-y-3 text-muted-foreground">
              <p className="leading-relaxed">
                When{' '}
                <span className="font-semibold text-foreground font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                  Dual Parity
                </span>{' '}
                mode is selected, the playground runs both engines simultaneously and
                cross-validates outputs. The two engines use{' '}
                <span className="font-medium text-foreground">
                  entirely different crypto primitive libraries
                </span>
                , which makes disagreement a finding worth investigating. Agreement is differential
                evidence only — both engines share this page&apos;s vector adapters and test code,
                so it is not independent validation. In the Validation workbench, Dual Parity runs
                the same cases on each engine side by side; the cross-engine hand-offs below happen
                in the Operate tab&apos;s KEM and Sign &amp; Verify rails.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="glass-panel p-3 rounded-lg space-y-1">
                  <p className="text-xs font-bold text-foreground">C++ Engine</p>
                  <p className="text-xs">SoftHSMv3 WASM</p>
                  <p className="text-xs">OpenSSL 3.6 EVP API</p>
                  <p className="text-xs">liboqs (OQS provider)</p>
                  <p className="text-xs">PKCS#11 v3.2 full stack</p>
                </div>
                <div className="glass-panel p-3 rounded-lg space-y-1">
                  <p className="text-xs font-bold text-foreground">Rust Engine</p>
                  <p className="text-xs">Pure-Rust WASM (wasm-pack)</p>
                  <p className="text-xs">
                    <span className="font-mono">ml-kem</span> crate (FIPS 203)
                  </p>
                  <p className="text-xs">
                    <span className="font-mono">ml-dsa</span> crate (FIPS 204)
                  </p>
                  <p className="text-xs">PKCS#11 v3.2 shim layer</p>
                </div>
              </div>

              <div className="space-y-2 mt-1">
                <div className="flex gap-2 items-start">
                  <span className="text-xs font-mono text-accent shrink-0 w-20">ML-KEM</span>
                  <span className="text-xs leading-relaxed">
                    Rust encapsulates using C++ public key → C++ decapsulates → shared secrets must
                    match byte-for-byte
                  </span>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-xs font-mono text-accent shrink-0 w-20">ML-DSA</span>
                  <span className="text-xs leading-relaxed">
                    C++ signs message → Rust imports public key via{' '}
                    <span className="font-mono">C_CreateObject</span> → Rust verifies signature
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Layer 4: Self-consistency checks */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical size={15} className="text-muted-foreground shrink-0" />
              <h3 className="font-semibold text-foreground">
                Layer 4 — Oracle Comparisons (Self-Consistency)
              </h3>
            </div>
            <div className="pl-5 space-y-2 text-muted-foreground">
              <p className="leading-relaxed">
                A small number of tests have no matching NIST ACVP-Server reference sample or
                published standard KAT to check against — either the algorithm has no ACVP
                registration at all, or the specific parameters this emulator implements (a hash
                width, a PRF) aren&apos;t among the ones NIST&apos;s reference vector sample covers.
                For these, the expected value is instead computed independently with Node&apos;s{' '}
                <span className="font-mono text-xs">crypto</span> module (OpenSSL) and checked for
                agreement — a real assertion (the emulator and an independent implementation must
                still produce the same answer), but a weaker one than a citable published vector,
                since both share the same underlying primitive rather than being cross-validated
                against a third-party reference.
              </p>
              <ul className="space-y-1.5 mt-2">
                {[
                  {
                    algo: 'RSA-OAEP',
                    detail: 'No ACVP registration exists for RSA-OAEP decryption at all',
                  },
                  {
                    algo: 'AES-GCM',
                    detail:
                      'The bundled vector reuses GCM Test Case 16 inputs with the AAD dropped, so its tag was computed with OpenSSL — it is not the published Test Case 16',
                  },
                  {
                    algo: 'RSA-PSS',
                    detail:
                      "NIST's reference PSS vectors only cover SHA-1/SHA2-224/SHA3-256/SHAKE — none of which this emulator's PSS path implements (SHA-256/384/512, SHA3-384)",
                  },
                  {
                    algo: 'PBKDF2',
                    detail:
                      "NIST's reference PBKDF2 vectors are SHA2-224-only — this emulator implements SHA-256/384/512 PRFs, which the reference sample doesn't cover",
                  },
                ].map(({ algo, detail }) => (
                  <li key={algo} className="flex gap-2">
                    <span className="text-xs font-mono font-bold text-muted-foreground shrink-0 mt-0.5 w-20">
                      {algo}
                    </span>
                    <span className="text-xs leading-relaxed">{detail}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs leading-relaxed pt-1">
                The results table marks every test with its evidence tier (hover the status badge) —
                self-consistency rows carry the same flask icon used above.
              </p>
            </div>
          </section>

          {/* PKCS#11 v3.2 compliance */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={15} className="text-primary shrink-0" />
              <h3 className="font-semibold text-foreground">PKCS#11 v3.2 Compliance Notes</h3>
            </div>
            <div className="pl-5 text-muted-foreground">
              <ul className="space-y-1.5">
                {[
                  'Key attributes enforced per §4.2 common attribute table (CKA_SENSITIVE, CKA_EXTRACTABLE, CKA_LOCAL, CKA_NEVER_EXTRACTABLE)',
                  'CKA_CHECK_VALUE (§4.10.2) — non-sensitive public fingerprint; returned in clear for all key classes so callers can compare across HSM boundaries',
                  'C_EncapsulateKey / C_DecapsulateKey per §5.19 KEM operations (ML-KEM-512/768/1024)',
                  'CKA_PARAMETER_SET per §6.5 — CKP_ML_KEM_*, CKP_ML_DSA_*, CKP_SLH_DSA_* for all variant selection',
                  'C_WrapKey / C_UnwrapKey per §5.14 using CKM_AES_KW, CKM_AES_KWP, CKM_AES_CBC_PAD',
                  'PBKDF2 via C_DeriveKey + CKM_PKCS5_PBKD2 (§5.16.2) with HMAC-SHA-256/512 PRF',
                ].map((note, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <ValidationDisclaimer />

          {/* WIP disclaimer */}
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex gap-3">
            <Construction size={15} className="text-warning shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-warning">Work in Progress</p>
              <p className="leading-relaxed">
                This PKCS#11 emulator is under active development. Validation coverage is
                continuously expanded. Some mechanisms (CKM_RSA_OAEP wrapping, ECDH key agreement
                with PQC hybrids) are partially implemented. The PR smoke gate runs the Validation
                workbench on the Rust engine only; dual-engine parity runs are manual.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
