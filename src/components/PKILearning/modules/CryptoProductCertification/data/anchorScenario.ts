// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Shared author
/**
 * STUB (scaffold), seeded with the fixed facts of build spec §5 so every author
 * can import the anchor product today. The Shared author owns this file and
 * may extend it; keep the exported names stable, other authors import them.
 *
 * Deadlines are deliberately absent: market deadlines are read at runtime from
 * the Hub timeline facts (timelineFacts.generated.ts, `mandate_type`), never
 * typed here; scheme clocks come from plan r2 §5.8 with library citations.
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
  description: 'A network HSM',
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
