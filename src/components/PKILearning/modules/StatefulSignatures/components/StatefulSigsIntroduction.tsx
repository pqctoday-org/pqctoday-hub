// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { LearnStepper } from '@/components/PKILearning/LearnStepper'
import {
  Shield,
  GitBranch,
  Layers,
  ArrowLeftRight,
  AlertTriangle,
  ArrowRight,
  Terminal,
  BookOpen,
  Library,
  KeyRound,
  ExternalLink,
  ClipboardCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { SchemeForUseSection } from './SchemeForUseSection'

interface StatefulSigsIntroductionProps {
  onNavigateToWorkshop: () => void
}

// ─── Step 1: Why Stateful + Merkle Trees ─────────────────────────────────────

const Step1WhyAndMerkle: React.FC = () => (
  <div className="space-y-8 w-full">
    {/* Section 1: Why Stateful? */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Why Stateful Hash-Based Signatures?</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          <strong>
            <InlineTooltip term="Hash-Based Signatures">Hash-based signatures</InlineTooltip>
          </strong>{' '}
          derive their security solely from the properties of cryptographic hash functions, which
          have a longer standardization history than{' '}
          <InlineTooltip term="Lattice-Based Cryptography">lattice-based</InlineTooltip> or{' '}
          <InlineTooltip term="Code-Based Cryptography">code-based</InlineTooltip> constructions.
          Unlike those schemes, they require no new hardness assumptions.{' '}
          <InlineTooltip term="LMS/HSS">LMS</InlineTooltip> requires its hash function to have{' '}
          <strong>second-preimage resistance</strong> (RFC 8554 §9);{' '}
          <InlineTooltip term="XMSS">XMSS</InlineTooltip> does not rely on the collision resistance
          of its hash functions but on weaker properties (RFC 8391).
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <blockquote className="text-sm italic text-foreground/90">
            &ldquo;This recommendation specifies profiles of LMS, HSS, XMSS, and XMSS^MT that are
            appropriate for use by the U.S. Federal Government.&rdquo;
          </blockquote>
          <p className="text-xs text-muted-foreground mt-2">
            &mdash; <InlineTooltip term="NIST SP 800-208">NIST SP 800-208</InlineTooltip>:
            Recommendation for Stateful Hash-Based Signature Schemes (October 2020)
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Minimal Assumptions</div>
            <p className="text-xs text-muted-foreground">
              Security relies only on hash function properties &mdash; no lattices, no codes, no
              isogenies.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">NIST Approved</div>
            <p className="text-xs text-muted-foreground">
              SP 800-208 standardized LMS/HSS and XMSS/XMSS^MT for federal use.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">
              CNSA 2.0 for national security systems
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              NSA <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> approves single-tree LMS
              and XMSS (not HSS or XMSS^MT) for firmware and software signing in national security
              systems, and prefers LMS with SHA-256/192; ML-DSA-87 is also allowed for this use.
              Phased timeline:
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>
                &bull; <strong>{CNSA_2_0.softwarePreferred}:</strong> New software/firmware should
                support &amp; prefer CNSA 2.0
              </li>
              <li>
                &bull; <strong>{CNSA_2_0.softwareExclusive}:</strong> Software and firmware signing
                is anticipated by NSA to use CNSA 2.0 exclusively
              </li>
              <li>
                &bull; <strong>{CNSA_2_0.fullEnforcement}:</strong> CNSA 2.0 algorithms mandated for
                all NSS unless otherwise noted (CNSA 2.0 FAQ)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* Section 2: Merkle Tree Signatures */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <GitBranch size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Merkle Tree Signatures</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          The core idea is a{' '}
          <strong>
            <InlineTooltip term="Merkle Tree">Merkle tree</InlineTooltip>
          </strong>{' '}
          of <InlineTooltip term="One-Time Signature">one-time signature (OTS)</InlineTooltip> key
          pairs. Each leaf contains the hash of a unique OTS public key. The tree root is the
          overall public key. To sign, you use the next unused OTS leaf and provide an
          authentication path from that leaf to the root.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="space-y-3 text-center">
            <div className="text-xs font-bold text-primary mb-2">
              Merkle Signature Tree (height = 3, 8 leaves)
            </div>
            {/* Root */}
            <div className="flex justify-center">
              <div className="px-3 py-1.5 rounded bg-primary/20 text-primary text-xs font-bold border border-primary/30">
                Root (Public Key)
              </div>
            </div>
            <div className="text-muted-foreground text-xs">&darr;</div>
            {/* Level 1 */}
            <div className="flex justify-center gap-8">
              <div className="px-3 py-1.5 rounded bg-muted text-foreground text-xs font-medium border border-border">
                H(0,1)
              </div>
              <div className="px-3 py-1.5 rounded bg-muted text-foreground text-xs font-medium border border-border">
                H(2,3)
              </div>
            </div>
            <div className="text-muted-foreground text-xs">&darr;</div>
            {/* Level 2 */}
            <div className="flex justify-center gap-4">
              <div className="px-2 py-1 rounded bg-muted text-foreground text-[10px] font-medium border border-border">
                H(0)
              </div>
              <div className="px-2 py-1 rounded bg-muted text-foreground text-[10px] font-medium border border-border">
                H(1)
              </div>
              <div className="px-2 py-1 rounded bg-muted text-foreground text-[10px] font-medium border border-border">
                H(2)
              </div>
              <div className="px-2 py-1 rounded bg-muted text-foreground text-[10px] font-medium border border-border">
                H(3)
              </div>
            </div>
            <div className="text-muted-foreground text-xs">&darr;</div>
            {/* Leaves */}
            <div className="flex justify-center gap-2 flex-wrap">
              {['OTS-0', 'OTS-1', 'OTS-2', 'OTS-3', 'OTS-4', 'OTS-5', 'OTS-6', 'OTS-7'].map(
                (label, i) => (
                  <div
                    key={label}
                    className={`px-2 py-1 rounded text-[10px] font-bold border ${
                      i === 0
                        ? 'bg-success/10 text-success border-success/30'
                        : 'bg-muted/50 text-muted-foreground border-border'
                    }`}
                  >
                    {label}
                  </div>
                )
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Green = next available OTS key. Each leaf can only be used ONCE.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">One-Time Signatures (OTS)</div>
            <p className="text-xs text-muted-foreground">
              Each OTS key pair (e.g.,{' '}
              <InlineTooltip term="Winternitz One-Time Signature">Winternitz OTS+</InlineTooltip>)
              can sign exactly one message. Reusing an OTS key leaks the private key, enabling
              forgeries.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">Authentication Path</div>
            <p className="text-xs text-muted-foreground">
              The signature includes the OTS signature plus the sibling hashes needed to recompute
              the path from the used leaf to the root. Verifiers check that the path produces the
              known root.
            </p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-xs font-bold text-foreground mb-2">
            How Winternitz Hash Chains Work &mdash; and Why Reuse is Catastrophic
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Each OTS secret key is a set of random values. To sign, each value is hashed a number of
            times based on the message digest &mdash; revealing an intermediate chain value. The
            public key is the <em>fully hashed</em> end of each chain.
          </p>
          <div className="space-y-1 text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">sk</span>
              <span className="text-muted-foreground">&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-destructive/10 border border-destructive/20 text-status-error">
                H&sup1;(sk)
              </span>
              <span className="text-muted-foreground">&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-warning/10 border border-warning/20 text-warning">
                H&sup2;(sk)
              </span>
              <span className="text-muted-foreground">&rarr; &hellip; &rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                H&sup7;(sk) = pk
              </span>
            </div>
            <p className="text-muted-foreground mt-2">
              Signing message A reveals H&sup3;(sk); signing message B (different digit) reveals
              H&sup5;(sk). An attacker who sees both can compute the full chain and forge arbitrary
              messages &mdash; this is why OTS reuse is a <strong>complete break</strong>, not a
              partial leak. The checksum field prevents attackers from simply
              &ldquo;advancing&rdquo; the chain to forge messages with higher digit values.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 2: LMS/HSS + XMSS ──────────────────────────────────────────────────

const Step2LmsXmss: React.FC = () => (
  <div className="space-y-8 w-full">
    {/* Section 3: LMS/HSS */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Layers size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">LMS / HSS</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          The <strong>Leighton-Micali Signature Scheme (LMS)</strong> is defined in RFC 8554. It
          uses a single Merkle tree with LM-OTS (Leighton-Micali OTS) at the leaves. The{' '}
          <strong>Hierarchical Signature System (HSS)</strong> extends LMS with multiple levels of
          trees, where each non-leaf tree signs the root of the tree below it.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">LMS (Single Tree)</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; Tree heights: H = 5, 10, 15, 20, 25</li>
              <li>&bull; Winternitz parameter: W = 1, 2, 4, 8</li>
              <li>&bull; Max signatures = 2^H (32 to 33M)</li>
              <li>
                &bull; Small public key: 24 bytes plus the hash output length &ndash; 48 bytes for
                the SHA-256/192 sets, 56 bytes for the SHA-256 sets (RFC 8554, SP 800-208) (not
                sourced in the Library)
              </li>
              <li>
                &bull; Signature size: 1.3 &ndash; 9.3 KB depending on H, W (RFC 8554) (not sourced
                in the Library)
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">HSS (Multi-Level)</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; Up to 8 levels of LMS trees</li>
              <li>&bull; Max signatures = 2^(H1 + H2 + ... + Hn)</li>
              <li>&bull; Top-level tree signs sub-tree roots</li>
              <li>&bull; Enables huge signing capacity</li>
              <li>&bull; 2-level HSS with H10 trees = 2^20 = 1M sigs</li>
            </ul>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-xs font-bold text-foreground mb-2">
            Winternitz Trade-off: W parameter
          </div>
          <div className="space-y-1">
            {[
              { w: 1, sigSpeed: 'Fastest', sigSize: 'Largest (~8.7 KB)', verifySpeed: 'Fastest' },
              { w: 2, sigSpeed: 'Fast', sigSize: 'Large (~4.5 KB)', verifySpeed: 'Fast' },
              {
                w: 4,
                sigSpeed: 'Moderate',
                sigSize: 'Medium (~2.4 KB)',
                verifySpeed: 'Moderate',
              },
              {
                w: 8,
                sigSpeed: 'Slowest',
                sigSize: 'Smallest (~1.3 KB)',
                verifySpeed: 'Slowest',
              },
            ].map((row) => (
              <div key={row.w} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-bold text-primary w-10">W={row.w}</span>
                <span className="w-24">Sign: {row.sigSpeed}</span>
                <span className="w-32">Size: {row.sigSize}</span>
                <span>Verify: {row.verifySpeed}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
              <strong>Security note:</strong> W has <em>zero impact on security level</em>. It only
              controls the size&thinsp;/&thinsp;speed trade-off. Security is determined by the hash
              function and n (hash output length), not by W.
            </p>
          </div>
        </div>
        <div className="bg-warning/5 rounded-lg p-3 border border-warning/20">
          <div className="text-xs font-bold text-warning mb-1">
            SP 800-208 key-generation and signing requirements
          </div>
          <p className="text-xs text-muted-foreground">
            NIST SP 800-208 §8.1 requires key generation and signing within a{' '}
            <strong>
              <InlineTooltip term="FIPS 140-3">FIPS 140-validated</InlineTooltip> hardware
              cryptographic module
            </strong>{' '}
            with no private keying material export. The profile specifies Level 3 or higher physical
            security and a non-modifiable or limited operational environment. Consult applicable
            CMVP implementation guidance for validation details. The workshop explains how to review
            state protection and what its demonstration cannot prove.
          </p>
        </div>
      </div>
    </section>

    {/* Section 4: XMSS/XMSS^MT */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <ArrowLeftRight size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">XMSS / XMSS^MT</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          The <strong>eXtended Merkle Signature Scheme (XMSS)</strong> is defined in RFC 8391. It
          shares the same Merkle tree approach as LMS but adds features like a bitmask-based tree
          hash construction (for multi-target attack resistance) and a different OTS scheme (WOTS+).{' '}
          <strong>XMSS^MT</strong> is the multi-tree variant, analogous to HSS.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-xs font-bold text-foreground mb-3">LMS vs XMSS Comparison</div>
          <div
            className="overflow-x-auto"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; making a scrollable region focusable is axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
            tabIndex={0}
            role="region"
            aria-label="LMS vs XMSS comparison"
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-bold">Feature</th>
                  <th className="text-left py-2 pr-4 text-primary font-bold">LMS / HSS</th>
                  <th className="text-left py-2 text-secondary font-bold">XMSS / XMSS^MT</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">Standard</td>
                  <td className="py-2 pr-4">RFC 8554, NIST SP 800-208</td>
                  <td className="py-2">RFC 8391, NIST SP 800-208</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">Tree Hash</td>
                  <td className="py-2 pr-4">Simple iterative</td>
                  <td className="py-2">Bitmask-based (multi-target resistant)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">Implementation</td>
                  <td className="py-2 pr-4">Simpler, fewer parameters</td>
                  <td className="py-2">More complex, stronger security proof</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">Key Generation</td>
                  <td className="py-2 pr-4">Fast</td>
                  <td className="py-2">Slower (bitmask computation)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">Signature Size</td>
                  <td className="py-2 pr-4">Slightly larger</td>
                  <td className="py-2">Slightly smaller at same tree height</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">
                    <InlineTooltip term="Forward Secrecy">Forward Security</InlineTooltip>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">No</td>
                  <td className="py-2 text-muted-foreground">Not sourced in the Library</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-foreground">Adoption</td>
                  <td className="py-2 pr-4">NSA CNSA 2.0 (single-tree LMS only), BSI</td>
                  <td className="py-2">
                    NSA CNSA 2.0 (single-tree XMSS only),{' '}
                    <InlineTooltip term="BSI">BSI</InlineTooltip>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border text-xs text-muted-foreground space-y-1">
          <p>
            <strong className="text-foreground">XMSS internals:</strong> Two key constructions
            distinguish XMSS from LMS. An <strong>L-tree</strong> compresses the WOTS+ public key
            (up to 67 hash values) into a single leaf via an unbalanced binary tree.{' '}
            <strong>RAND_HASH</strong> randomizes each internal node by XOR&rsquo;ing inputs with
            PRF-derived bitmasks before hashing, providing domain separation and multi-target attack
            resistance. These add ~4&times; the hash computations of LMS but yield a security proof
            that does not rely on the collision resistance of the hash functions (RFC 8391).
          </p>
          <p>
            Both LMS and XMSS are approved by NIST SP 800-208. NSA CNSA 2.0 allows only the
            single-tree LMS and XMSS (HSS and XMSS^MT are not allowed) and prefers LMS with
            SHA-256/192; BSI TR-02102-1 recommends all SP 800-208 parameter sets of both families
            (not sourced in the Library).
          </p>
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 3: State Problem + Resources + CTA ─────────────────────────────────

const Step3StateAndResources: React.FC<{ onNavigateToWorkshop: () => void }> = ({
  onNavigateToWorkshop,
}) => (
  <div className="space-y-8 w-full">
    {/* Section 5: The State Problem */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-destructive/10">
          <AlertTriangle size={24} className="text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-gradient">The State Problem</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          The critical operational challenge with stateful schemes is that the signer{' '}
          <strong>MUST track which OTS keys have been used</strong>. Each leaf index can be used
          exactly once. If state is lost, reset, or duplicated, the same OTS key may be used twice
          &mdash; <em>completely breaking the signature scheme</em>.
        </p>
        <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-destructive" />
            <span className="text-sm font-bold text-destructive">Catastrophic Failure Mode</span>
          </div>
          <p className="text-xs text-foreground/80">
            If a one-time signature key is reused (signing two different messages with the same
            leaf), an attacker can compute enough of the OTS private key to forge arbitrary
            signatures. This is not a theoretical weakness &mdash; it is a{' '}
            <strong>complete break</strong> of the scheme. There is no recovery; the entire key must
            be revoked.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">State Must Be...</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                &bull; <strong>Persisted</strong> to non-volatile storage before signing
              </li>
              <li>
                &bull; <strong>Atomic</strong> &mdash; counter update and sign are one operation
              </li>
              <li>
                &bull; <strong>Never cloned</strong> &mdash; VM snapshots, backups are dangerous
              </li>
              <li>
                &bull; <strong>Never rolled back</strong> &mdash; no restoring from backup
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">Mitigation Strategies</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; Use HSMs with built-in monotonic counters</li>
              <li>&bull; Reserve leaf ranges (batch allocation)</li>
              <li>&bull; Write-ahead logging for state updates</li>
              <li>&bull; Dedicated signing servers with no VM snapshots</li>
            </ul>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-xs font-bold text-foreground mb-3">
            Stateful (LMS/XMSS) vs Stateless (<InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip>{' '}
            / SPHINCS+)
          </div>
          <div
            className="overflow-x-auto"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; making a scrollable region focusable is axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
            tabIndex={0}
            role="region"
            aria-label="Stateful vs stateless signature scheme comparison"
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-bold">Property</th>
                  <th className="text-left py-2 pr-4 text-primary font-bold">LMS / XMSS</th>
                  <th className="text-left py-2 text-secondary font-bold">SLH-DSA (FIPS 205)</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">State required</td>
                  <td className="py-2 pr-4 text-destructive font-medium">
                    Yes &mdash; monotonic counter
                  </td>
                  <td className="py-2 text-success font-medium">No &mdash; fully stateless</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">Signature size</td>
                  <td className="py-2 pr-4 text-success font-medium">Small (1.3 &ndash; 9 KB)</td>
                  <td className="py-2 text-warning">Large (8 &ndash; 49 KB)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">Signing speed</td>
                  <td className="py-2 pr-4 text-success font-medium">Fast</td>
                  <td className="py-2 text-warning">Slow (many hash rounds)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">Max signatures</td>
                  <td className="py-2 pr-4">Bounded by 2^H (plan ahead)</td>
                  <td className="py-2 text-success font-medium">
                    FIPS 205 parameter sets meet their security categories when each key pair signs
                    at most 2^64 messages; no leaf counter
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">CNSA 2.0</td>
                  <td className="py-2 pr-4 text-success font-medium">
                    Approved for firmware/software signing (LMS SHA-256/192 recommended; ML-DSA-87
                    also allowed)
                  </td>
                  <td className="py-2 text-muted-foreground">Not included in CNSA 2.0</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-foreground">Best for</td>
                  <td className="py-2 pr-4">Firmware, code signing, secure boot (controlled)</td>
                  <td className="py-2">TLS, general-purpose, distributed signing</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            LMS/XMSS and SLH-DSA are <strong>complementary</strong>, not competing. Stateful schemes
            are typically more compact in signature and key sizes than stateless alternatives like
            SLH-DSA.
          </p>
        </div>
      </div>
    </section>

    {/* What the lab tests */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <ClipboardCheck size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">What the lab tests</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          A <InlineTooltip term="FIPS 140-3">FIPS 140-3</InlineTooltip> certificate for a module
          that signs with LMS or XMSS rests on four different kinds of check. The algorithm tests
          are only the first.
        </p>
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              1. Algorithm tests (CAVP, run through ACVP)
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>
                &bull; ACVP has an LMS specification with three modes: keyGen, sigGen and sigVer.
                Each has one test type, AFT (Algorithm Functional Test).
              </li>
              <li>
                &bull; keyGen: the implementation must &ldquo;generate a key pair based on an
                approved tree structure&rdquo;. sigGen: it must &ldquo;generate valid signatures
                based on the ACVP provided message&rdquo;. sigVer: it must &ldquo;determine the
                validity of the signature given the tree structure, key, and message&rdquo;.
              </li>
              <li>
                &bull; A vendor registers LMS modes and LM-OTS modes by hash, tree height (for
                example LMS_SHA256_M24_H5 through LMS_SHA256_M32_H25) and Winternitz setting (W1,
                W2, W4, W8). The pair must follow SP 800-208 Section 4, &ldquo;namely M = N, and the
                hash is the same&rdquo;.
              </li>
              <li>
                &bull; On NIST&apos;s CAVP prerequisites page, LMS keyGen, sigGen and sigVer each
                list &ldquo;All hash functions and XOFs used.&rdquo;
              </li>
              <li>
                &bull; Not covered, in the specification&apos;s words: &ldquo;ACVP does not test the
                inability of an implementation to export a private key. ACVP does not provide any
                guarantees on the inability to reuse private OTS pairs of an implementation.&rdquo;
              </li>
              <li>
                &bull; XMSS, XMSS^MT and HSS: no ACVP specification is published for them. The ACVP
                index at pages.nist.gov/ACVP lists LMS, ML-DSA, ML-KEM and SLH-DSA as its
                post-quantum entries (checked 23 October 2026). IG C.N, last modified 10 September
                2024, says CAVP tests are &ldquo;available for LMS but not yet for XMSS, HSS, or
                XMSSMT&rdquo;. IG C.O, of the same date, records that &ldquo;Support for the LMS
                scheme was added to the ACVTS production server in April 2023&rdquo; and that
                &ldquo;the other schemes (including HSS) remain untestable by the CAVP as of the
                last modified date of this IG&rdquo;.
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              2. Module self-tests (FIPS 140-3 IG 10.3.A)
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>
                &bull; The module runs cryptographic algorithm self-tests (CASTs). IG 10.3.A applies
                its requirements &ldquo;prior to the first operational use of the cryptographic
                algorithm&rdquo;.
              </li>
              <li>
                &bull; A module that implements LMS signature generation must also implement key
                generation and have CASTs for both. The same holds for HSS, XMSS and XMSS^MT.
                Signature verification needs its own CAST. HSS builds on LMS, so the HSS CASTs cover
                the LMS ones; XMSS^MT likewise covers XMSS.
              </li>
              <li>
                &bull; Hash functions: a CAST for SHA-256 is required; for SHA-256/192 if it is
                implemented without SHA-256; for SHAKE256/256; and for SHAKE256/192 if it is
                implemented without SHAKE256/256. These can be satisfied as part of the LMS, HSS,
                XMSS or XMSS^MT CASTs.
              </li>
              <li>
                &bull; Testing cost depends on tree height, so the CASTs only need to exercise the
                smallest (or any single) supported parameter set. &ldquo;It is also not necessary to
                test both LM-OTS + LMS modes&rdquo;, but a CAST covering the different underlying
                SHA or SHAKE functions is still required.
              </li>
              <li>
                &bull; Every generated key pair also needs a pairwise consistency test. For SP
                800-208 keys it &ldquo;may be limited to confirming the same key identifier (I in
                the case of LMS, SEED in the case of XMSS and PK.SEED for SLH-DSA) is shared by the
                resulting public and private key following generation&rdquo;.
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              3. What the certificate covers (SP 800-208 §8.1, IG C.N)
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>
                &bull; SP 800-208 §8.1: &ldquo;Implementations of the key generation and signature
                algorithms in this document shall only be validated for use within hardware
                cryptographic modules.&rdquo; The module must also provide Level 3 or higher
                physical security and a non-modifiable or limited operational environment, operate
                only in an approved mode with no bypass mode, not allow export of private keying
                material, and keep the entropy source of its random bit generator inside its
                physical boundary.
              </li>
              <li>
                &bull; Firmware modules (IG C.N, resolution 9): where the hardware components of a
                certified module meet the Level 3 physical security and the non-modifiable or
                limited operational environment, &ldquo;it is not required that modules are module
                type: &apos;hardware&apos; and may separately include modules of type
                &apos;firmware&apos; and &apos;hybrid firmware&apos;&rdquo;. Software and hybrid
                software modules are excluded.
              </li>
              <li>
                &bull; Signature verification only (IG C.N, resolution 1): the §8.1 requirements
                &ldquo;exclusively apply to modules supporting HBS key generation and signature
                generation&rdquo;. Modules that only support signature verification &ldquo;need to
                comply with requirements from section 8.2 of SP 800-208, but do not need to meet
                requirements from section 8.1&rdquo;.
              </li>
              <li>
                &bull; Where ACVP is silent, the lab checks. IG C.N prohibits importing private
                keys, including &ldquo;importing private keys as a restore operation from a
                backup&rdquo; (resolution 3), seeding key generation from an external entropy source
                outside the hardware perimeter (resolution 5), and creating &ldquo;independent
                copies of keys internal to the cryptographic boundary&rdquo; (resolution 7). The
                vendor &ldquo;shall justify the implementation strategy taken to eliminate the
                possibility of OTS private key re-use&rdquo;, and &ldquo;Documentation review in
                isolation is not sufficient&rdquo;: the tester confirms the module prevents the use
                of an OTS key to generate a digital signature more than one time, cannot create an
                independent copy of an HBS key, and, if it stores keys in non-volatile memory,
                updates the leaf index there before exporting a signature value or accepting a
                request to sign another message (resolution 12).
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              4. CNSA 2.0: verifier and signer are validated differently (NSA CNSA 2.0 FAQ, version
              2.2, October 2026)
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5 mb-3">
              <li>
                &bull; LMS and XMSS (NIST SP 800-208) are listed for digitally signing firmware and
                software: &ldquo;All parameters approved for all classification levels. LMS
                SHA-256/192 is recommended.&rdquo; &ldquo;The multi-tree algorithms HSS and XMSSMT
                are not allowed.&rdquo; SLH-DSA &ldquo;is not part of CNSA and is not approved for
                any use in NSS&rdquo;.
              </li>
            </ul>
            <div
              className="overflow-x-auto"
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; making a scrollable region focusable is axe's documented fix for `scrollable-region-focusable` (same pattern as the comparison table above).
              tabIndex={0}
              role="region"
              aria-label="Which validation NSA expects for LMS and XMSS verifiers and signers"
            >
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-bold">Who</th>
                    <th className="text-left py-2 text-muted-foreground font-bold">
                      What the FAQ says
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium text-foreground align-top">
                      A product that only verifies signatures
                    </td>
                    <td className="py-2">
                      &ldquo;Signature verification is expected to be performed by code that has
                      been validated by NIST&apos;s Cryptographic Algorithm Validation Program
                      (CAVP).&rdquo; &ldquo;If your product is only verifying signatures, CAVP
                      testing is all that is required.&rdquo;
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium text-foreground align-top">
                      A signer that is a national security system (NSS)
                    </td>
                    <td className="py-2">
                      &ldquo;Code sources and signature generation processes (signers) that are NSS
                      are required to produce signatures according to NIST SP 800-208, which
                      requires hardware validated by NIST&apos;s Cryptographic Module Validation
                      Program (CMVP), or via other NSA guidance. Waivers for this will not be
                      granted.&rdquo;
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium text-foreground align-top">
                      A signer that is not itself an NSS (for example a commercial vendor&apos;s
                      build environment)
                    </td>
                    <td className="py-2">
                      &ldquo;Those signers are expected to use code in their signature generation
                      processes that is at least at the same operational quality as the code being
                      put on the device, but the only part NSA will validate is that the signature
                      verification code on the device passes CAVP.&rdquo;
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground align-top">
                      A product evaluated under a NIAP Protection Profile
                    </td>
                    <td className="py-2">
                      Where signing occurs outside the Target of Evaluation boundary, Protection
                      Profile requirements only apply to signature verification: &ldquo;if only
                      signature verification is being performed only CAVP validation (not CMVP) will
                      be expected to meet CNSA 2.0 for such products.&rdquo;
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              The FAQ adds: &ldquo;To avoid weakening the security of these signatures, one should
              implement signing and state management in hardware, such as an HSM. Backup flows,
              which may involve transferring keys between modules, must prevent state re-use.&rdquo;
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Sources: NIST ACVP draft specification for LMS and CAVP prerequisites page (October 2026);{' '}
          <Link to="/library?ref=NIST-FIPS140-3-IG-PQC" className="text-primary hover:underline">
            CMVP Implementation Guidance for FIPS PUB 140-3
          </Link>{' '}
          (IG 10.3.A, C.N; document updated 19 August 2026); NIST SP 800-208 (October 2020) §8.1;{' '}
          <Link to="/library?ref=NSA%20CNSA%202.0%20FAQ" className="text-primary hover:underline">
            NSA CNSA 2.0 FAQ
          </Link>{' '}
          version 2.2. Check the current versions: guidance and test coverage change. How labs run
          these steps end to end:{' '}
          <Link to="/learn/fips-140-3-certification" className="text-primary hover:underline">
            FIPS 140-3 Certification
          </Link>{' '}
          and{' '}
          <Link to="/learn/acvp-lab-workflow" className="text-primary hover:underline">
            ACVP Lab Workflow
          </Link>
          .
        </p>
      </div>
    </section>

    {/* Which scheme for which use */}
    <SchemeForUseSection />

    {/* Related Resources */}
    <section className="glass-panel p-6 border-secondary/20">
      <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Link
          to="/openssl"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Terminal size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">OpenSSL Studio</div>
            <div className="text-xs text-muted-foreground">
              Run LMS/XMSS operations with OpenSSL 3.x WASM
            </div>
          </div>
        </Link>
        <Link
          to="/algorithms?tab=detailed&highlight=LMS,XMSS"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <BookOpen size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Algorithm Reference</div>
            <div className="text-xs text-muted-foreground">
              Detailed specs for all PQC algorithms including LMS and XMSS
            </div>
          </div>
        </Link>
        <Link
          to="/library?q=stateful"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Library size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Software Library</div>
            <div className="text-xs text-muted-foreground">
              PQC-ready libraries and tools with stateful signature support
            </div>
          </div>
        </Link>
        <Link
          to="/learn/pki-workshop"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <KeyRound size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">PKI Workshop</div>
            <div className="text-xs text-muted-foreground">
              Key management fundamentals and certificate chain building
            </div>
          </div>
        </Link>
        <a
          href="https://www.rfc-editor.org/rfc/rfc10033"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <ExternalLink size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">
              RFC 10033: Hash-Based Signatures: State and Backup Management
            </div>
            <div className="text-xs text-muted-foreground">
              Practical guidance on state, backup, and recovery for LMS/XMSS deployments
            </div>
          </div>
        </a>
      </div>
    </section>

    {/* CTA */}
    <div className="text-center">
      <Button
        variant="gradient"
        onClick={onNavigateToWorkshop}
        className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
      >
        Start Workshop <ArrowRight size={18} />
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Explore LMS and XMSS key generation, compare parameter sets, and simulate state management.
      </p>
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

export const StatefulSigsIntroduction: React.FC<StatefulSigsIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  const steps = [
    {
      id: 'lms',
      label: 'Stateful Signatures',
      content: <Step1WhyAndMerkle />,
    },
    {
      id: 'xmss',
      label: 'LMS/HSS & XMSS',
      content: <Step2LmsXmss />,
    },
    {
      id: 'state',
      label: 'State Problem',
      content: <Step3StateAndResources onNavigateToWorkshop={onNavigateToWorkshop} />,
    },
  ]

  return <LearnStepper steps={steps} />
}
