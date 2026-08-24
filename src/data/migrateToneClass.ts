// SPDX-License-Identifier: GPL-3.0-only
//
// tone -> (text, bg, border) token classes for Migrate decision/status
// badges. Pure-moved out of workbenchUi.tsx (2026-08-24 audit R3.7) — that
// file also exports the real Pill JSX component, so MobileMigrateView.tsx
// previously carried its own byte-identical copy rather than importing a
// desktop view component into the mobile boundary.
export type Tone = 'success' | 'primary' | 'info' | 'warning' | 'destructive' | 'muted'

export const TONE_CLASS: Record<Tone, string> = {
  success: 'text-status-success bg-status-success/10 border-status-success/30',
  primary: 'text-primary bg-primary/10 border-primary/30',
  info: 'text-status-info bg-status-info/10 border-status-info/30',
  warning: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  destructive: 'text-status-error bg-status-error/10 border-status-error/30',
  muted: 'text-muted-foreground bg-muted border-border',
}
