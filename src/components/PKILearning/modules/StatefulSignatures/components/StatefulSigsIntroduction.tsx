import React from 'react'
import { Link } from 'react-router-dom'
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
} from 'lucide-react'

interface StatefulSigsIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const StatefulSigsIntroduction: React.FC<StatefulSigsIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
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
            <strong>Hash-based signatures</strong> derive their security solely from the properties
            of cryptographic hash functions &mdash; the most conservative and well-understood
            assumption in cryptography. Unlike lattice-based or code-based schemes, they require no
            new hardness assumptions. LMS security rests on collision and second-preimage
            resistance; XMSS has a tighter proof requiring only{' '}
            <strong>second-preimage resistance</strong> &mdash; a weaker assumption that provides a
            stronger theoretical guarantee.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;LMS, HSS, XMSS, and XMSS^MT are approved for use by federal agencies for the
              protection of sensitive information when implemented in accordance with this
              recommendation.&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2">
              &mdash; NIST SP 800-208: Recommendation for Stateful Hash-Based Signature Schemes
              (October 2020)
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Minimal Assumptions</div>
              <p className="text-xs text-muted-foreground">
                Security relies only on hash function properties &mdash; no lattices, no codes, no
                isogenies. Decades of cryptanalysis on SHA-256.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">NIST Approved</div>
              <p className="text-xs text-muted-foreground">
                SP 800-208 standardized LMS/HSS (RFC 8554) and XMSS/XMSS^MT (RFC 8391) for federal
                use before the main PQC competition concluded.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">CNSA 2.0 Required</div>
              <p className="text-xs text-muted-foreground mb-2">
                NSA CNSA 2.0 mandates LMS/XMSS for firmware and software signing in national
                security systems, ahead of ML-DSA adoption. Phased timeline:
              </p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>
                  &bull; <strong>2025:</strong> New software/firmware should support &amp; prefer
                  CNSA 2.0
                </li>
                <li>
                  &bull; <strong>2030:</strong> All deployed NSS must use CNSA 2.0 signatures
                </li>
                <li>
                  &bull; <strong>2033&ndash;35:</strong> Full quantum-resistant enforcement
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
            The core idea is a <strong>Merkle tree</strong> of one-time signature (OTS) key pairs.
            Each leaf contains the hash of a unique OTS public key. The tree root is the overall
            public key. To sign, you use the next unused OTS leaf and provide an authentication path
            from that leaf to the root.
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
              <div className="text-xs font-bold text-foreground mb-1">
                One-Time Signatures (OTS)
              </div>
              <p className="text-xs text-muted-foreground">
                Each OTS key pair (e.g., Winternitz OTS+) can sign exactly one message. Reusing an
                OTS key leaks the private key, enabling forgeries.
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
              Each OTS secret key is a set of random values. To sign, each value is hashed a number
              of times based on the message digest &mdash; revealing an intermediate chain value.
              The public key is the <em>fully hashed</em> end of each chain.
            </p>
            <div className="space-y-1 text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">sk</span>
                <span className="text-muted-foreground">&rarr;</span>
                <span className="px-1.5 py-0.5 rounded bg-destructive/10 border border-destructive/20 text-destructive">
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
                H&sup5;(sk). An attacker who sees both can compute the full chain and forge
                arbitrary messages &mdash; this is why OTS reuse is a{' '}
                <strong>complete break</strong>, not a partial leak. The checksum field prevents
                attackers from simply &ldquo;advancing&rdquo; the chain to forge messages with
                higher digit values.
              </p>
            </div>
          </div>
        </div>
      </section>

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
                <li>&bull; Small public key: 56 bytes</li>
                <li>&bull; Signature size: 1.3 &ndash; 9.3 KB depending on H, W</li>
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
                <strong>Security note:</strong> W has <em>zero impact on security level</em>. It
                only controls the size&thinsp;/&thinsp;speed trade-off. Security is determined by
                the hash function and n (hash output length), not by W.
              </p>
            </div>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20">
            <div className="text-xs font-bold text-warning mb-1">
              SP 800-208 Operational Requirement
            </div>
            <p className="text-xs text-muted-foreground">
              NIST SP 800-208 originally required that key generation and signing be performed
              inside a <strong>FIPS 140-validated hardware cryptographic module</strong> with no
              private key export. HSMs with atomic state management are therefore not merely a
              best-practice &mdash; they are the basis of the standard&rsquo;s security model.
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
            hash construction (for multi-target attack resistance) and a different OTS scheme
            (WOTS+). <strong>XMSS^MT</strong> is the multi-tree variant, analogous to HSS.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-3">LMS vs XMSS Comparison</div>
            <div className="overflow-x-auto">
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
                    <td className="py-2 pr-4 font-medium text-foreground">Forward Security</td>
                    <td className="py-2 pr-4 text-muted-foreground/60">No</td>
                    <td className="py-2 text-success font-medium">
                      Yes &mdash; past signatures stay secure even if current key is compromised
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">Adoption</td>
                    <td className="py-2 pr-4">NSA CNSA 2.0, broader industry</td>
                    <td className="py-2">BSI (Germany), European preference</td>
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
              PRF-derived bitmasks before hashing, providing domain separation and multi-target
              attack resistance. These add ~4&times; the hash computations of LMS but yield the
              tighter second-preimage-only security proof.
            </p>
            <p>
              Both LMS and XMSS are approved by NIST SP 800-208. Regulatory preference: NSA CNSA 2.0
              favors LMS/HSS; BSI guidelines favor XMSS/XMSS^MT.
            </p>
          </div>
        </div>
      </section>

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
              <strong>complete break</strong> of the scheme. There is no recovery; the entire key
              must be revoked.
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
              Stateful (LMS/XMSS) vs Stateless (SLH-DSA / SPHINCS+)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-bold">
                      Property
                    </th>
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
                    <td className="py-2 text-success font-medium">Effectively unlimited</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium text-foreground">CNSA 2.0</td>
                    <td className="py-2 pr-4 text-success font-medium">
                      Required for firmware/software
                    </td>
                    <td className="py-2 text-muted-foreground/60">Not included in CNSA 2.0</td>
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
              LMS/XMSS and SLH-DSA are <strong>complementary</strong>, not competing. Stateful
              schemes win on size and speed in controlled environments; SLH-DSA wins wherever state
              management is impractical.
            </p>
          </div>
        </div>
      </section>

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
            to="/algorithms"
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
            to="/library"
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
            href="https://datatracker.ietf.org/doc/draft-ietf-pquip-hbs-state/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <ExternalLink size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">
                IETF HBS State Management Draft
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
        <button
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Explore LMS and XMSS key generation, compare parameter sets, and simulate state
          management.
        </p>
      </div>
    </div>
  )
}
