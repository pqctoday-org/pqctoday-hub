// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'energy-utilities-pqc',
  contentVersion: 1,
  lm_id: 'LM-082',
  title: 'Energy, Utilities & Grid PQC',
  description:
    'Plan post-quantum migration across power generation, transmission substations, SCADA control centers, AMI smart-meter meshes, and DER edge gateways under real-time latency, MTU, and 15–25 year field-lifecycle constraints.',
  whyThisMatters:
    'Protection-relay GOOSE/SV frames cannot carry asymmetric PQC signatures inside a 4 ms tripping window, and field IEDs/smart meters stay deployed for 15–25 years — utilities must separate real-time symmetric data planes from PQC-protected key distribution and gateway boundaries.',
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 10,
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
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'LMS/XMSS', 'ECDSA'],
    standards: [
      'FIPS 203',
      'FIPS 204',
      'FIPS 205',
      'NIST SP 800-208',
      'NIST IR 8547',
      'RFC 9370',
      'RFC 9846',
      'RFC 10024',
      'OMB M-26-15',
      'FIPS 140-3',
    ],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.EnergyUtilitiesPqcModule })),
}

export default manifest
