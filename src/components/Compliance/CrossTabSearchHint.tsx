// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { SearchX, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ComplianceFramework } from '@/data/complianceData'

export type LandscapeTab = 'standards' | 'technical' | 'certification' | 'compliance'

const TAB_LABELS: Record<LandscapeTab, string> = {
  standards: 'Standardization Bodies',
  technical: 'Technical Standards',
  certification: 'Certification Schemes',
  compliance: 'Compliance Frameworks',
}

function matchFramework(fw: ComplianceFramework, q: string): boolean {
  return (
    fw.label.toLowerCase().includes(q) ||
    fw.description.toLowerCase().includes(q) ||
    fw.enforcementBody.toLowerCase().includes(q)
  )
}

interface Props {
  searchText: string
  currentTab: LandscapeTab
  tabFrameworks: Record<LandscapeTab, ComplianceFramework[]>
  onSwitchTab: (tab: LandscapeTab) => void
}

export function CrossTabSearchHint({ searchText, currentTab, tabFrameworks, onSwitchTab }: Props) {
  const entries = useMemo<Array<[LandscapeTab, number]> | null>(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return null
    return (Object.entries(tabFrameworks) as Array<[LandscapeTab, typeof tabFrameworks.standards]>)
      .map(([tab, list]) => [tab, list.filter((fw) => matchFramework(fw, q)).length] as const)
      .map(([tab, count]) => [tab, count] as [LandscapeTab, number])
  }, [searchText, tabFrameworks])

  if (!entries) return null
  const currentCount = entries.find(([t]) => t === currentTab)?.[1] ?? 0
  if (currentCount > 0) return null

  const matchingOtherTabs = entries.filter(([t, count]) => t !== currentTab && count > 0)
  if (matchingOtherTabs.length === 0) return null

  // eslint-disable-next-line security/detect-object-injection
  const currentLabel = TAB_LABELS[currentTab]

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3"
      role="status"
    >
      <SearchX size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          No <span className="font-medium">{currentLabel}</span> match{' '}
          <span className="font-medium">&ldquo;{searchText}&rdquo;</span>. Try another tab:
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {matchingOtherTabs.map(([tab, count]) => (
            <Button
              key={tab}
              variant="outline"
              size="sm"
              onClick={() => onSwitchTab(tab)}
              className="text-xs h-auto py-1 px-2.5"
            >
              {count} in {/* eslint-disable-next-line security/detect-object-injection */}
              {TAB_LABELS[tab]}
              <ArrowRight size={12} className="ml-1.5" aria-hidden="true" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
