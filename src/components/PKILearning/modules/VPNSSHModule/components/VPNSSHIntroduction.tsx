import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  ArrowRight,
  Network,
  Terminal,
  Lock,
  Ruler,
  BookOpen,
  FlaskConical,
  Layers,
  Key,
} from 'lucide-react'

interface VPNSSHIntroductionProps {
  onNavigateToSimulate: () => void
}

export const VPNSSHIntroduction: React.FC<VPNSSHIntroductionProps> = ({ onNavigateToSimulate }) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: IKEv2 Handshake Overview */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">IKEv2 Handshake Overview</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <strong>IKEv2</strong> (Internet Key Exchange version 2, RFC 7296) is the key
            negotiation protocol for IPsec VPNs. It establishes Security Associations (SAs) through
            a two-phase handshake: <strong>IKE_SA_INIT</strong> for key exchange and{' '}
            <strong>IKE_AUTH</strong> for identity verification.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="space-y-3 text-center">
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="text-right text-xs font-bold text-primary">Initiator</div>
                <div className="text-xs text-muted-foreground">&mdash; Phase 1 &mdash;</div>
                <div className="text-left text-xs font-bold text-secondary">Responder</div>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="p-2 rounded bg-primary/10 text-primary text-xs font-bold">
                  SA, KE, Ni &rarr;
                </div>
                <div className="text-xs text-muted-foreground">IKE_SA_INIT</div>
                <div className="p-2 rounded bg-secondary/10 text-secondary text-xs font-bold">
                  &larr; SA, KE, Nr
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="p-2 rounded bg-primary/10 text-primary text-xs font-bold">
                  SK&#123;IDi, AUTH&#125; &rarr;
                </div>
                <div className="text-xs text-muted-foreground">IKE_AUTH</div>
                <div className="p-2 rounded bg-secondary/10 text-secondary text-xs font-bold">
                  &larr; SK&#123;IDr, AUTH&#125;
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The KE payload carries Diffie-Hellman public values. Both parties derive the same shared
            secret (SKEYSEED) from their DH exchange, nonces, and SPIs, then derive encryption and
            integrity keys for the IKE SA.
          </p>
        </div>
      </section>

      {/* Section 2: ML-KEM in IKEv2 */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Network size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">ML-KEM in IKEv2</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The IETF draft <strong>draft-ietf-ipsecme-ikev2-mlkem</strong> defines how to integrate
            ML-KEM (FIPS 203) into IKEv2 using the <strong>Additional Key Exchange (AKE)</strong>{' '}
            framework (RFC 9370). This enables hybrid key exchange without modifying the core IKEv2
            state machine.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;The initiator sends an ML-KEM encapsulation key in an Additional Key Exchange
              payload during IKE_INTERMEDIATE. The responder encapsulates against this key and
              returns the ciphertext. The resulting shared secret is combined with the classical DH
              secret using the IKEv2 key hierarchy.&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2">
              &mdash; draft-ietf-ipsecme-ikev2-mlkem-01
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Classical DH</div>
              <p className="text-xs text-muted-foreground">
                ECP-256 or MODP-2048 in KE payload during IKE_SA_INIT. Quantum-vulnerable.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Additional KE (AKE)</div>
              <p className="text-xs text-muted-foreground">
                ML-KEM-768 encapsulation key (1,184 B) in IKE_INTERMEDIATE. Adds one round trip.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Combined Secret</div>
              <p className="text-xs text-muted-foreground">
                SKEYSEED derived from both DH and KEM shared secrets via PRF. Secure if either
                holds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: SSH Key Exchange with PQC */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Terminal size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">SSH Key Exchange with PQC</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            OpenSSH has been a pioneer in deploying post-quantum key exchange. Since version 8.5
            (March 2021), it has shipped with <strong>sntrup761x25519-sha512</strong> &mdash; a
            hybrid of Streamlined NTRU Prime and X25519. In OpenSSH 9.9 (September 2024),
            NIST-standard <strong>mlkem768x25519-sha256</strong> was added.
          </p>
          <div className="space-y-2">
            {[
              {
                version: 'OpenSSH 8.5',
                year: '2021',
                kex: 'sntrup761x25519-sha512',
                status: 'Available',
                statusColor: 'text-warning',
              },
              {
                version: 'OpenSSH 9.0',
                year: '2022',
                kex: 'sntrup761x25519-sha512',
                status: 'Default',
                statusColor: 'text-success',
              },
              {
                version: 'OpenSSH 9.9',
                year: '2024',
                kex: 'mlkem768x25519-sha256',
                status: 'Available',
                statusColor: 'text-primary',
              },
            ].map((entry) => (
              <div
                key={entry.version}
                className="flex items-center gap-3 bg-muted/50 rounded-lg p-3"
              >
                <span className="text-sm font-bold text-primary shrink-0 w-28">
                  {entry.version}
                </span>
                <div className="flex-1">
                  <code className="text-xs bg-muted px-1 rounded">{entry.kex}</code>
                </div>
                <span className={`text-xs font-bold ${entry.statusColor}`}>
                  {entry.status} ({entry.year})
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            SSH hybrid KEX works by concatenating the classical and PQC public keys in
            SSH_MSG_KEX_ECDH_INIT, and concatenating the classical share and KEM ciphertext in
            SSH_MSG_KEX_ECDH_REPLY. The shared secret is derived from both components.
          </p>
        </div>
      </section>

      {/* Section 4: WireGuard PQC */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Lock size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">WireGuard &amp; PQC</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            WireGuard uses the <strong>Noise IK</strong> protocol framework with a fixed cipher
            suite: X25519, ChaCha20-Poly1305, BLAKE2s. This minimal design makes WireGuard fast and
            auditable, but also means it has <strong>zero crypto agility</strong> &mdash; algorithms
            cannot be negotiated.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">The Challenge</div>
              <p className="text-xs text-muted-foreground">
                WireGuard&apos;s fixed X25519 is quantum-vulnerable. Adding PQC requires modifying
                the protocol or layering a separate negotiation on top.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">Rosenpass Solution</div>
              <p className="text-xs text-muted-foreground">
                <strong>Rosenpass</strong> runs a separate PQC key exchange (ML-KEM + Classic
                McEliece) and feeds the resulting PSK into WireGuard&apos;s pre-shared key slot.
              </p>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="space-y-2 text-center">
              <div className="p-2 rounded bg-primary/10 text-primary text-xs font-bold">
                Rosenpass Daemon (ML-KEM-768 + Classic McEliece)
              </div>
              <div className="text-muted-foreground">&darr; PSK</div>
              <div className="p-2 rounded bg-secondary/10 text-secondary text-xs font-bold">
                WireGuard (X25519 + ChaCha20-Poly1305 + PSK)
              </div>
              <div className="text-muted-foreground">&darr;</div>
              <div className="p-2 rounded bg-muted text-foreground text-xs font-bold">
                Tunnel Protected: Classical + PQC
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The Rosenpass approach preserves WireGuard&apos;s simplicity while adding quantum
            resistance. The PSK is rotated periodically, and WireGuard&apos;s security holds even if
            Rosenpass is compromised (defense in depth).
          </p>
        </div>
      </section>

      {/* Section 5: Protocol Size Impact */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Ruler size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Protocol Size Impact</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Post-quantum key exchange significantly increases handshake sizes across all protocols.
            ML-KEM-768 adds approximately <strong>1,184 bytes</strong> for the encapsulation key and{' '}
            <strong>1,088 bytes</strong> for the ciphertext. For protocols like WireGuard that use
            UDP, this can cause IP fragmentation issues.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-bold">Protocol</th>
                  <th className="text-right p-2 text-muted-foreground font-bold">Classical</th>
                  <th className="text-right p-2 text-muted-foreground font-bold">Hybrid</th>
                  <th className="text-right p-2 text-muted-foreground font-bold">Increase</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'IKEv2', classical: 1400, hybrid: 3768 },
                  { name: 'SSH', classical: 984, hybrid: 3296 },
                  { name: 'WireGuard', classical: 304, hybrid: 6800 },
                  { name: 'TLS 1.3', classical: 1200, hybrid: 3500 },
                ].map((row) => (
                  <tr key={row.name} className="border-b border-border/50">
                    <td className="p-2 font-medium text-foreground">{row.name}</td>
                    <td className="p-2 text-right text-muted-foreground">
                      {row.classical.toLocaleString()} B
                    </td>
                    <td className="p-2 text-right text-foreground font-medium">
                      {row.hybrid.toLocaleString()} B
                    </td>
                    <td className="p-2 text-right text-warning font-bold">
                      +{Math.round(((row.hybrid - row.classical) / row.classical) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            WireGuard sees the largest relative increase (22x) because its classical handshake is
            extremely compact. IKEv2 handles fragmentation explicitly (RFC 7383) over UDP, while SSH
            handles larger payloads natively because it relies on TCP transport.
          </p>
        </div>
      </section>

      {/* Section 6: Authentication & Data Plane Integration */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-warning/10">
            <Lock size={24} className="text-warning" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Authentication: The Missing Half</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            While PQC Key Exchange (ML-KEM) secures connections against future decryption,{' '}
            <strong>Authentication</strong> using digital signatures secures against active
            attackers. Both IKEv2 and SSH uniquely require multiple layers of authentication that
            must be migrated.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">IKEv2 (IKE_AUTH)</div>
              <p className="text-xs text-muted-foreground">
                In addition to the AKE payloads, draft-ietf-ipsecme-ikev2-mldsa updates the IKE_AUTH
                phase to support <strong>ML-DSA</strong> (FIPS 204). The Auth payload verifies
                identities using post-quantum certificates.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">SSH Host &amp; User Auth</div>
              <p className="text-xs text-muted-foreground">
                SSH requires PQC host keys (server identity) and user keys (UserAuth). While OpenSSH
                9.9 supports ML-KEM, standardizing ML-DSA keys for host and user authentication is
                still an active effort.
              </p>
            </div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <h4 className="font-bold text-primary mb-1">Control Plane vs. Data Plane</h4>
            <p className="text-xs text-muted-foreground">
              The migration to PQC only applies to the <strong>Control Plane</strong> (key exchange
              &amp; auth). The actual <strong>Data Plane</strong> (the VPN tunnel) already uses
              symmetric algorithms like AES-GCM or ChaCha20-Poly1305. These algorithms are naturally
              quantum-resistant, requiring only standard key lengths (256-bit) to be secure against
              Grover&apos;s algorithm.
            </p>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/tls-basics"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BookOpen size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">TLS Basics</div>
              <div className="text-xs text-muted-foreground">
                Deep dive into TLS 1.3 handshakes and PQC integration
              </div>
            </div>
          </Link>
          <Link
            to="/algorithms"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Key size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Algorithm Explorer</div>
              <div className="text-xs text-muted-foreground">
                Compare ML-KEM, ML-DSA, and classical algorithm parameters
              </div>
            </div>
          </Link>
          <Link
            to="/library"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <FlaskConical size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Standards Library</div>
              <div className="text-xs text-muted-foreground">
                RFCs, NIST FIPS, and IETF drafts for PQC protocols
              </div>
            </div>
          </Link>
          <Link
            to="/learn/hybrid-crypto"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Layers size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Hybrid Cryptography</div>
              <div className="text-xs text-muted-foreground">
                Hybrid KEMs, composite signatures, and certificate comparison
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={onNavigateToSimulate}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Simulator <ArrowRight size={18} />
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Step through IKEv2 and SSH handshakes, compare classical vs hybrid vs pure PQC modes.
        </p>
      </div>
    </div>
  )
}
