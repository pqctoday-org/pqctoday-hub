// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { AlertTriangle, Database, Shield, ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DIRECTORY_SERVICES } from '../data/iamConstants'

type DirectoryTab = 'active-directory' | 'openldap' | 'azure-ad'

const TAB_LABELS: Record<DirectoryTab, string> = {
  'active-directory': 'Active Directory',
  openldap: 'OpenLDAP',
  'azure-ad': 'Azure AD / Entra ID',
}

const HNDL_RISK_LABEL = (score: number): { label: string; color: string; bg: string } => {
  if (score >= 8)
    return {
      label: 'Critical',
      color: 'text-status-error',
      bg: 'bg-status-error/10 border-status-error/30',
    }
  if (score >= 6)
    return {
      label: 'High',
      color: 'text-warning',
      bg: 'bg-warning/10 border-warning/30',
    }
  if (score >= 4)
    return {
      label: 'Medium',
      color: 'text-primary',
      bg: 'bg-primary/10 border-primary/30',
    }
  return {
    label: 'Low',
    color: 'text-status-success',
    bg: 'bg-status-success/10 border-status-success/30',
  }
}

const ATTACK_SCENARIOS: Record<
  DirectoryTab,
  { title: string; description: string; mitigation: string }[]
> = {
  'active-directory': [
    {
      title: 'PKINIT RSA Decryption Attack',
      description:
        'A CRQC decrypts captured Kerberos PKINIT handshakes from network recordings. The RSA-encrypted pre-authentication data reveals the session key, enabling ticket forgery and full domain compromise without any credentials.',
      mitigation:
        'Deploy Windows Server 2025 with PQC PKINIT support. Configure clients to use ML-KEM for PKINIT key exchange. Enforce PQC ciphers via Group Policy.',
    },
    {
      title: 'NTLM Credential Exposure',
      description:
        'NTLM challenge-response uses MD4 hashing with no forward secrecy. Captured NTLM exchanges and rainbow table attacks combined with quantum computation expose domain credentials.',
      mitigation:
        'Disable NTLM via Group Policy (Network Security: Restrict NTLM). Enforce Kerberos authentication exclusively. Use Protected Users security group for privileged accounts.',
    },
    {
      title: 'Golden Ticket via KRBTGT Exposure',
      description:
        'If the KRBTGT account password hash is compromised and later quantum-decrypted, attackers can forge Ticket Granting Tickets (Golden Tickets) for any user, including Domain Admins.',
      mitigation:
        'Rotate KRBTGT password twice (per Microsoft guidance). Migrate to PQC-capable Kerberos. Monitor for anomalous ticket requests via Microsoft Sentinel.',
    },
  ],
  openldap: [
    {
      title: 'LDAPS TLS Channel Decryption',
      description:
        'All LDAP directory queries, including user enumeration and attribute reads, travel over TLS. A CRQC decrypting captured LDAPS sessions exposes all directory data including group memberships, email addresses, and organizational structure.',
      mitigation:
        'Upgrade OpenSSL to 3.x and enable hybrid ML-KEM-768+X25519 cipher suites in slapd.conf. Verify TLS configuration with: openssl s_client -connect ldap.corp.example:636',
    },
    {
      title: 'Simple Bind Credential Exposure',
      description:
        'LDAP simple bind sends credentials (Base64-encoded username:password) over the TLS channel. If TLS is quantum-decrypted, all bind credentials are exposed.',
      mitigation:
        'Enforce SASL/GSSAPI authentication (Kerberos-backed) over simple bind. Require StartTLS or LDAPS. Disable anonymous and simple bind in slapd.conf.',
    },
  ],
  'azure-ad': [
    {
      title: 'JWT Token Forgery via RSA Key Recovery',
      description:
        'Microsoft Entra ID signs JWT access tokens and ID tokens with RSA-2048 keys published at the JWKS endpoint. A CRQC can recover the private signing key from collected public key material, enabling forgery of any identity token.',
      mitigation:
        'Monitor Microsoft Entra PQC hybrid token signing preview. Enforce short token lifetimes (15-minute access tokens) to limit replay window. Enable Continuous Access Evaluation (CAE).',
    },
    {
      title: 'Refresh Token Interception',
      description:
        'Refresh tokens (90-day lifetime) stored in browser storage or mobile keychain are long-lived HNDL targets. A CRQC decrypting captured OAuth2 refresh token exchanges could grant persistent access.',
      mitigation:
        'Enable refresh token rotation and revocation. Use device-bound tokens with TPM attestation (Windows Hello for Business). Monitor for anomalous refresh token usage via Entra ID Sign-in logs.',
    },
    {
      title: 'SAML Federation Assertion Replay',
      description:
        'SAML 2.0 assertions signed with RSA-SHA256 can be replayed if the signature is quantum-forged. This would allow an attacker to authenticate as any user to all SAML federated relying parties.',
      mitigation:
        'Reduce SAML assertion lifetime to 5 minutes. Enable assertion replay prevention (NotBefore/NotOnOrAfter strict enforcement). Migrate to OIDC where possible — easier PQC migration path.',
    },
  ],
}

export const DirectoryServicesAnalyzer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DirectoryTab>('active-directory')
  const [showScenarios, setShowScenarios] = useState(false)

  const service = DIRECTORY_SERVICES.find((d) => d.id === activeTab)!
  const hndlStyle = HNDL_RISK_LABEL(service.hndlScore)
  const scenarios = ATTACK_SCENARIOS[activeTab]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Directory Services Analyzer</h3>
        <p className="text-sm text-muted-foreground">
          Analyze quantum vulnerabilities in Active Directory, OpenLDAP, and Azure AD / Entra ID.
          Understand HNDL risk scores and migration paths for each service.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="glass-panel p-1 flex gap-1">
        {(Object.keys(TAB_LABELS) as DirectoryTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setShowScenarios(false)
            }}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
              activeTab === tab
                ? 'bg-primary text-black'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* HNDL Risk Score */}
      <div className={`glass-panel p-5 border ${hndlStyle.bg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Database size={24} className={hndlStyle.color} aria-hidden="true" />
            <div>
              <h4 className="text-sm font-bold text-foreground">{service.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border font-bold ${hndlStyle.bg}`}
                >
                  HNDL Risk: {service.hndlScore}/10 — {hndlStyle.label}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl sm:text-4xl font-bold ${hndlStyle.color}`}>
              {service.hndlScore}
            </div>
            <div className="text-[10px] text-muted-foreground">/ 10 HNDL score</div>
          </div>
        </div>

        {/* Score meter */}
        <div className="mt-3 bg-muted/50 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              service.hndlScore >= 8
                ? 'bg-status-error'
                : service.hndlScore >= 6
                  ? 'bg-warning'
                  : 'bg-primary'
            }`}
            style={{ width: `${service.hndlScore * 10}%` }}
          />
        </div>
      </div>

      {/* Protocols and Algorithms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-4">
          <div className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
            <Shield size={14} className="text-primary" aria-hidden="true" />
            Authentication Protocols
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {service.protocols.map((p) => (
              <span
                key={p}
                className="text-[10px] px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground"
              >
                {p}
              </span>
            ))}
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-[10px] font-bold text-status-error mb-0.5">
                Key Exchange (Vulnerable)
              </div>
              <code className="text-[10px] text-muted-foreground font-mono">
                {service.keyExchangeAlgorithm}
              </code>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted-foreground mb-0.5">
                Auth Algorithm
              </div>
              <code className="text-[10px] text-muted-foreground font-mono">
                {service.authAlgorithm}
              </code>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4">
          <div className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
            <Clock size={14} className="text-primary" aria-hidden="true" />
            Vendor Timeline
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border mb-3">
            <p className="text-xs text-muted-foreground">{service.vendorTimeline}</p>
          </div>
          <div className="text-xs font-bold text-foreground mb-2">Migration Path</div>
          <p className="text-[10px] text-muted-foreground">{service.migrationPath}</p>
        </div>
      </div>

      {/* Vulnerabilities */}
      <div className="glass-panel p-5">
        <div className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-warning" aria-hidden="true" />
          Quantum Vulnerabilities ({service.vulnerabilities.length} identified)
        </div>
        <div className="space-y-2">
          {service.vulnerabilities.map((vuln, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 border border-border"
            >
              <div className="w-5 h-5 rounded-full bg-status-error/10 border border-status-error/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-status-error">{idx + 1}</span>
              </div>
              <p className="text-xs text-muted-foreground">{vuln}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Attack Scenarios */}
      <div className="glass-panel p-5 border-warning/20">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-foreground flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning" aria-hidden="true" />
            CRQC Attack Scenarios
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScenarios((p) => !p)}
            className="text-xs"
          >
            {showScenarios ? 'Hide Scenarios' : 'Show Scenarios'}
          </Button>
        </div>

        {showScenarios && (
          <div className="space-y-4 mt-4">
            {scenarios.map((scenario, idx) => (
              <div key={idx} className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/30 font-bold">
                    Scenario {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-foreground">{scenario.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{scenario.description}</p>
                <div className="flex items-start gap-2">
                  <ArrowRight
                    size={12}
                    className="text-status-success shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="text-[10px] font-bold text-status-success mb-0.5">
                      Mitigation
                    </div>
                    <p className="text-[10px] text-muted-foreground">{scenario.mitigation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
