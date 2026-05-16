// SPDX-License-Identifier: GPL-3.0-only
/**
 * Cloud Shared-Responsibility Crypto Matrix (M8 / CSWP.39 Section 6.4)
 *
 * Security-architect + compliance-lead facing tool that builds a per-asset-class
 * shared-responsibility matrix mapping crypto-agility duties between the
 * customer and the cloud provider across service models (IaaS / PaaS / SaaS /
 * FaaS). Maps to NIST CSWP 39 Section 6.4 (Crypto Agility in the Cloud) and
 * §5.3 (Technology Supply Chains).
 *
 * The shared-responsibility model is the central security frame in cloud, and
 * CSWP-39 §6.4 explicitly carves the boundary along service-model lines: in
 * IaaS the customer owns crypto from the OS up, in PaaS the provider manages
 * runtime crypto (TLS, managed DBs, KMS), and in SaaS the provider owns
 * end-to-end crypto with the customer reduced to configuration + audit. PQC
 * rollout differs by cloud and by service model — this tool surfaces which
 * cells of that matrix you actually own.
 */
import React, { useCallback, useMemo } from 'react'
import { Cloud, ShieldCheck, ArrowRight } from 'lucide-react'
import { ArtifactBuilder } from '@/components/PKILearning/common/executive'
import type { ArtifactSection } from '@/components/PKILearning/common/executive'
import { useModuleStore } from '@/store/useModuleStore'

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation engine (pure function — testable in isolation)
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceModel = 'IaaS' | 'PaaS' | 'SaaS' | 'FaaS'
export type Owner = 'customer' | 'provider' | 'shared'
export type PqcAvailability = 'available' | 'partial' | 'roadmap' | 'no-public-plan'

export interface ResponsibilityCell {
  assetClass: string
  serviceModel: ServiceModel
  owner: Owner
  customerActions: string[]
  providerActions: string[]
  pqcAvailability: PqcAvailability
  notes: string
}

export interface CloudMatrixInputs {
  cloudProviders: string[]
  serviceModelMix: string[]
  regulatoryOverlay: string[]
  assetClasses: string[]
  customerKeyControl: string
  dataResidency: string
  crqcExposureHorizon: string
  responsibilityPlan: string
}

export interface CloudMatrixRecommendation {
  matrix: ResponsibilityCell[]
  watchOuts: string[]
  recommendations: string[]
  citation: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Service-model normaliser
// ─────────────────────────────────────────────────────────────────────────────

/** The wizard accepts FaaS + container-as-a-service as separate checklist
 *  entries; for the matrix we collapse "container-as-a-service" into FaaS
 *  (the closest CSWP-39 §6.4 analogue — provider runs the runtime, customer
 *  packages the workload). Returns the canonical four-tuple. */
function normaliseServiceModels(raw: string[]): ServiceModel[] {
  const out = new Set<ServiceModel>()
  for (const r of raw) {
    if (r === 'IaaS' || r === 'PaaS' || r === 'SaaS' || r === 'FaaS') {
      out.add(r)
    } else if (r === 'container-as-a-service') {
      out.add('FaaS')
    }
  }
  return Array.from(out)
}

// ─────────────────────────────────────────────────────────────────────────────
// Cell-population lookup table
// ─────────────────────────────────────────────────────────────────────────────

interface CellTemplate {
  owner: Owner
  customerActions: string[]
  providerActions: string[]
  notes: string
}

// Special token meaning "this (assetClass, serviceModel) pair is not a real
// cell — skip it in the rendered matrix." Used for e.g. KMS-backed keys under
// SaaS where the customer has no key-control surface.
const NOT_APPLICABLE = 'n/a'

const CELL_TEMPLATES: Record<string, CellTemplate | typeof NOT_APPLICABLE> = {
  // TLS termination
  'TLS termination__IaaS': {
    owner: 'customer',
    customerActions: [
      'Pick and roll the cipher policy on your load balancer / Envoy / Nginx',
      'Schedule a hybrid X25519MLKEM768 rollout once your TLS stack supports it',
    ],
    providerActions: [
      'Provider supplies hypervisor / NIC offload but does not terminate TLS for you',
    ],
    notes: 'Customer owns the TLS stack end-to-end. PQC adoption pace = your own.',
  },
  'TLS termination__PaaS': {
    owner: 'shared',
    customerActions: [
      'Choose the cipher / TLS policy from the provider catalogue',
      'Track provider PQC TLS GA dates per region',
    ],
    providerActions: [
      'Provider terminates TLS at the front door / load balancer',
      'Provider exposes PQC cipher policies once GA — you opt in',
    ],
    notes:
      'Shared: provider runs the listener, customer picks the policy. Hybrid X25519MLKEM768 lands when the provider ships it.',
  },
  'TLS termination__SaaS': {
    owner: 'provider',
    customerActions: [
      'Audit-only: confirm TLS policy in the SaaS security questionnaire',
      'Demand a contractual deadline for PQC TLS in the master agreement',
    ],
    providerActions: ['Provider runs TLS termination and rotates ciphers on their cadence'],
    notes: 'Audit-only customer lever. Push the timeline through procurement.',
  },
  'TLS termination__FaaS': {
    owner: 'provider',
    customerActions: [
      'Audit the FaaS gateway TLS policy and enforce minimum TLS 1.3',
      'Track gateway PQC TLS roadmap dates',
    ],
    providerActions: ['Provider runs the API gateway / function URL TLS listener'],
    notes:
      'FaaS function URLs / API gateways inherit the cloud TLS roadmap. Customer has policy levers, not implementation.',
  },

  // Managed database encryption
  'Managed database__IaaS': {
    owner: 'shared',
    customerActions: [
      'Pick the disk-encryption KMS key (CMK) and TDE policy',
      'Plan for column-level encryption refactor if KEK becomes PQC-wrapped',
    ],
    providerActions: ['Provider supplies KMS + storage-level encryption primitives'],
    notes:
      'You run the DB engine yourself on IaaS but lean on cloud KMS for KEK. PQC adoption tied to KMS roadmap.',
  },
  'Managed database__PaaS': {
    owner: 'provider',
    customerActions: [
      'Choose CMK vs provider-managed key control',
      'Track managed-DB FIPS 203 / 204 module re-validation dates',
    ],
    providerActions: [
      'Provider operates the DB engine and storage encryption',
      'Provider rolls PQC KEK wrapping after KMS GA',
    ],
    notes: 'Provider-primary. Customer key-control choice is the only PQC lever short-term.',
  },
  'Managed database__SaaS': {
    owner: 'provider',
    customerActions: ['Audit-only: confirm encryption-at-rest claims in vendor SOC 2 / ISO docs'],
    providerActions: ['Provider operates the entire data tier including encryption'],
    notes: 'SaaS DBs are fully provider-owned. No customer lever beyond contract.',
  },
  'Managed database__FaaS': NOT_APPLICABLE,

  // Object storage encryption
  'Object storage encryption__IaaS': {
    owner: 'shared',
    customerActions: [
      'Pick SSE-S3 (provider-managed) vs SSE-KMS (CMK) vs SSE-C (BYOK)',
      'Plan to switch to a PQC-wrapped CMK once the KMS adds wrapping support',
    ],
    providerActions: ['Provider runs the storage service and offers KMS-backed encryption'],
    notes:
      'Customer picks the encryption mode. PQC adoption is a CMK upgrade, not a data re-encrypt event.',
  },
  'Object storage encryption__PaaS': {
    owner: 'provider',
    customerActions: ['Toggle CMK on the bucket / container when the cloud KMS adds PQC keys'],
    providerActions: ['Provider runs both the storage service and the SSE pipeline'],
    notes: 'Provider-primary; CMK toggle is the only customer-controlled lever.',
  },
  'Object storage encryption__SaaS': {
    owner: 'provider',
    customerActions: ['Audit-only: confirm encryption-at-rest in the SaaS security pack'],
    providerActions: ['Provider runs storage + encryption end-to-end'],
    notes: 'SaaS-only audit lens.',
  },
  'Object storage encryption__FaaS': NOT_APPLICABLE,

  // Message queue encryption
  'Message queue encryption__IaaS': {
    owner: 'customer',
    customerActions: [
      'You run the broker (Kafka / RabbitMQ) — pick the TLS + at-rest encryption',
      'Plan the PQC TLS rollout per broker docs',
    ],
    providerActions: ['Provider supplies VMs + KMS only'],
    notes: 'IaaS broker = full customer ownership.',
  },
  'Message queue encryption__PaaS': {
    owner: 'shared',
    customerActions: [
      'Toggle CMK on the managed queue',
      'Track provider PQC TLS for inter-broker links',
    ],
    providerActions: ['Provider runs the broker and inter-broker transport'],
    notes: 'PaaS queues hide the broker; encryption choice is config-only.',
  },
  'Message queue encryption__SaaS': {
    owner: 'provider',
    customerActions: ['Audit-only'],
    providerActions: ['Provider runs the queue end-to-end'],
    notes: 'SaaS event bus = fully provider-owned.',
  },
  'Message queue encryption__FaaS': NOT_APPLICABLE,

  // KMS-backed keys
  'KMS-backed keys__IaaS': {
    owner: 'customer',
    customerActions: [
      'Decide CloudHSM vs cloud KMS for key custody',
      'Plan ML-DSA / ML-KEM key generation once the KMS adds support',
    ],
    providerActions: ['Provider supplies the KMS / CloudHSM service and FIPS 140-3 module'],
    notes: 'Customer controls key custody choice. PQC GA depends on the KMS roadmap per region.',
  },
  'KMS-backed keys__PaaS': {
    owner: 'shared',
    customerActions: [
      'Set CMK / BYOK policy at the managed-service level',
      'Watch for region availability lag on PQC key types',
    ],
    providerActions: ['Provider runs the KMS and exposes CMK selection to managed services'],
    notes: 'Customer picks key control; provider picks the algorithm catalogue.',
  },
  'KMS-backed keys__SaaS': {
    owner: 'provider',
    customerActions: ['Audit-only: BYOK / HYOK availability is a SaaS contract negotiation'],
    providerActions: ['Provider operates the entire key lifecycle'],
    notes: 'No customer KMS surface in SaaS. Push BYOK / HYOK in the master agreement.',
  },
  'KMS-backed keys__FaaS': {
    owner: 'shared',
    customerActions: [
      'Wire the function to the cloud KMS for envelope encryption',
      'Plan ML-KEM-wrapped data keys once the KMS supports it',
    ],
    providerActions: ['Provider runs the KMS and the FaaS runtime'],
    notes: 'FaaS workloads typically use the cloud KMS for envelope encryption.',
  },

  // Code-signing in CI
  'Code-signing in CI__IaaS': {
    owner: 'customer',
    customerActions: [
      'You run the CI runners — pick the signing tool (cosign / sigstore / SLH-DSA)',
      'Schedule signing-key migration to ML-DSA-65 / SLH-DSA-128s',
    ],
    providerActions: ['Provider supplies VMs only'],
    notes:
      'CI is customer-owned regardless of cloud — but supply-chain attack surface still cross-cloud.',
  },
  'Code-signing in CI__PaaS': {
    owner: 'customer',
    customerActions: [
      'You own the CI definition even when using managed CI (CodeBuild / Cloud Build / Pipelines)',
      'Pin signing-key custody to a cloud KMS or external HSM',
    ],
    providerActions: ['Provider runs the CI executor only'],
    notes: 'PaaS CI does not change the signing-key custody model.',
  },
  'Code-signing in CI__SaaS': {
    owner: 'customer',
    customerActions: [
      'SaaS CI (GitHub Actions / GitLab SaaS): customer still owns the signing pipeline',
      'Use OIDC + cloud KMS for the key — avoid bare secrets in the SaaS',
    ],
    providerActions: ['SaaS CI provider runs the runners and the workflow engine'],
    notes: 'SaaS CI pipelines still leave signing-key custody on the customer side.',
  },
  'Code-signing in CI__FaaS': NOT_APPLICABLE,

  // FaaS function payloads
  'FaaS function payloads__IaaS': NOT_APPLICABLE,
  'FaaS function payloads__PaaS': NOT_APPLICABLE,
  'FaaS function payloads__SaaS': NOT_APPLICABLE,
  'FaaS function payloads__FaaS': {
    owner: 'shared',
    customerActions: [
      'Sign the function payload (cosign / SLH-DSA) before deploy',
      'Encrypt env vars + secret stores with PQC-wrapped CMK once available',
    ],
    providerActions: ['Provider verifies the deploy signature and provisions the runtime'],
    notes: 'Payload integrity is a shared concern: customer signs, provider verifies + runs.',
  },

  // Customer-managed keys (BYOK / HYOK)
  'Customer-managed keys__IaaS': {
    owner: 'customer',
    customerActions: [
      'Operate your own HSM (CloudHSM / on-prem) and rotate keys yourself',
      'Plan ML-KEM-768 wrapping algorithm support with your HSM vendor',
    ],
    providerActions: ['Provider supplies the HSM service or VM substrate'],
    notes: 'Customer-controlled HSM = customer-controlled PQC timeline.',
  },
  'Customer-managed keys__PaaS': {
    owner: 'shared',
    customerActions: [
      'Use BYOK / HYOK where the managed service supports it',
      'Confirm the provider can import customer-supplied ML-KEM-768 keys',
    ],
    providerActions: ['Provider exposes the BYOK / HYOK import interface and wrapping algorithm'],
    notes:
      'BYOK import depends on provider supporting the wrapping algorithm — typically lags algorithm GA by 1-2 quarters.',
  },
  'Customer-managed keys__SaaS': {
    owner: 'shared',
    customerActions: [
      'Negotiate BYOK / HYOK in the SaaS master agreement',
      'Confirm the SaaS will honour an ML-KEM-wrapped customer key',
    ],
    providerActions: ['SaaS exposes a BYOK / HYOK escrow once contractually agreed'],
    notes: 'SaaS BYOK is contract-driven; technical surface is usually escrow / HSM-as-a-service.',
  },
  'Customer-managed keys__FaaS': {
    owner: 'shared',
    customerActions: [
      'Bind the function execution role to a cloud-KMS CMK',
      'Plan ML-KEM CMK rotation once the cloud KMS ships it',
    ],
    providerActions: ['Provider runs the KMS and the FaaS runtime'],
    notes: 'BYOK on FaaS is the same surface as PaaS — function calls into the KMS.',
  },
}

function getCellTemplate(assetClass: string, serviceModel: ServiceModel): CellTemplate | null {
  const key = `${assetClass}__${serviceModel}`
  // eslint-disable-next-line security/detect-object-injection
  const tpl = CELL_TEMPLATES[key]
  if (tpl === undefined || tpl === NOT_APPLICABLE) return null
  return tpl
}

// ─────────────────────────────────────────────────────────────────────────────
// PQC availability lookup (per cloud + service-model + asset, 2025 roadmap)
// ─────────────────────────────────────────────────────────────────────────────

interface PqcRoadmapEntry {
  /** Highest level of PQC availability the cloud offers, per asset family. */
  kmsHsm: PqcAvailability
  tls: PqcAvailability
}

const PQC_ROADMAP: Record<string, PqcRoadmapEntry> = {
  AWS: { kmsHsm: 'partial', tls: 'roadmap' },
  GCP: { kmsHsm: 'roadmap', tls: 'roadmap' },
  Azure: { kmsHsm: 'roadmap', tls: 'roadmap' },
  Oracle: { kmsHsm: 'no-public-plan', tls: 'no-public-plan' },
  IBM: { kmsHsm: 'partial', tls: 'roadmap' },
  Alibaba: { kmsHsm: 'no-public-plan', tls: 'no-public-plan' },
  'on-prem': { kmsHsm: 'roadmap', tls: 'roadmap' },
  'multi-cloud': { kmsHsm: 'roadmap', tls: 'roadmap' },
}

/** Pick the worst availability across the chosen providers — that's the cell's
 *  effective availability. If you adopt across AWS + Oracle you inherit
 *  Oracle's no-public-plan story regardless of AWS being further along. */
function pickWorstAvailability(providers: string[], family: 'kmsHsm' | 'tls'): PqcAvailability {
  const ORDER: PqcAvailability[] = ['available', 'partial', 'roadmap', 'no-public-plan']
  let worstIdx = -1
  for (const p of providers) {
    // eslint-disable-next-line security/detect-object-injection
    const entry = PQC_ROADMAP[p]
    if (!entry) continue
    // eslint-disable-next-line security/detect-object-injection
    const idx = ORDER.indexOf(entry[family])
    if (idx > worstIdx) worstIdx = idx
  }
  if (worstIdx < 0) return 'roadmap'
  // eslint-disable-next-line security/detect-object-injection
  return ORDER[worstIdx]
}

function classifyAssetFamily(assetClass: string): 'kmsHsm' | 'tls' {
  // Anything that touches a KMS / HSM key custody surface uses the kmsHsm
  // roadmap; TLS termination follows the TLS roadmap. The rest default to
  // kmsHsm because the encryption ultimately rides on the cloud KMS.
  if (assetClass === 'TLS termination') return 'tls'
  return 'kmsHsm'
}

function pqcAvailabilityFor(assetClass: string, providers: string[]): PqcAvailability {
  const family = classifyAssetFamily(assetClass)
  return pickWorstAvailability(providers, family)
}

// ─────────────────────────────────────────────────────────────────────────────
// Matrix builder
// ─────────────────────────────────────────────────────────────────────────────

function buildMatrix(inputs: CloudMatrixInputs): ResponsibilityCell[] {
  const cells: ResponsibilityCell[] = []
  const models = normaliseServiceModels(inputs.serviceModelMix)
  if (models.length === 0) return cells

  for (const assetClass of inputs.assetClasses) {
    for (const model of models) {
      const tpl = getCellTemplate(assetClass, model)
      if (!tpl) continue
      cells.push({
        assetClass,
        serviceModel: model,
        owner: tpl.owner,
        customerActions: tpl.customerActions,
        providerActions: tpl.providerActions,
        pqcAvailability: pqcAvailabilityFor(assetClass, inputs.cloudProviders),
        notes: tpl.notes,
      })
    }
  }
  return cells
}

// ─────────────────────────────────────────────────────────────────────────────
// Watch-outs
// ─────────────────────────────────────────────────────────────────────────────

function computeWatchOuts(inputs: CloudMatrixInputs): string[] {
  const out: string[] = []
  const providers = inputs.cloudProviders
  const isMultiCloud =
    providers.includes('multi-cloud') ||
    providers.filter((p) => p !== 'on-prem' && p !== 'multi-cloud').length > 1

  if (isMultiCloud) {
    out.push(
      'Multi-cloud: ML-KEM-768 GA on AWS lands ~2026-Q2 (commercial), while GCP and Azure are still in preview. Expect a hybrid period where one cloud is ahead — plan workload-level fallbacks rather than a single switch-over.'
    )
  }

  if (
    inputs.customerKeyControl === 'customer-supplied' ||
    inputs.customerKeyControl === 'customer-controlled-HSM'
  ) {
    const providerLabel = providers.length === 1 ? providers[0] : 'your selected provider(s)'
    out.push(
      `BYOK / HYOK: customer-supplied ML-KEM-768 keys cannot be imported until ${providerLabel} adds the PQC wrapping algorithm — typically lags algorithm GA by 1-2 quarters. Confirm the wrap algorithm in writing before generating customer-side keys.`
    )
  }

  const isFedrampHigh = inputs.regulatoryOverlay.some((r) => /FedRAMP High|IL5|IL6/i.test(r))
  if (isFedrampHigh) {
    out.push(
      'FedRAMP High / IL5+: ML-KEM-768 and ML-DSA-65 must wait for FIPS 140-3 module re-validation per provider — expect 6-12 months after algorithm GA before the module appears on the validated list. Plan procurement around the re-validation window, not the algorithm GA date.'
    )
  }

  if (
    inputs.crqcExposureHorizon === '>15y' &&
    inputs.serviceModelMix.length === 1 &&
    inputs.serviceModelMix.includes('SaaS')
  ) {
    out.push(
      'CRQC exposure > 15 years and SaaS-only deployment: end-to-end SaaS gives the customer no technical lever to enforce PQC adoption. Demand a contractual PQC deadline in the SaaS vendor SLA before the harvest-now-decrypt-later window closes.'
    )
  }

  const isEuSovereign = inputs.regulatoryOverlay.some((r) => /EU sovereign/i.test(r))
  const hasNonEuProvider = providers.some((p) =>
    ['AWS', 'GCP', 'Azure', 'Oracle', 'IBM', 'Alibaba'].includes(p)
  )
  if (isEuSovereign && hasNonEuProvider) {
    out.push(
      'EU sovereign cloud + non-EU provider: sovereign-cloud overlay constrains region selection and historically delays PQC rollout 12-18 months behind general availability. Verify your sovereign-region SKU has the same PQC roadmap as commercial.'
    )
  }

  if (inputs.dataResidency === 'multi-region-cross-jurisdiction') {
    out.push(
      'Multi-region cross-jurisdiction: PQC GA dates vary by region — verify that every region you replicate into is on a compatible PQC roadmap before enabling provider-side PQC, or you risk asymmetric availability across the geo.'
    )
  }

  out.push(
    'CSWP-39 Section 6.4 reminder: the cloud provider owns the agility of the cryptographic hardware (HSM, root of trust, encrypted memory) and exposes it via APIs. Your job is to consume those APIs in a crypto-agile way and to retain custody of customer keys per the shared-responsibility model.'
  )

  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommendations
// ─────────────────────────────────────────────────────────────────────────────

function computeRecommendations(inputs: CloudMatrixInputs): string[] {
  const out: string[] = []

  out.push(
    'Inventory cloud crypto assets per (asset class, service model) cell before scoping the PQC programme. Treat each cell as a separate roadmap line item — the timeline is per-cell, not per-cloud.'
  )

  if (
    inputs.customerKeyControl === 'provider-managed' &&
    inputs.crqcExposureHorizon !== 'no-restricted-data'
  ) {
    out.push(
      'Move from provider-managed (CMK off) to at least customer-managed via cloud KMS. Provider-managed keys give you zero PQC opt-in once the provider rolls; you cannot lead the migration with no key custody.'
    )
  }

  if (inputs.assetClasses.includes('TLS termination')) {
    out.push(
      'Enable hybrid X25519MLKEM768 on customer-controlled TLS endpoints (IaaS-side load balancers, on-prem proxies) as soon as your TLS library supports it. Provider-terminated TLS will follow on the provider roadmap.'
    )
  }

  if (inputs.assetClasses.includes('Code-signing in CI')) {
    out.push(
      'Migrate code-signing keys to ML-DSA-65 or SLH-DSA-128s ahead of the cloud KMS rollout — code-signing is customer-controlled regardless of service model, so it can lead the PQC timeline.'
    )
  }

  if (inputs.regulatoryOverlay.some((r) => /FedRAMP|IL5|IL6|sovereign|ISMAP|IRAP/i.test(r))) {
    out.push(
      'Track FIPS 140-3 module re-validation status per provider per region. Procurement deadlines should reference the validated-module list, not the algorithm GA announcement.'
    )
  }

  if (inputs.cloudProviders.includes('multi-cloud') || inputs.cloudProviders.length > 1) {
    out.push(
      'Pin the laggard cloud to the migration timeline, not the leader. Multi-cloud PQC adoption is bounded by the slowest provider — adopt accordingly to avoid asymmetric guarantees across workloads.'
    )
  }

  out.push(
    'Refresh the cloud responsibility matrix every 6 months — provider PQC roadmaps shift quarterly, and FIPS 140-3 re-validation status changes the customer/provider boundary in practice.'
  )

  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Public engine entry
// ─────────────────────────────────────────────────────────────────────────────

const CITATION =
  'NIST CSWP 39 Section 6.4 (Crypto Agility in the Cloud) and Section 5.3 (Technology Supply Chains). https://doi.org/10.6028/NIST.CSWP.39'

/**
 * Build the cloud shared-responsibility matrix. Pure function — no React, no
 * state, no I/O. Unit-tested directly.
 */
export function buildCloudResponsibilityMatrix(
  inputs: CloudMatrixInputs
): CloudMatrixRecommendation {
  return {
    matrix: buildMatrix(inputs),
    watchOuts: computeWatchOuts(inputs),
    recommendations: computeRecommendations(inputs),
    citation: CITATION,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CSWP-39 §6.4 verbatim quote (sanitised to ASCII)
// ─────────────────────────────────────────────────────────────────────────────

const CSWP39_64_QUOTE =
  'The main security model used in the cloud is the shared responsibility model, which clearly divides security duties between the cloud provider and the customer. The cloud provider secures the underlying infrastructure, including physical facilities, hardware, networking, and virtualization. The customer manages the security of their data, applications, and configurations.'

// ─────────────────────────────────────────────────────────────────────────────
// Wizard section definitions
// ─────────────────────────────────────────────────────────────────────────────

const SECTIONS: ArtifactSection[] = [
  {
    id: 'cloudPosture',
    title: 'Step 1 - Cloud posture',
    description:
      'Tell the engine which clouds you operate in, which service models you consume, and the regulatory overlay you must honour.',
    fields: [
      {
        id: 'cloudProviders',
        label: 'Cloud providers',
        type: 'checklist',
        options: [
          { value: 'AWS', label: 'AWS' },
          { value: 'GCP', label: 'GCP' },
          { value: 'Azure', label: 'Azure' },
          { value: 'Oracle', label: 'Oracle Cloud Infrastructure' },
          { value: 'IBM', label: 'IBM Cloud' },
          { value: 'Alibaba', label: 'Alibaba Cloud' },
          { value: 'on-prem', label: 'On-prem private cloud' },
          { value: 'multi-cloud', label: 'Multi-cloud (explicit)' },
        ],
        defaultValue: ['AWS'],
      },
      {
        id: 'serviceModelMix',
        label: 'Service-model mix',
        type: 'checklist',
        options: [
          { value: 'IaaS', label: 'IaaS' },
          { value: 'PaaS', label: 'PaaS' },
          { value: 'SaaS', label: 'SaaS' },
          { value: 'FaaS', label: 'FaaS / serverless' },
          {
            value: 'container-as-a-service',
            label: 'Container-as-a-service (ECS / GKE / AKS)',
          },
        ],
        defaultValue: ['IaaS', 'PaaS'],
      },
      {
        id: 'regulatoryOverlay',
        label: 'Regulatory overlay',
        type: 'checklist',
        options: [
          { value: 'FedRAMP High', label: 'FedRAMP High' },
          { value: 'FedRAMP Moderate', label: 'FedRAMP Moderate' },
          { value: 'IL5/IL6', label: 'IL5 / IL6 (DoD)' },
          { value: 'EU sovereign cloud', label: 'EU sovereign cloud' },
          { value: 'UK G-Cloud', label: 'UK G-Cloud' },
          { value: 'Japan ISMAP', label: 'Japan ISMAP' },
          { value: 'Australia IRAP PROTECTED', label: 'Australia IRAP PROTECTED' },
          { value: 'none', label: 'None of the above' },
        ],
        defaultValue: [],
      },
    ],
  },
  {
    id: 'cryptoInventory',
    title: 'Step 2 - Crypto inventory in cloud',
    description:
      'Pick the asset classes in scope, the key-control posture, residency, and your harvest-now-decrypt-later horizon.',
    fields: [
      {
        id: 'assetClasses',
        label: 'Asset classes in scope',
        type: 'checklist',
        options: [
          { value: 'TLS termination', label: 'TLS termination' },
          {
            value: 'Managed database',
            label: 'Managed database (RDS / Aurora / Cloud SQL / Cosmos)',
          },
          {
            value: 'Object storage encryption',
            label: 'Object storage encryption (S3 / GCS / Blob)',
          },
          { value: 'Message queue encryption', label: 'Message queue encryption' },
          { value: 'KMS-backed keys', label: 'KMS-backed keys' },
          { value: 'Code-signing in CI', label: 'Code-signing in CI' },
          { value: 'FaaS function payloads', label: 'FaaS function payloads' },
          {
            value: 'Customer-managed keys',
            label: 'Customer-managed keys (BYOK / HYOK)',
          },
        ],
        defaultValue: ['TLS termination', 'KMS-backed keys'],
      },
      {
        id: 'customerKeyControl',
        label: 'Customer key control',
        type: 'select',
        options: [
          {
            value: 'provider-managed',
            label: 'Provider-managed only (CMK / CSEK off)',
          },
          {
            value: 'customer-managed',
            label: 'Customer-managed via cloud KMS (CMK)',
          },
          {
            value: 'customer-supplied',
            label: 'Customer-supplied (BYOK / HYOK)',
          },
          {
            value: 'customer-controlled-HSM',
            label: 'Customer-controlled HSM (CloudHSM / Cloud KMS HSM-backed)',
          },
        ],
        defaultValue: 'customer-managed',
      },
      {
        id: 'dataResidency',
        label: 'Data residency',
        type: 'select',
        options: [
          { value: 'single-region', label: 'Single region' },
          {
            value: 'multi-region-within-jurisdiction',
            label: 'Multi-region within jurisdiction',
          },
          {
            value: 'multi-region-cross-jurisdiction',
            label: 'Multi-region cross-jurisdiction',
          },
          { value: 'no-constraint', label: 'No constraint' },
        ],
        defaultValue: 'single-region',
      },
      {
        id: 'crqcExposureHorizon',
        label: 'CRQC exposure horizon (harvest-now-decrypt-later)',
        type: 'select',
        options: [
          { value: '<5y', label: '< 5 years' },
          { value: '5-15y', label: '5 - 15 years' },
          { value: '>15y', label: '> 15 years' },
          {
            value: 'no-restricted-data',
            label: 'No restricted data (informational only)',
          },
        ],
        defaultValue: '5-15y',
      },
    ],
  },
  {
    id: 'plan',
    title: 'Step 3 - Responsibility plan (editable)',
    description:
      'Edit the narrative carried into the exported matrix. The matrix, watch-outs, and recommendations are generated automatically.',
    fields: [
      {
        id: 'responsibilityPlan',
        label: 'Shared-responsibility plan narrative',
        type: 'textarea',
        placeholder:
          'e.g., We operate on AWS + Azure under FedRAMP High. The PQC migration for KMS-backed keys is gated by FIPS 140-3 re-validation; we expect a 12-month lag. Code-signing leads the customer-side migration and ships ML-DSA-65 by 2026-Q3.',
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Label tables
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = {
  AWS: 'AWS',
  GCP: 'GCP',
  Azure: 'Azure',
  Oracle: 'Oracle Cloud Infrastructure',
  IBM: 'IBM Cloud',
  Alibaba: 'Alibaba Cloud',
  'on-prem': 'On-prem private cloud',
  'multi-cloud': 'Multi-cloud (explicit)',
}

const KEY_CONTROL_LABELS: Record<string, string> = {
  'provider-managed': 'Provider-managed only',
  'customer-managed': 'Customer-managed via cloud KMS (CMK)',
  'customer-supplied': 'Customer-supplied (BYOK / HYOK)',
  'customer-controlled-HSM': 'Customer-controlled HSM',
}

const RESIDENCY_LABELS: Record<string, string> = {
  'single-region': 'Single region',
  'multi-region-within-jurisdiction': 'Multi-region within jurisdiction',
  'multi-region-cross-jurisdiction': 'Multi-region cross-jurisdiction',
  'no-constraint': 'No constraint',
}

const HORIZON_LABELS: Record<string, string> = {
  '<5y': '< 5 years',
  '5-15y': '5 - 15 years',
  '>15y': '> 15 years',
  'no-restricted-data': 'No restricted data',
}

const OWNER_LABELS: Record<Owner, string> = {
  customer: 'Customer',
  provider: 'Provider',
  shared: 'Shared',
}

const AVAILABILITY_LABELS: Record<PqcAvailability, string> = {
  available: 'Available',
  partial: 'Partial / preview',
  roadmap: 'Roadmap',
  'no-public-plan': 'No public plan',
}

function labelOr(map: Record<string, string>, key: string): string {
  // eslint-disable-next-line security/detect-object-injection
  return map[key] ?? key
}

function joinLabels(map: Record<string, string>, keys: string[]): string {
  if (keys.length === 0) return 'None specified'
  return keys.map((k) => labelOr(map, k)).join('; ')
}

function joinPlain(keys: string[]): string {
  return keys.length === 0 ? 'None specified' : keys.join('; ')
}

function sanitiseAscii(md: string): string {
  return md
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/→/g, '->')
    .replace(/§/g, 'Section ')
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown preview
// ─────────────────────────────────────────────────────────────────────────────

function escapePipe(s: string): string {
  return s.replace(/\|/g, '\\|')
}

function renderMatrixTable(cells: ResponsibilityCell[]): string {
  if (cells.length === 0) {
    return '(No matrix cells - pick at least one asset class and one service model in Steps 1-2.)\n\n'
  }
  let out =
    '| Asset class | Service model | Owner | Customer actions | Provider actions | PQC availability | Notes |\n'
  out += '|---|---|---|---|---|---|---|\n'
  for (const c of cells) {
    const cust = escapePipe(c.customerActions.join(' ; '))
    const prov = escapePipe(c.providerActions.join(' ; '))
    out += `| ${escapePipe(c.assetClass)} | ${c.serviceModel} | ${OWNER_LABELS[c.owner]} | ${cust} | ${prov} | ${AVAILABILITY_LABELS[c.pqcAvailability]} | ${escapePipe(c.notes)} |\n`
  }
  out += '\n'
  return out
}

export function renderCloudMatrixMarkdown(
  data: Record<string, Record<string, string | string[]>>
): string {
  const posture = data.cloudPosture ?? {}
  const inventory = data.cryptoInventory ?? {}
  const plan = data.plan ?? {}

  const inputs: CloudMatrixInputs = {
    cloudProviders: Array.isArray(posture.cloudProviders)
      ? (posture.cloudProviders as string[])
      : [],
    serviceModelMix: Array.isArray(posture.serviceModelMix)
      ? (posture.serviceModelMix as string[])
      : [],
    regulatoryOverlay: Array.isArray(posture.regulatoryOverlay)
      ? (posture.regulatoryOverlay as string[])
      : [],
    assetClasses: Array.isArray(inventory.assetClasses) ? (inventory.assetClasses as string[]) : [],
    customerKeyControl: (inventory.customerKeyControl as string) || 'customer-managed',
    dataResidency: (inventory.dataResidency as string) || 'single-region',
    crqcExposureHorizon: (inventory.crqcExposureHorizon as string) || '5-15y',
    responsibilityPlan: (plan.responsibilityPlan as string) || '',
  }

  const rec = buildCloudResponsibilityMatrix(inputs)

  let md = `# Cloud Shared-Responsibility Crypto Matrix\n\n`
  md += `*Aligned to NIST CSWP 39 Section 6.4 (Crypto Agility in the Cloud) and Section 5.3 (Technology Supply Chains).*\n`
  md += `*https://doi.org/10.6028/NIST.CSWP.39*\n\n`

  md += `## 1. Cloud Posture\n\n`
  md += `- Providers: ${joinLabels(PROVIDER_LABELS, inputs.cloudProviders)}\n`
  md += `- Service-model mix: ${joinPlain(inputs.serviceModelMix)}\n`
  md += `- Regulatory overlay: ${joinPlain(inputs.regulatoryOverlay)}\n\n`

  md += `## 2. Crypto Inventory\n\n`
  md += `- Asset classes in scope: ${joinPlain(inputs.assetClasses)}\n`
  md += `- Customer key control: ${labelOr(KEY_CONTROL_LABELS, inputs.customerKeyControl)}\n`
  md += `- Data residency: ${labelOr(RESIDENCY_LABELS, inputs.dataResidency)}\n`
  md += `- CRQC exposure horizon: ${labelOr(HORIZON_LABELS, inputs.crqcExposureHorizon)}\n\n`

  md += `## 3. Shared-Responsibility Matrix\n\n`
  md += renderMatrixTable(rec.matrix)

  md += `## 4. Watch-outs\n\n`
  for (const w of rec.watchOuts) md += `- ${w}\n`
  md += `\n`

  md += `## 5. Recommendations\n\n`
  for (const r of rec.recommendations) md += `- ${r}\n`
  md += `\n`

  md += `## 6. Responsibility Plan Narrative\n\n`
  if (inputs.responsibilityPlan.trim().length > 0) {
    md += `${inputs.responsibilityPlan.trim()}\n\n`
  } else {
    md += `(No narrative recorded.)\n\n`
  }

  md += `---\n\n`
  md += `> Per CSWP 39 Section 6.4: "${CSWP39_64_QUOTE}"\n\n`
  md += `*Generated by PQC Today Hub. Standards citations: NIST CSWP 39 Section 6.4, Section 5.3. https://doi.org/10.6028/NIST.CSWP.39*\n`

  return sanitiseAscii(md)
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const CloudResponsibilityMatrix: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)

  const sections = useMemo(() => SECTIONS, [])

  const handleExport = useCallback(
    (data: Record<string, Record<string, string | string[]>>) => {
      const providers = Array.isArray(data.cloudPosture?.cloudProviders)
        ? (data.cloudPosture.cloudProviders as string[])
        : []
      const providerSummary =
        providers.length === 0
          ? 'cloud'
          : providers.length === 1
            ? providers[0]
            : `${providers[0]}+${providers.length - 1}`
      const markdown = renderCloudMatrixMarkdown(data)
      addExecutiveDocument({
        id: `cloud-responsibility-matrix-${Date.now()}`,
        moduleId: 'crypto-mgmt-modernization',
        type: 'cloud-responsibility-matrix',
        title: `Cloud Responsibility Matrix - ${providerSummary}`,
        data: markdown,
        createdAt: Date.now(),
      })
    },
    [addExecutiveDocument]
  )

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 border-l-4 border-status-info flex items-start gap-3">
        <Cloud size={20} className="text-status-info mt-0.5 shrink-0" />
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Cloud Shared-Responsibility Crypto Matrix
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Architect + compliance-lead tool from NIST CSWP 39 Section 6.4 - Crypto Agility in the
            Cloud. Builds a per-asset-class shared-responsibility matrix across IaaS / PaaS / SaaS /
            FaaS, with PQC availability per provider and watch-outs for multi-cloud, BYOK, and
            FedRAMP overlays.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="glass-panel p-3 flex items-start gap-2">
          <Cloud size={16} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Shared responsibility is per cell</p>
            <p className="text-muted-foreground">
              Each (asset class, service model) pair has its own owner. The PQC timeline is also
              per-cell, not per-cloud.
            </p>
          </div>
        </div>
        <div className="glass-panel p-3 flex items-start gap-2">
          <ArrowRight size={16} className="text-status-info shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">FedRAMP follows the module, not the algo</p>
            <p className="text-muted-foreground">
              FIPS 140-3 re-validation lags algorithm GA by 6-12 months. Procurement deadlines
              should reference the validated-module list.
            </p>
          </div>
        </div>
        <div className="glass-panel p-3 flex items-start gap-2">
          <ShieldCheck size={16} className="text-status-success shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Customer keys are the customer lever</p>
            <p className="text-muted-foreground">
              CSWP-39 Section 6.4: even when the provider runs the hardware, customers retain
              custody of their keys. That custody is the PQC opt-in.
            </p>
          </div>
        </div>
      </div>

      <ArtifactBuilder
        title="Cloud Shared-Responsibility Crypto Matrix"
        description="Fill in the cloud posture and crypto inventory; the engine returns a per-cell responsibility matrix with PQC availability + watch-outs."
        sections={sections}
        onExport={handleExport}
        exportFilename="cloud-responsibility-matrix"
        renderPreview={renderCloudMatrixMarkdown}
        exportFormats={['markdown', 'pdf']}
        wideTable
      />
    </div>
  )
}
