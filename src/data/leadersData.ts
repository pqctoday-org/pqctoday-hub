export interface Leader {
  name: string
  role: string
  organization: string
  type: 'Public' | 'Private'
  contribution: string
  imageUrl?: string
  websiteUrl?: string
  linkedinUrl?: string
}

export const leadersData: Leader[] = [
  {
    name: 'Dr. Dustin Moody',
    role: 'PQC Standardization Lead',
    organization: 'NIST (USA)',
    type: 'Public',
    contribution:
      'Leads the global effort to evaluate and standardize post-quantum cryptographic algorithms (FIPS 203/204/205).',
    imageUrl:
      'https://ui-avatars.com/api/?name=Dustin+Moody&background=0b0d17&color=22d3ee&size=128&bold=true',
    websiteUrl: 'https://csrc.nist.gov/projects/post-quantum-cryptography',
    linkedinUrl: 'https://www.linkedin.com/in/dustin-moody-9b6b6b1a/',
  },
  {
    name: 'Ollie Whitehouse',
    role: 'Chief Technical Officer',
    organization: 'NCSC (UK)',
    type: 'Public',
    contribution: "Driving the UK's strategic roadmap for PQC migration and industry preparedness.",
    imageUrl:
      'https://ui-avatars.com/api/?name=Ollie+Whitehouse&background=0b0d17&color=22d3ee&size=128&bold=true',
    websiteUrl: 'https://www.ncsc.gov.uk/whitepaper/next-steps-pqc',
    linkedinUrl: 'https://www.linkedin.com/in/olliewhitehouse/',
  },
  {
    name: 'Jérôme Plût',
    role: 'Cryptographer',
    organization: 'ANSSI (France)',
    type: 'Public',
    contribution:
      "Key figure in defining France's hybrid transition strategy and national security requirements.",
    imageUrl:
      'https://ui-avatars.com/api/?name=Jerome+Plut&background=0b0d17&color=22d3ee&size=128&bold=true',
    websiteUrl: 'https://www.ssi.gouv.fr/en/',
    linkedinUrl: 'https://www.linkedin.com/',
  },
  {
    name: 'Mark Hughes',
    role: 'Security Executive',
    organization: 'IBM',
    type: 'Private',
    contribution:
      "Advocate for Cryptographic Bill of Materials (CBOM) and leader in IBM's quantum-safe initiatives.",
    imageUrl:
      'https://ui-avatars.com/api/?name=Mark+Hughes&background=0b0d17&color=a78bfa&size=128&bold=true',
    websiteUrl: 'https://www.ibm.com/quantum/quantum-safe',
    linkedinUrl: 'https://www.linkedin.com/in/mark-hughes-ibm/',
  },
  {
    name: 'Jack Hidary',
    role: 'CEO',
    organization: 'SandboxAQ',
    type: 'Private',
    contribution:
      'Pioneering the intersection of AI and Quantum security to help enterprises manage the PQC transition.',
    imageUrl:
      'https://ui-avatars.com/api/?name=Jack+Hidary&background=0b0d17&color=a78bfa&size=128&bold=true',
    websiteUrl: 'https://www.sandboxaq.com/',
    linkedinUrl: 'https://www.linkedin.com/in/jackhidary/',
  },
  {
    name: 'Andersen Cheng',
    role: 'CEO',
    organization: 'Post-Quantum',
    type: 'Private',
    contribution:
      "Coined the term 'Harvest Now, Decrypt Later' and advocates for immediate action on data privacy.",
    imageUrl:
      'https://ui-avatars.com/api/?name=Andersen+Cheng&background=0b0d17&color=a78bfa&size=128&bold=true',
    websiteUrl: 'https://www.post-quantum.com/',
    linkedinUrl: 'https://www.linkedin.com/in/andersencheng/',
  },
  {
    name: 'Dr. Ali El Kaafarani',
    role: 'CEO',
    organization: 'PQShield',
    type: 'Private',
    contribution:
      'Leading the development of hardware and software PQC solutions and contributing to NIST standards.',
    imageUrl:
      'https://ui-avatars.com/api/?name=Ali+El+Kaafarani&background=0b0d17&color=a78bfa&size=128&bold=true',
    websiteUrl: 'https://pqshield.com/',
    linkedinUrl: 'https://www.linkedin.com/in/ali-el-kaafarani/',
  },
]
