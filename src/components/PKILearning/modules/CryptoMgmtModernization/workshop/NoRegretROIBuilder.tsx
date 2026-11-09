// SPDX-License-Identifier: AGPL-3.0-only
import React, { useId, useMemo, useState } from 'react'
import { ChevronDown, ExternalLink, Database, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import type { CbomExportItem } from '../data/workshopTypes'
import { roiCashflows } from './roiCashflows'

const fmt$ = (n: number): string =>
  n < 0
    ? `-${fmt$(-n)}`
    : n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}k`
        : `$${n.toFixed(0)}`

const fmtPct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`
const fmtYears = (n: number | null) => (n == null ? 'No crossover within horizon' : `${n} y`)
const fmtRoi = (n: number | null) => (n == null ? 'Undefined — no cost' : `${n.toFixed(0)}%`)
const exactUsd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

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
// Editable fictional sub-model inputs, with a scoped source benchmark for labour.
// Each benefit uses the displayed time basis; totals come from annual cashflow rows.
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
  forresterCompositeAnnual: 2_639_569,
  scaleFactor: 0.74,
}
const computeClm = (p: ClmParams) => p.forresterCompositeAnnual * p.scaleFactor
// Study Year 1 in-place renewal labour only; subsequent constant annual use is illustrative.

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

  // The existing M&A control says how many years its fixed saving takes to
  // realize. Do not keep collecting that same saving after those years end.
  const annualBenefits = Array.from(
    { length: horizonYears },
    (_, index) => outage + clm + fips + cve + (index < maP.amortizeYears ? ma : 0)
  )
  const scenarioA = roiCashflows(annualProgramCost, annualBenefits, 0, discountRate)
  const scenarioB = roiCashflows(annualProgramCost, annualBenefits, qDep, discountRate)
  const totalCost = scenarioA.totalCost
  const benefitA = scenarioA.totalBenefit
  const benefitB = scenarioB.totalBenefit
  const roiA = scenarioA.roiPercent
  const roiB = scenarioB.roiPercent
  const paybackA = scenarioA.paybackYear
  const paybackB = scenarioB.paybackYear
  const npvA = scenarioA.npv
  const npvB = scenarioB.npv

  // All shares use undiscounted horizon totals, not a mix of annual flows and stock.
  const sensitivity = useMemo(() => {
    const total =
      (outage + clm + fips + cve) * horizonYears +
      ma * Math.min(horizonYears, maP.amortizeYears) +
      qDep
    if (total <= 0) return []
    return [
      { id: 'outage', label: 'Outage avoidance', value: outage * horizonYears, qDep: false },
      { id: 'clm', label: 'CLM automation', value: clm * horizonYears, qDep: false },
      { id: 'fips', label: 'FIPS drift', value: fips * horizonYears, qDep: false },
      { id: 'cve', label: 'Library CVE', value: cve * horizonYears, qDep: false },
      {
        id: 'ma',
        label: 'M&A readiness',
        value: ma * Math.min(horizonYears, maP.amortizeYears),
        qDep: false,
      },
      { id: 'quantum', label: 'Quantum breach', value: qDep, qDep: true },
    ]
      .map((stream) => ({ ...stream, share: stream.value / total }))
      .sort((a, b) => b.share - a.share)
  }, [outage, clm, fips, cve, ma, qDep, horizonYears, maP.amortizeYears])

  const [countsImported, setCountsImported] = useState(false)

  // Pull HSM + library counts from the CBOM built in Step 3.
  const hsmFromCbom = cbomAssets.filter((a) => a.type === 'hsm').length
  const libFromCbom = cbomAssets.filter((a) => a.type === 'library').length
  const canPullFromCbom = hsmFromCbom > 0 || libFromCbom > 0
  const handlePullFromCbom = () => {
    setCountsImported(true)
    setFipsP((p) => ({
      ...p,
      hsmCount: hsmFromCbom,
      libraryCount: libFromCbom,
    }))
    setCveP((p) => ({
      ...p,
      cvesPerYear: libFromCbom > 0 ? Math.max(1, Math.round(libFromCbom * 0.3)) : 0,
    }))
  }

  const handleResetAll = () => {
    setCountsImported(false)
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
      {countsImported && (
        <p role="status" className="text-sm text-muted-foreground">
          Counts use only the last imported valid components sample, including zero for absent
          categories. The current Step 3 draft may differ. A partial inventory does not establish
          whole-organisation counts. Other rates and costs remain illustrative assumptions.
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-3xl">
          Tune your organization&apos;s assumptions. Every headline number expands into the
          underlying math with editable parameters and the source it&apos;s anchored to. The model
          separates potential operational savings that do not require quantum arrival from the
          single stream that depends on a CRQC materializing within the horizon.
        </p>
        <div className="flex flex-wrap gap-2">
          {canPullFromCbom && (
            <Button
              variant="outline"
              onClick={handlePullFromCbom}
              className="text-xs flex items-center gap-1"
            >
              <Database size={12} />
              Pull last valid Step 3 sample ({hsmFromCbom} HSM / {libFromCbom} lib)
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
            hint="Probability of cryptanalytically-relevant quantum computer arriving within the horizon. Weights the one-time fixed-stock benefit in Scenario B."
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
          explanation="Anchored to five illustrative program roles (Crypto PM, FIPS/CMVP Engineer, CLM Architect, Crypto Developer Champion, Supplier Risk Analyst) plus tooling, CA contracts, amortised HSM lifecycle, and annual audit/attestation; NIST CSWP 39-upd1 describes cryptography governance as “an important function of a crypto agility strategic plan”. Adjust headcount and tool license to match your org size."
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
            explanation="This module assumes that 86% of enterprises have at least one cert-related outage a year at an average cost of $11M; both are illustrative assumptions of this module, not sourced figures, so set your own. Avoidance factor is the share of those outages that automated CLM, observability, and shadow-cert discovery actually prevent — calibrate to your tooling maturity."
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
            Year 1 renewal-labour benchmark, scaled using your sample assumption.
          </p>
          <MathModel
            formula={`annual_renewal_labour_benchmark × scale_factor\n= ${exactUsd(clmP.forresterCompositeAnnual)} × ${fmtPct(clmP.scaleFactor, 0)}\n= ${fmt$(clm)}/yr`}
            explanation="The DigiCert-commissioned Forrester study (July 2025), Total Benefits table, reports $2,639,569 of Year 1 risk-adjusted labour savings for renewals of certificates already in place. This editable benchmark excludes its incident, revenue and legacy-tool savings. Repeating the selected annual amount over this model’s horizon is a Hub constant-flow assumption, not the study’s Year 2/3 schedule. Its three-year present value is not an annual cashflow. Scale and validate the assumptions; this is not a guaranteed return."
            source={{
              label: 'Forrester TEI of DigiCert ONE (July 2025)',
              href: 'https://tei.forrester.com/go/DigiCert/DigiCertONE/index.html',
            }}
          >
            <ParamSlider
              label="Annual renewal-labour benchmark"
              value={clmP.forresterCompositeAnnual}
              onChange={(v) => setClmP((p) => ({ ...p, forresterCompositeAnnual: v }))}
              min={0}
              max={10_000_000}
              step={1}
              format={fmt$}
              hint="Source Year 1 renewal labour: $2,639,569. Other study benefit streams are excluded."
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
            explanation="The FIPS 140-3 IG added self-test requirements for ML-KEM/ML-DSA/SLH-DSA in August 2024 and, in September 2025, let their key-generation tests check against the private key only, and a module on the CMVP Modules-in-Process list has a status, not a completion date. Drift rate captures how often a given HSM or library hits an IG update, EoL, or revocation event in a year. Remediation cost is the emergency re-procurement or re-validation expense when it does. Use the last valid Step 3 components sample to populate sample asset counts; this does not check a later edited draft."
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
            explanation="Domain model anchored to the OpenSSL 1.1.1 end of life (11 September 2023); the CVE count, hours and rate are illustrative inputs of this model, not measured figures. CBOM-driven discovery shortens the detect → patch → attest cycle, reducing both engineering effort and the window during which a vulnerable library is reachable from production traffic."
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
            explanation="This fictional model assumes a Cryptographic Center of Excellence reduces one scoped transition cost; the savings factor is an illustrative assumption of this module, not a sourced figure, so set your own. This benefit is independent of CRQC arrival — it accrues from the unification of crypto policy, faster M&A integration, and reduced firefighting — which is why this stream is NOT flagged quantum-dependent. Confidence factor adjusts for your readiness; spread the fixed saving over the selected realization years. This contribution stops after those years; it is not a new saving every subsequent year."
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
              hint="Illustrative assumption of this module: ~50% with a CryptoCOE before 2028."
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
              {fmt$(qDep)} once
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            One fixed stock of future records protected before collection, weighted by P(CRQC within
            horizon).
          </p>
          <p className="text-[10px] text-status-warning font-bold mt-1">
            Quantum-dependent: applies only in Scenario B.
          </p>
          <MathModel
            formula={`p_crqc_within_horizon × value_of_long_lived_secrets × hndl_capture_fraction\n= ${fmtPct(pCrqc, 0)} × ${fmt$(quantumP.valueOfLongLivedSecrets)} × ${fmtPct(quantumP.hndlCaptureFraction, 0)}\n= ${fmt$(qDep)} once, at the end of year ${horizonYears}`}
            explanation="Already-exfiltrated data cannot be retroactively protected. This fictional case values one fixed stock of future long-lived records migrated before collection. Multiply its value by the assumed capture fraction and horizon probability once, not once per year. For timing and discounting, the entire expected benefit is placed at the end of the selected horizon; that is an explicit model assumption, not a forecast of arrival or proof of protection. No new annual cohorts are assumed."
            source={{
              label: 'NIST IR 8547 (final)',
              href: 'https://nvlpubs.nist.gov/nistpubs/ir/2026/NIST.IR.8547.pdf',
            }}
          >
            <ParamSlider
              label="Value of fixed future-record stock"
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
              hint="Assumed share of this future stock that would be collected without migration; excludes copies already stolen."
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
          Which stream dominates? (share of total horizon benefit, Scenario B)
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
        <div
          role="region"
          aria-label="Scenario A results"
          className="bg-muted/40 rounded-lg p-4 border border-border"
        >
          <div className="font-bold text-foreground mb-2">
            Scenario A — quantum never arrives ({horizonYears} y horizon)
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Non-stock benefit in year 1</span>
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
              <span
                className={clsx(
                  'font-bold text-lg',
                  roiA != null && roiA < 0 ? 'text-status-error' : 'text-foreground'
                )}
              >
                {fmtRoi(roiA)}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-2">
            Compare operational benefits against program costs first; a positive result depends on
            the selected assumptions.
          </p>
        </div>

        <div
          role="region"
          aria-label="Scenario B results"
          className="bg-muted/40 rounded-lg p-4 border border-border"
        >
          <div className="font-bold text-foreground mb-2">
            Scenario B — assumed P(CRQC within {horizonYears} y) = {fmtPct(pCrqc, 0)}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fixed-stock benefit at horizon end</span>
              <span className="font-bold text-foreground">{fmt$(qDep)} once</span>
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
              <span
                className={clsx(
                  'font-bold text-lg',
                  roiB != null && roiB < 0 ? 'text-status-error' : 'text-foreground'
                )}
              >
                {fmtRoi(roiB)}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-2">
            Compare this expected-value scenario with Scenario A. The fixed-stock contribution is
            counted once; it may change whether the case breaks even.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <caption className="p-3 text-left text-muted-foreground">
            Sample cashflow schedule (USD). Annual costs and recurring benefits are constant; M&A
            savings end after {maP.amortizeYears} years. The fixed-record benefit appears once in
            year {horizonYears}. All values are undiscounted here; NPV discounts these rows.
          </caption>
          <thead>
            <tr className="text-left border-b border-border">
              {['Year', 'Non-stock benefits', 'Stock benefit (B)', 'Cost', 'Net A', 'Net B'].map(
                (label) => (
                  <th key={label} scope="col" className="p-2 whitespace-nowrap">
                    {label}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {scenarioB.rows.map((row, index) => (
              <tr key={row.year} className="border-b border-border">
                <th scope="row" className="p-2">
                  {row.year}
                </th>
                <td className="p-2 whitespace-nowrap">{exactUsd(row.annualBenefit)}</td>
                <td className="p-2 whitespace-nowrap">{exactUsd(row.stockBenefit)}</td>
                <td className="p-2 whitespace-nowrap">{exactUsd(row.cost)}</td>
                <td className="p-2 whitespace-nowrap">
                  {exactUsd(scenarioA.rows.at(index)?.net ?? 0)}
                </td>
                <td className="p-2 whitespace-nowrap">{exactUsd(row.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Output math explanation ──────────────────────────────────────────── */}
      <div className="bg-muted/40 rounded-lg p-4 border border-border space-y-3">
        <div className="text-xs font-bold text-foreground">
          How ROI, payback, and NPV are computed
        </div>
        <MathModel
          defaultOpen={false}
          formula={`ROI = (total_benefit − total_cost) / total_cost × 100\nPayback = first year t where Σ (annual_benefit − annual_cost) ≥ 0\nNPV = Σ (annual_net_cashflow_t / (1 + r)^t)  for t = 1..horizon`}
          explanation="ROI uses undiscounted horizon totals and is undefined when total cost is zero. Payback is the first year with nonnegative cumulative net cashflow; no crossover is reported if none occurs within the horizon. NPV discounts each year’s net cashflow, including the one-time stock benefit only at the horizon end."
        >
          <p className="text-[11px] text-muted-foreground">
            Model limitations: recurring streams use constant annual inputs; the fixed M&A saving
            ends after its realization period and the stock benefit occurs once at horizon end.
            Streams must represent distinct costs to avoid overlap. There is no Monte Carlo analysis
            or evidence that these sample assumptions apply to an organisation. For full board
            modeling, pair with the Business Case module (LM-036).
          </p>
        </MathModel>
      </div>
    </div>
  )
}
