// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import { ISOLATED_OPENSSL_CONFIG, OPENSSL_CONFIG_PROBE } from '../data/tlsProbeCommands'

type OSSelection = 'rhel' | 'ubuntu' | 'windows'

interface TLSCipherEntry {
  name: string
  quantumSafe: boolean
  enabled: boolean
  note?: string
}

interface OSConfig {
  id: OSSelection
  label: string
  currentPolicy: string
  pqcPolicy: string
  configFile: string
  currentCiphers: TLSCipherEntry[]
  pqcCiphers: TLSCipherEntry[]
  beforeConfig: string
  afterConfig: string
  impactNote: string
  compatNote: string
}

const OS_CONFIGS: Record<OSSelection, OSConfig> = {
  rhel: {
    id: 'rhel',
    label: 'RHEL 9.7 / 10.1+',
    currentPolicy: 'DEFAULT',
    pqcPolicy: 'DEFAULT:PQ on RHEL 9.7; the DEFAULT policy on RHEL 10.1 and later',
    configFile: '/etc/crypto-policies/config',
    currentCiphers: [
      { name: 'TLS_AES_256_GCM_SHA384', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      { name: 'TLS_AES_128_GCM_SHA256', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      { name: 'ECDHE-RSA-AES256-GCM-SHA384', quantumSafe: false, enabled: true, note: 'TLS 1.2' },
      { name: 'ECDHE-RSA-AES128-GCM-SHA256', quantumSafe: false, enabled: true, note: 'TLS 1.2' },
      { name: 'ECDHE-ECDSA-AES256-GCM-SHA384', quantumSafe: false, enabled: true, note: 'TLS 1.2' },
      { name: 'DHE-RSA-AES256-GCM-SHA384', quantumSafe: false, enabled: true, note: 'TLS 1.2' },
    ],
    pqcCiphers: [
      {
        name: 'X25519MLKEM768 (hybrid KEM group)',
        quantumSafe: true,
        enabled: true,
        note: 'TLS 1.3 KEM group',
      },
      { name: 'TLS_AES_256_GCM_SHA384', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      { name: 'TLS_AES_128_GCM_SHA256', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      { name: 'ECDHE-RSA-AES256-GCM-SHA384', quantumSafe: false, enabled: true, note: 'TLS 1.2' },
      { name: 'ECDHE-RSA-AES128-GCM-SHA256', quantumSafe: false, enabled: true, note: 'TLS 1.2' },
      { name: 'ECDHE-ECDSA-AES256-GCM-SHA384', quantumSafe: false, enabled: true, note: 'TLS 1.2' },
      { name: 'DHE-RSA-AES256-GCM-SHA384', quantumSafe: false, enabled: true, note: 'TLS 1.2' },
    ],
    beforeConfig: `# RHEL 9.7: inspect the policy in a new shell/process.
update-crypto-policies --show
# DEFAULT before the PQ subpolicy is enabled.

${OPENSSL_CONFIG_PROBE}
# Read the negotiated group, not the ClientHello offer. The peer also
# determines the result; DEFAULT alone is not proof of any particular group.
# RHEL 10.1+ DEFAULT already prefers hybrid groups in supported libraries.`,
    afterConfig: `# RHEL 9.7, elevated shell: enable the documented PQ subpolicy.
update-crypto-policies --set DEFAULT:PQ
update-crypto-policies --show
# Expected policy: DEFAULT:PQ
# Restart the sample service/application so it reads the new policy.

${OPENSSL_CONFIG_PROBE}
# No -groups override: this checks the configuration loaded by a new process.
# X25519MLKEM768 means hybrid key establishment for this successful TLS 1.3
# connection; X25519 alone is a classical fallback, not a hybrid success.
# On RHEL 10.1 and later no policy change is needed for applications that use
# OpenSSL, GnuTLS, NSS or Go. Check each application's actual negotiation.`,
    impactNote:
      'On RHEL 10.1 and later the DEFAULT policy applies to applications that use OpenSSL, GnuTLS, NSS or Go; on RHEL 9.7, DEFAULT:PQ applies to applications based on OpenSSL or NSS. The mechanism is hybrid key-exchange groups in TLS 1.3, not new cipher suites.',
    compatNote:
      'Each application also has to use the library setting that offers the hybrid group, so check applications one by one and confirm with a test connection that the negotiated group is hybrid. A library version number alone does not prove enabled groups or policy integration. A completed connection must confirm the selected group; TLS 1.3 cipher suites describe symmetric protection separately.',
  },
  ubuntu: {
    id: 'ubuntu',
    label: 'Ubuntu 24.04 / 26.04 LTS',
    currentPolicy: 'DEFAULT (OpenSSL system config)',
    pqcPolicy:
      'x25519mlkem768 group via /etc/ssl/openssl.cnf, which needs OpenSSL 3.5.0 or later (Ubuntu 26.04 LTS; Ubuntu 24.04 LTS ships OpenSSL 3.0.13)',
    configFile: '/etc/ssl/openssl.cnf',
    currentCiphers: [
      { name: 'TLS_AES_256_GCM_SHA384', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      { name: 'TLS_AES_128_GCM_SHA256', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      { name: 'TLS_CHACHA20_POLY1305_SHA256', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      { name: 'ECDHE-RSA-AES256-GCM-SHA384', quantumSafe: false, enabled: true, note: 'TLS 1.2' },
      { name: 'ECDHE-ECDSA-AES256-GCM-SHA384', quantumSafe: false, enabled: true, note: 'TLS 1.2' },
      {
        name: 'x25519 (default KEM group)',
        quantumSafe: false,
        enabled: true,
        note: 'TLS 1.3 group',
      },
    ],
    pqcCiphers: [
      {
        name: 'x25519mlkem768 (hybrid KEM group)',
        quantumSafe: true,
        enabled: true,
        note: 'TLS 1.3 group; OpenSSL 3.5.0 or later only',
      },
      { name: 'x25519 (fallback)', quantumSafe: false, enabled: true, note: 'Classical fallback' },
      { name: 'TLS_AES_256_GCM_SHA384', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      { name: 'TLS_AES_128_GCM_SHA256', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      { name: 'TLS_CHACHA20_POLY1305_SHA256', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      {
        name: 'ECDHE-RSA-AES256-GCM-SHA384',
        quantumSafe: false,
        enabled: true,
        note: 'TLS 1.2 retained',
      },
    ],
    beforeConfig: `# Ubuntu 24.04 LTS ships OpenSSL 3.0.13: no native ML-KEM group.
openssl version -a

${OPENSSL_CONFIG_PROBE}
# Inspect the selected group. A TLS_AES_* cipher suite does not establish
# hybrid key exchange. Ubuntu 26.04 LTS ships OpenSSL 3.5.5.`,
    afterConfig: `# Ubuntu 26.04 / OpenSSL 3.5.0+; confirm the actual loaded build first.
openssl version -a
# In /etc/ssl/openssl.cnf, update the already-connected system_default
# section: Groups = x25519mlkem768:x25519:prime256v1:secp384r1
# Merely adding an unreferenced section does not activate it.
# Restart the sample service after a system config change:
# sudo systemctl restart your-sample-service.service

# Alternatively test the same group list in an isolated sample process:
${ISOLATED_OPENSSL_CONFIG}

${OPENSSL_CONFIG_PROBE}
# No -groups override: X25519MLKEM768 is a hybrid result only after the
# handshake and certificate/hostname checks succeed. X25519 is fallback.
# The isolated OPENSSL_CONF affects this shell's new processes only.
# After the sample: unset OPENSSL_CONF`,
    impactNote:
      'Keeping classical groups permits fallback for peers without the hybrid group; test peer and middlebox compatibility rather than assuming it. Each process reads openssl.cnf when it starts, so restart the services that need the new group.',
    compatNote:
      'Ubuntu 24.04 LTS ships OpenSSL 3.0.13, which has no ML-KEM and no x25519mlkem768 group, so this change does not apply there. Ubuntu 26.04 LTS ships OpenSSL 3.5.5, which has ML-KEM, ML-DSA and SLH-DSA built in, and OpenSSL 3.5.0 makes X25519MLKEM768 the first entry of its default TLS group list. The Ubuntu package archive has no oqs provider package for 24.04 or 26.04, so on 24.04 the route is an upgrade to 26.04 LTS or an OpenSSL 3.5.0 or later build from outside the archive.',
  },
  windows: {
    id: 'windows',
    label: 'Windows Server 2025',
    currentPolicy: 'TLS 1.3 Default (PQC hybrid disabled)',
    pqcPolicy:
      'x25519_mlkem768 enabled via Group Policy / TLS cmdlets (available from KB5089573 / KB5099536)',
    configFile: 'Group Policy: Network > SSL Configuration Settings > ECC Curve Order',
    currentCiphers: [
      {
        name: 'x25519_mlkem768 (hybrid)',
        quantumSafe: true,
        enabled: false,
        note: 'TLS 1.3 — available from KB5089573 / KB5099536, disabled by default',
      },
      { name: 'TLS_AES_256_GCM_SHA384', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      { name: 'TLS_AES_128_GCM_SHA256', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      { name: 'TLS_CHACHA20_POLY1305_SHA256', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      {
        name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
        quantumSafe: false,
        enabled: true,
        note: 'TLS 1.2',
      },
      {
        name: 'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
        quantumSafe: false,
        enabled: true,
        note: 'TLS 1.2',
      },
    ],
    pqcCiphers: [
      {
        name: 'x25519_mlkem768 (hybrid)',
        quantumSafe: true,
        enabled: true,
        note: 'Priority 0 — TLS 1.3',
      },
      { name: 'TLS_AES_256_GCM_SHA384', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      { name: 'TLS_AES_128_GCM_SHA256', quantumSafe: true, enabled: true, note: 'TLS 1.3' },
      {
        name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
        quantumSafe: false,
        enabled: false,
        note: 'Can be removed',
      },
      {
        name: 'TLS_RSA_WITH_AES_256_GCM_SHA384',
        quantumSafe: false,
        enabled: false,
        note: 'Disabled by policy',
      },
      {
        name: 'TLS_RSA_WITH_3DES_EDE_CBC_SHA',
        quantumSafe: false,
        enabled: false,
        note: 'Disabled',
      },
    ],
    beforeConfig: `# Check current Schannel TLS configuration:
Get-TlsCipherSuite | Select-Object Name, Exchange | Format-Table

Name                                      Exchange
----                                      --------
TLS_AES_256_GCM_SHA384                    (null)
TLS_AES_128_GCM_SHA256                    (null)
TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384    ECDH

# Check the ECC Curve Order Group Policy (Computer Configuration > Administrative Templates >
#   Network > SSL Configuration Settings) for the group strings in effect.`,
    afterConfig: `# Hybrid ML-KEM groups: Windows 11 update KB5089573, Windows Server 2025 update KB5099536 (14 July 2026).
# x25519_mlkem768 is DISABLED by default and must be enabled explicitly.

# Enable via Group Policy:
# Computer Configuration > Administrative Templates > Network >
#   SSL Configuration Settings > ECC Curve Order
# Add x25519_mlkem768 to the curve order list.

# Or enable via TLS cmdlets:
# Group string from the Microsoft TLS Supported Groups page; confirm the cmdlet accepts it on your build.
Enable-TlsEccCurve -Name "x25519_mlkem768" -Position 0
# (ML-KEM is negotiated as a TLS 1.3 key-exchange group, not a cipher suite)

# In an elevated sample terminal, start capture BEFORE the fresh connection:
netsh trace start capture=yes report=disabled tracefile=tls-sample.etl
if ($LASTEXITCODE -ne 0) { throw "Trace did not start" }
try {
  (New-Object System.Net.WebClient).DownloadString('https://cloudflare.com') > $null
} finally {
  netsh trace stop
}
# Decode the captured TLS handshake with your packet-analysis tool.
# Require a successful, fresh TLS 1.3 handshake and the final ServerHello
# key_share selected group X25519MLKEM768 (0x11ec); a ClientHello
# supported_groups offer alone is NOT evidence of hybrid negotiation.
# A successful classical fallback or TLS 1.2 connection is not a hybrid pass.
# The capture file itself is not an automated group-verification result.

# Optional TLS 1.2 server disablement (advanced — test compatibility first):
# TLS 1.3 alone is NOT PQC-only; a classical TLS 1.3 group can still be selected.
$regPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.2\\Server"
New-Item -Force -Path $regPath
Set-ItemProperty -Path $regPath -Name "Enabled" -Value 0 -Type DWord

# Inspect provider inventory separately (not an ML-KEM algorithm or TLS test):
certutil -csplist`,
    impactNote:
      'Schannel hybrid key exchange (x25519_mlkem768) is available from KB5089573 (Windows 11) and KB5099536 (Windows Server 2025, 14 July 2026) and is documented as disabled by default — it requires explicit enablement via Group Policy or TLS cmdlets. The CNG PQC APIs for ML-KEM and ML-DSA are GA since November 2025; SLH-DSA is not implemented by the default CNG provider.',
    compatNote:
      'Applications that bypass Schannel and use OpenSSL directly (e.g., Python, Node.js, some Java apps) require separate OpenSSL configuration. WinHTTP and .NET HttpClient use Schannel automatically.',
  },
}

const OS_FILTER_ITEMS = [
  { id: 'rhel', label: 'RHEL 9.7 / 10.1+' },
  { id: 'ubuntu', label: 'Ubuntu 24.04 / 26.04 LTS' },
  { id: 'windows', label: 'Windows Server 2025' },
]

export const SystemTLSConfigurator: React.FC = () => {
  const [selectedOS, setSelectedOS] = useState<OSSelection>('rhel')
  const [showAfter, setShowAfter] = useState(false)

  const config = useMemo(() => OS_CONFIGS[selectedOS], [selectedOS])

  return (
    <div className="space-y-6">
      {/* OS Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Select OS:</span>
        <FilterDropdown
          items={OS_FILTER_ITEMS}
          selectedId={selectedOS}
          onSelect={(id) => {
            if (id !== 'All') setSelectedOS(id as OSSelection)
          }}
          defaultLabel="Select OS"
          noContainer
        />
      </div>

      {/* Current vs PQC policy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-4">
          <div className="text-xs font-bold text-muted-foreground uppercase mb-2">
            Current Policy
          </div>
          <div className="text-sm font-bold text-foreground">{config.currentPolicy}</div>
          <div className="text-xs text-muted-foreground mt-1">Config: {config.configFile}</div>
        </div>
        <div className="glass-panel p-4 border-primary/20">
          <div className="text-xs font-bold text-primary uppercase mb-2">PQC Target Policy</div>
          <div className="text-sm font-bold text-foreground">{config.pqcPolicy}</div>
          <div className="text-xs text-muted-foreground mt-1">Config: {config.configFile}</div>
        </div>
      </div>

      {/* Cipher/KEM group comparison */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">
          TLS Cipher &amp; KEM Group Priority List
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-bold text-muted-foreground mb-2">Current (Classical)</div>
            <div className="space-y-1">
              {config.currentCiphers.map((cipher) => (
                <div
                  key={cipher.name}
                  className="flex items-center gap-2 text-xs p-2 rounded bg-muted/30 border border-border"
                >
                  {cipher.quantumSafe ? (
                    <CheckCircle size={12} className="text-status-success shrink-0" />
                  ) : (
                    <AlertTriangle size={12} className="text-status-warning shrink-0" />
                  )}
                  <span className="font-mono text-foreground truncate">{cipher.name}</span>
                  {cipher.note && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {cipher.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-primary mb-2">After PQC Migration</div>
            <div className="space-y-1">
              {config.pqcCiphers.map((cipher) => (
                <div
                  key={cipher.name}
                  className={`flex items-center gap-2 text-xs p-2 rounded border ${
                    cipher.enabled
                      ? cipher.quantumSafe
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted/30 border-border'
                      : 'bg-muted/10 border-border/30 opacity-50'
                  }`}
                >
                  {cipher.enabled ? (
                    cipher.quantumSafe ? (
                      <CheckCircle size={12} className="text-status-success shrink-0" />
                    ) : (
                      <AlertTriangle size={12} className="text-status-warning shrink-0" />
                    )
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-border shrink-0" />
                  )}
                  <span
                    className={`font-mono truncate ${cipher.enabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}
                  >
                    {cipher.name}
                  </span>
                  {cipher.note && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {cipher.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Before / After config toggle */}
      <div className="glass-panel p-4">
        <Button
          variant="ghost"
          onClick={() => setShowAfter((prev) => !prev)}
          className="h-auto whitespace-normal flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-bold text-foreground">
            {showAfter ? 'After: PQC Configuration' : 'Before: Current Configuration'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary">{showAfter ? 'Show Before' : 'Show After'}</span>
            {showAfter ? (
              <ChevronUp size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            )}
          </div>
        </Button>
        <pre
          aria-label="TLS configuration commands"
          className="mt-3 text-[11px] bg-background p-4 rounded border border-border overflow-x-auto font-mono whitespace-pre leading-relaxed text-foreground"
        >
          {showAfter ? config.afterConfig : config.beforeConfig}
        </pre>
      </div>

      {/* Impact notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-status-warning/5 rounded-lg p-4 border border-status-warning/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-status-warning shrink-0" />
            <span className="text-xs font-bold text-foreground">Compatibility Impact</span>
          </div>
          <p className="text-xs text-muted-foreground">{config.impactNote}</p>
        </div>
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground">Migration Note</span>
          </div>
          <p className="text-xs text-muted-foreground">{config.compatNote}</p>
        </div>
      </div>
    </div>
  )
}
