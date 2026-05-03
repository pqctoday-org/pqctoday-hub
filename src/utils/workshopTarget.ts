// SPDX-License-Identifier: GPL-3.0-only

/**
 * Helper for tagging UI elements that the workshop Video Mode targets.
 *
 * Spread the result onto any element to attach a stable `data-workshop-target`
 * attribute. Cues then use the matching attribute selector
 * (`[data-workshop-target="<id>"]`) so they survive Tailwind / refactor churn.
 *
 *     <Button {...wt('assess-mode-quick')}>Quick</Button>
 *
 * Naming rule: `<page>-<element>` (kebab). Examples:
 *   - landing-cta-start
 *   - threats-industry-filter
 *   - business-zone-governance
 *   - assess-mode-quick
 *   - migrate-vendor-filter
 */
export function wt(id: string): { 'data-workshop-target': string } {
  return { 'data-workshop-target': id }
}

/**
 * Build the CSS selector for a workshop target id. Use in cue authoring,
 * not in components.
 */
export function wtSelector(id: string): string {
  return `[data-workshop-target="${id}"]`
}
