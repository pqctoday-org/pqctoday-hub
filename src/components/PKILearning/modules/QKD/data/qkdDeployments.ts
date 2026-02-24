export type QKDRegion = 'Asia' | 'Europe' | 'Americas'
export type QKDOperatorType = 'Telecom' | 'Government' | 'Research' | 'Financial'
export type QKDTechnology = 'Fiber' | 'Satellite' | 'Free-Space' | 'Hybrid'
export type QKDStatus = 'Operational' | 'Pilot' | 'Planned' | 'Completed'

export interface QKDDeployment {
  id: string
  name: string
  country: string
  region: QKDRegion
  operator: string
  operatorType: QKDOperatorType
  technology: QKDTechnology
  status: QKDStatus
  yearStarted: number
  distance?: string
  keyRate?: string
  description: string
  source: string
  highlights?: string[]
}

export const QKD_DEPLOYMENTS: QKDDeployment[] = [
  // China
  {
    id: 'cn-beijing-shanghai',
    name: 'Beijing-Shanghai Backbone',
    country: 'China',
    region: 'Asia',
    operator: 'USTC / China Telecom',
    operatorType: 'Government',
    technology: 'Fiber',
    status: 'Operational',
    yearStarted: 2017,
    distance: '2,000 km',
    description:
      "World's longest terrestrial QKD network linking Beijing, Jinan, Hefei, and Shanghai with 32 trusted relay nodes. Used for government and financial communications.",
    source: 'https://doi.org/10.1038/nature23655',
    highlights: [
      'Longest terrestrial QKD link',
      '32 trusted relay nodes',
      'Government + banking use',
    ],
  },
  {
    id: 'cn-micius-satellite',
    name: 'Micius Satellite QKD',
    country: 'China',
    region: 'Asia',
    operator: 'Chinese Academy of Sciences (CAS)',
    operatorType: 'Research',
    technology: 'Satellite',
    status: 'Operational',
    yearStarted: 2016,
    distance: '7,600 km (ground-to-ground via satellite)',
    description:
      'First quantum communication satellite (Mozi/Micius). Demonstrated intercontinental QKD between China and Austria via satellite relay in 2017.',
    source: 'https://doi.org/10.1103/PhysRevLett.120.030501',
    highlights: [
      'First quantum satellite',
      'Intercontinental QKD (China-Austria)',
      'Satellite-ground entanglement distribution',
    ],
  },
  {
    id: 'cn-jinan-metro',
    name: 'Jinan Metropolitan QKD Network',
    country: 'China',
    region: 'Asia',
    operator: 'Shandong Institute of Quantum Science & Technology',
    operatorType: 'Government',
    technology: 'Fiber',
    status: 'Operational',
    yearStarted: 2013,
    distance: '~90 km (metro ring)',
    description:
      'One of the earliest metropolitan QKD networks, connecting government offices in Jinan with quantum-secured communications.',
    source: 'https://doi.org/10.1364/OE.22.021739',
    highlights: ['Early metro QKD network', 'Government communications'],
  },
  // Europe
  {
    id: 'eu-euroqci',
    name: 'EuroQCI (European Quantum Communication Infrastructure)',
    country: 'EU (27 member states)',
    region: 'Europe',
    operator: 'European Commission / ESA',
    operatorType: 'Government',
    technology: 'Hybrid',
    status: 'Planned',
    yearStarted: 2019,
    description:
      'Pan-European quantum communication infrastructure combining terrestrial fiber and the EAGLE-1 satellite. All 27 EU member states signed the EuroQCI declaration.',
    source:
      'https://digital-strategy.ec.europa.eu/en/policies/european-quantum-communication-infrastructure-euroqci',
    highlights: [
      'All 27 EU member states',
      'EAGLE-1 satellite component',
      'Terrestrial + satellite hybrid',
    ],
  },
  {
    id: 'ch-swissquantum',
    name: 'SwissQuantum Network',
    country: 'Switzerland',
    region: 'Europe',
    operator: 'University of Geneva / ID Quantique',
    operatorType: 'Research',
    technology: 'Fiber',
    status: 'Completed',
    yearStarted: 2009,
    distance: '~35 km (Geneva metro)',
    description:
      'Long-running field trial (2009-2011) demonstrating QKD over deployed telecom fiber in the Geneva metropolitan area. Proved operational reliability over 21 months.',
    source: 'https://doi.org/10.1088/1367-2630/13/12/123001',
    highlights: ['21-month field trial', 'Deployed telecom fiber', 'Operational reliability proof'],
  },
  {
    id: 'es-madrid-qkd',
    name: 'Madrid Quantum Network (MadQCI)',
    country: 'Spain',
    region: 'Europe',
    operator: 'Telefonica / UPM',
    operatorType: 'Telecom',
    technology: 'Fiber',
    status: 'Pilot',
    yearStarted: 2022,
    distance: '~50 km',
    description:
      'Metropolitan QKD network in Madrid integrating multiple QKD vendors on existing Telefonica fiber infrastructure. Part of EuroQCI national program.',
    source: 'https://doi.org/10.1109/JLT.2023.3346750',
    highlights: ['Multi-vendor integration', 'Existing telecom fiber', 'EuroQCI national node'],
  },
  // UK
  {
    id: 'uk-bt-toshiba',
    name: 'BT / Toshiba QKD Network',
    country: 'United Kingdom',
    region: 'Europe',
    operator: 'BT / Toshiba Europe',
    operatorType: 'Telecom',
    technology: 'Fiber',
    status: 'Pilot',
    yearStarted: 2022,
    distance: '~120 km',
    description:
      "Commercial QKD trial on BT's live fiber network connecting data centers in London and Cambridge. Demonstrated QKD coexisting with classical data traffic on the same fiber.",
    source:
      'https://newsroom.bt.com/bt-and-toshiba-launch-worlds-first-commercial-quantum-secured-metro-network/',
    highlights: [
      'Commercial telecom fiber',
      'QKD + classical data coexistence',
      'Metro network trial',
    ],
  },
  {
    id: 'uk-ukqn',
    name: 'UK Quantum Network (UKQN)',
    country: 'United Kingdom',
    region: 'Europe',
    operator: 'EPSRC / University of Bristol',
    operatorType: 'Research',
    technology: 'Fiber',
    status: 'Operational',
    yearStarted: 2014,
    distance: '~125 km (Bristol-Cambridge)',
    description:
      'UK national quantum network testbed connecting Bristol, Cambridge, and London. Used for research into quantum networking and multi-node QKD.',
    source: 'https://www.quantumcommshub.net/',
    highlights: ['National testbed', 'Multi-node research', 'University-industry partnership'],
  },
  {
    id: 'uk-qkdsat',
    name: 'QKDSat',
    country: 'United Kingdom',
    region: 'Europe',
    operator: 'ESA / Craft Prospect',
    operatorType: 'Research',
    technology: 'Satellite',
    status: 'Planned',
    yearStarted: 2023,
    description:
      'ESA-supported UK industry satellite QKD mission aiming to deliver quantum key distribution as a service from orbit.',
    source:
      'https://www.esa.int/Applications/Connectivity_and_Secure_Communications/QKDSat_Secure_communication_via_quantum_cryptography',
    highlights: ['Commercial QKD-as-a-service', 'ESA partnership', 'UK industry-led'],
  },
  // Asia (non-China)
  {
    id: 'kr-sk-telecom',
    name: 'SK Telecom QKD Network',
    country: 'South Korea',
    region: 'Asia',
    operator: 'SK Telecom / ID Quantique',
    operatorType: 'Telecom',
    technology: 'Fiber',
    status: 'Operational',
    yearStarted: 2016,
    distance: '~200 km (Seoul metro)',
    description:
      'Commercial QKD deployment by SK Telecom securing its LTE/5G backbone infrastructure. Partnered with ID Quantique for QKD equipment.',
    source: 'https://www.sktelecom.com/en/press/press_detail.do?idx=1311',
    highlights: [
      'Commercial telecom deployment',
      '5G backbone security',
      'ID Quantique partnership',
    ],
  },
  {
    id: 'jp-tokyo-qkd',
    name: 'Tokyo QKD Network',
    country: 'Japan',
    region: 'Asia',
    operator: 'NICT / NEC / Toshiba / NTT',
    operatorType: 'Research',
    technology: 'Fiber',
    status: 'Completed',
    yearStarted: 2010,
    distance: '~45 km (Tokyo metro)',
    description:
      'Multi-vendor QKD testbed in Tokyo demonstrating interoperability between different QKD systems (NEC, Toshiba, NTT, IDQ). Part of the UQCC project.',
    source: 'https://doi.org/10.1364/OE.19.010387',
    highlights: ['Multi-vendor interoperability', 'UQCC project', 'Four QKD system types'],
  },
  {
    id: 'jp-socrates',
    name: 'SOCRATES Microsatellite',
    country: 'Japan',
    region: 'Asia',
    operator: 'NICT',
    operatorType: 'Research',
    technology: 'Satellite',
    status: 'Completed',
    yearStarted: 2014,
    description:
      'Small Optical Communication Satellite (SOCRATES) carrying the SOTA laser terminal. Demonstrated space-to-ground quantum-limited communication from LEO in 2016.',
    source: 'https://doi.org/10.1038/nphoton.2017.107',
    highlights: [
      'Microsatellite platform',
      'Space-to-ground quantum communication',
      'SOTA laser terminal',
    ],
  },
  {
    id: 'sg-spooqy-1',
    name: 'SpooQy-1 CubeSat',
    country: 'Singapore',
    region: 'Asia',
    operator: 'NUS Centre for Quantum Technologies',
    operatorType: 'Research',
    technology: 'Free-Space',
    status: 'Completed',
    yearStarted: 2019,
    description:
      'CubeSat (3U) that demonstrated generation of polarization-entangled photon pairs in low-Earth orbit. Proved miniaturized entangled-photon sources can operate in the space environment.',
    source: 'https://doi.org/10.1364/OPTICA.381684',
    highlights: [
      'CubeSat form factor',
      'Entangled photon pairs in orbit',
      'Miniaturized quantum source',
    ],
  },
  // Americas
  {
    id: 'ca-qeyssat',
    name: 'QEYSSat',
    country: 'Canada',
    region: 'Americas',
    operator: 'Canadian Space Agency / U. Waterloo IQC',
    operatorType: 'Government',
    technology: 'Satellite',
    status: 'Planned',
    yearStarted: 2017,
    description:
      'Quantum Encryption and Science Satellite (QEYSSat) microsatellite mission led by the Canadian Space Agency and the University of Waterloo Institute for Quantum Computing. Aims to demonstrate satellite-based QKD.',
    source: 'https://www.asc-csa.gc.ca/eng/satellites/qeyssat.asp',
    highlights: ['Canadian microsatellite', 'IQC partnership', 'Ground-to-space QKD demo'],
  },
  {
    id: 'us-jpmorgan-toshiba',
    name: 'JPMorgan Chase / Toshiba QKD Trial',
    country: 'United States',
    region: 'Americas',
    operator: 'JPMorgan Chase / Toshiba',
    operatorType: 'Financial',
    technology: 'Fiber',
    status: 'Completed',
    yearStarted: 2022,
    distance: '~32 km',
    description:
      'QKD field trial securing financial communications over deployed fiber in the New York metropolitan area. Demonstrated QKD for blockchain network protection.',
    source: 'https://www.jpmorgan.com/technology/technology-blog/quantum-key-distribution',
    highlights: ['Financial sector use case', 'NYC metro fiber', 'Blockchain protection trial'],
  },
  {
    id: 'us-doe-testbeds',
    name: 'DOE Quantum Network Testbeds',
    country: 'United States',
    region: 'Americas',
    operator: 'US Department of Energy (Fermilab, BNL, ORNL)',
    operatorType: 'Government',
    technology: 'Fiber',
    status: 'Operational',
    yearStarted: 2020,
    distance: '~80 km (Chicago-area)',
    description:
      'DOE-funded quantum network testbeds at national laboratories including Fermilab (Chicago), Brookhaven, and Oak Ridge. Research into quantum repeaters and entanglement distribution.',
    source: 'https://www.energy.gov/science/doe-explainsquantum-networks',
    highlights: ['National lab infrastructure', 'Quantum repeater research', 'Multi-site testbed'],
  },
  {
    id: 'us-aws-cqn',
    name: 'AWS Center for Quantum Networking (CQN)',
    country: 'United States',
    region: 'Americas',
    operator: 'AWS',
    operatorType: 'Research',
    technology: 'Fiber',
    status: 'Planned',
    yearStarted: 2022,
    description:
      'AWS research initiative focusing on quantum memory, repeaters, and scalable quantum networking technologies to eventually construct a global quantum internet.',
    source:
      'https://aws.amazon.com/blogs/quantum-computing/announcing-the-aws-center-for-quantum-networking/',
    highlights: ['Commercial tech research', 'Quantum repeater focus', 'Cloud scale'],
  },
  {
    id: 'us-cqe',
    name: 'Chicago Quantum Exchange (CQE) Network',
    country: 'United States',
    region: 'Americas',
    operator: 'CQE / UChicago / Argonne / Toshiba',
    operatorType: 'Research',
    technology: 'Fiber',
    status: 'Operational',
    yearStarted: 2022,
    distance: '111 km (Chicago area)',
    description:
      'Major terrestrial quantum network in the US connecting UChicago, Argonne National Laboratory, and other partners. Demonstrated multi-node quantum entanglement distribution.',
    source: 'https://chicagoquantum.org/',
    highlights: ['111 km entanglement network', 'Multi-institution', 'National lab integration'],
  },
]

/** All unique regions in the deployment dataset */
export const QKD_REGIONS: QKDRegion[] = ['Asia', 'Europe', 'Americas']

/** All unique operator types */
export const QKD_OPERATOR_TYPES: QKDOperatorType[] = [
  'Telecom',
  'Government',
  'Research',
  'Financial',
]

/** All unique technologies */
export const QKD_TECHNOLOGIES: QKDTechnology[] = ['Fiber', 'Satellite', 'Free-Space', 'Hybrid']

/** All unique statuses */
export const QKD_STATUSES: QKDStatus[] = ['Operational', 'Pilot', 'Planned', 'Completed']
