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
  mlKemInFips: 'yes' | 'no' | 'pending' | 'unknown'
  mlDsaInFips: 'yes' | 'no' | 'pending' | 'unknown'
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

# Check which active providers offer ML-KEM (it is listed only when one does):
openssl list -kem-algorithms | grep -i ml-kem

# Check the group a real connection negotiates (look for the
# "Negotiated TLS1.3 group" line):
openssl s_client -groups X25519MLKEM768 -brief -connect host.example:443 </dev/null

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
    fipsModule:
      'Ubuntu OpenSSL Cryptographic Module via Ubuntu Pro (CMVP #4794 for 22.04, #5115 for 24.04)',
    fipsStatus: 'fips-140-3',
    mlKemInFips: 'no',
    mlDsaInFips: 'no',
    fipsCertDate:
      'CMVP #4794: Ubuntu 22.04 OpenSSL Cryptographic Module (FIPS 140-3, Level 1, Active, initial validation 11 September 2024, OpenSSL 3.0.5-based). CMVP #5115: Ubuntu 24.04 OpenSSL Cryptographic Module (FIPS 140-3, Active, initial validation 6 January 2026). A certificate applies when the module is operated in approved mode as its Security Policy specifies.',
    pqcFipsCertTarget:
      'Ubuntu 26.04 LTS: a FIPS module that includes PQC is an expectation in this lesson; no validation date is cited',
    hybridStrategy:
      'Use Ubuntu Pro FIPS mode for regulated workloads. Whether a separate PQC provider such as oqsprovider may run next to the FIPS provider is not settled here: this lesson cites no Ubuntu package for it, so ask your assessor. Separate network segments or containers may be required by compliance auditors.',
    notes:
      'Ubuntu FIPS mode requires an Ubuntu Pro token (Canonical: free for up to five machines). The 22.04 FIPS 140-3 module (#4794) is based on OpenSSL 3.0.5, and Ubuntu 24.04 ships OpenSSL 3.0.13; OpenSSL 3.0 predates the PQC algorithms added in OpenSSL 3.5.0 (April 2025), so this lesson does not expect ML-KEM or ML-DSA in either module and cites no plan to add them to the 22.04 or 24.04 FIPS modules. A new Ubuntu FIPS module that includes PQC is an expectation in this lesson, not a cited plan or date.',
    commands: `# Ubuntu Pro FIPS setup (Canonical recommends the fips-updates stream;
# --no-auto-enable keeps Livepatch, which cannot run with FIPS, from enabling):
sudo pro attach <Ubuntu Pro token> --no-auto-enable
sudo pro enable fips-updates
sudo reboot

# Check FIPS status (a value of 1 means FIPS mode is active):
sudo pro status --all
cat /proc/sys/crypto/fips_enabled

# Check which providers are active and whether any offers ML-KEM:
openssl list -providers
openssl list -kem-algorithms | grep -i ml-kem

# oqsprovider comes from the Open Quantum Safe project. This lesson cites
# no Ubuntu package for it: check your release's archive or build it from
# the project's source. Whether it may be loaded next to the FIPS provider
# in an approved configuration is not settled here; ask your assessor.

# Dual-provider /etc/ssl/openssl.cnf sketch:
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
    fipsModule: 'Microsoft SymCrypt Cryptographic Library (FIPS 140-3, CMVP #5313)',
    fipsStatus: 'fips-140-3',
    mlKemInFips: 'no',
    mlDsaInFips: 'no',
    fipsCertDate:
      'SymCrypt: CMVP certificate #5313 (FIPS 140-3, Level 1, Active, initial validation 5 June 2026). The certificate applies when the module is operated in approved mode; its Security Policy lists the tested operational environments, which this lesson has not matched to a specific Windows Server 2025 build.',
    pqcFipsCertTarget:
      'Certificate #5313 lists no ML-KEM or ML-DSA (the CMVP snapshot shows No PQC Mechanisms Detected); check the CMVP listing for a later certificate.',
    hybridStrategy:
      'Treat hybrid ML-KEM TLS and FIPS-validated operation as two separate questions on Windows. ML-KEM and ML-DSA APIs ship in the SymCrypt / CNG stack since November 2025, but certificate #5313 lists no PQC mechanisms, and the Microsoft TLS Supported Groups page shows the hybrid groups (x25519_mlkem768, secp256r1_mlkem768, secp384r1_mlkem1024) as supported but not enabled by default, with "Available in FIPS mode (legacy)" set to No. Microsoft\'s TLS and post-quantum FAQ says regulated environments should use a hybrid group and implementation permitted by the applicable policy and validated cryptographic module, which may mean SecP256r1_MLKEM768 or SecP384r1_MLKEM1024 rather than X25519_MLKEM768. Until the exact module, approved algorithm and operational environment are shown to include the group you negotiate, the position is unresolved, not compliant.',
    notes:
      'Windows Server 2025 with KB5068861 (November 2025) adds API support for ML-KEM and ML-DSA (FIPS 203/204) through CNG and .NET, building on the PQC algorithms in SymCrypt. The CMVP snapshot shows no ML-KEM or ML-DSA on SymCrypt certificate #5313 (Active); check the CMVP listing for updates. Microsoft also states that the legacy FIPS mode setting is no longer recommended or required to operate with FIPS approval: using FIPS-approved algorithms is the only configuration needed.',
    commands: `# 1. Record the OS build, then compare it with the tested operational
#    environments in the Security Policy of certificate #5313:
Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion" \`
  | Select-Object CurrentBuild

# 2. List the groups the TLS stack reports for this computer (Microsoft
#    lists the ML-KEM hybrid groups as supported but disabled by default):
Get-TlsEccCurve

# 3. Enable the group you intend to test, at the top of the list
#    (a Group Policy "ECC Curve Order" setting overrides this cmdlet):
Enable-TlsEccCurve -Name "X25519_MLKEM768" -Position 0

# 4. Capture a real connection and read the group the server selected:
#    Wireshark filter tls.handshake.extensions_key_share_group
#    The ServerHello key_share names the single group chosen for the
#    exchange (RFC 8446, section 4.2.8). A ClientHello that merely
#    offers a hybrid group does not show what was negotiated.

# 5. If the capture shows a hybrid group, that still does not make it
#    validated: certificate #5313 lists no ML-KEM, so keep the position
#    "unresolved" until your assessor accepts a specific module.`,
  },
  {
    id: 'freebsd-fips',
    os: 'FreeBSD 14.x',
    fipsModule: 'No FreeBSD FIPS module is cited in this lesson',
    fipsStatus: 'not-supported',
    mlKemInFips: 'unknown',
    mlDsaInFips: 'unknown',
    fipsCertDate:
      'This lesson cites no FIPS 140-3 certificate for the FreeBSD base system; check the CMVP validated modules list',
    pqcFipsCertTarget: 'This lesson cites no FIPS certification roadmap for FreeBSD',
    hybridStrategy:
      'This lesson cites no FreeBSD FIPS module, so the FIPS position here is unresolved, not unconstrained. If your policy requires a validated module, identify the exact module, its approved algorithms and its operational environment on the CMVP list before deploying ML-KEM or ML-DSA. The security/openssl-oqsprovider port provides PQC algorithms; this lesson does not claim that it, or any other ML-KEM implementation, sits inside a validated module boundary.',
    notes:
      'This lesson cites no CMVP certificate for a FreeBSD crypto module, so whether ML-KEM or ML-DSA can be used here within a FIPS requirement is not verified. Check the CMVP validated modules list for the exact module, its approved algorithms and its tested operational environments.',
    commands: `# Install PQC support on FreeBSD (package or port name: openssl-oqsprovider):
pkg install openssl-oqsprovider

# Or from ports:
cd /usr/ports/security/openssl-oqsprovider && make install clean

# Configure /etc/ssl/openssl.cnf for oqsprovider:
# [provider_sect]
# default = default_sect
# oqs = oqs_sect
# [oqs_sect]
# module = /usr/local/lib/ossl-modules/oqsprovider.so
# activate = 1

# Check that a provider offers ML-KEM (it is listed only when one does):
openssl list -kem-algorithms | grep -i ml-kem

# Check the group a real connection negotiates (look for the
# "Negotiated TLS1.3 group" line):
openssl s_client -groups X25519MLKEM768 -brief -connect host.example:443 </dev/null`,
  },
]

type FIPSStatusValue = 'yes' | 'no' | 'pending' | 'unknown'

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
  unknown: {
    label: 'Not verified',
    className: 'text-muted-foreground bg-muted border-border',
    icon: <Shield size={12} />,
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
            snapshot, whereas the Go Cryptographic Module (certificate #5247, a library for Go
            applications rather than an operating system) lists ML-KEM key generation and
            encapsulation/decapsulation. Check the validated-module list for your exact module,
            approved algorithm and operational environment rather than assuming your platform is
            covered: a platform shipping an ML-KEM implementation is not the same as that
            implementation being inside a validated module boundary, and a module with no cited
            certificate stays unresolved, not unconstrained.
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
                'Keep FIPS-approved algorithms for regulated workloads. Where a regulated service also wants ML-KEM TLS, the recommendation depends on three things you must show for your exact deployment: the validated module (its Security Policy and tested operational environment), that ML-KEM is among that module’s approved algorithms, and which group a real connection negotiates. For Windows Server 2025 and SymCrypt certificate #5313 the CMVP snapshot lists no ML-KEM, so this lesson does not recommend it for services that need both; treat that combination as unresolved until a certificate says otherwise.',
              status: 'current',
            },
            {
              phase: 'Phase 2 (no date cited)',
              description:
                'This module’s advice, not a vendor statement: where your assessor accepts PQC services outside the validated boundary, use a dual-provider OpenSSL config on Linux: FIPS provider for regulated services, default+oqsprovider for new PQC services. Whether network segment separation is acceptable is the assessor’s decision.',
              status: 'near',
            },
            {
              phase: 'Phase 3 (no date cited)',
              description:
                'This module’s projection, not a vendor statement: RHEL 10 and Ubuntu 26.04 LTS ship new FIPS modules including ML-KEM and ML-DSA. If that happens, confirm on the CMVP list that the certificate for your exact module, version and environment includes the algorithm before dropping the dual-provider workaround.',
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
