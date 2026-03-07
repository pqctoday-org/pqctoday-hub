// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Shield, CheckCircle, AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'

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
    fipsCertDate: 'RHEL 9: FIPS 140-3 validated (OpenSSL 3.0.7, see CMVP for current cert)',
    pqcFipsCertTarget: 'RHEL 10: OpenSSL 3.4+ PQC FIPS module — validation target 2026',
    hybridStrategy:
      'Run two OpenSSL providers in parallel: fips (for FIPS workloads) + default (for PQC). Use environment variables or application config to route traffic.',
    notes:
      'RHEL 9 FIPS mode restricts OpenSSL to only FIPS-approved algorithms. ML-KEM and ML-DSA are not in the FIPS 140-3 certificate for RHEL 9. When FIPS mode is enabled (fips=1 kernel param), PQC algorithms are unavailable. RHEL 10 targets a new FIPS module including ML-KEM and ML-DSA pending NIST validation.',
    commands: `# Check FIPS mode status:
fips-mode-setup --check
# Output: FIPS mode is enabled.

# Enable FIPS mode (RHEL 9):
sudo fips-mode-setup --enable
sudo reboot

# Verify OpenSSL FIPS provider:
openssl list -providers
# fips (version: 3.0.7)

# Attempt ML-KEM in FIPS mode — will fail:
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
    fipsCertDate: 'Ubuntu 22.04: FIPS 140-3 validated (OpenSSL 3.0.2, see CMVP for current cert)',
    pqcFipsCertTarget: 'Ubuntu 26.04 LTS: PQC FIPS module planned (2028 target)',
    hybridStrategy:
      'Use Ubuntu Pro FIPS mode for regulated workloads. Run oqsprovider alongside FIPS provider for new PQC services. Separate network segments or containers may be required by compliance auditors.',
    notes:
      'Ubuntu FIPS mode requires Ubuntu Pro subscription. The FIPS 140-3 module (OpenSSL 3.0.x) does not include PQC algorithms. Ubuntu Pro FIPS updates are conservative — PQC will not be added to the 22.04 or 24.04 FIPS modules. New PQC FIPS module planned for Ubuntu 26.04 LTS timeline.',
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
    fipsModule: 'SymCrypt 103.4.0 (CNG FIPS 140-3 module)',
    fipsStatus: 'fips-140-3',
    mlKemInFips: 'yes',
    mlDsaInFips: 'pending',
    fipsCertDate: 'Windows Server 2025: SymCrypt FIPS 140-3 validated (see CMVP for current cert)',
    pqcFipsCertTarget:
      'ML-KEM-768 included in SymCrypt FIPS cert. ML-DSA FIPS validation for SymCrypt 104.x target 2026.',
    hybridStrategy:
      'Windows Server 2025 is the most advanced — ML-KEM is in the FIPS-validated SymCrypt module. Enable FIPS compliance mode via Group Policy; ML-KEM TLS 1.3 hybrid (X25519MLKEM768) works in FIPS mode.',
    notes:
      'Windows Server 2025 with KB5036893 includes ML-KEM-768 in the FIPS 140-3 validated SymCrypt module. This makes Windows Server 2025 the first major OS platform with FIPS-validated PQC. ML-DSA signing in SymCrypt is implemented but awaiting FIPS 140-3 certificate update (expected 2026).',
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
    fipsModule: 'No official FIPS module (ports: openssl-fips)',
    fipsStatus: 'not-supported',
    mlKemInFips: 'no',
    mlDsaInFips: 'no',
    fipsCertDate: 'No FIPS 140-3 certification for FreeBSD base system',
    pqcFipsCertTarget: 'No FIPS certification roadmap; community ports only',
    hybridStrategy:
      'FreeBSD has no FIPS constraint. Use security/oqsprovider port for ML-KEM and ML-DSA. No hybrid strategy needed — PQC and classical algorithms can coexist freely.',
    notes:
      'FreeBSD does not maintain a FIPS 140-3 certified crypto module. Organizations requiring FIPS on FreeBSD typically use third-party validated modules. For PQC, this is an advantage — no FIPS compatibility constraint blocks ML-KEM/ML-DSA deployment. Install security/oqsprovider from ports for full PQC support.',
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
      label: 'No FIPS',
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
            <strong className="text-foreground">Key insight:</strong> Windows Server 2025 (SymCrypt
            103.4.0) is currently the only major OS platform with ML-KEM in a FIPS 140-3 validated
            module. All Linux distributions are pending new FIPS certifications that include PQC
            algorithms.
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
              <button
                onClick={() => setExpandedId(isExpanded ? null : platform.id)}
                className="flex items-center gap-3 w-full p-4 text-left"
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
              </button>

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
              phase: 'Phase 3 (2027-2028)',
              description:
                'RHEL 10 and Ubuntu 26.04 LTS ship new FIPS modules including ML-KEM and ML-DSA. Upgrade regulated systems to new OS versions. Full FIPS + PQC without dual-provider workaround.',
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
