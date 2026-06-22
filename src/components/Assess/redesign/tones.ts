// SPDX-License-Identifier: GPL-3.0-only
//
// Semantic-token tone system for the Assess redesign.
//
// The design handoff specifies a fixed dark palette in raw hex (cyan #2dd4e8,
// violet #b49cfc, green #56d39a, gold #f5b544, danger #f76b6b). Per the handoff
// ("translated to Tailwind tokens") and the repo UX standard (semantic tokens
// only, no raw palette/hex), each prototype colour maps to a hub semantic token:
//
//   accent / cyan   → primary        (the cyan accent + gradients)
//   violet          → secondary      ("recommended" + the profile domain)
//   green           → status-success (completion + the readiness domain)
//   gold / amber    → status-warning (the fast→full upgrade affordance)
//   danger / pink   → status-error   (validation errors)
//
// Mirrors src/components/Compliance/redesign/tones.ts so the redesigns share one
// approach and stay light/dark-mode safe.

export type Tone = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'muted'

interface ToneClasses {
  /** Foreground text in the tone colour. */
  text: string
  /** Soft tinted background (~10% alpha) for pills/cards/tags. */
  softBg: string
  /** Border at ~40% alpha. */
  border: string
  /** Solid fill for dots / number tiles. */
  solidBg: string
  /** Readable text on top of the solid fill. */
  onSolid: string
}

export const TONES: Record<Tone, ToneClasses> = {
  primary: {
    text: 'text-primary',
    softBg: 'bg-primary/10',
    border: 'border-primary/40',
    solidBg: 'bg-primary',
    onSolid: 'text-primary-foreground',
  },
  secondary: {
    text: 'text-secondary',
    softBg: 'bg-secondary/10',
    border: 'border-secondary/40',
    solidBg: 'bg-secondary',
    onSolid: 'text-secondary-foreground',
  },
  success: {
    text: 'text-status-success',
    softBg: 'bg-status-success/10',
    border: 'border-status-success/40',
    solidBg: 'bg-status-success',
    onSolid: 'text-background',
  },
  warning: {
    text: 'text-status-warning',
    softBg: 'bg-status-warning/10',
    border: 'border-status-warning/40',
    solidBg: 'bg-status-warning',
    onSolid: 'text-background',
  },
  error: {
    text: 'text-status-error',
    softBg: 'bg-status-error/10',
    border: 'border-status-error/40',
    solidBg: 'bg-status-error',
    onSolid: 'text-background',
  },
  muted: {
    text: 'text-muted-foreground',
    softBg: 'bg-muted',
    border: 'border-border',
    solidBg: 'bg-muted-foreground',
    onSolid: 'text-background',
  },
}

/** The three assessment domains used for the rail + review grouping. */
export type AssessDomain = 'profile' | 'exposure' | 'readiness'

export const DOMAIN_META: Record<AssessDomain, { label: string; tone: Tone }> = {
  profile: { label: 'Your organization', tone: 'secondary' },
  exposure: { label: 'Cryptographic exposure', tone: 'primary' },
  readiness: { label: 'Migration readiness', tone: 'success' },
}

/** Soft tinted-pill class string for a tone (the domain tag / "Recommended" pill). */
export function pillClasses(tone: Tone): string {
  // eslint-disable-next-line security/detect-object-injection
  const t = TONES[tone]
  return `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${t.text} ${t.softBg} ${t.border}`
}
