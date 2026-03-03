// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { ShieldAlert, BarChart3, DollarSign, Building } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  SENSITIVITY_TIERS,
  RETENTION_CONFIGS,
  type DataAsset,
  type SensitivityTier,
} from '../data/sensitivityConstants'

interface RiskMethodologyExplorerProps {
  assets: DataAsset[]
}

// ── NIST RMF ─────────────────────────────────────────────────────────────────

function nistRMFAnalysis(asset: DataAsset) {
  const fips199Level =
    asset.sensitivityTier === 'critical' || asset.sensitivityTier === 'high'
      ? 'High'
      : asset.sensitivityTier === 'medium'
        ? 'Moderate'
        : 'Low'

  const controlGaps: string[] = []
  if (
    asset.currentEncryption.includes('RSA') ||
    asset.currentEncryption.includes('ECDSA') ||
    asset.currentEncryption.includes('ECDHE')
  ) {
    controlGaps.push('SC-28: Algorithm not quantum-resistant (RSA/ECC at risk post-2030)')
    controlGaps.push('SC-8: Transmission protection uses deprecated classical algorithm')
  }
  if (asset.assetType === 'key-material') {
    controlGaps.push('IA-7: Cryptographic module must support PQC under FIPS 203/204/205')
  }
  if (asset.complianceFlags.includes('CNSA-2.0') || asset.industry === 'Government & Defense') {
    controlGaps.push('SC-13: NSS must adopt CNSA 2.0 algorithms by 2030 per NSA mandate')
  }
  if (controlGaps.length === 0) {
    controlGaps.push('No immediate SP 800-53 gaps identified — schedule periodic review')
  }

  const likelihood =
    asset.sensitivityTier === 'critical' ? 5 : asset.sensitivityTier === 'high' ? 4 : 3
  const impact = fips199Level === 'High' ? 5 : fips199Level === 'Moderate' ? 3 : 2
  const riskScore = likelihood * impact

  const recommendation =
    riskScore >= 20
      ? 'Immediate migration required — initiate PQC project within 6 months'
      : riskScore >= 12
        ? 'High priority — include in next annual security review cycle'
        : 'Standard priority — plan migration before 2030 NIST deadline'

  return { fips199Level, controlGaps, riskScore, likelihood, impact, recommendation }
}

// ── ISO 27005 ─────────────────────────────────────────────────────────────────

function iso27005Analysis(asset: DataAsset) {
  const threatScenarios = [
    'HNDL (Harvest Now, Decrypt Later): adversary stores encrypted data today for future decryption',
    'Post-CRQC direct decryption: quantum computer breaks asymmetric encryption protecting this asset',
    'Algorithm deprecation compliance failure: continued use of RSA/ECC after NIST 2030 deadline',
  ]
  if (asset.assetType === 'key-material') {
    threatScenarios.push(
      'Key compromise: long-lived signing/encryption keys compromised by quantum-capable adversary'
    )
  }

  const tierWeights: Record<SensitivityTier, number> = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
  }
  const likelihoodScore = 3
  const consequenceScore = tierWeights[asset.sensitivityTier]
  const riskProduct = likelihoodScore * consequenceScore

  const riskLevel =
    riskProduct >= 15
      ? 'Critical'
      : riskProduct >= 10
        ? 'High'
        : riskProduct >= 6
          ? 'Medium'
          : 'Low'

  const treatment: 'Accept' | 'Mitigate' | 'Transfer' | 'Avoid' =
    riskLevel === 'Critical' || riskLevel === 'High' ? 'Mitigate' : 'Accept'

  return { threatScenarios, likelihoodScore, consequenceScore, riskLevel, treatment }
}

// ── FAIR ──────────────────────────────────────────────────────────────────────

function fairAnalysis(
  _asset: DataAsset,
  tef: number,
  vulnerability: number,
  primaryLoss: number,
  secondaryLoss: number
) {
  const lef = tef * (vulnerability / 100)
  const plm = primaryLoss + secondaryLoss
  const aleMostLikely = lef * plm
  const aleMin = aleMostLikely * 0.2
  const aleMax = aleMostLikely * 4

  return { lef, plm, aleMin, aleMostLikely, aleMax }
}

// ── DORA/NIS2 ─────────────────────────────────────────────────────────────────

function doraNis2Analysis(asset: DataAsset) {
  const pillars = [
    {
      name: 'Identify',
      article: 'Article 6 (DORA) / Article 21 (NIS2)',
      compliant: true,
      note: 'Asset has been identified and cataloged',
    },
    {
      name: 'Protect',
      article: 'Article 9 (DORA) / Article 21(2)(h) (NIS2)',
      compliant:
        !asset.currentEncryption.includes('RSA') && !asset.currentEncryption.includes('ECDSA'),
      note: asset.currentEncryption.includes('RSA')
        ? 'RSA/ECC in use — "state-of-the-art" requires PQC planning per ENISA guidance'
        : 'Current encryption may satisfy requirement during transition period',
    },
    {
      name: 'Detect',
      article: 'Article 10 (DORA)',
      compliant: false,
      note: 'No cryptographic inventory monitoring or algorithm deprecation alert system detected',
    },
    {
      name: 'Respond',
      article: 'Article 11 (DORA)',
      compliant: false,
      note: 'PQC incident response plan not specified for this asset',
    },
    {
      name: 'Recover',
      article: 'Article 12 (DORA)',
      compliant: false,
      note: 'Crypto-agile recovery procedures not documented for this asset',
    },
  ]

  const gapCount = pillars.filter((p) => !p.compliant).length
  const gapScore = gapCount * 2

  const priorityRemediations = pillars
    .filter((p) => !p.compliant)
    .map((p) => `${p.name} (${p.article}): ${p.note}`)

  const cryptoCompliant =
    !asset.currentEncryption.includes('RSA') && !asset.currentEncryption.includes('ECDSA')

  return { pillars, gapScore, priorityRemediations, cryptoCompliant }
}

// ── Component ─────────────────────────────────────────────────────────────────

export const RiskMethodologyExplorer: React.FC<RiskMethodologyExplorerProps> = ({ assets }) => {
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id ?? '')
  const [tef, setTef] = useState(2)
  const [vulnerability, setVulnerability] = useState(60)
  const [primaryLoss, setPrimaryLoss] = useState(2000000)
  const [secondaryLoss, setSecondaryLoss] = useState(800000)

  const selectedAsset = useMemo(
    () => assets.find((a) => a.id === selectedAssetId) ?? assets[0],
    [assets, selectedAssetId]
  )

  const assetItems = assets.map((a) => ({ id: a.id, label: a.name }))

  if (!selectedAsset) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Add assets in Step 1 to compare risk methodologies.
      </div>
    )
  }

  const nist = nistRMFAnalysis(selectedAsset)
  const iso = iso27005Analysis(selectedAsset)
  const fair = fairAnalysis(selectedAsset, tef, vulnerability, primaryLoss, secondaryLoss)
  const dora = doraNis2Analysis(selectedAsset)

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n)

  const tierConfig = SENSITIVITY_TIERS.find((t) => t.id === selectedAsset.sensitivityTier)
  const retConfig = RETENTION_CONFIGS.find((r) => r.id === selectedAsset.retentionPeriod)

  return (
    <div className="space-y-5">
      {/* Asset Selector */}
      <div className="glass-panel p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Apply to:</span>
          <FilterDropdown
            items={assetItems}
            selectedId={selectedAssetId}
            onSelect={setSelectedAssetId}
            defaultLabel="Select asset"
            noContainer
          />
          {tierConfig && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded border font-bold ${tierConfig.colorClass} ${tierConfig.bgClass} ${tierConfig.borderClass}`}
            >
              {tierConfig.label} sensitivity
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            Retention: {retConfig?.label ?? selectedAsset.retentionPeriod}
          </span>
        </div>
      </div>

      {/* 4-tab methodology comparison */}
      <Tabs defaultValue="nist-rmf">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="nist-rmf" className="flex items-center gap-1.5">
            <ShieldAlert size={14} /> NIST RMF
          </TabsTrigger>
          <TabsTrigger value="iso-27005" className="flex items-center gap-1.5">
            <BarChart3 size={14} /> ISO 27005
          </TabsTrigger>
          <TabsTrigger value="fair" className="flex items-center gap-1.5">
            <DollarSign size={14} /> FAIR
          </TabsTrigger>
          <TabsTrigger value="dora-nis2" className="flex items-center gap-1.5">
            <Building size={14} /> DORA/NIS2
          </TabsTrigger>
        </TabsList>

        {/* NIST RMF */}
        <TabsContent value="nist-rmf">
          <div className="space-y-4">
            <div className="glass-panel p-4">
              <h4 className="text-sm font-bold text-foreground mb-3">
                NIST RMF (SP 800-37) — 6-Step Assessment
              </h4>
              <div className="space-y-2">
                {[
                  {
                    step: 'Prepare',
                    note: `Asset: ${selectedAsset.name} | Owner: ${selectedAsset.businessOwner} | Industry: ${selectedAsset.industry}`,
                  },
                  {
                    step: 'Categorize',
                    note: `FIPS 199 Impact Level: ${nist.fips199Level} — based on sensitivity tier (${selectedAsset.sensitivityTier})`,
                  },
                  {
                    step: 'Select Controls',
                    note: `${nist.controlGaps.length} SP 800-53 gap(s) identified`,
                  },
                  {
                    step: 'Implement',
                    note: 'Current encryption vs NIST IR 8547 deprecation timeline',
                  },
                  {
                    step: 'Assess',
                    note: `Risk Score: ${nist.riskScore}/25 (Likelihood ${nist.likelihood} × Impact ${nist.impact})`,
                  },
                  {
                    step: 'Monitor',
                    note:
                      nist.riskScore >= 15
                        ? 'Quarterly review recommended'
                        : 'Annual review recommended',
                  },
                ].map(({ step, note }, i) => (
                  <div key={step} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground">{step}: </span>
                      <span className="text-xs text-muted-foreground">{note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-4 space-y-3">
              <h4 className="text-sm font-bold text-foreground">SP 800-53 Control Gaps</h4>
              {nist.controlGaps.map((gap, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="text-status-warning shrink-0">▲</span>
                  <span className="text-muted-foreground">{gap}</span>
                </div>
              ))}
            </div>

            <div
              className={`p-3 rounded-lg border text-sm font-medium ${
                nist.riskScore >= 20
                  ? 'bg-status-error/10 border-status-error/30 text-status-error'
                  : nist.riskScore >= 12
                    ? 'bg-status-warning/10 border-status-warning/30 text-status-warning'
                    : 'bg-status-success/10 border-status-success/30 text-status-success'
              }`}
            >
              {nist.recommendation}
            </div>
          </div>
        </TabsContent>

        {/* ISO 27005 */}
        <TabsContent value="iso-27005">
          <div className="space-y-4">
            <div className="glass-panel p-4">
              <h4 className="text-sm font-bold text-foreground mb-3">Threat Scenarios</h4>
              {iso.threatScenarios.map((t, i) => (
                <div key={i} className="flex gap-2 text-xs mb-2">
                  <span className="text-status-error shrink-0">⚠</span>
                  <span className="text-muted-foreground">{t}</span>
                </div>
              ))}
            </div>

            {/* 5×5 Risk Matrix */}
            <div className="glass-panel p-4">
              <h4 className="text-sm font-bold text-foreground mb-3">Risk Matrix (5×5)</h4>
              <div className="grid gap-1" style={{ gridTemplateColumns: 'auto repeat(5,1fr)' }}>
                <div className="text-[9px] text-muted-foreground text-center p-1">Like →</div>
                {[1, 2, 3, 4, 5].map((c) => (
                  <div key={c} className="text-[9px] text-muted-foreground text-center p-1">
                    {c}
                  </div>
                ))}
                {[5, 4, 3, 2, 1].map((row) => (
                  <React.Fragment key={row}>
                    <div className="text-[9px] text-muted-foreground text-right pr-1 flex items-center justify-end">
                      {row}
                    </div>
                    {[1, 2, 3, 4, 5].map((col) => {
                      const product = row * col
                      const isActive = row === iso.consequenceScore && col === iso.likelihoodScore
                      return (
                        <div
                          key={col}
                          className={`h-8 rounded flex items-center justify-center text-[9px] font-bold border transition-all ${
                            isActive ? 'ring-2 ring-primary scale-110' : ''
                          } ${
                            product >= 15
                              ? 'bg-status-error/20 text-status-error border-status-error/30'
                              : product >= 10
                                ? 'bg-status-warning/20 text-status-warning border-status-warning/30'
                                : product >= 6
                                  ? 'bg-status-info/20 text-status-info border-status-info/30'
                                  : 'bg-status-success/10 text-status-success border-status-success/20'
                          }`}
                        >
                          {product}
                        </div>
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <div
                  className={`text-sm font-bold px-3 py-1 rounded border ${
                    iso.riskLevel === 'Critical'
                      ? 'bg-status-error/10 text-status-error border-status-error/30'
                      : iso.riskLevel === 'High'
                        ? 'bg-status-warning/10 text-status-warning border-status-warning/30'
                        : iso.riskLevel === 'Medium'
                          ? 'bg-status-info/10 text-status-info border-status-info/30'
                          : 'bg-status-success/10 text-status-success border-status-success/30'
                  }`}
                >
                  Risk Level: {iso.riskLevel}
                </div>
                <div className="text-sm font-bold px-3 py-1 rounded border bg-muted text-foreground border-border">
                  Treatment: {iso.treatment}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* FAIR */}
        <TabsContent value="fair">
          <div className="space-y-4">
            <div className="glass-panel p-4 space-y-4">
              <h4 className="text-sm font-bold text-foreground">FAIR Quantitative Risk Analysis</h4>
              <p className="text-xs text-muted-foreground">
                Adjust the sliders below to model Loss Event Frequency (LEF) and Probable Loss
                Magnitude (PLM) for this asset. The Annualized Loss Expectancy (ALE) informs the
                business case for PQC investment.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-foreground">
                    Threat Event Frequency (TEF)
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0.1}
                      max={10}
                      step={0.1}
                      value={tef}
                      onChange={(e) => setTef(Number(e.target.value))}
                      className="flex-1 accent-primary"
                      aria-label="Threat event frequency"
                    />
                    <span className="text-xs font-mono text-foreground w-12 text-right">
                      {tef.toFixed(1)}×/yr
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-foreground">
                    Vulnerability (% chance per event)
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={100}
                      step={1}
                      value={vulnerability}
                      onChange={(e) => setVulnerability(Number(e.target.value))}
                      className="flex-1 accent-primary"
                      aria-label="Vulnerability percentage"
                    />
                    <span className="text-xs font-mono text-foreground w-12 text-right">
                      {vulnerability}%
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-foreground">
                    Primary Loss ($) — breach cost
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={100000}
                      max={50000000}
                      step={100000}
                      value={primaryLoss}
                      onChange={(e) => setPrimaryLoss(Number(e.target.value))}
                      className="flex-1 accent-primary"
                      aria-label="Primary loss amount"
                    />
                    <span className="text-xs font-mono text-foreground w-16 text-right">
                      {formatCurrency(primaryLoss)}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-foreground">
                    Secondary Loss ($) — fines, reputational
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={20000000}
                      step={100000}
                      value={secondaryLoss}
                      onChange={(e) => setSecondaryLoss(Number(e.target.value))}
                      className="flex-1 accent-primary"
                      aria-label="Secondary loss amount"
                    />
                    <span className="text-xs font-mono text-foreground w-16 text-right">
                      {formatCurrency(secondaryLoss)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 border border-border grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ALE (Min)</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(fair.aleMin)}</p>
                </div>
                <div className="border-x border-border">
                  <p className="text-xs text-muted-foreground mb-1">ALE (Most Likely)</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(fair.aleMostLikely)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ALE (Max)</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(fair.aleMax)}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Interpretation:</strong> PQC migration for this
                asset is financially justified if migration cost is less than{' '}
                <strong className="text-primary">{formatCurrency(fair.aleMostLikely)}/year</strong>.
                Default values seeded from IBM Cost of Data Breach 2024 average ($4.88M).
              </p>
            </div>
          </div>
        </TabsContent>

        {/* DORA/NIS2 */}
        <TabsContent value="dora-nis2">
          <div className="space-y-4">
            <div className="glass-panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">
                  DORA / NIS2 ICT Resilience Assessment
                </h4>
                <div
                  className={`text-sm font-bold px-3 py-1 rounded border ${
                    dora.gapScore >= 6
                      ? 'bg-status-error/10 text-status-error border-status-error/30'
                      : dora.gapScore >= 4
                        ? 'bg-status-warning/10 text-status-warning border-status-warning/30'
                        : 'bg-status-success/10 text-status-success border-status-success/30'
                  }`}
                >
                  Gap Score: {dora.gapScore}/10
                </div>
              </div>

              <div className="space-y-2">
                {dora.pillars.map((pillar) => (
                  <div
                    key={pillar.name}
                    className={`flex gap-3 p-3 rounded-lg border ${
                      pillar.compliant
                        ? 'bg-status-success/5 border-status-success/20'
                        : 'bg-status-error/5 border-status-error/20'
                    }`}
                  >
                    <span
                      className={`text-sm font-bold shrink-0 ${pillar.compliant ? 'text-status-success' : 'text-status-error'}`}
                    >
                      {pillar.compliant ? '✓' : '✗'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {pillar.name}{' '}
                        <span className="font-normal text-muted-foreground">
                          — {pillar.article}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">{pillar.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-4 space-y-2">
              <h4 className="text-sm font-bold text-foreground">Priority Remediations</h4>
              {dora.priorityRemediations.map((r, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="text-primary shrink-0 font-bold">{i + 1}.</span>
                  <span className="text-muted-foreground">{r}</span>
                </div>
              ))}
              {dora.cryptoCompliant ? (
                <p className="text-xs text-status-success">
                  ✓ Current encryption is not RSA/ECC — may satisfy "state-of-the-art" interim
                  requirement
                </p>
              ) : (
                <p className="text-xs text-status-error">
                  ✗ RSA/ECC detected — plan migration to satisfy NIS2 Article 21 "state-of-the-art"
                  cryptography requirement
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Comparison */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Methodology Comparison Summary</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 pr-4 font-medium">Methodology</th>
                <th className="text-left py-2 pr-4 font-medium">Primary Output</th>
                <th className="text-left py-2 pr-4 font-medium">
                  Result for &ldquo;{selectedAsset.name}&rdquo;
                </th>
                <th className="text-left py-2 font-medium">Best Audience</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-bold text-foreground">NIST RMF</td>
                <td className="py-2 pr-4 text-muted-foreground">FIPS 199 + risk score (1-25)</td>
                <td className="py-2 pr-4">
                  <span
                    className={`font-bold ${nist.riskScore >= 15 ? 'text-status-error' : nist.riskScore >= 10 ? 'text-status-warning' : 'text-status-success'}`}
                  >
                    {nist.fips199Level} impact — {nist.riskScore}/25
                  </span>
                </td>
                <td className="py-2 text-muted-foreground">US Federal, DoD</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-bold text-foreground">ISO 27005</td>
                <td className="py-2 pr-4 text-muted-foreground">Risk level + treatment</td>
                <td className="py-2 pr-4">
                  <span
                    className={`font-bold ${iso.riskLevel === 'Critical' ? 'text-status-error' : iso.riskLevel === 'High' ? 'text-status-warning' : 'text-foreground'}`}
                  >
                    {iso.riskLevel} — {iso.treatment}
                  </span>
                </td>
                <td className="py-2 text-muted-foreground">ISO 27001 orgs, international</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-bold text-foreground">FAIR</td>
                <td className="py-2 pr-4 text-muted-foreground">Annualized loss ($)</td>
                <td className="py-2 pr-4">
                  <span className="font-bold text-primary">
                    {formatCurrency(fair.aleMostLikely)}/yr
                  </span>
                </td>
                <td className="py-2 text-muted-foreground">Finance, board reporting</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-bold text-foreground">DORA/NIS2</td>
                <td className="py-2 pr-4 text-muted-foreground">ICT gap score (0-10)</td>
                <td className="py-2 pr-4">
                  <span
                    className={`font-bold ${dora.gapScore >= 6 ? 'text-status-error' : dora.gapScore >= 4 ? 'text-status-warning' : 'text-status-success'}`}
                  >
                    {dora.gapScore}/10 gaps
                  </span>
                </td>
                <td className="py-2 text-muted-foreground">EU financial, essential services</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
