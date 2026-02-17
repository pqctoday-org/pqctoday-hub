import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Printer,
  Share2,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import type { AssessmentResult } from '../../hooks/useAssessmentEngine'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import clsx from 'clsx'

const riskConfig = {
  low: {
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500',
    label: 'Low Risk',
    emoji: '🟢',
  },
  medium: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500',
    label: 'Medium Risk',
    emoji: '🟡',
  },
  high: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500',
    label: 'High Risk',
    emoji: '🔴',
  },
  critical: {
    color: 'text-red-300',
    bg: 'bg-red-500/20',
    border: 'border-red-500',
    label: 'Critical Risk',
    emoji: '⚫',
  },
}

const RiskGauge = ({ score, level }: { score: number; level: AssessmentResult['riskLevel'] }) => {
  // eslint-disable-next-line security/detect-object-injection
  const config = riskConfig[level]
  const angle = (score / 100) * 180 - 90 // -90 to 90 degrees

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-48 h-28">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-border"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className={config.color}
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 251.2} 251.2`}
        />
        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2={100 + 60 * Math.cos((angle * Math.PI) / 180)}
          y2={100 - 60 * Math.sin((angle * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="3"
          className="text-foreground"
          strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="5" fill="currentColor" className="text-foreground" />
        {/* Score text */}
        <text
          x="100"
          y="90"
          textAnchor="middle"
          className={config.color}
          fill="currentColor"
          fontSize="28"
          fontWeight="bold"
        >
          {score}
        </text>
      </svg>
      <div className={clsx('text-lg font-bold mt-1', config.color)}>
        {config.emoji} {config.label}
      </div>
    </div>
  )
}

interface AssessReportProps {
  result: AssessmentResult
}

export const AssessReport: React.FC<AssessReportProps> = ({ result }) => {
  const { reset } = useAssessmentStore()

  const config = riskConfig[result.riskLevel]

  const handlePrint = () => window.print()

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PQC Risk Assessment Report',
          text: `Quantum Risk Score: ${result.riskScore}/100 — ${result.narrative}`,
          url,
        })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 print:space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gradient mb-2 print:text-black">
          Your PQC Risk Assessment Report
        </h2>
        <p className="text-sm text-muted-foreground print:text-gray-600">
          Generated on{' '}
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </motion.div>

      {/* Risk Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={clsx(
          'glass-panel p-6 border-l-4',
          config.border,
          'print:border print:border-gray-300'
        )}
      >
        <RiskGauge score={result.riskScore} level={result.riskLevel} />
        <p className="text-sm text-muted-foreground text-center mt-4 leading-relaxed print:text-gray-600">
          {result.narrative}
        </p>
      </motion.div>

      {/* Algorithm Migration Matrix */}
      {result.algorithmMigrations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 print:border print:border-gray-300"
        >
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <ShieldAlert className="text-primary" size={20} />
            Algorithm Migration Priority
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 text-muted-foreground font-medium">Current</th>
                  <th className="py-2 pr-3 text-muted-foreground font-medium">Vulnerable?</th>
                  <th className="py-2 pr-3 text-muted-foreground font-medium">PQC Replacement</th>
                  <th className="py-2 text-muted-foreground font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {result.algorithmMigrations.map((algo) => (
                  <tr key={algo.classical} className="border-b border-border/50">
                    <td className="py-2.5 pr-3 font-medium text-foreground">{algo.classical}</td>
                    <td className="py-2.5 pr-3">
                      {algo.quantumVulnerable ? (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertTriangle size={14} /> Yes
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle size={14} /> No
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-primary">{algo.replacement}</td>
                    <td className="py-2.5 text-muted-foreground text-xs">{algo.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Compliance Impact */}
      {result.complianceImpacts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-6 print:border print:border-gray-300"
        >
          <h3 className="text-lg font-bold text-foreground mb-4">Compliance Impact</h3>
          <div className="space-y-3">
            {result.complianceImpacts.map((c) => (
              <div
                key={c.framework}
                className={clsx(
                  'p-3 rounded-lg border text-sm',
                  c.requiresPQC ? 'border-amber-500/30 bg-amber-500/5' : 'border-border'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-foreground">{c.framework}</span>
                  <span
                    className={clsx(
                      'text-xs font-bold px-2 py-0.5 rounded-full',
                      c.requiresPQC
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {c.requiresPQC ? 'PQC Required' : 'No PQC mandate yet'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Deadline:</strong> {c.deadline}
                </p>
                <p className="text-xs text-muted-foreground">{c.notes}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommended Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel p-6 print:border print:border-gray-300"
      >
        <h3 className="text-lg font-bold text-foreground mb-4">Recommended Actions</h3>
        <div className="space-y-3">
          {result.recommendedActions.map((action) => (
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
                      ? 'border-amber-500 text-amber-400'
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
                          ? 'text-amber-400'
                          : 'text-muted-foreground'
                    )}
                  >
                    {action.category}
                  </span>
                  <Link
                    to={action.relatedModule}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ArrowRight size={10} />
                    Explore
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Actions Bar */}
      <div className="flex items-center justify-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <Printer size={16} />
          Download PDF
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <Share2 size={16} />
          Share
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <RotateCcw size={16} />
          Start Over
        </button>
      </div>
    </div>
  )
}
