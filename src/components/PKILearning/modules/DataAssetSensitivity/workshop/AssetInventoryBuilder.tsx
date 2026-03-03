// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Plus, Trash2, AlertTriangle, Shield, ShieldAlert, ShieldCheck } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  SENSITIVITY_TIERS,
  RETENTION_CONFIGS,
  ASSET_TYPES,
  AVAILABLE_INDUSTRIES,
  DEFAULT_ASSETS,
  computeHndlRiskYear,
  CURRENT_YEAR,
  type DataAsset,
  type SensitivityTier,
  type AssetType,
  type RetentionPeriod,
} from '../data/sensitivityConstants'

interface AssetInventoryBuilderProps {
  assets: DataAsset[]
  onAssetsChange: (assets: DataAsset[]) => void
}

function SensitivityBadge({ tier }: { tier: SensitivityTier }) {
  const config = SENSITIVITY_TIERS.find((t) => t.id === tier)
  if (!config) return null
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-bold ${config.colorClass} ${config.bgClass} ${config.borderClass}`}
    >
      {tier === 'critical' && <ShieldAlert size={10} />}
      {tier === 'high' && <Shield size={10} />}
      {tier === 'medium' && <ShieldCheck size={10} />}
      {config.label}
    </span>
  )
}

function HndlIndicator({ retentionPeriod }: { retentionPeriod: RetentionPeriod }) {
  const riskYear = computeHndlRiskYear(retentionPeriod)
  const isAtRisk = riskYear <= CURRENT_YEAR
  return (
    <span
      className={`text-xs font-mono ${isAtRisk ? 'text-status-error font-bold' : 'text-muted-foreground'}`}
      title={
        isAtRisk
          ? 'Data encrypted before this year is already in adversary archives'
          : 'HNDL exposure starts in this year'
      }
    >
      {isAtRisk ? (
        <span className="flex items-center gap-1">
          <AlertTriangle size={12} />
          {riskYear} (at risk)
        </span>
      ) : (
        `${riskYear}`
      )}
    </span>
  )
}

export const AssetInventoryBuilder: React.FC<AssetInventoryBuilderProps> = ({
  assets,
  onAssetsChange,
}) => {
  const [name, setName] = useState('')
  const [assetType, setAssetType] = useState<AssetType>('data-store')
  const [sensitivityTier, setSensitivityTier] = useState<SensitivityTier>('medium')
  const [retentionPeriod, setRetentionPeriod] = useState<RetentionPeriod>('1-5y')
  const [currentEncryption, setCurrentEncryption] = useState('')
  const [businessOwner, setBusinessOwner] = useState('')
  const [industry, setIndustry] = useState(AVAILABLE_INDUSTRIES[0])
  const [error, setError] = useState('')

  const handleAdd = () => {
    if (!name.trim()) {
      setError('Asset name is required')
      return
    }
    setError('')
    const newAsset: DataAsset = {
      id: `asset-${Date.now()}`,
      name: name.trim(),
      assetType,
      sensitivityTier,
      retentionPeriod,
      currentEncryption: currentEncryption.trim() || 'Not specified',
      businessOwner: businessOwner.trim() || 'Unassigned',
      industry,
      complianceFlags: [],
    }
    onAssetsChange([...assets, newAsset])
    setName('')
    setCurrentEncryption('')
    setBusinessOwner('')
  }

  const handleRemove = (id: string) => {
    onAssetsChange(assets.filter((a) => a.id !== id))
  }

  const handleReset = () => {
    if (confirm('Reset to default example assets?')) {
      onAssetsChange([...DEFAULT_ASSETS])
    }
  }

  const assetTypeItems = ASSET_TYPES.map((t) => ({ id: t.id, label: t.label }))
  const sensitivityItems = SENSITIVITY_TIERS.map((t) => ({ id: t.id, label: t.label }))
  const retentionItems = RETENTION_CONFIGS.map((r) => ({ id: r.id, label: r.label }))
  const industryItems = AVAILABLE_INDUSTRIES.map((i) => ({ id: i, label: i }))

  return (
    <div className="space-y-6">
      {/* Add Asset Form */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Add Data Asset</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="asset-name" className="text-xs text-muted-foreground mb-1 block">
              Asset Name *
            </label>
            <Input
              id="asset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Customer PII Database"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            {error && <p className="text-xs text-status-error mt-1">{error}</p>}
          </div>

          <div>
            <label htmlFor="asset-encryption" className="text-xs text-muted-foreground mb-1 block">
              Current Encryption
            </label>
            <Input
              id="asset-encryption"
              value={currentEncryption}
              onChange={(e) => setCurrentEncryption(e.target.value)}
              placeholder="e.g. RSA-2048 + AES-256-GCM"
            />
          </div>

          <div>
            <label htmlFor="asset-owner" className="text-xs text-muted-foreground mb-1 block">
              Business Owner
            </label>
            <Input
              id="asset-owner"
              value={businessOwner}
              onChange={(e) => setBusinessOwner(e.target.value)}
              placeholder="e.g. Data Engineering"
            />
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Asset Type</div>
              <FilterDropdown
                items={assetTypeItems}
                selectedId={assetType}
                onSelect={(id) => setAssetType(id as AssetType)}
                defaultLabel="Select type"
                noContainer
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Sensitivity Tier</div>
            <FilterDropdown
              items={sensitivityItems}
              selectedId={sensitivityTier}
              onSelect={(id) => setSensitivityTier(id as SensitivityTier)}
              defaultLabel="Select tier"
              noContainer
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Retention Period</div>
            <FilterDropdown
              items={retentionItems}
              selectedId={retentionPeriod}
              onSelect={(id) => setRetentionPeriod(id as RetentionPeriod)}
              defaultLabel="Select period"
              noContainer
            />
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-muted-foreground mb-1">Industry</div>
            <FilterDropdown
              items={industryItems}
              selectedId={industry}
              onSelect={setIndustry}
              defaultLabel="Select industry"
              noContainer
            />
          </div>
        </div>

        <Button onClick={handleAdd} variant="outline" className="flex items-center gap-2">
          <Plus size={16} /> Add Asset
        </Button>
      </div>

      {/* Asset Table */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            Asset Inventory ({assets.length})
          </h3>
          <Button onClick={handleReset} variant="ghost" className="text-xs text-muted-foreground">
            Reset to examples
          </Button>
        </div>

        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No assets added yet. Use the form above to add your first asset.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left py-2 pr-4 font-medium">Asset</th>
                  <th className="text-left py-2 pr-4 font-medium">Type</th>
                  <th className="text-left py-2 pr-4 font-medium">Sensitivity</th>
                  <th className="text-left py-2 pr-4 font-medium">Retention</th>
                  <th className="text-left py-2 pr-4 font-medium">HNDL Risk Year</th>
                  <th className="text-left py-2 pr-4 font-medium">Industry</th>
                  <th className="text-left py-2 pr-4 font-medium">Encryption</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const typeConfig = ASSET_TYPES.find((t) => t.id === asset.assetType)
                  const retConfig = RETENTION_CONFIGS.find((r) => r.id === asset.retentionPeriod)
                  return (
                    <tr
                      key={asset.id}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 pr-4 font-medium text-foreground">{asset.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {typeConfig?.label ?? asset.assetType}
                      </td>
                      <td className="py-3 pr-4">
                        <SensitivityBadge tier={asset.sensitivityTier} />
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {retConfig?.label ?? asset.retentionPeriod}
                      </td>
                      <td className="py-3 pr-4">
                        <HndlIndicator retentionPeriod={asset.retentionPeriod} />
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">{asset.industry}</td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs font-mono">
                        {asset.currentEncryption}
                      </td>
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          onClick={() => handleRemove(asset.id)}
                          className="p-1 h-auto text-muted-foreground hover:text-status-error"
                          aria-label={`Remove ${asset.name}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {assets.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-3 border border-border text-xs text-muted-foreground">
            <strong className="text-foreground">HNDL Risk Year</strong> = {CURRENT_YEAR}&apos;s
            median CRQC estimate ({2034}) − data retention years. Assets showing{' '}
            <span className="text-status-error font-bold">at risk</span> were collected before the
            HNDL threshold and may already be in adversary archives.
          </div>
        )}
      </div>

      {/* What to look for */}
      <div className="bg-muted/30 rounded-lg p-4 border border-primary/20 text-sm text-foreground/80">
        <p className="font-semibold text-foreground mb-1">What to look for in your inventory:</p>
        <ul className="space-y-1 list-disc list-inside text-xs text-muted-foreground">
          <li>
            Assets with <strong>Critical</strong> sensitivity and <strong>25+ year</strong>{' '}
            retention are your highest priority for PQC migration
          </li>
          <li>
            Key material (root CA keys, HSM-protected secrets) should always be treated as Critical
            regardless of other factors
          </li>
          <li>
            Short-lived communication channels (TLS certs, &lt;1 year) have lower HNDL risk but
            still need migration planning
          </li>
          <li>
            In Step 4, the Sensitivity Scoring Engine will calculate a composite urgency score for
            each asset
          </li>
        </ul>
      </div>
    </div>
  )
}
