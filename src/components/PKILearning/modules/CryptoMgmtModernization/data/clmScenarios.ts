// SPDX-License-Identifier: GPL-3.0-only
/**
 * Canonical Certificate Lifecycle Management scenarios surfaced in the
 * InventoryLifecycleSimulator as concrete stress-tests of the operational loop.
 */

export interface CLMScenario {
  id: string
  title: string
  description: string
  triggerStage: 'discover' | 'classify' | 'remediate' | 'attest'
  kpiImpact: string
  canonicalFailure: string
  goodPractice: string
}

export const CLM_SCENARIOS: CLMScenario[] = [
  {
    id: 'shadow-cert',
    title: 'Shadow cert discovered via CT log',
    description:
      'A cert for legacy-payroll.corp.internal surfaces in Certificate Transparency logs. It is not in the CLM inventory, has no owner on record, and expires in 11 days.',
    triggerStage: 'discover',
    kpiImpact: 'Shadow cert count +1; Cert-expiry-risk (≤30 d) +1',
    canonicalFailure:
      'CLM team learns about the cert from an expiry outage on Monday morning. Service is down for 4 hours while ownership is determined.',
    goodPractice:
      'Continuous CT-log ingestion auto-creates an attribution ticket, assigns a provisional owner from DNS TXT metadata, and escalates to the service registry within 1 business day.',
  },
  {
    id: '47-day-renewal',
    title: '47-day renewal cadence stress test',
    description:
      'Under the CA/B Forum 2029 target, 10,000 public TLS certs renew every 47 days. That is ~213 renewals per day. Any manual touch-point means the math does not work.',
    triggerStage: 'remediate',
    kpiImpact: '% auto-renewed must reach 100%; cert MTTR must collapse to minutes',
    canonicalFailure:
      'A subset of certs still requires manual DNS approval. Queue backlog grows; first outages appear around month 3.',
    goodPractice:
      'ACME with DNS-01 (automated) for public certs; EST/CMP for internal CAs; expiry SLO with paging at 14-day and 7-day thresholds.',
  },
  {
    id: 'intermediate-ca-rotation',
    title: 'Intermediate CA rotation',
    description:
      'An intermediate CA with ~120,000 issued end-entity certs must rotate due to CAB Forum policy. End-entity certs must be re-issued under the new chain before the old chain is distrusted.',
    triggerStage: 'remediate',
    kpiImpact:
      'Root-rotation readiness measured against rehearsed runbook; cert-MTTR elevated during window',
    canonicalFailure:
      'Runbook has never been executed. Team discovers undocumented cert stores on firewalls and load balancers mid-rotation.',
    goodPractice:
      'Annual rotation rehearsal in lab; CBOM maps every cert to a discoverable CA; staged cutover with rollback plan.',
  },
  {
    id: 'ocsp-drift',
    title: 'OCSP responder drift',
    description:
      'OCSP responder serves stale revocation data due to a failed publication job. Browsers accept revoked certs for ~24 hours.',
    triggerStage: 'attest',
    kpiImpact: 'Attestation-freshness regression; observability MTTD spike',
    canonicalFailure:
      'Issue surfaces via a customer abuse report, 36 hours after revocation was requested.',
    goodPractice:
      'Synthetic OCSP probing with 15-minute SLO alert; CRL/CRLite dual-publication; SIEM integration for publication-job failures.',
  },
  {
    id: 'pqc-size-growth',
    title: 'PQC-era certificate size growth',
    description:
      'Hybrid X25519+ML-KEM-768 cert chains inflate TLS handshake from ~4 KB to ~9–12 KB. Middleboxes and embedded stacks hit MTU/memory limits.',
    triggerStage: 'classify',
    kpiImpact: 'CBOM now tracks cert-size-percentile; SLO adjusted for hybrid handshakes',
    canonicalFailure:
      'Point-of-sale terminals silently fall back to TLS 1.2 classical suites, bypassing policy.',
    goodPractice:
      'Pre-deployment handshake-size budgeting per endpoint class; telemetry on negotiated ciphers by fleet segment.',
  },
  {
    id: 'expired-ocsp-signer',
    title: 'Expired OCSP-signer sub-CA',
    description:
      'Sub-CA dedicated to signing OCSP responses expired unnoticed. All revocation checks start failing open.',
    triggerStage: 'discover',
    kpiImpact: 'Cert-expiry-risk spike; attestation-freshness bad; outage risk imminent',
    canonicalFailure:
      'Sub-CA expiry not in the CLM inventory because it is held offline. Discovered via a third-party scanner during a pentest.',
    goodPractice:
      'Every CA (offline or online) inventoried; renewal SLO independent of issued-cert rotation cadence.',
  },
]
