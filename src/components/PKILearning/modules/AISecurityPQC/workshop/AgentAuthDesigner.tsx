// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { UserCheck, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { AGENT_IDENTITY_PROFILES, DELEGATION_CHAIN_TEMPLATES } from '../data/agentAuthData'
import {
  AGENT_TYPE_COLORS,
  AGENT_TYPE_LABELS,
  CREDENTIAL_TYPE_LABELS,
} from '../data/aiSecurityConstants'

const AGENT_ITEMS = AGENT_IDENTITY_PROFILES.map((p) => ({ id: p.id, label: p.name }))
const CHAIN_ITEMS = DELEGATION_CHAIN_TEMPLATES.map((c) => ({ id: c.id, label: c.name }))

export const AgentAuthDesigner: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState(AGENT_IDENTITY_PROFILES[1].id)
  const [selectedChain, setSelectedChain] = useState(DELEGATION_CHAIN_TEMPLATES[1].id)

  const agentProfile = useMemo(
    () => AGENT_IDENTITY_PROFILES.find((a) => a.id === selectedAgent) ?? AGENT_IDENTITY_PROFILES[1],
    [selectedAgent]
  )

  const chain = useMemo(
    () =>
      DELEGATION_CHAIN_TEMPLATES.find((c) => c.id === selectedChain) ??
      DELEGATION_CHAIN_TEMPLATES[1],
    [selectedChain]
  )

  const chainStats = useMemo(() => {
    const totalClassical = chain.links.reduce((sum, l) => sum + l.tokenSizeClassical, 0)
    const totalPQC = chain.links.reduce((sum, l) => sum + l.tokenSizePQC, 0)
    const vulnerableCount = chain.links.filter((l) => l.quantumVulnerable).length
    const sizeIncrease =
      totalClassical > 0 ? ((totalPQC - totalClassical) / totalClassical) * 100 : 0
    return { totalClassical, totalPQC, vulnerableCount, sizeIncrease, depth: chain.links.length }
  }, [chain])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">Agent Auth Designer</h3>
        <p className="text-sm text-muted-foreground">
          Design authentication architectures for AI agents. Explore delegation chains and compare
          classical vs PQC credential sizes at each hop.
        </p>
      </div>

      {/* Agent type */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <UserCheck size={16} className="text-primary" />
          Agent Type
        </h4>
        <FilterDropdown
          items={AGENT_ITEMS}
          selectedId={selectedAgent}
          onSelect={(id) => setSelectedAgent(id)}
          label="Agent"
          defaultLabel="Select Agent"
          noContainer
        />
        <div className="flex items-start gap-3">
          <span
            className={`text-[10px] px-2 py-0.5 rounded border font-bold shrink-0 ${AGENT_TYPE_COLORS[agentProfile.type]}`}
          >
            {AGENT_TYPE_LABELS[agentProfile.type]}
          </span>
          <p className="text-sm text-foreground/80">{agentProfile.description}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="glass-panel p-3">
            <p className="text-muted-foreground">Credential Lifetime</p>
            <p className="text-foreground font-medium mt-1">
              {agentProfile.typicalCredentialLifetimeHours >= 24
                ? `${(agentProfile.typicalCredentialLifetimeHours / 24).toFixed(0)} days`
                : `${agentProfile.typicalCredentialLifetimeHours} hours`}
            </p>
          </div>
          <div className="glass-panel p-3">
            <p className="text-muted-foreground">Renewal Strategy</p>
            <p className="text-foreground font-medium mt-1">{agentProfile.renewalStrategy}</p>
          </div>
          <div className="glass-panel p-3 border-l-4 border-status-warning">
            <p className="text-muted-foreground">HNDL Exposure</p>
            <p className="text-foreground font-medium mt-1">{agentProfile.hndlExposureNotes}</p>
          </div>
        </div>
      </div>

      {/* Delegation chain */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-bold text-foreground">Delegation Chain</h4>
        <FilterDropdown
          items={CHAIN_ITEMS}
          selectedId={selectedChain}
          onSelect={(id) => setSelectedChain(id)}
          label="Chain"
          defaultLabel="Select Chain"
          noContainer
        />
        <p className="text-sm text-foreground/80">{chain.description}</p>
      </div>

      {/* Chain visualization */}
      <div className="space-y-2">
        {chain.links.map((link, idx) => (
          <div key={idx} className="glass-panel p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-medium">
                {link.from}
              </span>
              <ArrowRight size={16} className="text-muted-foreground" />
              <span className="px-3 py-1.5 rounded-full bg-status-info/20 text-status-info text-sm font-medium">
                {link.to}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-muted text-muted-foreground border-border ml-auto">
                {CREDENTIAL_TYPE_LABELS[link.credentialType]}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
              <div>
                <span className="text-muted-foreground">Signing: </span>
                <span className="text-foreground font-mono">{link.signingAlgorithm}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Classical: </span>
                <span className="text-foreground font-mono">{link.tokenSizeClassical} B</span>
              </div>
              <div>
                <span className="text-muted-foreground">PQC: </span>
                <span className="text-foreground font-mono">{link.tokenSizePQC} B</span>
              </div>
              <div>
                {link.quantumVulnerable ? (
                  <span className="inline-flex items-center gap-1 text-status-error">
                    <AlertTriangle size={12} /> Vulnerable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-status-success">
                    <ShieldCheck size={12} /> Safe
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chain analysis */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Chain Analysis</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{chainStats.depth}</p>
            <p className="text-xs text-muted-foreground">Chain Depth</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {(chainStats.totalClassical / 1024).toFixed(1)} KB
            </p>
            <p className="text-xs text-muted-foreground">Classical Size</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">
              {(chainStats.totalPQC / 1024).toFixed(1)} KB
            </p>
            <p className="text-xs text-muted-foreground">PQC Size</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-status-warning">
              +{chainStats.sizeIncrease.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Size Increase</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-status-error">{chainStats.vulnerableCount}</p>
            <p className="text-xs text-muted-foreground">Vulnerable Links</p>
          </div>
        </div>
      </div>
    </div>
  )
}
