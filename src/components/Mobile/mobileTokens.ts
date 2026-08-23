// SPDX-License-Identifier: GPL-3.0-only
import { cva } from 'class-variance-authority'

/**
 * Design-token mapping for the mobile UX layer
 * (design_handoff_pqc_mobile_ux/README.md "Design tokens" section), resolved
 * onto this repo's existing semantic tokens in `src/styles/index.css` rather
 * than the handoff's literal hsl() values — so dark mode / high-contrast
 * come free, and the palette stays in sync if the base tokens ever move.
 *
 * | Handoff value                     | This repo's token       | Match     |
 * | ---------------------------------- | ------------------------ | --------- |
 * | Accent `hsl(189 90% 24%)`          | `--primary`               | exact     |
 * | Page bg `hsl(210 40% 98%)`         | `--background`            | exact     |
 * | Border `hsl(214 32% 91%)`          | `--border`                | exact     |
 * | Chip fill `hsl(210 40% 96%)`       | `--muted`                 | exact     |
 * | Text secondary `hsl(215 16% 35%)`  | `--muted-foreground`      | exact     |
 * | Text muted `hsl(215 16% 45%)`      | `--muted-foreground`      | folded — the repo has one muted grey, not two; see below |
 * | Danger `hsl(0 84% 50%)`            | `--destructive`           | exact     |
 * | Caution `hsl(38 92% 26%)`          | `--warning`               | exact     |
 * | Success `hsl(153 60% 32%)`         | `--success`               | MISMATCH — handoff's value does not exist in this repo (`--success` is `142.1 76.2% 25%`, a different hue). Use `--success`, never the handoff's literal. |
 * | Reference group `hsl(255 85% 45%)` | `--secondary`             | close — repo's `--secondary` is `255 85% 60%` (lighter); use `--secondary`, not a new token, for the same reason as success above. |
 *
 * "Text muted" (215 16% 45%) is a second grey the handoff wants but this
 * repo doesn't have — every existing surface (NAV_PATH_LABELS captions,
 * card sub-text, etc.) already uses `--muted-foreground` for both roles.
 * Adding a second grey token here would be new design-system surface no
 * desktop component uses; the mobile layer folds onto the one grey the
 * app already has rather than introducing one, per the plan's Rule 3
 * (distill, never invent).
 */

/** 32px wide × 44px tall icon button — header Search/Share/Guide/⋯. */
export const mobileIconButton =
  'flex h-11 w-8 items-center justify-center rounded-[9px] border border-border bg-muted text-foreground'

/** Role pill in the header — tinted accent background, accent text. */
export const mobileRolePill =
  'flex h-11 items-center gap-1.5 rounded-[9px] border border-primary/25 bg-primary/[0.08] px-[9px] text-[10.5px] font-bold text-primary'

/** Track chips (Foundations / Strategy / …) and filter chips. */
export const mobileChip =
  'inline-flex items-center rounded-full bg-muted px-3 py-1.5 text-[10.5px] font-semibold text-foreground'

/** Bottom-bar tab: active vs inactive treatment (handoff "Navigation shell"). */
export const mobileNavTab = cva(
  'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5',
  {
    variants: {
      active: {
        true: 'bg-primary/[0.08] text-primary',
        false: 'text-muted-foreground',
      },
    },
    defaultVariants: { active: false },
  }
)

/**
 * Sheet scrim. Deliberately literal black, not a token — matches the
 * existing `bg-black/60` overlay MainLayout.tsx's current mobile "More"
 * sheet already uses (a screen-darkening scrim reads correctly in both
 * themes without varying by theme, unlike foreground/background colors).
 */
export const mobileSheetOverlay = 'fixed inset-0 z-overlay bg-black/35'

/** Sheet panel chrome, shared by every sheet in the mobile layer. */
export const mobileSheetPanel =
  'fixed inset-x-0 bottom-0 z-dialog rounded-t-[18px] border-t border-border bg-card shadow-[0_-10px_28px_rgba(0,0,0,0.18)]'

/** The docked workshop bar, pinned above the bottom nav. */
export const mobileDockPanel =
  'fixed inset-x-0 z-mobile-dock rounded-t-2xl border-t-[3px] border-primary bg-card shadow-[0_-8px_24px_rgba(0,0,0,0.12)]'
