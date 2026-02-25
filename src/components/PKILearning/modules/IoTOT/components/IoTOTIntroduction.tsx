import React from 'react'
import { Link } from 'react-router-dom'
import {
  Cpu,
  Shield,
  Link2,
  FileCode,
  Network,
  Factory,
  Layers,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { DEVICE_CLASSES, CONSTRAINED_ALGORITHMS, IOT_PROTOCOLS, PURDUE_LAYERS } from '../constants'

interface IoTOTIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const IoTOTIntroduction: React.FC<IoTOTIntroductionProps> = ({ onNavigateToWorkshop }) => {
  const kemAlgorithms = CONSTRAINED_ALGORITHMS.filter((a) => a.type === 'KEM')
  const sigAlgorithms = CONSTRAINED_ALGORITHMS.filter((a) => a.type === 'Signature')

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: Why IoT/OT Is Different */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Cpu size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Why IoT/OT Is Different</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Internet of Things (IoT) and Operational Technology (OT) devices face unique
            post-quantum migration challenges that don&apos;t apply to servers or desktops. These
            devices operate under severe resource constraints &mdash; limited RAM, slow processors,
            narrow bandwidth &mdash; while having deployment lifetimes of 15&ndash;30 years.
          </p>

          <div className="space-y-2">
            {[
              {
                t: 'Memory Constraints',
                d: 'Many IoT devices have 10\u2013256 KB of RAM. PQC algorithms like ML-KEM-768 require ~6 KB of stack RAM just for one key exchange \u2014 a significant fraction of a Class 1 device\u2019s total memory.',
              },
              {
                t: 'Bandwidth Limits',
                d: 'NB-IoT offers only 62.5 kbps uplink. A single ML-KEM-768 ciphertext (1,088 bytes) takes ~0.14 seconds to transmit \u2014 manageable alone, but a full PQC DTLS handshake could take several seconds.',
              },
              {
                t: 'Long Lifetimes',
                d: 'SCADA systems in power grids run for 20\u201330 years. Devices deployed today will still be operational when cryptographically relevant quantum computers (CRQCs) arrive. This makes them prime HNDL targets.',
              },
              {
                t: 'Update Difficulty',
                d: 'Many OT devices are air-gapped, physically inaccessible, or lack OTA update capability. Crypto-agility must be designed in from the start \u2014 it cannot be retrofitted.',
              },
            ].map((item) => (
              <div key={item.t} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">{item.t}</div>
                  <p className="text-xs text-muted-foreground">{item.d}</p>
                </div>
              </div>
            ))}
          </div>

          {/* RFC 7228 Device Classes Table */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-3">
              RFC 7228 Constrained Device Classes
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground font-medium">Class</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">RAM</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Flash</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Examples</th>
                  </tr>
                </thead>
                <tbody>
                  {DEVICE_CLASSES.map((dc) => (
                    <tr key={dc.id} className="border-b border-border/50">
                      <td className="p-2 font-medium text-foreground">{dc.name}</td>
                      <td className="p-2 text-right font-mono text-xs text-foreground">
                        {dc.ramKB} KB
                      </td>
                      <td className="p-2 text-right font-mono text-xs text-foreground">
                        {dc.flashKB} KB
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {dc.examples.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Algorithm Selection for Constrained Devices */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Shield size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            Algorithm Selection for Constrained Devices
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Not all PQC algorithms are suitable for constrained devices. The key trade-off is
            between security level, resource consumption, and output sizes.{' '}
            <InlineTooltip term="ML-KEM">ML-KEM-512</InlineTooltip> fits in ~3 KB of stack RAM,
            while <InlineTooltip term="FrodoKEM">FrodoKEM-640</InlineTooltip> needs ~180 KB &mdash;
            impossible for Class 0/1 devices.
          </p>

          {/* KEM Comparison */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-3">
              KEM Algorithms &mdash; RAM Requirements
            </div>
            <div className="space-y-2">
              {kemAlgorithms.map((alg) => {
                const maxRAM = 180
                const pct = Math.max((alg.ramKB / maxRAM) * 100, 2)
                return (
                  <div key={alg.name}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-muted-foreground">
                        {alg.name}
                        {!alg.quantumSafe && ' (classical)'}
                      </span>
                      <span className="font-mono text-foreground">{alg.ramKB} KB</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${alg.quantumSafe ? 'bg-success/60' : 'bg-destructive/60'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              FrodoKEM&apos;s conservative design (no ring/module structure) comes at a massive RAM
              cost, making it infeasible for any IoT deployment.
            </p>
          </div>

          {/* Signature Comparison */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-3">
              Signature Algorithms &mdash; Output Sizes
            </div>
            <div className="space-y-2">
              {sigAlgorithms.map((alg) => {
                const maxSig = 3309
                const pct = Math.max((alg.ciphertextOrSigBytes / maxSig) * 100, 2)
                return (
                  <div key={alg.name}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-muted-foreground">
                        {alg.name}
                        {!alg.quantumSafe && ' (classical)'}
                      </span>
                      <span className="font-mono text-foreground">
                        {alg.ciphertextOrSigBytes.toLocaleString()} B sig / {alg.publicKeyBytes} B
                        key
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${alg.quantumSafe ? 'bg-success/60' : 'bg-destructive/60'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              <InlineTooltip term="FN-DSA">FN-DSA-512</InlineTooltip> (FIPS 206, draft) produces the
              most compact PQC signature at just 666 bytes &mdash; ideal for bandwidth-constrained
              IoT. <InlineTooltip term="LMS/HSS">LMS</InlineTooltip> has the smallest verifier (0.5
              KB RAM, 56-byte public key) but requires stateful key management.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Certificate Chain Bloat */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Link2 size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Certificate Chain Bloat</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            A classical ECDSA P-256 certificate chain (root + intermediate + leaf) is roughly 3 KB.
            A PQC chain using <InlineTooltip term="ML-DSA">ML-DSA-65</InlineTooltip> balloons to ~22
            KB &mdash; a 7x increase. For a Class 1 device with 10 KB of RAM, this chain alone
            exceeds total memory.
          </p>

          {/* Size Comparison Visual */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-3">
              Certificate Chain Size (3-cert chain)
            </div>
            <div className="space-y-2">
              {[
                { name: 'ECDSA P-256', size: 3, pct: 12, color: 'bg-destructive/60' },
                { name: 'RSA-2048', size: 4.5, pct: 18, color: 'bg-destructive/60' },
                { name: 'ML-DSA-44', size: 16, pct: 64, color: 'bg-success/60' },
                { name: 'ML-DSA-65', size: 22, pct: 88, color: 'bg-success/60' },
                { name: 'ML-DSA-87', size: 25, pct: 100, color: 'bg-primary/60' },
              ].map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-mono text-foreground">~{item.size} KB</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Merkle Tree Certificates</div>
              <p className="text-xs text-muted-foreground">
                Replace per-cert PQC signatures with compact Merkle inclusion proofs (~300 bytes vs
                ~3 KB). Reduces chain overhead by up to 85%. See the{' '}
                <Link
                  to="/learn/merkle-tree-certs"
                  className="text-primary hover:underline font-bold"
                >
                  Merkle Tree Certificates module
                </Link>
                .
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Other Mitigations</div>
              <p className="text-xs text-muted-foreground">
                Certificate compression (RFC 8879) saves 25&ndash;35%. Session resumption (PSK)
                eliminates certs on reconnection. Raw public keys (RFC 7250) remove signatures and
                metadata entirely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Firmware Signing for IoT */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <FileCode size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Firmware Signing for IoT</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Over-the-air (OTA) firmware updates are a critical attack surface for IoT devices. The
            signing algorithm must produce compact signatures (to minimize bandwidth), have fast
            verification (constrained CPUs), and resist quantum attacks for the device&apos;s entire
            operational lifetime.
          </p>

          <p>
            <InlineTooltip term="LMS/HSS">LMS/HSS</InlineTooltip> is the leading choice for firmware
            signing: 56-byte public key, 2.5 KB signature, ~0.1 ms verification. Its stateful nature
            (monotonic counter in TPM) is acceptable for firmware signing servers that sign
            infrequently. The <InlineTooltip term="SUIT">SUIT manifest</InlineTooltip> (RFC 9019)
            wraps the firmware image with metadata, conditions, and signatures for secure OTA
            delivery.
          </p>

          {/* CNSA 2.0 Callout */}
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <div className="text-xs font-bold text-primary mb-2">
              CNSA 2.0 Firmware Signing Timeline
            </div>
            <div className="space-y-1">
              {[
                {
                  year: '2025',
                  text: 'New firmware/software should prefer LMS/XMSS (CNSA 2.0 algorithms)',
                },
                { year: '2030', text: 'All NSS firmware must use CNSA 2.0 signatures' },
                { year: '2033\u201335', text: 'Full quantum-resistant enforcement across NSS' },
              ].map((m) => (
                <div key={m.year} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5 shrink-0">
                    {m.year}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{m.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            For deep dives on LMS/XMSS state management and secure boot chains, see the{' '}
            <Link
              to="/learn/stateful-signatures"
              className="text-primary hover:underline font-bold"
            >
              Stateful Hash Signatures
            </Link>{' '}
            and{' '}
            <Link to="/learn/code-signing" className="text-primary hover:underline font-bold">
              Code Signing
            </Link>{' '}
            modules.
          </p>
        </div>
      </section>

      {/* Section 5: Protocol Considerations */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Network size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Protocol Considerations</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            IoT devices communicate over constrained protocols with strict payload limits. PQC key
            exchanges and signatures must fit within these constraints &mdash; or fragment across
            multiple messages, adding latency and failure risk.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Protocol</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Transport</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">Max Payload</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">
                    PQC Feasibility
                  </th>
                </tr>
              </thead>
              <tbody>
                {IOT_PROTOCOLS.map((proto) => (
                  <tr key={proto.name} className="border-b border-border/50">
                    <td className="p-2 font-medium text-foreground">{proto.name}</td>
                    <td className="p-2 font-mono text-xs text-foreground">{proto.transport}</td>
                    <td className="p-2 text-right font-mono text-xs text-foreground">
                      {proto.maxPayloadBytes.toLocaleString()} B
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`text-xs font-bold ${
                          proto.pqcFeasibility === 'good'
                            ? 'text-success'
                            : proto.pqcFeasibility === 'challenging'
                              ? 'text-warning'
                              : 'text-destructive'
                        }`}
                      >
                        {proto.pqcFeasibility === 'good'
                          ? 'Good'
                          : proto.pqcFeasibility === 'challenging'
                            ? 'Challenging'
                            : 'Problematic'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">
              <InlineTooltip term="DTLS">DTLS</InlineTooltip> 1.3 Fragmentation Challenge
            </div>
            <p className="text-xs text-muted-foreground">
              A classical <InlineTooltip term="DTLS">DTLS</InlineTooltip> 1.3 handshake is ~5 KB.
              With PQC (ML-KEM-768 + ML-DSA-44), this grows to ~22 KB &mdash; requiring 15+ DTLS
              fragments over a 1,280-byte IPv6 minimum MTU. Each fragment is a potential point of
              failure on lossy wireless networks.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: SCADA/ICS Security */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Factory size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">SCADA/ICS Security</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <InlineTooltip term="SCADA">SCADA</InlineTooltip> and Industrial Control Systems (ICS)
            manage critical infrastructure &mdash; power grids, water treatment, manufacturing.
            These systems have the longest asset lifecycles (15&ndash;30 years) and the highest
            consequences of compromise.
          </p>

          {/* Purdue Model */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-3">
              Purdue Model &mdash; PQC Migration Priority
            </div>
            <div className="space-y-2">
              {PURDUE_LAYERS.map((layer, idx) => (
                <React.Fragment key={String(layer.level)}>
                  {idx > 0 && (
                    <div className="flex justify-center text-muted-foreground text-xs">|</div>
                  )}
                  <div
                    className={`rounded-lg p-3 border ${
                      layer.pqcPriority === 'critical'
                        ? 'border-destructive/50 bg-destructive/5'
                        : layer.pqcPriority === 'high'
                          ? 'border-warning/50 bg-warning/5'
                          : layer.pqcPriority === 'medium'
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-foreground">
                        Level {layer.level}: {layer.name}
                      </div>
                      <span
                        className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${
                          layer.pqcPriority === 'critical'
                            ? 'bg-destructive/20 text-destructive'
                            : layer.pqcPriority === 'high'
                              ? 'bg-warning/20 text-warning'
                              : layer.pqcPriority === 'medium'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {layer.pqcPriority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{layer.description}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;Internet-facing layers (DMZ, enterprise boundary) must migrate to PQC first
              &mdash; they are the primary{' '}
              <InlineTooltip term="HNDL">harvest-now-decrypt-later</InlineTooltip> target.
              Air-gapped Level 0&ndash;1 devices may rely on gateway-mediated PQC protection.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* Section 7: Hybrid Approaches on Constrained Hardware */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Layers size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            Hybrid Approaches on Constrained Hardware
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Running both classical and PQC algorithms doubles the resource cost. For Class 2+
            devices, native hybrid (e.g., X25519 + ML-KEM-768) is feasible. For Class 0/1 devices, a{' '}
            <strong>gateway-mediated</strong> approach is more practical.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">
                Gateway-Mediated PQC (Class 0/1)
              </div>
              <p className="text-xs text-muted-foreground">
                Constrained devices use classical crypto (ECDSA/X25519) to communicate with a nearby
                gateway. The gateway terminates classical connections and re-encrypts with PQC for
                the IT/cloud side. This protects data in transit without modifying field devices.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Native Hybrid (Class 2+)</div>
              <p className="text-xs text-muted-foreground">
                Devices with 50+ KB RAM can run hybrid key exchanges natively. The KEM shared secret
                is derived from both classical and PQC components &mdash; security holds as long as
                either algorithm is unbroken.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            For details on hybrid key exchange and composite signatures, see the{' '}
            <Link to="/learn/hybrid-crypto" className="text-primary hover:underline font-bold">
              Hybrid Cryptography
            </Link>{' '}
            and{' '}
            <Link to="/learn/crypto-agility" className="text-primary hover:underline font-bold">
              Crypto Agility
            </Link>{' '}
            modules.
          </p>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            {
              to: '/learn/stateful-signatures',
              icon: Shield,
              title: 'Stateful Hash Signatures',
              desc: 'LMS/XMSS deep dive, state management, and CNSA 2.0 timelines',
            },
            {
              to: '/learn/code-signing',
              icon: FileCode,
              title: 'Code Signing',
              desc: 'Secure boot chains, Sigstore keyless signing, and firmware verification',
            },
            {
              to: '/learn/merkle-tree-certs',
              icon: Link2,
              title: 'Merkle Tree Certificates',
              desc: 'Compact inclusion proofs to reduce PQC certificate chain sizes',
            },
            {
              to: '/learn/5g-security',
              icon: Network,
              title: '5G Security',
              desc: '3GPP security architecture and cellular PQC migration',
            },
            {
              to: '/learn/hybrid-crypto',
              icon: Layers,
              title: 'Hybrid Cryptography',
              desc: 'Composite signatures and dual-algorithm approaches',
            },
            {
              to: '/learn/crypto-agility',
              icon: Cpu,
              title: 'Crypto Agility',
              desc: 'Abstraction layers and the 7-phase migration framework',
            },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
            >
              <link.icon size={18} className="text-primary shrink-0" />
              <div>
                <div className="text-sm font-medium text-foreground">{link.title}</div>
                <div className="text-xs text-muted-foreground">{link.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try it in the Workshop <ArrowRight size={18} />
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Compare algorithm resource footprints, simulate firmware signing, visualize DTLS handshake
          overhead, and plan SCADA migration.
        </p>
      </div>
    </div>
  )
}
