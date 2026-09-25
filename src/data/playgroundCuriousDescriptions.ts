// SPDX-License-Identifier: GPL-3.0-only
/**
 * Plain-English tool descriptions for the curious persona (P07-P1-02).
 *
 * Keyed by the canonical `tool.id` from `workshopRegistry.tsx`. Only the
 * starter-friendly tools have entries — others fall through to the existing
 * technical description on the tile.
 *
 * Coverage matches the CuriousGuide step 4 deep-link set + the most
 * approachable demonstration tools.
 */
export const PLAYGROUND_CURIOUS_DESCRIPTIONS: Record<string, string> = {
  'qrng-demo':
    'A simulation — no quantum hardware involved. A “quantum” sample, an ordinary computer sample and a broken one side by side: only the broken one stands out, because simple checks cannot tell where good random numbers came from.',
  'rng-demo':
    'Good random vs predictable random — output that looks the same, very different security. A 2-minute reveal of why a random-looking generator can still be guessed.',
  'tls-simulator':
    'Watch a website handshake in slow motion. Every padlock icon hides a ~50-millisecond conversation between your browser and a server — step through it message by message.',
  'hybrid-encrypt':
    "How the world is migrating: keep today's encryption running side-by-side with the new quantum-safe algorithms. See the wrapped ciphertext both schemes produce.",
  'binary-signing':
    'Sign a file with a digital signature, then watch verification confirm nothing changed. The same idea protects every software update on your phone.',
  'envelope-encrypt':
    'Two-layer encryption: a small key encrypts your data, then a bigger algorithm encrypts that small key. Used by every cloud provider for "envelope" encryption.',
}

export function getCuriousToolDescription(toolId: string): string | undefined {
  // eslint-disable-next-line security/detect-object-injection
  return PLAYGROUND_CURIOUS_DESCRIPTIONS[toolId]
}
