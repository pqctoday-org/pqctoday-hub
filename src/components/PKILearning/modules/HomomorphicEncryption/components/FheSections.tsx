// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { AlertTriangle, ArrowRight, KeyRound, Server, ShieldCheck, Cpu, Lock } from 'lucide-react'
import {
  FHE_SCHEMES,
  FHE_KEYS,
  FHE_QUANTUM_EXPOSURE,
  FHE_IMPLEMENTATIONS,
  FHE_COMMERCIAL_NAMES,
} from '../data/fheData'
import { TAKEAWAYS } from '../data/fheContextData'
import {
  FheEncodingBox,
  FheFixedPointAndFit,
  FheOperationsBox,
  FheProgramsBox,
  FhePromiseBox,
  KeyTakeaways,
} from './FheContextSections'
import { EvidenceCite } from './FheEvidenceCite'
import {
  COMPUTE_SERVICE_KMIP_REF,
  COMPUTE_SERVICE_LIMITS,
  COMPUTE_SERVICE_MACHINES_INTRO,
  COMPUTE_SERVICE_MACHINES_SAME_RESULT,
  COMPUTE_SERVICE_MACHINE_ROWS,
  COMPUTE_SERVICE_REF,
  COMPUTE_SERVICE_ROWS,
  COMPUTE_SERVICE_RUNS_CUSTODIAN_COMMIT,
  COMPUTE_SERVICE_RUNS_REF,
  OPENFHE_EXPORT_BOARDS_SENTENCE,
  OPENFHE_EXPORT_LIMITS,
  OPENFHE_EXPORT_REFS,
  OPENFHE_EXPORT_ROWS,
  OPENFHE_ITERATIVE_INTRO,
  OPENFHE_ITERATIVE_ROWS,
  TFHE_LOAN_LIMITS,
  TFHE_LOAN_REF,
  TFHE_LOAN_ROWS,
  citeMerged,
} from '../data/fheComputeService'
import { Button } from '@/components/ui/button'
import type { LifecycleView, OpenLifecycleView } from '../workshop/fheRotationSharedData'
import {
  FLOOD_FORMULA,
  FLOOD_ID2,
  FLOOD_ID3,
  FLOOD_ID3_BOARDS,
  FLOOD_POLICY,
  GATE_F_BAR_BITS,
  SAMPLER_SENTENCE,
  WIDTH_SHORTFALL_BITS,
} from '../data/fheFloodSizing'

/** Compensating controls single-HSM decryption relies on (it trusts every caller allowed to decrypt). */
const DECRYPT_CONTROLS: { area: string; control: string; limits: string }[] = [
  {
    area: 'Identity',
    control:
      'A dedicated decrypt identity per application, with hardware-backed or multi-factor authentication',
    limits: 'Who can ask',
  },
  {
    area: 'Least privilege',
    control:
      'Only the decrypt role may decrypt; roles that derive or export keys cannot, nor can the security officer',
    limits: 'Damage from a stolen credential',
  },
  {
    area: 'Network',
    control: 'Decrypt interface reachable only from the owner’s application network',
    limits: 'Remote attempts, including from the FHE server',
  },
  {
    area: 'Request authorization',
    control:
      'Job identifiers issued by the owner’s workflow; unknown or reused ones refused; optional second approver',
    limits: 'Ad-hoc crafted requests',
  },
  {
    area: 'Monitoring',
    control:
      'Tamper-evident audit of every request; alerts on rates, refusals, near-duplicates and exhausted budgets',
    limits: 'Silent extraction',
  },
  {
    area: 'Host integrity',
    control: 'A hardened requesting host running only the intended software',
    limits: 'Compromise of the one component that may decrypt',
  },
  {
    area: 'Response',
    control: 'Stop decryption, rotate the key set, re-encrypt stored data, review the audit',
    limits: 'Exposure time',
  },
  {
    area: 'Physical and organizational',
    control:
      'Token, backup token and requesting host in access-controlled, logged locations with tamper evidence; security-officer credentials held separately; computing, operating the token and requesting decryption done by different people',
    limits: 'Direct access; a single insider',
  },
]

/** Threshold decryption compared with single-HSM decryption. */
const THRESHOLD_VALUE_LIMITS: { topic: string; value: string; limit: string }[] = [
  {
    topic: 'Key exposure',
    value:
      'No party ever holds the whole key; one stolen token yields a share that is useless alone',
    limit:
      'Partial decryptions leak like whole keys unless each is flooded (Checri et al. 2024; for TFHE flooding needs a different technique, Bootland et al. 2025). Measured 2-of-2 at CKKS default parameters: a 2^31.6 flood, the width the earlier sizing gave one token, leaves −1.6 to −1.9 bits, the same failure as with one token; the corrected width is wider (2^43.1), so flooded threshold releases at these parameters fail by more',
  },
  {
    topic: 'Compromised requester',
    value: 'A crafted request needs every required party to answer',
    limit:
      'Holds only if the parties answer to different people or systems; one application holding every credential brings it back to single-HSM trust. Measured: a crafted request sent to one party returns that party’s whole share (65,536 of 65,536 coefficients, even with flooding), so each token needs its own independent approval',
  },
  {
    topic: 'FHE server',
    value:
      'Computes unchanged: one joint public key and one evaluation-key set, with the same sizes and costs',
    limit:
      'A joint secret has a larger norm (more noise, possibly larger moduli). Measured 2-of-2 with Lattigo at the default bootstrappable set: the joint keys bootstrap at 24.3–24.5 bits, against 24.9 for one party; the weight of each party’s sparse share is a security parameter still to be settled',
  },
  {
    topic: 'Key generation',
    value: 'Each party can produce its share of every evaluation key',
    limit:
      'Shares must be combined: measured 4.10 GB uploaded per party for the CKKS set (3.94 GB from one token), plus a 157 MB download, because relinearization keys need two rounds; protocol rounds must not be retried',
  },
  {
    topic: 'Operations',
    value: '—',
    limit: 'Every required party must be online; rotation needs more ceremony',
  },
  {
    topic: 'More than two parties (t-of-N)',
    value: 'Some parties may be offline',
    limit:
      'Key-recovery attacks have been reported on the t-of-N threshold decryption of Mouchet et al., the scheme behind Lattigo’s t-of-N support (Colin de Verdière, Passelègue & Stehlé, IACR ePrint 2026/031, a preprint that also proposes a fix); whether they apply to a fixed 2-of-2 additive split has not been established',
  },
]

/** Streamed CKKS key set, 8 limbs (4 MB) per call (evidence records 2026-10-10 and 2026-10-11). */
const CKKS_STREAM_MEASURED: {
  device: string
  generation: string
  streamed: string
  peak: string
  bootstrap: string
  decrypt: string
}[] = [
  {
    device: 'Mac (M4 Pro), one core',
    generation: '42.0–43.8 s (90–94 MB/s)',
    streamed: 'not run',
    peak: '15.2 MiB',
    bootstrap: '—',
    decrypt: '—',
  },
  {
    device: 'MX95, one Cortex-A55 core, before (2026-10-10)',
    generation: '473.4 s (8.3 MB/s)',
    streamed: '497.7 s',
    peak: '16.7 MiB',
    bootstrap: '6.7 s',
    decrypt: '0.148 s',
  },
  {
    device: 'MX95 Pro, one Cortex-A55 core, before (2026-10-10)',
    generation: '450.9 s (8.7 MB/s)',
    streamed: '478.0 s',
    peak: '15.7 MiB',
    bootstrap: '7.3 s',
    decrypt: '0.132 s',
  },
  {
    device: 'MX95, one Cortex-A55 core, cached generator (2026-10-11)',
    generation: '213.8 s (18.4 MB/s)',
    streamed: 'not run',
    peak: '64.5 MiB',
    bootstrap: '—',
    decrypt: '—',
  },
  {
    device: 'MX95 Pro, six Cortex-A55 cores, cached generator (2026-10-11)',
    generation: '84.0 s (46.9 MB/s); 72.4 s (54.4 MB/s) at 30 limbs per call',
    streamed: 'not run',
    peak: '94.4 MiB; 123.6 MiB at 30 limbs',
    bootstrap: '—',
    decrypt: '—',
  },
]

/**
 * Chunk size against time and token memory, full key set, one core (evidence records 2026-10-10;
 * the generator-cache column 2026-10-11).
 */
const CKKS_CHUNK_SWEEP: { limbs: string; mac: string; mx95: string; mx95Cached: string }[] = [
  {
    limbs: '1 limb (512 KB), 7,502 calls',
    mac: '93.6 s · 12.2 MiB',
    mx95: '974.6 s · 14.1 MiB',
    mx95Cached: '415.8 s · 13.6 MiB',
  },
  {
    limbs: '8 limbs (4 MB), 1,001 calls',
    mac: '42.0 s · 15.2 MiB',
    mx95: '473.4 s · 16.7 MiB',
    mx95Cached: '401.0 s · 16.2 MiB',
  },
  {
    limbs: '30 limbs (one digit), 251 calls',
    mac: '35.8 s · 40.0 MiB',
    mx95: '416.5 s · 42.6 MiB',
    mx95Cached: '398.0 s · 42.4 MiB',
  },
]

/** What decryption noise means for each scheme (sources in the References list). */
const NOISE_BY_SCHEME: { scheme: string; returns: string; noiseSetting: string }[] = [
  {
    scheme: 'CKKS',
    returns:
      'The message plus a small error. CKKS is approximate by design: its “decryption structure outputs an approximate value of plaintext with a predetermined precision”, and the encryption noise is “considered to be a part of error” (Cheon, Kim, Kim & Song 2017). A result comes back close to the true value, correct to a number of bits (its precision); the last digits are noise.',
    noiseSetting:
      'Chosen at release: round to a precision you trust, and optionally add flooding noise when results go to others (below).',
  },
  {
    scheme: 'TFHE',
    returns:
      'The exact message. The message sits in the most significant bits and the noise in the least significant bits; “if too many computations are performed, the noise will eventually overflow into the message bits and lead to an incorrect result” (TFHE-rs documentation). Otherwise decryption is exact.',
    noiseSetting:
      'None: the decryption-failure probability is fixed by the parameter set. Added noise matters for TFHE only in threshold decryption, where partial decryptions are flooded and TFHE needs “a more subtle technique” because its parameters are small (Bootland et al. 2025, preprint); Checri et al. 2024 show threshold BFV, BGV and CKKS would be insecure without such noise.',
  },
]

/** Parameters of the FHE decryption policy in the pqctoday HSM simulation. */
const FHE_POLICY_PARAMS: { param: string; scope: string; meaning: string }[] = [
  {
    param: 'Allowed output types',
    scope: 'v1 and v2',
    meaning: 'Exactly which encrypted types may be released; anything else is refused',
  },
  {
    param: 'Never-release types',
    scope: 'v1 and v2',
    meaning: 'Types that are never decrypted, whatever else the policy allows',
  },
  {
    param: 'Value predicates',
    scope: 'TFHE only',
    meaning: 'Conditions on the decrypted value, e.g. release only if the value is ≤ a bound',
  },
  {
    param: 'Third-party recipients / recipient-only',
    scope: 'v1 and v2',
    meaning:
      'Results sealed to an enrolled recipient key; with recipient-only, nothing is released in the clear',
  },
  {
    param: 'Maximum number of decryptions',
    scope: 'v1 and v2',
    meaning: 'A lifetime budget; every call counts, released or refused',
  },
  {
    param: 'maxValues',
    scope: 'CKKS (v2)',
    meaning: 'How many slots leave the token per release',
  },
  {
    param: 'precisionBits',
    scope: 'CKKS (v2)',
    meaning:
      'Results are rounded to multiples of 2^-precisionBits before release; the HSM never releases raw noisy coefficients',
  },
  {
    param: 'valueBoundLog2',
    scope: 'CKKS (v2)',
    meaning:
      'Each released value (real and imaginary part) must satisfy |value| < 2^valueBoundLog2, otherwise the request is refused',
  },
  {
    param: 'scaleLog2',
    scope: 'CKKS (v2)',
    meaning: 'The only ciphertext scale accepted',
  },
  {
    param: 'floodRecipients',
    scope: 'CKKS (v2)',
    meaning: 'Default on: add flooding noise to releases sealed for third parties',
  },
  {
    param: 'floodOwner',
    scope: 'CKKS (v2)',
    meaning: 'Default off: add flooding noise to the owner’s own releases too',
  },
  {
    param: 'statSecurityBits',
    scope: 'CKKS (v2)',
    meaning:
      'Default 30; sizes the flooding noise together with the maximum number of decryptions, the replica limit of the key’s replication policy and a measured noise bound of the parameter set',
  },
]

/** Learn section 1: what FHE is, how it differs from a TEE, and what "fully homomorphic" promises. */
export const FheFundamentalsSection: React.FC = () => (
  <div className="space-y-6 text-sm text-foreground/80">
    <KeyTakeaways items={TAKEAWAYS.fundamentals} />

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
            [
              'Side channels',
              'Main attack surface',
              'Plaintext is absent, but timing, traffic, access patterns, circuit shape, dimensions and implementation leakage remain',
            ],
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

    <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-2">
      <h3 className="text-sm font-bold text-foreground">Threat model before scheme choice</h3>
      <p className="text-xs text-muted-foreground">
        FHE primarily hides plaintext from the evaluator. It does not automatically prove that the
        evaluator ran the right circuit, authenticate ciphertexts, hide request timing or size,
        conceal every access pattern, protect a compromised client, or authorize who may receive a
        decrypted result. Record the evaluator, client, custodian and result recipient separately,
        then state which may be malicious or collude.
      </p>
      <p className="text-xs text-muted-foreground">
        If correctness against a malicious evaluator matters, add an integrity mechanism such as a
        verifiable-computation proof or an application-specific check. Circuit privacy and model
        privacy are separate requirements from input confidentiality.
      </p>
    </div>

    <FhePromiseBox />
  </div>
)

/** Learn section 2: schemes, data types and noisy results. */
export const FheSchemesSection: React.FC = () => (
  <div className="space-y-6 text-sm text-foreground/80">
    <KeyTakeaways items={TAKEAWAYS.schemes} />

    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground">
        The four schemes in ISO/IEC 28033 (under development)
      </h3>
      <p className="text-xs text-muted-foreground">
        Every ciphertext carries a small random error (&ldquo;noise&rdquo;). Additions grow it a
        little and multiplications grow it a lot. Once it is too large, decryption fails.{' '}
        <strong>Bootstrapping</strong> refreshes the noise by running decryption homomorphically
        under an encrypted copy of the key. All four schemes are being standardized in ISO/IEC
        28033, which the Library records as under development; the current stage of each part is not
        sourced in the Library (see section 7).
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

    <FheFixedPointAndFit />

    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
      <h3 className="text-sm font-bold text-foreground">Parameter-selection checklist</h3>
      <ol className="list-decimal pl-5 text-xs text-muted-foreground space-y-1">
        <li>Define plaintext type, range, packing and required output precision.</li>
        <li>
          Compile or estimate multiplicative depth, rotations, comparisons and refresh points.
        </li>
        <li>Choose classical and quantum security targets and the secret distribution.</li>
        <li>Set decryption-failure probability and the permitted precision or error budget.</li>
        <li>Run the estimator used by the selected library; do not infer security from N alone.</li>
        <li>Pin the scheme, parameters, library version and compiler settings in the evidence.</li>
        <li>
          Benchmark the complete circuit, including key generation, transfer and bootstrapping.
        </li>
      </ol>
    </div>

    <FheOperationsBox />

    <FheEncodingBox />

    <FheProgramsBox />

    <div
      id="fhe-noisy-results"
      className="bg-muted/50 rounded-lg p-4 border border-border space-y-3"
    >
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Lock size={14} className="text-primary" />
        Decryption results are noisy: what that means and how to read them
      </h3>
      <p className="text-xs text-muted-foreground">
        Every FHE ciphertext carries a small random error, called noise, that grows as you compute.
        What that noise does to a decrypted result depends on the scheme.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-1.5 text-muted-foreground font-medium">Scheme</th>
              <th className="text-left p-1.5 text-muted-foreground font-medium">
                What decryption returns
              </th>
              <th className="text-left p-1.5 text-muted-foreground font-medium">
                Can you set the noise level?
              </th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {NOISE_BY_SCHEME.map((row) => (
              <tr key={row.scheme} className="border-b border-border/50 align-top">
                <td className="p-1.5 font-medium text-foreground">{row.scheme}</td>
                <td className="p-1.5">{row.returns}</td>
                <td className="p-1.5">{row.noiseSetting}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <div className="text-xs font-bold text-foreground mb-1">
          Reading a noisy CKKS result: rounding
        </div>
        <p className="text-xs text-muted-foreground">
          Read the result to the precision you trust and discard the rest, by rounding it to a
          chosen number of bits. Lattigo provides this as{' '}
          <span className="font-mono">DecodePublic</span>, which takes the desired bit precision and
          rounds each value as <span className="font-mono">y = ⌊x/ε⌉·ε</span>. Its documentation
          says values shared with external parties should be decoded with{' '}
          <span className="font-mono">DecodePublic</span> instead of the usual{' '}
          <span className="font-mono">Decode</span>, and that “the Lattigo API does not provide
          automatic IND-CPA-D security”.
        </p>
        <div className="rounded-md border border-border bg-background/60 p-3 mt-2">
          <div className="text-[11px] text-status-warning mb-1">
            Illustration with made-up numbers, not a measurement
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              Encrypted input: <span className="font-mono">3.14159265</span>
            </li>
            <li>
              Decrypted CKKS value: <span className="font-mono">3.1415926481</span> (noise in the
              last digits)
            </li>
            <li>
              Rounded to 20 bits, i.e. to multiples of{' '}
              <span className="font-mono">2^-20 ≈ 0.00000095</span>:{' '}
              <span className="font-mono">round(3.1415926481 · 2^20) = 3294199</span>, and{' '}
              <span className="font-mono">3294199 · 2^-20 = 3.1415929794…</span>, which reads{' '}
              <strong>3.141593</strong> to six decimals
            </li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Rounding removes the low-order noise bits; it cannot recover bits the noise has already
          destroyed.
        </p>
        <div className="rounded-md border border-border bg-background/60 p-3 mt-2">
          <div className="text-[11px] text-status-success mb-1">
            Measured on our test setup (CKKS, Lattigo v6.2.0 default bootstrappable set, scale 2^40)
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              After one bootstrap the decrypted values kept <strong>24.7 bits</strong> of precision;
              the noise in the coefficients was about 2^9.2 (
              <EvidenceCite of="gateF">noise study</EvidenceCite>).
            </li>
            <li>
              The software token on the MX95 boards released the owner&apos;s result rounded to{' '}
              <span className="font-mono">precisionBits</span> 20: <strong>20.9 bits</strong> (20.94
              measured on both boards; <EvidenceCite of="mx95">MX95</EvidenceCite>,{' '}
              <EvidenceCite of="mx95pro">MX95 Pro</EvidenceCite>).
            </li>
          </ul>
        </div>
      </div>

      <div>
        <div className="text-xs font-bold text-foreground mb-1">
          When results go to others: noise flooding
        </div>
        <p className="text-xs text-muted-foreground">
          Decrypted CKKS results seen by others can lead to complete key recovery (Li &amp;
          Micciancio 2021). The research countermeasure is noise flooding: “adding Gaussian noise to
          the output of CKKS decryption suffices to achieve IND-CPA^D security” (Li, Micciancio,
          Schultz &amp; Sorrell 2022). Flooding costs precision. OpenFHE sizes the added noise as{' '}
          <span className="font-mono">σ = √(12τ)·2^(s/2)·t</span>, where{' '}
          <span className="font-mono">τ</span> is the number of adversarial queries the application
          expects, <span className="font-mono">s</span> the statistical security (at least 30) and{' '}
          <span className="font-mono">t</span> the ciphertext noise estimate; the cost therefore
          grows with the number of decryptions and the statistical security level. OpenFHE exposes
          it as the <span className="font-mono">NOISE_FLOODING_DECRYPT</span> decryption mode, which
          its example marks experimental and not yet recommended for production; the example runs
          the computation twice, first to estimate the noise, and with 128-bit arithmetic chooses
          the scaling modulus size from that estimate.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          <strong>The width the pqctoday HSM simulation uses</strong> follows the paper exactly
          (Definition 18 and Corollary 2, <span className="font-mono">σ = √(24qn)·2^(s/2)</span>,
          noise added to the decrypted ring element, the per-coefficient bound{' '}
          <span className="font-mono">B</span> in the role of the ∞-norm bound{' '}
          <span className="font-mono">t</span>): <span className="font-mono">{FLOOD_FORMULA}</span>,
          with <span className="font-mono">n</span> the ring degree and{' '}
          <span className="font-mono">q</span> the number of releases the whole lineage of a key may
          make, (replicas + 1) × maximum decryptions, because every replica keeps its own counter. A
          copy of a key made for another token must keep the same replica limit as its source, so
          every copy computes the same width. Two-prime parameter sets may flood up to σ = 2^80,
          one-prime sets up to 2^62. The first version was {WIDTH_SHORTFALL_BITS} bits narrower than
          this at n = 2^16 (it left out the √24 and √n factors) and counted one copy of the key;
          that is corrected (pqctoday-hsm #355).
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          <strong>Measured cost at default parameters:</strong> with the policy used for the
          measurements (30 bits of statistical security, {FLOOD_POLICY.maxDecrypts} releases, four
          replicas, so <span className="font-mono">q = {FLOOD_POLICY.q}</span>) the default set
          needs a noise width of about 2^{FLOOD_ID2.sigmaLog2}. At the default scale of 2^40 the
          noise-study emulation leaves <strong>{FLOOD_ID2.emulatedBits} bits</strong>, no correct
          bits, and the token refuses the release because the decoded noise is above the policy’s
          value range (<EvidenceCite of="defaultLmssId2">default-set run</EvidenceCite>). The
          earlier, narrower width (2^{FLOOD_ID2.beforeSigmaLog2}) already left{' '}
          {FLOOD_ID2.beforeBits} bits (<EvidenceCite of="gateF">earlier noise study</EvidenceCite>).
          So with these parameters flooded releases to third parties do not work. They need a larger
          scale and a larger first modulus, with security and bootstrapping parameters re-estimated.
          Releases to the owner, which are rounded and not flooded, are not affected.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          <strong>A second parameter set passes, by a thin margin:</strong> the limit is how precise
          one bootstrap can be, so the second set raises bootstrapping precision instead: two
          bootstraps per refresh (META-BTS, Bae, Cheon, Cho, Kim &amp; Kim, IACR ePrint 2022/1167)
          at scale 2^90, with the result released over two primes. Measured end to end on a Mac with
          the software token and the corrected width (σ = 2^{FLOOD_ID3.sigmaLog2}), a flooded
          release kept <strong>{FLOOD_ID3.depth0} bits</strong> straight after a refresh (
          <EvidenceCite of="metaBtsLmss">depth 0</EvidenceCite>),{' '}
          <strong>{FLOOD_ID3.depth1} bits</strong> after one multiplication (
          <EvidenceCite of="metaBtsLmssDepth1">depth 1</EvidenceCite>) and{' '}
          <strong>{FLOOD_ID3.depth3} bits</strong> after three (
          <EvidenceCite of="metaBtsLmssDepth3">depth 3</EvidenceCite>), against a bar of{' '}
          {GATE_F_BAR_BITS} bits. That is a margin of only about {FLOOD_ID3.margin} bits, and it is
          set by the paper’s exact sizing, not by rounding in our implementation. An unflooded owner
          release on this set keeps 31.0 bits (
          <EvidenceCite of="metaBtsOwner">owner run</EvidenceCite>). The set costs about twice the
          bootstrap time per refresh, 3 multiplications between refreshes instead of 9, and a 12 %
          larger key set. The default set stays in use for owner releases.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          <strong>On the boards too:</strong> with the token on the board and the release flooded at
          the corrected width, the MX95 Pro kept <strong>{FLOOD_ID3_BOARDS.mx95pro.depth0}</strong>{' '}
          / <strong>{FLOOD_ID3_BOARDS.mx95pro.depth1}</strong> /{' '}
          <strong>{FLOOD_ID3_BOARDS.mx95pro.depth3} bits</strong> (
          <EvidenceCite of="metaBtsLmssMx95pro">MX95 Pro</EvidenceCite>) and the MX95{' '}
          <strong>{FLOOD_ID3_BOARDS.mx95.depth0}</strong> /{' '}
          <strong>{FLOOD_ID3_BOARDS.mx95.depth1}</strong> /{' '}
          <strong>{FLOOD_ID3_BOARDS.mx95.depth3} bits</strong> (
          <EvidenceCite of="metaBtsLmssMx95">MX95</EvidenceCite>) at program depth 0 / 1 / 3, within{' '}
          {FLOOD_ID3_BOARDS.maxFromMacBits} bits of the Mac. The margin over the bar of{' '}
          {GATE_F_BAR_BITS} bits is therefore thin on every device, about {FLOOD_ID3.margin} bits.
          Each board generated the 4.41 GB key set of the second set in{' '}
          {FLOOD_ID3_BOARDS.mx95pro.generationSeconds} s (MX95 Pro) and{' '}
          {FLOOD_ID3_BOARDS.mx95.generationSeconds} s (MX95) (1,201 calls of 8 limbs, token peak{' '}
          {FLOOD_ID3_BOARDS.peakMiB} MiB) and streamed it to the Mac in{' '}
          {FLOOD_ID3_BOARDS.streamedSeconds.mx95pro} s and {FLOOD_ID3_BOARDS.streamedSeconds.mx95}{' '}
          s; every limb matched the reference spec (0 mismatches). The earlier board runs at the
          narrower width kept <em>{FLOOD_ID3.beforeMx95Pro}</em> and <em>{FLOOD_ID3.beforeMx95}</em>{' '}
          bits at depth 0 (<EvidenceCite of="metaBtsMx95pro">MX95 Pro</EvidenceCite>,{' '}
          <EvidenceCite of="metaBtsMx95">MX95</EvidenceCite>; superseded) and stay as records of
          that run. The board decrypts are functional, not a security claim.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          <strong>How the noise is drawn:</strong> {SAMPLER_SENTENCE}
        </p>
      </div>
    </div>
  </div>
)

/** Learn section 5: the FHE key set, who runs each operation, and how AES data gets into FHE. */
export const FheKeysOperationsSection: React.FC = () => (
  <div className="space-y-6 text-sm text-foreground/80">
    <KeyTakeaways items={TAKEAWAYS.keys} />

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
        Sizes depend heavily on the parameter set; measured values are marked. The public evaluation
        keys don&apos;t need to be secret, but they <em>encrypt functions of the secret key</em>, so
        they need <strong>integrity</strong>. There is no standard encoding yet: no PKCS#11 or KMIP
        object type and no X.509 OID. Each library serializes keys its own way, and a key is
        meaningless without its exact parameter set.
      </p>
      <p className="text-xs text-muted-foreground">
        No standard defines an FHE mechanism either. This lab&apos;s HSM therefore serves FHE key
        custody as vendor-defined PKCS#11 mechanisms, for key generation, public-key derivation and
        decryption, listed in its mechanism list and carried over KMIP&apos;s PKCS_11 operation. It
        offers no FHE encryption mechanism: the data owner encrypts under the public key itself (
        <EvidenceCite of="scoringX86VmKmip">CKKS run over KMIP</EvidenceCite>,{' '}
        <EvidenceCite of="tfheLoanKmip">TFHE run over KMIP</EvidenceCite>).
      </p>
    </div>

    <p className="text-xs text-muted-foreground">
      Which operation needs which of these keys, and who runs it, is listed per scheme in section 2,
      &ldquo;Operations each scheme supports&rdquo;.
    </p>

    {/* AES / transciphering */}
    <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Lock size={16} className="text-primary" />
        Does FHE work with AES?
      </h3>
      <p className="text-xs text-muted-foreground">
        Not directly. You can only compute on ciphertexts from a homomorphic scheme. An AES-GCM
        ciphertext has no structure a server can exploit, so you can&apos;t add two of them. The
        bridge is <strong>transciphering</strong>: the server runs the symmetric cipher&apos;s
        decryption inside FHE. TFHE-rs ships it for Kreyvium and AES-128-CTR (tfhe::transciphering);
        this workshop shows Kreyvium because it is cheaper:
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
        80-bit key is already below the 112-bit minimum, before Grover. Research pushes homomorphic
        AES further (IACR ePrint 2025/075 over TFHE and 2026/1209 over CKKS).
      </p>
    </div>
  </div>
)

/** Learn section 6: FHE against the quantum threat. */
export const FheQuantumSection: React.FC = () => (
  <div className="space-y-6 text-sm text-foreground/80">
    <KeyTakeaways items={TAKEAWAYS.quantum} />

    {/* Quantum exposure */}
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <AlertTriangle size={16} className="text-primary" />
        FHE against the quantum threat
      </h3>
      <p className="text-xs text-muted-foreground">
        Lattice FHE has <strong>no known quantum break</strong>. It rests on the (Ring-)Learning
        With Errors family behind ML-KEM; for a stated post-quantum level, pick parameters from the
        HE Standard&apos;s quantum tables (common defaults target classical 128-bit security). FHE
        schemes themselves are not NIST-standardized. An FHE <em>deployment</em> is a different
        matter, because the parts around the scheme are usually still classical:
      </p>
      <p className="text-xs text-muted-foreground">
        The UK ICO says the security of most HE schemes rests on hard mathematical problems
        &ldquo;that are currently considered to be secure even against quantum computers&rdquo;.
        NIST and the NSA make no such statement: NIST notes that &ldquo;FHE is not part of
        NIST-standards&rdquo;, and the NSA&apos;s CNSA 2.0 FAQ lists homomorphic encryption among
        areas with &ldquo;no generally approved solutions&rdquo; (section 7).
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
  </div>
)

/** Links from a Learn card to the two places its interactive view lives in the workshop. */
const LifecycleLinks: React.FC<{
  view: LifecycleView
  open?: OpenLifecycleView
  label: string
}> = ({ view, open, label }) =>
  open ? (
    <div className="flex flex-wrap items-center gap-2 pt-1" role="group" aria-label={label}>
      <span className="text-[11px] text-muted-foreground">Try it in the workshop:</span>
      <Button size="sm" variant="outline" onClick={() => open(view, 'concepts')}>
        Interactive view (step 2) <ArrowRight size={12} className="ml-1" />
      </Button>
      <Button size="sm" variant="outline" onClick={() => open(view, 'flows')}>
        Flow diagram (step 1) <ArrowRight size={12} className="ml-1" />
      </Button>
    </div>
  ) : null

/** Learn section 8: the HSM as FHE key custodian, its decryption policy and the decryption-oracle limitation. */
export const FheCustodySection: React.FC<{ onOpenLifecycleView?: OpenLifecycleView }> = ({
  onOpenLifecycleView,
}) => (
  <div className="space-y-6 text-sm text-foreground/80">
    <KeyTakeaways items={TAKEAWAYS.custody} />

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
            Target architecture: back up the seed (not GBs of keys) only HSM to HSM: a live clone to
            an authenticated peer, or an offline package that only an enrolled backup HSM can
            restore. Each HSM proves itself with a manufacturing → device → function certificate
            chain and fresh attestation evidence (draft-ietf-rats-pkix-key-attestation). The package
            is pure post-quantum at NIST Category 3: sealed to the recipient’s FIPS 203 ML-KEM-768
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
            <span className="text-status-warning font-bold">Yes, streamed:</span> evaluation-key
            generation. TFHE&apos;s 30 MB server key fits in one piece. A CKKS bootstrappable set
            (3.94 GB exported, measured) is too large to hold, so the HSM produces it as a stream of
            bounded calls with a token peak of 15–17 MiB, or up to 124 MiB when the token caches
            work between calls to go faster (below).
          </li>
          <li>
            <span className="text-status-error font-bold">No:</span> homomorphic evaluation and
            bootstrapping. They need GBs of keys in memory plus GPU or FPGA acceleration. They need
            no secret, so running them in the HSM would add nothing but load.
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          No standard PKCS#11 mechanism exists for any of this today, so this lab&apos;s HSM uses
          vendor-defined mechanisms, also reachable over KMIP (section 5).
        </p>
      </div>
    </div>

    <div
      id="fhe-security-model"
      className="bg-muted/50 rounded-lg p-4 border border-border space-y-2"
    >
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <ShieldCheck size={14} className="text-primary" />
        The security model as implemented in this lab&apos;s HSM
      </h3>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>
          <strong>Roles:</strong> FHE keys follow the normal PKCS#11 user and security-officer
          roles. Key generation, public-key derivation, attribute reads and decryption are user
          operations; there is no FHE-specific role, and so no separate decrypt role as the controls
          below recommend.
        </li>
        <li>
          <strong>Destroying a seed:</strong> FHE seeds are created with{' '}
          <span className="font-mono">CKA_DESTROYABLE = FALSE</span>, so only the security officer
          can destroy one, through a signed administrative request.
        </li>
        <li>
          <strong>Decryption budget:</strong> each decryption spends one unit of a counter fixed by
          the officer&apos;s enrolled decryption policy. A request refused after the role and key
          checks (a malformed ciphertext, a failed check on the result) spends a unit too; a wrong
          role or an unknown recipient is refused before the counter, and the size query spends
          none.
        </li>
        <li>
          <strong>Decryption calls:</strong> PKCS#11 single-part,{' '}
          <span className="font-mono">C_DecryptInit</span>, a size query, then{' '}
          <span className="font-mono">C_Decrypt</span>. Over KMIP each output took a median of 24.8
          ms (<EvidenceCite of="tfheLoanKmip">TFHE run over KMIP</EvidenceCite>).
        </li>
      </ul>
    </div>

    <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Cpu size={14} className="text-primary" />
        Streaming evaluation keys and Montgomery arithmetic
      </h3>
      <p className="text-xs text-muted-foreground">
        A CKKS evaluation key is a set of polynomials in residue (RNS) form. One{' '}
        <strong>limb</strong> is one residue polynomial: 2^16 coefficients of 8 bytes, 512 KB. A
        full-size key in Lattigo&apos;s default bootstrappable set has 5 digits of 30 limbs, so the
        51 keys hold 7,502 limbs of their <span className="font-mono">b</span> half (
        <EvidenceCite of="sizes">key-set sizes</EvidenceCite>). The other half,{' '}
        <span className="font-mono">a</span>, is public randomness that the receiver re-expands from
        a seed, so only <span className="font-mono">b</span> leaves the HSM.
      </p>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>
          <strong>One chunk, one call:</strong> each PKCS#11 call derives a range of limbs of one
          key digit (8 limbs, 4 MB, by default) as a public session object; the host reads it and
          destroys it, then asks for the next. The whole set takes 1,001 calls. No new PKCS#11
          functions are needed: a vendor mechanism and ordinary object reads, each object bounded.
        </li>
        <li>
          <strong>Bounded memory:</strong> the token holds one chunk at a time, so its peak stayed
          at 15–17 MiB on every device, against 17.2 GB for Lattigo generating and holding the whole
          set in one process. The faster version below also keeps caches, so its peak is 64.5–123.6
          MiB; it stays bounded whatever the size of the set.
        </li>
        <li>
          <strong>Determinism:</strong> each chunk depends only on the seed and on which key, digit
          and limbs were asked for, so any order, core or replica gives the same bytes. Every limb
          matched the reference spec, and the MX95 and MX95 Pro, loaded with the same test seed,
          produced identical key material (1,003 of 1,003 manifest entries; only the descriptor
          differs, by an identifier each token draws at random).
        </li>
        <li>
          <strong>Integrity:</strong> each chunk&apos;s SHA-256 goes into a manifest signed with the
          token&apos;s key. The receiver can check that it got the pieces the token signed; only a
          test decryption shows the keys encrypt the right secret.
        </li>
        <li>
          <strong>Montgomery arithmetic:</strong> the products of two variables (the random{' '}
          <span className="font-mono">a</span> times the secret in NTT form, the secret squared for
          relinearization, and <span className="font-mono">c1·s</span> in decryption) use Montgomery
          multiplication: values are kept as <span className="font-mono">x·2^64 mod q</span>, so
          each reduction is multiplications and a shift, with no division and no branch on secret
          data. The output stays in Montgomery and NTT form, which is Lattigo&apos;s own wire form,
          so the receiver uses the limbs as they arrive.
        </li>
      </ul>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-1.5 text-muted-foreground font-medium">Token on</th>
              <th className="text-left p-1.5 text-muted-foreground font-medium">
                Generate 3.94 GB
              </th>
              <th className="text-left p-1.5 text-muted-foreground font-medium">
                Streamed to the Mac
              </th>
              <th className="text-left p-1.5 text-muted-foreground font-medium">Token peak</th>
              <th className="text-left p-1.5 text-muted-foreground font-medium">
                Bootstrap with these keys (Mac M5 Max)
              </th>
              <th className="text-left p-1.5 text-muted-foreground font-medium">
                Decrypt on the token
              </th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {CKKS_STREAM_MEASURED.map((row) => (
              <tr key={row.device} className="border-b border-border/50 align-top">
                <td className="p-1.5 font-medium text-foreground">{row.device}</td>
                <td className="p-1.5">{row.generation}</td>
                <td className="p-1.5">{row.streamed}</td>
                <td className="p-1.5">{row.peak}</td>
                <td className="p-1.5">{row.bootstrap}</td>
                <td className="p-1.5">{row.decrypt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Single runs, 8 limbs per call unless noted, software token (an educational engine, not
        hardware custody). Files: <EvidenceCite of="macToken">Mac (M4 Pro)</EvidenceCite>,{' '}
        <EvidenceCite of="mx95">MX95</EvidenceCite>,{' '}
        <EvidenceCite of="mx95pro">MX95 Pro</EvidenceCite>,{' '}
        <EvidenceCite of="cachedMx95">MX95 cached</EvidenceCite>,{' '}
        <EvidenceCite of="cachedMx95pro">MX95 Pro cached</EvidenceCite>. The board decrypts are
        functional, not a security claim. The cached runs generate the set with the output discarded
        on the board; the streamed and bootstrap columns are from the first runs.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-1.5 text-muted-foreground font-medium">Chunk size</th>
              <th className="text-left p-1.5 text-muted-foreground font-medium">
                Mac (M4 Pro), one core
              </th>
              <th className="text-left p-1.5 text-muted-foreground font-medium">
                MX95, one Cortex-A55 core
              </th>
              <th className="text-left p-1.5 text-muted-foreground font-medium">
                MX95, one core, generator cached
              </th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {CKKS_CHUNK_SWEEP.map((row) => (
              <tr key={row.limbs} className="border-b border-border/50 align-top">
                <td className="p-1.5 font-medium text-foreground">{row.limbs}</td>
                <td className="p-1.5">{row.mac}</td>
                <td className="p-1.5">{row.mx95}</td>
                <td className="p-1.5">{row.mx95Cached}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        In the first version smaller chunks used less memory but cost more time: every call had a
        fixed cost of about 8 ms on the Mac and about 77 ms on a Cortex-A55, because the stateless
        design regenerated the secret for each call. Memory grows by about 1 MiB per extra limb. 8
        limbs per call is the default (sweeps: <EvidenceCite of="sweepMac">Mac</EvidenceCite>,{' '}
        <EvidenceCite of="sweepMx95">MX95</EvidenceCite>,{' '}
        <EvidenceCite of="sweepMx95pro">MX95 Pro</EvidenceCite>). Caching the generator in the token
        removes most of that fixed cost, so chunk size then barely changes the time (
        <EvidenceCite of="generatorCacheMx95">generator-cache sweep</EvidenceCite>).
      </p>
      <p className="text-xs text-muted-foreground">
        <strong>Faster generation, more token memory:</strong> the token now caches its expanded
        secret, the public NTT tables and the secret in NTT form between calls (wiped when the
        session closes, after 30 s idle or when the seed is destroyed), expands the public{' '}
        <span className="font-mono">a</span> with a faster AES-CTR keystream, and can spread the
        limbs of a call over the cores. The bytes do not change. One MX95 core then takes 213.8 s
        instead of 473.4 s (2.2 times faster), and six MX95 Pro cores take 84.0 s instead of 450.9 s
        on one core (5.4 times faster). The price is memory, and the expanded secret stays in token
        memory during an export: the peak rises to 64.5–123.6 MiB. Setting{' '}
        <span className="font-mono">PQC_CKKS_CACHE_MB=0</span> keeps the token at about 16 MiB at
        about twice the time.
      </p>
      <p className="text-xs text-muted-foreground">
        <strong>On the board the CPU is still the limit, not the network:</strong> the first version
        ran at 8.3 MB/s, about 7 % of a 1 Gb/s link, and sending the stream to the Mac over SSH
        added about 5 % to the generation time. The fastest board run, six MX95 Pro cores at 30
        limbs per call, reaches 54 MB/s, about half of a 1 Gb/s link.
      </p>
      <p className="text-xs text-muted-foreground">
        <strong>Over KMIP:</strong> with the token on the MX95 Pro reached over KMIP, the 4.41 GB
        key set of the second parameter set went out in 1,201 bounded calls in 197 s (22.4 MB/s),
        with 0 manifest mismatches (<EvidenceCite of="scoringX86VmKmip">KMIP run</EvidenceCite>).
        This is a separate measurement, not a comparison with the SSH-stream figures above: the
        parameter set, the token&apos;s settings and the transport all differ, and each is one run,
        so it does not show KMIP to be slower or faster.
      </p>
    </div>

    <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Lock size={14} className="text-primary" />
        The HSM decryption policy: what the pqctoday HSM simulation makes configurable
      </h3>
      <p className="text-xs text-muted-foreground">
        In the pqctoday HSM simulation (an educational engine), the security officer enrolls an
        immutable FHE decryption policy bound to each FHE key seed. Version 1 is for TFHE; version 2
        adds a CKKS block.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-1.5 text-muted-foreground font-medium">Parameter</th>
              <th className="text-left p-1.5 text-muted-foreground font-medium">Applies to</th>
              <th className="text-left p-1.5 text-muted-foreground font-medium">What it does</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {FHE_POLICY_PARAMS.map((row) => (
              <tr key={row.param} className="border-b border-border/50 align-top">
                <td
                  className={`p-1.5 font-medium text-foreground ${row.scope.startsWith('CKKS') ? 'font-mono' : ''}`}
                >
                  {row.param}
                </td>
                <td className="p-1.5">{row.scope}</td>
                <td className="p-1.5">{row.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>
          <strong>CKKS:</strong> the release is decoded inside the token and rounded. With at most{' '}
          <span className="font-mono">maxValues</span> slots, each with a real and an imaginary
          part, a crafted request can learn at most about{' '}
          <span className="font-mono">maxValues × 2 × (precisionBits + valueBoundLog2 + 1)</span>{' '}
          bits per release. This is how the policy bounds what one release reveals, not a security
          proof.
        </li>
        <li>
          <strong>TFHE:</strong> the policy has no noise setting, because decryption is exact; it
          limits what is released, to whom and how often.
        </li>
        <li>
          <strong>Replication:</strong> when a key is replicated to another HSM, its policy can only
          be narrowed, never widened, and flooding cannot be switched off. A copy of a CKKS key must
          also keep the same replica limit as its source, so every copy computes the same flood
          width.
        </li>
      </ul>
    </div>

    <div className="bg-warning/10 rounded-lg p-4 border border-warning/30 space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <AlertTriangle size={14} className="text-status-warning" />
        The decryption-oracle limitation
      </h3>
      <p className="text-xs text-muted-foreground">
        Decryption computes <span className="font-mono">c0 + c1·s</span> on whatever ciphertext it
        receives, and it cannot tell a genuine result from a crafted input. So an{' '}
        <strong>
          unrestricted or insufficiently checked decryption interface can become a key-recovery
          oracle
        </strong>
        . In CKKS one crafted request is enough: <span className="font-mono">c0 = 0, c1 = Δ</span>{' '}
        returns <span className="font-mono">Δ·s</span>. In exact schemes such as TFHE, BFV and BGV
        the key comes out bit by bit over many requests (Loftus et al. 2010; Chenal &amp; Tang
        2014). A crafted input need not look odd: a fresh encryption of a known value plus a small,
        shaped change looks uniform and in range.
      </p>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>
          <strong>Crafted inputs (chosen-ciphertext):</strong> inherent to FHE, which is malleable
          by design. The token decrypts what it is given.
        </li>
        <li>
          <strong>Passive:</strong> decrypted CKKS results leak the key even when every computation
          was honest, if people other than the key owner see them (Li &amp; Micciancio 2021). Exact
          schemes leak the same way through decryption failures when the failure probability is not
          negligible (Cheon et al. 2024; Checri et al. 2024).
        </li>
      </ul>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-md border border-border bg-background/60 p-3">
          <div className="text-xs font-bold text-foreground mb-1">Cannot exploit it</div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>The FHE server: it computes on ciphertexts but has no token session.</li>
            <li>Someone who steals the token&apos;s storage, without a session on the token.</li>
          </ul>
        </div>
        <div className="rounded-md border border-border bg-background/60 p-3">
          <div className="text-xs font-bold text-foreground mb-1">Can exploit it</div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              Any caller allowed to decrypt: the owner&apos;s application, or whoever compromises
              it.
            </li>
            <li>For the passive variant: anyone who sees unprotected CKKS results.</li>
          </ul>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        <strong>Detection</strong> catches only careless attempts: a constant or low-entropy{' '}
        <span className="font-mono">c1</span>, out-of-range values, near-duplicate inputs, unusual
        request rates. A careful crafted request looks exactly like a genuine one, so detection is
        an audit alarm, not the protection. Only cryptographic provenance of the input can tell the
        two apart (see the research mitigations below).
      </p>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          <strong>Single-HSM decryption</strong>, the default in this module, trusts every caller
          allowed to decrypt. The token protects the key from the FHE server and from theft of its
          storage, not from an authorized caller, so the key is only as protected as every path that
          can submit a decryption request. A deployment therefore adds compensating logical and
          physical controls; they are part of the security model.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-1.5 text-muted-foreground font-medium">Area</th>
                <th className="text-left p-1.5 text-muted-foreground font-medium">Control</th>
                <th className="text-left p-1.5 text-muted-foreground font-medium">
                  What it limits
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {DECRYPT_CONTROLS.map((row) => (
                <tr key={row.area} className="border-b border-border/50 align-top">
                  <td className="p-1.5 font-medium text-foreground">{row.area}</td>
                  <td className="p-1.5">{row.control}</td>
                  <td className="p-1.5">{row.limits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground">
          The educational software token used in the workshop has no tamper resistance, so on a
          board these controls have to cover the host it runs on as well.
        </p>
      </div>
      <div>
        <div className="text-xs font-bold text-foreground mb-1">Mitigations from research</div>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>
            <strong>Rounding</strong> released CKKS values to a fixed precision removes the
            low-order bits that carry the leak (listed as a countermeasure by Li &amp; Micciancio
            2021).
          </li>
          <li>
            <strong>Noise flooding</strong> before a CKKS result is released (Li, Micciancio,
            Schultz &amp; Sorrell 2022; OpenFHE{' '}
            <span className="font-mono">NOISE_FLOODING_DECRYPT</span>
            ), sized from noise estimates such as Bossuat et al. 2024. It costs precision.
          </li>
          <li>
            <strong>Negligible decryption-failure probability</strong> for exact schemes (BFV, BGV,
            TFHE), rather than heuristic correctness (Cheon et al. 2024).
          </li>
          <li>
            <strong>Threshold decryption</strong>: no single token can decrypt (see below).
          </li>
          <li>
            <strong>Zero-knowledge proofs that inputs are well formed</strong>, as in Zama&apos;s
            fhEVM, and <strong>verifiable FHE</strong> (Manulis &amp; Nguyen 2024): research
            directions that would let each HSM refuse ciphertexts it cannot verify.
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-1">
          Rounding and flooding reduce and bound what each release reveals; repeated crafted
          requests from an allowed caller can still add up, which is why the controls above stay in
          place.
        </p>
      </div>
    </div>

    <div
      id="fhe-key-rotation"
      className="bg-muted/50 rounded-lg p-4 border border-border space-y-2"
    >
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <KeyRound size={14} className="text-primary" />
        Key rotation without decrypting stored data
      </h3>
      <p className="text-xs text-muted-foreground">
        After an incident the response is to stop decryption and move to a new key. Decrypting every
        stored ciphertext and encrypting it again would send the data through the path under
        suspicion. Instead the token streams one key-switching key from the old secret to the new
        one, and the FHE server applies it to each stored ciphertext; no plaintext appears.
      </p>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>
          <strong>Size:</strong> stored ciphertexts sit at the lower levels left after
          bootstrapping, so the key is 31.5 MB (15.7 MB streamed, 4 calls), not the 157 MB of a
          bootstrapping-level key. Its bytes matched Lattigo&apos;s own rebuild.
        </li>
        <li>
          <strong>Precision:</strong> a switched ciphertext keeps 27.1–27.3 bits, against 28.6–28.7
          bits before, and no longer decrypts under the old key. One switch took 10–37 ms on the
          Mac.
        </li>
        <li>
          <strong>Rules in the pqctoday HSM simulation:</strong> only the security officer can run
          it; the new seed must be generated by the token, never chosen or imported by the caller,
          because a switching key toward a secret the caller knows hands over the old secret; and
          the old seed is retired only after the rotation manifest is signed.
        </li>
        <li>
          <strong>Limits:</strong> the new key set (3.94 GB) must still be streamed. Rotation
          protects data from then on; it does not make old copies of ciphertexts safe from someone
          who already holds the old secret.
        </li>
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Measured with the software token in a container on a Mac, not on a board (
        <EvidenceCite of="rotation">rotation run</EvidenceCite>).
      </p>
      <LifecycleLinks
        view="rotation"
        open={onOpenLifecycleView}
        label="Open the key-rotation view in the workshop"
      />
    </div>

    <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <KeyRound size={14} className="text-primary" />
        Threshold decryption: value and limits
      </h3>
      <p className="text-xs text-muted-foreground">
        The secret key is split into shares held by independently authorized HSMs. Each computes a
        flooded partial decryption under its own checks, budget, audit and approval, and the result
        appears only when enough parties answer. It removes the single point of trust of single-HSM
        decryption, at the costs listed here.
      </p>
      <p className="text-xs text-muted-foreground">
        <strong>Two tokens, 2-of-2, for CKKS:</strong> feasible. A Lattigo prototype with both
        parties in one process generated the whole bootstrappable key set from two shares at the
        real parameters, and one share alone does not decrypt (
        <EvidenceCite of="threshold">threshold study</EvidenceCite>). Each token could stream its
        share in the same chunk format as today for 50 of the 51 keys. Its value is that one stolen
        or compromised token is no longer enough; it does not protect against a crafted request sent
        to one token, and it does not fix flooding for third parties at the default parameters.
      </p>
      <LifecycleLinks
        view="shared"
        open={onOpenLifecycleView}
        label="Open the shared-decryption view in the workshop"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-1.5 text-muted-foreground font-medium" />
              <th className="text-left p-1.5 text-muted-foreground font-medium">Value</th>
              <th className="text-left p-1.5 text-muted-foreground font-medium">Limit</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {THRESHOLD_VALUE_LIMITS.map((row) => (
              <tr key={row.topic} className="border-b border-border/50 align-top">
                <td className="p-1.5 font-medium text-foreground">{row.topic}</td>
                <td className="p-1.5">{row.value}</td>
                <td className="p-1.5">{row.limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)

/** Learn section 9: open-source implementations of the draft schemes. */
export const FheImplementationsSection: React.FC<{ onOpenLifecycleView?: OpenLifecycleView }> = ({
  onOpenLifecycleView,
}) => (
  <div className="space-y-6 text-sm text-foreground/80">
    <KeyTakeaways items={TAKEAWAYS.implementations} />

    {/* Implementations */}
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Server size={16} className="text-primary" />
        Open-source implementations of the ISO/IEC 28033 draft schemes
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-muted-foreground font-medium">Library</th>
              <th className="text-left p-2 text-muted-foreground font-medium">Version</th>
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
                <td className="p-2 text-muted-foreground whitespace-nowrap">
                  <div>Current: {lib.currentVersion}</div>
                  <div className="text-[10px]">
                    Tested: {lib.testedVersion ?? 'not tested here'}
                  </div>
                  <div className="text-[10px]">Checked {lib.checkedOn}</div>
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

    <div
      id="fhe-reference-runs"
      className="bg-muted/50 rounded-lg p-4 border border-border space-y-2"
    >
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <ShieldCheck size={14} className="text-primary" />
        Checking our numbers against other libraries
      </h3>
      <p className="text-xs text-muted-foreground">
        The workshop&apos;s CKKS measurements use Lattigo. We also ran three other libraries to see
        what carries over (2026-10-10 and 2026-10-11, single runs):
      </p>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>
          <strong>OpenFHE v1.6.0 CKKS</strong> (
          <EvidenceCite of="openfhe">OpenFHE run</EvidenceCite>): at N = 2^16, the settings closest
          to Lattigo&apos;s default set that pass OpenFHE&apos;s own 128-bit check give 80 keys and
          13.26 GB (51 keys and 7.87 GB in Lattigo), and one bootstrap keeps 13.3 bits. That run
          counted one test rotation; the keys bootstrapping needs are 79, 13.09 GB. Keys in
          Lattigo&apos;s layout, made by Lattigo&apos;s key generator for OpenFHE&apos;s secret and
          primes, ran in OpenFHE through a format bridge with the same precision as OpenFHE&apos;s
          own keys, bootstrapping included. The HSM&apos;s default key set uses Lattigo&apos;s
          primes and key list, which OpenFHE cannot use; a parameter set built from OpenFHE&apos;s
          own settings now can (below, including a two-round refresh that reaches about 32 bits
          where one round keeps about 13).
        </li>
        <li>
          <strong>Microsoft SEAL v4.1.2 CKKS</strong> (
          <EvidenceCite of="seal">SEAL run</EvidenceCite>): SEAL publishes no CKKS test vectors, so
          we made a seeded set with SEAL. Lattigo decrypted all 7 of its ciphertexts to the same
          plaintexts, coefficient for coefficient, and SEAL&apos;s converted keys worked in Lattigo.
          SEAL has no CKKS bootstrapping.
        </li>
        <li>
          <strong>TFHE-rs 1.8.1 published test vectors</strong> (
          <EvidenceCite of="tfheVectors">test-vector run</EvidenceCite>): 28 of 36 files are
          byte-identical to upstream on the Mac, the MX95 and the MX95 Pro. The other 8 are FFT
          blind-rotation outputs, which upstream says depend on the platform: they differ from
          upstream&apos;s bytes, are identical across our platforms and decrypt to the expected
          messages.
        </li>
      </ul>
      <p className="text-xs text-muted-foreground">
        Our own two Lattigo reference runs, key rotation without decryption and 2-of-2 shared
        decryption, are interactive in the workshop, with their measured numbers.
      </p>
      {onOpenLifecycleView && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Open the reference-run views in the workshop"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenLifecycleView('rotation', 'concepts')}
          >
            Key rotation view <ArrowRight size={12} className="ml-1" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenLifecycleView('shared', 'concepts')}
          >
            Shared decryption view <ArrowRight size={12} className="ml-1" />
          </Button>
        </div>
      )}
    </div>

    <div
      id="fhe-openfhe-export"
      className="bg-muted/50 rounded-lg p-4 border border-border space-y-2"
    >
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <KeyRound size={14} className="text-primary" />
        The HSM&apos;s own key set, used by OpenFHE
      </h3>
      <p className="text-xs text-muted-foreground">
        A third CKKS parameter set in the token takes its primes, digits and key list from OpenFHE
        v1.6.0 at the settings that pass OpenFHE&apos;s 128-bit check (N = 2^16). The token streams
        the keys out as it does for the other sets, and OpenFHE uses them as they are: no format
        bridge and no keys of its own.
      </p>
      <FactsTable rows={OPENFHE_EXPORT_ROWS} />
      <p className="text-xs text-muted-foreground">
        <strong className="text-foreground">On the boards:</strong> {OPENFHE_EXPORT_BOARDS_SENTENCE}{' '}
        (<EvidenceCite of="openfheSetMx95">MX95</EvidenceCite>,{' '}
        <EvidenceCite of="openfheSetMx95pro">MX95 Pro</EvidenceCite>).
      </p>
      <p className="text-xs text-muted-foreground">
        <strong className="text-foreground">Refreshing twice:</strong> {OPENFHE_ITERATIVE_INTRO} (
        <EvidenceCite of="openfheIterative">run of 2026-10-15, on a Mac</EvidenceCite>):
      </p>
      <FactsTable rows={OPENFHE_ITERATIVE_ROWS} />
      <p className="text-xs text-muted-foreground">{OPENFHE_EXPORT_LIMITS}</p>
      <p className="text-[11px] text-muted-foreground">
        Merged: {OPENFHE_EXPORT_REFS.map(citeMerged).join('; ')}.
      </p>
    </div>

    <div
      id="fhe-compute-service"
      className="bg-muted/50 rounded-lg p-4 border border-border space-y-2"
    >
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Server size={14} className="text-primary" />
        An encrypted risk-scoring service
      </h3>
      <p className="text-xs text-muted-foreground">
        The whole pattern in one place: the data owner&apos;s keys come from the token, a service
        that never holds a secret key scores encrypted customer records, and only the owner reads
        the result. It is a reference service for learning, built and measured on a Mac, then run on
        an x86-64 virtual machine and on an MX95 Pro board.
      </p>
      <FactsTable rows={COMPUTE_SERVICE_ROWS} />
      <p className="text-xs text-muted-foreground">
        <strong className="text-foreground">On other machines:</strong>{' '}
        {COMPUTE_SERVICE_MACHINES_INTRO} (
        <EvidenceCite of="scoringX86Vm">virtual machine run</EvidenceCite>,{' '}
        <EvidenceCite of="scoringMx95pro">MX95 Pro run</EvidenceCite>,{' '}
        <EvidenceCite of="scoringX86VmKmip">run with the token over KMIP</EvidenceCite>):
      </p>
      <FactsTable rows={COMPUTE_SERVICE_MACHINE_ROWS} />
      <p className="text-xs text-muted-foreground">{COMPUTE_SERVICE_MACHINES_SAME_RESULT}</p>
      <p className="text-xs text-muted-foreground">{COMPUTE_SERVICE_LIMITS}</p>
      <p className="text-[11px] text-muted-foreground">
        Merged: {citeMerged(COMPUTE_SERVICE_REF)}; {citeMerged(COMPUTE_SERVICE_RUNS_REF)};{' '}
        {citeMerged(COMPUTE_SERVICE_KMIP_REF)}. The custodian of the first virtual machine run and
        the board run was built from pqctoday-hsm main at {COMPUTE_SERVICE_RUNS_CUSTODIAN_COMMIT}.
      </p>
    </div>

    <div id="fhe-tfhe-loan" className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Server size={14} className="text-primary" />
        TFHE: an encrypted loan pre-qualification
      </h3>
      <p className="text-xs text-muted-foreground">
        The same pattern with TFHE&apos;s exact integers: a compute service on an x86-64 virtual
        machine pre-qualifies encrypted loan applications, the token on the MX95 Pro holds the keys
        and is reached over KMIP, and the data owner on a Mac encrypts and reads the results (
        <EvidenceCite of="tfheLoanKmip">loan run</EvidenceCite>):
      </p>
      <FactsTable rows={TFHE_LOAN_ROWS} />
      <p className="text-xs text-muted-foreground">{TFHE_LOAN_LIMITS}</p>
      <p className="text-[11px] text-muted-foreground">Merged: {citeMerged(TFHE_LOAN_REF)}.</p>
    </div>
  </div>
)

/** Two-column table of measured facts for the section 9 reference boxes. */
// Below the sm breakpoint each row stacks (topic above value): a table with a no-wrap topic column
// leaves a phone-width value column a few words wide, scrolled sideways.
const FactsTable: React.FC<{ rows: { topic: string; value: string }[] }> = ({ rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs block sm:table">
      <tbody className="text-muted-foreground block sm:table-row-group">
        {rows.map((row) => (
          <tr key={row.topic} className="border-b border-border/50 align-top block sm:table-row">
            <td className="p-1.5 pb-0 sm:pb-1.5 font-medium text-foreground sm:whitespace-nowrap block sm:table-cell">
              {row.topic}
            </td>
            <td className="p-1.5 block sm:table-cell">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
