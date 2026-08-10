// SPDX-License-Identifier: GPL-3.0-only
/**
 * CBOM import — B+ remediation 4.4 (2026-08-10).
 *
 * "Let developers import a CBOM instead of hand-answering inventory questions."
 * The wizard's most-abandoned stretch is the one that asks what cryptography
 * you run, because most people cannot answer it from memory and the honest
 * answer — "I don't know" — is exactly what makes the resulting report weak.
 *
 * A developer usually CAN produce a machine-readable answer, and this repo
 * already emits the format: `scripts/generate-cbom.ts` writes CycloneDX 1.7
 * with `cryptoProperties`, and `cbomExport.ts` emits the same shape from the
 * migrate catalog. Accepting that format back is the smallest possible bridge.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO. It does not fabricate answers to
 * questions the file cannot answer. A CBOM tells you which algorithms are
 * present; it says nothing about your data retention, your compliance regime or
 * your team size. So this fills exactly one field — the crypto inventory — and
 * reports what it found, leaving every other question for the human. An import
 * that quietly guessed at the rest would produce a confident report built on
 * invented premises, which is worse than an abandoned wizard.
 *
 * Parsing is intentionally forgiving about WHERE the algorithm names live:
 * CycloneDX has moved them between revisions, and real files in the wild carry
 * a mix. Anything it cannot recognise is reported, never silently dropped.
 */

/** What the wizard learns from a file, and what it could not learn. */
export interface CbomImportResult {
  /** Algorithm names matched to the wizard's own vocabulary. */
  recognised: string[]
  /** Algorithm-ish strings found but not in the wizard's list — reported, not dropped. */
  unrecognised: string[]
  /** Total crypto assets seen, for the "we read N of them" line. */
  assetsSeen: number
  /** Format note shown to the reader, e.g. 'CycloneDX 1.7'. */
  format: string
}

export class CbomParseError extends Error {}

/**
 * Normalise for comparison: CycloneDX writes `ML-KEM-768`, some tools write
 * `MLKEM768` or `ml_kem_768`, and the wizard's own options use yet another
 * casing. Compare on letters and digits only.
 */
function norm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Pull every plausible algorithm string out of a CycloneDX document. */
function collectAlgorithmStrings(doc: Record<string, unknown>): {
  found: string[]
  assets: number
} {
  const found: string[] = []
  let assets = 0

  const components = Array.isArray(doc.components) ? doc.components : []
  for (const raw of components) {
    const c = raw as Record<string, unknown>
    if (c.type !== 'cryptographic-asset') continue
    assets += 1

    const cp = (c.cryptoProperties ?? {}) as Record<string, unknown>
    const alg = (cp.algorithmProperties ?? {}) as Record<string, unknown>

    // CycloneDX has carried the primitive name in several places across
    // revisions. Take whichever are present; dedupe happens below.
    for (const candidate of [alg.primitive, alg.parameterSetIdentifier, cp.oid, c.name]) {
      if (typeof candidate === 'string' && candidate.trim()) found.push(candidate.trim())
    }
  }
  return { found, assets }
}

/**
 * Parse a CBOM and match its algorithms against the wizard's own option list.
 *
 * `wizardOptions` is passed in rather than imported so this stays a pure
 * function over whatever vocabulary the crypto step is offering — the step owns
 * that list, and it changes.
 */
export function parseCbom(text: string, wizardOptions: string[]): CbomImportResult {
  let doc: Record<string, unknown>
  try {
    doc = JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new CbomParseError('That file isn’t valid JSON. A CBOM is a JSON document.')
  }

  const format = typeof doc.bomFormat === 'string' ? doc.bomFormat : ''
  const specVersion = typeof doc.specVersion === 'string' ? doc.specVersion : ''
  if (format !== 'CycloneDX') {
    throw new CbomParseError(
      'That looks like JSON, but not a CycloneDX CBOM. Export one from your build (CycloneDX 1.6 or later), or answer the question by hand.'
    )
  }

  const { found, assets } = collectAlgorithmStrings(doc)
  if (assets === 0) {
    throw new CbomParseError(
      'This is a valid CycloneDX file, but it contains no cryptographic assets — so there is no inventory to import. It may be a software BOM rather than a crypto BOM.'
    )
  }

  const optionByNorm = new Map(wizardOptions.map((o) => [norm(o), o]))
  const recognised = new Set<string>()
  const unrecognised = new Set<string>()

  for (const raw of found) {
    const key = norm(raw)
    const exact = optionByNorm.get(key)
    if (exact) {
      recognised.add(exact)
      continue
    }
    // Substring match both ways: a file may say 'ML-KEM-768' where the wizard
    // offers 'ML-KEM', or vice versa.
    const loose = wizardOptions.find((o) => {
      const n = norm(o)
      return n.length > 2 && (key.includes(n) || n.includes(key))
    })
    if (loose) recognised.add(loose)
    else unrecognised.add(raw)
  }

  return {
    recognised: [...recognised].sort(),
    unrecognised: [...unrecognised].sort().slice(0, 12),
    assetsSeen: assets,
    format: specVersion ? `CycloneDX ${specVersion}` : 'CycloneDX',
  }
}
