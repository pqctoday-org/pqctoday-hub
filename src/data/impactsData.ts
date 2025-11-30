// Icons will be imported in the component based on the string name

export interface IndustryImpact {
  industry: string
  iconName: string // We'll map this to actual icons in the component
  threats: string[]
  riskLevel: 'High' | 'Critical'
  description: string
}

export const impactsData: IndustryImpact[] = [
  {
    industry: 'Finance',
    iconName: 'Landmark',
    threats: [
      'Harvest Now, Decrypt Later (HNDL) targeting long-term records',
      'Forged digital signatures compromising transaction integrity',
      'Regulatory non-compliance risks',
    ],
    riskLevel: 'Critical',
    description:
      'The financial sector faces existential risks from quantum attacks on transaction security and historical data confidentiality.',
  },
  {
    industry: 'Government',
    iconName: 'Shield',
    threats: [
      'Exposure of National Secrets (HNDL)',
      'Compromise of classified communications',
      'Vulnerabilities in Critical Infrastructure (Power, Water)',
    ],
    riskLevel: 'Critical',
    description:
      'National security relies on protecting state secrets that must remain confidential for decades, making them prime targets for HNDL.',
  },
  {
    industry: 'Healthcare',
    iconName: 'Activity',
    threats: [
      'Genomic data privacy (lifetime sensitivity)',
      'Tampering with medical devices (pacemakers, pumps)',
      'HIPAA compliance violations',
    ],
    riskLevel: 'High',
    description:
      'Patient data, especially genomic information, has a lifetime value and requires long-term protection against future decryption.',
  },
  {
    industry: 'Transportation',
    iconName: 'Truck',
    threats: [
      'V2X (Vehicle-to-Everything) communication compromises',
      'GPS spoofing risks affecting autonomous navigation',
      'OTA firmware update vulnerabilities',
    ],
    riskLevel: 'High',
    description:
      'Autonomous systems rely on authenticated communications; quantum attacks could spoof signals leading to physical safety risks.',
  },
  {
    industry: 'IoT',
    iconName: 'Server',
    threats: [
      'Device longevity exceeding crypto lifespan',
      'Ghost Incompatibilities in firmware updates',
      'Resource constraints preventing easy PQC upgrades',
    ],
    riskLevel: 'High',
    description:
      'Billions of deployed IoT devices with limited processing power and long lifecycles are difficult to patch with new PQC algorithms.',
  },
]
