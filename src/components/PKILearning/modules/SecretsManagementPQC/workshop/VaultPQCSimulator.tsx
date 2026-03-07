// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ArrowRight, Info } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { VAULT_TRANSIT_SCENARIOS } from '../data/secretsConstants'

const SCENARIO_ITEMS = VAULT_TRANSIT_SCENARIOS.map((s) => ({
  id: s.id,
  label: s.name,
}))

interface SizeBarProps {
  label: string
  value: number
  max: number
  colorClass: string
}

const SizeBar: React.FC<SizeBarProps> = ({ label, value, max, colorClass }) => {
  const pct = Math.max(4, Math.round((value / max) * 100))
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono font-bold text-foreground">{value.toLocaleString()} B</span>
      </div>
      <div className="w-full bg-muted rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export const VaultPQCSimulator: React.FC = () => {
  const [selectedId, setSelectedId] = useState(VAULT_TRANSIT_SCENARIOS[0].id)
  const scenario = VAULT_TRANSIT_SCENARIOS.find((s) => s.id === selectedId)!

  // Parse sizes from scenario strings for bar chart
  const parseSizes = (scenario: (typeof VAULT_TRANSIT_SCENARIOS)[0]) => {
    // Hardcode the numeric values per scenario for the bar visualization
    const sizeMap: Record<
      string,
      { classicalKey: number; pqcKey: number; classicalCt: number; pqcCt: number }
    > = {
      'symmetric-encrypt': { classicalKey: 32, pqcKey: 32, classicalCt: 32, pqcCt: 32 },
      'key-wrapping': { classicalKey: 256, pqcKey: 1184, classicalCt: 256, pqcCt: 1088 },
      'sign-verify': { classicalKey: 64, pqcKey: 1952, classicalCt: 64, pqcCt: 3309 },
      mac: { classicalKey: 32, pqcKey: 32, classicalCt: 32, pqcCt: 32 },
    }
    return sizeMap[scenario.id] ?? { classicalKey: 32, pqcKey: 32, classicalCt: 32, pqcCt: 32 }
  }

  const sizes = parseSizes(scenario)
  const maxKey = Math.max(sizes.classicalKey, sizes.pqcKey)
  const maxCt = Math.max(sizes.classicalCt, sizes.pqcCt)

  const upgradedAlgo = scenario.pqcMechanism !== scenario.classicalMechanism
  const sizeIncrease =
    sizes.pqcCt > sizes.classicalCt
      ? `${(sizes.pqcCt / sizes.classicalCt).toFixed(1)}x larger`
      : 'Unchanged'

  return (
    <div className="space-y-6">
      {/* Scenario selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Operation:</span>
        <FilterDropdown
          items={SCENARIO_ITEMS}
          selectedId={selectedId}
          onSelect={(id) => {
            if (id !== 'All') setSelectedId(id)
          }}
          noContainer
        />
      </div>

      {/* Algorithm comparison cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Classical */}
        <div className="bg-status-error/5 rounded-lg p-5 border border-status-error/20">
          <div className="text-[10px] font-bold text-status-error mb-3 uppercase tracking-wide">
            Classical
          </div>
          <div className="text-xl font-mono font-bold text-foreground mb-2">
            {scenario.classicalMechanism}
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Key / Public Key</span>
              <span className="font-mono text-foreground">
                {sizes.classicalKey.toLocaleString()} B
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ciphertext / Signature</span>
              <span className="font-mono text-foreground">
                {sizes.classicalCt.toLocaleString()} B
              </span>
            </div>
            <div className="flex justify-between">
              <span>Quantum Safe?</span>
              <span
                className={
                  scenario.id === 'symmetric-encrypt' || scenario.id === 'mac'
                    ? 'text-status-success font-bold'
                    : 'text-status-error font-bold'
                }
              >
                {scenario.id === 'symmetric-encrypt' || scenario.id === 'mac' ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden sm:flex items-center justify-center absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none">
          <ArrowRight size={24} className="text-primary" />
        </div>

        {/* PQC */}
        <div className="bg-primary/5 rounded-lg p-5 border border-primary/20">
          <div className="text-[10px] font-bold text-primary mb-3 uppercase tracking-wide">
            Post-Quantum
          </div>
          <div className="text-xl font-mono font-bold text-foreground mb-2">
            {scenario.pqcMechanism.split('(')[0].trim()}
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Key / Public Key</span>
              <span className="font-mono text-primary">{sizes.pqcKey.toLocaleString()} B</span>
            </div>
            <div className="flex justify-between">
              <span>Ciphertext / Signature</span>
              <span className="font-mono text-primary">{sizes.pqcCt.toLocaleString()} B</span>
            </div>
            <div className="flex justify-between">
              <span>Quantum Safe?</span>
              <span className="text-status-success font-bold">Yes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Size visualization */}
      <div className="bg-muted/50 rounded-lg p-5 border border-border">
        <div className="text-sm font-bold text-foreground mb-4">Size Comparison</div>
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Public Key / Key Material
            </div>
            <SizeBar
              label={`Classical (${scenario.classicalMechanism})`}
              value={sizes.classicalKey}
              max={maxKey}
              colorClass="bg-status-error"
            />
            <div className="mt-1">
              <SizeBar
                label={`PQC (${scenario.pqcMechanism.split('(')[0].trim()})`}
                value={sizes.pqcKey}
                max={maxKey}
                colorClass="bg-primary"
              />
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Ciphertext / Signature
            </div>
            <SizeBar
              label={`Classical (${scenario.classicalMechanism})`}
              value={sizes.classicalCt}
              max={maxCt}
              colorClass="bg-status-error"
            />
            <div className="mt-1">
              <SizeBar
                label={`PQC (${scenario.pqcMechanism.split('(')[0].trim()})`}
                value={sizes.pqcCt}
                max={maxCt}
                colorClass="bg-primary"
              />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Ciphertext / Signature overhead:</span>
          <span
            className={`text-xs font-bold ${sizeIncrease === 'Unchanged' ? 'text-status-success' : 'text-status-warning'}`}
          >
            {sizeIncrease}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="flex items-start gap-2">
          <Info size={15} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">{scenario.description}</p>
        </div>
      </div>

      {/* API Example */}
      <div>
        <div className="text-sm font-bold text-foreground mb-2">Vault API Example</div>
        <div className="bg-muted font-mono text-xs rounded-lg p-4 overflow-x-auto border border-border whitespace-pre text-foreground/90">
          {scenario.apiExample}
        </div>
      </div>

      {/* Upgrade Impact */}
      <div className="bg-muted/50 rounded-lg p-5 border border-border">
        <div className="text-sm font-bold text-foreground mb-3">Vault Config Upgrade Impact</div>
        <div className="space-y-3">
          {upgradedAlgo ? (
            <>
              <div className="flex items-start gap-3">
                <span className="text-[10px] px-2 py-0.5 rounded bg-status-warning/10 text-status-warning border border-status-warning/30 font-bold shrink-0">
                  CHANGE
                </span>
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Key type</strong>: Update{' '}
                  <code className="bg-muted px-1 rounded border border-border">type=</code>{' '}
                  parameter from{' '}
                  <code className="bg-muted px-1 rounded border border-border text-status-error">
                    {scenario.classicalMechanism.toLowerCase().replace(/[- ]/g, '-')}
                  </code>{' '}
                  to{' '}
                  <code className="bg-muted px-1 rounded border border-border text-primary">
                    {scenario.pqcMechanism.split('(')[0].trim().toLowerCase().replace(/[- ]/g, '-')}
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[10px] px-2 py-0.5 rounded bg-status-warning/10 text-status-warning border border-status-warning/30 font-bold shrink-0">
                  CHANGE
                </span>
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Storage</strong>: HSM and Vault storage must
                  accommodate larger key material ({sizes.pqcKey.toLocaleString()} B public keys vs{' '}
                  {sizes.classicalKey.toLocaleString()} B)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[10px] px-2 py-0.5 rounded bg-status-error/10 text-status-error border border-status-error/30 font-bold shrink-0">
                  BREAKING
                </span>
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Client applications</strong>: Must update to
                  handle {sizes.pqcCt.toLocaleString()} B outputs (was{' '}
                  {sizes.classicalCt.toLocaleString()} B). Buffer sizes, database column widths, JWT
                  header limits may need adjustment.
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-3">
              <span className="text-[10px] px-2 py-0.5 rounded bg-status-success/10 text-status-success border border-status-success/30 font-bold shrink-0">
                NO CHANGE
              </span>
              <div className="text-xs text-muted-foreground">
                Algorithm is already quantum-safe. Only ensure the key wrapping mechanism uses
                ML-KEM (not RSA/ECDH) to protect the symmetric key at rest in Vault.
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold shrink-0">
              REQUIRED
            </span>
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">Vault version</strong>: HashiCorp Vault 1.18+
              (planned H2 2026) required for PQC key types in transit engine.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
