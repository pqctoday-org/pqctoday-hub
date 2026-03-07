// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { AlertTriangle, CheckCircle, Clock, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'

interface CryptoComponent {
  id: string
  component: string
  category: string
  currentAlgorithm: string
  osDependency: string
  quantumRisk: 'critical' | 'high' | 'medium' | 'low'
  migrationEffort: 'high' | 'medium' | 'low'
  notes: string
}

const CRYPTO_COMPONENTS: CryptoComponent[] = [
  {
    id: 'system-tls',
    component: 'System TLS / HTTPS',
    category: 'Transport',
    currentAlgorithm: 'TLS 1.3: X25519, P-256, RSA-2048/ECDSA',
    osDependency: 'OpenSSL 3.x / GnuTLS / Schannel',
    quantumRisk: 'critical',
    migrationEffort: 'medium',
    notes:
      'Highest priority. Affects all web traffic. Mitigatable with hybrid X25519MLKEM768 groups in TLS 1.3 with a single config change.',
  },
  {
    id: 'ssh-daemon',
    component: 'SSH Daemon (sshd)',
    category: 'Remote Access',
    currentAlgorithm: 'RSA-4096 / Ed25519 host keys + ECDH key exchange',
    osDependency: 'OpenSSH (libcrypto / liboqs)',
    quantumRisk: 'critical',
    migrationEffort: 'medium',
    notes:
      'Host keys exposed to HNDL attacks. New ssh-mldsa65 host key type in draft RFC. Key exchange uses ML-KEM hybrid in OpenSSH 9.9+ experimental.',
  },
  {
    id: 'package-manager',
    component: 'Package Manager Signing',
    category: 'Supply Chain',
    currentAlgorithm: 'GPG RSA-4096 / Ed25519 repository signatures',
    osDependency: 'GnuPG + apt/dnf/pkg',
    quantumRisk: 'high',
    migrationEffort: 'high',
    notes:
      'Long-term integrity risk — packages signed today must still be verifiable years from now. Requires coordinated upgrade of signing infrastructure and client.',
  },
  {
    id: 'kernel-module-signing',
    component: 'Kernel Module Signing',
    category: 'Boot Integrity',
    currentAlgorithm: 'RSA-4096 or ECDSA P-256 (kernel CONFIG_MODULE_SIG)',
    osDependency: 'Linux kernel build system',
    quantumRisk: 'high',
    migrationEffort: 'high',
    notes:
      'Kernel modules signed at build time. Migration requires recompiling kernel with ML-DSA signing key in kernel keyring. Experimental ML-DSA kernel module signing in Linux 6.13+.',
  },
  {
    id: 'cert-store',
    component: 'System Certificate Store',
    category: 'PKI',
    currentAlgorithm: 'RSA-2048/4096 + ECDSA P-256/P-384 root CAs',
    osDependency: '/etc/ssl/certs (Linux) / Keychain (macOS) / CertMgr (Windows)',
    quantumRisk: 'high',
    migrationEffort: 'low',
    notes:
      "Root CA bundle requires adding PQC trust anchors. Browsers and OS vendors are tracking parallel PQC root programs. ISRG (Let's Encrypt) planning PQC intermediate CA.",
  },
  {
    id: 'curl-wget',
    component: 'curl / wget',
    category: 'HTTP Clients',
    currentAlgorithm: 'Inherits system OpenSSL / GnuTLS TLS config',
    osDependency: 'OpenSSL 3.x or GnuTLS (distro-dependent)',
    quantumRisk: 'medium',
    migrationEffort: 'low',
    notes:
      'curl 8.x with OpenSSL 3.2+ backend automatically supports X25519MLKEM768 if openssl.cnf groups are configured. No application-level changes needed.',
  },
  {
    id: 'git',
    component: 'git (HTTPS / SSH transport)',
    category: 'Developer Tools',
    currentAlgorithm: 'HTTPS: inherits system TLS. SSH: inherits system SSH config',
    osDependency: 'libcurl (HTTPS) + OpenSSH / libssh (SSH)',
    quantumRisk: 'medium',
    migrationEffort: 'low',
    notes:
      'git inherits TLS and SSH settings from system libraries. No git-specific PQC changes needed once system TLS and SSH are migrated. git commit signing (GPG) is separate.',
  },
  {
    id: 'container-runtime',
    component: 'Container Runtime TLS',
    category: 'Containers',
    currentAlgorithm: 'containerd / Docker: TLS 1.2-1.3, ECDHE-RSA/ECDSA',
    osDependency: 'Go crypto/tls (containerd) + system certs',
    quantumRisk: 'medium',
    migrationEffort: 'medium',
    notes:
      "containerd uses Go's crypto/tls which has ML-KEM support in Go 1.23+. Docker daemon TLS and registry communication benefit automatically from Go 1.23+ upgrade. Container image signing (Notary/sigstore) separate.",
  },
]

const RISK_LABELS: Record<CryptoComponent['quantumRisk'], { label: string; className: string }> = {
  critical: {
    label: 'Critical',
    className: 'text-status-error bg-status-error/10 border-status-error/30',
  },
  high: {
    label: 'High',
    className: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  },
  medium: {
    label: 'Medium',
    className: 'text-status-info bg-status-info/10 border-status-info/30',
  },
  low: { label: 'Low', className: 'text-muted-foreground bg-muted border-border' },
}

const EFFORT_LABELS: Record<
  CryptoComponent['migrationEffort'],
  { label: string; icon: React.ReactNode }
> = {
  high: { label: 'High Effort', icon: <AlertTriangle size={12} className="text-status-warning" /> },
  medium: { label: 'Medium Effort', icon: <Clock size={12} className="text-status-info" /> },
  low: { label: 'Low Effort', icon: <CheckCircle size={12} className="text-status-success" /> },
}

const RISK_FILTER_ITEMS = [
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
]

export const OSCryptoInventory: React.FC = () => {
  const [riskFilter, setRiskFilter] = useState('All')
  const [effortFilter, setEffortFilter] = useState('All')
  const [exported, setExported] = useState(false)

  const filtered = useMemo(() => {
    return CRYPTO_COMPONENTS.filter((c) => {
      if (riskFilter !== 'All' && c.quantumRisk !== riskFilter) return false
      if (effortFilter !== 'All' && c.migrationEffort !== effortFilter) return false
      return true
    })
  }, [riskFilter, effortFilter])

  const criticalCount = CRYPTO_COMPONENTS.filter((c) => c.quantumRisk === 'critical').length
  const highCount = CRYPTO_COMPONENTS.filter((c) => c.quantumRisk === 'high').length

  const handleExport = () => {
    setExported(true)
    setTimeout(() => setExported(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{CRYPTO_COMPONENTS.length}</div>
          <div className="text-xs text-muted-foreground">Components</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-status-error">{criticalCount}</div>
          <div className="text-xs text-muted-foreground">Critical Risk</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-status-warning">{highCount}</div>
          <div className="text-xs text-muted-foreground">High Risk</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-status-success">
            {CRYPTO_COMPONENTS.filter((c) => c.migrationEffort === 'low').length}
          </div>
          <div className="text-xs text-muted-foreground">Easy Wins</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterDropdown
          items={RISK_FILTER_ITEMS}
          selectedId={riskFilter}
          onSelect={setRiskFilter}
          label="Risk"
          defaultLabel="All Risks"
          noContainer
        />
        <FilterDropdown
          items={[
            { id: 'high', label: 'High Effort' },
            { id: 'medium', label: 'Medium Effort' },
            { id: 'low', label: 'Low Effort' },
          ]}
          selectedId={effortFilter}
          onSelect={setEffortFilter}
          label="Effort"
          defaultLabel="All Efforts"
          noContainer
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="ml-auto flex items-center gap-2"
        >
          <Download size={14} />
          {exported ? 'Exported!' : 'Export Summary'}
        </Button>
      </div>

      {/* Component table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Component</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium hidden sm:table-cell">
                Current Algorithm
              </th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium hidden md:table-cell">
                OS Dependency
              </th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Risk</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium hidden sm:table-cell">
                Effort
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((comp) => {
              const risk = RISK_LABELS[comp.quantumRisk]
              const effort = EFFORT_LABELS[comp.migrationEffort]
              return (
                <tr
                  key={comp.id}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="font-medium text-foreground">{comp.component}</div>
                    <div className="text-muted-foreground mt-0.5">{comp.category}</div>
                    <p className="text-[10px] text-foreground/60 mt-1 hidden sm:block">
                      {comp.notes}
                    </p>
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell">
                    <span className="font-mono text-foreground">{comp.currentAlgorithm}</span>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground hidden md:table-cell">
                    {comp.osDependency}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-bold ${risk.className}`}
                    >
                      {risk.label}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center hidden sm:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      {effort.icon}
                      <span className="text-muted-foreground">{effort.label}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No components match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Migration priority note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="text-sm font-bold text-foreground mb-2">Migration Priority Order</div>
        <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
          <li>
            <strong className="text-foreground">System TLS</strong> — highest exposure, easy hybrid
            fix via openssl.cnf / crypto-policies
          </li>
          <li>
            <strong className="text-foreground">SSH Daemon</strong> — HNDL target; migrate host keys
            when ssh-mldsa65 reaches production
          </li>
          <li>
            <strong className="text-foreground">Certificate Store</strong> — add PQC trust anchors
            as CAs issue them (low effort)
          </li>
          <li>
            <strong className="text-foreground">Package Signing</strong> — supply chain risk;
            requires ecosystem coordination (high effort)
          </li>
          <li>
            <strong className="text-foreground">Kernel Module Signing</strong> — last; requires
            kernel rebuild + secure boot chain update
          </li>
        </ol>
      </div>
    </div>
  )
}
