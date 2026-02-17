import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Shield,
  ShieldCheck,
  Wrench,
  Printer,
  Link2,
  ArrowRight,
  BarChart3,
  Activity,
} from 'lucide-react'
import { useExecutiveData } from '../../hooks/useExecutiveData'
import { useComplianceRefresh } from '../Compliance/services'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import clsx from 'clsx'

const RISK_LEVEL_STYLES: Record<string, string> = {
  critical: 'text-destructive bg-destructive/10 border-destructive/20',
  high: 'text-warning bg-warning/10 border-warning/20',
  medium: 'text-status-info bg-status-info',
  low: 'text-success bg-success/10 border-success/20',
}

// KPI Card Component
const KPICard = ({
  icon: Icon,
  label,
  value,
  total,
  color,
  link,
  delay,
}: {
  icon: React.ElementType
  label: string
  value: number
  total?: number
  color: 'red' | 'amber' | 'green' | 'blue'
  link: string
  delay: number
}) => {
  const colorMap = {
    red: 'text-destructive bg-destructive/10 border-destructive/20',
    amber: 'text-warning bg-warning/10 border-warning/20',
    green: 'text-success bg-success/10 border-success/20',
    blue: 'text-status-info bg-status-info',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Link
        to={link}
        className="glass-panel p-5 flex flex-col items-center text-center hover:border-primary/30 transition-colors block"
      >
        <div className={clsx('p-3 rounded-full mb-3 border', colorMap[color])}>
          <Icon size={24} />
        </div>
        <div className="text-3xl font-bold text-foreground mb-1">
          {value}
          {total !== undefined && (
            <span className="text-lg text-muted-foreground font-normal">/{total}</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      </Link>
    </motion.div>
  )
}

export const ExecutiveView: React.FC = () => {
  const { data: complianceData } = useComplianceRefresh()
  const lastResult = useAssessmentStore((s) => s.lastResult)
  const metrics = useExecutiveData(complianceData, lastResult)

  const handlePrint = () => window.print()

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div className="container mx-auto p-4 animate-fade-in max-w-5xl print:max-w-none">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 print:mb-4"
      >
        <div className="inline-flex items-center gap-3 mb-4 print:hidden">
          <div className="p-3 rounded-full bg-primary/10">
            <BarChart3 className="text-primary" size={28} />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2 print:text-black print:text-2xl">
          PQC Readiness Summary
        </h1>
        <p className="text-muted-foreground print:text-gray-600">
          Executive overview of your organization&apos;s post-quantum cryptography readiness
        </p>
        <p className="text-xs text-muted-foreground mt-1 print:text-gray-500">
          Generated{' '}
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </motion.div>

      {/* Org Risk Score — shown when assessment is completed */}
      {metrics.orgRiskScore !== null && metrics.orgRiskLevel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel p-6 mb-8 print:border print:border-gray-300 print:mb-4"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className={clsx('p-3 rounded-full border', RISK_LEVEL_STYLES[metrics.orgRiskLevel])}
              >
                <Activity size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Your Organization</h2>
                <p className="text-sm text-muted-foreground">
                  Based on your PQC Readiness Assessment
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{metrics.orgRiskScore}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Risk Score
                </div>
              </div>
              <div
                className={clsx(
                  'px-3 py-1 rounded-full text-sm font-medium border capitalize',
                  RISK_LEVEL_STYLES[metrics.orgRiskLevel]
                )}
              >
                {metrics.orgRiskLevel}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Assessment CTA — shown when no assessment exists */}
      {metrics.orgRiskScore === null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel p-6 mb-8 border-l-4 border-l-primary print:hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10 self-start sm:self-auto shrink-0">
              <Activity className="text-primary" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-foreground mb-1">No assessment on file</h2>
              <p className="text-sm text-muted-foreground">
                The data below reflects industry-wide baselines. Complete the 5-minute PQC Readiness
                Assessment to replace these with metrics specific to your organization.
              </p>
            </div>
            <Link
              to="/assess"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors shrink-0"
            >
              Start Assessment
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:gap-2 print:mb-4">
        <KPICard
          icon={AlertTriangle}
          label="Critical Threats"
          value={metrics.criticalThreats}
          total={metrics.totalThreats}
          color="red"
          link="/threats"
          delay={0.1}
        />
        <KPICard
          icon={Shield}
          label="Algorithms at Risk"
          value={metrics.algorithmsAtRisk}
          total={metrics.totalAlgorithms}
          color="amber"
          link="/algorithms"
          delay={0.15}
        />
        <KPICard
          icon={Wrench}
          label="Migration Tools"
          value={metrics.migrationToolsAvailable}
          color="green"
          link="/migrate"
          delay={0.2}
        />
        <KPICard
          icon={ShieldCheck}
          label="Active Standards"
          value={metrics.activeStandards}
          color="blue"
          link="/compliance"
          delay={0.25}
        />
      </div>

      {/* Risk Narrative */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-6 mb-8 border-l-4 border-l-warning print:border print:border-gray-300 print:mb-4"
      >
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="text-warning" size={20} />
          Risk Summary
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed print:text-gray-600">
          {metrics.riskNarrative}
        </p>
      </motion.div>

      {/* Priority Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel p-6 mb-8 print:border print:border-gray-300 print:mb-4"
      >
        <h2 className="text-lg font-bold text-foreground mb-4">
          {lastResult ? 'Recommended Actions' : 'Top Priority Actions'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-3 text-muted-foreground font-medium w-12">#</th>
                <th className="py-2 pr-3 text-muted-foreground font-medium">Action</th>
                <th className="py-2 pr-3 text-muted-foreground font-medium hidden md:table-cell">
                  Affected Systems
                </th>
                <th className="py-2 pr-3 text-muted-foreground font-medium">Deadline</th>
                <th className="py-2 text-muted-foreground font-medium print:hidden">Link</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topActions.map((action) => (
                <tr key={action.priority} className="border-b border-border/50">
                  <td className="py-3 pr-3">
                    <span
                      className={clsx(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        action.priority <= 2
                          ? 'bg-destructive/10 text-destructive'
                          : action.priority <= 4
                            ? 'bg-warning/10 text-warning'
                            : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {action.priority}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-foreground font-medium">{action.action}</td>
                  <td className="py-3 pr-3 text-muted-foreground hidden md:table-cell">
                    {action.affectedSystems}
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">{action.deadline}</td>
                  <td className="py-3 print:hidden">
                    <Link
                      to={action.link}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Export Bar */}
      <div className="flex items-center justify-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <Printer size={16} />
          Download PDF
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <Link2 size={16} />
          Copy Link
        </button>
      </div>
    </div>
  )
}

export default ExecutiveView
