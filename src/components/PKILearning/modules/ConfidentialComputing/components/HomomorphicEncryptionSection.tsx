// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { AlertTriangle, ArrowRight, KeyRound, Server, ShieldCheck, Cpu, Lock } from 'lucide-react'
import {
  FHE_SCHEMES,
  FHE_KEYS,
  FHE_OPERATIONS,
  FHE_QUANTUM_EXPOSURE,
  FHE_IMPLEMENTATIONS,
  FHE_COMMERCIAL_NAMES,
} from '../data/fheData'

const RUN_BY_COLORS: Record<string, string> = {
  client: 'bg-primary/10 text-primary border-primary/30',
  server: 'bg-muted text-muted-foreground border-border',
  'key holder': 'bg-success/10 text-status-success border-success/30',
}

/** Body of the "Homomorphic Encryption" learn section (rendered inside a CollapsibleSection). */
export const HomomorphicEncryptionSection: React.FC = () => (
  <div className="space-y-6 text-sm text-foreground/80">
    <p>
      A TEE protects data in use by trusting <strong>hardware</strong>. Fully homomorphic encryption
      (FHE) takes the other route: it trusts <strong>mathematics</strong>. The server computes
      directly on ciphertexts and returns an encrypted result. It never sees the input or the
      output, and there is no enclave to attest. The cost is speed: FHE is orders of magnitude
      slower than computing in the clear.
    </p>

    {/* TEE vs FHE */}
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-2 text-muted-foreground font-medium" />
            <th className="text-left p-2 text-muted-foreground font-medium">TEE</th>
            <th className="text-left p-2 text-muted-foreground font-medium">FHE</th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {[
            [
              'Root of trust',
              'CPU vendor, firmware, attestation chain',
              'Hardness of lattice problems',
            ],
            ['Data inside the server', 'Plaintext, inside the enclave', 'Always ciphertext'],
            ['Side channels', 'Main attack surface', 'Nothing to leak on the server'],
            ['Speed', 'Near native', '10³–10⁶× slower; needs GPU/FPGA at scale'],
            [
              'Integrity of the result',
              'Attested code',
              'Not provided — ciphertexts are malleable',
            ],
            [
              'Quantum status',
              'Attestation signatures are classical today',
              'Core scheme is lattice-based',
            ],
          ].map(([label, tee, fhe]) => (
            <tr key={label} className="border-b border-border/50">
              <td className="p-2 font-bold text-foreground">{label}</td>
              <td className="p-2 text-muted-foreground">{tee}</td>
              <td className="p-2 text-muted-foreground">{fhe}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Schemes */}
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground">The four standardized schemes</h3>
      <p className="text-xs text-muted-foreground">
        Every ciphertext carries a small random error (&ldquo;noise&rdquo;). Additions grow it a
        little and multiplications grow it a lot. Once it is too large, decryption fails.{' '}
        <strong>Bootstrapping</strong> refreshes the noise by running decryption homomorphically
        under an encrypted copy of the key. All four schemes are being standardized in ISO/IEC
        28033.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-muted-foreground font-medium">Scheme</th>
              <th className="text-left p-2 text-muted-foreground font-medium">Computes on</th>
              <th className="text-left p-2 text-muted-foreground font-medium">Best for</th>
              <th className="text-left p-2 text-muted-foreground font-medium">Bootstrapping</th>
              <th className="text-left p-2 text-muted-foreground font-medium">Standard</th>
            </tr>
          </thead>
          <tbody>
            {FHE_SCHEMES.map((s) => (
              <tr key={s.id} className="border-b border-border/50">
                <td className="p-2 font-bold text-foreground">
                  {s.name} <span className="text-muted-foreground font-normal">({s.year})</span>
                </td>
                <td className="p-2 text-muted-foreground">{s.dataType}</td>
                <td className="p-2 text-muted-foreground">{s.bestFor}</td>
                <td className="p-2 text-muted-foreground">{s.bootstrapping}</td>
                <td className="p-2 text-muted-foreground font-mono">{s.isoPart}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Keys */}
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <KeyRound size={16} className="text-primary" />
        FHE keys: one small secret, many large public keys
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FHE_KEYS.map((k) => (
          <div
            key={k.id}
            className={`rounded-lg p-3 border ${
              k.secret ? 'bg-success/10 border-success/30' : 'bg-muted/50 border-border'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-foreground">{k.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                  k.secret
                    ? 'text-status-success border-success/30'
                    : 'text-muted-foreground border-border'
                }`}
              >
                {k.secret ? 'SECRET' : 'PUBLIC'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{k.what}</p>
            <p className="text-[11px] text-foreground/70 mt-1">Size: {k.sizeOrder}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Sizes are orders of magnitude and depend heavily on the parameter set. The public evaluation
        keys don&apos;t need to be secret, but they <em>encrypt functions of the secret key</em>, so
        they need <strong>integrity</strong>. There is no standard encoding yet: no PKCS#11 or KMIP
        object type and no X.509 OID. Each library serializes keys its own way, and a key is
        meaningless without its exact parameter set.
      </p>
    </div>

    {/* Operations */}
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground">Operations and who runs them</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-muted-foreground font-medium">Operation</th>
              <th className="text-left p-2 text-muted-foreground font-medium">Run by</th>
              <th className="text-left p-2 text-muted-foreground font-medium">Needs</th>
              <th className="text-left p-2 text-muted-foreground font-medium">Effect</th>
            </tr>
          </thead>
          <tbody>
            {FHE_OPERATIONS.map((op) => (
              <tr key={op.name} className="border-b border-border/50">
                <td className="p-2 font-bold text-foreground">{op.name}</td>
                <td className="p-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${RUN_BY_COLORS[op.runBy]}`}
                  >
                    {op.runBy}
                  </span>
                </td>
                <td className="p-2 text-muted-foreground">{op.needs}</td>
                <td className="p-2 text-muted-foreground">{op.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* AES / transciphering */}
    <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Lock size={16} className="text-primary" />
        Does FHE work with AES?
      </h3>
      <p className="text-xs text-muted-foreground">
        Not directly. You can only compute on ciphertexts from a homomorphic scheme. An AES-GCM
        ciphertext has no structure a server can exploit, so you can&apos;t add two of them. The
        bridge is <strong>transciphering</strong>. Its public baseline today is TFHE-rs with the
        Trivium or Kreyvium stream ciphers, not AES:
      </p>
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 text-xs">
        {[
          'Client sends Kreyvium(data), and FHE(Kreyvium key) once',
          'Server runs the Kreyvium keystream inside FHE',
          'Result: FHE(data), never seen in the clear',
          'Computation continues under FHE',
        ].map((step, i, arr) => (
          <React.Fragment key={step}>
            <div className="flex-1 bg-background/50 rounded px-3 py-2 border border-border text-foreground">
              <span className="font-bold text-primary mr-1">{i + 1}.</span>
              {step}
            </div>
            {i < arr.length - 1 && (
              <ArrowRight
                size={14}
                className="text-muted-foreground self-center rotate-90 md:rotate-0"
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        This keeps uploads at plaintext size instead of FHE size, which can be 10³ times larger or
        more. TFHE-rs implements it (apps/trivium, TransCiphering trait), and the WAHC 2023 paper
        reports under 300 ms per 64-bit block. Use Kreyvium&apos;s 128-bit key: Trivium&apos;s
        80-bit key is too short once Grover is taken into account. Homomorphic AES exists only in
        research implementations so far (for example IACR ePrint 2025/075 over TFHE and 2026/1209
        over CKKS), so it is not part of the baseline.
      </p>
    </div>

    {/* Quantum exposure */}
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <AlertTriangle size={16} className="text-primary" />
        FHE against the quantum threat
      </h3>
      <p className="text-xs text-muted-foreground">
        Lattice FHE is <strong>post-quantum by construction</strong>. It rests on the same Learning
        With Errors problem as ML-KEM, and harvested ciphertexts give a quantum attacker nothing. An
        FHE <em>deployment</em> is a different matter, because the parts around the scheme are
        usually still classical:
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-muted-foreground font-medium">Component</th>
              <th className="text-left p-2 text-muted-foreground font-medium">Typical today</th>
              <th className="text-center p-2 text-muted-foreground font-medium">Quantum-broken?</th>
              <th className="text-left p-2 text-muted-foreground font-medium">PQC fix</th>
            </tr>
          </thead>
          <tbody>
            {FHE_QUANTUM_EXPOSURE.map((row) => (
              <tr key={row.id} className="border-b border-border/50">
                <td className="p-2 font-bold text-foreground">{row.component}</td>
                <td className="p-2 text-muted-foreground">{row.typical}</td>
                <td className="p-2 text-center">
                  {row.broken ? (
                    <span className="text-status-error font-bold">Yes</span>
                  ) : (
                    <span className="text-status-success font-bold">No</span>
                  )}
                </td>
                <td className="p-2 text-muted-foreground">{row.fix}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* HSM role */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <ShieldCheck size={14} className="text-primary" />
          HSM as FHE key custodian
        </h3>
        <p className="text-[11px] text-status-warning mb-2">
          Deployment pattern: our composition of standard HSM functions around library calls. No FHE
          library or paper defines an HSM role.
        </p>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>
            Generate a 32-byte seed inside the HSM as a non-extractable key: ordinary key wrapping
            refuses it
          </li>
          <li>
            Derive the secret key from it inside the HSM; stream the public and evaluation keys out
          </li>
          <li>Sign the parameter set and evaluation-key hashes with ML-DSA</li>
          <li>Decrypt inside the HSM, under policy, with an audit log</li>
          <li>
            Back up the seed (not GBs of keys) only HSM to HSM: a live clone to an authenticated
            peer, or an offline package that only an enrolled backup HSM can restore. Each HSM
            proves itself with a manufacturing → device → function certificate chain and fresh
            attestation evidence (draft-ietf-rats-pkix-key-attestation). The package is pure
            post-quantum at NIST Category 3: sealed to the recipient’s FIPS 203 ML-KEM-768
            certificate and signed with FIPS 204 ML-DSA-65, with no classical or hybrid fallback.
          </li>
        </ol>
        <p className="text-xs text-muted-foreground mt-2">
          Alternative: <strong>threshold FHE</strong>. Split the key across several parties (each
          ideally holding its share in its own HSM), so no single decryptor exists. OpenFHE (BFV,
          N-of-N) and Lattigo (BGV, t-of-N) both implement it; the workshop shows both.
        </p>
      </div>
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Cpu size={14} className="text-primary" />
          Can the HSM run FHE itself?
        </h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>
            <span className="text-status-success font-bold">Yes:</span> seed and secret-key
            generation, decryption. Both are small inputs and milliseconds of compute.
          </li>
          <li>
            <span className="text-status-warning font-bold">Possible:</span> evaluation-key
            generation. The math is fine, but the output reaches hundreds of MB or GBs and has to be
            streamed out.
          </li>
          <li>
            <span className="text-status-error font-bold">No:</span> homomorphic evaluation and
            bootstrapping. They need GBs of keys in memory plus GPU or FPGA acceleration. Running
            them in the HSM would also make it the trusted party FHE exists to remove.
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          No standard PKCS#11 mechanism exists for any of this today. It would use vendor-defined
          mechanisms.
        </p>
      </div>
    </div>

    <div className="bg-warning/10 rounded-lg p-4 border border-warning/30">
      <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
        <AlertTriangle size={14} className="text-status-warning" />
        Design rule: an HSM must not be a raw decryption oracle
      </h3>
      <p className="text-xs text-muted-foreground">
        If a party can submit chosen ciphertexts and get the decrypted result back, published
        attacks can recover the secret key (Li &amp; Micciancio 2021 on CKKS; later
        decryption-failure attacks on BFV, BGV and TFHE). Approximate CKKS outputs leak noise. An
        HSM that decrypts FHE results has to add noise (&ldquo;noise flooding&rdquo;) and should
        only release approved result shapes, with rate limits.
      </p>
    </div>

    {/* Implementations */}
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Server size={16} className="text-primary" />
        Open-source implementations of the standardized schemes
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-muted-foreground font-medium">Library</th>
              <th className="text-left p-2 text-muted-foreground font-medium">License</th>
              <th className="text-left p-2 text-muted-foreground font-medium">Schemes</th>
              <th className="text-left p-2 text-muted-foreground font-medium">WebAssembly</th>
            </tr>
          </thead>
          <tbody>
            {FHE_IMPLEMENTATIONS.map((lib) => (
              <tr key={lib.id} className="border-b border-border/50 align-top">
                <td className="p-2">
                  <a
                    href={lib.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary hover:underline"
                  >
                    {lib.name}
                  </a>
                  <div className="text-[10px] text-muted-foreground">{lib.maintainer}</div>
                </td>
                <td className="p-2 text-muted-foreground font-mono">{lib.license}</td>
                <td className="p-2 text-muted-foreground">{lib.schemes}</td>
                <td className="p-2 text-muted-foreground">
                  {lib.wasm}
                  {lib.caveat && (
                    <div className="text-[10px] text-status-warning mt-0.5">{lib.caveat}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Commercial offerings, not covered here: {FHE_COMMERCIAL_NAMES.join(' · ')}.
      </p>
    </div>
  </div>
)
