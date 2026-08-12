// SPDX-License-Identifier: GPL-3.0-only
/**
 * "What this transition costs you" — B+ remediation 3.2 (2026-08-10).
 *
 * The Transition Guide told an executive that RSA-2048 becomes ML-KEM-768 and
 * stopped there, so the table read as a list of names with no reason attached
 * to any of them. This module attaches the consequence: what actually changes,
 * in bytes, when a row's classical algorithm is replaced by its PQC one.
 *
 * DERIVED, never typed. Every number below is computed at call time from
 * `ALGORITHM_REGISTRY` — the same registry `mlDsaSignatureBytes()` reads, for
 * the same reason. A hand-written sentence saying "signatures grow to 3.3 KB"
 * would be correct today and silently wrong the first time a parameter set is
 * re-tabulated from the reference CSV. If the registry has no entry for one
 * side of the transition we return `null` and the row renders no line at all,
 * rather than a plausible-looking number nobody can trace.
 */
import { ALGORITHM_REGISTRY, type AlgorithmProps } from './algorithmProperties'

/**
 * Byte formatter matching `personaConfig.ts`'s own — plain grouped bytes, never
 * KB. An executive reading "3.3 KB" next to "256 B" has to do the conversion in
 * their head to feel the jump; "3,309 B next to 256 B" carries it for free.
 */
function formatBytes(n: number): string {
  return `${n.toLocaleString()} B`
}

export interface AlgorithmConsequence {
  /** The plain sentence to render under the row. */
  sentence: string
  /** Growth multiple, for callers that want to sort or badge by severity. */
  growthFactor: number
  /** Which measurement the sentence is about — signature or key material. */
  dimension: 'signature' | 'ciphertext' | 'public key'
}

/** Registry lookup tolerant of the CSV's cosmetic naming (case, spacing). */
function lookup(name: string): AlgorithmProps | undefined {
  if (!name) return undefined
  const direct = ALGORITHM_REGISTRY[name as keyof typeof ALGORITHM_REGISTRY]
  if (direct) return direct
  const wanted = name.trim().toLowerCase().replace(/\s+/g, '')
  return Object.values(ALGORITHM_REGISTRY).find(
    (a) => a.name.toLowerCase().replace(/\s+/g, '') === wanted
  )
}

/**
 * Which byte figure carries the operational cost for a transition, and what to
 * call it. For signatures the signature itself is what lands in a certificate,
 * a token or a firmware header; for KEMs it is the ciphertext on the wire —
 * both live in `signatureOrCiphertextBytes`. Public keys are the fallback for
 * a row whose own figure is unavailable on one side.
 */
function measure(
  from: AlgorithmProps,
  to: AlgorithmProps
): { fromBytes: number; toBytes: number; dimension: AlgorithmConsequence['dimension'] } | null {
  const isSig = to.family.includes('Sig')
  if (from.signatureOrCiphertextBytes > 0 && to.signatureOrCiphertextBytes > 0) {
    return {
      fromBytes: from.signatureOrCiphertextBytes,
      toBytes: to.signatureOrCiphertextBytes,
      dimension: isSig ? 'signature' : 'ciphertext',
    }
  }
  if (from.publicKeyBytes > 0 && to.publicKeyBytes > 0) {
    return { fromBytes: from.publicKeyBytes, toBytes: to.publicKeyBytes, dimension: 'public key' }
  }
  return null
}

/**
 * Where the growth actually bites. Kept as a small, explicit map rather than
 * generated prose: the *number* is derived, but which systems a size increase
 * breaks is domain knowledge, and inventing it per row would be worse than
 * saying it once, accurately, per dimension.
 */
const WHERE_IT_BITES: Record<AlgorithmConsequence['dimension'], string> = {
  signature: 'certificate chains, firmware headers and token budgets',
  ciphertext: 'handshake budgets, MTU limits and session-setup latency',
  'public key': 'key stores, HSM capacity and certificate sizes',
}

/**
 * The consequence line for one Transition Guide row, or `null` when either
 * side of the transition is absent from the registry.
 *
 * Example (RSA-2048 → ML-DSA-65): "Signatures grow 256 B → 3,309 B, about 13×.
 * That lands on certificate chains, firmware headers and token budgets."
 */
export function transitionConsequence(
  classicalName: string,
  pqcName: string
): AlgorithmConsequence | null {
  const from = lookup(classicalName)
  const to = lookup(pqcName)
  if (!from || !to) return null

  const m = measure(from, to)
  if (!m || m.fromBytes <= 0) return null

  const growthFactor = m.toBytes / m.fromBytes
  const noun = m.dimension === 'public key' ? 'Public keys' : `${m.dimension}s`
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1)

  // A shrink is real and worth saying plainly — several symmetric and hash
  // rows do not grow at all, and telling an executive "this one costs you
  // nothing" is as useful as telling them one costs a lot.
  if (growthFactor <= 1.05) {
    return {
      sentence: `${Noun} stay about the same size (${formatBytes(m.fromBytes)} → ${formatBytes(m.toBytes)}) — no capacity work needed for this one.`,
      growthFactor,
      dimension: m.dimension,
    }
  }

  const multiple =
    growthFactor >= 10 ? `${Math.round(growthFactor)}×` : `${growthFactor.toFixed(1)}×`
  return {
    sentence: `${Noun} grow ${formatBytes(m.fromBytes)} → ${formatBytes(m.toBytes)}, about ${multiple}. That lands on ${WHERE_IT_BITES[m.dimension]}.`,
    growthFactor,
    dimension: m.dimension,
  }
}
