// SPDX-License-Identifier: AGPL-3.0-only
// Storybook Blue shared building blocks (sticker cards, pill buttons, chips). Every colour is
// a token from src/styles/index.css; the only shadow is the flat offset edge.
import { cva } from 'class-variance-authority'

/** Focus ring for every focusable control: 3px, offset 2px, in --ring. */
export const focusRing =
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid'

/** The offset edge under sticker cards and primary buttons. */
export const edgeUnderCard = 'shadow-[0_6px_0_hsl(var(--edge))]'
export const edgeUnderButton = 'shadow-[0_4px_0_hsl(var(--edge))]'

/** Sticker card: ink outline, 24px corners, flat offset edge. */
export const stickerCardVariants = cva(
  `border-2 rounded-3xl text-card-foreground ${edgeUnderCard}`,
  {
    variants: {
      tone: {
        default: 'bg-card border-ink',
        /** The "In focus" card: highlight fill and border (one per area at most). */
        highlight: 'bg-highlight border-highlight-border',
      },
      padding: {
        none: '',
        default: 'p-5',
        roomy: 'p-6 md:p-8',
      },
    },
    defaultVariants: { tone: 'default', padding: 'default' },
  }
)

/** Row inside a card: card fill, 1px border, 16px corners, no edge. */
export const storyRowVariants = cva(
  'bg-card border border-border rounded-2xl text-card-foreground',
  {
    variants: {
      padding: { none: '', default: 'px-4 py-3' },
      tone: { default: '', highlight: 'bg-highlight border-highlight-border' },
    },
    defaultVariants: { padding: 'default', tone: 'default' },
  }
)

/** Pill buttons. Minimum height 44px; primary carries the offset edge. */
export const storyButtonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold text-sm transition-transform disabled:pointer-events-none disabled:opacity-50 ${focusRing}`,
  {
    variants: {
      variant: {
        primary: `min-h-[44px] px-6 rounded-full border-2 border-ink bg-primary text-primary-foreground ${edgeUnderButton} active:translate-y-[3px] active:shadow-none`,
        secondary:
          'min-h-[44px] px-6 rounded-full border-2 border-ink bg-card text-card-foreground active:translate-y-[1px]',
        /** Link-like action: no border, underlined, primary text. */
        quiet:
          'min-h-[44px] px-2 rounded-md bg-transparent text-primary-legible underline underline-offset-4 hover:text-heading',
      },
    },
    defaultVariants: { variant: 'primary' },
  }
)

/** Chip: pill, chip fill. Interactive chips carry the 2px ink outline; static labels have none. */
export const chipVariants = cva(
  'inline-flex items-center gap-1 rounded-full bg-chip text-chip-foreground font-bold text-xs leading-none',
  {
    variants: {
      interactive: {
        true: `min-h-[32px] px-3 py-1.5 border-2 border-ink cursor-pointer ${focusRing} aria-pressed:bg-highlight aria-pressed:text-heading aria-pressed:border-highlight-border`,
        false: 'px-3 py-1.5',
      },
    },
    defaultVariants: { interactive: false },
  }
)

/** Status chip tones. The status word is always rendered; colour never carries the meaning alone. */
export const statusToneClass = {
  active: 'bg-chip text-chip-foreground',
  'in-focus': 'bg-highlight text-heading border-highlight-border',
  now: 'bg-highlight text-heading border-highlight-border',
  completed: 'bg-chip text-chip-foreground',
  'not-started': 'bg-caution text-caution-foreground',
  changed: 'bg-caution text-caution-foreground',
} as const

export type StatusKind = keyof typeof statusToneClass

export const statusWord: Record<StatusKind, string> = {
  active: 'Active',
  'in-focus': 'In focus',
  now: 'Now',
  completed: 'Completed',
  'not-started': 'Not started',
  changed: 'Changed since',
}

/** Eyebrow label: Nunito 800, uppercase, 0.14em tracking, heading colour. */
export const eyebrowClass = 'text-[11px] font-extrabold uppercase tracking-[0.14em] text-heading'

/** Eyebrow pill: the eyebrow label on --ribbon with a 2px ink outline. */
export const eyebrowPillClass = `inline-flex items-center rounded-full border-2 border-ink bg-ribbon px-3 py-1 ${eyebrowClass}`

/** Input and text area: card fill, 2px ink outline; pill when single-line, 16px corners for text areas. */
const fieldBase = `w-full border-2 border-ink bg-card text-card-foreground font-sans text-sm placeholder:text-muted-foreground aria-[invalid=true]:border-destructive disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`
export const storyInputClass = `${fieldBase} min-h-[44px] rounded-full px-4`
export const storyTextareaClass = `${fieldBase} min-h-[96px] rounded-2xl px-4 py-3`
