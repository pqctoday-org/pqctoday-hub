// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Captures every lesson fact a page shows, as the app computes it. The golden
 * file beside it (`lessonFacts.beforeMove.golden.json`) was captured with this
 * same function on the commit before the organising fields moved out of the
 * manifests into the lessons data file, so lessonData.test.ts can prove the
 * move changed nothing a reader sees.
 */
import { MODULE_CATALOG, MODULE_TRACKS, LM_ID_MAP } from '../../moduleData'
import { MODULE_TAXONOMY, MODULE_PLAYGROUND_TOOL } from '../../moduleEnrichment'
import { NICE_MODULE_MAP } from '@/data/niceModuleMapping'
import { ROUTE_META } from '@/seo/routeMeta'
import { LEARN_ORDER } from '@/data/learnOrderData'
import { quizCategories } from '@/data/quizDataLoader'
import { PAGE_RELATIONS } from '@/data/pageRelations'
import { getModuleVersionFingerprint } from '../contentVersion'

export function captureLessonFacts() {
  const lessonRoutes = Object.fromEntries(
    Object.entries(ROUTE_META).filter(
      ([path]) => path.startsWith('/learn/') && path.slice('/learn/'.length) in MODULE_CATALOG
    )
  )
  const relatedLessonLinks = Object.fromEntries(
    Object.entries(PAGE_RELATIONS).map(([page, entries]) => [
      page,
      entries
        .filter((entry) => entry.to.startsWith('/learn/'))
        .map((entry) => ({ to: entry.to, title: entry.title })),
    ])
  )
  return JSON.parse(
    JSON.stringify({
      catalog: MODULE_CATALOG,
      trackOrder: MODULE_TRACKS.map((t) => ({ track: t.track, ids: t.modules.map((m) => m.id) })),
      lmIds: LM_ID_MAP,
      taxonomy: MODULE_TAXONOMY,
      playgroundTools: MODULE_PLAYGROUND_TOOL,
      contentVersions: getModuleVersionFingerprint(),
      nice: NICE_MODULE_MAP,
      learnOrder: LEARN_ORDER,
      routeMeta: lessonRoutes,
      quizLabels: Object.fromEntries(quizCategories.map((c) => [c.id, c.label])),
      relatedLessonLinks,
    })
  ) as Record<string, unknown>
}
