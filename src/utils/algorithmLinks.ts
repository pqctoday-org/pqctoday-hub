// SPDX-License-Identifier: GPL-3.0-only
/**
 * Canonical in-app links to one algorithm on /algorithms. `?algo=<id>` opens
 * that algorithm's detail; the id is the kebab-case slug of the reference
 * CSV's `algorithm` name ("ML-KEM-768" → "ml-kem-768", "ECDH P-256" →
 * "ecdh-p-256", "LMS-SHA256 (H20/W8)" → "lms-sha256-h20-w8"). The page also
 * accepts the exact name, so older name-keyed links keep working.
 */

/** Stable algorithm id for a reference-CSV algorithm name. */
export function algorithmSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** `/algorithms?algo=<id>` for one algorithm, by its reference-CSV name. */
export function algorithmHref(name: string): string {
  return `/algorithms?algo=${encodeURIComponent(algorithmSlug(name))}`
}
