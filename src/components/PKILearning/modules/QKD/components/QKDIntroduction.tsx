import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  Radio,
  Zap,
  AlertTriangle,
  Key,
  Server,
  Globe,
  ArrowRight,
  BarChart3,
  Satellite,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'

interface QKDIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const QKDIntroduction: React.FC<QKDIntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Section 1: What is QKD? */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shield size={20} /> What is Quantum Key Distribution?
        </h2>
        <p className="text-foreground/80 leading-relaxed">
          <InlineTooltip term="QKD">Quantum Key Distribution (QKD)</InlineTooltip> is a method of
          distributing encryption keys using the laws of quantum physics rather than mathematical
          hardness assumptions. Unlike{' '}
          <InlineTooltip term="Post-Quantum Cryptography">PQC</InlineTooltip>, which relies on
          computationally hard problems, QKD derives its security from the{' '}
          <InlineTooltip term="No-Cloning Theorem">no-cloning theorem</InlineTooltip> and the
          principle that measuring a quantum state inevitably disturbs it — providing{' '}
          <strong>information-theoretic security</strong>.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-destructive mb-1">Classical KEM</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Security from mathematical hardness</li>
              <li>Runs on standard networks</li>
              <li>Broken by quantum computers (Shor)</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-1">PQC</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Security from quantum-hard problems</li>
              <li>Runs on standard networks</li>
              <li>Believed secure against quantum attacks</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-success mb-1">QKD</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Security from physics (information-theoretic)</li>
              <li>Requires dedicated quantum channel</li>
              <li>Provably secure if implemented correctly</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2: BB84 Protocol */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Radio size={20} /> The BB84 Protocol
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          <InlineTooltip term="BB84">BB84</InlineTooltip>, proposed by Bennett and Brassard in 1984,
          was the first QKD protocol. It uses single photons encoded in two conjugate bases to
          establish a shared secret key between two parties (Alice and Bob) while detecting any
          eavesdropper (Eve).
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
              1
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Qubit Preparation</div>
              <p className="text-xs text-muted-foreground">
                Alice generates random bits and encodes each in a randomly chosen basis: rectilinear
                (+) with states ↕/↔, or diagonal (x) with states ⤢/⤡. She sends the photons to Bob
                over a quantum channel.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
              2
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Measurement</div>
              <p className="text-xs text-muted-foreground">
                Bob independently chooses a random basis (+ or x) for each photon and measures it.
                When his basis matches Alice&apos;s, the result is deterministic. When it
                doesn&apos;t, the result is random.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
              3
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Basis Reconciliation</div>
              <p className="text-xs text-muted-foreground">
                Alice and Bob publicly compare which basis they used for each position (without
                revealing the bit values). They keep only the positions where both used the same
                basis — the <InlineTooltip term="Sifted Key">sifted key</InlineTooltip> (~50% of
                transmitted bits).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-sm font-bold shrink-0">
              4
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Eavesdropper Detection</div>
              <p className="text-xs text-muted-foreground">
                They sacrifice a random sample of the sifted key to check for errors. If the{' '}
                <InlineTooltip term="QBER">QBER (Quantum Bit Error Rate)</InlineTooltip> exceeds
                ~11%, eavesdropping is detected and the key is discarded.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: State of the Art */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Zap size={20} /> State of the Art
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          QKD technology has matured significantly since the first demonstration in 1989. Today,
          commercial systems are deployed by governments and telecom operators worldwide, though
          significant constraints remain.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium">Technology</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Max Distance</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Key Rate</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Maturity</th>
              </tr>
            </thead>
            <tbody className="text-foreground/80">
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">Fiber (single link)</td>
                <td className="p-2">~100 km</td>
                <td className="p-2">~1-10 Mbps (short), ~1 kbps (long)</td>
                <td className="p-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                    Commercial
                  </span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">Fiber (trusted nodes)</td>
                <td className="p-2">&gt;2,000 km</td>
                <td className="p-2">Limited by node processing</td>
                <td className="p-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                    Deployed
                  </span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">Satellite</td>
                <td className="p-2">&gt;7,000 km</td>
                <td className="p-2">~1-10 kbps (LEO passes)</td>
                <td className="p-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                    Demonstrated
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Free-space (urban)</td>
                <td className="p-2">~10 km</td>
                <td className="p-2">Weather-dependent</td>
                <td className="p-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Research
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Notable milestones: Micius satellite (China, 2016), Beijing-Shanghai 2,000 km backbone
          (2017), BT/Toshiba commercial metro network (UK, 2022).
        </p>
      </section>

      {/* Section 4: Satellite QKD */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Satellite size={20} /> Satellite QKD
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Fiber-based QKD is limited to roughly 100 km per link due to exponential photon loss in
          optical fiber. <InlineTooltip term="Trusted Node">Trusted node</InlineTooltip> chains can
          extend range, but each relay is a potential point of compromise. Satellite QKD bypasses
          this fundamental constraint: free-space optical links through vacuum suffer no fiber
          absorption, and the atmosphere is thin (~10–20 km), meaning a low-Earth-orbit satellite
          pass traverses a relatively short atmospheric path. This makes satellites the leading
          approach for intercontinental and trans-oceanic quantum key distribution — including
          Earth-to-satellite, satellite-to-ground, and inter-satellite links.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-2">Trusted-Node Satellite Relay</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Satellite acts as a moving trusted node between ground stations</li>
              <li>Generates separate keys with each ground station, then relays</li>
              <li>Demonstrated by Micius (China–Austria, 7,600 km, 2017)</li>
              <li>Simpler to implement with current technology</li>
              <li>Satellite must be physically secured (compromise exposes keys)</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-success mb-2">
              Entanglement-Based Satellite QKD
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                Satellite distributes <InlineTooltip term="Entanglement">entangled</InlineTooltip>{' '}
                photon pairs to two ground stations
              </li>
              <li>No key material ever exists on the satellite itself</li>
              <li>Eliminates the trusted-node vulnerability entirely</li>
              <li>Demonstrated by Micius over 1,120 km (2020)</li>
              <li>More technically demanding; requires high-fidelity photon sources</li>
            </ul>
          </div>
        </div>

        <h3 className="text-sm font-bold text-foreground mb-2">Key Satellite QKD Initiatives</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium">Program</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Country</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Operator</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-2 text-muted-foreground font-medium hidden sm:table-cell">
                  Key Achievement
                </th>
              </tr>
            </thead>
            <tbody className="text-foreground/80">
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">Micius (QUESS)</td>
                <td className="p-2">China</td>
                <td className="p-2 text-xs">CAS / USTC</td>
                <td className="p-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                    Operational
                  </span>
                </td>
                <td className="p-2 text-xs hidden sm:table-cell">
                  First satellite QKD; intercontinental key exchange (2017)
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">EAGLE-1 / EuroQCI</td>
                <td className="p-2">EU</td>
                <td className="p-2 text-xs">ESA / SES</td>
                <td className="p-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                    Planned
                  </span>
                </td>
                <td className="p-2 text-xs hidden sm:table-cell">
                  Pan-European satellite + terrestrial QKD infrastructure
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">QEYSSat</td>
                <td className="p-2">Canada</td>
                <td className="p-2 text-xs">CSA / U. Waterloo IQC</td>
                <td className="p-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                    Planned
                  </span>
                </td>
                <td className="p-2 text-xs hidden sm:table-cell">
                  Microsatellite QKD demonstrator
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">SOCRATES</td>
                <td className="p-2">Japan</td>
                <td className="p-2 text-xs">NICT</td>
                <td className="p-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    Completed
                  </span>
                </td>
                <td className="p-2 text-xs hidden sm:table-cell">
                  Microsatellite; space-to-ground quantum communication (2016)
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">SpooQy-1</td>
                <td className="p-2">Singapore</td>
                <td className="p-2 text-xs">NUS CQT</td>
                <td className="p-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    Completed
                  </span>
                </td>
                <td className="p-2 text-xs hidden sm:table-cell">
                  CubeSat; entangled photon pairs generated in orbit (2019)
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium">QKDSat</td>
                <td className="p-2">UK</td>
                <td className="p-2 text-xs">ESA / Craft Prospect</td>
                <td className="p-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                    Planned
                  </span>
                </td>
                <td className="p-2 text-xs hidden sm:table-cell">
                  UK industry satellite QKD mission
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Explore all satellite and terrestrial deployments interactively in the Workshop tab (Part
          3: Global Deployments).
        </p>
      </section>

      {/* Section 5: Limitations & NIST Position */}
      <section className="glass-panel p-6 border-l-4 border-l-warning">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <AlertTriangle size={20} /> Limitations &amp; NIST Position
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          While QKD offers unique theoretical security guarantees, it faces significant practical
          limitations. NIST has expressed skepticism about QKD as a general-purpose solution,
          recommending PQC for most use cases.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-success/5 rounded-lg p-3 border border-success/20">
            <div className="text-sm font-bold text-success mb-2">Strengths</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Information-theoretic security (not based on computational assumptions)</li>
              <li>Forward secrecy — past keys remain secure even if future technology advances</li>
              <li>Eavesdropping detection built into the protocol</li>
              <li>Complements PQC as an additional security layer</li>
            </ul>
          </div>
          <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20">
            <div className="text-sm font-bold text-destructive mb-2">Limitations</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                <strong>Distance:</strong> ~100 km fiber without trusted nodes
              </li>
              <li>
                <strong>Trusted nodes:</strong> compromise any relay → all keys exposed
              </li>
              <li>
                <strong>Cost:</strong> dedicated fiber, cryogenic detectors, specialized hardware
              </li>
              <li>
                <strong>Side channels:</strong> real devices have implementation vulnerabilities
              </li>
              <li>
                <strong>Key rate:</strong> orders of magnitude lower than classical methods
              </li>
              <li>
                <strong>No authentication:</strong> QKD itself does not authenticate parties
              </li>
            </ul>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-1">
            NIST Position (NIST IR 8301, 2018)
          </div>
          <p className="text-xs text-muted-foreground italic">
            &quot;NIST does not generally recommend QKD &hellip; QKD addresses only the key
            distribution problem &hellip; it requires special-purpose equipment &hellip; [and] is
            only proven secure under certain theoretical models that may not match real-world
            implementations.&quot;
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            NIST recommends post-quantum cryptography (FIPS 203/204/205) as the primary solution for
            quantum-resistant security, while acknowledging QKD may have niche applications in
            high-security environments.
          </p>
        </div>
      </section>

      {/* Section 6: QKD + Classical KEM */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Key size={20} /> QKD + PQC KEM Integration
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          In practice, QKD is most valuable when combined with{' '}
          <InlineTooltip term="Post-Quantum Cryptography">PQC</InlineTooltip> key encapsulation
          mechanisms. A hybrid approach uses both a QKD-derived key and an{' '}
          <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> shared secret, combining them via HKDF
          so that security holds even if one source is compromised.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">
            Hybrid Key Derivation Pipeline
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-muted-foreground">
            <div className="bg-primary/10 border border-primary/30 rounded px-3 py-2 text-center">
              <div className="font-bold text-primary">Quantum Channel</div>
              <div>QKD Secret (BB84)</div>
            </div>
            <div className="text-lg text-muted-foreground">+</div>
            <div className="bg-primary/10 border border-primary/30 rounded px-3 py-2 text-center">
              <div className="font-bold text-primary">Classical Channel</div>
              <div>ML-KEM-768 Secret</div>
            </div>
            <div className="text-lg text-muted-foreground">&rarr;</div>
            <div className="bg-success/10 border border-success/30 rounded px-3 py-2 text-center">
              <div className="font-bold text-success">HKDF-Extract</div>
              <div>Hybrid Secret Key</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            The combined key is secure as long as either the QKD channel OR the ML-KEM exchange
            remains unbroken — defense in depth.
          </p>
        </div>
      </section>

      {/* Section 7: QKD + HSM */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Server size={20} /> QKD + HSM Integration
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Hardware Security Modules (HSMs) play a critical role in QKD deployments by providing
          tamper-resistant storage for QKD-derived keys and managing the key lifecycle. The
          integration follows standard PKCS#11 patterns.
        </p>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
              1
            </div>
            <p className="text-sm text-foreground/80">
              <strong>Key Generation:</strong> QKD hardware generates shared secret via BB84 or
              similar protocol between endpoints.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
              2
            </div>
            <p className="text-sm text-foreground/80">
              <strong>HSM Import:</strong> QKD-derived key material is imported into the HSM via
              secure key injection (C_UnwrapKey or C_CreateObject).
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
              3
            </div>
            <p className="text-sm text-foreground/80">
              <strong>Key Usage:</strong> Applications access QKD-derived keys through the HSM
              PKCS#11 API for encryption, MAC generation, or further key derivation.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
              4
            </div>
            <p className="text-sm text-foreground/80">
              <strong>Key Rotation:</strong> QKD continuously generates fresh keys; the HSM manages
              rotation and lifecycle (expiry, destruction).
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Learn more about HSM operations and PKCS#11 workflows in the{' '}
          <Link to="/learn/key-management" className="text-primary hover:underline">
            Key Management &amp; HSM module
          </Link>
          .
        </p>
      </section>

      {/* Section 8: Telecom & Government Adoption */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Globe size={20} /> Telecom &amp; Government Adoption
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          QKD is being adopted primarily by governments and telecom operators who need the highest
          levels of communication security. China leads with the world&apos;s largest QKD
          infrastructure, while Europe is building a pan-continental network through the{' '}
          <InlineTooltip term="EuroQCI">EuroQCI</InlineTooltip> initiative.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-2xl font-bold text-primary">15+</div>
            <div className="text-xs text-muted-foreground">Major Deployments Worldwide</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-2xl font-bold text-primary">27</div>
            <div className="text-xs text-muted-foreground">EU States in EuroQCI</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-2xl font-bold text-primary">2,000 km</div>
            <div className="text-xs text-muted-foreground">Longest QKD Backbone (China)</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Explore the full interactive deployment database in the Workshop tab.
        </p>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <BarChart3 size={20} /> Related Resources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/learn/hybrid-crypto"
            className="bg-muted/50 rounded-lg p-3 border border-border hover:border-primary/30 transition-colors group"
          >
            <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
              Hybrid Cryptography <ArrowRight size={14} />
            </div>
            <p className="text-xs text-muted-foreground">
              Learn how classical + PQC hybrid KEMs work with hands-on HKDF key derivation.
            </p>
          </Link>
          <Link
            to="/learn/key-management"
            className="bg-muted/50 rounded-lg p-3 border border-border hover:border-primary/30 transition-colors group"
          >
            <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
              Key Management &amp; HSM <ArrowRight size={14} />
            </div>
            <p className="text-xs text-muted-foreground">
              Deep dive into HSM PKCS#11 operations and enterprise key lifecycle management.
            </p>
          </Link>
          <Link
            to="/learn/5g-security"
            className="bg-muted/50 rounded-lg p-3 border border-border hover:border-primary/30 transition-colors group"
          >
            <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
              5G Security <ArrowRight size={14} />
            </div>
            <p className="text-xs text-muted-foreground">
              Explore 3GPP security architecture — QKD could secure future telecom backbones.
            </p>
          </Link>
          <Link
            to="/threats"
            className="bg-muted/50 rounded-lg p-3 border border-border hover:border-primary/30 transition-colors group"
          >
            <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
              Threat Dashboard <ArrowRight size={14} />
            </div>
            <p className="text-xs text-muted-foreground">
              Understand the quantum threats that motivate both PQC and QKD adoption.
            </p>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onNavigateToWorkshop}
          className="px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 justify-center"
        >
          <Radio size={18} /> Try the BB84 Simulator
        </button>
      </div>
    </div>
  )
}
