import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { ShieldAlert, AlertTriangle, CheckCircle, FlaskConical, BookOpen } from 'lucide-react'
import type { AssessmentResult } from '../../../hooks/assessmentTypes'
import { CollapsibleSection } from '../ReportContent'
import { AskAssistantButton } from '../../ui/AskAssistantButton'

const getLearnLink = (replacement: string): { path: string; label: string } | null => {
  const ALGO_LEARN_LINKS: Record<string, { path: string; label: string }> = {
    'ML-KEM': { path: '/learn/pki-workshop', label: 'PKI Workshop' },
    'ML-DSA': { path: '/learn/pki-workshop', label: 'PKI Workshop' },
    'SLH-DSA': { path: '/learn/stateful-signatures', label: 'Signatures' },
    LMS: { path: '/learn/stateful-signatures', label: 'Signatures' },
    hybrid: { path: '/learn/hybrid-crypto', label: 'Hybrid Crypto' },
  }

  for (const [key, value] of Object.entries(ALGO_LEARN_LINKS)) {
    if (replacement.toLowerCase().includes(key.toLowerCase())) return value
  }
  return null
}

export const complexityConfig: Record<string, { color: string; bg: string; label: string }> = {
  low: { color: 'text-success', bg: 'bg-success/10', label: 'Low' },
  medium: { color: 'text-primary', bg: 'bg-primary/10', label: 'Medium' },
  high: { color: 'text-warning', bg: 'bg-warning/10', label: 'High' },
  critical: { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Critical' },
}

export const scopeConfig: Record<string, { color: string; bg: string; label: string }> = {
  'quick-win': { color: 'text-success', bg: 'bg-success/10', label: 'Quick Win' },
  moderate: { color: 'text-primary', bg: 'bg-primary/10', label: 'Moderate' },
  'major-project': { color: 'text-warning', bg: 'bg-warning/10', label: 'Major Project' },
  'multi-year': { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Multi-Year' },
}

export const AlgorithmMigrationSection = ({
  result,
  industry,
  defaultOpen = true,
}: {
  result: AssessmentResult
  industry?: string
  defaultOpen?: boolean
}) => {
  if (result.algorithmMigrations.length === 0) return null

  return (
    <CollapsibleSection
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
              <th className="py-2 pr-3 text-muted-foreground font-medium">Current</th>
              <th className="py-2 pr-3 text-muted-foreground font-medium">Vulnerable?</th>
              <th className="py-2 pr-3 text-muted-foreground font-medium">PQC Replacement</th>
              {result.migrationEffort && (
                <>
                  <th className="py-2 pr-3 text-muted-foreground font-medium">Effort</th>
                  <th className="py-2 pr-3 text-muted-foreground font-medium">Scope</th>
                </>
              )}
              <th className="py-2 text-muted-foreground font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {result.algorithmMigrations.map((algo) => {
              const effort = result.migrationEffort?.find((e) => e.algorithm === algo.classical)
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
                  {result.migrationEffort && (
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
              result.algorithmMigrations.filter((a) => a.quantumVulnerable).length > 0
                ? `?highlight=${encodeURIComponent(
                    result.algorithmMigrations
                      .filter((a) => a.quantumVulnerable)
                      .map((a) => a.classical)
                      .join(',')
                  )}`
                : ''
            }`}
            className="text-xs text-primary hover:underline flex items-center gap-1.5"
          >
            Explore vulnerability profiles in Algorithms DB
          </Link>
        </div>
      </div>
    </CollapsibleSection>
  )
}
