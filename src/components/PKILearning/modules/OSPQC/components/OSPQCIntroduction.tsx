// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import {
  Monitor,
  Settings,
  Key,
  Package,
  Shield,
  ChevronRight,
  ArrowRight,
  BookOpen,
  Route,
  Server,
  HardDrive,
} from 'lucide-react'
import { OS_VENDORS, OS_VENDOR_STATUS_LABELS, FIPS_STATUS_LABELS } from '../data/osProviderData'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { Button } from '@/components/ui/button'

interface OSPQCIntroductionProps {
  onNavigateToWorkshop: () => void
}

interface CollapsibleSectionProps {
  icon: React.ReactNode
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  icon,
  title,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="glass-panel p-6">
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

export const OSPQCIntroduction: React.FC<OSPQCIntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: OS Cryptography Stack */}
      <CollapsibleSection
        icon={<Monitor size={24} className="text-primary" />}
        title="OS Cryptography: Where PQC Fits in the System Stack"
        defaultOpen
      >
        <p>
          Modern operating systems rely on a layered cryptographic stack that spans from the kernel
          to user applications. Understanding where each layer sits is essential for a complete{' '}
          <InlineTooltip term="PQC">PQC</InlineTooltip> migration. Unlike application-layer
          cryptography (where you control the library), OS-level crypto changes affect every service
          running on the system.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">
            OS Cryptographic Stack (top to bottom)
          </div>
          <div className="space-y-2 text-center">
            {[
              {
                label: 'Applications (curl, git, OpenSSH client)',
                level: 'app',
                color: 'bg-primary/10 text-primary',
              },
              {
                label: 'System TLS Library (OpenSSL / GnuTLS / NSS)',
                level: 'tls',
                color: 'bg-secondary/10 text-secondary',
              },
              {
                label: 'OS Crypto Framework (CNG / Security.framework / OpenSSL)',
                level: 'framework',
                color: 'bg-accent/10 text-accent',
              },
              {
                label: 'SSH Daemon (sshd) + Package Manager',
                level: 'services',
                color: 'bg-muted text-foreground',
              },
              {
                label: 'Linux Kernel CryptoAPI / Windows SymCrypt',
                level: 'kernel',
                color: 'bg-muted/50 text-muted-foreground',
              },
              {
                label: 'Hardware: CPU AES-NI, RDRAND, TPM/HSM',
                level: 'hw',
                color: 'bg-muted/30 text-muted-foreground',
              },
            ].map((layer, idx) => (
              <div key={idx} className={`p-2 rounded text-xs font-medium ${layer.color}`}>
                {layer.label}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            PQC migration touches every layer. System TLS configuration cascades to all applications
            that use system OpenSSL. SSH host key migration requires new key types. Package signing
            requires coordinated infrastructure upgrades.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
            <div className="text-xs font-bold text-destructive mb-2">
              Harvest Now, Decrypt Later
            </div>
            <p className="text-xs text-muted-foreground">
              System TLS traffic (HTTPS, API calls, database connections) and SSH sessions are being
              recorded today for future decryption. Every TLS 1.3 session using only classical key
              exchange is a potential HNDL target. Hybrid X25519MLKEM768 eliminates this risk with a
              single config change.
            </p>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="text-xs font-bold text-primary mb-2">OS Vendor Roadmaps</div>
            <p className="text-xs text-muted-foreground">
              RHEL, Ubuntu, Windows Server, and macOS all have active PQC roadmaps. The migration
              timeline differs significantly — Windows Server 2025 has ML-KEM in a FIPS 140-3
              validated module today, while Linux distros are targeting 2026-2028 for full PQC FIPS
              module certification.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 2: System-Wide TLS Policy */}
      <CollapsibleSection
        icon={<Settings size={24} className="text-primary" />}
        title="System-Wide TLS Policy: OpenSSL, CNG, and GnuTLS"
      >
        <p>
          The most impactful PQC change for any OS is enabling{' '}
          <strong>hybrid TLS key exchange</strong> at the system level. When you configure{' '}
          <InlineTooltip term="X25519MLKEM768">X25519MLKEM768</InlineTooltip> as a TLS 1.3 KEM
          group, every application that uses the system{' '}
          <InlineTooltip term="OpenSSL">OpenSSL</InlineTooltip> or CNG library benefits
          automatically.
        </p>

        <div className="space-y-3">
          {[
            {
              os: 'RHEL / CentOS Stream',
              mechanism: 'crypto-policies',
              command: 'update-crypto-policies --set FUTURE',
              effect: 'TLS 1.3-only + X25519MLKEM768 hybrid group systemwide',
              status: 'experimental',
            },
            {
              os: 'Ubuntu 24.04 LTS',
              mechanism: '/etc/ssl/openssl.cnf',
              command: 'Groups = x25519mlkem768:x25519:prime256v1',
              effect: 'Adds ML-KEM hybrid as preferred TLS 1.3 group for all OpenSSL apps',
              status: 'available',
            },
            {
              os: 'Windows Server 2025',
              mechanism: 'Schannel (KB5036893)',
              command: 'X25519MLKEM768 enabled by default in TLS 1.3 ClientHello',
              effect: 'No configuration needed — hybrid KEM active after Windows Update',
              status: 'default',
            },
            {
              os: 'FreeBSD 14.x',
              mechanism: '/etc/ssl/openssl.cnf + oqsprovider',
              command: 'pkg install oqsprovider && configure openssl.cnf',
              effect: 'ML-KEM hybrid TLS available after installing oqsprovider port',
              status: 'manual',
            },
          ].map((entry) => (
            <div key={entry.os} className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-bold text-foreground">{entry.os}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  {entry.mechanism}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                    entry.status === 'default'
                      ? 'text-status-success bg-status-success/10 border-status-success/30'
                      : entry.status === 'available'
                        ? 'text-primary bg-primary/10 border-primary/20'
                        : entry.status === 'experimental'
                          ? 'text-status-warning bg-status-warning/10 border-status-warning/30'
                          : 'text-muted-foreground bg-muted border-border'
                  }`}
                >
                  {entry.status}
                </span>
              </div>
              <pre className="text-[10px] font-mono bg-background p-2 rounded border border-border overflow-x-auto text-foreground mb-2">
                {entry.command}
              </pre>
              <p className="text-xs text-muted-foreground">{entry.effect}</p>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">GnuTLS (curl, wget, systemd)</div>
          <p className="text-xs text-muted-foreground">
            Many Linux services use <strong>GnuTLS</strong> rather than OpenSSL — including curl on
            Debian/Ubuntu, wget, NetworkManager, and systemd-networkd. GnuTLS 3.8.3+ supports
            X25519MLKEM768 hybrid groups configured via{' '}
            <code className="text-xs bg-muted px-1 rounded">GNUTLS_SYSTEM_PRIORITY_FILE</code> or
            priority string{' '}
            <code className="text-xs bg-muted px-1 rounded">SECURE128:+X25519MLKEM768</code>.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 3: SSH Host Key Migration */}
      <CollapsibleSection
        icon={<Key size={24} className="text-primary" />}
        title="SSH Host Key Migration to ML-DSA-65"
      >
        <p>
          SSH host keys are a prime target for{' '}
          <InlineTooltip term="HNDL">Harvest Now, Decrypt Later</InlineTooltip> attacks. An attacker
          recording SSH sessions today could authenticate as your server in the future once they
          break the host key with a quantum computer. Migrating to <strong>ssh-mldsa65</strong>{' '}
          eliminates this risk.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">SSH Key Evolution Timeline</div>
          <div className="space-y-2">
            {[
              {
                year: '1995-2010',
                keyType: 'ssh-rsa (RSA-1024/2048)',
                status: 'deprecated',
                note: 'Deprecated in OpenSSH 9.0 (2022)',
              },
              {
                year: '2009-present',
                keyType: 'ecdsa-sha2-nistp256/384/521',
                status: 'vulnerable',
                note: 'Quantum-vulnerable; still widely used',
              },
              {
                year: '2014-present',
                keyType: 'ssh-ed25519',
                status: 'current-best',
                note: 'Current best practice; still quantum-vulnerable',
              },
              {
                year: '2026+',
                keyType: 'ssh-mldsa65 (ML-DSA-65)',
                status: 'pqc',
                note: 'Draft RFC; production in OpenSSH 10.0+',
              },
            ].map((entry) => (
              <div
                key={entry.year}
                className="flex items-start gap-3 p-3 bg-background rounded border border-border"
              >
                <span className="text-xs text-muted-foreground font-mono w-24 shrink-0">
                  {entry.year}
                </span>
                <span className="font-mono text-xs text-foreground">{entry.keyType}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-bold shrink-0 ml-auto ${
                    entry.status === 'pqc'
                      ? 'text-status-success bg-status-success/10 border-status-success/30'
                      : entry.status === 'current-best'
                        ? 'text-primary bg-primary/10 border-primary/20'
                        : entry.status === 'vulnerable'
                          ? 'text-status-warning bg-status-warning/10 border-status-warning/30'
                          : 'text-muted-foreground bg-muted border-border'
                  }`}
                >
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">Two PQC Layers in SSH</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">1. Key Exchange (KEX)</div>
              <p className="text-xs text-muted-foreground">
                Protects session encryption. OpenSSH 8.5+ supports{' '}
                <code className="text-[10px] bg-muted px-1 rounded">sntrup761x25519-sha512</code>{' '}
                hybrid KEX. OpenSSH 9.9+ experimental adds ML-KEM-768 hybrid KEX. Addresses HNDL for
                session contents.
              </p>
            </div>
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs font-bold text-secondary mb-1">2. Host Authentication</div>
              <p className="text-xs text-muted-foreground">
                Verifies server identity via host key signature. The new{' '}
                <code className="text-[10px] bg-muted px-1 rounded">ssh-mldsa65</code> host key type
                (draft-ietf-sshm-mldsa) provides quantum-safe server authentication. Requires
                OpenSSH 10.0+ on both client and server.
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 4: Package Signing */}
      <CollapsibleSection
        icon={<Package size={24} className="text-primary" />}
        title="Package Manager Signing: RPM/DEB Migration to ML-DSA"
      >
        <p>
          Package signing is a supply chain integrity mechanism — it proves that the package you
          install came from the expected vendor and has not been tampered with. Today, RPM and DEB
          packages use GPG signatures (RSA-4096 or Ed25519). PQC migration requires coordinating
          upgrades across the signing server, repository metadata, and all client package managers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              RPM Ecosystem (RHEL / Fedora)
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; rpm-sign: embeds GPG sig in RPM header</li>
              <li>&bull; dnf: verifies sig using imported GPG keys</li>
              <li>&bull; PQC path: pluggable backend in RPM v4.19+</li>
              <li>&bull; Timeline: RHEL 11 (2028) experimental ML-DSA</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              DEB Ecosystem (Debian / Ubuntu)
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; InRelease: signed repo metadata (APT)</li>
              <li>&bull; apt: verifies InRelease GPG sig on update</li>
              <li>&bull; PQC path: DEP-18 (Debian Enhancement Proposal)</li>
              <li>&bull; Timeline: Ubuntu 26.04 LTS (2026) target</li>
            </ul>
          </div>
        </div>

        <div className="bg-status-info/5 rounded-lg p-4 border border-status-info/20">
          <div className="text-xs font-bold text-foreground mb-2">
            Why Package Signing Lags Behind
          </div>
          <p className="text-xs text-muted-foreground">
            Package signing requires <strong>coordinated ecosystem upgrades</strong>. The signing
            infrastructure, repository metadata format, package manager client, and end-user systems
            must ALL support the new algorithm before migration. This is significantly harder than a
            server-side TLS config change. Sigstore-style transparency logs with ML-DSA detached
            signatures are a promising intermediate solution.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 5: FIPS Mode + PQC */}
      <CollapsibleSection
        icon={<Shield size={24} className="text-primary" />}
        title="FIPS Mode, OS Hardening, and PQC Compatibility"
      >
        <p>
          <InlineTooltip term="FIPS 140-3">FIPS 140-3</InlineTooltip> compliance creates a
          significant challenge for PQC migration: most current FIPS modules were certified before
          ML-KEM and ML-DSA were standardized. Organizations in regulated industries (government,
          finance, healthcare) face a temporary conflict between FIPS compliance and PQC deployment.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">
            OS Vendor PQC Readiness Overview
          </div>
          <div className="space-y-2">
            {OS_VENDORS.slice(0, 5).map((vendor) => {
              const pqcLabel = OS_VENDOR_STATUS_LABELS[vendor.pqcStatus]
              const fipsLabel = FIPS_STATUS_LABELS[vendor.fipsMode]
              return (
                <div
                  key={vendor.id}
                  className="flex items-start gap-3 p-3 bg-background rounded border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-foreground">{vendor.vendor}</span>
                      <span className="text-[10px] text-muted-foreground">{vendor.platform}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {vendor.notes.substring(0, 120)}...
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-bold text-center ${pqcLabel.className}`}
                    >
                      {pqcLabel.label}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-bold text-center ${fipsLabel.className}`}
                    >
                      {fipsLabel.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">FIPS + PQC Hybrid Strategy</div>
          <p className="text-xs text-muted-foreground mb-3">
            Until PQC algorithms appear in FIPS-certified modules, use a dual approach:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-[10px] font-bold text-foreground mb-1">FIPS Workloads</div>
              <p className="text-xs text-muted-foreground">
                Existing regulated services continue using the FIPS 140-3 module (classical crypto
                only). No disruption to compliance posture.
              </p>
            </div>
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-[10px] font-bold text-foreground mb-1">New PQC Services</div>
              <p className="text-xs text-muted-foreground">
                New services use the default OpenSSL provider + oqsprovider. Document the non-FIPS
                status and include it in compliance assessment until new FIPS certs are issued.
              </p>
            </div>
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
            <Shield size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">HSM &amp; PQC Operations</div>
              <div className="text-xs text-muted-foreground">
                PKCS#11 v3.2 mechanisms, firmware migration, and FIPS validation
              </div>
            </div>
          </Link>
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Key size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">
                KMS &amp; PQC Key Management
              </div>
              <div className="text-xs text-muted-foreground">
                Envelope encryption, hybrid key wrapping, and KMS provider roadmaps
              </div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-dev-apis"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Server size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Dev APIs</div>
              <div className="text-xs text-muted-foreground">
                OpenSSL EVP, PKCS#11, CNG, and JCA/JCE PQC migration patterns
              </div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BookOpen size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">
                Algorithm-agnostic design patterns for OS-level cryptography
              </div>
            </div>
          </Link>
          <Link
            to="/migrate"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Route size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Migration Catalog</div>
              <div className="text-xs text-muted-foreground">
                OS vendor products and PQC migration status
              </div>
            </div>
          </Link>
          <Link
            to="/learn/secure-boot-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <HardDrive size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Secure Boot &amp; Firmware</div>
              <div className="text-xs text-muted-foreground">
                UEFI PK/KEK migration, TPM 2.0, and ML-DSA firmware signing
              </div>
            </div>
          </Link>
        </div>
      </section>

      <VendorCoverageNotice migrateLayer="OS" />

      {/* CTA */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Inventory OS crypto components, configure system TLS, migrate SSH host keys, and check
          FIPS compatibility.
        </p>
      </div>
      <ReadingCompleteButton />
    </div>
  )
}
