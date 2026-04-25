// SPDX-License-Identifier: GPL-3.0-only
import React, { useId, useMemo, useState } from 'react'
import { ChevronDown, ExternalLink, Database, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import type { CbomExportItem } from '../data/workshopTypes'

const fmt$ = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(0)}k`
      : `$${n.toFixed(0)}`

const fmtPct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`
const fmtYears = (n: number) => (Number.isFinite(n) ? `${n.toFixed(2)} y` : 'never in horizon')

// ───────────────────────────────────────────────────────────────────────────────
// Inline math-model accordion. Lighter than ui/CollapsibleSection (no glass-panel,
// no large padding) so each benefit stream's headline + math fit one card.
// ───────────────────────────────────────────────────────────────────────────────
const MathModel: React.FC<{
  formula: React.ReactNode
  explanation: React.ReactNode
  source?: { label: string; href: string }
  children: React.ReactNode
  defaultOpen?: boolean
}> = ({ formula, explanation, source, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()
  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        className="h-auto p-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        <ChevronDown
          size={12}
          className={clsx('transition-transform duration-200', open && 'rotate-180')}
        />
        {open ? 'Hide math' : 'Show math'}
      </Button>
      {open && (
        <div id={contentId} className="mt-2 space-y-3">
          <div className="bg-background/60 rounded p-2 border border-border font-mono text-[11px] text-foreground whitespace-pre-wrap">
            {formula}
          </div>
          <div className="space-y-2">{children}</div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{explanation}</p>
          {source && (
            <a
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              <ExternalLink size={11} />
              {source.label}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// Parameter slider: the editable knobs inside each sub-model.
const ParamSlider: React.FC<{
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  format?: (v: number) => string
  hint?: string
}> = ({ label, value, onChange, min, max, step, format, hint }) => {
  const id = useId()
  const formatted = format ? format(value) : String(value)
  return (
    <div>
      <div className="flex justify-between items-baseline gap-2">
        <label htmlFor={id} className="text-[11px] font-medium text-foreground">
          {label}
        </label>
        <span className="text-[11px] font-bold text-foreground tabular-nums">{formatted}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────────
// Sub-model parameter shapes + computers. Defaults are calibrated so that the
// rolled-up headline values match the previous flat-slider defaults — no
// regression in Scenario A/B totals at first paint.
// ───────────────────────────────────────────────────────────────────────────────

interface CostParams {
  fteCount: number
  fteLoadedCost: number
  clmToolLicense: number
  caContractAnnual: number
  hsmLifecycleAmortized: number
  auditAttestationAnnual: number
}
const costDefaults: CostParams = {
  fteCount: 6,
  fteLoadedCost: 200_000,
  clmToolLicense: 150_000,
  caContractAnnual: 120_000,
  hsmLifecycleAmortized: 180_000,
  auditAttestationAnnual: 150_000,
}
const computeCost = (p: CostParams) =>
  p.fteCount * p.fteLoadedCost +
  p.clmToolLicense +
  p.caContractAnnual +
  p.hsmLifecycleAmortized +
  p.auditAttestationAnnual
// 6 × 200k + 150k + 120k + 180k + 150k = 1,800,000

interface OutageParams {
  avgOutageCost: number
  annualIncidence: number
  avoidanceFactor: number
}
const outageDefaults: OutageParams = {
  avgOutageCost: 11_000_000,
  annualIncidence: 0.86,
  avoidanceFactor: 0.69,
}
const computeOutage = (p: OutageParams) => p.avgOutageCost * p.annualIncidence * p.avoidanceFactor
// 11M × 0.86 × 0.69 ≈ 6.53M

interface ClmParams {
  forresterCompositeAnnual: number
  scaleFactor: number
}
const clmDefaults: ClmParams = {
  forresterCompositeAnnual: 4_430_000,
  scaleFactor: 0.74,
}
const computeClm = (p: ClmParams) => p.forresterCompositeAnnual * p.scaleFactor
// 4.43M × 0.74 ≈ 3.28M

interface FipsParams {
  hsmCount: number
  hsmDriftRate: number
  hsmRemediationCost: number
  libraryCount: number
  libraryDriftRate: number
  libraryRemediationCost: number
}
const fipsDefaults: FipsParams = {
  hsmCount: 10,
  hsmDriftRate: 0.18,
  hsmRemediationCost: 600_000,
  libraryCount: 15,
  libraryDriftRate: 0.2,
  libraryRemediationCost: 40_000,
}
const computeFips = (p: FipsParams) =>
  p.hsmCount * p.hsmDriftRate * p.hsmRemediationCost +
  p.libraryCount * p.libraryDriftRate * p.libraryRemediationCost
// 10 × 0.18 × 600k + 15 × 0.20 × 40k = 1,080,000 + 120,000 = 1.2M

interface CveParams {
  cvesPerYear: number
  hoursSavedPerCve: number
  loadedHourlyRate: number
  reducedBreachExposure: number
}
const cveDefaults: CveParams = {
  cvesPerYear: 4,
  hoursSavedPerCve: 240,
  loadedHourlyRate: 150,
  reducedBreachExposure: 600_000,
}
const computeCve = (p: CveParams) =>
  p.cvesPerYear * p.hoursSavedPerCve * p.loadedHourlyRate + p.reducedBreachExposure
// 4 × 240 × 150 + 600k = 144k + 600k = 744k

interface MaParams {
  baselinePqcTransitionCost: number
  cryptocoeSavingsFactor: number
  confidenceFactor: number
  amortizeYears: number
}
const maDefaults: MaParams = {
  baselinePqcTransitionCost: 12_000_000,
  cryptocoeSavingsFactor: 0.5,
  confidenceFactor: 0.7,
  amortizeYears: 3,
}
const computeMa = (p: MaParams) =>
  (p.baselinePqcTransitionCost * p.cryptocoeSavingsFactor * p.confidenceFactor) / p.amortizeYears
// (12M × 0.5 × 0.7) / 3 = 1.4M

interface QuantumParams {
  valueOfLongLivedSecrets: number
  hndlCaptureFraction: number
}
const quantumDefaults: QuantumParams = {
  valueOfLongLivedSecrets: 30_000_000,
  hndlCaptureFraction: 0.4,
}
// p_crqc is a global, so it lives outside the sub-model
const computeQuantum = (p: QuantumParams) => p.valueOfLongLivedSecrets * p.hndlCaptureFraction
// 30M × 0.4 = 12M (× p_crqc applied globally)

// ───────────────────────────────────────────────────────────────────────────────
// Output math: payback (cumulative-cashflow crossover) + NPV (discounted).
// Replaces the prior `annualProgramCost / qIndep` formula which did not
// represent payback for an ongoing program.
// ───────────────────────────────────────────────────────────────────────────────
function paybackYears(annualNetCashflow: number): number {
  // Constant-cashflow shortcut: net positive → payback at year 1; never otherwise.
  // (Fractional within year 1 because the program only "owes" one year of cost
  // by the end of year 1; if benefit covers it, payback = 1.)
  if (annualNetCashflow <= 0) return Infinity
  return 1
}
function npv(annualNetCashflow: number, horizon: number, rate: number): number {
  let total = 0
  for (let t = 1; t <= horizon; t++) {
    total += annualNetCashflow / Math.pow(1 + rate, t)
  }
  return total
}

// ───────────────────────────────────────────────────────────────────────────────

export interface NoRegretROIBuilderProps {
  cbomAssets?: CbomExportItem[]
}

export const NoRegretROIBuilder: React.FC<NoRegretROIBuilderProps> = ({ cbomAssets = [] }) => {
  const [horizonYears, setHorizonYears] = useState(3)
  const [discountRate, setDiscountRate] = useState(0)
  const [pCrqc, setPCrqc] = useState(1.0)

  const [costP, setCostP] = useState<CostParams>(costDefaults)
  const [outageP, setOutageP] = useState<OutageParams>(outageDefaults)
  const [clmP, setClmP] = useState<ClmParams>(clmDefaults)
  const [fipsP, setFipsP] = useState<FipsParams>(fipsDefaults)
  const [cveP, setCveP] = useState<CveParams>(cveDefaults)
  const [maP, setMaP] = useState<MaParams>(maDefaults)
  const [quantumP, setQuantumP] = useState<QuantumParams>(quantumDefaults)

  const annualProgramCost = useMemo(() => computeCost(costP), [costP])
  const outage = useMemo(() => computeOutage(outageP), [outageP])
  const clm = useMemo(() => computeClm(clmP), [clmP])
  const fips = useMemo(() => computeFips(fipsP), [fipsP])
  const cve = useMemo(() => computeCve(cveP), [cveP])
  const ma = useMemo(() => computeMa(maP), [maP])
  const quantumRaw = useMemo(() => computeQuantum(quantumP), [quantumP])

  const qIndep = outage + clm + fips + cve + ma
  const qDep = quantumRaw * pCrqc

  const totalCost = annualProgramCost * horizonYears
  const benefitA = qIndep * horizonYears
  const benefitB = (qIndep + qDep) * horizonYears

  const roiA = totalCost === 0 ? 0 : ((benefitA - totalCost) / totalCost) * 100
  const roiB = totalCost === 0 ? 0 : ((benefitB - totalCost) / totalCost) * 100

  const paybackA = paybackYears(qIndep - annualProgramCost)
  const paybackB = paybackYears(qIndep + qDep - annualProgramCost)

  const npvA = npv(qIndep - annualProgramCost, horizonYears, discountRate)
  const npvB = npv(qIndep + qDep - annualProgramCost, horizonYears, discountRate)

  // Sensitivity strip: each stream's share of total annual benefit (Scenario B).
  const sensitivity = useMemo(() => {
    const totalAnnual = qIndep + qDep
    if (totalAnnual <= 0) return []
    return [
      { id: 'outage', label: 'Outage avoidance', value: outage, qDep: false },
      { id: 'clm', label: 'CLM automation', value: clm, qDep: false },
      { id: 'fips', label: 'FIPS drift', value: fips, qDep: false },
      { id: 'cve', label: 'Library CVE', value: cve, qDep: false },
      { id: 'ma', label: 'M&A readiness', value: ma, qDep: false },
      { id: 'quantum', label: 'Quantum breach', value: qDep, qDep: true },
    ]
      .map((s) => ({ ...s, share: s.value / totalAnnual }))
      .sort((a, b) => b.share - a.share)
  }, [outage, clm, fips, cve, ma, qDep, qIndep])

  // Pull HSM + library counts from the CBOM built in Step 3.
  const hsmFromCbom = cbomAssets.filter((a) => a.type === 'hsm').length
  const libFromCbom = cbomAssets.filter((a) => a.type === 'library').length
  const canPullFromCbom = hsmFromCbom > 0 || libFromCbom > 0
  const handlePullFromCbom = () => {
    setFipsP((p) => ({
      ...p,
      hsmCount: hsmFromCbom > 0 ? hsmFromCbom : p.hsmCount,
      libraryCount: libFromCbom > 0 ? libFromCbom : p.libraryCount,
    }))
    setCveP((p) => ({
      ...p,
      cvesPerYear: libFromCbom > 0 ? Math.max(1, Math.round(libFromCbom * 0.3)) : p.cvesPerYear,
    }))
  }

  const handleResetAll = () => {
    setHorizonYears(3)
    setDiscountRate(0)
    setPCrqc(1.0)
    setCostP(costDefaults)
    setOutageP(outageDefaults)
    setClmP(clmDefaults)
    setFipsP(fipsDefaults)
    setCveP(cveDefaults)
    setMaP(maDefaults)
    setQuantumP(quantumDefaults)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-3xl">
          Tune your organization&apos;s assumptions. Every headline number expands into the
          underlying math with editable parameters and the source it&apos;s anchored to. The model
          separates benefit streams that pay off <strong>regardless</strong> of quantum arrival from
          the single stream that depends on a CRQC materializing within the horizon.
        </p>
        <div className="flex gap-2">
          {canPullFromCbom && (
            <Button
              variant="outline"
              onClick={handlePullFromCbom}
              className="text-xs flex items-center gap-1"
            >
              <Database size={12} />
              Pull from Step 3 CBOM ({hsmFromCbom} HSM / {libFromCbom} lib)
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleResetAll}
            className="text-xs flex items-center gap-1"
          >
            <RotateCcw size={12} />
            Reset all
          </Button>
        </div>
      </div>

      {/* ── Global controls ──────────────────────────────────────────────────── */}
      <div className="bg-muted/40 rounded-lg p-4 border border-border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ParamSlider
            label="Horizon"
            value={horizonYears}
            onChange={setHorizonYears}
            min={1}
            max={10}
            step={1}
            format={(v) => `${v} y`}
            hint="Years over which costs and benefits are summed."
          />
          <ParamSlider
            label="Discount rate"
            value={discountRate}
            onChange={setDiscountRate}
            min={0}
            max={0.15}
            step={0.005}
            format={(v) => fmtPct(v, 1)}
            hint="0% = straight-line. Increase to penalize future cashflows for NPV."
          />
          <ParamSlider
            label="P(CRQC within horizon)"
            value={pCrqc}
            onChange={setPCrqc}
            min={0}
            max={1}
            step={0.05}
            format={(v) => fmtPct(v, 0)}
            hint="Probability of cryptanalytically-relevant quantum computer arriving within the horizon. Multiplies the quantum-dependent stream in Scenario B."
          />
        </div>
      </div>

      {/* ── Annual program cost ──────────────────────────────────────────────── */}
      <div className="bg-muted/40 rounded-lg p-4 border border-border">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-foreground">Annual CPM program cost</span>
          <span className="text-sm font-bold text-primary">{fmt$(annualProgramCost)}/yr</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Headcount + tooling + CA contracts + HSM lifecycle + audit.
        </p>
        <MathModel
          formula={`fte_count × fte_loaded_cost + clm_tool_license + ca_contract_annual + hsm_lifecycle_amortized + audit_attestation_annual\n= ${costP.fteCount} × ${fmt$(costP.fteLoadedCost)} + ${fmt$(costP.clmToolLicense)} + ${fmt$(costP.caContractAnnual)} + ${fmt$(costP.hsmLifecycleAmortized)} + ${fmt$(costP.auditAttestationAnnual)}\n= ${fmt$(annualProgramCost)}/yr`}
          explanation="Anchored to the CSWP.39 Program Office Model: 5 named CPM roles (Crypto PM, FIPS/CMVP Engineer, CLM Architect, Crypto Developer Champion, Supplier Risk Analyst) plus tooling, CA contracts, amortised HSM lifecycle, and annual audit/attestation. Adjust headcount and tool license to match your org size."
        >
          <ParamSlider
            label="FTE count"
            value={costP.fteCount}
            onChange={(v) => setCostP((p) => ({ ...p, fteCount: v }))}
            min={1}
            max={20}
            step={1}
            format={(v) => `${v} FTE`}
          />
          <ParamSlider
            label="Fully-loaded cost per FTE"
            value={costP.fteLoadedCost}
            onChange={(v) => setCostP((p) => ({ ...p, fteLoadedCost: v }))}
            min={100_000}
            max={400_000}
            step={10_000}
            format={fmt$}
          />
          <ParamSlider
            label="CLM tool license"
            value={costP.clmToolLicense}
            onChange={(v) => setCostP((p) => ({ ...p, clmToolLicense: v }))}
            min={0}
            max={1_000_000}
            step={10_000}
            format={fmt$}
          />
          <ParamSlider
            label="CA contracts (annual)"
            value={costP.caContractAnnual}
            onChange={(v) => setCostP((p) => ({ ...p, caContractAnnual: v }))}
            min={0}
            max={1_000_000}
            step={10_000}
            format={fmt$}
          />
          <ParamSlider
            label="HSM lifecycle (amortized)"
            value={costP.hsmLifecycleAmortized}
            onChange={(v) => setCostP((p) => ({ ...p, hsmLifecycleAmortized: v }))}
            min={0}
            max={2_000_000}
            step={20_000}
            format={fmt$}
          />
          <ParamSlider
            label="Audit + attestation (annual)"
            value={costP.auditAttestationAnnual}
            onChange={(v) => setCostP((p) => ({ ...p, auditAttestationAnnual: v }))}
            min={0}
            max={1_000_000}
            step={10_000}
            format={fmt$}
          />
        </MathModel>
      </div>

      {/* ── Benefit streams ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 1. Outage avoidance */}
        <div className="rounded-lg p-3 border bg-status-success/5 border-status-success/20">
          <div className="flex justify-between items-start gap-2 mb-1">
            <span className="text-xs font-bold text-foreground">Cert-outage avoidance</span>
            <span className="text-xs font-bold text-foreground whitespace-nowrap">
              {fmt$(outage)}/yr
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Average outage cost × annual incidence × fraction CLM automation can prevent.
          </p>
          <MathModel
            formula={`avg_outage_cost × annual_incidence × avoidance_factor\n= ${fmt$(outageP.avgOutageCost)} × ${fmtPct(outageP.annualIncidence, 0)} × ${fmtPct(outageP.avoidanceFactor, 0)}\n= ${fmt$(outage)}/yr`}
            explanation="86% of enterprises had ≥1 cert-related outage in the last 12 months at an average cost of $11M (Entrust/Ponemon 2024 PKI & PQC Trends Study, 2,000+ respondents across 9 countries). Avoidance factor is the share of those outages that automated CLM, observability, and shadow-cert discovery actually prevent — calibrate to your tooling maturity."
            source={{
              label: 'Entrust / Ponemon 2024 Global PKI & PQC Trends Study',
              href: 'https://www.entrust.com/resources/reports/ponemon-post-quantum-report',
            }}
          >
            <ParamSlider
              label="Avg outage cost"
              value={outageP.avgOutageCost}
              onChange={(v) => setOutageP((p) => ({ ...p, avgOutageCost: v }))}
              min={1_000_000}
              max={25_000_000}
              step={500_000}
              format={fmt$}
            />
            <ParamSlider
              label="Annual incidence"
              value={outageP.annualIncidence}
              onChange={(v) => setOutageP((p) => ({ ...p, annualIncidence: v }))}
              min={0}
              max={1}
              step={0.01}
              format={(v) => fmtPct(v, 0)}
            />
            <ParamSlider
              label="Avoidance factor"
              value={outageP.avoidanceFactor}
              onChange={(v) => setOutageP((p) => ({ ...p, avoidanceFactor: v }))}
              min={0}
              max={1}
              step={0.01}
              format={(v) => fmtPct(v, 0)}
              hint="Share of outages CLM automation actually prevents."
            />
          </MathModel>
        </div>

        {/* 2. CLM automation */}
        <div className="rounded-lg p-3 border bg-status-success/5 border-status-success/20">
          <div className="flex justify-between items-start gap-2 mb-1">
            <span className="text-xs font-bold text-foreground">CLM automation labor savings</span>
            <span className="text-xs font-bold text-foreground whitespace-nowrap">
              {fmt$(clm)}/yr
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Forrester DigiCert ONE composite, scaled to your estate size.
          </p>
          <MathModel
            formula={`forrester_composite_annual × scale_factor\n= ${fmt$(clmP.forresterCompositeAnnual)} × ${fmtPct(clmP.scaleFactor, 0)}\n= ${fmt$(clm)}/yr`}
            explanation="Forrester TEI of DigiCert ONE (July 2025) modeled a composite organization realizing $13.3M of benefits over 3 years — $4.43M/year — from CLM automation: $7.9M labor savings, $2.8M reduced security incidents, $2.83M revenue and efficiencies. Scale factor maps composite benefit to your estate (cert volume, current manual effort, automation maturity). This is a vendor-commissioned TEI on a specific product — treat as upper-bound benchmark, not a guaranteed outcome."
            source={{
              label: 'Forrester TEI of DigiCert ONE (July 2025)',
              href: 'https://www.digicert.com/news/total-economic-report-shows-big-roi-with-digicert-one',
            }}
          >
            <ParamSlider
              label="Forrester composite (annual)"
              value={clmP.forresterCompositeAnnual}
              onChange={(v) => setClmP((p) => ({ ...p, forresterCompositeAnnual: v }))}
              min={1_000_000}
              max={10_000_000}
              step={50_000}
              format={fmt$}
              hint="$13.3M / 3y = $4.43M/yr per DigiCert ONE TEI composite."
            />
            <ParamSlider
              label="Scale factor (your estate vs composite)"
              value={clmP.scaleFactor}
              onChange={(v) => setClmP((p) => ({ ...p, scaleFactor: v }))}
              min={0}
              max={2}
              step={0.01}
              format={(v) => `${v.toFixed(2)}×`}
            />
          </MathModel>
        </div>

        {/* 3. FIPS drift */}
        <div className="rounded-lg p-3 border bg-status-success/5 border-status-success/20">
          <div className="flex justify-between items-start gap-2 mb-1">
            <span className="text-xs font-bold text-foreground">
              FIPS 140-3 drift remediation avoided
            </span>
            <span className="text-xs font-bold text-foreground whitespace-nowrap">
              {fmt$(fips)}/yr
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Expected emergency re-procurement / re-validation cost across HSMs and libraries.
          </p>
          <MathModel
            formula={`hsm_count × hsm_drift_rate × hsm_remediation_cost\n  + library_count × library_drift_rate × library_remediation_cost\n= ${fipsP.hsmCount} × ${fmtPct(fipsP.hsmDriftRate, 0)} × ${fmt$(fipsP.hsmRemediationCost)}\n  + ${fipsP.libraryCount} × ${fmtPct(fipsP.libraryDriftRate, 0)} × ${fmt$(fipsP.libraryRemediationCost)}\n= ${fmt$(fips)}/yr`}
            explanation="Every CMVP certificate is bound to a specific version, firmware, and platform. The September 2025 FIPS 140-3 IG retroactively added new self-test requirements for ML-KEM/ML-DSA/SLH-DSA, and the CMVP Modules-in-Process queue runs 18–24 months. Drift rate captures how often a given HSM or library hits an IG update, EoL, or revocation event in a year. Remediation cost is the emergency re-procurement or re-validation expense when it does. Use ‘Pull from Step 3 CBOM’ to populate the asset counts from your inventory."
          >
            <ParamSlider
              label="HSM count"
              value={fipsP.hsmCount}
              onChange={(v) => setFipsP((p) => ({ ...p, hsmCount: v }))}
              min={0}
              max={100}
              step={1}
            />
            <ParamSlider
              label="HSM drift rate (per year)"
              value={fipsP.hsmDriftRate}
              onChange={(v) => setFipsP((p) => ({ ...p, hsmDriftRate: v }))}
              min={0}
              max={1}
              step={0.01}
              format={(v) => fmtPct(v, 0)}
            />
            <ParamSlider
              label="HSM remediation cost"
              value={fipsP.hsmRemediationCost}
              onChange={(v) => setFipsP((p) => ({ ...p, hsmRemediationCost: v }))}
              min={50_000}
              max={2_000_000}
              step={50_000}
              format={fmt$}
            />
            <ParamSlider
              label="Library count"
              value={fipsP.libraryCount}
              onChange={(v) => setFipsP((p) => ({ ...p, libraryCount: v }))}
              min={0}
              max={200}
              step={1}
            />
            <ParamSlider
              label="Library drift rate (per year)"
              value={fipsP.libraryDriftRate}
              onChange={(v) => setFipsP((p) => ({ ...p, libraryDriftRate: v }))}
              min={0}
              max={1}
              step={0.01}
              format={(v) => fmtPct(v, 0)}
            />
            <ParamSlider
              label="Library remediation cost"
              value={fipsP.libraryRemediationCost}
              onChange={(v) => setFipsP((p) => ({ ...p, libraryRemediationCost: v }))}
              min={5_000}
              max={500_000}
              step={5_000}
              format={fmt$}
            />
          </MathModel>
        </div>

        {/* 4. Library CVE */}
        <div className="rounded-lg p-3 border bg-status-success/5 border-status-success/20">
          <div className="flex justify-between items-start gap-2 mb-1">
            <span className="text-xs font-bold text-foreground">
              Library-CVE response acceleration
            </span>
            <span className="text-xs font-bold text-foreground whitespace-nowrap">
              {fmt$(cve)}/yr
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Reclaimed engineering time + reduced exposure-window breach risk.
          </p>
          <MathModel
            formula={`cves_per_year × hours_saved_per_cve × loaded_hourly_rate\n  + reduced_breach_exposure\n= ${cveP.cvesPerYear} × ${cveP.hoursSavedPerCve} × ${fmt$(cveP.loadedHourlyRate)}\n  + ${fmt$(cveP.reducedBreachExposure)}\n= ${fmt$(cve)}/yr`}
            explanation="Domain model anchored to OpenSSL 1.1.1 EoL (September 2023) and the Bouncy Castle high-severity CVE cadence already documented in the module narrative. CBOM-driven discovery shortens the detect → patch → attest cycle, reducing both engineering effort and the window during which a vulnerable library is reachable from production traffic."
          >
            <ParamSlider
              label="High-severity CVEs per year"
              value={cveP.cvesPerYear}
              onChange={(v) => setCveP((p) => ({ ...p, cvesPerYear: v }))}
              min={0}
              max={20}
              step={1}
            />
            <ParamSlider
              label="Hours saved per CVE"
              value={cveP.hoursSavedPerCve}
              onChange={(v) => setCveP((p) => ({ ...p, hoursSavedPerCve: v }))}
              min={0}
              max={1000}
              step={20}
              format={(v) => `${v} h`}
            />
            <ParamSlider
              label="Loaded hourly rate"
              value={cveP.loadedHourlyRate}
              onChange={(v) => setCveP((p) => ({ ...p, loadedHourlyRate: v }))}
              min={50}
              max={400}
              step={10}
              format={fmt$}
            />
            <ParamSlider
              label="Reduced breach-exposure value"
              value={cveP.reducedBreachExposure}
              onChange={(v) => setCveP((p) => ({ ...p, reducedBreachExposure: v }))}
              min={0}
              max={5_000_000}
              step={50_000}
              format={fmt$}
              hint="Exposure-window × breach probability × incident impact."
            />
          </MathModel>
        </div>

        {/* 5. M&A readiness */}
        <div className="rounded-lg p-3 border bg-status-success/5 border-status-success/20">
          <div className="flex justify-between items-start gap-2 mb-1">
            <span className="text-xs font-bold text-foreground">
              Time-to-market / M&amp;A readiness
            </span>
            <span className="text-xs font-bold text-foreground whitespace-nowrap">
              {fmt$(ma)}/yr
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Avoided PQC-transition cost from establishing a CryptoCOE before 2028.
          </p>
          <MathModel
            formula={`(baseline_pqc_transition_cost × cryptocoe_savings_factor × confidence_factor)\n  / amortize_years\n= (${fmt$(maP.baselinePqcTransitionCost)} × ${fmtPct(maP.cryptocoeSavingsFactor, 0)} × ${fmtPct(maP.confidenceFactor, 0)}) / ${maP.amortizeYears}\n= ${fmt$(ma)}/yr`}
            explanation="Gartner research by David Mahdi and Brian Lowans: organizations that establish a Cryptographic Center of Excellence before 2028 will see roughly 50% lower PQC transition cost than those without one. This benefit is independent of CRQC arrival — it accrues from the unification of crypto policy, faster M&A integration, and reduced firefighting — which is why this stream is NOT flagged quantum-dependent. Confidence factor adjusts for your readiness; amortize over the years it takes to realize."
            source={{
              label: 'Gartner — Mahdi & Lowans (CryptoCOE research)',
              href: 'https://www.gartner.com/en/documents/7116630',
            }}
          >
            <ParamSlider
              label="Baseline PQC transition cost (one-time)"
              value={maP.baselinePqcTransitionCost}
              onChange={(v) => setMaP((p) => ({ ...p, baselinePqcTransitionCost: v }))}
              min={1_000_000}
              max={50_000_000}
              step={500_000}
              format={fmt$}
            />
            <ParamSlider
              label="CryptoCOE savings factor"
              value={maP.cryptocoeSavingsFactor}
              onChange={(v) => setMaP((p) => ({ ...p, cryptocoeSavingsFactor: v }))}
              min={0}
              max={0.7}
              step={0.01}
              format={(v) => fmtPct(v, 0)}
              hint="Gartner: ~50% with CryptoCOE before 2028."
            />
            <ParamSlider
              label="Confidence factor"
              value={maP.confidenceFactor}
              onChange={(v) => setMaP((p) => ({ ...p, confidenceFactor: v }))}
              min={0}
              max={1}
              step={0.01}
              format={(v) => fmtPct(v, 0)}
            />
            <ParamSlider
              label="Amortize over (years)"
              value={maP.amortizeYears}
              onChange={(v) => setMaP((p) => ({ ...p, amortizeYears: v }))}
              min={1}
              max={10}
              step={1}
              format={(v) => `${v} y`}
            />
          </MathModel>
        </div>

        {/* 6. Quantum breach (Scenario B) */}
        <div className="rounded-lg p-3 border bg-status-warning/10 border-status-warning/30">
          <div className="flex justify-between items-start gap-2 mb-1">
            <span className="text-xs font-bold text-foreground">
              Quantum breach avoidance (Scenario B)
            </span>
            <span className="text-xs font-bold text-foreground whitespace-nowrap">
              {fmt$(qDep)}/yr
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            HNDL-era compromise of long-lived secrets. Multiplied by P(CRQC within horizon).
          </p>
          <p className="text-[10px] text-status-warning font-bold mt-1">
            Quantum-dependent: applies only in Scenario B.
          </p>
          <MathModel
            formula={`p_crqc_within_horizon × value_of_long_lived_secrets × hndl_capture_fraction\n= ${fmtPct(pCrqc, 0)} × ${fmt$(quantumP.valueOfLongLivedSecrets)} × ${fmtPct(quantumP.hndlCaptureFraction, 0)}\n= ${fmt$(qDep)}/yr`}
            explanation="HNDL is asymmetric — already-exfiltrated data cannot be retroactively protected. This stream measures the value of FUTURE-stored long-lived secrets that quantum-resistant migration would protect from harvest-now/decrypt-later attack. Capture fraction is the share of long-lived secrets adversaries plausibly already collect today. P(CRQC within horizon) lives in the global controls above so its effect is auditable. NIST IR 8547 (Initial Public Draft) discusses HNDL throughout — it is the principal urgency driver for confidentiality."
            source={{
              label: 'NIST IR 8547 (IPD)',
              href: 'https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8547.ipd.pdf',
            }}
          >
            <ParamSlider
              label="Value of long-lived secrets"
              value={quantumP.valueOfLongLivedSecrets}
              onChange={(v) => setQuantumP((p) => ({ ...p, valueOfLongLivedSecrets: v }))}
              min={1_000_000}
              max={100_000_000}
              step={1_000_000}
              format={fmt$}
            />
            <ParamSlider
              label="HNDL capture fraction"
              value={quantumP.hndlCaptureFraction}
              onChange={(v) => setQuantumP((p) => ({ ...p, hndlCaptureFraction: v }))}
              min={0}
              max={1}
              step={0.01}
              format={(v) => fmtPct(v, 0)}
              hint="Share of long-lived secrets adversaries plausibly already hold."
            />
            <p className="text-[10px] text-muted-foreground italic">
              P(CRQC within horizon) is set in the global controls above (currently{' '}
              {fmtPct(pCrqc, 0)}).
            </p>
          </MathModel>
        </div>
      </div>

      {/* ── Sensitivity strip ────────────────────────────────────────────────── */}
      <div className="bg-muted/40 rounded-lg p-4 border border-border">
        <div className="text-xs font-bold text-foreground mb-2">
          Which stream dominates? (share of total annual benefit, Scenario B)
        </div>
        <div className="space-y-1">
          {sensitivity.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground w-32 shrink-0">{s.label}</span>
              <div className="flex-1 h-3 bg-background rounded overflow-hidden border border-border">
                <div
                  className={clsx(
                    'h-full transition-all',
                    s.qDep ? 'bg-status-warning' : 'bg-status-success'
                  )}
                  style={{ width: `${Math.max(0, Math.min(100, s.share * 100))}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-foreground w-12 text-right tabular-nums">
                {fmtPct(s.share, 0)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground italic mt-2">
          The dominant stream is where you should focus calibration effort first.
        </p>
      </div>

      {/* ── Scenario outputs ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-status-success/10 rounded-lg p-4 border border-status-success/30">
          <div className="font-bold text-foreground mb-2">
            Scenario A — quantum never arrives ({horizonYears} y horizon)
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantum-independent benefit</span>
              <span className="font-bold text-foreground">{fmt$(qIndep)}/yr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total benefit ({horizonYears}y)</span>
              <span className="font-bold text-foreground">{fmt$(benefitA)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total cost ({horizonYears}y)</span>
              <span className="font-bold text-foreground">{fmt$(totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payback period</span>
              <span className="font-bold text-foreground">{fmtYears(paybackA)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NPV @ {fmtPct(discountRate, 1)}</span>
              <span className="font-bold text-foreground">{fmt$(npvA)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-status-success/30">
              <span className="font-bold text-status-success">{horizonYears}-year ROI</span>
              <span className="font-bold text-status-success text-lg">{roiA.toFixed(0)}%</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-2">
            No-regret case. This is what your board should see first.
          </p>
        </div>

        <div className="bg-status-info/10 rounded-lg p-4 border border-status-info/30">
          <div className="font-bold text-foreground mb-2">
            Scenario B — CRQC arrives within {horizonYears} y (P = {fmtPct(pCrqc, 0)})
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantum-dependent benefit added</span>
              <span className="font-bold text-foreground">{fmt$(qDep)}/yr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total benefit ({horizonYears}y)</span>
              <span className="font-bold text-foreground">{fmt$(benefitB)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total cost ({horizonYears}y)</span>
              <span className="font-bold text-foreground">{fmt$(totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payback period</span>
              <span className="font-bold text-foreground">{fmtYears(paybackB)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NPV @ {fmtPct(discountRate, 1)}</span>
              <span className="font-bold text-foreground">{fmt$(npvB)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-status-info/30">
              <span className="font-bold text-status-info">{horizonYears}-year ROI</span>
              <span className="font-bold text-status-info text-lg">{roiB.toFixed(0)}%</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-2">
            Upside case. The quantum-dependent stream is additive — never load-bearing.
          </p>
        </div>
      </div>

      {/* ── Output math explanation ──────────────────────────────────────────── */}
      <div className="bg-muted/40 rounded-lg p-4 border border-border space-y-3">
        <div className="text-xs font-bold text-foreground">
          How ROI, payback, and NPV are computed
        </div>
        <MathModel
          defaultOpen={false}
          formula={`ROI = (total_benefit − total_cost) / total_cost × 100\nPayback = first year t where Σ (annual_benefit − annual_cost) ≥ 0\nNPV = Σ (annual_net_cashflow_t / (1 + r)^t)  for t = 1..horizon`}
          explanation="ROI is the simple, undiscounted return for the chosen horizon. Payback is the cumulative-cashflow crossover — for an ongoing program with constant annual cost, this resolves to year 1 if annual benefit exceeds annual cost, else 'never in horizon'. NPV applies the discount rate from the global controls, so executives can see the discount-sensitivity penalty by dialling r above 0%."
        >
          <p className="text-[11px] text-muted-foreground">
            Model limitations: constant-cashflow assumption (no ramp-up curve); no Monte Carlo on
            input distributions; payback collapses to a simple year-1/never test under constant
            cashflows. For full board modeling, pair with the Business Case module (LM-036).
          </p>
        </MathModel>
      </div>
    </div>
  )
}
