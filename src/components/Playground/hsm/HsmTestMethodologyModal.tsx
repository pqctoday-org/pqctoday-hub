// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { X, FlaskConical, ShieldCheck, GitCompare, BookOpen, Construction } from 'lucide-react'
import { Button } from '../../ui/button'

interface HsmTestMethodologyModalProps {
  onClose: () => void
}

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
                PKCS#11 v3.2 emulation validated through multi-layer independent verification
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
            WebAssembly via Emscripten). The emulator is validated through three independent layers
            before being exposed in the UI. All operations strictly follow{' '}
            <span className="font-semibold text-foreground">OASIS PKCS#11 v3.2 (October 2023)</span>
            .
          </p>

          {/* Layer 1: ACVP KAT */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={15} className="text-primary shrink-0" />
              <h3 className="font-semibold text-foreground">
                Layer 1 — NIST ACVP Known Answer Tests
              </h3>
            </div>
            <div className="pl-5 space-y-2 text-muted-foreground">
              <p className="leading-relaxed">
                All PQC algorithms are tested against the{' '}
                <span className="font-medium text-foreground">
                  NIST Automated Cryptographic Validation Protocol (ACVP)
                </span>{' '}
                test vector suite. ACVP injects a deterministic DRBG seed so that randomised
                operations produce reproducible outputs that can be verified against the NIST
                published response files.
              </p>
              <ul className="space-y-1.5 mt-2">
                {[
                  {
                    algo: 'ML-KEM',
                    detail:
                      'ML-KEM-512 / 768 / 1024 — KeyGen, Encapsulation, Decapsulation (FIPS 203)',
                  },
                  {
                    algo: 'ML-DSA',
                    detail: 'ML-DSA-44 / 65 / 87 — KeyGen, Sign (det. & hedged), Verify (FIPS 204)',
                  },
                  {
                    algo: 'SLH-DSA',
                    detail:
                      'All 12 parameter sets (SHA2 & SHAKE, small & fast) — Pure & pre-hash modes (FIPS 205)',
                  },
                  {
                    algo: 'AES-KW / AES-GCM',
                    detail: 'CAVS-style wrappers invoked through CKM_AES_KW and CKM_AES_GCM',
                  },
                ].map(({ algo, detail }) => (
                  <li key={algo} className="flex gap-2">
                    <span className="text-xs font-mono font-bold text-primary shrink-0 mt-0.5 w-16">
                      {algo}
                    </span>
                    <span className="text-xs leading-relaxed">{detail}</span>
                  </li>
                ))}
              </ul>
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
                      'AES Key Wrap (CKM_AES_KW / CKM_AES_KWP) — NIST CAVP vectors + RFC test vectors for cloud HSM compatibility',
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
                , making agreement a meaningful independence check.
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

          {/* WIP disclaimer */}
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex gap-3">
            <Construction size={15} className="text-warning shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-warning">Work in Progress</p>
              <p className="leading-relaxed">
                This PKCS#11 emulator is under active development. Validation coverage is
                continuously expanded. Some mechanisms (CKM_RSA_OAEP wrapping, ECDH key agreement
                with PQC hybrids) are partially implemented. Cross-check parity testing is automated
                in CI via the ACVP tab.
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
