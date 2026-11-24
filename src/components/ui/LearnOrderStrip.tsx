// SPDX-License-Identifier: AGPL-3.0-only
import { Link } from 'react-router'
import { CategoryBadge } from '@/components/ui/category-badge'
import { getLearnOrder } from '@/data/learnOrderData'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'

interface LearnOrderStripProps {
  moduleId: string
}

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

export function LearnOrderStrip({ moduleId }: LearnOrderStripProps) {
  const order = getLearnOrder(moduleId)
  if (!order) return null

  return (
    <nav
      aria-label="Where this fits"
      className="mt-3 flex min-w-0 flex-col items-start gap-1 text-sm text-muted-foreground"
    >
      <CategoryBadge category="global" label={`Stage ${order.stage} · ${order.stageName}`} />
      {order.takeFirst.length > 0 ? (
        <p className="min-w-0">
          <span className="font-semibold text-foreground">Take first: </span>
          <ModuleLinks moduleIds={order.takeFirst} />
        </p>
      ) : null}
      {order.next.length > 0 ? (
        <p className="min-w-0">
          <span className="font-semibold text-foreground">Next: </span>
          <ModuleLinks moduleIds={order.next} />
        </p>
      ) : null}
    </nav>
  )
}
