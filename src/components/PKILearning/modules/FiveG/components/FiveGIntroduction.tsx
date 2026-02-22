import React from 'react'
import { Shield, Radio, Key, Lock, Server, ArrowRight } from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'

interface FiveGIntroductionProps {
  onNavigateToSimulate: () => void
}

export const FiveGIntroduction: React.FC<FiveGIntroductionProps> = ({ onNavigateToSimulate }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* What is 5G Security? */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shield size={20} /> What is 5G Security?
        </h2>
        <p className="text-foreground/80 leading-relaxed">
          3GPP TS 33.501 defines the security architecture for 5G systems, introducing fundamental
          improvements over previous generations. In 2G/3G/4G networks, the subscriber&apos;s
          permanent identity (IMSI) was transmitted in cleartext over the air interface, enabling
          &quot;IMSI catchers&quot; — rogue base stations that intercept and track mobile users. 5G
          addresses this with{' '}
          <InlineTooltip term="SUCI">SUCI (Subscription Concealed Identifier)</InlineTooltip>,
          encrypting the subscriber identity before it ever leaves the device.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-destructive mb-1">Pre-5G Problem</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>IMSI sent in cleartext over the air</li>
              <li>IMSI catchers track & intercept users</li>
              <li>No subscriber identity privacy</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-1">5G Solution</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>SUCI encrypts identity on the USIM</li>
              <li>
                <InlineTooltip term="ECIES">ECIES</InlineTooltip>-based concealment (Profile A/B)
              </li>
              <li>
                Mutual authentication (<InlineTooltip term="5G-AKA">5G-AKA</InlineTooltip>)
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-success mb-1">PQC Future</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                Profile C: <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> (Kyber) concealment
              </li>
              <li>Quantum-resistant subscriber privacy</li>
              <li>Under 3GPP SA3 study (TR 33.841)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* The Three Pillars */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Radio size={20} /> The Three Pillars of 5G Security
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          5G security rests on three pillars that work together to protect subscribers from identity
          theft, network impersonation, and supply chain attacks. Each pillar addresses a different
          phase of the subscriber lifecycle.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="text-sm font-bold text-primary mb-1">Privacy (SUCI)</div>
            <p className="text-xs text-muted-foreground">
              The USIM encrypts the subscriber&apos;s permanent identity (
              <InlineTooltip term="SUPI">SUPI</InlineTooltip>) into a concealed identifier (SUCI)
              using ECIES or KEM. Only the Home Network can de-conceal it.
            </p>
          </div>
          <div className="bg-success/5 rounded-lg p-3 border border-success/20">
            <div className="text-sm font-bold text-success mb-1">Authentication (5G-AKA)</div>
            <p className="text-xs text-muted-foreground">
              Mutual authentication ensures both the network and subscriber prove their identity.
              Uses the <InlineTooltip term="MILENAGE">MILENAGE</InlineTooltip> algorithm (AES-128
              based) and a 5G-specific key hierarchy.
            </p>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20">
            <div className="text-sm font-bold text-warning mb-1">Provisioning</div>
            <p className="text-xs text-muted-foreground">
              Secure SIM manufacturing and key distribution. Subscriber keys (Ki) are generated in{' '}
              <InlineTooltip term="HSM">HSMs</InlineTooltip>, encrypted for transport, and imported
              at the operator&apos;s UDM.
            </p>
          </div>
        </div>
      </section>

      {/* SUCI Protection Schemes */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Key size={20} /> SUCI Protection Schemes
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          3GPP defines multiple protection schemes for SUCI concealment. Each scheme uses a
          different asymmetric algorithm for key agreement, but all follow the same ECIES pattern:
          generate an ephemeral key, derive a shared secret, encrypt the MSIN, and compute a MAC
          tag.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="text-sm font-bold text-primary mb-2">
              Profile A (<InlineTooltip term="X25519">X25519</InlineTooltip>)
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                Curve25519 elliptic curve (<InlineTooltip term="ECDH">ECDH</InlineTooltip>)
              </p>
              <p>32-byte public keys</p>
              <p>AES-128-CTR encryption</p>
              <p>HMAC-SHA-256 integrity</p>
              <p className="text-destructive/80 font-medium pt-1">Quantum-vulnerable</p>
            </div>
          </div>
          <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20">
            <div className="text-sm font-bold text-secondary mb-2">Profile B (P-256)</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>NIST secp256r1 curve (ECDH)</p>
              <p>65-byte uncompressed public keys</p>
              <p>AES-128-CTR encryption</p>
              <p>HMAC-SHA-256 integrity</p>
              <p className="text-destructive/80 font-medium pt-1">Quantum-vulnerable</p>
            </div>
          </div>
          <div className="bg-tertiary/5 rounded-lg p-4 border border-tertiary/20">
            <div className="text-sm font-bold text-tertiary mb-2">Profile C (ML-KEM)</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>ML-KEM-768 lattice-based KEM</p>
              <p>1,184-byte public keys</p>
              <p>AES-256-CTR encryption</p>
              <p>HMAC-SHA3-256 integrity</p>
              <p className="text-success/80 font-medium pt-1">Quantum-resistant</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Profile C is under active 3GPP SA3 study (TR 33.841) and not yet standardized. It supports
          both hybrid (X25519 + ML-KEM) and pure PQC modes.
        </p>
      </section>

      {/* 5G-AKA Authentication */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Lock size={20} /> 5G-AKA Authentication
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          5G-AKA (Authentication and Key Agreement) provides mutual authentication between the
          subscriber and the network. At its core is the MILENAGE algorithm, which uses AES-128 to
          compute five cryptographic functions from the subscriber key (K) and a random challenge
          (RAND):
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">f1</span>
            <span className="text-foreground/80">
              <strong className="text-primary">MAC-A</strong> — Network authentication token (USIM
              verifies the network is genuine)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">f2</span>
            <span className="text-foreground/80">
              <strong className="text-primary">XRES</strong> — Expected response (network verifies
              the USIM is genuine)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">f3</span>
            <span className="text-foreground/80">
              <strong className="text-warning">CK</strong> — Cipher Key (128-bit, for encryption)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">f4</span>
            <span className="text-foreground/80">
              <strong className="text-warning">IK</strong> — Integrity Key (128-bit, for message
              authentication)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">f5</span>
            <span className="text-foreground/80">
              <strong className="text-success">AK</strong> — Anonymity Key (conceals the sequence
              number in AUTN)
            </span>
          </div>
        </div>
        <p className="text-foreground/80 leading-relaxed mt-3 text-sm">
          CK and IK feed the 5G key hierarchy:{' '}
          <code className="text-xs bg-muted px-1 rounded">KAUSF</code> (anchor key) {' \u2192 '}
          <code className="text-xs bg-muted px-1 rounded">KSEAF</code> {' \u2192 '}
          <code className="text-xs bg-muted px-1 rounded">KAMF</code> {' \u2192 '}
          <code className="text-xs bg-muted px-1 rounded">KNASint / KNASenc</code> {' \u2192 '}
          <code className="text-xs bg-muted px-1 rounded">KgNB</code> (radio layer).
        </p>
      </section>

      {/* SIM Provisioning & Supply Chain */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Server size={20} /> SIM Provisioning &amp; Supply Chain
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          Before a subscriber can connect, their keys must be securely generated, written to the
          USIM, and delivered to the mobile operator. This supply chain is a critical trust boundary
          — if keys are leaked during manufacturing or transport, all subsequent security is
          compromised.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">1.</span>
            <span className="text-foreground/80">
              <strong className="text-primary">Generate Ki</strong> — 128-bit subscriber key created
              in the factory HSM (TRNG)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">2.</span>
            <span className="text-foreground/80">
              <strong className="text-primary">Compute OPc</strong> — Derived operator key (AES(Ki,
              OP) XOR OP), unique per SIM
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">3.</span>
            <span className="text-foreground/80">
              <strong className="text-warning">Personalize USIM</strong> — Write Ki, OPc, and IMSI
              to the secure element
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">4.</span>
            <span className="text-foreground/80">
              <strong className="text-warning">Encrypt for Transport</strong> — Ki encrypted with a
              pre-agreed Transport Key (eKi)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">5.</span>
            <span className="text-foreground/80">
              <strong className="text-success">Import at UDM</strong> — Operator HSM decrypts eKi
              and stores Ki for authentication
            </span>
          </div>
        </div>
      </section>

      {/* Post-Quantum Threat to 5G */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shield size={20} /> Post-Quantum Threat to 5G
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          Not all parts of 5G security are equally vulnerable to quantum computers. SUCI concealment
          relies on asymmetric cryptography (ECDH in Profile A/B), which is broken by{' '}
          <InlineTooltip term="Shor's Algorithm">Shor&apos;s algorithm</InlineTooltip>. However,
          5G-AKA authentication uses MILENAGE, which is built on AES-128 — a symmetric algorithm
          where <InlineTooltip term="Grover's Algorithm">Grover&apos;s algorithm</InlineTooltip>{' '}
          only halves the effective key length to 64 bits, still computationally secure.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20">
            <div className="text-sm font-bold text-destructive mb-1">Quantum-Vulnerable</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>SUCI Profile A (X25519 ECDH)</li>
              <li>SUCI Profile B (P-256 ECDH)</li>
              <li>
                <InlineTooltip term="Harvest Now, Decrypt Later">
                  &quot;Harvest now, decrypt later&quot;
                </InlineTooltip>{' '}
                risk
              </li>
            </ul>
          </div>
          <div className="bg-success/5 rounded-lg p-3 border border-success/20">
            <div className="text-sm font-bold text-success mb-1">Quantum-Resistant</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>MILENAGE / 5G-AKA (AES-128)</li>
              <li>SIM provisioning (AES symmetric)</li>
              <li>Profile C (ML-KEM lattice-based)</li>
            </ul>
          </div>
        </div>
        <p className="text-foreground/80 leading-relaxed mb-4 text-sm">
          Profile C is the migration path to quantum-resistant subscriber privacy. It replaces ECDH
          key agreement with ML-KEM (Kyber) encapsulation, supporting both a hybrid transition mode
          (X25519 + ML-KEM-768) and a pure PQC target mode.
        </p>
        <button
          onClick={onNavigateToSimulate}
          className="btn btn-primary flex items-center gap-2 px-4 py-2"
        >
          Try It in the Simulator <ArrowRight size={16} />
        </button>
      </section>
    </div>
  )
}
