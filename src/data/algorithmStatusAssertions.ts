// SPDX-License-Identifier: AGPL-3.0-only
import { algorithmCatalogue } from './algorithmCatalogue'
import { getAlgorithmAdvisory } from './algorithmAdvisories'

export interface AlgorithmStatusAssertion {
  algorithmId: string
  authority: string
  jurisdiction: string
  kind: 'catalogue-status' | 'new-use-warning' | 'recommendation'
  value: string
  document: string
  revision?: string
  documentDate?: string
  publishedAt?: string
  effectiveFrom?: string
  effectiveUntil?: string
  conditions: string
  sourceUrl: string
  sourceHash?: string
  checkedAt: string
  evidenceState: 'source-linked' | 'verified-source' | 'needs-review'
}

export function getAlgorithmStatusAssertions(name: string): AlgorithmStatusAssertion[] {
  const row = algorithmCatalogue.find((r) => r.algorithm === name)
  if (!row) return []
  const assertions: AlgorithmStatusAssertion[] = [
    {
      algorithmId: row.algorithm_id,
      authority: row.vetting_body || 'Not established',
      jurisdiction: row.region || 'Not established',
      kind: 'catalogue-status',
      value: row.status,
      document: row.fips_standard,
      conditions:
        'Publication or selection does not certify this implementation or imply approval in every jurisdiction.',
      sourceUrl: row.status_url,
      checkedAt: '2026-10-27',
      evidenceState: /Aigis|SM2/.test(name) ? 'needs-review' : 'source-linked',
    },
  ]
  const advisory = getAlgorithmAdvisory(name)
  if (advisory)
    assertions.push({
      algorithmId: row.algorithm_id,
      authority: advisory.issuer,
      jurisdiction: 'Germany',
      kind: 'new-use-warning',
      value: advisory.label,
      document: 'Notes on recent developments concerning Classic McEliece',
      documentDate: advisory.documentDate,
      publishedAt: advisory.publishedAt,
      // Document/publication dates do not establish a legal effective date.
      conditions: advisory.note,
      sourceUrl:
        'https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Crypto/Notes_Classic_McEliece.pdf?__blob=publicationFile',
      sourceHash: advisory.sourceHash,
      checkedAt: '2026-10-27',
      evidenceState: 'verified-source',
    })
  if (row.cryptographic_family !== 'Classical' && !/Ascon|NGCC/.test(name))
    assertions.push({
      algorithmId: row.algorithm_id,
      authority: 'ANSSI',
      jurisdiction: 'France',
      kind: 'recommendation',
      value: /^(SLH-DSA|LMS|XMSS)/.test(name)
        ? 'Exempt from systematic hybridisation advice'
        : 'Hybridisation strongly emphasised',
      document: 'ANSSI PQC FAQ',
      conditions:
        'Hybridisation is mandatory within the regulated perimeter; general guidance is not a blanket obligation for all organisations. Product-qualification requirements targeted from 2027; purchasing products without PQC discouraged after 2030. This is not approval of this particular algorithm.',
      sourceUrl:
        'https://cyber.gouv.fr/enjeux-technologiques/cryptographie-post-quantique/faq-pqc/',
      checkedAt: '2026-10-27',
      evidenceState: 'source-linked',
    })
  return assertions
}
