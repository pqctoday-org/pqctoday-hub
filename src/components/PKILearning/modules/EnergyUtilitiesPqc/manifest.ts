// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'energy-utilities-pqc',
  whyThisMatters:
    'Protection-relay GOOSE/SV frames cannot carry asymmetric PQC signatures inside a 4 ms tripping window, and field IEDs/smart meters stay deployed for 15–25 years — utilities must separate real-time symmetric data planes from PQC-protected key distribution and gateway boundaries.',
  learnSections: [
    { id: 'grid-threat-model', label: 'Grid Threat Model & Assets' },
    { id: 'substation-and-scada', label: 'Substation & SCADA Protocols' },
    { id: 'ami-and-field-lifecycles', label: 'AMI & Field Lifecycles' },
    { id: 'regulatory-and-migration', label: 'Regulation & Evidence Scope' },
  ],
  workshopSteps: [
    { id: 'grid-protocol-mapper', label: 'Grid Protocol Mapper' },
    { id: 'substation-mtu-budget', label: 'Substation MTU & Latency Lab' },
    { id: 'smart-meter-lifecycle', label: 'Field Asset Lifecycle Planner' },
    { id: 'grid-evidence-scope', label: 'Grid Evidence Checklist' },
  ],
  startHere: {
    step: 'grid-protocol-mapper',
    text: 'Map a sample utility architecture in the Grid Protocol Mapper to separate real-time protection-relay links from SCADA WAN gateways, AMI head-end services, and long-lived protected assets.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.EnergyUtilitiesPqcModule })),
}

export default resolveManifest(manifest)
