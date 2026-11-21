// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Bot, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  evaluateAgentScope,
  type AgentKeyLocation,
  type AgentScopeConfig,
} from './frostPolicyHelpers'

export const AgentWalletScopeWorkshop: React.FC = () => {
  const [config, setConfig] = useState<AgentScopeConfig>({
    perTxCapUsd: 250,
    dailyCapUsd: 1000,
    allowlistEnforcedInSigner: true,
    humanApprovalAboveUsd: 500,
    credentialTtlMinutes: 30,
    keyLocation: 'enclave-or-hsm',
  })

  const outcomes = evaluateAgentScope(config)
  const stoppedCount = outcomes.filter((o) => o.stopped).length

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Bot size={16} className="text-primary" aria-hidden="true" />
            Configure Scoped AI Agent Spend Authority
          </h3>
          <span className="text-xs font-semibold text-primary">
            {stoppedCount} / {outcomes.length} Agent Mistakes Stopped
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label htmlFor="agent-key-loc" className="block font-semibold text-foreground mb-1">
              Where Agent Key &amp; Policy Sit
            </label>
            <FilterDropdown
              triggerId="agent-key-loc"
              ariaLabel="Where Agent Key and Policy Sit"
              hideDefaultOption
              items={[
                {
                  id: 'enclave-or-hsm',
                  label: 'Enclave / HSM (isolated from agent prompt)',
                },
                { id: 'host-ram', label: 'Host Process RAM (unwrapped in node)' },
                { id: 'agent-env', label: 'Agent Env Variable (prompt-accessible)' },
              ]}
              selectedId={config.keyLocation}
              onSelect={(id) =>
                setConfig((prev) => ({
                  ...prev,
                  keyLocation: id as AgentKeyLocation,
                }))
              }
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="agent-pertx-cap" className="block font-semibold text-foreground mb-1">
              Per-Transaction Spend Cap (USD)
            </label>
            <input
              id="agent-pertx-cap"
              type="number"
              min={50}
              max={20000}
              step={50}
              value={config.perTxCapUsd}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  perTxCapUsd: Math.max(50, Number(e.target.value) || 50),
                }))
              }
              className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
            />
          </div>

          <div>
            <label htmlFor="agent-daily-cap" className="block font-semibold text-foreground mb-1">
              Daily Spend Cap (USD)
            </label>
            <input
              id="agent-daily-cap"
              type="number"
              min={100}
              max={50000}
              step={100}
              value={config.dailyCapUsd}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  dailyCapUsd: Math.max(100, Number(e.target.value) || 100),
                }))
              }
              className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
            />
          </div>

          <div>
            <label htmlFor="agent-human-gate" className="block font-semibold text-foreground mb-1">
              Human Approval Required Above (USD)
            </label>
            <input
              id="agent-human-gate"
              type="number"
              min={50}
              max={20000}
              step={50}
              value={config.humanApprovalAboveUsd}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  humanApprovalAboveUsd: Math.max(50, Number(e.target.value) || 50),
                }))
              }
              className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
            />
          </div>

          <div>
            <label htmlFor="agent-ttl" className="block font-semibold text-foreground mb-1">
              Expiring Grant TTL (Minutes)
            </label>
            <input
              id="agent-ttl"
              type="number"
              min={5}
              max={1440}
              step={5}
              value={config.credentialTtlMinutes}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  credentialTtlMinutes: Math.max(5, Number(e.target.value) || 5),
                }))
              }
              className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/20 cursor-pointer w-full">
              <input
                type="checkbox"
                checked={config.allowlistEnforcedInSigner}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    allowlistEnforcedInSigner: e.target.checked,
                  }))
                }
              />
              <span>Enforce recipient allowlist inside signer</span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setConfig({
                perTxCapUsd: 250,
                dailyCapUsd: 1000,
                allowlistEnforcedInSigner: true,
                humanApprovalAboveUsd: 500,
                credentialTtlMinutes: 30,
                keyLocation: 'enclave-or-hsm',
              })
            }
          >
            Preset: Scoped Enclave Grant
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setConfig({
                perTxCapUsd: 10000,
                dailyCapUsd: 50000,
                allowlistEnforcedInSigner: false,
                humanApprovalAboveUsd: 15000,
                credentialTtlMinutes: 1440,
                keyLocation: 'agent-env',
              })
            }
          >
            Preset: Unscoped Agent Env Key
          </Button>
        </div>
      </div>

      {/* Replay 3 Agent Mistakes */}
      <div className="space-y-3">
        {outcomes.map((o) => (
          <div
            key={o.id}
            className={`p-4 rounded-xl border space-y-1.5 ${
              o.stopped
                ? 'bg-status-success/10 border-status-success/30'
                : 'bg-status-error/10 border-status-error/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {o.stopped ? (
                <CheckCircle2
                  size={16}
                  className="text-status-success shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <ShieldAlert size={16} className="text-status-error shrink-0" aria-hidden="true" />
              )}
              <h4 className="text-xs font-bold text-foreground">{o.title}</h4>
            </div>
            <p className="text-xs text-foreground/80">
              <strong>Simulated Mistake:</strong> {o.attemptedAction}
            </p>
            <p className="text-xs text-muted-foreground">{o.outcome}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
