// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Server,
  Lock,
  Cloud,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Shield,
  Cpu,
  AlertTriangle,
  HardDrive,
  RefreshCw,
  Layers,
  Zap,
  Eye,
  GitBranch,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import {
  PKCS11_MECHANISMS,
  SIDE_CHANNEL_VECTORS,
  FIRMWARE_UPGRADE_PATHS,
  KEY_SIZE_COMPARISONS,
} from '../data/hsmConstants'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'

interface HsmPqcIntroductionProps {
  onNavigateToWorkshop: () => void
}

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

export const HsmPqcIntroduction: React.FC<HsmPqcIntroductionProps> = ({ onNavigateToWorkshop }) => {
  const classicalMechanisms = PKCS11_MECHANISMS.filter((m) => m.type === 'classical')
  const pqcMechanisms = PKCS11_MECHANISMS.filter((m) => m.type === 'pqc')

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: HSM Architecture for PQC */}
      <CollapsibleSection
        title="HSM Architecture for PQC"
        icon={<Server size={24} className="text-primary" />}
        defaultOpen={true}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            A <strong>Hardware Security Module (HSM)</strong> is a tamper-resistant physical device
            that performs cryptographic operations and protects keys within a certified security
            boundary. The <InlineTooltip term="FIPS 140-3">FIPS 140-3 standard</InlineTooltip>{' '}
            defines four security levels:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                level: 'Level 1',
                desc: 'Basic security requirements. Software-only cryptographic module. No physical security mechanisms.',
              },
              {
                level: 'Level 2',
                desc: 'Tamper-evidence (seals, coatings). Role-based authentication. Minimum OS requirements.',
              },
              {
                level: 'Level 3',
                desc: 'Tamper-resistant. Identity-based authentication. Physical/logical separation of interfaces. Keys zeroed on tamper detection.',
              },
              {
                level: 'Level 4',
                desc: 'Tamper-responsive envelope. Environmental failure protection (voltage, temperature). Complete physical penetration protection.',
              },
            ].map((item) => (
              <div key={item.level} className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="text-sm font-bold text-primary mb-1">{item.level}</div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Architecture Diagram */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3">HSM Integration Architecture</h4>
            <div className="flex flex-col items-center gap-2 text-xs font-mono text-foreground">
              <div className="bg-primary/10 border border-primary/30 rounded px-4 py-2 text-center">
                Application (TLS Server, CA, Key Manager)
              </div>
              <ArrowRight size={14} className="text-muted-foreground rotate-90" />
              <div className="bg-primary/10 border border-primary/30 rounded px-4 py-2 text-center">
                PKCS#11 API (v3.2 with PQC mechanisms)
              </div>
              <ArrowRight size={14} className="text-muted-foreground rotate-90" />
              <div className="bg-primary/10 border border-primary/30 rounded px-4 py-2 text-center">
                Provider Library (vendor-specific)
              </div>
              <ArrowRight size={14} className="text-muted-foreground rotate-90" />
              <div className="bg-primary/10 border border-primary/30 rounded px-4 py-2 text-center">
                HSM Firmware (PQC algorithm engine)
              </div>
              <ArrowRight size={14} className="text-muted-foreground rotate-90" />
              <div className="bg-success/10 border border-success/30 rounded px-4 py-2 text-center font-bold">
                Hardware Crypto Accelerator + DRBG + Tamper Protection
              </div>
            </div>
          </div>

          {/* On-prem vs Cloud side by side */}
          <h4 className="text-sm font-bold text-foreground">On-Prem vs Cloud HSM</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Server size={16} className="text-primary" />
                <span className="text-sm font-bold text-foreground">On-Prem HSMs</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; Thales Luna 7 (Network HSM, FIPS 140-3 L3)</li>
                <li>&bull; Entrust nShield 5 (Network HSM, FIPS 140-3 L3)</li>
                <li>&bull; Utimaco SecurityServer (PCIe, FIPS 140-3 L3)</li>
              </ul>
              <p className="text-xs text-success mt-2 font-medium">
                Full PQC firmware support available today
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Cloud size={16} className="text-primary" />
                <span className="text-sm font-bold text-foreground">Cloud HSMs</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; AWS CloudHSM (ML-DSA preview via SDK)</li>
                <li>&bull; Azure Dedicated HSM (Thales backend, upgrade pending)</li>
                <li>&bull; Google Cloud HSM (PQC on roadmap)</li>
              </ul>
              <p className="text-xs text-warning mt-2 font-medium">
                Cloud HSMs currently lack firmware-level PQC support
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 2: PKCS#11 v3.2 PQC Mechanisms */}
      <CollapsibleSection
        title="PKCS#11 v3.2 PQC Mechanisms"
        icon={<Lock size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The <strong>PKCS#11 v3.2 draft</strong> (OASIS) introduces new mechanism types for
            post-quantum cryptography. These define how applications interact with PQC keys inside
            HSMs via the standard Cryptoki API.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <h4 className="text-sm font-bold text-foreground mb-2">New PQC Key Types</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-mono text-primary">CKK_ML_KEM</span>
                <p className="text-muted-foreground mt-1">
                  Key type for ML-KEM (FIPS 203) key encapsulation mechanism. Public keys are 1,184
                  bytes (ML-KEM-768), requiring applications to accommodate larger buffer sizes.
                </p>
              </div>
              <div>
                <span className="font-mono text-primary">CKK_ML_DSA</span>
                <p className="text-muted-foreground mt-1">
                  Key type for ML-DSA (FIPS 204) digital signatures. Signatures are 3,309 bytes
                  (ML-DSA-65) &mdash; existing buffers sized for 64-byte ECDSA will overflow.
                </p>
              </div>
            </div>
          </div>

          {/* Classical Mechanisms Table */}
          <h4 className="text-sm font-bold text-foreground">Classical Mechanisms (v2.40+)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Mechanism</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Code</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Description</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Key Size</th>
                </tr>
              </thead>
              <tbody>
                {classicalMechanisms.map((m) => (
                  <tr key={m.id} className="border-b border-border/50">
                    <td className="p-2 font-mono text-xs text-foreground">{m.name}</td>
                    <td className="p-2 font-mono text-xs text-muted-foreground">
                      {m.mechanismCode}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{m.description}</td>
                    <td className="p-2 text-xs text-muted-foreground">{m.keySize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PQC Mechanisms Table */}
          <h4 className="text-sm font-bold text-foreground">PQC Mechanisms (v3.2 Draft)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Mechanism</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Code</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Description</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Parameters</th>
                </tr>
              </thead>
              <tbody>
                {pqcMechanisms.map((m) => (
                  <tr key={m.id} className="border-b border-border/50 bg-primary/5">
                    <td className="p-2 font-mono text-xs text-primary font-bold">{m.name}</td>
                    <td className="p-2 font-mono text-xs text-muted-foreground">
                      {m.mechanismCode}
                    </td>
                    <td className="p-2 text-xs text-foreground">{m.description}</td>
                    <td className="p-2 text-xs text-muted-foreground">{m.keySize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Key Size Comparison */}
          <h4 className="text-sm font-bold text-foreground">Buffer Size Impact</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Algorithm</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">Public Key</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">Private Key</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">
                    Sig/Ciphertext
                  </th>
                  <th className="text-center p-2 text-muted-foreground font-medium">
                    Quantum Safe
                  </th>
                </tr>
              </thead>
              <tbody>
                {KEY_SIZE_COMPARISONS.map((k) => (
                  <tr
                    key={k.algorithm}
                    className={`border-b border-border/50 ${k.quantumSafe ? 'bg-primary/5' : ''}`}
                  >
                    <td className="p-2 font-mono text-xs text-foreground">{k.algorithm}</td>
                    <td className="p-2 text-right font-mono text-xs text-foreground">
                      {k.publicKeyBytes.toLocaleString()} B
                    </td>
                    <td className="p-2 text-right font-mono text-xs text-foreground">
                      {k.privateKeyBytes.toLocaleString()} B
                    </td>
                    <td className="p-2 text-right font-mono text-xs text-foreground">
                      {k.signatureOrCiphertextBytes.toLocaleString()} B
                    </td>
                    <td className="p-2 text-center">
                      {k.quantumSafe ? (
                        <span className="text-success font-bold text-xs">Yes</span>
                      ) : (
                        <span className="text-destructive font-bold text-xs">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 3: On-Prem HSM PQC Deep Dive */}
      <CollapsibleSection
        title="On-Prem HSM PQC Deep Dive"
        icon={<Cpu size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            On-premises HSMs from the three major vendors now offer production-ready PQC firmware.
            Each takes a different approach to integrating post-quantum algorithms.
          </p>

          <div className="grid grid-cols-1 gap-4">
            {/* Thales Luna */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-foreground">Thales Luna Network HSM 7</h4>
                <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-success/10 text-success border-success/20">
                  PRODUCTION
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Firmware:</span>{' '}
                  <span className="font-mono text-foreground">v7.9.2+</span>
                </div>
                <div>
                  <span className="text-muted-foreground">FIPS Status:</span>{' '}
                  <span className="text-success font-medium">FIPS 140-3 Level 3</span>
                </div>
                <div>
                  <span className="text-muted-foreground">PQC Algorithms:</span>{' '}
                  <span className="text-foreground">
                    ML-KEM-512/768/1024, ML-DSA-44/65/87, LMS/HSS
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">PKCS#11:</span>{' '}
                  <span className="text-foreground">v3.0 (PQC extensions)</span>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>
                  <strong>Upgrade Path:</strong> In-place firmware upgrade from v7.8.x. Existing
                  keys preserved. Luna Client must be upgraded to 10.9.2+.
                </p>
                <p>
                  <strong>Unique Features:</strong> PQC integrated into core firmware (no external
                  modules). CBOM (Cryptographic Bill of Materials) REST API. USB G7 extension
                  supports PQC.
                </p>
              </div>
            </div>

            {/* Entrust nShield */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-foreground">Entrust nShield 5</h4>
                <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-success/10 text-success border-success/20">
                  PRODUCTION
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Firmware:</span>{' '}
                  <span className="font-mono text-foreground">v13.8.0+</span>
                </div>
                <div>
                  <span className="text-muted-foreground">FIPS Status:</span>{' '}
                  <span className="text-warning font-medium">FIPS 140-3 Level 3 (submitted)</span>
                </div>
                <div>
                  <span className="text-muted-foreground">PQC Algorithms:</span>{' '}
                  <span className="text-foreground">
                    ML-KEM-768/1024, ML-DSA-44/65/87, SLH-DSA, LMS/HSS, XMSS
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">PKCS#11:</span>{' '}
                  <span className="text-foreground">v3.0 (PQC extensions)</span>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>
                  <strong>Upgrade Path:</strong> Firmware + PQSDK v1.2.1+ installation. 1&ndash;2
                  hours per HSM. FIPS 140-3 re-submission in progress.
                </p>
                <p>
                  <strong>Unique Features:</strong> Broadest algorithm support (includes SLH-DSA and
                  XMSS). Hardware-accelerated PQC. CodeSafe secure execution environment. Available
                  via PKCS#11, CNG, and JCE interfaces.
                </p>
              </div>
            </div>

            {/* Utimaco */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-foreground">
                  Utimaco SecurityServer Se Gen2 (Quantum Protect)
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-success/10 text-success border-success/20">
                  PRODUCTION
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Firmware:</span>{' '}
                  <span className="font-mono text-foreground">5.0+ (Q-safe extension)</span>
                </div>
                <div>
                  <span className="text-muted-foreground">FIPS Status:</span>{' '}
                  <span className="text-success font-medium">
                    FIPS 140-3 Level 3 (cert #3925)
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">PQC Algorithms:</span>{' '}
                  <span className="text-foreground">
                    ML-KEM-512/768/1024, ML-DSA-44/65/87, LMS, XMSS
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">PKCS#11:</span>{' '}
                  <span className="text-foreground">v3.0</span>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>
                  <strong>Upgrade Path:</strong> Q-safe is a firmware extension (not a full
                  replacement). 1&ndash;3 hours per HSM. Existing keys preserved.
                </p>
                <p>
                  <strong>Unique Features:</strong> FIPS 140-3 Level 3 (cert #3925). PQC simulator available
                  for API testing. SLH-DSA on roadmap. PCIe form factor for data center
                  deployment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 4: Cloud HSM PQC Deep Dive */}
      <CollapsibleSection
        title="Cloud HSM PQC Deep Dive"
        icon={<Cloud size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Cloud HSMs provide managed hardware security but currently lag behind on-prem vendors
            for PQC support. PQC in cloud HSMs is primarily delivered through SDK updates rather
            than firmware changes.
          </p>

          <div className="bg-warning/10 rounded-lg p-4 border border-warning/20 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">
                <strong>Key insight:</strong> On-prem HSMs (Thales, Entrust, Utimaco, Crypto4A) are
                in production with firmware-level PQC support. Cloud HSMs currently deliver PQC
                through SDK updates rather than firmware — AWS is preview-only and Azure/GCP are on
                roadmap. Azure Dedicated HSM is the same Thales Luna 7 hardware and gains full PQC
                once firmware is upgraded via Azure Support.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* AWS CloudHSM */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-foreground">AWS CloudHSM</h4>
                <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-primary/10 text-primary border-primary/20">
                  LIMITED
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">PQC Support:</span>{' '}
                  <span className="text-foreground">ML-DSA-65 (preview via AWS-LC SDK)</span>
                </div>
                <div>
                  <span className="text-muted-foreground">FIPS:</span>{' '}
                  <span className="text-foreground">FIPS 140-3 Level 3 (via AWS-LC)</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <p>
                  PQC delivered via AWS-LC SDK, not HSM firmware change. Zero downtime for SDK
                  update. AWS-LC is a FIPS 140-3 validated open-source library with ML-KEM and
                  ML-DSA support.
                </p>
                <p>
                  <strong>Limitation:</strong> Native PKCS#11 PQC mechanisms not yet in firmware.
                  ML-KEM encapsulation/decapsulation not supported.
                </p>
              </div>
            </div>

            {/* Azure Dedicated HSM */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-foreground">Azure Dedicated HSM</h4>
                <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-muted/50 text-muted-foreground border-border">
                  ROADMAP
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">PQC Support:</span>{' '}
                  <span className="text-foreground">
                    Planned (via Thales Luna firmware upgrade)
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">FIPS:</span>{' '}
                  <span className="text-foreground">FIPS 140-3 Level 3 (via Thales Luna 7 cert)</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <p>
                  Powered by Thales Luna 7 hardware. PQC available when customers request firmware
                  upgrade to v7.9+. Azure Managed HSM (Marvell LS2 backend) has a separate PQC
                  roadmap.
                </p>
                <p>
                  <strong>Limitation:</strong> Customer must request firmware upgrade through Azure
                  support. Azure does not auto-upgrade dedicated HSMs.
                </p>
              </div>
            </div>

            {/* Google Cloud HSM */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-foreground">Google Cloud HSM</h4>
                <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-muted/50 text-muted-foreground border-border">
                  ROADMAP
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">PQC Support:</span>{' '}
                  <span className="text-foreground">Planned (via Cloud KMS integration)</span>
                </div>
                <div>
                  <span className="text-muted-foreground">FIPS:</span>{' '}
                  <span className="text-foreground">FIPS 140-2 Level 3</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <p>
                  Hardware HSM backing for Cloud KMS keys. PQC algorithms currently available in
                  Cloud KMS software mode only. HSM-backed PQC keys expected as algorithms mature.
                </p>
                <p>
                  <strong>Context:</strong> Google already uses PQC internally for infrastructure
                  protection (ALTS). Titan chip provides physical security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 5: Side-Channel Attack Surfaces */}
      <CollapsibleSection
        title="Side-Channel Attack Surfaces"
        icon={<Eye size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            PQC algorithms introduce new side-channel attack surfaces. HSMs must implement specific
            countermeasures for lattice-based and hash-based operations that differ from classical
            protections.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {SIDE_CHANNEL_VECTORS.map((vector) => (
              <div key={vector.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Zap
                      size={16}
                      className={
                        vector.hsmRelevance === 'high'
                          ? 'text-destructive'
                          : vector.hsmRelevance === 'medium'
                            ? 'text-warning'
                            : 'text-muted-foreground'
                      }
                    />
                    <h4 className="text-sm font-bold text-foreground">{vector.name}</h4>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold shrink-0 ${
                      vector.hsmRelevance === 'high'
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : vector.hsmRelevance === 'medium'
                          ? 'bg-warning/10 text-warning border-warning/20'
                          : 'bg-muted/50 text-muted-foreground border-border'
                    }`}
                  >
                    {vector.hsmRelevance.toUpperCase()} RELEVANCE
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{vector.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {vector.affectedAlgorithms.map((alg) => (
                    <span
                      key={alg}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono"
                    >
                      {alg}
                    </span>
                  ))}
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground font-medium">Attack type: </span>
                  <span className="text-foreground">{vector.attackType}</span>
                </div>
                <div className="mt-2 bg-success/5 rounded p-2 border border-success/10">
                  <span className="text-xs text-success font-medium">Countermeasure: </span>
                  <span className="text-xs text-foreground/80">{vector.countermeasure}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ML-DSA Hedged Signing Callout */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start gap-2">
              <Shield size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  ML-DSA Hedged Signing (FIPS 204 &sect;5.2)
                </h4>
                <p className="text-xs text-muted-foreground">
                  ML-DSA supports a &quot;hedged&quot; signing mode where the{' '}
                  <span className="font-mono text-primary">rnd</span> parameter is set to a random
                  value rather than zero. This makes signing non-deterministic, which prevents fault
                  injection attacks from producing exploitable faulty signatures. All production
                  HSMs implement hedged signing by default. This is critical for HSM environments
                  where physical access may be possible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 6: HSM Firmware Migration */}
      <CollapsibleSection
        title="HSM Firmware Migration"
        icon={<RefreshCw size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Upgrading HSM firmware to support PQC algorithms requires careful planning. Each vendor
            has a different upgrade path, complexity, and recertification timeline.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Vendor</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">
                    Current &rarr; Target
                  </th>
                  <th className="text-left p-2 text-muted-foreground font-medium">
                    Algorithms Added
                  </th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Complexity</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">
                    Downtime (est.)
                  </th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Recert</th>
                </tr>
              </thead>
              <tbody>
                {FIRMWARE_UPGRADE_PATHS.map((path) => (
                  <tr key={path.vendorId} className="border-b border-border/50">
                    <td className="p-2 text-xs font-bold text-foreground">{path.vendorName}</td>
                    <td className="p-2 text-xs font-mono text-muted-foreground">
                      {path.currentFirmware} &rarr; {path.targetFirmware}
                    </td>
                    <td className="p-2 text-xs text-foreground">
                      {path.pqcAlgorithmsAdded.slice(0, 2).join(', ')}
                      {path.pqcAlgorithmsAdded.length > 2 &&
                        ` +${path.pqcAlgorithmsAdded.length - 2} more`}
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                          path.upgradeComplexity === 'low'
                            ? 'bg-success/10 text-success border-success/20'
                            : path.upgradeComplexity === 'medium'
                              ? 'bg-warning/10 text-warning border-warning/20'
                              : 'bg-destructive/10 text-destructive border-destructive/20'
                        }`}
                      >
                        {path.upgradeComplexity.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{path.estimatedDowntime}</td>
                    <td className="p-2 text-center">
                      {path.recertificationRequired ? (
                        <span className="text-warning text-xs font-bold">Yes</span>
                      ) : (
                        <span className="text-success text-xs font-bold">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border border-border text-xs text-muted-foreground">
            <strong>Note:</strong> Recertification timelines for FIPS 140-3 typically range from
            12&ndash;24 months. During this period, the HSM firmware operates with PQC algorithms
            but the formal CMVP certificate has not yet been re-issued.
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 7: Stateful Signature State in HSMs */}
      <CollapsibleSection
        title="Stateful Signature State in HSMs"
        icon={<HardDrive size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <InlineTooltip term="LMS">LMS/HSS</InlineTooltip> and{' '}
            <InlineTooltip term="XMSS">XMSS</InlineTooltip> are <strong>stateful</strong> hash-based
            signature schemes &mdash; each leaf in the Merkle tree can only be used to sign{' '}
            <strong>once</strong>. Reusing a leaf completely compromises the signing key.
          </p>

          <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Critical: State Persistence Requirement
                </h4>
                <p className="text-xs text-muted-foreground">
                  After every signing operation, the HSM must atomically write the updated state
                  counter to NVRAM. A power failure during this write can result in state loss,
                  causing the same leaf to be used twice. This is why{' '}
                  <strong>HSMs are the only safe platform for stateful signatures</strong> &mdash;
                  they provide atomic NVRAM writes, write-ahead logging, and pre-reservation of
                  signature indices.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-2">
                <Layers size={14} className="inline-block mr-1" />
                NVRAM State Management
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; Atomic state counter update after each signature</li>
                <li>&bull; Write-ahead logging prevents partial state corruption</li>
                <li>&bull; Pre-reservation of signature indices (batch allocation)</li>
                <li>&bull; Hardware watchdog timer detects stalled writes</li>
                <li>&bull; Backup state to secondary NVRAM partition</li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-2">
                <Shield size={14} className="inline-block mr-1" />
                CNSA 2.0 Requirements
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; LMS/HSS or XMSS required for firmware signing</li>
                <li>&bull; National Security Systems must comply by 2030</li>
                <li>&bull; Full quantum-resistant enforcement by 2033&ndash;35</li>
                <li>&bull; Tree height H=20 provides ~1M signatures per key</li>
                <li>&bull; HSS (multi-tree) extends to practically unlimited signatures</li>
              </ul>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border border-border text-xs text-muted-foreground">
            <strong>Power failure recovery:</strong> If an HSM detects incomplete state during boot,
            it must refuse to sign with the affected key until the state is manually verified.
            Thales Luna, Entrust nShield, and Utimaco all implement this safety mechanism in their
            LMS/HSS firmware.
          </div>
        </div>
      </CollapsibleSection>

      {/* Try Workshop CTA */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-foreground">Ready to explore HSM operations?</h3>
            <p className="text-sm text-muted-foreground">
              Step through PKCS#11 PQC operations, compare vendors, and plan firmware migrations in
              the interactive workshop.
            </p>
          </div>
          <Button variant="gradient" onClick={onNavigateToWorkshop} className="shrink-0">
            Open Workshop <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Lock size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">KMS &amp; PQC</div>
              <div className="text-xs text-muted-foreground">Key management services that integrate with HSM backends</div>
            </div>
          </Link>
          <Link
            to="/learn/stateful-signatures"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <GitBranch size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Stateful Hash Signatures</div>
              <div className="text-xs text-muted-foreground">LMS and XMSS signing stored in HSM key stores</div>
            </div>
          </Link>
          <Link
            to="/learn/pki-workshop"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">PKI Workshop</div>
              <div className="text-xs text-muted-foreground">HSM-backed CA operations and PQC certificate issuance</div>
            </div>
          </Link>
          <Link
            to="/learn/qkd"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Zap size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Quantum Key Distribution</div>
              <div className="text-xs text-muted-foreground">QKD integration with HSM-based key injection pipelines</div>
            </div>
          </Link>
        </div>
      </section>
      <VendorCoverageNotice migrateLayer="Hardware" />
      <ReadingCompleteButton />
    </div>
  )
}
