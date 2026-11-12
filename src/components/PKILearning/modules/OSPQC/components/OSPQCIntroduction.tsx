// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import {
  Monitor,
  Settings,
  Key,
  Package,
  Shield,
  ArrowRight,
  BookOpen,
  Route,
  Server,
  HardDrive,
} from 'lucide-react'
import {
  OS_VENDORS,
  OS_VENDOR_STATUS_LABELS,
  FIPS_STATUS_LABELS,
  getOsPqcStatus,
} from '../data/osProviderData'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { LearnSection } from '@/components/PKILearning/common/LearnSection'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { Button } from '@/components/ui/button'

interface OSPQCIntroductionProps {
  onNavigateToWorkshop: () => void
}

// Local CollapsibleSection replaced by the shared anchored LearnSection (2026-07-30).

export const OSPQCIntroduction: React.FC<OSPQCIntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-8 w-full">
      {/* Section 1: OS Cryptography Stack */}
      <LearnSection
        sectionId="os-crypto-landscape"
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
              System TLS traffic (HTTPS, API calls, database connections) and SSH sessions can be
              recorded today and decrypted later if their key exchange is classical-only. Every TLS
              1.3 session using only classical key exchange is a potential HNDL target. A hybrid
              group such as X25519MLKEM768 protects the sessions that actually negotiate it, so both
              ends must support it and a capture must show the group that was selected. Server and
              signer authentication is a separate, later concern (see the SSH section).
            </p>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="text-xs font-bold text-primary mb-2">OS Vendor Status</div>
            <p className="text-xs text-muted-foreground">
              Shipping ML-KEM and ML-DSA in an operating system is a separate step from having them
              listed on a FIPS 140-3 certificate, so check each platform against the CMVP listings.
            </p>
          </div>
        </div>
      </LearnSection>

      {/* Section 2: System-Wide TLS Policy */}
      <LearnSection
        sectionId="system-tls"
        icon={<Settings size={24} className="text-primary" />}
        title="System-Wide TLS Policy: OpenSSL, CNG, and GnuTLS"
      >
        <p>
          The most impactful PQC change for any OS is enabling{' '}
          <strong>hybrid TLS key exchange</strong> at the system level. When you configure{' '}
          <InlineTooltip term="X25519MLKEM768">X25519MLKEM768</InlineTooltip> as a TLS 1.3 KEM
          group, applications must load the relevant system policy or library configuration. Restart
          them after a change and test their actual TLS connections: a local capability or a
          ClientHello offer does not establish the selected group. The peer must support the group
          too; a permitted classical fallback remains classical.
        </p>

        <div className="space-y-3">
          {[
            {
              os: 'RHEL 9.7 / 10.1+',
              mechanism: 'crypto-policies',
              command: 'update-crypto-policies --set DEFAULT:PQ',
              effect:
                'Red Hat documents the DEFAULT:PQ policy for RHEL 9.7; on RHEL 10.1 the DEFAULT policy is the documented route',
              status: 'experimental',
            },
            {
              os: 'Ubuntu 26.04 LTS (OpenSSL 3.5.5)',
              mechanism: '/etc/ssl/openssl.cnf',
              command: 'Groups = x25519mlkem768:x25519:prime256v1',
              effect:
                'Adds ML-KEM hybrid as preferred TLS 1.3 group for OpenSSL 3.5.0 or later. Ubuntu 24.04 LTS ships OpenSSL 3.0.13, which has no ML-KEM.',
              status: 'available',
            },
            {
              os: 'Windows Server 2025',
              mechanism: 'Schannel (hybrid groups)',
              command: 'Enable X25519MLKEM768 via Group Policy or TLS cmdlets',
              effect:
                'Disabled by default — hybrid groups are available from KB5089573 / KB5099536 and require explicit enablement',
              status: 'experimental',
            },
            {
              os: 'FreeBSD 14.x',
              mechanism: '/etc/ssl/openssl.cnf + oqsprovider',
              command: 'pkg install openssl-oqsprovider && configure openssl.cnf',
              effect:
                'ML-KEM hybrid TLS available after installing the openssl-oqsprovider package (FreeBSD port security/openssl-oqsprovider) and activating it in openssl.cnf',
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
            Applications may use <strong>GnuTLS</strong> instead of OpenSSL; check the actual
            application build. GnuTLS 3.8.8 introduced experimental final-ML-KEM hybrid groups;
            3.8.9 added experimental ML-DSA library and certtool support. Version 3.8.10 added
            ML-DSA TLS handshake signatures and requires leancrypto for PQC (liboqs was removed). On
            a build with the required PQC backend, inspect the supported group list with{' '}
            <code className="text-xs bg-muted px-1 rounded">
              gnutls-cli --priority 'SECURE128:+GROUP-X25519-MLKEM768' --list
            </code>
            . This lists local capability; an unsupported-group error means that this build cannot
            use the requested group. It does not establish a completed hybrid handshake. Apply
            policy through the application’s GnuTLS configuration, restart it and inspect the
            negotiated group on a successful test connection. An OpenSSL config change does not
            configure GnuTLS.
          </p>
        </div>
      </LearnSection>

      {/* Section 3: SSH Host Key Migration */}
      <LearnSection
        sectionId="ssh-host-keys"
        icon={<Key size={24} className="text-primary" />}
        title="SSH Host Key Migration to ML-DSA-65"
      >
        <p>
          SSH has two separate quantum exposures that call for two separate fixes. Session
          confidentiality depends on the key exchange: a session recorded today with a
          classical-only key exchange is the{' '}
          <InlineTooltip term="HNDL">Harvest Now, Decrypt Later</InlineTooltip> case, and a
          post-quantum key exchange is the control for it. Server authentication depends on the
          host-key signature: a quantum computer able to forge classical signatures could let an
          attacker impersonate your server to clients that still trust the old host key, but only in
          connections made once such a computer exists. A host key does not decrypt anything that
          was recorded earlier, so replacing it is not an HNDL control. OpenSSH&apos;s own
          post-quantum page makes the same distinction: signature algorithms have no analogue of
          store now, decrypt later, and the only urgency is retiring classical signature keys before
          cryptographically relevant quantum computers arrive. Migrating to{' '}
          <strong>ssh-mldsa65</strong> addresses that second exposure only.
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
                note: 'Internet-Draft stage; not a standard',
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
                hybrid KEX (the default from 9.0). OpenSSH 9.9 adds{' '}
                <code className="text-[10px] bg-muted px-1 rounded">mlkem768x25519-sha256</code>,
                enabled by default, and OpenSSH 10.0 makes it the default KEX. This is the control
                for HNDL against session contents; it works only if both client and server offer it.
              </p>
            </div>
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs font-bold text-secondary mb-1">2. Host Authentication</div>
              <p className="text-xs text-muted-foreground">
                Verifies server identity via host key signature. It has no store now, decrypt later
                exposure: forging a host-key signature only helps an attacker in connections made
                after a capable quantum computer exists, so the aim is to retire classical host keys
                ahead of that point. ML-DSA host key types are described in the Internet-Draft
                draft-sfluhrer-ssh-mldsa (revision 08 when checked), which writes the names as{' '}
                <code className="text-[10px] bg-muted px-1 rounded">ssh-mldsa-44</code>,{' '}
                <code className="text-[10px] bg-muted px-1 rounded">ssh-mldsa-65</code> and{' '}
                <code className="text-[10px] bg-muted px-1 rounded">ssh-mldsa-87</code>; this lesson
                uses <code className="text-[10px] bg-muted px-1 rounded">ssh-mldsa65</code> as
                shorthand. An Internet-Draft is a work in progress, not a standard. The composite{' '}
                <code className="text-[10px] bg-muted px-1 rounded">ssh-mldsa44-ed25519</code>{' '}
                algorithm is specified in the SSHM working group draft
                draft-ietf-sshm-composite-sigs-00, and OpenSSH 10.6 enables it.
              </p>
            </div>
          </div>
        </div>
      </LearnSection>

      {/* Section 4: Package Signing */}
      <LearnSection
        sectionId="package-signing"
        icon={<Package size={24} className="text-primary" />}
        title="Package Manager Signing: RPM/DEB Migration to ML-DSA"
      >
        <p>
          Package signing is a supply chain integrity mechanism — it proves that the package you
          install came from the expected vendor and has not been tampered with. Today, RPM and DEB
          packages use OpenPGP signatures (the key type depends on the distribution). PQC migration
          requires coordinating upgrades across the signing server, repository metadata, and all
          client package managers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              RPM Ecosystem (RHEL / Fedora)
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; rpmsign: adds OpenPGP signatures to the RPM header</li>
              <li>&bull; rpm/dnf: verify against the OpenPGP keys in the keyring</li>
              <li>
                &bull; PQC path: RPM 6.0.0 lists OpenPGP v6 and PQC signatures, and Red Hat signs
                RHEL 10.1 packages with a hybrid ML-DSA-87 + Ed448 key beside its RSA key
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              DEB Ecosystem (Debian / Ubuntu)
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; InRelease: signed repo metadata (APT)</li>
              <li>&bull; apt: verifies the InRelease OpenPGP signature on update</li>
              <li>
                &bull; PQC path: this lesson cites no Debian or Ubuntu ML-DSA plan or date (DEP-18
                covers CI and merge-request workflow, not signatures)
              </li>
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
            server-side TLS config change. Red Hat&apos;s approach shows one way to stage it: add a
            post-quantum signature beside the existing RSA one, so systems that cannot verify the
            new signature still verify the old one and newer clients check both. A client without
            RPM 6 signature support does not check the post-quantum signature at all.
          </p>
        </div>
      </LearnSection>

      {/* Section 5: FIPS Mode + PQC */}
      <LearnSection
        sectionId="fips-mode"
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
              const pqcLabel = OS_VENDOR_STATUS_LABELS[getOsPqcStatus(vendor)]
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
            Until PQC algorithms appear in FIPS-certified modules, one option, if your assessor
            agrees, is a dual approach:
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
                Where your assessor accepts PQC services outside the validated boundary, new
                services can use a non-validated PQC provider: the default OpenSSL provider on
                OpenSSL 3.5 or later, or oqsprovider on older releases. Whether it may run next to
                the FIPS provider is the assessor&apos;s decision. Document the non-FIPS status and
                include it in compliance assessment until new FIPS certs are issued.
              </p>
            </div>
          </div>
        </div>
      </LearnSection>

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
            to="/migrate?domain=platform"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Route size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Migration Workbench</div>
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
          variant="gradient"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
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
