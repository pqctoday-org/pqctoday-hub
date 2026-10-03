// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { Link } from 'react-router'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
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
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VPNSSHIntroductionProps {
  onNavigateToSimulate: () => void
}

export const VPNSSHIntroduction: React.FC<VPNSSHIntroductionProps> = ({ onNavigateToSimulate }) => {
  useSectionAnchors()

  return (
    <div className="space-y-8 w-full">
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
            <InlineTooltip term="IKEv2">
              <strong>IKEv2</strong>
            </InlineTooltip>{' '}
            (Internet Key Exchange version 2, RFC 7296) is the key negotiation protocol for{' '}
            <InlineTooltip term="IPsec">IPsec</InlineTooltip> VPNs. It establishes Security
            Associations (SAs) through a two-phase handshake: <strong>IKE_SA_INIT</strong> for key
            exchange and <strong>IKE_AUTH</strong> for identity verification.
          </p>
          <div className="overflow-x-auto">
            <div className="bg-muted/50 rounded-lg p-4 border border-border min-w-[300px]">
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
          </div>
          <p className="text-xs text-muted-foreground">
            The KE payload carries{' '}
            <InlineTooltip term="Diffie-Hellman">Diffie-Hellman</InlineTooltip> public values. Both
            parties derive the same shared secret (SKEYSEED) from their DH exchange, nonces, and
            SPIs, then derive encryption and integrity keys for the IKE SA.
          </p>
        </div>
      </section>

      {/* Section 2: ML-KEM in IKEv2 */}
      <section data-section-id="ikev2" className="glass-panel p-6 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Network size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> in IKEv2
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The IETF draft <strong>draft-ietf-ipsecme-ikev2-mlkem</strong> defines how to integrate
            ML-KEM (<InlineTooltip term="FIPS 203">FIPS 203</InlineTooltip>) into IKEv2 using the{' '}
            <strong>Additional Key Exchange (AKE)</strong> framework (RFC 9370). This enables hybrid
            key exchange without modifying the core IKEv2 state machine.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;The initiator generates an ML-KEM keypair (pk, sk) using KeyGen(), and sends
              the public key (pk) to the responder inside a KEi(1) payload. The responder will
              encapsulate a shared secret ss using Encaps(pk) and the resulting ciphertext (ct) is
              sent to initiator using the KEr(1).&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2">
              &mdash; draft-ietf-ipsecme-ikev2-mlkem-09, Appendix A
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

      {/* Section 2b: Pure ML-KEM in IKEv2 — known limits (draft-ietf-ipsecme-ikev2-mlkem-09 §2.1, Appendix A) */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-warning/10">
            <AlertTriangle size={24} className="text-warning" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Pure ML-KEM in IKEv2: Known Limits</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            A <strong>pure</strong> (quantum-resistant-only) IKEv2 handshake has no classical key
            exchange to fall back on, so ML-KEM must travel in the very first message,{' '}
            <strong>IKE_SA_INIT</strong>. That is where the draft&apos;s main restriction sits:
            IKEv2 fragmentation (RFC 7383) only works on encrypted messages, and IKE_SA_INIT is sent
            before any keys exist. In the draft&apos;s words, these messages &ldquo;could not be
            IKEv2 fragmented&rdquo;. A payload bigger than the path MTU falls back to IP
            fragmentation, which NATs and firewalls often drop and which is a known
            denial-of-service target.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-bold">Parameter set</th>
                  <th className="text-right p-2 text-muted-foreground font-bold">
                    KE payload (key / ciphertext)
                  </th>
                  <th className="text-left p-2 text-muted-foreground font-bold">
                    Pure PQC in IKE_SA_INIT over UDP
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: 'ML-KEM-512 (35)',
                    size: '808 / 776 B',
                    rule: 'MAY be used',
                    color: 'text-success',
                  },
                  {
                    name: 'ML-KEM-768 (36)',
                    size: '1,192 / 1,096 B',
                    rule: 'SHOULD NOT when the path MTU is unknown, unless IKE runs over TCP',
                    color: 'text-warning',
                  },
                  {
                    name: 'ML-KEM-1024 (37)',
                    size: '1,576 / 1,576 B',
                    rule: 'SHOULD NOT when the path MTU is unknown, unless IKE runs over TCP',
                    color: 'text-warning',
                  },
                ].map((row) => (
                  <tr key={row.name} className="border-b border-border/50">
                    <td className="p-2 font-medium text-foreground">{row.name}</td>
                    <td className="p-2 text-right text-muted-foreground">{row.size}</td>
                    <td className={`p-2 font-bold ${row.color}`}>{row.rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">The CNSA 2.0 squeeze</div>
              <p className="text-xs text-muted-foreground">
                CNSA 2.0 requires ML-KEM-1024, but ML-KEM-512 is the only size the draft allows in a
                pure UDP IKE_SA_INIT without conditions. A pure CNSA 2.0 IKEv2 deployment therefore
                has to run IKE over TCP (RFC 9329), guarantee the path MTU, or accept IP
                fragmentation.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">
                The draft&apos;s own way round
              </div>
              <p className="text-xs text-muted-foreground">
                Appendix A runs a classical exchange in IKE_SA_INIT and carries ML-KEM-768/1024 in
                IKE_INTERMEDIATE (RFC 9242 / RFC 9370). Those messages are encrypted, so RFC 7383
                fragmentation applies. The cost: the first exchange is no longer quantum-resistant
                on its own. That makes this a hybrid design, not pure PQC.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The draft also requires a fresh ML-KEM key pair and fresh encapsulation randomness for
            every exchange. The responder must check the initiator&apos;s encapsulation key (FIPS
            203 §7.2) before encapsulating, and should reject a bad key with INVALID_SYNTAX to limit
            resource-exhaustion attacks. The draft further warns that an on-path attacker with a
            quantum computer could steer peers onto a classical-only group unless local policy
            forbids one. None of this makes the draft a dead end. It sits in the RFC Editor queue,
            and several firewall vendors already ship hybrid ML-KEM IKEv2. Only pure-PQC IKEv2 at
            the higher security levels over plain UDP remains an open engineering problem.
          </p>
        </div>
      </section>

      {/* Section 3: SSH Key Exchange with PQC */}
      <section data-section-id="ssh" className="glass-panel p-6 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Terminal size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            <InlineTooltip term="SSH">SSH</InlineTooltip> Key Exchange with{' '}
            <InlineTooltip term="Post-Quantum Cryptography">PQC</InlineTooltip>
          </h2>
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
      <section data-section-id="wireguard" className="glass-panel p-6 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Lock size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            <InlineTooltip term="WireGuard">WireGuard</InlineTooltip> &amp; PQC
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            WireGuard uses the <strong>Noise IK</strong> protocol framework with a fixed cipher
            suite: <InlineTooltip term="X25519">X25519</InlineTooltip>, ChaCha20-Poly1305, BLAKE2s.
            This minimal design makes WireGuard fast and auditable, but also means it has{' '}
            <strong>
              zero <InlineTooltip term="Crypto Agility">crypto agility</InlineTooltip>
            </strong>{' '}
            &mdash; algorithms cannot be negotiated.
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
                <InlineTooltip term="Rosenpass">
                  <strong>Rosenpass</strong>
                </InlineTooltip>{' '}
                runs a separate PQC key exchange (ML-KEM + Classic McEliece) and feeds the resulting
                PSK into WireGuard&apos;s pre-shared key slot.
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
                  { name: 'IKEv2', classical: 1400, hybrid: 3784 },
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
            extremely compact. IKEv2 handles fragmentation explicitly (RFC 7383) over UDP, but only
            for encrypted messages, so it cannot help IKE_SA_INIT. SSH handles larger payloads
            natively because it relies on TCP transport.
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
            <strong>Authentication</strong> using{' '}
            <InlineTooltip term="Digital Signature">digital signatures</InlineTooltip> secures
            against active attackers. Both IKEv2 and SSH uniquely require multiple layers of
            authentication that must be migrated.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">IKEv2 (IKE_AUTH)</div>
              <p className="text-xs text-muted-foreground">
                In addition to the AKE payloads, draft-ietf-ipsecme-ikev2-pqc-auth updates the
                IKE_AUTH phase to support{' '}
                <InlineTooltip term="ML-DSA">
                  <strong>ML-DSA</strong>
                </InlineTooltip>{' '}
                (<InlineTooltip term="FIPS 204">FIPS 204</InlineTooltip>). The Auth payload verifies
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
            <h3 className="font-bold text-primary mb-1">Control Plane vs. Data Plane</h3>
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
            to="/algorithms?highlight=ML-KEM,ML-DSA"
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
            to="/library?cat=Protocols"
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
              <div className="text-sm font-medium text-foreground">
                <InlineTooltip term="Hybrid Cryptography">Hybrid Cryptography</InlineTooltip>
              </div>
              <div className="text-xs text-muted-foreground">
                Hybrid KEMs, composite signatures, and certificate comparison
              </div>
            </div>
          </Link>
          <Link
            to="/learn/network-security-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Network size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Network Security</div>
              <div className="text-xs text-muted-foreground">
                NGFWs, TLS inspection, IDS/IPS, and ZTNA PQC migration
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Button
          variant="gradient"
          onClick={onNavigateToSimulate}
          className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
        >
          Start Simulator <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Step through IKEv2 and SSH handshakes, compare classical vs hybrid vs pure PQC modes.
        </p>
      </div>
      <VendorCoverageNotice migrateLayer="Network" migrateDomain="vpn" />
      <ReadingCompleteButton />
    </div>
  )
}
