// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const SYSTEM_INTEGRATION_SECTION: SourcedSectionData = {
  id: 'system-integration',
  title: 'System integration during the PQC transition',
  lead: 'This section examines interoperability, infrastructure support, and migration verification during a phased move to post-quantum cryptography.',
  nice: [{ id: 'K0958', statement: 'Knowledge of system integration principles and practices' }],
  blocks: [
    {
      heading: 'Backwards compatibility across mixed environments',
      sentences: [
        {
          id: 'K0958-01',
          text: 'ETSI TR 103 966 notes that hybrid schemes can provide backwards compatibility during a gradual migration to post-quantum algorithms for protocols without flexible negotiation and clients supporting both traditional and post-quantum algorithms.',
          sourceId: 'ETSI-TR-103-966',
          edition: 'Deployment Considerations for Hybrid Schemes, 2024-10',
          locator: 'Clause 5.2 Hybrid interoperability, PDF pages 12-13',
        },
        {
          id: 'K0958-02',
          text: 'RFC 9954 represents each TLS hybrid key exchange algorithm combination as a NamedGroup in the supported_groups extension, stating that hybrid-aware clients and servers should remain compatible with non-hybrid-aware endpoints and middleboxes during the transition to post-quantum cryptography.',
          sourceId: 'RFC-9954-Hybrid-Key-Exchange-in-TLS-1-3',
          edition: 'RFC 9954 — Hybrid Key Exchange in TLS 1.3, 2026-07',
          locator:
            'Abstract; Section 1.4 Goals; Section 3.1 Negotiation (no PDF page markers in source file)',
        },
        {
          id: 'K0958-03',
          text: 'ETSI TR 104 016 describes backwards-compatible migration as a hybrid approach in which non-migrated dependent assets use legacy classical cryptography while migrated dependent assets use quantum-safe components, preserving interoperability but potentially permitting future downgrade attacks.',
          sourceId: 'ETSI-TR-104-016',
          edition: 'A Repeatable Framework for Quantum-Safe Migrations, 2024-10',
          locator: 'Clause 6.4 Step 4: Vulnerability analysis, PDF page 20',
        },
      ],
    },
    {
      heading: 'Planning infrastructure support and migration testing',
      bridge: 'Next, consider certificate infrastructure and migration-plan verification.',
      sentences: [
        {
          id: 'K0958-04',
          text: "ETSI TR 103 619 states that if backwards compatibility is required during a phased migration, a PKI will have to support both classical and Quantum Safe signing algorithms using parallel or hybrid certificate chains, depending on relying parties' cryptographic agility.",
          sourceId: 'ETSI TR 103 619',
          edition: 'Migration Strategies and Recommendations for Quantum-Safe Schemes, 2020-07',
          locator: 'Clause 6.1 Creation of the migration plan, PDF page 12',
        },
        {
          id: 'K0958-07',
          text: 'ETSI TR 103 619 defines management checkpoints as metrics to track migration progress, stating that planned mitigations should be followed when checkpoints are missed and that simulating and testing the migration can determine plan viability and uncover missing inventory elements.',
          sourceId: 'ETSI TR 103 619',
          edition: 'Migration Strategies and Recommendations for Quantum-Safe Schemes, 2020-07',
          locator: 'Clause 7.2 Mitigation management, PDF page 15',
        },
      ],
    },
  ],
}
