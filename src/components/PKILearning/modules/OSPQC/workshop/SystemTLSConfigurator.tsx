// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'

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
    label: 'RHEL / CentOS Stream',
    currentPolicy: 'DEFAULT',
    pqcPolicy: 'FUTURE',
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
      {
        name: 'ECDHE-RSA-AES256-GCM-SHA384',
        quantumSafe: false,
        enabled: false,
        note: 'Disabled in FUTURE policy',
      },
      {
        name: 'ECDHE-RSA-AES128-GCM-SHA256',
        quantumSafe: false,
        enabled: false,
        note: 'Disabled in FUTURE policy',
      },
      {
        name: 'DHE-RSA-AES256-GCM-SHA384',
        quantumSafe: false,
        enabled: false,
        note: 'Disabled in FUTURE policy',
      },
    ],
    beforeConfig: `# Current: /etc/crypto-policies/config
DEFAULT

# Active profile (check with):
$ update-crypto-policies --show
DEFAULT

# TLS groups active (OpenSSL):
$ openssl s_client -connect example.com:443 2>&1 | grep "Server Temp Key"
Server Temp Key: X25519, 253 bits
# (no ML-KEM hybrid — classical only)`,
    afterConfig: `# After: Enable FUTURE policy
$ update-crypto-policies --set FUTURE
Setting system policy to FUTURE
Note: System restart required for kernel settings

# Verify:
$ update-crypto-policies --show
FUTURE

# TLS groups active after change:
$ openssl s_client -connect pqc-enabled-server.com:443 \\
  -groups x25519mlkem768:x25519:P-256 2>&1 | grep "Server Temp Key"
Server Temp Key: X25519MLKEM768, 1152 bits
# (hybrid ML-KEM-768 + X25519 — quantum-safe!)

# For PQC-only subpolicy (RHEL 10 experimental):
$ update-crypto-policies --set FUTURE:PQCONLY`,
    impactNote:
      'FUTURE policy enables TLS 1.3-only, disables TLS 1.2, SHA-1, and weak DH. Applications using TLS 1.2-only connections will fail — test before deploying.',
    compatNote:
      'Legacy applications compiled against OpenSSL < 3.x may not support TLS 1.3 or ML-KEM groups. Use the DEFAULT:HARDEN-LEGACY subpolicy for gradual migration.',
  },
  ubuntu: {
    id: 'ubuntu',
    label: 'Ubuntu 24.04 LTS',
    currentPolicy: 'DEFAULT (OpenSSL system config)',
    pqcPolicy: 'ML-KEM hybrid groups via /etc/ssl/openssl.cnf',
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
        note: 'TLS 1.3 group — new!',
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
    beforeConfig: `# /etc/ssl/openssl.cnf — current (default Ubuntu 24.04)
[system_default_sect]
MinProtocol = TLSv1.2
CipherString = DEFAULT@SECLEVEL=2

# Check active groups:
$ openssl s_client -connect example.com:443 2>&1 | grep "Server Temp Key"
Server Temp Key: X25519, 253 bits`,
    afterConfig: `# /etc/ssl/openssl.cnf — after PQC hybrid config
[system_default_sect]
MinProtocol = TLSv1.2
CipherString = DEFAULT@SECLEVEL=2
Groups = x25519mlkem768:x25519:prime256v1:secp384r1

# Apply (no restart needed — OpenSSL reads config per-process):
$ openssl version -d
OPENSSLDIR: "/usr/lib/ssl"

# Verify hybrid negotiation:
$ openssl s_client -connect cloudflare.com:443 \\
  -groups x25519mlkem768:x25519 2>&1 | grep "Server Temp Key"
Server Temp Key: X25519MLKEM768, 1152 bits

# For oqsprovider (additional PQC algorithms):
$ sudo apt install -y openssl-oqsprovider
$ openssl list -providers
  oqs  (version: 0.7.0)
  default  (version: 3.2.0)`,
    impactNote:
      'Adding x25519mlkem768 as the preferred group has minimal compatibility impact — TLS 1.3 peers that do not support ML-KEM will fall back to x25519. No application restarts required.',
    compatNote:
      'OpenSSL 3.2 on Ubuntu 24.04 supports x25519mlkem768 natively. For ML-DSA certificates, install oqsprovider or upgrade to OpenSSL 3.5+ (Ubuntu 25.10+).',
  },
  windows: {
    id: 'windows',
    label: 'Windows Server 2025',
    currentPolicy: 'TLS 1.3 Default (KB5036893)',
    pqcPolicy: 'X25519MLKEM768 enabled by default post-KB5036893',
    configFile: 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Cryptography\\Configuration',
    currentCiphers: [
      {
        name: 'X25519MLKEM768 (hybrid)',
        quantumSafe: true,
        enabled: true,
        note: 'TLS 1.3 — Windows 2025',
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
        name: 'X25519MLKEM768 (hybrid)',
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

# Check if ML-KEM is available:
Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Cryptography\\Configuration\\Local\\SSL\\00010003" | Select-Object Functions`,
    afterConfig: `# Windows Server 2025 + KB5036893:
# X25519MLKEM768 is enabled by default in TLS 1.3

# Verify ML-KEM negotiation:
(New-Object System.Net.WebClient).DownloadString('https://cloudflare.com') > $null
netsh trace start capture=yes
# (Check trace for X25519MLKEM768 in ClientHello supported_groups)

# Explicitly prioritize X25519MLKEM768:
Set-TlsCipherSuite -Name "TLS_AES_256_GCM_SHA384" -Position 0
# (ML-KEM is a KEM group, not a cipher suite — configured via registry)

# Disable TLS 1.2 for PQC-only mode (advanced — test compatibility first):
$regPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.2\\Server"
New-Item -Force -Path $regPath
Set-ItemProperty -Path $regPath -Name "Enabled" -Value 0 -Type DWord

# Verify post-KB5036893 SymCrypt ML-KEM support:
certutil -csplist | findstr /i "ml-kem"`,
    impactNote:
      'KB5036893 enables X25519MLKEM768 by default — no manual configuration needed on Windows Server 2025. Verify your .NET applications and legacy Win32 apps use Schannel and will inherit this setting.',
    compatNote:
      'Applications that bypass Schannel and use OpenSSL directly (e.g., Python, Node.js, some Java apps) require separate OpenSSL configuration. WinHTTP and .NET HttpClient use Schannel automatically.',
  },
}

const OS_FILTER_ITEMS = [
  { id: 'rhel', label: 'RHEL / CentOS' },
  { id: 'ubuntu', label: 'Ubuntu 24.04 LTS' },
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
        <button
          onClick={() => setShowAfter((prev) => !prev)}
          className="flex items-center justify-between w-full text-left"
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
        </button>
        <pre className="mt-3 text-[11px] bg-background p-4 rounded border border-border overflow-x-auto font-mono whitespace-pre leading-relaxed text-foreground">
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
