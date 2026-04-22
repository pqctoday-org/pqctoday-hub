// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ArrowRight, ArrowLeft, ArrowDown, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ZoneId =
  | 'governance'
  | 'assets'
  | 'management-tools'
  | 'risk-management'
  | 'mitigation'
  | 'migration'

interface ZoneDetail {
  title: string
  what: string
  contains: string[]
  cpmPillar: string
  cswpRef: string
}

const ZONE_DETAILS: Record<ZoneId, ZoneDetail> = {
  governance: {
    title: 'Governance',
    what: 'The policy and compliance layer that shapes all crypto decisions across the organisation.',
    contains: [
      'Standards (FIPS, RFC, ETSI, BSI TR-02102)',
      'Regulations & Mandates (CNSA 2.0, OMB M-23-02)',
      'Technology Supply Chains',
      'Threats & Threat Intelligence',
      'Business Requirements & Partner Ecosystem',
      'Stakeholders & Crypto Policies',
      'Crypto Architecture',
    ],
    cpmPillar: 'Governance pillar — policy ownership, RACI, standards-watch subscription',
    cswpRef: 'NIST CSWP.39 §5.1–5.4 (Govern step)',
  },
  assets: {
    title: 'Assets',
    what: 'The cryptographic attack surface — everything that uses, stores, or transmits cryptographic material.',
    contains: [
      'Code — source files referencing crypto primitives',
      'Libraries — OpenSSL, Bouncy Castle, BoringSSL, etc.',
      'Applications — services, APIs, mobile apps',
      'Files — encrypted archives, keystores, certs',
      'Protocols — TLS, SSH, IKEv2, S/MIME',
      'Systems — HSMs, TPMs, embedded controllers',
    ],
    cpmPillar:
      'Inventory pillar — CBOM covers all six asset classes; feeds the Information Repository',
    cswpRef: 'NIST CSWP.39 §5 (Inventory step)',
  },
  'management-tools': {
    title: 'Management Tools',
    what: 'Automated discovery, assessment, configuration, and enforcement tooling that bridges Assets and Risk Management.',
    contains: [
      'Crypto scanners — detect algorithms, key lengths, cert details across code and traffic',
      'Vulnerability management — CVE feeds, library EoL tracking',
      'Asset management — CMDB / SBOM → CBOM pipelines',
      'Log management (SIEM) — crypto-drift events, cipher-suite anomalies',
      'Zero-Trust enforcement — policy engines blocking disallowed cipher suites',
      'Data scanners — classify assets by sensitivity',
    ],
    cpmPillar: 'Observability + Inventory pillars — automate the Information Repository feed',
    cswpRef: 'NIST CSWP.39 §5 (Identify Gaps step), §4.3 (service mesh / zero-trust)',
  },
  'risk-management': {
    title: 'Data-Centric Risk Management',
    what: 'The intelligence layer — aggregates tool output and produces a prioritised action list with KPIs for executives.',
    contains: [
      'Information Repository — unified CBOM data store fed by Management Tools',
      'Risk Analysis Prioritisation Engine — scores assets by crypto risk',
      'KPI Dashboards & Reports — board-ready posture metrics',
      'Monitoring — continuous crypto-drift detection',
    ],
    cpmPillar:
      'Observability pillar (KPIs, dashboards) + Assurance pillar (FIPS metrics, attestation)',
    cswpRef: 'NIST CSWP.39 §5 (Prioritise step), §6.5 (maturity tiers)',
  },
  mitigation: {
    title: 'Mitigation (Compensating Controls)',
    what: 'Deploy a crypto gateway ("bump-in-the-wire") for systems that cannot be migrated now — buys time, not permanence.',
    contains: [
      'Crypto gateway — intercepts and re-encrypts traffic with approved algorithms',
      'Cipher-suite proxy — enforces allowed suites at the network layer',
      'Network-layer re-encryption — TLS termination upgrade external to the legacy system',
      'Must be paired with a sunset date for the legacy system',
    ],
    cpmPillar: 'Lifecycle pillar — remediation track; gateway itself must be tracked in CBOM',
    cswpRef: 'NIST CSWP.39 §4.6 — use when direct modification is infeasible',
  },
  migration: {
    title: 'Migration (Algorithm Replacement)',
    what: 'Full algorithm replacement — the preferred long-term path when the system has crypto agility.',
    contains: [
      'Library upgrades (OpenSSL 3.x, Bouncy Castle PQC branch)',
      'Firmware updates for HSMs and embedded controllers',
      'Certificate re-issuance and key rotation',
      'Protocol negotiation updates (TLS 1.3, IKEv2 with ML-KEM)',
      'ACME / EST / CMP automation for CLM at 47-day cadence',
    ],
    cpmPillar: 'Lifecycle pillar — CLM automation, ACME/EST/CMP, certificate renewal pipeline',
    cswpRef: 'NIST CSWP.39 §3.2, §5 (Implement step) — preferred over mitigation when feasible',
  },
}

const ZONE_STYLES: Record<ZoneId, { border: string; bg: string; activeBg: string; label: string }> =
  {
    governance: {
      border: 'border-primary/40',
      bg: 'bg-primary/5',
      activeBg: 'bg-primary/15',
      label: 'GOVERNANCE',
    },
    assets: {
      border: 'border-border',
      bg: 'bg-muted/30',
      activeBg: 'bg-muted/60',
      label: 'ASSETS',
    },
    'management-tools': {
      border: 'border-border',
      bg: 'bg-muted/20',
      activeBg: 'bg-muted/50',
      label: 'MANAGEMENT TOOLS',
    },
    'risk-management': {
      border: 'border-status-success/30',
      bg: 'bg-status-success/5',
      activeBg: 'bg-status-success/15',
      label: 'DATA-CENTRIC RISK MANAGEMENT',
    },
    mitigation: {
      border: 'border-status-warning/40',
      bg: 'bg-status-warning/5',
      activeBg: 'bg-status-warning/15',
      label: 'MITIGATION',
    },
    migration: {
      border: 'border-status-info/40',
      bg: 'bg-status-info/5',
      activeBg: 'bg-status-info/15',
      label: 'MIGRATION',
    },
  }

function ZoneButton({
  id,
  active,
  onClick,
  children,
}: {
  id: ZoneId
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  const s = ZONE_STYLES[id]
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`h-auto p-3 rounded-lg border-2 transition-all w-full text-left ${s.border} ${active ? s.activeBg : s.bg} ${active ? 'ring-2 ring-primary/30' : ''}`}
    >
      {children}
    </Button>
  )
}

export const CryptoAgilityProcessDiagram: React.FC = () => {
  const [activeZone, setActiveZone] = useState<ZoneId | null>(null)

  const toggle = (id: ZoneId) => setActiveZone((prev) => (prev === id ? null : id))

  const detail = activeZone ? ZONE_DETAILS[activeZone] : null

  return (
    <div className="glass-panel p-4 sm:p-6 space-y-4 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Info size={16} className="text-primary shrink-0" />
        <h3 className="text-lg font-bold text-gradient">CSWP.39 Crypto Agility Strategic Plan</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Interactive reproduction of NIST CSWP.39 Fig. 3. Click any zone to see what belongs there,
        which CPM pillar it maps to, and the relevant CSWP.39 section.
      </p>

      {/* Outer Crypto Agility frame */}
      <div className="border-2 border-primary/50 rounded-xl p-4 space-y-4 relative">
        {/* Crypto Agility label + arrows */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-xs font-bold text-primary">
            <ArrowLeft size={14} />
            <span>Crypto Agility (iterative loop)</span>
            <ArrowRight size={14} />
          </div>
          <span className="text-[10px] text-muted-foreground">NIST CSWP.39 Fig. 3</span>
        </div>

        {/* Governance band */}
        <ZoneButton
          id="governance"
          active={activeZone === 'governance'}
          onClick={() => toggle('governance')}
        >
          <div className="space-y-1">
            <div className="text-xs font-bold text-primary tracking-wider">GOVERNANCE</div>
            <div className="flex flex-wrap gap-1">
              {[
                'Standards',
                'Regulations/Mandates',
                'Supply Chains',
                'Threats',
                'Business Requirements',
                'Crypto Policies',
                'Crypto Architecture',
              ].map((item) => (
                <span
                  key={item}
                  className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </ZoneButton>

        {/* Middle row: Assets | Management Tools | Risk Management */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Assets */}
          <ZoneButton id="assets" active={activeZone === 'assets'} onClick={() => toggle('assets')}>
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-foreground tracking-wider">ASSETS</div>
              <div className="space-y-0.5">
                {['Code', 'Libraries', 'Applications', 'Files', 'Protocols', 'Systems'].map(
                  (item) => (
                    <div key={item} className="text-[10px] text-muted-foreground">
                      · {item}
                    </div>
                  )
                )}
              </div>
            </div>
          </ZoneButton>

          {/* Management Tools */}
          <ZoneButton
            id="management-tools"
            active={activeZone === 'management-tools'}
            onClick={() => toggle('management-tools')}
          >
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-foreground tracking-wider">
                MANAGEMENT TOOLS
              </div>
              <div className="text-[10px] text-muted-foreground font-medium mb-1">
                Discovery / Assessment / Config / Enforcement
              </div>
              <div className="space-y-0.5">
                {['Data', 'Crypto', 'Vulnerability', 'Assets', 'Log/SIEM', 'Zero-Trust'].map(
                  (item) => (
                    <div key={item} className="text-[10px] text-muted-foreground">
                      · {item}
                    </div>
                  )
                )}
              </div>
            </div>
          </ZoneButton>

          {/* Data-Centric Risk Management */}
          <ZoneButton
            id="risk-management"
            active={activeZone === 'risk-management'}
            onClick={() => toggle('risk-management')}
          >
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-foreground tracking-wider">
                DATA-CENTRIC RISK MGMT
              </div>
              <div className="space-y-0.5">
                {[
                  'Information Repository',
                  'Risk Analysis Engine',
                  'KPI Dashboards',
                  'Monitoring / Reports',
                ].map((item) => (
                  <div key={item} className="text-[10px] text-muted-foreground">
                    · {item}
                  </div>
                ))}
              </div>
            </div>
          </ZoneButton>
        </div>

        {/* Automation arrow */}
        <div className="flex justify-center items-center gap-1 text-[10px] text-muted-foreground">
          <ArrowDown size={12} />
          <span>Automation feeds Information Repository</span>
          <ArrowDown size={12} />
        </div>

        {/* Implement row: Mitigation | Migration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ZoneButton
            id="mitigation"
            active={activeZone === 'mitigation'}
            onClick={() => toggle('mitigation')}
          >
            <div className="space-y-1">
              <div className="text-xs font-bold text-status-warning tracking-wider">MITIGATION</div>
              <p className="text-[10px] text-muted-foreground">
                Crypto gateway / compensating controls — use when direct migration is infeasible.
                Pairs with a sunset plan.
              </p>
            </div>
          </ZoneButton>

          <ZoneButton
            id="migration"
            active={activeZone === 'migration'}
            onClick={() => toggle('migration')}
          >
            <div className="space-y-1">
              <div className="text-xs font-bold text-status-info tracking-wider">MIGRATION</div>
              <p className="text-[10px] text-muted-foreground">
                Full algorithm replacement — preferred path. Requires crypto agility: modular APIs,
                updatable firmware.
              </p>
            </div>
          </ZoneButton>
        </div>
      </div>

      {/* Detail panel */}
      {detail && (
        <div className="glass-panel p-4 border border-primary/20 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="font-bold text-foreground">{detail.title}</span>
          </div>
          <p className="text-sm text-foreground/80">{detail.what}</p>
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
              Contains
            </div>
            <ul className="space-y-0.5">
              {detail.contains.map((item) => (
                <li key={item} className="text-xs text-foreground/70 flex gap-1.5">
                  <span className="text-primary mt-0.5">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                CPM Pillar
              </div>
              <p className="text-xs text-foreground/80">{detail.cpmPillar}</p>
            </div>
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                Reference
              </div>
              <p className="text-xs text-foreground/80">{detail.cswpRef}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
