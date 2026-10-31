// SPDX-License-Identifier: AGPL-3.0-only
import { HsmCapabilityEvidence } from '@/components/PKILearning/common/HsmCapabilityEvidence'
import React, { useState } from 'react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { Link } from 'react-router'
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
import { HSM_VENDORS, STATUS_LABELS, getVendorPqcSupportStatus } from '../data/hsmVendorData'
import { Button } from '@/components/ui/button'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { RecordDecisionLink } from '@/components/PKILearning/RecordDecisionLink'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'

interface HsmPqcIntroductionProps {
  onNavigateToWorkshop: () => void
}

/** Availability badge for a vendor card: read from the central catalog, never typed in. */
const VendorStatusBadge: React.FC<{ vendorId: string }> = ({ vendorId }) => {
  const vendor = HSM_VENDORS.find((v) => v.id === vendorId)
  if (!vendor) return null
  const status = STATUS_LABELS[getVendorPqcSupportStatus(vendor)]
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${status.className}`}>
      {status.label}
    </span>
  )
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
      <Button
        variant="ghost"
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
      </Button>
      {isOpen && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </section>
  )
}

/** A verbatim quotation with its source, used by the AWS CloudHSM box and the "What the lab tests" panel. */
const LabQuote: React.FC<{ source: string; children: React.ReactNode }> = ({
  source,
  children,
}) => (
  <blockquote className="border-l-2 border-primary/30 pl-3 text-xs text-foreground/80">
    &ldquo;{children}&rdquo;{' '}
    <cite className="text-[10px] not-italic text-muted-foreground">({source})</cite>
  </blockquote>
)

export const HsmPqcIntroduction: React.FC<HsmPqcIntroductionProps> = ({ onNavigateToWorkshop }) => {
  // The data-section-id anchors below were already here and already
  // matched this module's manifest; nothing read them. One call makes
  // deep links land and section progress record.
  useSectionAnchors()

  const classicalMechanisms = PKCS11_MECHANISMS.filter((m) => m.type === 'classical')
  const pqcMechanisms = PKCS11_MECHANISMS.filter((m) => m.type === 'pqc')

  return (
    <div className="space-y-8 w-full">
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
            defines four increasing, qualitative security levels. A module&apos;s certificate states
            one overall level; its Security Policy lists the level reached in each requirement area.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                level: 'Level 1',
                desc: 'Lowest level: basic requirements, production-grade components, no specific physical-security mechanisms required. Not software-only: a Level 1 module can be hardware, software, firmware or hybrid, though many software libraries are validated here.',
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
            <h3 className="text-sm font-bold text-foreground mb-3">HSM Integration Architecture</h3>
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
          <h3 className="text-sm font-bold text-foreground">On-Prem vs Cloud HSM</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Server size={16} className="text-primary" />
                <span className="text-sm font-bold text-foreground">On-Prem HSMs</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; Thales Luna 7 (Network HSM, FIPS 140-3 L3)</li>
                <li>
                  &bull; Entrust nShield 5 (FIPS 140-3 L3 certificates #5329 and #4745 cover the
                  nShield 5s module)
                </li>
                <li>
                  &bull; Utimaco SecurityServer (PCIe, FIPS 140-2 L3, certificate now Historical)
                </li>
              </ul>
              <p className="text-xs text-success mt-2 font-medium">
                PQC firmware is shipping. Algorithm sets, APIs and validated configurations differ
                by vendor &mdash; see the vendor deep dive below.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Cloud size={16} className="text-primary" />
                <span className="text-sm font-bold text-foreground">Cloud HSMs</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  &bull; AWS CloudHSM (ML-DSA keys in the HSM; whether ML-DSA counts as
                  FIPS-approved is unreconciled, see the Cloud HSM deep dive)
                </li>
                <li>
                  &bull; Azure Dedicated HSM (Thales Luna 7; PQC needs a customer-administered
                  firmware upgrade; retiring)
                </li>
                <li>&bull; Google Cloud HSM (Cloud KMS lists no PQC algorithm for HSM keys)</li>
              </ul>
              <p className="text-xs text-warning mt-2 font-medium">
                Cloud PQC support is uneven: check each service&apos;s own documentation (checked 15
                Oct 2026)
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 2: PKCS#11 v3.2 PQC Mechanisms */}
      <div data-section-id="pkcs11" className="scroll-mt-20">
        <CollapsibleSection
          title="PKCS#11 v3.2 PQC Mechanisms"
          icon={<Lock size={24} className="text-primary" />}
        >
          <div className="space-y-4 text-sm text-foreground/80">
            <p>
              <strong>PKCS#11 v3.2</strong> (OASIS Standard, 3 June 2026) introduces new mechanism
              types for post-quantum cryptography. These define how applications interact with PQC
              keys inside HSMs via the standard Cryptoki API.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
              <h3 className="text-sm font-bold text-foreground mb-2">New PQC Key Types</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-mono text-primary">CKK_ML_KEM</span>
                  <p className="text-muted-foreground mt-1">
                    Key type for ML-KEM (FIPS 203) key encapsulation mechanism. Public keys are
                    1,184 bytes (ML-KEM-768), requiring applications to accommodate larger buffer
                    sizes.
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
            <h3 className="text-sm font-bold text-foreground">Classical Mechanisms (v2.40+)</h3>
            <ResponsiveTable
              caption="Classical PKCS#11 mechanisms from v2.40"
              testId="hsm-classical-mechanisms"
              head={['Mechanism', 'Code', 'Description', 'Key Size']}
              rows={classicalMechanisms.map((m) => [
                <span key="n" className="font-mono">
                  {m.name}
                </span>,
                <span key="c" className="font-mono text-muted-foreground">
                  {m.mechanismCode}
                </span>,
                <span key="d" className="text-muted-foreground">
                  {m.description}
                </span>,
                <span key="k" className="text-muted-foreground">
                  {m.keySize}
                </span>,
              ])}
            />

            {/* PQC Mechanisms Table */}
            <h3 className="text-sm font-bold text-foreground">PQC Mechanisms (v3.2)</h3>
            <ResponsiveTable
              caption="Post-quantum PKCS#11 mechanisms in v3.2"
              testId="hsm-pqc-mechanisms"
              head={['Mechanism', 'Code', 'Description', 'Parameters']}
              rows={pqcMechanisms.map((m) => [
                <span key="n" className="font-mono text-primary">
                  {m.name}
                </span>,
                <span key="c" className="font-mono text-muted-foreground">
                  {m.mechanismCode}
                </span>,
                <span key="d" className="text-foreground">
                  {m.description}
                </span>,
                <span key="k" className="text-muted-foreground">
                  {m.keySize}
                </span>,
              ])}
            />

            {/* Key Size Comparison */}
            <h3 className="text-sm font-bold text-foreground">Buffer Size Impact</h3>
            <ResponsiveTable
              caption="Key, signature and ciphertext sizes by algorithm"
              testId="hsm-buffer-sizes"
              head={['Algorithm', 'Public Key', 'Private Key', 'Sig/Ciphertext', 'Quantum Safe']}
              rows={KEY_SIZE_COMPARISONS.map((k) => [
                <span key="a" className="font-mono">
                  {k.algorithm}
                </span>,
                <span key="p" className="font-mono text-foreground">
                  {k.publicKeyBytes.toLocaleString()} B
                </span>,
                <span key="s" className="font-mono text-foreground">
                  {k.privateKeyBytes.toLocaleString()} B
                </span>,
                <span key="c" className="font-mono text-foreground">
                  {k.signatureOrCiphertextBytes.toLocaleString()} B
                </span>,
                k.quantumSafe ? (
                  <span key="q" className="text-success font-bold">
                    Yes
                  </span>
                ) : (
                  <span key="q" className="text-destructive font-bold">
                    No
                  </span>
                ),
              ])}
            />
          </div>
        </CollapsibleSection>
      </div>

      {/* Section 3: On-Prem HSM PQC Deep Dive */}
      <div data-section-id="vendors" className="scroll-mt-20">
        <CollapsibleSection
          title="On-Prem HSM PQC Deep Dive"
          icon={<Cpu size={24} className="text-primary" />}
        >
          <div className="space-y-4 text-sm text-foreground/80">
            <p>
              Algorithm availability, API support and certificate scope are separate questions. The
              records below show the source and checked date for each product; the documentation
              examples that follow describe the versions named in those examples.
            </p>

            {['Thales Luna HSM', 'Entrust nShield', 'Utimaco uTrust HSM'].map((name) => (
              <div key={name} className="rounded border border-border p-3">
                <h3 className="font-bold">{name}</h3>
                <HsmCapabilityEvidence softwareName={name} />
              </div>
            ))}
            <h3 className="font-bold">Version-specific documentation examples</h3>
            <p>
              These examples do not establish the current certification scope of another version.
            </p>
            <div className="grid grid-cols-1 gap-4">
              {/* Thales Luna */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">Thales Luna Network HSM 7</h3>
                  <VendorStatusBadge vendorId="thales-luna" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Firmware:</span>{' '}
                    <span className="font-mono text-foreground">7.9.0 or newer</span>
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
                  <h3 className="text-sm font-bold text-foreground">Entrust nShield 5</h3>
                  <VendorStatusBadge vendorId="entrust-nshield" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Firmware:</span>{' '}
                    <span className="font-mono text-foreground">v13.8+ (ML-KEM: v13.8.3+)</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">FIPS Status:</span>{' '}
                    <span className="text-warning font-medium">
                      FIPS 140-3 Level 3 (nShield 5s certs #5329 and #4745: no PQC algorithm in
                      their approved lists)
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PQC Algorithms:</span>{' '}
                    <span className="text-foreground">
                      ML-KEM-512/768/1024, ML-DSA-44/65/87, SLH-DSA (12 parameter sets); LMS (CAVP
                      A7990, PQSDK)
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PKCS#11 PQC:</span>{' '}
                    <span className="text-foreground">
                      ML-DSA from Security World v13.9.0, ML-KEM from v13.9.3, SLH-DSA from v13.9.5
                      (release notes)
                    </span>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>
                    <strong>Upgrade Path:</strong> Through PKCS#11 the PostQuantum feature must be
                    enabled and the firmware must be v13.8 or later (v13.8.3 or later for ML-KEM).
                    The 1&ndash;2 hours per HSM figure is this module&apos;s own planning estimate;
                    the Entrust release notes and product pages we hold give no duration. An nShield
                    5s module is on the CMVP Modules in Process list &mdash; a queue position, not
                    evidence of the outcome.
                  </p>
                  <p>
                    <strong>Interfaces:</strong> The PKCS#11 interface gained the PQC algorithms one
                    release at a time. In Security World v13.9.0 (release notes, sections 3.4 and
                    3.5) ML-KEM and SLH-DSA were &ldquo;currently only available via nCore&rdquo;,
                    while ML-DSA was already in PKCS#11 (section 3.9); v13.9.3 added ML-KEM and
                    v13.9.5 added SLH-DSA to PKCS#11. Check the release notes for the version you
                    run. The Entrust pages we read do not describe HSS or XMSS.
                  </p>
                  <p>
                    <strong>Other features:</strong> The HY acceleration profile (mid- and
                    high-speed nShield 5 models) accelerates ML-DSA (v13.9.3) and ML-KEM (v13.9.6).
                    CodeSafe secure execution environment.
                  </p>
                </div>
              </div>

              {/* Utimaco */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">
                    Utimaco SecurityServer Se Gen2 (Quantum Protect)
                  </h3>
                  <VendorStatusBadge vendorId="utimaco" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Firmware:</span>{' '}
                    <span className="font-mono text-foreground">Q-safe extension</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">FIPS Status:</span>{' '}
                    <span className="text-status-warning font-medium">
                      FIPS 140-2 Level 3 (cert #3925, Historical)
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
                    <strong>Unique Features:</strong> Cert #3925 is a FIPS 140-2 certificate, moved
                    to the CMVP Historical list at sunset (checked 24 Sep 2026). PQC simulator
                    available for API testing. SLH-DSA on roadmap. PCIe form factor for data center
                    deployment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Section 4: Cloud HSM PQC Deep Dive */}
      <CollapsibleSection
        title="Cloud HSM PQC Deep Dive"
        icon={<Cloud size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          {['AWS CloudHSM', 'Google Cloud HSM', 'Azure Dedicated HSM (Thales Luna 7)'].map(
            (name) => (
              <div key={name} className="rounded border border-border p-3">
                <h3 className="font-bold">{name}</h3>
                <HsmCapabilityEvidence softwareName={name} />
              </div>
            )
          )}
          <h3 className="font-bold">Version-specific documentation examples</h3>
          <p>
            Read the source dates and product identities separately. A provider's service statement
            and a module certificate can describe different scopes.
          </p>
          <p>
            Cloud HSMs provide managed hardware security, and each service exposes a different PQC
            algorithm list, API and protection level. Read the provider&apos;s own documentation for
            what the service offers, and the module&apos;s CMVP certificate and Security Policy for
            what is covered by a FIPS 140 validation.
          </p>

          <div className="bg-warning/10 rounded-lg p-4 border border-warning/20 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">
                <strong>Key insight:</strong> On-prem HSMs (Thales, Entrust, Utimaco, Crypto4A) ship
                PQC firmware, with different algorithm sets (Thales&apos;s Luna Post Quantum
                Algorithms page lists ML-KEM, ML-DSA and LMS-HSS, and that page and its v7.9 release
                post do not list SLH-DSA; Utimaco&apos;s Quantum Protect page shows SLH-DSA as in
                progress) and different FIPS 140 coverage: some module certificates list PQC
                algorithms (Crypto4A #5497, Thales Luna T7 #5450), others do not (Entrust nShield 5s
                #5329 and #4745, Thales Luna K7 #4684). Cloud HSMs are uneven: AWS CloudHSM
                generates and uses ML-DSA keys inside the HSM through vendor-defined PKCS#11
                mechanisms. AWS documents ML-DSA as available in FIPS mode on hsm2m.medium clusters
                from 1 September 2026, while the NIST Security Policy for the same module (CMVP
                #4703) lists ML-DSA and ML-KEM as non-approved services and the certificate lists no
                PQC algorithm among its approved ones; we have not found a document that reconciles
                the two (see the AWS CloudHSM card). Azure Dedicated HSM is a Thales Luna 7
                appliance: Azure lists no PQC algorithm, and ML-KEM and ML-DSA come with Luna
                firmware 7.9 if the customer upgrades, after consulting Thales Support (the service
                is retiring &mdash; no new customer onboardings); Google Cloud KMS lists its PQC
                algorithms at the software protection level only, with none for HSM keys (AWS and
                Google statements checked 23 Oct 2026; the Azure statements checked 29 Oct 2026).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* AWS CloudHSM */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">AWS CloudHSM</h3>
                <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-primary/10 text-primary border-primary/20">
                  LIMITED
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">PQC Support:</span>{' '}
                  <span className="text-foreground">
                    ML-DSA-44/65/87 (no ML-KEM mechanism documented)
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">FIPS:</span>{' '}
                  <span className="text-foreground">
                    hsm2m.medium: FIPS 140-3 Level 3, CMVP #4703 (Marvell LS2 HSM Family); the
                    certificate lists no PQC algorithm among its approved ones
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-2">
                <p>
                  ML-DSA-44/65/87 keys are generated and used inside the HSM through vendor-defined
                  PKCS#11 mechanisms (CKM_CLOUDHSM_ML_DSA_KEY_PAIR_GEN, CKM_CLOUDHSM_ML_DSA and
                  CKM_CLOUDHSM_EXT_MU_ML_DSA), not the standard v3.2 CKM_ML_DSA; AWS&apos;s PKCS#11
                  library is documented as compliant with PKCS#11 version 2.40. AWS-LC has its own
                  CMVP certificates as a Level 1 software module (AWS-LC 3, #5298/#5314, approve
                  ML-KEM but not ML-DSA); they do not change the HSM&apos;s Level 3 certificate.
                  Checked 23 Oct 2026.
                </p>
                <div className="bg-warning/10 rounded-lg p-3 border border-warning/20 space-y-2">
                  <h4 className="text-xs font-bold text-foreground">
                    ML-DSA and FIPS: two statements we could not reconcile
                  </h4>
                  <p>
                    &ldquo;Available in FIPS mode&rdquo; and &ldquo;listed on the certificate&rdquo;
                    are different claims. FIPS mode is an AWS cluster setting; the certificate and
                    its Security Policy are NIST CMVP documents, which speak of an &ldquo;approved
                    mode of operation&rdquo;. The AWS pages we read do not say the two are the same.
                    We show both statements and prefer neither.
                  </p>
                  <p className="font-medium text-foreground">AWS documentation says:</p>
                  <LabQuote source="AWS CloudHSM User Guide, CloudHSM CLI, key generate-asymmetric-pair ml-dsa; read 23 Oct 2026">
                    Starting September 1, 2026, ML-DSA is available in FIPS mode for hsm2m.medium
                    clusters.
                  </LabQuote>
                  <LabQuote source="AWS CloudHSM User Guide, cluster modes; read 23 Oct 2026">
                    In FIPS mode, only Federal Information Processing Standard (FIPS) validated keys
                    and algorithms can be used.
                  </LabQuote>
                  <p className="font-medium text-foreground">
                    The NIST Security Policy for the same module says (CMVP #4703, Marvell LS2 HSM
                    Family, policy dated January 29, 2026; NIST&apos;s certificate page shows its
                    latest update on 26 February 2026):
                  </p>
                  <p>
                    Table 6, &ldquo;Non-Approved Algorithms Not Allowed in the Approved Mode of
                    Operation&rdquo; (p. 23), lists &ldquo;ML-DSA (non-compliant)&rdquo; with the
                    use &ldquo;Key generation, sign, verify&rdquo; and &ldquo;ML-KEM
                    (non-compliant)&rdquo; with the use &ldquo;Key generation, Asymmetric key
                    encapsulation and un-encapsulation&rdquo;. Table 11, &ldquo;Non-Approved
                    Services&rdquo; (from p. 61), lists the services CN_PQC_GENERATE_KEY_PAIR,
                    CN_PQC_CRYPTO_SIG_GEN and CN_PQC_CRYPTO_SIG_VERIFY, among others (p. 66), and
                    the note under the table reads:
                  </p>
                  <LabQuote source="Security Policy for CMVP #4703, p. 66">
                    The indicator is success for all non-approved services only when the partition
                    is operated in the non-approved mode. The non-approved services will fail FIPS
                    POLICY MISMATCH when partition is operated in the approved mode.
                  </LabQuote>
                  <p>
                    <strong>What to do with it:</strong> for a procurement or an audit, ask AWS in
                    writing which statement applies to your cluster, and which CMVP certificate or
                    update covers ML-DSA. Until then treat ML-DSA on CloudHSM as available but not
                    shown to be on the certificate.
                  </p>
                </div>
                <p>
                  <strong>Limitation:</strong> no standard PKCS#11 v3.2 PQC mechanisms (CKM_ML_DSA)
                  and no ML-KEM mechanism in the AWS CloudHSM pages we read (the PKCS#11 mechanisms
                  list; the CloudHSM CLI key generate-asymmetric-pair category lists only ec, ml-dsa
                  and rsa).
                </p>
              </div>
            </div>

            {/* Azure Dedicated HSM */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Azure Dedicated HSM</h3>
                <VendorStatusBadge vendorId="azure-dhsm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">PQC Support:</span>{' '}
                  <span className="text-foreground">
                    None listed by Azure. If the customer upgrades, Luna firmware 7.9.0 or newer
                    adds ML-KEM and ML-DSA, and 7.8.9 or newer adds LMS-HSS.
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">FIPS:</span>{' '}
                  <span className="text-foreground">
                    FIPS 140-2 Level 3 (Azure documents client software 7.2 and validated firmware
                    7.0.3)
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <p>
                  Powered by the Thales Luna 7 HSM (model A790). Azure&apos;s pages list no PQC
                  algorithm. Thales documents ML-KEM and ML-DSA from Luna firmware 7.9.0 and LMS-HSS
                  from 7.8.9. Customers administer the firmware themselves, after consulting Thales
                  Support, and Azure does not say whether the service offers firmware 7.9. Azure
                  Managed HSM uses Marvell LiquidSecurity HSM adapters.
                </p>
                <p>
                  <strong>⚠ Retiring:</strong> No new customer onboardings; existing customers
                  supported until 31 July 2028.
                </p>
              </div>
            </div>

            {/* Google Cloud HSM */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Google Cloud HSM</h3>
                <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-muted/50 text-muted-foreground border-border">
                  NOT IN HSM
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">PQC Support:</span>{' '}
                  <span className="text-foreground">
                    None for HSM keys; Cloud KMS lists its PQC algorithms at the software protection
                    level only
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">FIPS:</span>{' '}
                  <span className="text-foreground">FIPS 140-2 Level 3</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <p>
                  Hardware HSM backing for Cloud KMS keys. Google&apos;s Cloud KMS algorithms page
                  lists its PQC signing algorithms (ML-DSA-44/65/87, including external-mu, and
                  SLH-DSA-SHA2-128S) and its key encapsulation algorithms (ML-KEM-768, ML-KEM-1024
                  and X-Wing) for the software protection level; its tables for the HSM and
                  single-tenant HSM protection levels list none (page read 23 Oct 2026).
                </p>
                <p>
                  <strong>Hardware:</strong> Google&apos;s Cloud HSM architecture page says Cloud
                  HSM uses Marvell LiquidSecurity HSMs (certificate #4399) in FIPS 140-2 Level 3
                  certified hardware security modules.
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
            PQC algorithms introduce new side-channel attack surfaces. An attacker with physical
            access to a module, or one who can observe its timing, power draw, electromagnetic
            emissions or the effect of injected faults, may learn about secret values from how a
            computation runs rather than from its output. HSM designs use countermeasures for
            lattice-based and hash-based operations that differ from classical protections.
          </p>

          <div className="bg-muted/50 rounded-lg p-3 border border-border text-xs text-muted-foreground space-y-2">
            <p>
              <strong>
                Check the module&apos;s Security Policy, not the technique&apos;s name.
              </strong>{' '}
              The cards below describe attack classes and the countermeasure techniques discussed
              for them. Whether a given HSM implements a technique is stated, if at all, in the
              vendor&apos;s documentation and in the module&apos;s Security Policy; the existence of
              a technique does not show that a product uses it. On the validation side, CMVP has no
              approved non-invasive test metrics today:
            </p>
            <LabQuote source="NIST SP 800-140F, section 6.2, p. 2, March 2020">
              No additional requirements at this time
            </LabQuote>
            <p>
              If a vendor has publicly documented that a module mitigates a specific attack, FIPS
              140-3 IG 12.A makes the lab address that claim:
            </p>
            <LabQuote source="FIPS 140-3 IG 12.A, Resolution, p. 132">
              If a cryptographic module has been purposely designed, built and publicly documented
              to mitigate one or more specific attacks, this section is applicable and AS12.01
              through AS12.04 (as applicable) shall be addressed regardless if the vendor of the
              module wishes to address the claim or not.
            </LabQuote>
          </div>

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
                    <h3 className="text-sm font-bold text-foreground">{vector.name}</h3>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold shrink-0 ${
                      vector.hsmRelevance === 'high'
                        ? 'bg-destructive/10 text-status-error border-destructive/20'
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
                <h3 className="text-sm font-bold text-foreground mb-1">
                  ML-DSA Hedged Signing (FIPS 204 &sect;3.4)
                </h3>
                <p className="text-xs text-muted-foreground">
                  ML-DSA supports a &quot;hedged&quot; signing mode where the{' '}
                  <span className="font-mono text-primary">rnd</span> parameter is set to a random
                  value rather than zero. FIPS 204 &sect;3.4 makes hedged signing the default
                  variant and says &ldquo;The use of fresh randomness during signing helps mitigate
                  side-channel attacks&rdquo;. It also permits a deterministic variant, and says
                  that this variant &ldquo;should not be used on platforms where side-channel
                  attacks are a concern and where they cannot be otherwise mitigated&rdquo;. PKCS#11
                  v3.2 lets the caller choose the variant (CKH_HEDGE_PREFERRED, CKH_HEDGE_REQUIRED
                  or CKH_DETERMINISTIC_REQUIRED), so which variant a given HSM uses unless told
                  otherwise is a property of that product. Look for it in the module&apos;s
                  documentation and Security Policy rather than assuming it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 6: HSM Firmware Migration */}
      <div data-section-id="migration" className="scroll-mt-20">
        <CollapsibleSection
          title="HSM Firmware Migration"
          icon={<RefreshCw size={24} className="text-primary" />}
        >
          <div className="space-y-4 text-sm text-foreground/80">
            <p>
              Upgrading HSM firmware to support PQC algorithms requires careful planning. Each
              vendor has a different upgrade path, complexity, and recertification timeline.
            </p>

            <ResponsiveTable
              caption="HSM firmware migration paths by vendor"
              testId="hsm-firmware-migration"
              head={[
                'Vendor',
                <>Current &rarr; Target</>,
                'Algorithms Added',
                'Complexity',
                'Downtime (est.)',
                'FIPS Recert',
              ]}
              rows={FIRMWARE_UPGRADE_PATHS.map((path) => [
                path.vendorName,
                <span key="t" className="font-mono text-muted-foreground">
                  {path.currentFirmware} &rarr; {path.targetFirmware}
                </span>,
                <span key="a" className="text-foreground">
                  {path.pqcAlgorithmsAdded.slice(0, 2).join(', ')}
                  {path.pqcAlgorithmsAdded.length > 2 &&
                    ` +${path.pqcAlgorithmsAdded.length - 2} more`}
                </span>,
                <span
                  key="c"
                  className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                    path.upgradeComplexity === 'low'
                      ? 'bg-success/10 text-success border-success/20'
                      : path.upgradeComplexity === 'medium'
                        ? 'bg-warning/10 text-warning border-warning/20'
                        : 'bg-destructive/10 text-status-error border-destructive/20'
                  }`}
                >
                  {path.upgradeComplexity.toUpperCase()}
                </span>,
                <span key="d" className="text-muted-foreground">
                  {path.estimatedDowntime}
                </span>,
                <span key="r" className="text-warning font-bold">
                  Required
                </span>,
              ])}
            />

            <div className="bg-muted/50 rounded-lg p-3 border border-border text-xs text-muted-foreground">
              <strong>Note:</strong> Recertification time varies by module and queue; the CMVP
              Modules in Process list shows where each submission is. Until a certificate listing
              the PQC algorithms is issued, the firmware may run PQC algorithms, but the module
              certificate does not cover them.
            </div>

            {/* What the lab tests: validation of a PQC-capable HSM. Every quotation is verbatim from the named document. */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
              <h3 className="text-sm font-bold text-foreground">What the lab tests</h3>
              <p className="text-xs text-muted-foreground">
                A PQC-capable HSM is checked in four separate places, and the single word
                &ldquo;Required&rdquo; in the FIPS Recert column above covers all of them.{' '}
                <strong>CAVP</strong> is NIST&apos;s algorithm validation program (its tests are
                specified in ACVP documents). <strong>CMVP</strong> is NIST&apos;s cryptographic
                module validation program; a module&apos;s certificate lists its approved
                algorithms, and the Security Policy published with it lists its services. A{' '}
                <strong>CAST</strong> is a cryptographic algorithm self-test that a validated module
                runs on its own algorithms, and a <strong>PCT</strong> is a pairwise consistency
                test on a generated key pair. A <strong>CSTL</strong> is an accredited testing
                laboratory. In the quotations, IUT means implementation under test, OTS means
                one-time signature, and FS means full submission. Every quotation below is verbatim
                from the document named after it, with footnote and reference-number markers left
                out.
              </p>

              <div className="bg-background rounded-lg p-3 border border-border space-y-2">
                <h4 className="text-xs font-bold text-foreground">
                  1. Algorithm certificates (CAVP, run through ACVP)
                </h4>
                <p className="text-xs text-muted-foreground">
                  NIST&apos;s ACVP specification drafts (all dated 2 October 2026) cover ML-KEM
                  (keyGen and encapDecap), ML-DSA (keyGen, sigGen, sigVer), SLH-DSA (keyGen, sigGen,
                  sigVer) and LMS (keyGen, sigGen, sigVer). The CAVP overview page says what such a
                  certificate is for, and how it is tested:
                </p>
                <LabQuote source="CAVP overview page, read 23 Oct 2026">
                  Cryptographic algorithm validation is a prerequisite of cryptographic module
                  validation.
                </LabQuote>
                <LabQuote source="CAVP overview page, read 23 Oct 2026">
                  Due to this structure, ACVTS testing is entirely black-box. The implementation is
                  never provided to NIST or the CAVP in order to receive a validation certificate.
                </LabQuote>
                <p className="text-xs text-muted-foreground">
                  For ML-KEM the ACVP draft includes checks that an HSM rejects bad keys:
                </p>
                <LabQuote source="ACVP draft-celi-acvp-ml-kem-01, section 6.1">
                  For the encapsulation key check, the server will generate a potentially valid or
                  invalid encapsulation key ek. The IUT SHALL determine if the provided ek is valid
                  based on [FIPS203] Section 7.2.
                </LabQuote>
                <p className="text-xs text-muted-foreground">
                  What the algorithm tests leave out, in the specifications&apos; own words:
                </p>
                <LabQuote source="ACVP draft-celi-acvp-ml-dsa-01, section 6.2.2">
                  An ACVP server will not test the zeroization of intermediate values, security
                  strength of the deterministic random bit generators (DRBGs), or incorrect length
                  signatures or public keys.
                </LabQuote>
                <LabQuote source="ACVP draft-celi-acvp-lms-01, section 6.2.2">
                  ACVP does not test the inability of an implementation to export a private key.
                  ACVP does not provide any guarantees on the inability to reuse private OTS pairs
                  of an implementation.
                </LabQuote>
                <p className="text-xs text-muted-foreground">
                  Of the SP 800-208 schemes only LMS has an ACVP specification; none is published
                  for XMSS, XMSS^MT or HSS (NIST&apos;s ACVP specification list, October 2026). The
                  FIPS 140-3 Implementation Guidance (IG) C.N, last modified September 2024, says
                  the same:
                </p>
                <LabQuote source="IG C.N, Background, p. 169">
                  CAVP tests are undergoing development with testing available for LMS but not yet
                  for XMSS, HSS, or XMSSMT.
                </LabQuote>
              </div>

              <div className="bg-background rounded-lg p-3 border border-border space-y-2">
                <h4 className="text-xs font-bold text-foreground">
                  2. The module certificate (CMVP) and its Security Policy
                </h4>
                <p className="text-xs text-muted-foreground">
                  An algorithm certificate does not make a product validated. The CAVP overview page
                  states the relationship:
                </p>
                <LabQuote source="CAVP overview page, read 23 Oct 2026">
                  For an algorithm implementation to be listed on a cryptographic module validation
                  certificate as an Approved security function, the algorithm implementation must
                  meet all the requirements of FIPS 140 and must successfully complete the
                  cryptographic algorithm validation process. However, a product or implementation
                  does not meet the FIPS 140 module validation requirements by simply implementing
                  an Approved security function and acquiring validations for each of the
                  implemented algorithms.
                </LabQuote>
                <p className="text-xs text-muted-foreground">
                  A Security Policy keeps approved and non-approved items apart. The Security Policy
                  of CMVP certificate #4703 (an HSM), for example, has &ldquo;Table 10 Approved
                  Services&rdquo; and &ldquo;Table 11 Non-Approved Services&rdquo;, and lists the
                  non-approved algorithms the module also offers in its Tables 4, 5 and 6. For
                  algorithms that are allowed with no security claimed, the IG says:
                </p>
                <LabQuote source="IG 2.4.A, p. 38">
                  the algorithm shall be included in the Security Policy&apos;s list of non-approved
                  algorithms allowed in the approved mode of operation with no security claimed (see
                  SP 800-140B). However, the module&apos;s certificate shall not include these
                  algorithms as they do not claim any security and are not used to meet any
                  requirement of FIPS 140-3.
                </LabQuote>
                <p className="text-xs text-muted-foreground">
                  So the question to put to a certificate is not &ldquo;does the vendor sell
                  ML-DSA?&rdquo; but &ldquo;is ML-DSA among the approved algorithms of this
                  certificate, and which approved services use it?&rdquo;
                </p>
              </div>

              <div className="bg-background rounded-lg p-3 border border-border space-y-2">
                <h4 className="text-xs font-bold text-foreground">
                  3. Self-tests inside the module (FIPS 140-3 IG 10.3.A)
                </h4>
                <p className="text-xs text-muted-foreground">
                  IG 10.3.A (last modified 19 August 2026) sets when the self-tests run and what
                  they must cover. Timing, and what happens outside the approved mode:
                </p>
                <LabQuote source="IG 10.3.A, p. 103">
                  The requirements of this IG apply prior to the first operational use of the
                  cryptographic algorithm.
                </LabQuote>
                <LabQuote source="IG 10.3.A, General Notes, p. 115">
                  GeneralNote8: For all algorithms that require a CAST (e.g., approved algorithms,
                  allowed algorithms with a claim of security as permitted by an IG, and legacy
                  algorithms per IG C.M), a CAST shall be performed prior to first time algorithm
                  execution in the approved mode; but CASTs are NOT required (but are certainly
                  permissible) prior to first time algorithm execution in the non-approved mode.
                </LabQuote>
                <p className="text-xs text-muted-foreground">
                  So firmware that runs ML-KEM or ML-DSA in a non-approved mode need not carry the
                  CASTs that a validated approved mode needs. For ML-KEM:
                </p>
                <LabQuote source="IG 10.3.A, item 14, p. 110">
                  if the module implements ML-KEM encapsulation, the module shall have a CAST for
                  the ML-KEM encapsulation mechanism.
                </LabQuote>
                <LabQuote source="IG 10.3.A, item 14, Note21, p. 111">
                  The ML-KEM decapsulation CASTs shall cover both the implicit rejection and
                  (unnamed) non-rejection paths.
                </LabQuote>
                <p className="text-xs text-muted-foreground">
                  For ML-DSA signing, the CAST may use either variant from the hedged-signing
                  section above:
                </p>
                <LabQuote source="IG 10.3.A, item 15, p. 111">
                  if the module implements digital signature generation, the module shall have an
                  ML-DSA digital signature generation CAST for either the &lsquo;hedged&rsquo; or
                  &lsquo;deterministic&rsquo; algorithm (per FIPS 204 Section 5.2).
                </LabQuote>
                <p className="text-xs text-muted-foreground">For LMS:</p>
                <LabQuote source="IG 10.3.A, item 5, p. 106">
                  If the module implements LMS signature generation then it shall also implement key
                  generation and shall have CASTs for both LMS signature generation and key
                  generation.
                </LabQuote>
                <p className="text-xs text-muted-foreground">
                  A key pair the HSM generates is also tested once, by a PCT, which is not a CAST:
                </p>
                <LabQuote source="IG 10.3.A, Additional Comments 1, p. 115">
                  Though not a CAST, a pairwise consistency test (PCT) shall be conducted for every
                  generated public and private key pair for the applicable approved algorithm (per
                  ISO/IEC 19790:2012 Section 7.10.3.3).
                </LabQuote>
                <LabQuote source="IG 10.3.A, Additional Comments 1, p. 116">
                  For key pairs generated for use with approved KEMs in FIPS 203, the PCT (described
                  by the tester in TE10.35.01) shall consist of applying the encapsulation key ek to
                  encapsulate a shared secret K leading to ciphertext c, and then applying
                  decapsulation key dk to retrieve the same shared secret K. The PCT passes if the
                  two shared secret K values are equal.
                </LabQuote>
                <p className="text-xs text-muted-foreground">
                  An HSM that stores a seed and rebuilds the key pair from it later is covered by a
                  separate sentence:
                </p>
                <LabQuote source="IG 10.3.A, Additional Comments 1, p. 116">
                  For key pairs generated from stored seeds per FIPS 203 (section 3.3) or FIPS 204
                  (section 3.6.3), a PCT is only required to be performed on the key pair prior to
                  the first exportation of the seed or key pair or prior to the first operational
                  use of the key pair after the seed has been generated within the module.
                </LabQuote>
                <p className="text-xs text-muted-foreground">
                  For an approved ML-KEM, IG D.S (last modified 9 April 2026) ties the algorithm
                  certificate to the module checks:
                </p>
                <LabQuote source="IG D.S, CAVP testing, Scenario 1, p. 225">
                  ML-KEM shall be CAVP tested via &lsquo;ML-KEM EncapDecap&rsquo; for all
                  implemented parameter sets (ML-KEM-1024, ML-KEM-512, ML-KEM-768) and functions
                  (Decapsulation, Encapsulation). The module shall implement the encapsulation and
                  decapsulation key checks specified in FIPS 203 Sections 7.2 and 7.3
                </LabQuote>
              </div>

              <div className="bg-background rounded-lg p-3 border border-border space-y-2">
                <h4 className="text-xs font-bold text-foreground">
                  4. Adding PQC to a validated HSM: which submission?
                </h4>
                <p className="text-xs text-muted-foreground">
                  The FIPS 140-3 CMVP Management Manual (version 2.7, 9 April 2026) decides how a
                  changed module is submitted. It lists twelve submission scenarios (section 7.1),
                  among them the full submission (FS) and several revalidation routes. The starting
                  point:
                </p>
                <LabQuote source="CMVP Management Manual 2.7, section 7.1, p. 50">
                  An updated version of a previously validated cryptographic module can be
                  considered for a revalidation rather than a full validation depending on the
                  extent of the modifications from the previously validated version of the module.
                </LabQuote>
                <p className="text-xs text-muted-foreground">
                  If no revalidation scenario fits, the module is treated as new:
                </p>
                <LabQuote source="CMVP Management Manual 2.7, section 7.1.2, p. 52">
                  If modifications are made to hardware, software, or firmware components that do
                  not meet any of the below revalidation criteria, then the cryptographic module
                  shall be considered a new module and shall undergo a full validation testing by a
                  CSTL and submitted as a FS.
                </LabQuote>
                <p className="text-xs text-muted-foreground">
                  Some revalidation scenarios cannot carry new cryptography. Algorithm Update (ALG)
                  is for algorithms that became CAVP-testable after validation, and Common
                  Vulnerabilities and Exposures (CVE) is for security fixes:
                </p>
                <LabQuote source="CMVP Management Manual 2.7, section 7.1.6, p. 55">
                  Code or configuration changes are not permitted under this revalidation scenario.
                </LabQuote>
                <LabQuote source="CMVP Management Manual 2.7, section 7.1.11, p. 60">
                  Changes shall not introduce new features or cryptography
                </LabQuote>
                <p className="text-xs text-muted-foreground">
                  The scenario that allows security-relevant changes is Update (UPDT), up to a
                  limit:
                </p>
                <LabQuote source="CMVP Management Manual 2.7, section 7.1.10, pp. 58-59">
                  An updated cryptographic module can be considered in this scenario if less than a
                  30% of security changes were made to the module. Security changes include impacts
                  to: approved / allowed security functions/algorithms, SSPs, approved security
                  services, self-tests, and security states within the FSM. None of these, assessed
                  individually, can exceed 30% of changes.
                </LabQuote>
                <LabQuote source="CMVP Management Manual 2.7, section 7.1.10, p. 59">
                  The CMVP upon review, may determine that the changes are &gt;30% and shall be
                  submitted as an FS.
                </LabQuote>
                <p className="text-xs text-muted-foreground">
                  The Manual&apos;s summary table (section 7.1.14, p. 65) gives UPDT a new
                  certificate and a new sunset date, requires the latest guidance, and requires CAVP
                  testing and, where IG 9.3.A applies, entropy source validation (ESV) testing.
                  Adding ML-KEM, ML-DSA or SLH-DSA changes the approved algorithms, the approved
                  services and the self-tests, which are categories the Manual counts toward the 30%
                  limit; whether a particular firmware release is an UPDT or an FS is decided by the
                  CMVP on the lab&apos;s submission, not something this page can state in advance.
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Related: how the ACVP tests are run in{' '}
                <Link to="/learn/acvp-lab-workflow" className="text-primary hover:underline">
                  ACVP Lab Workflow
                </Link>
                , how the signing state is managed in{' '}
                <Link to="/learn/stateful-signatures" className="text-primary hover:underline">
                  Stateful Hash-Based Signatures
                </Link>
                , and how a module is validated in{' '}
                <Link to="/learn/fips-140-3-certification" className="text-primary hover:underline">
                  FIPS 140-3 Certification
                </Link>
                .
              </p>
            </div>
          </div>
        </CollapsibleSection>
      </div>

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
                <h3 className="text-sm font-bold text-foreground mb-1">
                  Critical: State Persistence Requirement
                </h3>
                <p className="text-xs text-muted-foreground">
                  For every signing request, the HSM must write the updated state counter to NVRAM
                  before the signature leaves the module. A power failure around this write can
                  result in state loss, causing the same leaf to be used twice. NIST SP 800-208
                  &sect;8.1 requires that LMS/XMSS key and signature generation{' '}
                  <strong>
                    &ldquo;shall only be validated for use within hardware cryptographic
                    modules&rdquo;
                  </strong>{' '}
                  at FIPS 140-2 or FIPS 140-3 Level 3 or higher physical security (see also FIPS
                  140-3 IG C.N, Requirements for SP 800-208 Schemes). HSMs meet it with atomic NVRAM
                  writes, write-ahead logging, and pre-reservation of signature indices.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h3 className="text-sm font-bold text-foreground mb-2">
                <Layers size={14} className="inline-block mr-1" />
                NVRAM State Management
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; Atomic state counter update after each signature</li>
                <li>&bull; Write-ahead logging prevents partial state corruption</li>
                <li>&bull; Pre-reservation of signature indices (batch allocation)</li>
                <li>&bull; Hardware watchdog timer detects stalled writes</li>
                <li>&bull; Backup state to secondary NVRAM partition</li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h3 className="text-sm font-bold text-foreground mb-2">
                <Shield size={14} className="inline-block mr-1" />
                CNSA 2.0 Requirements
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  &bull; LMS or XMSS (single-tree only; HSS and XMSS^MT are not allowed in NSS)
                  preferred to start firmware signing now; validated ML-DSA-87 is also approved
                </li>
                <li>&bull; Software and firmware signing: CNSA 2.0 exclusively by 2030</li>
                <li>&bull; CNSA 2.0 mandated for National Security Systems by 31 Dec 2031</li>
                <li>&bull; NSM-10 goal: quantum-resistant NSS by 2035</li>
                <li>&bull; Tree height H=20 provides ~1M signatures per key</li>
                <li>
                  &bull; HSS (multi-tree) extends the signature count, for commercial (non-NSS) use
                  only
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border border-border text-xs text-muted-foreground space-y-2">
            <p>
              <strong>Power failure recovery:</strong> the standard fixes the order of operations,
              not the recovery procedure. How a particular product behaves when it finds incomplete
              state after a power loss, for example whether it refuses to sign with that key until
              an operator checks it, is product behaviour: read its Security Policy and
              administrator guide. NIST SP 800-208 section 8.1 says:
            </p>
            <LabQuote source="NIST SP 800-208, section 8.1, p. 28">
              In order to prevent the possible reuse of an OTS key, when the cryptographic module
              accepts a request to sign a message, the cryptographic module shall increment the leaf
              index of the private key (q in LMS, idx in XMSS, idx_sig in XMSSMT) and shall store
              the incremented leaf index value in nonvolatile storage before exporting a signature
              value or accepting another request to sign a message.
            </LabQuote>
            <p>
              FIPS 140-3 IG C.N Resolution 12 has the lab check it: &ldquo;the tester shall confirm
              that the state information for the key (at minimum the leaf index value) is updated in
              the non-volatile memory before exporting a signature value or accepting a request to
              sign another message.&rdquo;
            </p>
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
              <div className="text-xs text-muted-foreground">
                Key management services that integrate with HSM backends
              </div>
            </div>
          </Link>
          <Link
            to="/learn/stateful-signatures"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <GitBranch size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Stateful Hash Signatures</div>
              <div className="text-xs text-muted-foreground">
                LMS and XMSS signing stored in HSM key stores
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
                HSM-backed CA operations and PQC certificate issuance
              </div>
            </div>
          </Link>
          <Link
            to="/learn/qkd"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Zap size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Quantum Key Distribution</div>
              <div className="text-xs text-muted-foreground">
                QKD integration with HSM-based key injection pipelines
              </div>
            </div>
          </Link>
        </div>
      </section>
      <VendorCoverageNotice migrateLayer="Hardware" migrateDomain="hsm" />
      <RecordDecisionLink topic="hsm-choice" />
      <ReadingCompleteButton />
    </div>
  )
}
