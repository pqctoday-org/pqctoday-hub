// SPDX-License-Identifier: GPL-3.0-only
// /report's "Recommended Actions" section (REPORT_SECTION_ORDER:
// 'recommendedActions'). Extracted from ReportContent.tsx — see
// reportSectionToCswp39.ts.
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import type { RecommendedAction } from '../../../hooks/assessmentTypes'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { formatDriver } from '../../../data/driverLabels'
import { AskAssistantButton } from '../../ui/AskAssistantButton'
import { CollapsibleSection, effortConfig } from './reportContentShared'

export const RecommendedActionsSection = ({
  recommendedActions,
  maxItems,
  industry,
  relevantSoftware,
  isPathVisible,
  defaultOpen,
}: {
  recommendedActions: RecommendedAction[]
  maxItems?: number
  industry: string
  relevantSoftware: SoftwareItem[]
  isPathVisible: (path: string) => boolean
  defaultOpen: boolean
}) => (
  <CollapsibleSection
    id="report-section-recommendedActions"
    title={`Recommended Actions${maxItems ? ` (Top ${maxItems})` : ''}`}
    icon={<ArrowRight className="text-primary" size={20} />}
    defaultOpen={defaultOpen}
    className="print:break-inside-auto"
    infoTip="recommendedActions"
    headerExtra={
      <AskAssistantButton
        question={`What should I prioritize for PQC migration in ${industry}?`}
        className="print:hidden"
      />
    }
  >
    <div className="space-y-3">
      {recommendedActions.slice(0, maxItems).map((action) => (
        <div
          key={action.priority}
          className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
        >
          <div
            className={clsx(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2',
              action.category === 'immediate'
                ? 'border-destructive text-destructive'
                : action.category === 'short-term'
                  ? 'border-warning text-warning'
                  : 'border-border text-muted-foreground'
            )}
          >
            {action.priority}
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground">{action.action}</p>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={clsx(
                  'text-[10px] font-bold uppercase',
                  action.category === 'immediate'
                    ? 'text-destructive'
                    : action.category === 'short-term'
                      ? 'text-warning'
                      : 'text-muted-foreground'
                )}
              >
                {action.category}
              </span>
              {action.effort && (
                <span
                  className={clsx(
                    'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',

                    effortConfig[action.effort]?.bg ?? 'bg-muted',

                    effortConfig[action.effort]?.color ?? 'text-muted-foreground'
                  )}
                >
                  {effortConfig[action.effort]?.label ?? action.effort} effort
                </span>
              )}
              {isPathVisible(action.relatedModule) && (
                <Link
                  to={
                    action.relatedModule.startsWith('/migrate') && industry
                      ? `${action.relatedModule}${action.relatedModule.includes('?') ? '&' : '?'}industry=${encodeURIComponent(industry)}`
                      : action.relatedModule
                  }
                  className="text-xs text-primary hover:underline flex items-center gap-1 print:hidden"
                >
                  <ArrowRight size={10} />
                  Explore
                </Link>
              )}
            </div>
            {action.relatedModule.startsWith('/migrate') && relevantSoftware.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5 print:hidden">
                <span className="text-[10px] text-muted-foreground">Tools:</span>
                {relevantSoftware.slice(0, 2).map((sw) => (
                  <Link
                    to={`/migrate?industry=${encodeURIComponent(industry)}`}
                    key={sw.softwareName}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                  >
                    {sw.softwareName}
                  </Link>
                ))}
              </div>
            )}
            {action.drivers && action.drivers.length > 0 && (
              <div
                className="mt-1.5 text-[10px] text-muted-foreground leading-relaxed"
                title={`Based on your answers: ${action.drivers.map(formatDriver).join('; ')}`}
              >
                <span className="font-semibold">Based on your answers: </span>
                {action.drivers.map(formatDriver).join('; ')}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </CollapsibleSection>
)
