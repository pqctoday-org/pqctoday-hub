// SPDX-License-Identifier: GPL-3.0-only
//
// Semantic-token tone system for the Compliance redesign.
//
// The design handoff specifies a fixed dark palette in raw hex (cyan #2dd4e8,
// violet #b49cfc, green #2fcf86, blue #5fa8fb, amber #f7c022, pink #f76b95).
// Per the handoff ("translated to Tailwind tokens") and the repo UX standard
// (semantic tokens only, no raw palette/hex), each prototype colour maps to one
// of the hub's semantic tokens:
//
//   accent / cyan   → primary      (hub --primary is 189° cyan)
//   accent-2/violet → secondary    (hub --secondary is 255° violet)
//   success / green → status-success
//   info / blue     → status-info
//   warning / amber → status-warning
//   danger / pink   → status-error (hub --critical is 335° pink)
//
// This keeps the redesign faithful while staying light/dark-mode safe.

export type Tone = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'muted'

interface ToneClasses {
  /** Foreground text in the tone colour. */
  text: string
  /** Soft tinted background (~10% alpha) for pills/cards. */
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
  info: {
    text: 'text-status-info',
    softBg: 'bg-status-info/10',
    border: 'border-status-info/40',
    solidBg: 'bg-status-info',
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

/**
 * Class string for a soft status/kind pill — the handoff's
 * `{color}1C / {color} / {color}45` formula, expressed in semantic tokens.
 */
export function pillClasses(tone: Tone): string {
  const t = TONES[tone]
  return `inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-semibold ${t.text} ${t.softBg} ${t.border}`
}
