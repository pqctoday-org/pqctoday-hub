// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Globe,
  Settings,
  Wallet,
  Shield,
  Radio,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  Lock,
  Cpu,
  Users,
  FileText,
  Landmark,
  Eye,
  Send,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react'
import {
  ARCHITECTURE_LAYERS,
  TRANSACTION_FLOW_STEPS,
  THREAT_LEVEL_CONFIG,
  MIGRATION_READINESS_CONFIG,
  type ArchitectureLayer,
  type ArchitectureSubComponent,
  type ThreatLevel,
} from '../data/custodyConstants'
import { Button } from '@/components/ui/button'

interface CustodyArchitectureFlowProps {
  onBack: () => void
}

const LAYER_ICONS: Record<string, LucideIcon> = {
  'client-interfaces': Globe,
  orchestration: Settings,
  'wallet-tiers': Wallet,
  'crypto-infrastructure': Shield,
  'network-broadcast': Radio,
}

const TX_STEP_ICONS: LucideIcon[] = [Send, Lock, FileText, Users, Wallet, Cpu, Radio]

function getWorstThreatLevel(layer: ArchitectureLayer): ThreatLevel {
  const priority: ThreatLevel[] = ['critical', 'high', 'medium', 'low']
  for (const level of priority) {
    if (layer.subComponents.some((sc) => sc.pqcThreat.threatLevel === level)) {
      return level
    }
  }
  return 'low'
}

const ThreatBadge: React.FC<{ level: ThreatLevel; size?: 'sm' | 'md' }> = ({
  level,
  size = 'sm',
}) => {
  const config = THREAT_LEVEL_CONFIG[level]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bgClass} ${config.colorClass} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      <AlertTriangle size={size === 'sm' ? 10 : 12} />
      {config.label}
    </span>
  )
}

const SubComponentCard: React.FC<{ component: ArchitectureSubComponent }> = ({ component }) => {
  const { pqcThreat } = component
  const readinessConfig = MIGRATION_READINESS_CONFIG[pqcThreat.migrationReadiness]

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-foreground text-sm">{component.name}</h4>
        <ThreatBadge level={pqcThreat.threatLevel} />
      </div>

      <p className="text-muted-foreground text-xs leading-relaxed">{component.description}</p>

      {/* Crypto primitives */}
      <div>
        <p className="text-xs font-medium text-foreground mb-1">Cryptographic Primitives</p>
        <div className="flex flex-wrap gap-1">
          {component.cryptoPrimitives.map((prim) => (
            <span
              key={prim}
              className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-muted text-muted-foreground"
            >
              {prim}
            </span>
          ))}
        </div>
      </div>

      {/* PQC Threat Analysis */}
      <div className="border-t border-border pt-3 space-y-2">
        <p className="text-xs font-medium text-foreground flex items-center gap-1">
          <Shield size={12} className="text-primary" />
          PQC Threat Analysis
        </p>

        {pqcThreat.vulnerableAlgorithms.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Vulnerable algorithms:</p>
            <div className="flex flex-wrap gap-1">
              {pqcThreat.vulnerableAlgorithms.map((algo) => (
                <span
                  key={algo}
                  className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-destructive/10 text-status-error"
                >
                  {algo}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed">{pqcThreat.quantumAttack}</p>

        {pqcThreat.pqcCountermeasures.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">PQC countermeasures:</p>
            <ul className="space-y-0.5">
              {pqcThreat.pqcCountermeasures.map((cm) => (
                <li key={cm} className="text-xs text-status-success flex items-start gap-1">
                  <ArrowRight size={10} className="mt-0.5 shrink-0" />
                  {cm}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Migration readiness:</span>
          <span className={`text-xs font-medium ${readinessConfig.colorClass}`}>
            {readinessConfig.label}
          </span>
        </div>
        {pqcThreat.migrationNotes && (
          <p className="text-xs text-muted-foreground italic">{pqcThreat.migrationNotes}</p>
        )}
      </div>
    </div>
  )
}

export const CustodyArchitectureFlow: React.FC<CustodyArchitectureFlowProps> = ({ onBack }) => {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null)
  const [exploredLayers, setExploredLayers] = useState<Set<string>>(new Set())
  const [txFlowStep, setTxFlowStep] = useState(0)
  const [hasViewedTxFlow, setHasViewedTxFlow] = useState(false)
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const toggleLayer = useCallback((layerId: string) => {
    setExpandedLayer((prev) => (prev === layerId ? null : layerId))
    setExploredLayers((prev) => {
      const next = new Set(prev)
      next.add(layerId)
      return next
    })
  }, [])

  // Scroll expanded layer into view
  useEffect(() => {
    if (expandedLayer && layerRefs.current[expandedLayer]) {
      // Small delay to let the DOM update
      const timeout = setTimeout(() => {
        layerRefs.current[expandedLayer]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [expandedLayer])

  const handleTxStepChange = useCallback((step: number) => {
    setTxFlowStep(step)
    setHasViewedTxFlow(true)
  }, [])

  const explorationProgress = exploredLayers.size / ARCHITECTURE_LAYERS.length
  const currentTxStep = TRANSACTION_FLOW_STEPS[txFlowStep]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6">
        <div className="flex items-start gap-3 mb-4">
          <Landmark size={24} className="text-accent mt-1 shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Corporate Custody Architecture</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Explore the five layers of an institutional digital asset custody platform. Click each
              layer to reveal its cryptographic primitives and quantum threat assessment. Then walk
              through a complete transaction flow to see how a withdrawal moves through the entire
              stack.
            </p>
          </div>
        </div>

        {/* Exploration progress */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Explored {exploredLayers.size}/{ARCHITECTURE_LAYERS.length} layers
          </span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${explorationProgress * 100}%` }}
            />
          </div>
          {hasViewedTxFlow && (
            <span className="text-xs text-status-success flex items-center gap-1">
              <CheckCircle size={12} />
              Flow viewed
            </span>
          )}
        </div>
      </div>

      {/* Architecture Stack */}
      <div className="space-y-2">
        {ARCHITECTURE_LAYERS.map((layer, idx) => {
          const Icon = LAYER_ICONS[layer.id] ?? Shield
          const worstThreat = getWorstThreatLevel(layer)
          const threatConfig = THREAT_LEVEL_CONFIG[worstThreat]
          const isExpanded = expandedLayer === layer.id
          const isExplored = exploredLayers.has(layer.id)
          const isHighlightedByTxFlow = currentTxStep?.activeLayerId === layer.id

          return (
            <div
              key={layer.id}
              ref={(el) => {
                layerRefs.current[layer.id] = el
              }}
            >
              {/* Connector line between layers */}
              {idx > 0 && (
                <div className="flex justify-center -my-1">
                  <div className="w-0.5 h-3 bg-border" />
                </div>
              )}

              <div
                className={`glass-panel overflow-hidden border-l-4 transition-all ${threatConfig.borderClass} ${
                  isHighlightedByTxFlow
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : ''
                }`}
              >
                {/* Layer header */}
                <Button
                  variant="ghost"
                  onClick={() => toggleLayer(layer.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isExplored
                          ? 'border-[hsl(var(--status-success))] bg-[hsl(var(--status-success)/0.1)] text-status-success'
                          : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground">{layer.name}</h3>
                        <span className="text-xs text-muted-foreground font-mono px-2 py-0.5 bg-muted rounded hidden sm:inline-block">
                          {layer.depthLabel}
                        </span>
                        <ThreatBadge level={worstThreat} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {layer.description}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 ml-2 text-muted-foreground">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </Button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <div className="border-t border-border pt-4 mb-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {layer.description}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {layer.subComponents.map((sc) => (
                        <SubComponentCard key={sc.id} component={sc} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Transaction Flow Walkthrough */}
      <div className="space-y-4">
        <div className="glass-panel p-4">
          <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
            <Eye size={20} className="text-primary" />
            Transaction Flow Walkthrough
          </h3>
          <p className="text-xs text-muted-foreground">
            Follow a withdrawal transaction through every layer of the custody platform. Each step
            highlights the active architecture layer above.
          </p>
        </div>

        {/* Step progress indicator (same pattern as PQCMigrationFlow) */}
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between">
            {TRANSACTION_FLOW_STEPS.map((step, idx) => {
              const StepIcon = TX_STEP_ICONS[idx] ?? Send
              return (
                <React.Fragment key={step.id}>
                  <Button
                    variant="ghost"
                    onClick={() => handleTxStepChange(idx)}
                    className={`flex flex-col items-center gap-1 group ${
                      idx === txFlowStep
                        ? 'text-primary'
                        : idx < txFlowStep
                          ? 'text-status-success'
                          : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                        idx === txFlowStep
                          ? 'border-primary bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                          : idx < txFlowStep
                            ? 'border-[hsl(var(--status-success))] bg-[hsl(var(--status-success)/0.1)]'
                            : 'border-border bg-background'
                      }`}
                    >
                      <StepIcon size={18} />
                    </div>
                    <span className="text-xs font-medium hidden sm:block text-center leading-tight max-w-[80px]">
                      Step {step.step}
                    </span>
                  </Button>
                  {idx < TRANSACTION_FLOW_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 ${idx < txFlowStep ? 'bg-[hsl(var(--status-success))]' : 'bg-border'}`}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Step content */}
        {currentTxStep && (
          <div className="glass-panel p-6 min-h-[250px] animate-fade-in">
            <div className="mb-4 border-b border-border pb-4">
              <h3 className="text-xl font-bold text-foreground">
                Step {currentTxStep.step}: {currentTxStep.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 bg-muted rounded">
                  Active layer:{' '}
                  {ARCHITECTURE_LAYERS.find((l) => l.id === currentTxStep.activeLayerId)?.name}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {currentTxStep.description}
            </p>

            {/* Crypto operations at this step */}
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                <Lock size={14} className="text-primary" />
                Cryptographic Operations
              </p>
              <div className="flex flex-wrap gap-1.5">
                {currentTxStep.cryptoOperations.map((op) => (
                  <span
                    key={op}
                    className="inline-block px-2.5 py-1 rounded text-xs font-mono bg-muted text-muted-foreground"
                  >
                    {op}
                  </span>
                ))}
              </div>
            </div>

            {/* PQC considerations */}
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                <Shield size={14} className="text-accent" />
                PQC Considerations
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentTxStep.pqcConsiderations}
              </p>
            </div>
          </div>
        )}

        {/* Transaction flow navigation */}
        <div className="flex justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => handleTxStepChange(Math.max(0, txFlowStep - 1))}
            disabled={txFlowStep === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Previous
          </Button>
          {txFlowStep < TRANSACTION_FLOW_STEPS.length - 1 ? (
            <Button
              variant="ghost"
              onClick={() =>
                handleTxStepChange(Math.min(TRANSACTION_FLOW_STEPS.length - 1, txFlowStep + 1))
              }
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Next Step
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-sm font-medium"
            >
              Complete
              <CheckCircle size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
