// SPDX-License-Identifier: GPL-3.0-only
/**
 * Plain-language labels for RecommendedAction driver tags.
 *
 * Driver tags are encoded as `field:value` strings by the scoring engine
 * (see `RecommendedAction.drivers` in `src/hooks/assessmentTypes.ts`). This
 * module turns a driver tag into a one-line human sentence for the Report
 * "Based on your answers" tooltip.
 */

const RETENTION_LABELS: Record<string, string> = {
  'under-1y': 'under 1 year',
  '1-5y': '1–5 years',
  '5-10y': '5–10 years',
  '10-25y': '10–25 years',
  '25-plus': '25+ years',
  indefinite: 'indefinite',
  unknown: 'unknown (industry default applied)',
}

const CREDENTIAL_LABELS: Record<string, string> = {
  'under-1y': 'under 1 year',
  '1-3y': '1–3 years',
  '3-10y': '3–10 years',
  '10-25y': '10–25 years',
  '25-plus': '25+ years',
  indefinite: 'indefinite',
  unknown: 'unknown (industry default applied)',
}

/**
 * Convert a driver tag like `dataRetention:25-plus` into a short human label.
 */
export function formatDriver(tag: string): string {
  const idx = tag.indexOf(':')
  if (idx === -1) return tag
  const field = tag.slice(0, idx)
  const value = tag.slice(idx + 1)

  switch (field) {
    case 'dataRetention': {
      const joined = value
        .split(',')
        .map((v) => RETENTION_LABELS[v] ?? v) // eslint-disable-line security/detect-object-injection
        .join(' / ')
      return `Data must remain trustworthy for ${joined}`
    }
    case 'credentialLifetime': {
      const joined = value
        .split(',')
        .map((v) => CREDENTIAL_LABELS[v] ?? v) // eslint-disable-line security/detect-object-injection
        .join(' / ')
      return `Credentials live for ${joined}`
    }
    case 'dataSensitivity':
      return `Data classified as ${value}`
    case 'currentCrypto':
      if (value === 'signing') return 'Signing algorithms in use (RSA / ECDSA / Ed25519)'
      return `Algorithm in use: ${value}`
    case 'vendorDependency':
      if (value === 'heavy-vendor') return 'Heavy vendor dependency across crypto stack'
      if (value === 'unknown') return 'Vendor posture not yet assessed'
      return `Vendor model: ${value}`
    case 'cryptoAgility':
      return `Crypto agility level: ${value}`
    case 'timelinePressure':
      return `Regulatory deadline: ${value}`
    default:
      return `${field}: ${value}`
  }
}
