// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from '@/components/ui/category-badge'
import { getLearnOrder, orderNextLessons } from '@/data/learnOrderData'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'

interface LearnOrderStripProps {
  moduleId: string
  /** Drop the strip's own top margin, so it can sit inside the one module strip (ModuleFitStrip). */
  bare?: boolean
}

/** How many next lessons show before the "+ N more" control. */
export const NEXT_LESSONS_SHOWN = 3

function ModuleLinks({ moduleIds }: { moduleIds: string[] }) {
  return moduleIds.map((id, index) => {
    const module = MODULE_CATALOG[id]
    if (!module) return null

    return (
      <span key={id}>
        {index > 0 ? <span aria-hidden="true"> · </span> : null}
        <Link to={`/learn/${id}`} className="text-primary underline-offset-4 hover:underline">
          {module.title}
        </Link>
      </span>
    )
  })
}

/** The "Next:" line: up to three lessons, then a button that shows the rest in place. */
function NextLessons({ moduleId, nextIds }: { moduleId: string; nextIds: string[] }) {
  const [expanded, setExpanded] = useState(false)
  const listId = useId()
  const ordered = orderNextLessons(moduleId, nextIds).filter((id) => MODULE_CATALOG[id])
  if (ordered.length === 0) return null
  const hidden = ordered.length - NEXT_LESSONS_SHOWN
  const visible = hidden > 0 && !expanded ? ordered.slice(0, NEXT_LESSONS_SHOWN) : ordered

  return (
    <p className="min-w-0">
      <span className="font-semibold text-foreground">Next: </span>
      <span id={listId}>
        <ModuleLinks moduleIds={visible} />
      </span>
      {hidden > 0 ? (
        <>
          <span aria-hidden="true"> · </span>
          <Button
            type="button"
            variant="link"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((open) => !open)}
            className="-my-3 inline-flex h-auto min-h-[44px] px-1 py-0 align-baseline text-sm"
          >
            {expanded ? 'Show fewer' : `+ ${hidden} more`}
          </Button>
        </>
      ) : null}
    </p>
  )
}

export function LearnOrderStrip({ moduleId, bare = false }: LearnOrderStripProps) {
  const order = getLearnOrder(moduleId)
  if (!order) return null

  return (
    <nav
      aria-label="Where this fits"
      className={`${bare ? '' : 'mt-3 '}flex min-w-0 flex-col items-start gap-1 text-sm text-muted-foreground`}
    >
      <CategoryBadge category="global" label={`Stage ${order.stage} · ${order.stageName}`} />
      {order.takeFirst.length > 0 ? (
        <p className="min-w-0">
          <span className="font-semibold text-foreground">Take first: </span>
          <ModuleLinks moduleIds={order.takeFirst} />
        </p>
      ) : null}
      {order.next.length > 0 ? <NextLessons moduleId={moduleId} nextIds={order.next} /> : null}
    </nav>
  )
}
