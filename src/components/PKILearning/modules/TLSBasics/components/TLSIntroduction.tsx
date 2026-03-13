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
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { TLSHandshakeDiagram } from './TLSHandshakeDiagram'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'

interface TLSIntroductionProps {
  onNavigateToSimulate: () => void
}

export const TLSIntroduction: React.FC<TLSIntroductionProps> = ({ onNavigateToSimulate }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
              <li>0-RTT early data (optional)</li>
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
        <p className="text-foreground/80 leading-relaxed mb-4">
          The trade-off: PQC algorithms have larger keys and ciphertexts, increasing handshake
          overhead. For example, ML-KEM-768 public keys are ~1,184 bytes vs 32 bytes for X25519. The
          hybrid approach (e.g., X25519MLKEM768) provides quantum resistance while maintaining
          classical security as a fallback.
        </p>
        <button
          onClick={onNavigateToSimulate}
          className="btn btn-primary flex items-center gap-2 px-4 py-2"
        >
          Try It in the Simulator <ArrowRight size={16} />
        </button>
      </section>

      {/* Merkle Tree Certificates */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <TreePine size={20} /> Merkle Tree Certificates: Scaling PQC for HTTPS
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          PQC signatures are significantly larger than classical ones — an ML-DSA certificate chain
          can add several kilobytes to every TLS handshake. For the web, where billions of
          connections happen daily, this overhead is a serious scalability concern. Google&apos;s{' '}
          <strong>Merkle Tree Certificates (MTC)</strong> program (announced February 2026) proposes
          a solution.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-status-warning mb-1">
              Problem: X.509 Certificate Chains
            </div>
            <p className="text-xs text-muted-foreground">
              Traditional TLS uses a chain of X.509 certificates, each containing a public key and a
              signature from the issuing CA. With PQC signatures (~2.4 KB for ML-DSA-65), a typical
              2-certificate chain adds ~5 KB+ to the handshake — a substantial bandwidth increase.
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
      <ReadingCompleteButton />
    </div>
  )
}
