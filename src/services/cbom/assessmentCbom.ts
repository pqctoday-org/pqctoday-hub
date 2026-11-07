// SPDX-License-Identifier: AGPL-3.0-only
import { buildCbomDocument, cbomBomRef, standardsFor } from './cycloneDx'
import type { CbomReportSummary } from './reportSummary'

interface AssessmentAlgorithm {
  storedKey: string
  classical: string
  keySize?: string
}

/** A declaration is not evidence of a deployed library, key or configuration. */
export function buildAssessmentCbom(rows: readonly AssessmentAlgorithm[]): {
  json: string
  summary: CbomReportSummary
} {
  // Reuse the shared format/version, education notice, UUID and metadata envelope.
  const doc = JSON.parse(
    buildCbomDocument([], {
      toolName: 'PQC Today CBOM Builder',
      properties: [
        { name: 'pqctoday:mode', value: 'assessment' },
        { name: 'pqctoday:source', value: 'assessment-self-report' },
      ],
    }).json
  )
  const uniqueRows = [...new Map(rows.map((row) => [row.storedKey, row])).values()]
  const algorithms: CbomReportSummary['algorithms'] = []
  doc.components = uniqueRows.map((row) => {
    const name =
      row.keySize && row.keySize !== 'N/A' ? `${row.classical} (${row.keySize})` : row.classical
    const upper = row.classical.toUpperCase()
    // Only infer family/primitive from explicit names, never from a suggested
    // replacement or the catalogue's supported-algorithm list. RSA alone does
    // not identify signing/encryption padding or an operation.
    let family = row.classical
    let primitive = 'unknown'
    let classical: boolean | undefined
    if (/^RSA\b/.test(upper)) {
      family = 'RSA'
      classical = true
    } else if (/^ECDSA\b/.test(upper)) {
      family = 'ECDSA'
      primitive = 'signature'
      classical = true
    } else if (/^ECDH\b/.test(upper)) {
      family = 'ECDH'
      primitive = 'key-agree'
      classical = true
    } else if (/^AES(?:-(?:128|192|256))?$/.test(upper)) {
      family = 'AES'
      primitive = 'block-cipher'
      classical = true
    }
    const declaredBits = row.keySize?.replace(/-bit$| bits?$/i, '').trim()
    const bits = /^(RSA|AES)$/.test(family)
      ? (upper.match(/(?:RSA|AES)[-\s]?(\d+)/)?.[1] ??
        (declaredBits && /^\d+$/.test(declaredBits) ? declaredBits : undefined))
      : undefined
    const curve = /\b(?:ECDH|ECDSA)\b/.test(upper)
      ? upper.match(/\bP-(256|384|521)\b/)?.[1]
      : undefined
    const standards = standardsFor(family)
    algorithms.push({
      name,
      family,
      ...(classical !== undefined ? { classical } : {}),
      standard: standards[0]?.name,
      standardUrl: standards[0]?.url,
    })
    return {
      type: 'cryptographic-asset',
      'bom-ref': cbomBomRef('assessment', `assessment:${encodeURIComponent(row.storedKey)}`),
      name,
      description:
        'Self-reported assessment algorithm. Deployment, key custody and configuration have not been established by this record.',
      cryptoProperties: {
        assetType: 'algorithm',
        algorithmProperties: {
          primitive,
          ...(standards.length ? { algorithmFamily: family } : {}),
          ...(bits ? { parameterSetIdentifier: bits } : {}),
          ...(curve ? { ellipticCurve: `nist/P-${curve}` } : {}),
        },
      },
      properties: [
        { name: 'pqctoday:source', value: 'assessment-self-report' },
        { name: 'pqctoday:assessmentSelection', value: row.storedKey },
        { name: 'pqctoday:declaredAlgorithm', value: row.classical },
        ...(row.keySize ? [{ name: 'pqctoday:declaredKeySize', value: row.keySize }] : []),
      ],
      ...(standards.length
        ? {
            externalReferences: standards.map((s) => ({
              type: 'citation',
              url: s.url,
              comment: s.name,
            })),
          }
        : {}),
    }
  })
  const count = doc.components.length
  return {
    json: JSON.stringify(doc, null, 2),
    summary: {
      mode: 'assessment',
      basis: 'assessment-self-report',
      generatedAt: Date.now(),
      componentCount: count,
      componentsWithCrypto: count,
      cryptoAssetCount: count,
      quantumSafeCount: 0,
      quantumVulnerableCount: 0,
      quantumUnassessedCount: count,
      algorithms,
      byType: count ? { 'cryptographic-asset': count } : {},
    },
  }
}
