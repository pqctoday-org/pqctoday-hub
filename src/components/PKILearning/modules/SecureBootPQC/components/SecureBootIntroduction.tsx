// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  FileCode,
  Key,
  Building2,
  Lock,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Cpu,
  Route,
  Monitor,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { UEFI_KEY_TYPES, BOOT_CHAIN_STAGES, FIRMWARE_ALGO_SIZES } from '../data/secureBootConstants'
import { FIRMWARE_VENDORS, VENDOR_STATUS_LABELS } from '../data/secureBootProviderData'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { Button } from '@/components/ui/button'

interface SecureBootIntroductionProps {
  onNavigateToWorkshop: () => void
}

interface CollapsibleSectionProps {
  icon: React.ReactNode
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  sectionId?: string
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  icon,
  title,
  defaultOpen = false,
  children,
  sectionId,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section data-section-id={sectionId} className="glass-panel p-6 scroll-mt-20">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left"
      >
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">{icon}</div>
        <h2 className="text-xl font-bold text-gradient flex-1">{title}</h2>
        <ChevronRight
          size={18}
          className={`text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
        />
      </Button>
      {isOpen && <div className="mt-4 space-y-4 text-sm text-foreground/80">{children}</div>}
    </section>
  )
}

export const SecureBootIntroduction: React.FC<SecureBootIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 w-full">
      {/* Section 1: UEFI Secure Boot Key Hierarchy */}
      <CollapsibleSection
        icon={<Shield size={24} className="text-primary" />}
        title="UEFI Secure Boot: Key Hierarchy and Chain of Trust"
        defaultOpen
        sectionId="secure-boot-fundamentals"
      >
        <p>
          <InlineTooltip term="UEFI">UEFI</InlineTooltip> Secure Boot establishes a{' '}
          <strong>cryptographic chain of trust</strong> from hardware power-on through the OS
          kernel. Each stage must be verified by a trusted key before it executes. The hierarchy is:
          Platform Key (PK) &rarr; Key Exchange Key (KEK) &rarr; Authorized Signature Database (db)
          &rarr; Bootloader/Kernel signatures.
        </p>

        <div className="bg-status-error/5 rounded-lg p-4 border border-status-error/20">
          <div className="text-sm font-bold text-status-error mb-2">
            All UEFI Signing Keys Are Quantum-Vulnerable
          </div>
          <p className="text-xs text-foreground/80">
            Every RSA-2048 and ECDSA key in the UEFI Secure Boot hierarchy can be broken by a
            Cryptographically Relevant Quantum Computer (CRQC) via Shor&apos;s algorithm. An
            attacker who harvests signed firmware images today can forge signatures once a CRQC is
            available — enabling undetectable firmware rootkits.
          </p>
        </div>

        {/* Key type table */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">UEFI Key Hierarchy Summary</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Key</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Owner</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Current</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                    PQC Target
                  </th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody>
                {UEFI_KEY_TYPES.map((kt) => (
                  <tr key={kt.id} className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono font-bold text-foreground">{kt.name}</td>
                    <td className="py-2 px-2 text-muted-foreground text-[10px]">{kt.owner}</td>
                    <td className="py-2 px-2 text-[10px]">
                      <span
                        className={
                          kt.quantumVulnerable ? 'text-status-error' : 'text-muted-foreground'
                        }
                      >
                        {kt.currentAlgorithm}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-primary text-[10px]">{kt.pqcAlgorithm}</td>
                    <td className="py-2 px-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded capitalize font-bold ${
                          kt.migrationPriority === 'critical'
                            ? 'text-status-error'
                            : kt.migrationPriority === 'high'
                              ? 'text-status-warning'
                              : kt.migrationPriority === 'medium'
                                ? 'text-status-info'
                                : 'text-status-success'
                        }`}
                      >
                        {kt.migrationPriority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p>
          The <strong>db size impact</strong> is a key operational concern: ML-DSA-65 X.509
          certificates are approximately <strong>6 KB</strong> vs{' '}
          <strong>1.2 KB for RSA-2048</strong>. UEFI NVRAM typically allocates 32–64 KB for Secure
          Boot variables. A full PQC db migration may require platform NVRAM reallocation — verify
          UEFI NVRAM capacity before planning.
        </p>

        {/* Boot chain visual */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">Boot Chain: Signing Surfaces</div>
          <div className="space-y-2">
            {BOOT_CHAIN_STAGES.map((stage, idx) => (
              <div key={stage.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      stage.hndlRisk === 'critical' || stage.hndlRisk === 'high'
                        ? 'bg-status-error/20 text-status-error'
                        : stage.hndlRisk === 'medium'
                          ? 'bg-status-warning/20 text-status-warning'
                          : 'bg-status-success/20 text-status-success'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < BOOT_CHAIN_STAGES.length - 1 && <div className="w-0.5 h-3 bg-border" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground">{stage.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {stage.currentAlgorithm}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{stage.pqcStatus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 2: ML-DSA-65 Firmware Signing */}
      <CollapsibleSection
        icon={<FileCode size={24} className="text-primary" />}
        title="ML-DSA-65 for Firmware Signature Migration"
        sectionId="firmware-signing"
      >
        <p>
          <InlineTooltip term="ML-DSA">ML-DSA-65</InlineTooltip> (FIPS 204, formerly
          CRYSTALS-Dilithium3) is the NIST-standardized post-quantum signature algorithm at NIST
          Security Level 3. It is the recommended choice for firmware signing because its signature
          size (3,309 bytes) balances security and UEFI storage overhead better than ML-DSA-87.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-status-error/5 rounded-lg p-4 border border-status-error/20">
            <div className="text-xs font-bold text-status-error mb-2">RSA-2048 (Current)</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; Public key: 256 bytes</li>
              <li>&bull; Signature: 256 bytes</li>
              <li>&bull; Quantum-safe: No (Shor&apos;s algorithm)</li>
              <li>&bull; Signing speed: ~1ms</li>
              <li>&bull; Verification: ~0.3ms</li>
            </ul>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="text-xs font-bold text-primary mb-2">ML-DSA-65 (Target)</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; Public key: 1,952 bytes (7.6&times; larger)</li>
              <li>&bull; Signature: 3,309 bytes (12.9&times; larger)</li>
              <li>&bull; Quantum-safe: Yes (NIST Level 3)</li>
              <li>&bull; Signing speed: ~1.5ms (comparable)</li>
              <li>&bull; Verification: ~0.6ms (faster than RSA verify)</li>
            </ul>
          </div>
        </div>

        {/* Size comparison table */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">Algorithm Size Reference</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                    Algorithm
                  </th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                    Pub Key
                  </th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                    Priv Key
                  </th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Sig</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Level</th>
                </tr>
              </thead>
              <tbody>
                {FIRMWARE_ALGO_SIZES.filter((a) => a.type === 'classical').map((a) => (
                  <tr key={a.algorithm} className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono text-status-error">{a.algorithm}</td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {a.publicKeyBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {a.privateKeyBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {a.signatureBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-status-error">{a.nistLevel}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} className="py-1">
                    <div className="border-t-2 border-primary/30" />
                  </td>
                </tr>
                {FIRMWARE_ALGO_SIZES.filter((a) => a.type === 'pqc').map((a) => (
                  <tr key={a.algorithm} className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono text-primary">{a.algorithm}</td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {a.publicKeyBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {a.privateKeyBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {a.signatureBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-status-success">{a.nistLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            SLH-DSA-SHA2-128s has the smallest public key (32 B) but the largest signature (7,856
            B). For firmware signing where signature size is the bottleneck, ML-DSA-65 is the
            recommended choice. SLH-DSA may suit long-lived root keys where signing is rare.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">
            Dual-Signature Hybrid Pattern
          </div>
          <p className="text-xs text-muted-foreground">
            During the transition period, firmware images can carry both an RSA-2048 and ML-DSA-65
            signature. Legacy systems that do not support ML-DSA fall back to RSA verification. New
            systems validate the ML-DSA signature. This dual-signature approach requires careful
            UEFI variable budget planning — the combined overhead is approximately 3,800 bytes per
            signed component.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 3: TPM 2.0 and PQC */}
      <CollapsibleSection
        icon={<Key size={24} className="text-primary" />}
        title="TPM 2.0 and the Path to Post-Quantum Attestation"
        sectionId="tpm-attestation"
      >
        <p>
          <InlineTooltip term="TPM">TPM 2.0</InlineTooltip> (ISO/IEC 11889:2015) is the hardware
          root of trust for platform attestation in most enterprise servers and PCs. It measures
          boot stages into PCR banks, provides Attestation Identity Keys (AIK) for remote
          attestation, and seals secrets to specific platform states.
        </p>

        <div className="bg-status-warning/5 rounded-lg p-4 border border-status-warning/20">
          <div className="text-sm font-bold text-status-warning mb-2">
            TPM 2.0 Does Not Support ML-DSA or ML-KEM Natively
          </div>
          <p className="text-xs text-foreground/80">
            The current TPM 2.0 specification defines only RSA, ECC P-256/P-384, and symmetric
            algorithms. The <strong>Trusted Computing Group (TCG) PQC Working Group</strong> is
            developing a TPM Library Part 2 extension to add ML-DSA and ML-KEM algorithm support,
            targeted for ratification in 2027. Hardware TPMs with native PQC will require new
            silicon (2028+).
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold text-foreground">Near-Term Hybrid Approach:</div>
          {[
            {
              step: 1,
              title: 'TPM RSA AIK signs quote (hardware-backed proof)',
              detail:
                "The TPM's RSA-2048 AIK produces a quote over PCR values — this proves hardware integrity but is quantum-vulnerable for long-lived secrets.",
            },
            {
              step: 2,
              title: 'Software ML-DSA-65 key co-signs the same nonce',
              detail:
                'An ML-DSA-65 key pair generated in software (outside the TPM) signs the same challenge nonce, providing quantum-safe attestation. The ML-DSA public key is bound to the TPM AIK certificate.',
            },
            {
              step: 3,
              title: 'Verifier validates both signatures',
              detail:
                'The relying party checks: (1) TPM AIK certificate chain (hardware binding), (2) ML-DSA signature (quantum-safe proof). Both must pass.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 border border-border"
            >
              <span className="text-xs font-bold text-primary w-5 shrink-0 mt-0.5">
                {item.step}
              </span>
              <div>
                <div className="text-xs font-bold text-foreground mb-0.5">{item.title}</div>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">PCR[7] and Key Migration</div>
          <p className="text-xs text-muted-foreground">
            PCR[7] records all Secure Boot key changes (PK/KEK/db enrollment). When you migrate UEFI
            keys to ML-DSA, PCR[7] will change. Any secrets sealed against PCR[7] (notably{' '}
            <strong>BitLocker TPM protectors</strong> on Windows) must be re-sealed after the key
            migration. Plan for BitLocker recovery key backup and re-sealing as part of your UEFI
            PQC migration procedure.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 4: Vendor Roadmaps */}
      <CollapsibleSection
        icon={<Building2 size={24} className="text-primary" />}
        title="AMI, Insyde, EDK2, Dell, HPE Firmware PQC Roadmaps"
        sectionId="vendor-roadmaps"
      >
        <p>
          BIOS and firmware vendors are at different stages of PQC adoption. Understanding each
          vendor&apos;s timeline is critical for infrastructure refresh planning, especially for
          organizations with CNSA 2.0 or EU NIS2 compliance requirements.
        </p>

        <div className="space-y-4">
          {FIRMWARE_VENDORS.map((vendor) => {
            const status = VENDOR_STATUS_LABELS[vendor.pqcStatus]
            return (
              <div key={vendor.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-bold text-foreground">{vendor.product}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground uppercase">
                    {vendor.vendor}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${status.className}`}
                  >
                    {status.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{vendor.roadmapYear}</span>
                </div>
                <p className="text-xs text-foreground/80 mb-2">{vendor.notes}</p>
                <div className="text-[10px] text-primary/80">Target: {vendor.pqcAlgorithm}</div>
              </div>
            )
          })}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">
            UEFI Forum PQC Specification Work
          </div>
          <p className="text-xs text-muted-foreground">
            The UEFI Forum is developing a formal PQC extension to the UEFI Specification covering:
            new EFI Signature List types for ML-DSA certificates, NVRAM allocation guidelines for
            larger PQC keys, and Secure Boot variable format updates. Organizations should monitor
            UEFI Forum publications and engage their firmware vendors for preview access.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 5: Supply Chain Security */}
      <CollapsibleSection
        icon={<Cpu size={24} className="text-primary" />}
        title="Hardware Supply Chain and Firmware Integrity at Scale"
      >
        <p>
          At scale, firmware integrity requires end-to-end supply chain controls. The threat model
          extends beyond network attackers to include <strong>insider threats at OEMs</strong>,{' '}
          <strong>compromised build systems</strong>, and{' '}
          <strong>hardware implants in manufacturing</strong>. PQC migration must secure the entire
          signing pipeline.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              title: 'Build-Time Code Signing',
              icon: Lock,
              description:
                'ML-DSA private keys used for firmware signing must be stored in FIPS 140-3 Level 3 HSMs within air-gapped signing infrastructure. Key ceremony procedures must be updated for ML-DSA-65 key generation.',
            },
            {
              title: 'Supply Chain Verification',
              icon: Shield,
              description:
                'NIST SP 800-161r1 requires cryptographic verification of supplier firmware. ML-DSA signatures in firmware manifests (SWID tags, SBOM attestations) ensure vendor integrity.',
            },
            {
              title: 'Firmware Update Pipeline',
              icon: Route,
              description:
                'Automated firmware update systems (iDRAC, iLO, iSUM) must validate ML-DSA signatures before applying updates. Update catalogs and manifests must use ML-DSA-65 throughout.',
            },
            {
              title: 'Attestation at Scale',
              icon: Building2,
              description:
                'Enterprise attestation services (Microsoft Azure Attestation, Google Confidential Space) must handle ML-DSA AIK certificates and PQC TPM quote signatures as hardware support becomes available.',
            },
          ].map((item) => {
            const ItemIcon = item.icon
            return (
              <div key={item.title} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <ItemIcon size={16} className="text-primary shrink-0" aria-hidden="true" />
                  <div className="text-xs font-bold text-foreground">{item.title}</div>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            )
          })}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">Migration Phase Plan</div>
          <div className="space-y-2">
            {[
              {
                phase: 'Phase 1: Inventory (2025–2026)',
                description:
                  'Catalog all firmware signing keys, identify platforms, assess UEFI NVRAM capacity, engage OEM vendors for PQC timelines.',
              },
              {
                phase: 'Phase 2: Dual-Signature Deployment (2026–2027)',
                description:
                  'Deploy firmware with hybrid RSA + ML-DSA signatures. Begin PK/KEK/db migration on new platforms. EDK2 OVMF for lab validation.',
              },
              {
                phase: 'Phase 3: Full PQC (2027–2030)',
                description:
                  'Retire RSA-only firmware signing. Complete PK/KEK/db migration on all production platforms. Enable ML-DSA-only mode once legacy systems are retired.',
              },
            ].map((p) => (
              <div
                key={p.phase}
                className="flex items-start gap-3 bg-background rounded-lg p-3 border border-border"
              >
                <div className="flex-1">
                  <div className="text-xs font-bold text-foreground mb-0.5">{p.phase}</div>
                  <p className="text-[10px] text-muted-foreground">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/hsm-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Key size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">HSM &amp; PQC Operations</div>
              <div className="text-xs text-muted-foreground">
                PKCS#11 v3.2 mechanisms and firmware migration
              </div>
            </div>
          </Link>
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">
                KMS &amp; PQC Key Management
              </div>
              <div className="text-xs text-muted-foreground">
                Envelope encryption and key hierarchy patterns
              </div>
            </div>
          </Link>
          <Link
            to="/learn/confidential-computing"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Cpu size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Confidential Computing</div>
              <div className="text-xs text-muted-foreground">TEEs, remote attestation, and PQC</div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BookOpen size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">
                Algorithm-agnostic cryptographic infrastructure
              </div>
            </div>
          </Link>
          <Link
            to="/learn/os-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Monitor size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">OS Cryptographic Stacks</div>
              <div className="text-xs text-muted-foreground">
                OS-level crypto providers, SSH host keys, and system TLS policy
              </div>
            </div>
          </Link>
        </div>
      </section>

      <VendorCoverageNotice migrateLayer="Hardware" />

      {/* CTA */}
      <div className="text-center">
        <Button
          variant="gradient"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Analyze UEFI key hierarchies, migrate firmware signatures, and explore TPM attestation
          flows.
        </p>
      </div>
      <ReadingCompleteButton />
    </div>
  )
}
