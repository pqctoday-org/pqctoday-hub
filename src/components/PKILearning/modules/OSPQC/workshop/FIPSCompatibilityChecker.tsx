// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Shield, CheckCircle, AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'

interface FIPSPlatform {
  id: string
  os: string
  fipsModule: string
  fipsStatus: 'fips-140-3' | 'fips-140-2' | 'pending' | 'not-supported'
  mlKemInFips: 'yes' | 'no' | 'pending'
  mlDsaInFips: 'yes' | 'no' | 'pending'
  fipsCertDate: string
  pqcFipsCertTarget: string
  hybridStrategy: string
  notes: string
  commands: string
}

const FIPS_PLATFORMS: FIPSPlatform[] = [
  {
    id: 'rhel-fips',
    os: 'RHEL 9 / RHEL 10',
    fipsModule: 'OpenSSL 3.0.7 FIPS Provider (RHEL 9)',
    fipsStatus: 'fips-140-3',
    mlKemInFips: 'no',
    mlDsaInFips: 'no',
    fipsCertDate: '',
    pqcFipsCertTarget:
      'RHEL 10: a FIPS module that includes ML-KEM and ML-DSA is an expectation in this lesson; no validation date is cited',
    hybridStrategy:
      'Run two OpenSSL providers in parallel: fips (for FIPS workloads) + default (for PQC). Use environment variables or application config to route traffic.',
    notes:
      'CMVP certificate #4857 (Red Hat Enterprise Linux 9 - OpenSSL FIPS Provider, FIPS 140-3, Level 1) lists no ML-KEM or ML-DSA among its Approved Algorithms. Whether PQC algorithms are available when FIPS mode is enabled (fips=1 kernel parameter) is not settled by that certificate, so test it on your build. A new RHEL 10 FIPS module that includes ML-KEM and ML-DSA is an expectation in this lesson, not a cited plan or date.',
    commands: `# Check FIPS mode status:
fips-mode-setup --check
# Output: FIPS mode is enabled.

# Enable FIPS mode (RHEL 9):
sudo fips-mode-setup --enable
sudo reboot

# Verify OpenSSL FIPS provider:
openssl list -providers
# fips (version: 3.0.7)

# Attempt ML-KEM in FIPS mode (illustrative output; confirm on your build):
openssl speed ml-kem-768
# openssl: Error loading provider: fips
# ml-kem-768 not in FIPS module

# Workaround: dual-provider config in openssl.cnf
# [provider_sect]
# default = default_sect
# fips = fips_sect
# [default_sect]
# activate = 1
# [fips_sect]
# activate = 1`,
  },
  {
    id: 'ubuntu-fips',
    os: 'Ubuntu 22.04 / 24.04 LTS (Ubuntu Pro)',
    fipsModule: 'FIPS Ubuntu (OpenSSL 3.0.x FIPS module via Ubuntu Pro)',
    fipsStatus: 'fips-140-3',
    mlKemInFips: 'no',
    mlDsaInFips: 'no',
    fipsCertDate: '',
    pqcFipsCertTarget:
      'Ubuntu 26.04 LTS: a FIPS module that includes PQC is an expectation in this lesson; no validation date is cited',
    hybridStrategy:
      'Use Ubuntu Pro FIPS mode for regulated workloads. Run oqsprovider alongside FIPS provider for new PQC services. Separate network segments or containers may be required by compliance auditors.',
    notes:
      'Ubuntu FIPS mode requires Ubuntu Pro subscription. The FIPS 140-3 module (OpenSSL 3.0.x) does not include PQC algorithms. Ubuntu Pro FIPS updates are conservative — PQC will not be added to the 22.04 or 24.04 FIPS modules. A new Ubuntu FIPS module that includes PQC is an expectation in this lesson, not a cited plan or date.',
    commands: `# Ubuntu Pro FIPS setup:
sudo ua attach <Ubuntu Pro token>
sudo ua enable fips
sudo reboot

# Check FIPS status:
ubuntu-advantage status
# fips: enabled

# Check if ML-KEM is available in FIPS mode:
openssl list -providers | grep oqs
# (empty — oqsprovider not available in FIPS mode)

# Install oqsprovider for PQC (non-FIPS workloads):
sudo apt install openssl-oqsprovider

# Configure dual-provider /etc/ssl/openssl.cnf:
# [provider_sect]
# default = default_sect
# fips = fips_sect
# oqs = oqs_sect  # For non-FIPS PQC
# [oqs_sect]
# activate = 1`,
  },
  {
    id: 'windows-fips',
    os: 'Windows Server 2025',
    fipsModule: 'SymCrypt (CNG FIPS 140-3 module, CMVP #5313)',
    fipsStatus: 'fips-140-3',
    mlKemInFips: 'no',
    mlDsaInFips: 'no',
    fipsCertDate:
      'SymCrypt: CMVP certificate #5313 (FIPS 140-3, Level 1, Active, validated 5 June 2026)',
    pqcFipsCertTarget:
      'Certificate #5313 lists no ML-KEM or ML-DSA (the CMVP snapshot shows No PQC Mechanisms Detected); check the CMVP listing for a later certificate.',
    hybridStrategy:
      'ML-KEM and ML-DSA ship in the SymCrypt / CNG stack since November 2025, but the validated SymCrypt certificate lists no PQC mechanisms, and the Microsoft TLS Supported Groups page shows the hybrid groups (x25519_mlkem768, secp256r1_mlkem768, secp384r1_mlkem1024) as not available in FIPS mode (legacy). Check both before enabling them where FIPS mode is required.',
    notes:
      'Windows Server 2025 with KB5068861 (November 2025) adds ML-KEM and ML-DSA API support (FIPS 203/204) to the SymCrypt / CNG cryptographic stack. ML-DSA signing is implemented. The CMVP snapshot shows no ML-KEM or ML-DSA on SymCrypt certificate #5313 (Active); check the CMVP listing for updates.',
    commands: `# Enable FIPS compliance mode (Group Policy):
# Computer Configuration → Windows Settings → Security Settings →
# Local Policies → Security Options:
# "System cryptography: Use FIPS compliant algorithms"

# Or via registry:
Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa\\FipsAlgorithmPolicy" \`
  -Name "Enabled" -Value 1

# Verify ML-KEM in FIPS mode:
# 1. Enable FIPS mode
# 2. Test TLS 1.3 connection — X25519MLKEM768 still negotiated
(New-Object System.Net.WebClient).DownloadString('https://cloudflare.com') > $null
# Capture with Wireshark — verify supported_groups includes X25519MLKEM768

# Check SymCrypt version:
Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion" \`
  | Select-Object CurrentBuild
# SymCrypt version tied to Windows build`,
  },
  {
    id: 'freebsd-fips',
    os: 'FreeBSD 14.x',
    fipsModule: 'No FreeBSD FIPS module is cited in this lesson',
    fipsStatus: 'not-supported',
    mlKemInFips: 'no',
    mlDsaInFips: 'no',
    fipsCertDate:
      'This lesson cites no FIPS 140-3 certificate for the FreeBSD base system; check the CMVP validated modules list',
    pqcFipsCertTarget: 'This lesson cites no FIPS certification roadmap for FreeBSD',
    hybridStrategy:
      'This lesson cites no FreeBSD FIPS module, so it treats FIPS as not constraining here. Use security/oqsprovider port for ML-KEM and ML-DSA. No hybrid strategy needed — PQC and classical algorithms can coexist freely.',
    notes:
      'This lesson cites no CMVP certificate for a FreeBSD crypto module, so it assumes no FIPS compatibility constraint on ML-KEM/ML-DSA deployment here; check the CMVP validated modules list for the current position.',
    commands: `# Install PQC support on FreeBSD:
pkg install openssl-quic oqsprovider

# Or from ports:
cd /usr/ports/security/oqsprovider && make install clean

# Configure /etc/ssl/openssl.cnf for oqsprovider:
# [provider_sect]
# default = default_sect
# oqs = oqs_sect
# [oqs_sect]
# module = /usr/local/lib/ossl-modules/oqsprovider.so
# activate = 1

# Test ML-KEM:
openssl speed ml-kem-768

# Build from source with PQC (alternative):
cd /usr/ports/security/openssl3 && make WITH_PQC=yes install clean`,
  },
]

type FIPSStatusValue = 'yes' | 'no' | 'pending'

const INCLUSION_BADGE: Record<
  FIPSStatusValue,
  { label: string; className: string; icon: React.ReactNode }
> = {
  yes: {
    label: 'In FIPS Module',
    className: 'text-status-success bg-status-success/10 border-status-success/30',
    icon: <CheckCircle size={12} />,
  },
  no: {
    label: 'Not in FIPS',
    className: 'text-status-error bg-status-error/10 border-status-error/30',
    icon: <AlertTriangle size={12} />,
  },
  pending: {
    label: 'Pending Cert',
    className: 'text-status-warning bg-status-warning/10 border-status-warning/30',
    icon: <Clock size={12} />,
  },
}

const FIPS_STATUS_BADGE: Record<FIPSPlatform['fipsStatus'], { label: string; className: string }> =
  {
    'fips-140-3': {
      label: 'FIPS 140-3',
      className: 'text-status-success bg-status-success/10 border-status-success/30',
    },
    'fips-140-2': {
      label: 'FIPS 140-2',
      className: 'text-status-warning bg-status-warning/10 border-status-warning/30',
    },
    pending: {
      label: 'Pending',
      className: 'text-status-info bg-status-info/10 border-status-info/30',
    },
    'not-supported': {
      label: 'No FIPS cited',
      className: 'text-muted-foreground bg-muted border-border',
    },
  }

export const FIPSCompatibilityChecker: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState('All')
  const [expandedId, setExpandedId] = useState<string | null>('rhel-fips')

  const platforms =
    selectedPlatform === 'All'
      ? FIPS_PLATFORMS
      : FIPS_PLATFORMS.filter((p) => p.id === selectedPlatform)

  return (
    <div className="space-y-6">
      {/* FIPS + PQC matrix overview */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">
          FIPS 140-3 + PQC Compatibility Matrix
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  OS Platform
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  FIPS Status
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  ML-KEM in FIPS
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  ML-DSA in FIPS
                </th>
              </tr>
            </thead>
            <tbody>
              {FIPS_PLATFORMS.map((p) => {
                const fipsLabel = FIPS_STATUS_BADGE[p.fipsStatus]
                const mlKemBadge = INCLUSION_BADGE[p.mlKemInFips]
                const mlDsaBadge = INCLUSION_BADGE[p.mlDsaInFips]
                return (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-2 px-2 font-medium text-foreground">{p.os}</td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${fipsLabel.className}`}
                      >
                        {fipsLabel.label}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-bold ${mlKemBadge.className}`}
                      >
                        {mlKemBadge.icon}
                        {mlKemBadge.label}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-bold ${mlDsaBadge.className}`}
                      >
                        {mlDsaBadge.icon}
                        {mlDsaBadge.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 p-3 bg-status-info/5 rounded border border-status-info/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Key insight:</strong> Shipping ML-KEM in an
            operating system library is not the same as having it inside a FIPS 140-3 validated
            module. The Windows SymCrypt certificate (#5313) lists no PQC mechanisms in our CMVP
            snapshot; the Go cryptographic modules that Linux-based platforms build on have FIPS
            140-3 certificates that list ML-KEM (for example #5247), and Apple corecrypto appears
            only at the algorithm-validation (ACVP) level for ML-KEM and ML-DSA. Check the
            validated-module list for your exact platform and version rather than assuming your
            distribution is covered: a distribution shipping an ML-KEM implementation is not the
            same as that implementation being inside a validated module boundary.
          </p>
        </div>
      </div>

      {/* Platform filter */}
      <FilterDropdown
        items={FIPS_PLATFORMS.map((p) => ({ id: p.id, label: p.os }))}
        selectedId={selectedPlatform}
        onSelect={setSelectedPlatform}
        label="Platform"
        defaultLabel="All Platforms"
        noContainer
      />

      {/* Platform detail cards */}
      <div className="space-y-3">
        {platforms.map((platform) => {
          const isExpanded = expandedId === platform.id
          const mlKemBadge = INCLUSION_BADGE[platform.mlKemInFips]
          const mlDsaBadge = INCLUSION_BADGE[platform.mlDsaInFips]
          return (
            <div key={platform.id} className="glass-panel overflow-hidden">
              <Button
                variant="ghost"
                onClick={() => setExpandedId(isExpanded ? null : platform.id)}
                className="h-auto whitespace-normal flex items-center gap-3 w-full p-4 text-left"
              >
                <Shield size={18} className="text-primary shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground">{platform.os}</div>
                  <div className="text-xs text-muted-foreground">{platform.fipsModule}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-bold ${mlKemBadge.className}`}
                  >
                    {mlKemBadge.icon} ML-KEM
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-bold ${mlDsaBadge.className}`}
                  >
                    {mlDsaBadge.icon} ML-DSA
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </div>
              </Button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded p-3 border border-border">
                      <div className="text-[10px] font-bold text-muted-foreground mb-1">
                        FIPS Certification
                      </div>
                      <p className="text-xs text-foreground">{platform.fipsCertDate}</p>
                    </div>
                    <div className="bg-primary/5 rounded p-3 border border-primary/20">
                      <div className="text-[10px] font-bold text-primary mb-1">PQC FIPS Target</div>
                      <p className="text-xs text-foreground">{platform.pqcFipsCertTarget}</p>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded p-3 border border-border">
                    <div className="text-[10px] font-bold text-muted-foreground mb-2">
                      Hybrid FIPS + PQC Strategy
                    </div>
                    <p className="text-xs text-muted-foreground">{platform.hybridStrategy}</p>
                  </div>

                  <p className="text-xs text-muted-foreground">{platform.notes}</p>

                  <pre className="text-[11px] bg-background p-3 rounded border border-border overflow-x-auto font-mono whitespace-pre text-foreground">
                    {platform.commands}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Migration path recommendation */}
      <div className="glass-panel p-4 border-primary/20">
        <div className="text-sm font-bold text-foreground mb-3">
          Recommended Migration Path: FIPS + PQC
        </div>
        <div className="space-y-2">
          {[
            {
              phase: 'Phase 1 (Now)',
              description:
                'Keep FIPS mode enabled for regulated workloads. Deploy Windows Server 2025 for services where ML-KEM TLS is required AND FIPS compliance is needed simultaneously.',
              status: 'current',
            },
            {
              phase: 'Phase 2 (2026-2027)',
              description:
                'Use dual-provider OpenSSL config on Linux: FIPS provider for regulated services, default+oqsprovider for new PQC services. Network segment separation satisfies some auditors.',
              status: 'near',
            },
            {
              phase: 'Phase 3 (no date cited)',
              description:
                'This module’s projection, not a vendor statement: RHEL 10 and Ubuntu 26.04 LTS ship new FIPS modules including ML-KEM and ML-DSA. Upgrade regulated systems to new OS versions. Full FIPS + PQC without dual-provider workaround.',
              status: 'future',
            },
          ].map((phase) => (
            <div
              key={phase.phase}
              className={`p-3 rounded-lg border ${
                phase.status === 'current'
                  ? 'bg-status-success/5 border-status-success/20'
                  : phase.status === 'near'
                    ? 'bg-status-warning/5 border-status-warning/20'
                    : 'bg-muted/30 border-border'
              }`}
            >
              <div className="text-xs font-bold text-foreground mb-1">{phase.phase}</div>
              <p className="text-xs text-muted-foreground">{phase.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
