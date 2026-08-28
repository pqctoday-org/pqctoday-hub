// SPDX-License-Identifier: GPL-3.0-only
/**
 * Builds the Learn link for an industry.
 *
 * Most industries map onto a module one-to-one, so the plain module route is
 * right. A few modules serve several industries at once — the Financial
 * Services & Payments module covers cards, banking and retail — and dropping
 * all three at the top of a 110-minute module would be a worse experience than
 * the three shorter modules it replaced.
 *
 * Where the module declares `learnPaths`, this resolves the industry to its
 * path and links straight at that path's entry section. The module's
 * `LearnSection` components open and scroll to it; `?path=` records which
 * route the learner is on, so completion is judged against that path's
 * sections rather than all eleven.
 */
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'

/**
 * Industry → learn path id, for modules that serve more than one industry.
 * Keyed by the industry values used in `industry_landscape_*.csv`.
 */
const INDUSTRY_TO_PATH: Record<string, string> = {
  'Payment Card Industry': 'cards',
  'Finance & Banking': 'banking',
  'Retail & E-Commerce': 'retail',
}

export const learnHref = (moduleId: string, industry: string): string => {
  const base = `/learn/${moduleId}`
  const pathId = INDUSTRY_TO_PATH[industry]
  if (!pathId) return base

  const path = MANIFEST_BY_ID[moduleId]?.learnPaths?.find((p) => p.id === pathId)
  // If the module has no such path (renamed, removed, or this industry was
  // re-pointed at a different module), fall back to the module top rather than
  // linking at a section that may not exist.
  if (!path) return base

  return `${base}?path=${encodeURIComponent(path.id)}&section=${encodeURIComponent(path.entrySection)}`
}
