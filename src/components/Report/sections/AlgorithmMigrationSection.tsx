// SPDX-License-Identifier: GPL-3.0-only
// /report's "Algorithm Migration Priority" section (REPORT_SECTION_ORDER:
// 'algorithmMigration'). Extracted from ReportContent.tsx — see
// reportSectionToCswp39.ts.
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  FlaskConical,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import clsx from 'clsx'
import type { AlgorithmMigration, MigrationEffortItem } from '../../../hooks/assessmentTypes'
import { AskAssistantButton } from '../../ui/AskAssistantButton'
import {
  CollapsibleSection,
  complexityConfig,
  scopeConfig,
  getLearnLink,
} from './reportContentShared'

export const AlgorithmMigrationSection = ({
  algorithmMigrations,
  migrationEffort,
  industry,
  defaultOpen,
}: {
  algorithmMigrations: AlgorithmMigration[]
  migrationEffort?: MigrationEffortItem[]
  industry: string
  defaultOpen: boolean
}) => (
  <CollapsibleSection
    id="report-section-algorithmMigration"
    title="Algorithm Migration Priority"
    icon={<ShieldAlert className="text-primary" size={20} />}
    defaultOpen={defaultOpen}
    className="print:break-inside-auto"
    infoTip="algorithmMigration"
    headerExtra={
      <AskAssistantButton
        question={`What are the recommended PQC algorithm migrations for ${industry}?`}
        className="print:hidden"
      />
    }
  >
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th scope="col" className="py-2 pr-3 text-muted-foreground font-medium">
              Current
            </th>
            <th scope="col" className="py-2 pr-3 text-muted-foreground font-medium">
              Vulnerable?
            </th>
            <th scope="col" className="py-2 pr-3 text-muted-foreground font-medium">
              PQC Replacement
            </th>
            {migrationEffort && (
              <>
                <th scope="col" className="py-2 pr-3 text-muted-foreground font-medium">
                  Effort
                </th>
                <th scope="col" className="py-2 pr-3 text-muted-foreground font-medium">
                  Scope
                </th>
              </>
            )}
            <th scope="col" className="py-2 text-muted-foreground font-medium">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {algorithmMigrations.map((algo) => {
            const effort = migrationEffort?.find((e) => e.algorithm === algo.classical)
            return (
              <tr key={algo.classical} className="border-b border-border/50">
                <td className="py-2.5 pr-3 font-medium text-foreground">{algo.classical}</td>
                <td className="py-2.5 pr-3">
                  {algo.quantumVulnerable ? (
                    <span className="flex items-center gap-1 text-destructive">
                      <AlertTriangle size={14} /> Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle size={14} /> No
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-primary">
                  <div className="flex items-center gap-2">
                    <span>{algo.replacement}</span>
                    {algo.quantumVulnerable && !algo.replacement.includes('No change') && (
                      <>
                        <Link
                          to="/playground"
                          className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors whitespace-nowrap print:hidden"
                          title="Try in Playground"
                        >
                          <FlaskConical size={10} />
                          <span className="hidden lg:inline">Try</span>
                        </Link>
                        {(() => {
                          const learnLink = getLearnLink(algo.replacement)
                          if (!learnLink) return null
                          return (
                            <Link
                              to={learnLink.path}
                              className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors whitespace-nowrap print:hidden"
                              title={`Learn about ${learnLink.label}`}
                            >
                              <BookOpen size={10} />
                              <span className="hidden lg:inline">{learnLink.label}</span>
                            </Link>
                          )
                        })()}
                      </>
                    )}
                  </div>
                </td>
                {migrationEffort && (
                  <>
                    <td className="py-2.5 pr-3">
                      {effort ? (
                        <span
                          className={clsx(
                            'text-xs font-bold px-2 py-0.5 rounded-full',

                            complexityConfig[effort.complexity]?.bg ?? 'bg-muted',

                            complexityConfig[effort.complexity]?.color ?? 'text-muted-foreground'
                          )}
                        >
                          {effort.complexity}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      {effort ? (
                        <span
                          className={clsx(
                            'text-xs font-bold px-2 py-0.5 rounded-full',

                            scopeConfig[effort.estimatedScope]?.bg ?? 'bg-muted',

                            scopeConfig[effort.estimatedScope]?.color ?? 'text-muted-foreground'
                          )}
                        >
                          {scopeConfig[effort.estimatedScope]?.label ?? effort.estimatedScope}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </>
                )}
                <td className="py-2.5 text-muted-foreground text-xs">{algo.notes}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="flex items-center gap-4 mt-3 print:hidden">
        <Link
          to={`/algorithms${
            algorithmMigrations.filter((a) => a.quantumVulnerable).map((a) => a.classical).length >
            0
              ? `?highlight=${encodeURIComponent(
                  algorithmMigrations
                    .filter((a) => a.quantumVulnerable)
                    .map((a) => a.classical)
                    .join(',')
                )}`
              : ''
          }`}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ArrowRight size={12} />
          Compare algorithms
        </Link>
      </div>
    </div>
  </CollapsibleSection>
)
