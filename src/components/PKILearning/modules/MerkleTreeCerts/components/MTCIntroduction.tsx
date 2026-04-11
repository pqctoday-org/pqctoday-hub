// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TreePine,
  ArrowRight,
  AlertTriangle,
  Shield,
  GitBranch,
  Globe,
  Scale,
  Lock,
  ChevronDown,
  Layers,
  Eye,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { Button } from '@/components/ui/button'

interface MTCIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const MTCIntroduction: React.FC<MTCIntroductionProps> = ({ onNavigateToWorkshop }) => {
  const [showSignatureless, setShowSignatureless] = useState(false)
  return (
    <div className="space-y-6 w-full">
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
            <div className="text-xs text-muted-foreground">
              PQC TLS chain overhead
              <span className="block text-[10px] mt-0.5 opacity-70">
                (incl. cert body, SANs, extensions)
              </span>
            </div>
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
                The Merkle Tree CA collects thousands of certificate assertions and places them as
                leaves in a binary hash tree. Each leaf is{' '}
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
                One CA signing operation covers the entire batch &mdash; potentially millions of
                certificates. Depending on the relying party&apos;s cosigner policy, additional
                external witnesses may also co-sign the subtree to guarantee public transparency.
                For <strong>signatureless certificates</strong>, no embedded signatures are needed
                at all (relying parties use predistributed trusted subtrees instead).
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
          <div className="text-center text-primary font-bold mb-1">Root Hash (signed by CA)</div>
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
          The MTC ecosystem defines five key roles (per <em>draft-ietf-plants-merkle-tree-certs</em>{' '}
          Section 2.1), redesigned from Certificate Transparency for batch efficiency:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="text-sm font-bold text-primary mb-1">Certification Authority (CA)</div>
            <p className="text-xs text-muted-foreground">
              Maintains the issuance log, builds the Merkle tree, signs checkpoints and subtrees,
              requests cosignatures, and assembles certificates with inclusion proofs. The CA
              certifies information by <em>logging</em> it, inverting the CT model.
            </p>
          </div>
          <div className="bg-success/5 rounded-lg p-3 border border-success/20">
            <div className="text-sm font-bold text-success mb-1">Cosigner</div>
            <p className="text-xs text-muted-foreground">
              Signs views of the issuance log to assert correct operation. Cosigners verify the log
              is append-only, optionally mirror its contents, and cosign checkpoints and subtrees.
              One cosigner signature covers a subtree of millions of entries.
            </p>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20">
            <div className="text-sm font-bold text-warning mb-1">Authenticating Party</div>
            <p className="text-xs text-muted-foreground">
              TLS servers that receive their certificate assertion + inclusion proof from the CA and
              present them during the TLS handshake. Sends the Certificate and CertificateVerify
              messages.
            </p>
          </div>
          <div className="bg-accent/5 rounded-lg p-3 border border-accent/20">
            <div className="text-sm font-bold text-accent mb-1">Relying Party</div>
            <p className="text-xs text-muted-foreground">
              The client that verifies certificates. Maintains trusted subtrees, cosigner
              requirements, and revoked index ranges. For landmark certificates, relying parties
              pre-sync trusted subtrees in the background.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-foreground flex items-center gap-1 mb-1">
              <Eye size={14} /> Monitor
            </div>
            <p className="text-xs text-muted-foreground">
              Watches the issuance log for certificates of interest, analogous to CT monitors.
              Ensures the CA is operated correctly and entries are publicly visible.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Certificate Types & Tradeoffs */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Scale size={20} /> Certificate Types &amp; Tradeoffs
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          The spec defines two certificate types. Authenticating parties SHOULD deploy both and
          select based on client capabilities:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="text-sm font-bold text-primary mb-1">Standalone Certificate</div>
            <p className="text-xs text-muted-foreground">
              Contains an inclusion proof <em>plus</em> cosignatures from the CA and external
              cosigners. Works without any predistributed state &mdash; the relying party verifies
              signatures at connection time. Can be issued with minimal processing delay.
            </p>
          </div>
          <div className="bg-success/5 rounded-lg p-3 border border-success/20">
            <div className="text-sm font-bold text-success mb-1">Landmark Certificate</div>
            <p className="text-xs text-muted-foreground">
              Contains an inclusion proof to a predistributed landmark subtree and{' '}
              <strong>no signatures</strong>. Relying parties pre-sync trusted landmark subtrees in
              the background. Maximal size savings but requires an up-to-date client.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-success/5 rounded-lg p-3 border border-success/20">
            <div className="text-sm font-bold text-success mb-2">Advantages (both types)</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                &bull; Massive size reduction (60&ndash;63% standalone, 92% landmark for ML-DSA)
              </li>
              <li>&bull; Single CA signing operation covers millions of certificates</li>
              <li>&bull; Inclusion proof is pure hash computation &mdash; fast to verify</li>
              <li>&bull; Inherent certificate transparency (issuance log = public record)</li>
            </ul>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20">
            <div className="text-sm font-bold text-warning mb-2">Considerations</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                &bull; <strong>Landmark only:</strong> clients must pre-sync trusted subtrees
                periodically; not suitable for offline or intermittently-connected devices
              </li>
              <li>
                &bull; Revocation uses <strong>Revocation by Index</strong> (Section 7.5): relying
                parties maintain revoked ranges of indices checked at verification time
              </li>
              <li>
                &bull; Trust requires meeting <strong>cosigner requirements</strong> &mdash; relying
                parties accept a subtree only after a configured set of cosigners have signed it,
                preventing a compromised CA from silently misissu&shy;ing
              </li>
              <li>
                &bull; <strong>Standalone only:</strong> certificates carry multiple cosignatures,
                adding some bytes beyond the inclusion proof
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 4.5: Advanced — Signatureless Certificates */}
      <section className="glass-panel">
        <Button
          variant="ghost"
          onClick={() => setShowSignatureless((v) => !v)}
          className="w-full p-6 flex items-center justify-between text-left"
          aria-expanded={showSignatureless}
        >
          <h2 className="text-xl font-bold text-gradient flex items-center gap-2">
            <Layers size={20} /> Deep Dive: Landmark Certificates
          </h2>
          <ChevronDown
            size={20}
            className={`text-muted-foreground transition-transform shrink-0 ${showSignatureless ? 'rotate-180' : ''}`}
          />
        </Button>
        {showSignatureless && (
          <div className="px-6 pb-6 space-y-4">
            <p className="text-foreground/80 leading-relaxed">
              Landmark certificates carry <em>zero</em> embedded signatures. Instead of embedding
              cosignatures, relying parties periodically pre-sync &ldquo;landmark&rdquo; subtrees
              out-of-band (the spec suggests allocating landmarks at regular intervals, e.g. every
              hour), then verify inclusion proofs against their cached landmark root &mdash; no
              signature transmitted in the TLS handshake at all.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="text-xs font-bold text-primary mb-1">1. Landmark allocation</div>
                <p className="text-xs text-muted-foreground">
                  Periodically (e.g., every hour), the CA designates its latest checkpoint tree size
                  as a landmark. With projected short-lived certificate issuance rates (~4.4M
                  certs/hour for a large CA), each landmark subtree spans millions of entries.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="text-xs font-bold text-success mb-1">2. Background pre-sync</div>
                <p className="text-xs text-muted-foreground">
                  Browsers and OS clients periodically download and cache trusted landmark subtrees,
                  with cosignatures checked against relying party requirements &mdash; similar to
                  certificate revocation syncs today. No online step required during the TLS
                  handshake.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="text-xs font-bold text-warning mb-1">3. Proof-only handshake</div>
                <p className="text-xs text-muted-foreground">
                  The TLS server presents only the certificate assertion + 23-hash inclusion proof
                  (736 B). The client verifies against its cached landmark root. Total per-handshake
                  overhead for ML-DSA-44: <strong>~936 bytes</strong>.
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border overflow-x-auto">
              <h4 className="text-sm font-bold text-foreground mb-3">
                ML-DSA-44 Handshake Size Comparison
              </h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2 pr-3">Mode</th>
                    <th className="text-right py-2 px-2">Sigs + Keys</th>
                    <th className="text-right py-2 px-2">Proof</th>
                    <th className="text-right py-2 px-2">Total</th>
                    <th className="text-right py-2 pl-2">Savings</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-3 font-medium text-foreground">Traditional X.509</td>
                    <td className="text-right py-2 px-2 font-mono">11,196 B</td>
                    <td className="text-right py-2 px-2 font-mono text-muted-foreground">—</td>
                    <td className="text-right py-2 px-2 font-mono text-destructive font-bold">
                      12,034 B
                    </td>
                    <td className="text-right py-2 pl-2 text-muted-foreground">baseline</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-3 font-medium text-foreground">Standalone MTC</td>
                    <td className="text-right py-2 px-2 font-mono">3,860 B</td>
                    <td className="text-right py-2 px-2 font-mono">736 B</td>
                    <td className="text-right py-2 px-2 font-mono text-primary font-bold">
                      4,796 B
                    </td>
                    <td className="text-right py-2 pl-2 text-success font-bold">60%</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-medium text-foreground">
                      Landmark MTC <span className="text-[10px] text-success">(no signatures)</span>
                    </td>
                    <td className="text-right py-2 px-2 font-mono text-success font-bold">0 B</td>
                    <td className="text-right py-2 px-2 font-mono">736 B</td>
                    <td className="text-right py-2 px-2 font-mono text-success font-bold">936 B</td>
                    <td className="text-right py-2 pl-2 text-success font-bold">92%</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[10px] text-muted-foreground mt-2">
                Traditional: 3 sigs (7,260 B) + 3 keys (3,936 B) + 2 SCTs (238 B) + metadata (600
                B). Standalone: 1 CA sig (2,420 B) + 1 key (1,312 B) + cosigner sigs (~128 B) + 736
                B proof + 200 B metadata. Landmark: 736 B proof + 200 B metadata only &mdash; client
                has trusted subtree cached. Cosigner overhead is policy-dependent (minimum shown).
              </p>
            </div>

            <div className="bg-warning/5 rounded-lg p-3 border border-warning/20 text-xs text-muted-foreground">
              <strong className="text-warning">Tradeoff:</strong> Signatureless certificates require
              relying parties to pre-sync landmark subtrees regularly (e.g., every few hours).
              Clients that miss a sync window cannot verify newer certificates without an update
              &mdash; acceptable for always-online clients (browsers, mobile) but unsuitable for
              air-gapped or intermittently-connected devices.
            </div>
          </div>
        )}
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
          across Google, Cloudflare, and Geomys.{' '}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-warning/20 text-warning border border-warning/40">
            Draft — not yet an RFC
          </span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-1">Timeline</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; March 2023: Initial draft published (draft-00)</li>
              <li>&bull; October 2025: Cloudflare + Chrome experiment announced</li>
              <li>
                &bull; January 2026: <code>draft-davidben-tls-merkle-tree-certs-10</code> submitted;
                adopted by IETF PLANTS WG as <code>draft-ietf-plants-merkle-tree-certs-00</code>
              </li>
              <li>
                &bull; February 2026: <code>draft-ietf-plants-merkle-tree-certs-01</code> published
              </li>
              <li>
                &bull; March 2026: <code>draft-ietf-plants-merkle-tree-certs-02</code> published
              </li>
              <li className="text-warning font-medium pt-1">
                &bull; Status: Active IETF draft — not yet standardized as an RFC. Not recommended
                for production deployment without vendor support.
              </li>
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

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Merkle trees are fundamental to post-quantum cryptography beyond MTCs.{' '}
          <InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip> (SPHINCS+, FIPS 205) uses nested
          Merkle trees internally for quantum-resistant signatures. Stateful hash-based schemes like{' '}
          <InlineTooltip term="LMS">LMS</InlineTooltip> and{' '}
          <InlineTooltip term="XMSS">XMSS</InlineTooltip> use Merkle trees to organize pools of
          one-time signing keys. MTCs apply the same principle at the <em>infrastructure</em> level
          to solve the certificate size problem PQ signatures create.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/stateful-signatures"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <GitBranch size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Stateful Hash Signatures</div>
              <div className="text-xs text-muted-foreground">
                LMS, XMSS, and SLH-DSA Merkle tree internals
              </div>
            </div>
          </Link>
          <Link
            to="/learn/pki-workshop"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">PKI Workshop</div>
              <div className="text-xs text-muted-foreground">
                Certificate issuance and PQC root of trust migration
              </div>
            </div>
          </Link>
          <Link
            to="/learn/tls-basics"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Lock size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">TLS Basics &amp; PQC</div>
              <div className="text-xs text-muted-foreground">
                How MTCs reduce TLS handshake size with PQ certificates
              </div>
            </div>
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
          <Button
            variant="ghost"
            onClick={onNavigateToWorkshop}
            className="btn btn-primary flex items-center gap-2 px-6 py-3 mx-auto"
          >
            <TreePine size={16} /> Start the Workshop <ArrowRight size={16} />
          </Button>
        </div>
      </section>
      <ReadingCompleteButton />
    </div>
  )
}
