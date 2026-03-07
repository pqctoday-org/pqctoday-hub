// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Cpu,
  Lock,
  Shield,
  ShieldCheck,
  Server,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  HardDrive,
  Eye,
  Layers,
  Link2,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { TEE_ARCHITECTURES } from '../data/teeArchitectureData'
import {
  MEMORY_ENCRYPTION_ENGINES,
  QUANTUM_THREAT_VECTORS,
  ATTESTATION_FLOWS,
} from '../data/attestationData'
import {
  SEVERITY_COLORS,
  SCOPE_LABELS,
  PQC_READINESS_COLORS,
  MATURITY_COLORS,
} from '../data/ccConstants'

// ── Local CollapsibleSection ─────────────────────────────────────────────

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="glass-panel overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
          <h2 className="text-xl font-bold text-gradient">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={20} className="text-muted-foreground shrink-0" />
        )}
      </button>
      {isOpen && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </section>
  )
}

// ── Introduction Component ───────────────────────────────────────────────

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* ── Section 1: TEE Fundamentals & Threat Model ──────────────────── */}
      <CollapsibleSection
        title="TEE Fundamentals & Threat Model"
        icon={<Shield size={24} className="text-primary" />}
        defaultOpen={true}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            A{' '}
            <InlineTooltip term="TEE">
              <strong>Trusted Execution Environment (TEE)</strong>
            </InlineTooltip>{' '}
            is a hardware-isolated region of a processor that guarantees confidentiality and
            integrity of code and data loaded inside it. Unlike traditional OS-level isolation, TEEs
            protect workloads even when the operating system, hypervisor, or firmware has been fully
            compromised.
          </p>

          <p>
            Code running inside a TEE operates within an{' '}
            <InlineTooltip term="Enclave">
              <strong>enclave</strong>
            </InlineTooltip>{' '}
            &mdash; a protected memory region where the processor enforces access control in
            hardware. Data inside the enclave is encrypted in DRAM, decrypted only within the CPU
            cache, and inaccessible to any software outside the enclave boundary.
          </p>

          {/* Threat model: what TEEs protect against */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-status-success/10 rounded-lg p-4 border border-status-success/20">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <ShieldCheck size={16} className="text-status-success" />
                TEEs Protect Against
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; Compromised operating system or hypervisor</li>
                <li>&bull; Malicious cloud administrator or co-tenant</li>
                <li>&bull; Cold boot attacks and DRAM bus snooping</li>
                <li>&bull; DMA attacks from peripheral devices</li>
                <li>&bull; Software-level privilege escalation</li>
              </ul>
            </div>
            <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-status-error" />
                TEEs Do NOT Protect Against
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; Microarchitectural side channels (Spectre, Meltdown)</li>
                <li>&bull; Supply chain attacks on CPU manufacturing</li>
                <li>&bull; Bugs within the enclave code itself</li>
                <li>&bull; Denial-of-service (host can starve enclave)</li>
                <li>&bull; Physical decapping and FIB probing</li>
              </ul>
            </div>
          </div>

          {/* Trusted Computing Base (TCB) */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Layers size={16} className="text-primary" />
              Trusted Computing Base (TCB)
            </h4>
            <p className="text-xs text-muted-foreground">
              The <strong>TCB</strong> is the set of all hardware, firmware, and software components
              that must function correctly for the security guarantees to hold. A smaller TCB means
              fewer components can undermine security. Process-level TEEs (SGX) have the smallest
              TCB &mdash; just the CPU and enclave code. VM-level TEEs (TDX, SEV-SNP) include the
              guest OS, resulting in a larger but more practical TCB.
            </p>
          </div>

          {/* Data-in-use vs data-at-rest vs data-in-transit */}
          <h4 className="text-sm font-bold text-foreground">Data Protection Comparison</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-sm font-bold text-primary mb-1">Data at Rest</div>
              <p className="text-xs text-muted-foreground mb-2">
                Encrypted on disk via AES-XTS or similar. Protected by volume encryption (LUKS,
                BitLocker) or database-level TDE.
              </p>
              <div className="text-[10px] px-2 py-0.5 rounded bg-status-success/10 text-status-success border border-status-success/20 text-center font-bold">
                WELL-ESTABLISHED
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-sm font-bold text-primary mb-1">Data in Transit</div>
              <p className="text-xs text-muted-foreground mb-2">
                Encrypted over the network via TLS 1.3, IPsec, or WireGuard. Protects against
                eavesdropping and tampering during transmission.
              </p>
              <div className="text-[10px] px-2 py-0.5 rounded bg-status-success/10 text-status-success border border-status-success/20 text-center font-bold">
                WELL-ESTABLISHED
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-sm font-bold text-primary mb-1">Data in Use</div>
              <p className="text-xs text-muted-foreground mb-2">
                Encrypted in memory while being processed. TEEs provide hardware-enforced isolation
                so data remains protected during computation.
              </p>
              <div className="text-[10px] px-2 py-0.5 rounded bg-status-warning/10 text-status-warning border border-status-warning/20 text-center font-bold">
                EMERGING (TEE-DEPENDENT)
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Section 2: Vendor Architectures ─────────────────────────────── */}
      <CollapsibleSection
        title="Vendor Architectures"
        icon={<Cpu size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Seven major TEE architectures span the ecosystem, each with distinct isolation scopes,
            deployment models, and PQC readiness levels.
          </p>

          {/* Vendor cards: 2-col grid for 6, then 1 for the 7th */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEE_ARCHITECTURES.map((arch) => (
              <div key={arch.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground">{arch.name}</h4>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${SCOPE_LABELS[arch.scope] ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
                    >
                      {SCOPE_LABELS[arch.scope]}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${MATURITY_COLORS[arch.maturityLevel]}`}
                  >
                    {arch.maturityLevel.toUpperCase()}
                  </span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 mb-2">
                  <li>
                    &bull; <strong>Isolation:</strong> {arch.isolationMechanism.split(';')[0]}
                  </li>
                  <li>
                    &bull; <strong>Memory:</strong> {arch.memoryEncryption.split(',')[0]}
                  </li>
                  <li>
                    &bull; <strong>Attestation:</strong> {arch.attestationType} &mdash;{' '}
                    {arch.attestationRoot.split('(')[0].trim()}
                  </li>
                </ul>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-medium">PQC:</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${PQC_READINESS_COLORS[arch.pqcReadiness]}`}
                  >
                    {arch.pqcReadiness.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison summary table */}
          <h4 className="text-sm font-bold text-foreground">Architecture Comparison</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Architecture</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Scope</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Encryption</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Attestation</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Deployment</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Maturity</th>
                </tr>
              </thead>
              <tbody>
                {TEE_ARCHITECTURES.map((arch) => (
                  <tr key={arch.id} className="border-b border-border/50">
                    <td className="p-2 text-xs font-bold text-foreground">{arch.name}</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {SCOPE_LABELS[arch.scope]}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground font-mono">
                      {arch.memoryEncryption.split(',')[0].split('(')[0].trim()}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{arch.attestationType}</td>
                    <td className="p-2 text-xs text-muted-foreground">{arch.deploymentModel}</td>
                    <td className="p-2 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${MATURITY_COLORS[arch.maturityLevel]}`}
                      >
                        {arch.maturityLevel.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Section 3: Remote Attestation & Trust Chains ─────────────────── */}
      <CollapsibleSection
        title="Remote Attestation & Trust Chains"
        icon={<ShieldCheck size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <InlineTooltip term="Remote Attestation">
              <strong>Remote attestation</strong>
            </InlineTooltip>{' '}
            is the process by which a TEE proves its identity and integrity to a remote verifier.
            The enclave generates a cryptographically signed report of its code measurement,
            platform state, and configuration &mdash; enabling a relying party to verify that it is
            communicating with genuine, untampered hardware before releasing sensitive data.
          </p>

          <p>
            Without{' '}
            <InlineTooltip term="Attestation">
              <strong>attestation</strong>
            </InlineTooltip>
            , a TEE is just an opaque box &mdash; the relying party has no assurance that the
            enclave is running the expected code on legitimate hardware. Attestation is the
            foundation of trust in confidential computing.
          </p>

          {/* Attestation flow diagram */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3">Attestation Trust Chain</h4>
            <div className="flex flex-col sm:flex-row items-center gap-2 text-xs font-mono text-foreground justify-center">
              <div className="bg-primary/10 border border-primary/30 rounded px-4 py-2 text-center">
                Enclave
                <div className="text-[10px] text-muted-foreground font-sans">Generate Report</div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground sm:rotate-0 rotate-90" />
              <div className="bg-primary/10 border border-primary/30 rounded px-4 py-2 text-center">
                Platform
                <div className="text-[10px] text-muted-foreground font-sans">Sign with AK</div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground sm:rotate-0 rotate-90" />
              <div className="bg-primary/10 border border-primary/30 rounded px-4 py-2 text-center">
                Attestation Service
                <div className="text-[10px] text-muted-foreground font-sans">Verify Chain</div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground sm:rotate-0 rotate-90" />
              <div className="bg-status-success/10 border border-status-success/30 rounded px-4 py-2 text-center font-bold">
                Relying Party
                <div className="text-[10px] text-muted-foreground font-sans font-normal">
                  Trust Decision
                </div>
              </div>
            </div>
          </div>

          {/* Attestation flows table */}
          <h4 className="text-sm font-bold text-foreground">Attestation Flow Comparison</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Vendor</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Signing Algo</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Hash Algo</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">PQC Status</th>
                </tr>
              </thead>
              <tbody>
                {ATTESTATION_FLOWS.map((flow) => (
                  <tr key={flow.id} className="border-b border-border/50">
                    <td className="p-2 text-xs font-bold text-foreground">{flow.name}</td>
                    <td className="p-2 text-xs font-mono text-muted-foreground">
                      {flow.signingAlgorithm}
                    </td>
                    <td className="p-2 text-xs font-mono text-muted-foreground">
                      {flow.hashAlgorithm}
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${PQC_READINESS_COLORS[flow.pqcMigrationStatus]}`}
                      >
                        {flow.pqcMigrationStatus.replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Critical callout: all attestation chains are quantum-vulnerable */}
          <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  All Attestation Chains Are Quantum-Vulnerable
                </h4>
                <p className="text-xs text-muted-foreground">
                  Every current attestation implementation &mdash; Intel DCAP, ARM CCA, AMD SEV-SNP,
                  and AWS Nitro &mdash; uses <strong>ECDSA P-256 or P-384</strong> for signing
                  attestation reports. Shor&apos;s algorithm can break these signatures in
                  polynomial time on a cryptographically relevant quantum computer (CRQC). An
                  attacker who can forge attestation quotes can impersonate a legitimate enclave,
                  completely undermining the trust model of confidential computing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Section 4: Memory Encryption & Data-in-Use Protection ────────── */}
      <CollapsibleSection
        title="Memory Encryption & Data-in-Use Protection"
        icon={<Lock size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            TEEs protect data in use through hardware memory encryption engines that encrypt DRAM
            contents transparently. Each vendor implements this differently, with varying key
            widths, granularities, and integrity protection mechanisms.
          </p>

          {/* Engine comparison table */}
          <h4 className="text-sm font-bold text-foreground">Memory Encryption Engine Comparison</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Engine</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Algorithm</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Key Width</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Integrity</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">
                    Quantum Impact
                  </th>
                </tr>
              </thead>
              <tbody>
                {MEMORY_ENCRYPTION_ENGINES.map((engine) => (
                  <tr key={engine.id} className="border-b border-border/50">
                    <td className="p-2 text-xs font-bold text-foreground">{engine.name}</td>
                    <td className="p-2 text-xs font-mono text-muted-foreground">
                      {engine.algorithm.split('(')[0].trim()}
                    </td>
                    <td className="p-2 text-center text-xs text-foreground">
                      {engine.keyWidth}-bit
                    </td>
                    <td className="p-2 text-center">
                      {engine.integrityProtection ? (
                        <span className="text-status-success text-xs font-bold">Yes</span>
                      ) : (
                        <span className="text-status-warning text-xs font-bold">No</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                          engine.quantumImpact === 'grover-halved'
                            ? 'bg-status-warning/20 text-status-warning border-status-warning/50'
                            : 'bg-status-success/20 text-status-success border-status-success/50'
                        }`}
                      >
                        {engine.quantumImpact === 'grover-halved'
                          ? 'GROVER HALVED'
                          : engine.quantumImpact === 'key-expansion-needed'
                            ? 'EXPANSION NEEDED'
                            : 'NONE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sealing key explanation */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <HardDrive size={16} className="text-primary" />
              Sealing Keys
            </h4>
            <p className="text-xs text-muted-foreground">
              A <strong>sealing key</strong> is a symmetric key derived from the platform&apos;s
              hardware root of trust, bound to the enclave&apos;s identity (code measurement and/or
              signer identity). Enclaves use sealing keys to encrypt data that persists across
              restarts &mdash; only an enclave with the same identity on the same physical platform
              can unseal the data. The key derivation chain typically flows:{' '}
              <span className="font-mono text-primary">
                CPU Root Key &rarr; CPU SVN &rarr; Enclave Identity &rarr; Sealing Key
              </span>
              . If any component in the chain changes (firmware update, different enclave version),
              the derived sealing key changes and previously sealed data becomes inaccessible
              without a migration protocol.
            </p>
          </div>

          {/* Grover halving callout */}
          <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Grover&apos;s Algorithm Halves AES-128 Security
                </h4>
                <p className="text-xs text-muted-foreground">
                  Intel TME-MK and AMD SME/SEV use <strong>AES-XTS-128</strong> for memory
                  encryption. Grover&apos;s algorithm reduces the effective key strength from
                  128-bit to <strong>64-bit</strong> &mdash; well below the NIST Level 1 threshold
                  of 128-bit post-quantum security. While real-time brute-forcing of memory
                  encryption keys remains impractical even with a CRQC, this weakened margin erodes
                  the security guarantee. Next-generation CPUs are expected to upgrade to
                  AES-XTS-256 (128-bit post-quantum security).
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Section 5: TEE-HSM Trusted Communication ────────────────────── */}
      <CollapsibleSection
        title="TEE-HSM Trusted Communication"
        icon={<Link2 size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            In production deployments, TEEs rarely operate in isolation &mdash; they need access to
            long-lived cryptographic keys stored in Hardware Security Modules (HSMs). The
            communication channel between a TEE and an HSM must itself be trustworthy, creating a{' '}
            <strong>mutual trust</strong> requirement: the TEE must verify it is talking to a
            genuine HSM, and the HSM must verify the TEE is running expected code on legitimate
            hardware.
          </p>

          {/* Architecture diagram */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3">
              TEE-HSM Communication Architecture
            </h4>
            <div className="flex flex-col sm:flex-row items-center gap-2 text-xs font-mono text-foreground justify-center">
              <div className="bg-primary/10 border border-primary/30 rounded px-4 py-2 text-center">
                TEE / Enclave
                <div className="text-[10px] text-muted-foreground font-sans">
                  Attestation Report
                </div>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <ArrowRight size={14} className="text-muted-foreground sm:rotate-0 rotate-90" />
                <span className="text-[10px] text-primary font-sans font-bold">TLS 1.3</span>
                <ArrowRight size={14} className="text-muted-foreground sm:rotate-180 -rotate-90" />
              </div>
              <div className="bg-status-success/10 border border-status-success/30 rounded px-4 py-2 text-center font-bold">
                HSM
                <div className="text-[10px] text-muted-foreground font-sans font-normal">
                  Key Provisioning
                </div>
              </div>
            </div>
          </div>

          {/* Mutual attestation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Eye size={14} className="text-primary" />
                Mutual Attestation
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                The TEE presents its attestation report (e.g., SGX Quote, SEV-SNP Report) to the
                HSM. The HSM verifies the report against the vendor&apos;s root CA, checks the code
                measurement, and validates the TCB level before releasing any key material.
              </p>
              <p className="text-xs text-muted-foreground">
                In reverse, the TEE verifies the HSM&apos;s PKCS#11 or KMIP endpoint certificate
                against a pinned CA to prevent man-in-the-middle attacks.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Server size={14} className="text-primary" />
                Key Provisioning Flow
              </h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>TEE generates attestation report with nonce</li>
                <li>HSM verifies attestation + TCB status</li>
                <li>TLS 1.3 session established (channel binding)</li>
                <li>HSM generates or unwraps PQC key pair</li>
                <li>Wrapped key material sent to TEE over TLS</li>
                <li>TEE unseals with platform-derived wrapping key</li>
              </ol>
            </div>
          </div>

          {/* Cross-reference callout to HSM module */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start gap-2">
              <Shield size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Explore PKCS#11 PQC Operations
                </h4>
                <p className="text-xs text-muted-foreground">
                  The HSM &amp; PQC module includes an interactive PKCS#11 simulator where you can
                  step through ML-KEM encapsulation, ML-DSA signing, and key provisioning operations
                  &mdash; the same operations used in TEE-HSM key provisioning flows.
                </p>
                <Link
                  to="/learn/hsm-pqc?tab=workshop&step=0"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-2 font-medium"
                >
                  <ArrowRight size={12} />
                  Open PKCS#11 Simulator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Section 6: Quantum Threats to Confidential Computing ─────────── */}
      <CollapsibleSection
        title="Quantum Threats to Confidential Computing"
        icon={<AlertTriangle size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Quantum computers threaten multiple layers of the confidential computing stack &mdash;
            from attestation signatures to memory encryption to TEE-HSM communication channels. The
            severity and migration urgency varies by component.
          </p>

          {/* Threat severity table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Threat</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Component</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Severity</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">HNDL</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">PQC Solution</th>
                </tr>
              </thead>
              <tbody>
                {QUANTUM_THREAT_VECTORS.map((threat) => (
                  <tr key={threat.id} className="border-b border-border/50">
                    <td className="p-2 text-xs font-bold text-foreground">{threat.name}</td>
                    <td className="p-2 text-xs text-muted-foreground">{threat.component}</td>
                    <td className="p-2 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${SEVERITY_COLORS[threat.severity]}`}
                      >
                        {threat.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {threat.hndlExposure ? (
                        <span className="text-status-error text-xs font-bold">Yes</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">No</span>
                      )}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {threat.pqcSolution.split('.')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vendor PQC timeline summary */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Cpu size={16} className="text-primary" />
              Vendor PQC Attestation Timeline
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { vendor: 'Intel (SGX/TDX)', year: '2027', status: 'planned' as const },
                { vendor: 'ARM (CCA)', year: '2028', status: 'planned' as const },
                { vendor: 'AMD (SEV-SNP)', year: '2028', status: 'planned' as const },
                { vendor: 'AWS (Nitro)', year: 'TBD', status: 'preview' as const },
              ].map((v) => (
                <div
                  key={v.vendor}
                  className="bg-background/50 rounded-lg p-3 border border-border text-center"
                >
                  <div className="text-xs font-bold text-foreground mb-1">{v.vendor}</div>
                  <div className="text-lg font-bold text-primary">{v.year}</div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${PQC_READINESS_COLORS[v.status]}`}
                  >
                    {v.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Workshop CTA ────────────────────────────────────────────────── */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-foreground">Ready to explore TEE architectures?</h3>
            <p className="text-sm text-muted-foreground">
              Compare vendor security properties, simulate attestation flows, and assess PQC
              migration readiness in the interactive workshop.
            </p>
          </div>
          <Button variant="gradient" onClick={onNavigateToWorkshop} className="shrink-0">
            Open Workshop <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>

      {/* ── Related Modules ─────────────────────────────────────────────── */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-bold text-foreground mb-3">Related Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/learn/hsm-pqc"
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowRight size={14} />
            HSM & PQC Integration
          </Link>
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowRight size={14} />
            KMS & PQC Integration
          </Link>
          <Link
            to="/learn/pki-workshop"
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowRight size={14} />
            PKI Workshop
          </Link>
        </div>
      </div>

      {/* ── Reading Complete ─────────────────────────────────────────────── */}
      <ReadingCompleteButton />
    </div>
  )
}
