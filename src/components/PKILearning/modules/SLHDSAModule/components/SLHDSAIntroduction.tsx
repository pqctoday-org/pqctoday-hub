// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { LearnStepper } from '@/components/PKILearning/LearnStepper'
import { Button } from '@/components/ui/button'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'

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
        FIPS 205 §1: its security &ldquo;relies on the presumed difficulty of finding preimages for
        hash functions as well as several related properties of the same hash functions&rdquo; —{' '}
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
            <li>
              Approved in NIST SP 800-208; specified in RFC 8554 (LMS) and RFC 8391 (XMSS), both
              Informational RFCs
            </li>
          </ul>
        </div>
        <div className="bg-status-success/5 border border-status-success/20 rounded-lg p-4 space-y-2">
          <div className="font-semibold text-status-success text-sm">Stateless (SLH-DSA)</div>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
            <li>No per-key leaf counter; this does not mean unlimited signatures</li>
            <li>No persistent state to manage, back up, or synchronize</li>
            <li>Safe for serverless, distributed, and HSM-pooled environments</li>
            <li>
              Hedged (randomized) signing is the default, recommended where side-channel attacks are
              a concern (§9.2)
            </li>
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
        The tradeoff: SLH-DSA signatures are significantly larger (7,856 to 49,856 bytes, FIPS 205
        Table 2, against about 0.8 to 9 KB for LMS across the SP 800-208 parameter sets, by the RFC
        8554 byte layout) and signing is slower due to the hypertree traversal. Whether the
        stateless design is worth that cost depends on the deployment: a signing key that is used
        from several places, or restored from a backup, makes a leaf counter hard to keep safe. The
        three lists below are planning heuristics drawn from the sizes and speeds above, not
        requirements of FIPS 205 or of any policy.
      </p>
    </section>

    <section className="glass-panel p-6 space-y-3">
      <h2 className="text-xl font-bold text-foreground">Deployment Context</h2>
      <div className="grid sm:grid-cols-3 gap-3 text-xs">
        {[
          {
            title: 'Where the trade-offs are usually acceptable',
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
            title: 'Where ML-DSA is usually the better match',
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
      <p className="text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">National security systems:</strong> this list does not
        apply. NSA&apos;s CNSA 2.0 FAQ (version 2.2, October 2026) says SLH-DSA &ldquo;is not part
        of CNSA and is not approved for any use in NSS&rdquo;. See &ldquo;What the lab tests&rdquo;
        in the HashSLH-DSA Modes step.
      </p>
    </section>
  </div>
)

// ─── Step 2: WOTS+, FORS & Hypertree Architecture ───────────────────────────

const Step2Internals: React.FC = () => (
  <div className="space-y-8 w-full">
    <section className="glass-panel p-6 space-y-4">
      <h2 className="text-xl font-bold text-foreground">
        FIPS 205 §§5–8: The Three Building Blocks
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
        <h3 className="font-bold text-foreground">WOTS+ — Winternitz One-Time Signature (§5)</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        WOTS+ signs a single <em>n</em>-byte hash value by representing it as a sequence of base-
        <em>w</em> digits and computing a hash chain of length up to <em>w</em> for each digit. The
        signer walks <em>down</em> the chain (easy); the verifier walks <em>up</em> (also easy);
        forging requires inverting the hash (infeasible).
      </p>
      <div className="bg-muted/40 rounded-lg p-4 text-xs font-mono space-y-1 text-muted-foreground">
        <div>sk_i → H(sk_i) → H²(sk_i) → … → H^(w−1)(sk_i) = pk_i</div>
        <div className="text-muted-foreground mt-1">
          Sign digit d: output chain[d]. Verify: apply w−1−d more hashes and compare to pk_i.
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
            WOTS+ is one-time: each key may sign one message, and forgeries become feasible if a key
            is used twice (FIPS 205 §6, §8). In the hypertree each WOTS+ key signs one fixed value:
            a FORS public key at the lowest layer, or an XMSS public key of the layer below (§7).
          </p>
        </div>
      </div>
    </section>

    <section className="glass-panel p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
          2
        </span>
        <h3 className="font-bold text-foreground">FORS — Forest of Random Subsets (§8)</h3>
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
        <h3 className="font-bold text-foreground">HT — Hypertree (§7)</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        The hypertree is a <em>d</em>-layer stack of XMSS trees, each of height <em>h/d</em>. Each
        layer authenticates the root of the layer below using a WOTS+ signature. The top root
        (PK.root), together with PK.seed, is the SLH-DSA public key.
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
            e.g. 9). Each XMSS tree has more leaves and needs more hash rounds to traverse; fewer
            layers means fewer WOTS+ signatures, so the total signature is smaller (a hypertree
            signature is (<em>h</em> + <em>d</em> · <em>len</em>) · <em>n</em> bytes, §7.1).
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
      <h2 className="text-xl font-bold text-foreground">FIPS 205 §11 — Parameter Sets</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        FIPS 205 defines 12 parameter sets (6 SHA-2 variants shown, each has a SHAKE counterpart
        with identical parameters). Every set uses{' '}
        <strong className="text-foreground">lg_w = 4</strong> (Winternitz parameter w = 16).
      </p>
      <ResponsiveTable
        caption="FIPS 205 parameter sets"
        testId="slhdsa-param-sets"
        head={['Param set', 'n', 'h', 'd', 'h/d', 'a', 'k', 'Sig (B)', 'NIST category', 'Note']}
        rows={PARAM_TABLE.map((row) => [
          <span key="id" className="font-mono text-primary font-semibold">
            {row.id}
          </span>,
          <span key="n" className="font-mono">
            {row.n}
          </span>,
          <span key="h" className="font-mono">
            {row.h}
          </span>,
          <span key="d" className="font-mono">
            {row.d}
          </span>,
          <span key="hp" className="font-mono">
            {row.hp}
          </span>,
          <span key="a" className="font-mono">
            {row.a}
          </span>,
          <span key="k" className="font-mono">
            {row.k}
          </span>,
          <span key="sig" className="font-mono">
            {row.sig.toLocaleString()}
          </span>,
          <span key="nist" className="font-mono">
            {row.nist}
          </span>,
          <span key="note" className="text-muted-foreground">
            {row.note}
          </span>,
        ])}
      />
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
            <li>
              Built from SHA-256, with SHA-512 added for security categories 3 and 5 (FIPS 205
              section 11.2)
            </li>
            <li>Widest hardware support (existing HSMs, Intel SHA-NI)</li>
            <li>Good default for most deployments today</li>
          </ul>
        </div>
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <div className="font-semibold text-foreground">SHAKE variants (SHAKE-*)</div>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Every function is instantiated with SHAKE256 (FIPS 205 section 11.1)</li>
            <li>Preferred where SHA-3 is the primary hash primitive</li>
            <li>Same security category as the matching SHA2 parameter set (FIPS 205 Table 2)</li>
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

    <section className="glass-panel p-6 space-y-4">
      <h2 className="text-xl font-bold text-foreground">What the lab tests</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        A validated SLH-DSA module is checked in three separate ways, and none of them replaces
        another: algorithm tests, the module&apos;s own self-tests, and the certificate path. A
        fourth question, whether the algorithm may be used at all, is answered by CNSA 2.0 for
        national security systems.
      </p>
      <div className="space-y-4 text-xs text-muted-foreground">
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <div className="font-semibold text-foreground text-sm">
            1. Algorithm tests (ACVP, draft of 2 October 2026)
          </div>
          <ul className="space-y-1.5 list-disc list-inside leading-relaxed">
            <li>
              SLH-DSA has three ACVP modes: keyGen, sigGen and sigVer, all against FIPS 205. Each
              has one test type, AFT (Algorithm Functional Test).
            </li>
            <li>
              keyGen: the implementation generates a key pair from the provided seed and key values
              (SK.seed, SK.prf and PK.seed). The server provides at least 10 tests for each
              combination of capabilities. sigGen: it generates a valid signature from the provided
              private key, message, context (external interface) and randomness (non-deterministic
              signing), with at least 13 tests for each combination.
            </li>
            <li>
              sigVer: the server makes its tests by modifying a valid signature: a modified message,
              modified signature R, SIGFORS or SIGHT parts, a signature that is too long or too
              short, plus the valid case. The workshop&apos;s NIST sigVer panel replays a few
              published cases of this kind.
            </li>
            <li>
              Not tested by ACVP, in the specification&apos;s words: &ldquo;that fresh seed values
              are used for fresh invocations of key generation, that approved deterministic random
              bit generators (DRBGs) are used with the correct security strengths, that sensitive
              data is destroyed, that key validation is performed, and that floating point
              arithmetic is not used.&rdquo;
            </li>
          </ul>
        </div>
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <div className="font-semibold text-foreground text-sm">
            What a vendor registers: the ACVP capability options
          </div>
          <ul className="space-y-1.5 list-disc list-inside leading-relaxed">
            <li>
              <span className="font-mono">parameterSets</span>: any of the 12 names, from
              SLH-DSA-SHA2-128s to SLH-DSA-SHAKE-256f.
            </li>
            <li>
              <span className="font-mono">signatureInterfaces</span>: &ldquo;internal&rdquo;,
              &ldquo;external&rdquo;, or both.
            </li>
            <li>
              <span className="font-mono">preHash</span>: &ldquo;pure&rdquo;, &ldquo;preHash&rdquo;
              (described as &ldquo;Whether SLH-DSA or HashSLH-DSA are supported&rdquo;).{' '}
              <span className="font-mono">hashAlgs</span> is used if preHash.
            </li>
            <li>
              <span className="font-mono">deterministic</span> (sigGen only): &ldquo;A value of
              &lsquo;true&rsquo; indicates that deterministic signature generation is supported and
              a value of &lsquo;false&rsquo; indicates that non-deterministic signature generation
              is supported.&rdquo; sigVer has signatureInterfaces and preHash but no deterministic
              field.
            </li>
            <li>
              <span className="font-mono">messageLength</span> (8 to 65536 bits, step 8) and{' '}
              <span className="font-mono">contextLength</span> (0 to 2040, step 8) as ranges.
            </li>
          </ul>
        </div>
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <div className="font-semibold text-foreground text-sm">
            2. Module self-tests (FIPS 140-3 IG 10.3.A, item 16)
          </div>
          <ul className="space-y-1.5 list-disc list-inside leading-relaxed">
            <li>
              For each of signature generation, signature verification and key generation that the
              module implements, IG 10.3.A requires a cryptographic algorithm self-test (CAST), run
              before the algorithm&apos;s first use in the approved mode. The signature generation
              CAST is a known-answer test: fixed values go in and the output is compared with a
              pre-computed signature (SIG). The verification CAST checks that a known signature
              verifies (returns true). The key generation CAST uses fixed SK.seed, SK.prf and
              PK.seed and compares the private key; the public key need not be compared, &ldquo;as
              the private key contains a copy of the public key&rdquo;.
            </li>
            <li>
              Pure and pre-hash (Notes 27 and 28): if both are implemented and &ldquo;they both
              share the same underlying cryptographic implementations, a CAST on either one of them
              is sufficient to meet the CAST requirements for both&rdquo;. This holds for signature
              generation and, separately, for verification.
            </li>
            <li>
              Hash families (Note 29): a module that supports both SHA2 and SHAKE parameter sets in
              the approved mode must run the CASTs on at least two parameter sets, one SHA2 and one
              SHAKE. A module with only one family needs at least one. It is recommended, but not
              required, to test at least one &ldquo;s&rdquo; and one &ldquo;f&rdquo; set if both are
              implemented.
            </li>
            <li>
              Tree height (Note 30): the CASTs need only exercise the smallest parameter set (lowest
              height trees) the module supports.
            </li>
            <li>
              Pairwise consistency test: for FIPS 205 keys it &ldquo;may be limited to confirming
              the same key identifier (I in the case of LMS, SEED in the case of XMSS and PK.SEED
              for SLH-DSA) is shared by the resulting public and private key following
              generation&rdquo;.
            </li>
          </ul>
        </div>
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <div className="font-semibold text-foreground text-sm">
            3. The certificate path, and 4. CNSA 2.0 status
          </div>
          <ul className="space-y-1.5 list-disc list-inside leading-relaxed">
            <li>
              NIST&apos;s CAVP page: &ldquo;Cryptographic algorithm validation is a prerequisite of
              cryptographic module validation.&rdquo; But &ldquo;a product or implementation does
              not meet the FIPS 140 module validation requirements by simply implementing an
              Approved security function and acquiring validations for each of the implemented
              algorithms.&rdquo;
            </li>
            <li>
              ACVTS testing &ldquo;is entirely black-box. The implementation is never provided to
              NIST or the CAVP&rdquo;, and CAVP &ldquo;is not responsible for running those test
              vectors through the implementation&rdquo;. The CASTs above are a FIPS 140-3 module
              requirement set by CMVP guidance (IG 10.3.A), separate from the ACVP tests.
            </li>
            <li>
              CNSA 2.0 (NSA FAQ, version 2.2, October 2026): &ldquo;While SLH-DSA is hash-based, it
              is not part of CNSA and is not approved for any use in NSS.&rdquo; The CNSA 2.0
              algorithm table lists ML-DSA-87 for digital signatures and LMS and XMSS (NIST SP
              800-208) for signing firmware and software. See the stateful signatures module for how
              those are validated.
            </li>
          </ul>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Sources:{' '}
        <Link
          to="/library?ref=ACVP-SLH-DSA-JSON-Specification"
          className="text-primary hover:underline"
        >
          NIST ACVP draft specification for SLH-DSA
        </Link>{' '}
        (2 October 2026);{' '}
        <Link to="/library?ref=NIST-FIPS140-3-IG-PQC" className="text-primary hover:underline">
          CMVP Implementation Guidance for FIPS PUB 140-3
        </Link>
        , IG 10.3.A (document updated 19 August 2026); NIST CAVP overview;{' '}
        <Link to="/library?ref=NSA%20CNSA%202.0%20FAQ" className="text-primary hover:underline">
          NSA CNSA 2.0 FAQ
        </Link>{' '}
        version 2.2. Guidance and test coverage change, so check the current versions. How labs run
        these steps:{' '}
        <Link to="/learn/fips-140-3-certification" className="text-primary hover:underline">
          FIPS 140-3 Certification
        </Link>{' '}
        and{' '}
        <Link to="/learn/acvp-lab-workflow" className="text-primary hover:underline">
          ACVP Lab Workflow
        </Link>
        ; the stateful hash-based schemes:{' '}
        <Link to="/learn/stateful-signatures" className="text-primary hover:underline">
          Stateful Hash Signatures
        </Link>
        .
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
