// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { LearnStepper } from '@/components/PKILearning/LearnStepper'
import { Button } from '@/components/ui/button'

interface SLHDSAIntroductionProps {
  onNavigateToWorkshop: () => void
}

// ─── Step 1: Overview & Why Stateless ────────────────────────────────────────

const Step1Overview: React.FC = () => (
  <div className="space-y-8 w-full">
    <section className="glass-panel p-6 space-y-4">
      <h2 className="text-xl font-bold text-foreground">What is SLH-DSA?</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        SLH-DSA (Stateless Hash-Based Digital Signature Algorithm) is the NIST-standardized
        post-quantum signature scheme published as{' '}
        <strong className="text-foreground">FIPS 205</strong> in August 2024. It is the standardized
        form of SPHINCS+, the hash-based signature scheme selected by NIST in Round 3 of the PQC
        competition.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Its security rests entirely on the collision resistance and preimage resistance of the
        underlying hash function —{' '}
        <strong className="text-foreground">no new hardness assumptions</strong> beyond what we
        already rely on for HMAC and TLS.
      </p>
    </section>

    <section className="glass-panel p-6 space-y-4">
      <h2 className="text-xl font-bold text-foreground">
        Stateless vs Stateful: The Key Difference
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-status-error/5 border border-status-error/20 rounded-lg p-4 space-y-2">
          <div className="font-semibold text-status-error text-sm">Stateful (LMS / XMSS)</div>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Each signing operation consumes a one-time key leaf</li>
            <li>Signing state (leaf index) must be persisted and never reused</li>
            <li>Key exhaustion = catastrophic failure (no more valid signatures)</li>
            <li>Cannot be used in stateless or distributed environments safely</li>
            <li>Standardized in NIST SP 800-208 / RFC 8554 / RFC 8391</li>
          </ul>
        </div>
        <div className="bg-status-success/5 border border-status-success/20 rounded-lg p-4 space-y-2">
          <div className="font-semibold text-status-success text-sm">Stateless (SLH-DSA)</div>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
            <li>No per-key leaf counter; this does not mean unlimited signatures</li>
            <li>No persistent state to manage, back up, or synchronize</li>
            <li>Safe for serverless, distributed, and HSM-pooled environments</li>
            <li>Randomized by default (opt_rand from RNG prevents fault attacks)</li>
            <li>Standardized in FIPS 205 (Aug 2024)</li>
          </ul>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        For the 12 parameter sets in{' '}
        <a href="https://doi.org/10.6028/NIST.FIPS.205" className="text-primary underline">
          FIPS 205 §11
        </a>
        , the security claims assume at most 2^64 messages signed with one key pair. This is a limit
        assumed by the security analysis, not a leaf counter that must be saved after every
        signature as in LMS or XMSS. It does not predict an immediate failure on the next signature
        beyond that limit. Keep planned use within this bound. For scale, even one billion
        signatures per second with the same key would take about 585 years to reach 2^64.
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Technical enforcement is a separate challenge: a counter on one HSM does not account for
        signatures made by other copies of the same key. An exact cutoff would need coordinated
        accounting across devices and protection against resetting the count through backup restore
        or rollback. This lesson does not establish that an HSM counts these signatures or enforces
        a cutoff. A practical planning approach is to bound total signing volume across all key
        copies over the key lifetime and keep it far below the analysis limit. This is not a
        recommendation to add an LMS/XMSS-style per-signature counter to SLH-DSA.
      </p>
      <div className="rounded-lg border border-border p-4 space-y-2 text-xs text-muted-foreground">
        <h3 className="font-semibold text-foreground">
          Practical example: organizational controls
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Set a maximum signing-key lifetime and rotate keys on schedule.</li>
          <li>Record where each key is deployed, including copies and backups.</li>
          <li>
            Estimate total signing volume across all deployments over that lifetime, with a generous
            safety margin. Revisit the estimate when volume or deployments change.
          </li>
          <li>
            Preserve the original key&apos;s retirement date when restoring a backup: restoring the
            same key does not start a new usage lifetime.
          </li>
        </ul>
        <p>
          These controls support a documented estimate that expected use stays far below the
          analysis bound. They do not enforce an exact signature count. This is a practical planning
          example, not a claim that FIPS 205 prescribes this checklist or that it alone establishes
          certification compliance.
        </p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The tradeoff: SLH-DSA signatures are significantly larger (8–50 KB vs LMS ~1–4 KB) and
        signing is slower due to the hypertree traversal. For most applications the stateless safety
        is worth it.
      </p>
    </section>

    <section className="glass-panel p-6 space-y-3">
      <h2 className="text-xl font-bold text-foreground">Deployment Context</h2>
      <div className="grid sm:grid-cols-3 gap-3 text-xs">
        {[
          {
            title: 'Good fit',
            items: [
              'Code signing',
              'Certificate issuance',
              'Firmware attestation',
              'Long-lived root CAs',
              'Low-frequency signing',
            ],
            color: 'text-status-success',
          },
          {
            title: 'Consider carefully',
            items: [
              'High-throughput APIs (signing speed)',
              'Bandwidth-constrained channels (sig size)',
              'TLS handshakes (latency)',
            ],
            color: 'text-status-warning',
          },
          {
            title: 'Prefer ML-DSA instead',
            items: [
              'Real-time signing (e.g. TLS)',
              'IoT with tiny payloads',
              'Interactive protocols requiring small sigs',
            ],
            color: 'text-status-error',
          },
        ].map((col) => (
          <div key={col.title} className="bg-muted/40 rounded-lg p-3 space-y-2">
            <div className={`font-semibold ${col.color}`}>{col.title}</div>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
              {col.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  </div>
)

// ─── Step 2: WOTS+, FORS & Hypertree Architecture ───────────────────────────

const Step2Internals: React.FC = () => (
  <div className="space-y-8 w-full">
    <section className="glass-panel p-6 space-y-4">
      <h2 className="text-xl font-bold text-foreground">
        FIPS 205 §3–5: The Three Building Blocks
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        SLH-DSA stacks three primitives. Understanding them explains why signatures are large, why
        some parameter sets are slow, and what&apos;s actually inside a 7,856-byte signature.
      </p>
    </section>

    <section className="glass-panel p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
          1
        </span>
        <h3 className="font-bold text-foreground">WOTS+ — Winternitz One-Time Signature (§4)</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        WOTS+ signs a single <em>n</em>-byte hash value by representing it as a sequence of base-
        <em>w</em> digits and computing a hash chain of length up to <em>w</em> for each digit. The
        signer walks <em>down</em> the chain (easy); the verifier walks <em>up</em> (also easy);
        forging requires inverting the hash (infeasible).
      </p>
      <div className="bg-muted/40 rounded-lg p-4 text-xs font-mono space-y-1 text-muted-foreground">
        <div>sk_i → H(sk_i) → H²(sk_i) → … → Hʷ(sk_i) = pk_i</div>
        <div className="text-muted-foreground mt-1">
          Sign digit d: output chain[d]. Verify: apply w−d more hashes and compare to pk_i.
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-muted/40 rounded p-3 space-y-1">
          <div className="font-semibold text-foreground">lg_w = 4 (all FIPS 205 sets)</div>
          <p className="text-muted-foreground leading-relaxed">
            Winternitz parameter <em>w = 2^lg_w = 16</em>. Each WOTS+ digit is 4 bits. Larger{' '}
            <em>w</em> → fewer chains needed → smaller sig, but each chain is longer → slower.
          </p>
        </div>
        <div className="bg-muted/40 rounded p-3 space-y-1">
          <div className="font-semibold text-foreground">One-time property</div>
          <p className="text-muted-foreground leading-relaxed">
            WOTS+ is one-time: signing two different messages with the same key leaks the private
            key. SLH-DSA solves this by using each WOTS+ key exactly once via the hypertree.
          </p>
        </div>
      </div>
    </section>

    <section className="glass-panel p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
          2
        </span>
        <h3 className="font-bold text-foreground">FORS — Forest of Random Subsets (§5.1)</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        FORS is a <em>few-time</em> signature scheme. It holds <em>k</em> binary trees each of
        height <em>a</em>, giving <em>k × 2^a</em> leaf secret values. To sign, the message digest
        selects one leaf per tree; the signature reveals those leaves plus authentication paths.
      </p>
      <div className="grid sm:grid-cols-3 gap-3 text-xs">
        {[
          { param: 'k', role: 'Number of FORS trees', example: 'SHA2-128s: k=14' },
          { param: 'a', role: 'Height of each tree', example: 'SHA2-128s: a=12 → 4,096 leaves' },
          { param: 'k × a', role: 'Bits of the message index', example: '14 × 12 = 168 bits' },
        ].map((row) => (
          <div key={row.param} className="bg-muted/40 rounded p-3 space-y-1">
            <div className="font-mono font-bold text-primary">{row.param}</div>
            <div className="text-muted-foreground leading-relaxed">{row.role}</div>
            <div className="text-muted-foreground">{row.example}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        FORS provides <em>few-time</em> security: revealing up to <em>q</em> signatures is safe as
        long as <em>k</em> and <em>a</em> are chosen so that the probability of a collision in any
        tree position is negligible. FORS signs the message digest and produces a FORS public key,
        which is then signed by the hypertree.
      </p>
    </section>

    <section className="glass-panel p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
          3
        </span>
        <h3 className="font-bold text-foreground">HT — Hypertree (§5.2)</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        The hypertree is a <em>d</em>-layer stack of XMSS trees, each of height <em>h/d</em>. Each
        layer authenticates the root of the layer below using a WOTS+ signature. The top root is the
        SLH-DSA public key.
      </p>
      <div className="bg-muted/40 rounded-lg p-4 text-xs font-mono space-y-1 text-muted-foreground">
        <div>PK.root (layer d−1 XMSS root)</div>
        <div className="pl-4">↑ signed by WOTS+ at layer d−1</div>
        <div className="pl-4">layer d−2 XMSS root</div>
        <div className="pl-8">↑ signed by WOTS+ at layer d−2</div>
        <div className="pl-8">…</div>
        <div className="pl-8">layer 0 XMSS root</div>
        <div className="pl-12">↑ signed by WOTS+ at layer 0</div>
        <div className="pl-12">FORS public key</div>
        <div className="pl-16">↑ signed by FORS</div>
        <div className="pl-16">message M</div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-muted/40 rounded p-3 space-y-1">
          <div className="font-semibold text-foreground">-s variants (small, slow)</div>
          <p className="text-muted-foreground leading-relaxed">
            Fewer layers (<em>d</em> small, e.g. 7) and taller per-layer trees (<em>h/d</em> large,
            e.g. 9). Each XMSS tree has more leaves → longer authentication paths → smaller total
            signature but more hash rounds to traverse per tree.
          </p>
        </div>
        <div className="bg-muted/40 rounded p-3 space-y-1">
          <div className="font-semibold text-foreground">-f variants (fast, large)</div>
          <p className="text-muted-foreground leading-relaxed">
            More layers (<em>d</em> large, e.g. 22) and shorter per-layer trees (<em>h/d</em>
            small, e.g. 3). Each XMSS tree is shallow → fast traversal per layer, but the additional
            WOTS+ signatures for each extra layer add to signature size.
          </p>
        </div>
      </div>
    </section>

    <section className="glass-panel p-6 space-y-3">
      <h3 className="font-bold text-foreground">What&apos;s Inside a Signature?</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        A SHA2-128s signature (7,856 B) contains: randomness R (16 B) + FORS signature (k × (a+1) ×
        n B) + HT signature (d × WOTS+_sig + auth_path per layer). The dominant cost is the FORS
        trees + HT auth paths, all scaled by <em>n</em> (hash output size in bytes).
      </p>
    </section>
  </div>
)

// ─── Step 3: Parameter Sets & Tradeoffs ──────────────────────────────────────

const PARAM_TABLE = [
  {
    id: 'SHA2-128s',
    n: 16,
    h: 63,
    d: 7,
    hp: 9,
    a: 12,
    k: 14,
    sig: 7856,
    nist: 1,
    note: 'Smallest sig',
  },
  {
    id: 'SHA2-128f',
    n: 16,
    h: 66,
    d: 22,
    hp: 3,
    a: 6,
    k: 33,
    sig: 17088,
    nist: 1,
    note: 'Fastest sign',
  },
  {
    id: 'SHA2-192s',
    n: 24,
    h: 63,
    d: 7,
    hp: 9,
    a: 14,
    k: 17,
    sig: 16224,
    nist: 3,
    note: 'Smallest sig',
  },
  {
    id: 'SHA2-192f',
    n: 24,
    h: 66,
    d: 22,
    hp: 3,
    a: 8,
    k: 33,
    sig: 35664,
    nist: 3,
    note: 'Fastest sign',
  },
  {
    id: 'SHA2-256s',
    n: 32,
    h: 64,
    d: 8,
    hp: 8,
    a: 14,
    k: 22,
    sig: 29792,
    nist: 5,
    note: 'Smallest sig',
  },
  {
    id: 'SHA2-256f',
    n: 32,
    h: 68,
    d: 17,
    hp: 4,
    a: 9,
    k: 35,
    sig: 49856,
    nist: 5,
    note: 'Fastest sign',
  },
]

const Step3Parameters: React.FC = () => (
  <div className="space-y-8 w-full">
    <section className="glass-panel p-6 space-y-4">
      <h2 className="text-xl font-bold text-foreground">FIPS 205 §6 — Parameter Sets</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        FIPS 205 defines 12 parameter sets (6 SHA-2 variants shown, each has a SHAKE counterpart
        with identical parameters). Every set uses{' '}
        <strong className="text-foreground">lg_w = 4</strong> (Winternitz parameter w = 16).
      </p>
      <div
        className="overflow-x-auto"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; making a scrollable region focusable is axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
        tabIndex={0}
        role="region"
        aria-label="FIPS 205 parameter sets"
      >
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              {['Param set', 'n', 'h', 'd', 'h/d', 'a', 'k', 'Sig (B)', 'NIST', 'Note'].map(
                (col) => (
                  <th key={col} className="text-left px-2 py-2 font-medium whitespace-nowrap">
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {PARAM_TABLE.map((row, i) => (
              <tr key={row.id} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                <td className="px-2 py-1.5 font-mono text-primary font-semibold whitespace-nowrap">
                  {row.id}
                </td>
                <td className="px-2 py-1.5 font-mono">{row.n}</td>
                <td className="px-2 py-1.5 font-mono">{row.h}</td>
                <td className="px-2 py-1.5 font-mono">{row.d}</td>
                <td className="px-2 py-1.5 font-mono">{row.hp}</td>
                <td className="px-2 py-1.5 font-mono">{row.a}</td>
                <td className="px-2 py-1.5 font-mono">{row.k}</td>
                <td className="px-2 py-1.5 font-mono">{row.sig.toLocaleString()}</td>
                <td className="px-2 py-1.5 font-mono">{row.nist}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        SHAKE variants (SHAKE-128s/f, SHAKE-192s/f, SHAKE-256s/f) use identical (n,h,d,a,k) values
        but replace SHA-2 with SHAKE-256 as the tree hash function.
      </p>
    </section>

    <section className="glass-panel p-6 space-y-4">
      <h3 className="font-bold text-foreground">SHA-2 vs SHAKE — Which to Choose?</h3>
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <div className="font-semibold text-foreground">SHA-2 variants (SHA2-*)</div>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Use SHA-256 / SHA-512 as tree hash function</li>
            <li>Faster on hardware without SHA-3 / SHAKE acceleration</li>
            <li>Widest hardware support (existing HSMs, Intel SHA-NI)</li>
            <li>Good default for most deployments today</li>
          </ul>
        </div>
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <div className="font-semibold text-foreground">SHAKE variants (SHAKE-*)</div>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Use SHAKE-256 (XOF) as tree hash function</li>
            <li>Faster on hardware with SHA-3 / Keccak acceleration</li>
            <li>Preferred where SHA-3 is the primary hash primitive</li>
            <li>Identical security level — purely a performance choice</li>
          </ul>
        </div>
      </div>
    </section>

    <section className="glass-panel p-6 space-y-3">
      <h3 className="font-bold text-foreground">Choosing -s vs -f for Your Use Case</h3>
      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        {[
          {
            variant: '-s (small signature, slower signing)',
            uses: [
              'Code signing artifacts (minimize download size)',
              'Long-term archival (minimize storage)',
              'Root CA certificates (signed infrequently)',
            ],
            avoid: 'High-throughput signing systems',
          },
          {
            variant: '-f (fast signing, larger signature)',
            uses: [
              'Intermediate CA operations (moderate frequency)',
              'OCSP responders',
              'Systems where signing speed matters more than bandwidth',
            ],
            avoid: 'Bandwidth-constrained channels or IoT',
          },
        ].map((col) => (
          <div key={col.variant} className="bg-muted/40 rounded-lg p-3 space-y-2">
            <div className="font-semibold text-foreground">{col.variant}</div>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
              {col.uses.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
            <p className="text-muted-foreground">Avoid for: {col.avoid}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
)

// ─── Step 4: Advanced Features ───────────────────────────────────────────────

const Step4Advanced: React.FC<{ onNavigateToWorkshop: () => void }> = ({
  onNavigateToWorkshop,
}) => (
  <div className="space-y-8 w-full">
    <section className="glass-panel p-6 space-y-4">
      <h2 className="text-xl font-bold text-foreground">
        Pure SLH-DSA vs HashSLH-DSA (§10.2.1 vs §10.2.2)
      </h2>
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <div className="font-semibold text-foreground">Pure SLH-DSA (CKM_SLH_DSA)</div>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Hashes the raw message M internally</li>
            <li>Context strings (§10.2.1) are supported</li>
            <li>Deterministic mode (§10) is supported</li>
            <li>Best for most applications</li>
          </ul>
        </div>
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <div className="font-semibold text-foreground">HashSLH-DSA (CKM_HASH_SLH_DSA_*)</div>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Pre-hashes M with an external hash function before signing</li>
            <li>
              Pre-hash examples (§10.2.2): SHA-256, SHA-512, SHAKE128 and SHAKE256. SHA-256 and
              SHAKE128 are appropriate only for category 1 parameter sets.
            </li>
            <li>Context strings (0–255 bytes) are supported, identically to pure SLH-DSA</li>
            <li>Use when the protocol mandates pre-hashing (e.g. legacy interop)</li>
          </ul>
        </div>
      </div>
      <div className="bg-muted/40 rounded-lg px-3 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">HashSLH-DSA message construction (§10.2.2):</strong>{' '}
        M&apos; = <span className="font-mono">0x01 ‖ len(ctx) ‖ ctx ‖ OID_DER ‖ H(M)</span>. The OID
        identifies the pre-hash algorithm; example DER encodings appear in Algorithm 23.
      </div>
    </section>

    <section className="glass-panel p-6 space-y-4">
      <h2 className="text-xl font-bold text-foreground">Context Strings — FIPS 205 §§10.2–10.3</h2>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The live demo provides separate signing and verification contexts for pure and pre-hash
        modes. Leave both empty for zero bytes, or use the same label in both fields. Change only
        the verification context to test rejection. A space is not empty. An engine error does not
        demonstrate correct rejection; it means the test did not complete successfully.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        A context string is an optional 0–255 byte value passed at sign and verify time. It binds
        the signature to a{' '}
        <strong className="text-foreground">specific protocol or application context</strong>,
        preventing cross-context signature replay attacks.
      </p>
      <div className="bg-muted/40 rounded-lg p-4 text-xs space-y-2 text-muted-foreground">
        <p>
          <strong className="text-foreground">Example:</strong> A CA signs both OCSP responses and
          firmware blobs with the same key. By using context{' '}
          <span className="font-mono">"ca:ocsp"</span> for one and{' '}
          <span className="font-mono">"ca:firmware"</span> for the other, a valid OCSP signature
          cannot be repurposed as a firmware signature — verification returns{' '}
          <span className="font-mono">CKR_SIGNATURE_INVALID</span>.
        </p>
      </div>
      <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
        <li>Supported in both pure SLH-DSA and HashSLH-DSA (Algorithm 23 takes ctx)</li>
        <li>Context must be supplied identically at both sign and verify time</li>
        <li>Empty context (0 bytes) is the default — most applications use this</li>
        <li>
          PKCS#11 v3.2: passed via{' '}
          <span className="font-mono">CK_SIGN_ADDITIONAL_CONTEXT.pContext</span>
        </li>
      </ul>
    </section>

    <section className="glass-panel p-6 space-y-4">
      <h2 className="text-xl font-bold text-foreground">
        Why can two signatures of the same message differ?
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        SLH-DSA offers two signing modes:
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        <strong>Deterministic:</strong> signing the same message with the same key, context and
        settings produces the same signature.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        <strong>Hedged:</strong> signing adds fresh randomness, so repeating the operation normally
        produces a different signature. Both signatures should still verify.
      </p>
      <h3 className="font-semibold text-foreground">What should you learn from the test?</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Sign the same inputs twice and compare the results. Identical signatures are expected in
        deterministic mode; different signatures are normally expected in hedged mode.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        This demonstrates the difference between signing modes. It does not prove that the random
        generator is good or that the implementation resists attacks.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Deterministic signing does not need fresh randomness for each signature, but generating the
        key still requires randomness.
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Technical note: in deterministic SLH-DSA, opt_rand uses PK.seed, a public value belonging to
        the key, not zeros. See{' '}
        <a className="text-primary underline" href="https://doi.org/10.6028/NIST.FIPS.205">
          FIPS 205 §9.2
        </a>
        . In the existing demo, select a signing mode and use “Sign twice and compare” to inspect
        both signatures and their verification results with identical inputs.
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        PKCS#11 v3.2: set{' '}
        <span className="font-mono">hedgeVariant = CKH_DETERMINISTIC_REQUIRED</span> in the{' '}
        <span className="font-mono">CK_SIGN_ADDITIONAL_CONTEXT</span> parameter.
      </p>
    </section>

    <section className="glass-panel p-6 space-y-3">
      <h3 className="font-bold text-foreground">Further Reading</h3>
      <div className="space-y-2">
        {[
          {
            label: 'FIPS 205 & SLH-DSA',
            url: 'https://csrc.nist.gov/pubs/fips/205/final',
            desc: 'Full specification: §3–11 cover the primitives, parameter sets, signing, and HashSLH-DSA',
          },
          {
            label: 'SPHINCS+ Round 3',
            url: 'https://sphincs.org/data/sphincs+-r3.1-specification.pdf',
            desc: 'Original SPHINCS+ paper with detailed security analysis and parameter justification',
          },
        ].map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <ExternalLink size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">{link.label}</div>
              <div className="text-xs text-muted-foreground">{link.desc}</div>
            </div>
          </a>
        ))}
      </div>
    </section>

    <div className="text-center">
      <Button
        variant="gradient"
        onClick={onNavigateToWorkshop}
        className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
      >
        Start Workshop <ArrowRight size={18} />
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Generate real SLH-DSA keys, sign with context strings, and toggle deterministic mode.
      </p>
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

export const SLHDSAIntroduction: React.FC<SLHDSAIntroductionProps> = ({ onNavigateToWorkshop }) => {
  const steps = [
    {
      id: 'overview',
      label: 'SLH-DSA Overview',
      content: <Step1Overview />,
    },
    {
      id: 'internals',
      label: 'WOTS+ & Hypertree',
      content: <Step2Internals />,
    },
    {
      id: 'parameters',
      label: 'Parameter Sets',
      content: <Step3Parameters />,
    },
    {
      id: 'advanced',
      label: 'HashSLH-DSA Modes',
      content: <Step4Advanced onNavigateToWorkshop={onNavigateToWorkshop} />,
    },
  ]

  return <LearnStepper steps={steps} />
}
