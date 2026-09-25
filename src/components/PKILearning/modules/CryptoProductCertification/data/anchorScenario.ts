// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Shared author
/**
 * The module's anchor product (build spec §5): one fictional network HSM, sold
 * as an appliance and as a multi-tenant cloud service, into four markets.
 * Every author imports it. Keep the exported names and the shape of
 * `ANCHOR_SCENARIO` stable — extend only by adding exports or fields.
 *
 * Deadlines are deliberately absent: market deadlines are read at runtime from
 * the Hub timeline facts (timelineFacts.generated.ts, `mandate_type`), never
 * typed here; scheme clocks come from plan r2 §5.8 with library citations
 * (see sharedData.ts `SCHEME_CLOCKS`).
 */

export type AnchorComponentId =
  | 'client-sdk'
  | 'network-service'
  | 'appliance-hardware'
  | 'firmware'
  | 'crypto-library'
  | 'tenant-partition'

export type AnchorCustomerId =
  'us-federal-agency' | 'eu-qtsp' | 'secure-element-manufacturer' | 'payment-processor'

export interface AnchorScenario {
  /** product name — always shown with `fictionalLabel` */
  name: string
  fictionalLabel: string
  description: string
  deliveryModels: string[]
  components: { id: AnchorComponentId; label: string }[]
  customers: { id: AnchorCustomerId; label: string }[]
  change: string
}

export const ANCHOR_SCENARIO: AnchorScenario = {
  name: 'Orrin N7',
  fictionalLabel: 'fictional',
  description:
    'A network-attached hardware security module (HSM), sold as an on-premises appliance and as a multi-tenant cloud HSM service',
  deliveryModels: ['appliance', 'multi-tenant cloud service'],
  components: [
    { id: 'client-sdk', label: 'Client SDK' },
    { id: 'network-service', label: 'Network service' },
    { id: 'appliance-hardware', label: 'Appliance hardware' },
    { id: 'firmware', label: 'Firmware' },
    { id: 'crypto-library', label: 'Crypto library' },
    { id: 'tenant-partition', label: 'Tenant partition' },
  ],
  customers: [
    { id: 'us-federal-agency', label: 'US federal agency' },
    { id: 'eu-qtsp', label: 'EU qualified trust service provider' },
    { id: 'secure-element-manufacturer', label: 'Smart-card / secure-element manufacturer' },
    { id: 'payment-processor', label: 'Payment processor' },
  ],
  change: 'Adding ML-KEM and ML-DSA, with optional hybrid',
}

/** Display name with the fictional label, e.g. "Orrin N7 (fictional)". */
export const ANCHOR_DISPLAY_NAME = `${ANCHOR_SCENARIO.name} (${ANCHOR_SCENARIO.fictionalLabel})`

export interface AnchorComponentDetail {
  id: AnchorComponentId
  /** What the component is, in one sentence. */
  summary: string
  /** Where it runs in the appliance offering. */
  appliance: string
  /** Where it runs in the cloud offering. */
  cloud: string
}

/**
 * What each component is and where it runs. The product is fictional, so these
 * are design facts of the scenario (not claims about any real HSM).
 */
export const ANCHOR_COMPONENT_DETAILS: Record<AnchorComponentId, AnchorComponentDetail> = {
  'client-sdk': {
    id: 'client-sdk',
    summary:
      'PKCS#11, JCE and KMIP client libraries that customers install on their own application hosts.',
    appliance: 'Customer servers',
    cloud: 'Customer servers or customer cloud workloads',
  },
  'network-service': {
    id: 'network-service',
    summary:
      'The TLS API front end, request router and cluster manager that accept client connections and pass them to an HSM.',
    appliance: 'The appliance’s management processor, outside the tamper-responsive enclosure',
    cloud: 'The provider’s front-end servers, outside every HSM',
  },
  'appliance-hardware': {
    id: 'appliance-hardware',
    summary:
      'The tamper-responsive enclosure with the crypto processor, noise source, key storage and zeroisation circuitry.',
    appliance: 'Customer data centre',
    cloud: 'Provider data centre, one appliance serving many tenants',
  },
  firmware: {
    id: 'firmware',
    summary:
      'The signed firmware image that runs inside the enclosure: roles, services, self-tests, key management and update logic.',
    appliance: 'Inside the enclosure',
    cloud: 'Inside the enclosure',
  },
  'crypto-library': {
    id: 'crypto-library',
    summary:
      'The algorithm implementations compiled into the firmware — today RSA, ECDSA, ECDH and AES; the change adds ML-KEM and ML-DSA.',
    appliance: 'Inside the enclosure, part of the firmware image',
    cloud: 'Inside the enclosure, part of the firmware image',
  },
  'tenant-partition': {
    id: 'tenant-partition',
    summary:
      'A logical partition that gives each tenant its own keys, roles and audit log, enforced by the firmware.',
    appliance: 'Optional (one customer, several partitions)',
    cloud: 'One or more per cloud tenant',
  },
}

export interface AnchorCustomerProfile {
  id: AnchorCustomerId
  /** The question the customer's procurement actually asks. */
  asks: string
  /**
   * Keys into TIMELINE_COUNTRY_DEADLINE_BY_NAME (timelineFacts.generated.ts)
   * for the market/policy deadlines that create this customer's urgency.
   * Empty = no single jurisdiction; say why in `deadlineNote`.
   */
  timelineMarkets: string[]
  deadlineNote: string
}

export const ANCHOR_CUSTOMER_PROFILES: Record<AnchorCustomerId, AnchorCustomerProfile> = {
  'us-federal-agency': {
    id: 'us-federal-agency',
    asks: 'Is the cryptographic module we will rely on validated by the CMVP, and is PQC available in its approved mode?',
    timelineMarkets: ['United States'],
    deadlineNote: 'US federal PQC migration dates, from the Hub timeline.',
  },
  'eu-qtsp': {
    id: 'eu-qtsp',
    asks: 'Is the HSM certified against the Protection Profile our eIDAS conformity assessment expects, under EUCC?',
    timelineMarkets: ['European Union'],
    deadlineNote: 'The EU coordinated PQC roadmap date, from the Hub timeline.',
  },
  'secure-element-manufacturer': {
    id: 'secure-element-manufacturer',
    asks: 'Can the HSM that sits in our certified chip-production environment show evidence our Common Criteria evaluator will accept?',
    timelineMarkets: [],
    deadlineNote:
      'No single jurisdiction: the manufacturer inherits the deadlines of the programmes its chips are sold into.',
  },
  'payment-processor': {
    id: 'payment-processor',
    asks: 'Is this HSM an approved PCI PTS HSM, and will it let our PIN, P2PE and key-management operations pass their assessments?',
    timelineMarkets: [],
    deadlineNote:
      'No jurisdiction deadline: payment requirements come from PCI SSC and the payment brands, and no public PCI material names a PQC deadline (as of 24 September 2026).',
  },
}

export type AnchorReleaseId = 'baseline' | 'pqc-candidate'

export interface AnchorRelease {
  id: AnchorReleaseId
  label: string
  /** Fictional firmware version string, used consistently across the module. */
  firmware: string
  algorithms: string[]
  note: string
}

/** The two lanes of the release train (plan r2 §5.8). Versions are fictional. */
export const ANCHOR_RELEASES: AnchorRelease[] = [
  {
    id: 'baseline',
    label: 'Certified baseline',
    firmware: '4.2.1',
    algorithms: ['RSA', 'ECDSA', 'ECDH', 'AES'],
    note: 'The firmware version named on the existing certificates and listings.',
  },
  {
    id: 'pqc-candidate',
    label: 'PQC candidate',
    firmware: '5.0.0',
    algorithms: ['RSA', 'ECDSA', 'ECDH', 'AES', 'ML-KEM', 'ML-DSA', 'hybrid key establishment'],
    note: 'Adds ML-KEM and ML-DSA, with optional hybrid. Not covered by any existing certificate.',
  },
]
