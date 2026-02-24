import React from 'react'
import { Link } from 'react-router-dom'
import {
  TreePine,
  ArrowRight,
  AlertTriangle,
  Shield,
  GitBranch,
  Globe,
  Hash,
  Scale,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'

interface MTCIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const MTCIntroduction: React.FC<MTCIntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Section 1: The Certificate Bloat Problem */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <AlertTriangle size={20} /> The Certificate Bloat Problem
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          Post-quantum digital signatures are dramatically larger than their classical counterparts.
          While an <InlineTooltip term="ECDSA">ECDSA</InlineTooltip> P-256 signature is just{' '}
          <strong>64 bytes</strong>, an <InlineTooltip term="ML-DSA">ML-DSA-44</InlineTooltip>{' '}
          signature is <strong>2,420 bytes</strong> &mdash; a <strong>37&times;</strong> increase. A
          typical TLS certificate chain contains three signatures (Root CA, Intermediate CA, and
          end-entity), three public keys, and multiple Certificate Transparency{' '}
          <InlineTooltip term="SCT">SCTs</InlineTooltip>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-2xl font-bold text-primary">64 B</div>
            <div className="text-xs text-muted-foreground">ECDSA P-256 signature</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-2xl font-bold text-warning">2,420 B</div>
            <div className="text-xs text-muted-foreground">ML-DSA-44 signature</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-2xl font-bold text-destructive">18&ndash;36 KB</div>
            <div className="text-xs text-muted-foreground">PQC TLS chain overhead</div>
          </div>
        </div>
        <p className="text-foreground/80 leading-relaxed">
          This &ldquo;certificate bloat&rdquo; breaks constrained clients that reject chains larger
          than 10 KB, degrades connection setup times (especially on mobile networks), and increases
          bandwidth costs for high-traffic servers handling millions of TLS handshakes per second.
        </p>
      </section>

      {/* Section 2: How Merkle Tree Certificates Work */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <TreePine size={20} /> How Merkle Tree Certificates Work
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          <strong>Merkle Tree Certificates (MTCs)</strong> solve certificate bloat by replacing
          individual per-certificate signatures with a batch-signing approach using{' '}
          <InlineTooltip term="Merkle Tree">Merkle trees</InlineTooltip>:
        </p>
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 border border-border">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
              1
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Batch Certificates</div>
              <p className="text-xs text-muted-foreground">
                The Merkle Tree CA (MTCA) collects thousands of certificate assertions and places
                them as leaves in a binary hash tree. Each leaf is{' '}
                <strong>SHA-256(0x00 || cert&nbsp;data)</strong>; internal nodes use{' '}
                <strong>SHA-256(0x01 || left || right)</strong>. The domain-separation prefixes
                (0x00 / 0x01) prevent leaf hashes from ever being confused with internal node
                hashes.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 border border-border">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
              2
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Sign the Root</div>
              <p className="text-xs text-muted-foreground">
                Only the tree&apos;s root hash is signed with the CA&apos;s private key. One single
                PQ signature covers the entire batch &mdash; potentially millions of certificates.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 border border-border">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
              3
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Distribute Inclusion Proofs</div>
              <p className="text-xs text-muted-foreground">
                Each certificate holder receives a compact <strong>inclusion proof</strong>: the
                chain of sibling hashes from their leaf up to the root. This proof is 736 bytes for
                a batch of ~4.4 million certificates (23 sibling hashes &times; 32 bytes).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 border border-border">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
              4
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Verify via Hash Recomputation</div>
              <p className="text-xs text-muted-foreground">
                The relying party hashes the certificate, then combines it with each proof sibling
                up the tree. If the computed root matches the signed root, the certificate is
                authenticated &mdash; no per-certificate signature verification needed.
              </p>
            </div>
          </div>
        </div>

        {/* ASCII-style tree diagram */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border font-mono text-xs overflow-x-auto">
          <div className="text-center text-primary font-bold mb-1">Root Hash (signed by MTCA)</div>
          <div className="text-center text-muted-foreground mb-1">
            &darr;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&darr;
          </div>
          <div className="text-center text-foreground mb-1">
            &nbsp;&nbsp;H(0,1)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;H(2,3)
          </div>
          <div className="text-center text-muted-foreground mb-1">
            &darr;&nbsp;&darr;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&darr;&nbsp;&darr;
          </div>
          <div className="text-center text-success">
            Cert 1&nbsp;&nbsp;Cert 2&nbsp;&nbsp;&nbsp;&nbsp;Cert 3&nbsp;&nbsp;Cert 4
          </div>
          <div className="text-center text-muted-foreground mt-2 text-[10px]">
            To prove Cert 3 belongs to the batch, provide: H(Cert 4) + H(0,1) &rarr; recompute up to
            root
          </div>
        </div>
      </section>

      {/* Section 3: MTC Architecture */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shield size={20} /> MTC Architecture
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          The MTC ecosystem defines three key roles, similar to existing Certificate Transparency
          (CT) infrastructure but redesigned for batch efficiency:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="text-sm font-bold text-primary mb-1">MTCA</div>
            <p className="text-xs text-muted-foreground">
              <strong>Merkle Tree CA</strong> &mdash; Collects certificate assertions, builds the
              Merkle tree, signs the root hash, and distributes inclusion proofs to subscribers.
            </p>
          </div>
          <div className="bg-success/5 rounded-lg p-3 border border-success/20">
            <div className="text-sm font-bold text-success mb-1">Transparency Service</div>
            <p className="text-xs text-muted-foreground">
              Publishes signed tree roots so clients can periodically sync. Analogous to CT logs but
              with batch-level granularity rather than individual certificate entries.
            </p>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20">
            <div className="text-sm font-bold text-warning mb-1">Subscribers</div>
            <p className="text-xs text-muted-foreground">
              TLS servers that receive their certificate assertion + inclusion proof from the MTCA
              and present them during the TLS handshake for client verification.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Tradeoffs */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Scale size={20} /> Tradeoffs
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          MTCs offer significant size savings, but they introduce new requirements:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-success/5 rounded-lg p-3 border border-success/20">
            <div className="text-sm font-bold text-success mb-2">Advantages</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; Massive size reduction (63&ndash;74% for ML-DSA)</li>
              <li>&bull; Single CA signing operation covers millions of certificates</li>
              <li>&bull; Inclusion proof is pure hash computation &mdash; fast to verify</li>
              <li>&bull; Inherent certificate transparency (batch = public log)</li>
            </ul>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20">
            <div className="text-sm font-bold text-warning mb-2">Considerations</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                &bull; Clients must sync signed subtrees periodically (background, out-of-band)
              </li>
              <li>&bull; Not suitable for fully offline verification scenarios</li>
              <li>
                &bull; Revocation uses <strong>Revocation by Index</strong>: relying parties
                maintain index-range exclusion lists checked at verification time
              </li>
              <li>
                &bull; Trust requires a <strong>cosigner quorum</strong> &mdash; relying parties
                accept a subtree only after a configured set of external witnesses co-sign it,
                preventing a compromised CA from silently misissu&shy;ing
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 5: IETF Standardization */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Globe size={20} /> IETF Standardization Status
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          Merkle Tree Certificates originated as <em>draft-davidben-tls-merkle-tree-certs</em>{' '}
          (reaching draft-10, January 2026) and have since been adopted by the IETF PLANTS working
          group as <em>draft-ietf-plants-merkle-tree-certs</em>. The draft has five co-equal authors
          across Google, Cloudflare, and Geomys.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-1">Timeline</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; March 2023: Initial draft published (draft-00)</li>
              <li>&bull; October 2025: Cloudflare + Chrome experiment announced</li>
              <li>&bull; January 2026: draft-10 published; IETF PLANTS WG adoption</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-1">Authors &amp; Analysis</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; David Benjamin + Devon O&apos;Brien (Google)</li>
              <li>&bull; Bas Westerbaan + Luke Valenta (Cloudflare)</li>
              <li>&bull; Filippo Valsorda (Geomys)</li>
              <li>&bull; Radboud University (independent implementation analysis, 2025)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 6: Connection to Hash-Based Signatures */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Hash size={20} /> Connection to Hash-Based Signatures
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          Merkle trees are fundamental to post-quantum cryptography beyond MTCs.{' '}
          <InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip> (SPHINCS+, FIPS 205) uses nested
          Merkle trees internally (a hyper-tree of FORS trees) for quantum-resistant signatures.
          Stateful hash-based schemes like <InlineTooltip term="LMS">LMS</InlineTooltip> and{' '}
          <InlineTooltip term="XMSS">XMSS</InlineTooltip> use Merkle trees to organize pools of
          one-time signing keys.
        </p>
        <p className="text-foreground/80 leading-relaxed mb-4">
          MTCs apply the same hash-tree principle at the <em>infrastructure</em> level &mdash;
          organizing certificates rather than signing keys &mdash; to solve the size problem that
          these PQ signature schemes create.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/learn/stateful-signatures"
            className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg hover:border-primary/30 transition-colors text-sm text-foreground"
          >
            <GitBranch size={14} className="text-primary" />
            Stateful Hash Signatures Module
          </Link>
          <Link
            to="/learn/pki-workshop"
            className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg hover:border-primary/30 transition-colors text-sm text-foreground"
          >
            <Shield size={14} className="text-primary" />
            PKI Workshop
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="glass-panel p-6 border-primary/20">
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">Ready to Build?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Head to the Workshop to build a Merkle tree, generate inclusion proofs, and verify
            certificates hands-on.
          </p>
          <button
            onClick={onNavigateToWorkshop}
            className="btn btn-primary flex items-center gap-2 px-6 py-3 mx-auto"
          >
            <TreePine size={16} /> Start the Workshop <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  )
}
