// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  Key,
  Lock,
  Zap,
  ArrowRight,
  BarChart3,
  Terminal,
  KeyRound,
  Radio,
  TreePine,
  ExternalLink,
  RefreshCw,
  Hash,
  FileSearch,
  EyeOff,
  Minimize2,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { TLSHandshakeDiagram } from './TLSHandshakeDiagram'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { Button } from '@/components/ui/button'

interface TLSIntroductionProps {
  onNavigateToSimulate: () => void
}

export const TLSIntroduction: React.FC<TLSIntroductionProps> = ({ onNavigateToSimulate }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Learning Objectives & Prerequisites */}
      <section className="glass-panel p-6 border-l-4 border-l-primary/50">
        <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
          Before You Start
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          <strong>Prerequisites:</strong> Familiarity with public-key cryptography (asymmetric keys,
          digital signatures, certificates) and basic HTTPS concepts.
        </p>
        <p className="text-xs text-muted-foreground">
          <strong>After completing this module, you will be able to:</strong>
        </p>
        <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1 mt-1">
          <li>Explain the TLS 1.3 handshake and how it differs from TLS 1.2</li>
          <li>Compare overhead of classical, hybrid, and PQC TLS configurations quantitatively</li>
          <li>Configure a web server for hybrid PQC TLS key exchange</li>
        </ol>
      </section>

      {/* What is TLS 1.3? */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shield size={20} /> What is TLS 1.3?
        </h2>
        <p className="text-foreground/80 leading-relaxed">
          <InlineTooltip term="TLS">TLS</InlineTooltip> 1.3 (RFC 8446) is the latest version of the
          Transport Layer Security protocol, securing virtually all HTTPS traffic on the internet.
          It was a major overhaul from TLS 1.2, removing insecure legacy features and introducing
          mandatory <InlineTooltip term="Forward Secrecy">forward secrecy</InlineTooltip>, a faster
          1-RTT handshake, and a dramatically simplified cipher suite list.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-success mb-1">Removed</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>RSA key exchange (no forward secrecy)</li>
              <li>CBC cipher modes</li>
              <li>Renegotiation & compression</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-1">Added</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Mandatory ECDHE forward secrecy</li>
              <li>
                0-RTT early data (optional){' '}
                <span className="text-status-warning font-normal">
                  — vulnerable to replay attacks; servers must mitigate (RFC 8446 §8)
                </span>
              </li>
              <li>Encrypted handshake messages</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-warning mb-1">Simplified</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>5 cipher suites (vs hundreds in 1.2)</li>
              <li>1-RTT handshake (vs 2-RTT)</li>
              <li>AEAD-only encryption</li>
            </ul>
          </div>
        </div>
      </section>

      {/* The Handshake */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Zap size={20} /> The TLS 1.3{' '}
          <InlineTooltip term="TLS Handshake">Handshake</InlineTooltip>
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          The handshake establishes a secure connection in a single round trip. The client sends its
          supported parameters and a key share; the server responds with its choice and key share.
          After the ServerHello, all remaining handshake messages are encrypted using handshake
          traffic keys derived via <InlineTooltip term="HKDF">HKDF</InlineTooltip>.
        </p>
        <TLSHandshakeDiagram />
      </section>

      {/* Cipher Suites Explained */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Lock size={20} /> <InlineTooltip term="Cipher Suite">Cipher Suites</InlineTooltip>{' '}
          Explained
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          TLS 1.3 cipher suites only specify the symmetric encryption algorithm and hash — key
          exchange and authentication are negotiated separately. This is why there are only 5 suites
          compared to hundreds in TLS 1.2.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border font-mono text-sm space-y-2">
          <div>
            <span className="text-primary font-bold">TLS_AES_256_GCM_SHA384</span>
            <span className="text-muted-foreground ml-3 text-xs">
              <InlineTooltip term="AES">AES-256</InlineTooltip> in GCM mode (AEAD) + SHA-384 for
              HKDF
            </span>
          </div>
          <div>
            <span className="text-primary font-bold">TLS_AES_128_GCM_SHA256</span>
            <span className="text-muted-foreground ml-3 text-xs">
              AES-128 in GCM mode (AEAD) + SHA-256 for HKDF
            </span>
          </div>
          <div>
            <span className="text-primary font-bold">TLS_CHACHA20_POLY1305_SHA256</span>
            <span className="text-muted-foreground ml-3 text-xs">
              <InlineTooltip term="ChaCha20-Poly1305">ChaCha20-Poly1305</InlineTooltip> (AEAD) +
              SHA-256 — optimized for mobile/ARM
            </span>
          </div>
          <div>
            <span className="text-primary font-bold">TLS_AES_128_CCM_SHA256</span>
            <span className="text-muted-foreground ml-3 text-xs">
              AES-128 in CCM mode + SHA-256 — designed for constrained environments (IoT)
            </span>
          </div>
          <div>
            <span className="text-primary font-bold">TLS_AES_128_CCM_8_SHA256</span>
            <span className="text-muted-foreground ml-3 text-xs">
              AES-128 in CCM mode with 8-byte auth tag + SHA-256 — for highly constrained devices
            </span>
          </div>
        </div>
      </section>

      {/* Key Exchange */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Key size={20} /> Key Exchange: Classical, PQC, and Hybrid
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          TLS 1.3 uses ephemeral key exchange for every connection, ensuring forward secrecy. With
          post-quantum cryptography (PQC), three approaches are available:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="text-sm font-bold text-primary mb-1">
              Classical (<InlineTooltip term="ECDH">ECDH</InlineTooltip>)
            </div>
            <p className="text-xs text-muted-foreground">
              <InlineTooltip term="X25519">X25519</InlineTooltip>,{' '}
              <InlineTooltip term="P-256">P-256</InlineTooltip>,{' '}
              <InlineTooltip term="P-384">P-384</InlineTooltip>. Fast and small (~32 byte keys).
              Vulnerable to quantum computers.
            </p>
          </div>
          <div className="bg-success/5 rounded-lg p-3 border border-success/20">
            <div className="text-sm font-bold text-success mb-1">
              PQC (<InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip>)
            </div>
            <p className="text-xs text-muted-foreground">
              ML-KEM-512/768/1024. Quantum-resistant. Larger keys (~1.2 KB for ML-KEM-768) increase
              handshake size.
            </p>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20">
            <div className="text-sm font-bold text-warning mb-1">Hybrid</div>
            <p className="text-xs text-muted-foreground">
              <InlineTooltip term="X25519MLKEM768">X25519MLKEM768</InlineTooltip> combines both.
              Already deployed in Chrome and Firefox. Secure even if one algorithm is broken.
            </p>
          </div>
        </div>
      </section>

      {/* Key Schedule */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Lock size={20} /> Key Schedule (HKDF)
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          TLS 1.3 derives all session keys through a structured key schedule using HKDF (HMAC-based
          Key Derivation Function). The shared secret from key exchange feeds into a chain of
          Extract and Expand operations:
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">1.</span>
            <span className="text-foreground/80">
              <strong className="text-primary">Early Secret</strong> — derived from PSK (or zero for
              full handshake)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">2.</span>
            <span className="text-foreground/80">
              <strong className="text-warning">Handshake Secret</strong> — derived from ECDHE/KEM
              shared secret → produces{' '}
              <code className="text-xs bg-muted px-1 rounded">CLIENT_HANDSHAKE_TRAFFIC_SECRET</code>{' '}
              and{' '}
              <code className="text-xs bg-muted px-1 rounded">SERVER_HANDSHAKE_TRAFFIC_SECRET</code>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">3.</span>
            <span className="text-foreground/80">
              <strong className="text-success">Master Secret</strong> — produces{' '}
              <code className="text-xs bg-muted px-1 rounded">CLIENT_TRAFFIC_SECRET_0</code> and{' '}
              <code className="text-xs bg-muted px-1 rounded">SERVER_TRAFFIC_SECRET_0</code> for
              application data
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          These exact secrets are visible in the Simulate tab after running a handshake.
        </p>
        <div className="mt-4 bg-muted/50 rounded-lg p-3 border border-border">
          <h4 className="text-xs font-bold text-foreground mb-1">Session Resumption &amp; PSK</h4>
          <p className="text-xs text-muted-foreground">
            After a successful handshake, the server issues a{' '}
            <InlineTooltip term="PSK">Pre-Shared Key (PSK)</InlineTooltip> ticket. On reconnection,
            the client presents this PSK, which feeds into the Early Secret stage — enabling a
            faster resumed handshake and optionally 0-RTT early data. In a full handshake with no
            prior session, the PSK input is zero.
          </p>
        </div>
      </section>

      {/* HelloRetryRequest */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <RefreshCw size={20} /> HelloRetryRequest (HRR)
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          If the server does not support any of the key exchange groups offered in the client&apos;s
          initial ClientHello, it responds with a <strong>HelloRetryRequest</strong> instead of a
          ServerHello. This tells the client to retry with a different key share. The result is a
          2-RTT handshake instead of the standard 1-RTT.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">When Does HRR Happen?</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Client offers X25519 only, server requires ML-KEM</li>
              <li>Client offers ML-KEM-768, server wants ML-KEM-1024</li>
              <li>Client&apos;s key_share group doesn&apos;t match any server preference</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">PQC Migration Impact</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>During PQC rollout, mismatched groups are common</li>
              <li>
                Hybrid groups (X25519MLKEM768) minimize HRR — classical clients still match X25519
              </li>
              <li>HRR adds latency but never breaks the connection</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          In the simulator, try configuring the client with only ML-KEM-1024 and the server with
          only X25519 to observe a group negotiation mismatch.
        </p>
      </section>

      {/* PQC in TLS */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shield size={20} /> Post-Quantum Cryptography in TLS
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          Quantum computers threaten classical key exchange (ECDH) through{' '}
          <InlineTooltip term="Shor's Algorithm">Shor&apos;s algorithm</InlineTooltip>. The{' '}
          <InlineTooltip term="Harvest Now, Decrypt Later">
            &quot;harvest now, decrypt later&quot;
          </InlineTooltip>{' '}
          attack means adversaries can record encrypted traffic today and decrypt it once quantum
          computers are available. PQC integration into TLS addresses this by using{' '}
          <InlineTooltip term="Lattice-Based Cryptography">lattice-based</InlineTooltip> KEMs
          (ML-KEM) and signatures (<InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip>).
        </p>
        <p className="text-foreground/80 leading-relaxed mb-3">
          The trade-off: PQC algorithms have larger keys and ciphertexts, increasing handshake
          overhead. For example, ML-KEM-768 public keys are ~1,184 bytes vs 32 bytes for X25519. The
          hybrid approach (e.g., X25519MLKEM768) provides quantum resistance while maintaining
          classical security as a fallback.
        </p>
        <div className="bg-muted/50 rounded-lg p-3 border border-border mb-4">
          <h4 className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
            <Hash size={12} /> SLH-DSA: Hash-Based Alternative (FIPS 205)
          </h4>
          <p className="text-xs text-muted-foreground">
            <InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip> (formerly SPHINCS+) is a
            hash-based signature scheme standardized alongside ML-DSA. It relies on hash function
            security rather than lattice problems, providing{' '}
            <strong>cryptographic diversity</strong>— if lattices are broken, SLH-DSA remains
            secure. The trade-off is significantly larger signatures (~7.9 KB (7,856 B) for
            SLH-DSA-SHA2-128s vs ~2.4 KB for ML-DSA-44). Both are available in the simulator&apos;s
            signature algorithm options.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={onNavigateToSimulate}
          className="btn btn-primary flex items-center gap-2 px-4 py-2"
        >
          Try It in the Simulator <ArrowRight size={16} />
        </Button>
      </section>

      {/* Certificate Overhead Mitigations */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <TreePine size={20} /> Scaling PQC for HTTPS
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          PQC signatures are significantly larger than classical ones — an ML-DSA certificate chain
          can add several kilobytes to every TLS handshake. For the web, where billions of
          connections happen daily, this overhead is a serious scalability concern. The ecosystem is
          deploying multiple mitigations.
        </p>

        {/* Certificate Compression */}
        <div className="bg-muted/50 rounded-lg p-3 border border-border mb-4">
          <h4 className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
            <Minimize2 size={12} /> TLS Certificate Compression (RFC 8879)
          </h4>
          <p className="text-xs text-muted-foreground">
            Already supported by major browsers, TLS certificate compression can reduce PQC
            certificate overhead by 30-60%. Certificates are compressed with Zlib or Brotli before
            transmission and decompressed by the peer. This is a practical short-term mitigation
            available today while more advanced solutions are being built.
          </p>
        </div>

        {/* Certificate Transparency context */}
        <div className="bg-muted/50 rounded-lg p-3 border border-border mb-4">
          <h4 className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
            <FileSearch size={12} /> Certificate Transparency (RFC 9162)
          </h4>
          <p className="text-xs text-muted-foreground">
            Certificate Transparency (CT) requires CAs to log all issued certificates in publicly
            auditable append-only logs. Browsers verify that certificates appear in CT logs,
            preventing misissued certificates from going undetected. Understanding CT is essential
            context for Merkle Tree Certificates, which leverage this same log infrastructure.
          </p>
        </div>

        {/* MTC */}
        <h3 className="text-sm font-bold text-foreground mb-2">Merkle Tree Certificates (MTC)</h3>
        <p className="text-foreground/80 text-sm leading-relaxed mb-3">
          Google&apos;s <strong>MTC</strong> program (announced February 2026) goes further than
          compression — it replaces entire certificate chains with compact Merkle proofs.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-status-warning mb-1">
              Problem: X.509 Certificate Chains
            </div>
            <p className="text-xs text-muted-foreground">
              Traditional TLS uses a chain of X.509 certificates, each containing a public key and a
              signature from the issuing CA. With PQC signatures (~3.3 KB for ML-DSA-65), a typical
              2-certificate chain adds ~7 KB+ to the handshake — a substantial bandwidth increase.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-status-success mb-1">
              Solution: Merkle Tree Proofs
            </div>
            <p className="text-xs text-muted-foreground">
              MTCs replace the serialized signature chain with a compact Merkle inclusion proof. A
              single CA-signed &quot;Tree Head&quot; represents potentially millions of
              certificates. Browsers receive a lightweight proof-of-inclusion rather than full
              certificate chains.
            </p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <h4 className="text-sm font-bold text-foreground mb-2">Deployment Roadmap</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-status-success font-bold shrink-0">Phase 1 (Now)</span>
              <span>
                Feasibility testing with Cloudflare on live traffic; all MTC connections backed by
                traditional X.509 certificates as fallback
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold shrink-0">Phase 2 (Q1 2027)</span>
              <span>
                Inviting Certificate Transparency log operators to bootstrap public MTC
                infrastructure
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-warning font-bold shrink-0">Phase 3 (Q3 2027)</span>
              <span>
                Establishing Chrome Quantum-resistant Root Store (CQRS) with new requirements for
                MTC Certificate Authorities
              </span>
            </div>
          </div>
        </div>
        <a
          href="https://security.googleblog.com/2026/02/cultivating-robust-and-efficient.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3"
        >
          Google Security Blog: Quantum-safe HTTPS <ExternalLink size={11} />
        </a>
      </section>

      {/* Encrypted Client Hello */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <EyeOff size={20} /> Encrypted Client Hello (ECH)
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          PQC protects the <em>content</em> of TLS connections from quantum attack, but the initial
          ClientHello — including the{' '}
          <InlineTooltip term="SNI">Server Name Indication (SNI)</InlineTooltip> — is sent in
          plaintext, revealing <em>which site</em> a user is connecting to. Encrypted Client Hello
          (ECH) solves this by encrypting the ClientHello using a key published in DNS.
        </p>
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground">
            Major browsers are deploying ECH alongside hybrid PQC key exchange (X25519MLKEM768).
            Together, they protect both the metadata (who you connect to) and the content (what you
            exchange) against current and future adversaries.
          </p>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/vpn-ssh-pqc"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <Lock size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">VPN/IPsec &amp; SSH</div>
              <div className="text-xs text-muted-foreground">
                PQC in IKEv2, SSH, and WireGuard protocols
              </div>
            </div>
          </Link>
          <Link
            to="/algorithms"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <BarChart3 size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Algorithm Explorer</div>
              <div className="text-xs text-muted-foreground">
                Compare key sizes, security levels &amp; performance
              </div>
            </div>
          </Link>
          <Link
            to="/openssl"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <Terminal size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">OpenSSL Studio</div>
              <div className="text-xs text-muted-foreground">
                Run PQC commands live in your browser
              </div>
            </div>
          </Link>
          <Link
            to="/threats"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <Shield size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Threat Dashboard</div>
              <div className="text-xs text-muted-foreground">
                Industry-specific quantum risks &amp; PQC replacements
              </div>
            </div>
          </Link>
          <Link
            to="/learn/api-security-jwt"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <KeyRound size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">API Security &amp; JWT</div>
              <div className="text-xs text-muted-foreground">
                PQC tokens &amp; OAuth 2.0 migration over TLS
              </div>
            </div>
          </Link>
          <Link
            to="/learn/5g-security"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <Radio size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">5G Security</div>
              <div className="text-xs text-muted-foreground">
                SUCI, 5G-AKA &amp; PQC transport in mobile networks
              </div>
            </div>
          </Link>
          <Link
            to="/learn/web-gateway-pqc"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <Lock size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Web Gateway PQC</div>
              <div className="text-xs text-muted-foreground">
                PQC TLS termination at reverse proxies &amp; CDNs
              </div>
            </div>
          </Link>
          <Link
            to="/learn/network-security-pqc"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <Shield size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Network Security</div>
              <div className="text-xs text-muted-foreground">
                NGFWs, TLS inspection &amp; ZTNA with PQC cipher suites
              </div>
            </div>
          </Link>
        </div>
      </section>
      <VendorCoverageNotice migrateLayer="Network" />
      <ReadingCompleteButton />
    </div>
  )
}
