import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { impactsData } from '../../data/impactsData'
import { Activity, Shield, Truck, Landmark, Server, AlertTriangle } from 'lucide-react'
import { logEvent } from '../../utils/analytics'
import clsx from 'clsx'

const iconMap: Record<
  string,
  React.ComponentType<{ size?: number | string; className?: string }>
> = {
  Activity,
  Shield,
  Truck,
  Landmark,
  Server,
}

export const ImpactDashboard = () => {
  const [selectedRisk, setSelectedRisk] = useState<string>('All')

  const filteredImpacts = impactsData.filter((impact) => {
    if (selectedRisk === 'All') return true
    return impact.riskLevel === selectedRisk
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 text-gradient">Quantum Threat Impacts</h2>
        <p className="text-muted max-w-2xl mx-auto mb-8">
          Quantum computing poses distinct risks across various sectors. Understand the specific
          threats and risk levels for each industry.
        </p>

        {/* Risk Level Filter */}
        <div className="flex justify-center gap-2">
          {['All', 'Critical', 'High'].map((risk) => (
            <button
              key={risk}
              onClick={() => {
                setSelectedRisk(risk)
                logEvent('Impacts', 'Filter Risk Level', risk)
              }}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border',
                selectedRisk === risk
                  ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                  : 'bg-white/5 text-muted hover:text-white border-white/10 hover:border-white/20'
              )}
            >
              {risk === 'All' ? 'All Risks' : `${risk} Risk`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredImpacts.map((impact) => {
            const Icon = iconMap[impact.iconName] || Shield

            return (
              <motion.article
                key={impact.industry}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="glass-panel p-6 hover:border-primary/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className="p-3 rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors text-primary"
                    aria-hidden="true"
                  >
                    <Icon size={24} />
                  </div>
                  <span
                    className={clsx(
                      'px-3 py-1 rounded-full text-xs font-bold border',
                      impact.riskLevel === 'Critical'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    )}
                    role="status"
                    aria-label={`${impact.riskLevel} risk level`}
                  >
                    {impact.riskLevel} Risk
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-2">{impact.industry}</h3>
                <p className="text-muted text-sm mb-6 min-h-[60px]">{impact.description}</p>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted/50">
                    Key Threats
                  </h4>
                  <ul className="space-y-2">
                    {impact.threats.map((threat, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted">
                        <AlertTriangle
                          size={14}
                          className="mt-0.5 text-primary shrink-0"
                          aria-hidden="true"
                        />
                        <span>{threat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
