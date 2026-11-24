// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const AIR_GAPPED_VAULT_SECTION: SourcedSectionData = {
  id: 'air-gapped-vault-design',
  title: 'Air-gapped data and key vault design',
  lead: 'This section introduces air-gapped key-vault design, offline workflows, backups, and post-quantum planning.',
  nice: [{ id: 'S0929', statement: 'Skill in designing air-gapped data vault solutions' }],
  blocks: [
    {
      heading: 'Isolating key material and vault devices',
      sentences: [
        {
          id: 'S0929-04',
          text: 'Under CCSS v9.0, key material is isolated from other operating systems and application processes, such as through hardware security modules or trusted execution environments, to avoid unauthorized access or leakage.',
          sourceId: 'CCSS-v9-0',
          edition: 'CCSS v9.0 Table - CryptoCurrency Certification Consortium (C4), 2024-12',
          locator:
            'Section 1.05.2 (Operational key material environment), control 1.05.2.2 (Level I); web-extracted table without PDF page numbers',
        },
        {
          id: 'S0929-03',
          text: 'In the ICANN Root Zone KSK DPS, no part of the HSM signer system connects to any communications network, while the production network is logically separated from other components to block access outside defined application processes.',
          sourceId: 'ICANN-Root-Zone-KSK-DPS-8th-Edition',
          edition: 'DNSSEC Practice Statement for the Root Zone KSK Operator, 8th Edition, 2025-04',
          locator:
            'Section 5.6 (Network security controls); web-extracted text without PDF page numbers',
        },
        {
          id: 'S0929-01',
          text: 'The SFC Circular on Custody of Virtual Assets states that integrity checks on critical transaction data should use air-gapped devices stored in a cold vault, which require physical access for code modifications.',
          sourceId: 'SFC-Circular-25EC44-Custody-Virtual-Assets',
          edition:
            'Circular to licensed virtual asset trading platform operators on custody of virtual assets, 2025-08',
          locator: 'Section III (Client cold wallet operation), paragraph 10, PDF page 3',
        },
        {
          id: 'S0929-02',
          text: 'For transaction approval, the SFC Circular on Custody of Virtual Assets states that devices should be dedicated, have restricted functionality and limited network connectivity, and remain isolated from general purpose workstations to reduce compromise risks.',
          sourceId: 'SFC-Circular-25EC44-Custody-Virtual-Assets',
          edition:
            'Circular to licensed virtual asset trading platform operators on custody of virtual assets, 2025-08',
          locator: 'Section III (Client cold wallet operation), paragraph 10, PDF page 3',
        },
      ],
    },
    {
      heading: 'Operating across the air gap and securing backups',
      bridge:
        'Once signing hardware is isolated, custody operations rely on controlled offline workflows to move requests in and protect physical backups.',
      sentences: [
        {
          id: 'S0929-05',
          text: "IANA's Root KSK Ceremonies page explains that key signing ceremonies are typically held four times a year with trusted community representatives so the root KSK can sign operational ZSKs for a three-month period.",
          sourceId: 'Root-KSK-Ceremonies',
          edition: 'Root KSK Ceremonies',
          locator: 'Key Signing Ceremonies overview; web-extracted text without PDF page numbers',
        },
        {
          id: 'S0929-06',
          text: 'In the ICANN Root Zone KSK DPS, zone signing key requests arrive over a TLS client-side authenticated web server on the production network and are transferred manually to the signer system on removable media.',
          sourceId: 'ICANN-Root-Zone-KSK-DPS-8th-Edition',
          edition: 'DNSSEC Practice Statement for the Root Zone KSK Operator, 8th Edition, 2025-04',
          locator:
            'Section 5.6 (Network security controls); web-extracted text without PDF page numbers',
        },
        {
          id: 'S0929-07',
          text: "Under the ICANN Root Zone KSK DPS, the operator verifies a key signing request's hash out of band before entering it into the signer system, which then validates its signature and parameters before signing.",
          sourceId: 'ICANN-Root-Zone-KSK-DPS-8th-Edition',
          edition: 'DNSSEC Practice Statement for the Root Zone KSK Operator, 8th Edition, 2025-04',
          locator:
            'Section 6.7 (Verification of zone signing key set); web-extracted text without PDF page numbers',
        },
        {
          id: 'S0929-08',
          text: 'CCSS v9.0 Level II specifies that key material backups use a tamper-evident mechanism, such as a serial-numbered tamper-evident bag for physical backups, so an operator can determine whether a backup has been accessed.',
          sourceId: 'CCSS-v9-0',
          edition: 'CCSS v9.0 Table - CryptoCurrency Certification Consortium (C4), 2024-12',
          locator:
            'Section 1.03.5 (Tamper-evident key material backup(s)), control 1.03.5.1 (Level II); web-extracted table without PDF page numbers',
        },
      ],
    },
    {
      heading: 'Planning vaults and offline archives for post-quantum cryptography',
      bridge:
        'Long-lived custody vaults also face future cryptographic shifts that affect artifact sizes and how offline records remain verifiable over time.',
      sentences: [
        {
          id: 'S0929-09',
          text: 'FIPS 204 Table 2 lists ML-DSA key and signature sizes ranging from 2560-byte private keys, 1312-byte public keys, and 2420-byte signatures for ML-DSA-44 to 4896-byte private keys, 2592-byte public keys, and 4627-byte signatures for ML-DSA-87.',
          sourceId: 'FIPS 204',
          edition: 'Module-Lattice-Based Digital Signature Standard (ML-DSA), 2024-08',
          locator: 'Section 4 (Parameter Sets), Table 2, PDF page 26',
        },
        {
          id: 'S0929-10',
          text: "The Wathiqa Internet-Draft notes that a post-quantum adversary breaking RSA can forge classical beacon pulse signatures used for offline checks, so implementations should keep an independent copy or archive of the chain to verify records beyond the beacon's RSA keys.",
          sourceId: 'Post-Quantum-Evidence-Records-with-Algorithm-Agility-Wathiqa',
          edition:
            'Post-Quantum Evidence Records with Algorithm Agility (Wathiqa Profile), 2026-09',
          locator: 'Section 8 (Security considerations)',
        },
        {
          id: 'S0929-11',
          text: 'The Wathiqa Internet-Draft explains that preserving signature proofs for decades faces the risk of a quantum computer breaking the signature algorithm, so records are extended under fresh primitives before the old one breaks, with each extension cryptographically bound to its predecessor.',
          sourceId: 'Post-Quantum-Evidence-Records-with-Algorithm-Agility-Wathiqa',
          edition:
            'Post-Quantum Evidence Records with Algorithm Agility (Wathiqa Profile), 2026-09',
          locator: 'Section 1 (Introduction)',
        },
      ],
    },
  ],
}
