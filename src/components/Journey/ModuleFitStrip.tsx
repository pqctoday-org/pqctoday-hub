// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The one strip under a module's title (UX handoff 6.11: "reconcile this header with Release 2a's
 * live Where this fits strip so stage, Take first and Next are not duplicated"). It joins the
 * learning-order line (stage, take first, next) and the NICE coverage line in a single container:
 * nothing is shown twice, and each part keeps its own accessible name and behaviour.
 */
import { LearnOrderStrip } from '@/components/ui/LearnOrderStrip'
import { NiceCoveragePanel } from '@/components/ui/NiceCoveragePanel'
import { getLearnOrder } from '@/data/learnOrderData'
import { LEARN_MODULE_BY_ID } from '@/data/generated/learnModules.generated'

export function ModuleFitStrip({ moduleId }: { moduleId: string }) {
  const order = getLearnOrder(moduleId)
  const lesson = LEARN_MODULE_BY_ID[moduleId] // eslint-disable-line security/detect-object-injection
  const hasNice = Boolean(lesson?.niceRead && lesson.niceTier)
  if (!order && !hasNice) return null
  return (
    <div
      data-testid="module-fit-strip"
      className="mt-3 min-w-0 space-y-2 rounded-2xl border border-border bg-card px-3 py-2"
    >
      {order ? <LearnOrderStrip moduleId={moduleId} bare /> : null}
      {order && hasNice ? <hr className="border-border" /> : null}
      {hasNice ? <NiceCoveragePanel moduleId={moduleId} bare /> : null}
    </div>
  )
}
