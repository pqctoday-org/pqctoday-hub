// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, RotateCcw, PlayCircle, Zap, ClipboardList, FileBarChart } from 'lucide-react'
import { AssessWizard } from './AssessWizard'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import type { AssessmentMode } from '../../store/useAssessmentStore'
import { metadata } from '../../data/industryAssessConfig'
import { usePersonaStore } from '../../store/usePersonaStore'
import { REGION_COUNTRIES_MAP, PERSONA_RECOMMENDED_MODE } from '../../data/personaConfig'
import { Button } from '../ui/button'
import { ShareButton } from '../ui/ShareButton'
import { GlossaryButton } from '../ui/GlossaryButton'

const STEP_LABELS = [
  'Industry',
  'Country',
  'Crypto',
  'Sensitivity',
  'Compliance',
  'Migration',
  'Use Cases',
  'Retention',
  'Credential',
  'Scale',
  'Agility',
  'Infra',
  'Timeline',
]

const ModeSelector: React.FC<{
  onSelect: (mode: AssessmentMode) => void
  recommendedMode: AssessmentMode | null
}> = ({ onSelect, recommendedMode }) => (
  <div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Button
        variant="ghost"
        onClick={() => onSelect('quick')}
        className="glass-panel h-auto p-6 flex-col items-start whitespace-normal hover:bg-transparent hover:border-primary/40 group"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-warning/10 group-hover:bg-warning/20 transition-colors">
            <Zap className="text-warning" size={20} />
          </div>
          <h3 className="text-lg font-bold text-foreground">Quick</h3>
          {recommendedMode === 'quick' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
              Recommended for you
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          6 questions covering your industry, crypto stack, data sensitivity, and migration status.
        </p>
        <span className="text-xs font-mono text-muted-foreground/60">~2 minutes</span>
      </Button>

      <Button
        variant="ghost"
        onClick={() => onSelect('comprehensive')}
        className="glass-panel h-auto p-6 flex-col items-start whitespace-normal hover:bg-transparent hover:border-primary/40 group"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <ClipboardList className="text-primary" size={20} />
          </div>
          <h3 className="text-lg font-bold text-foreground">Comprehensive</h3>
          {recommendedMode === 'comprehensive' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
              Recommended for you
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          13 questions including infrastructure, team capacity, crypto agility, and vendor
          dependencies for detailed migration planning.
        </p>
        <span className="text-xs font-mono text-muted-foreground/60">~5 minutes</span>
      </Button>
    </div>
  </div>
)

export const AssessView: React.FC = () => {
  const navigate = useNavigate()
  const {
    assessmentStatus,
    markComplete,
    reset,
    currentStep,
    lastWizardUpdate,
    assessmentMode,
    setAssessmentMode,
  } = useAssessmentStore()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const recommendedMode = selectedPersona ? PERSONA_RECOMMENDED_MODE[selectedPersona] : null
  const seededRef = useRef(false)
  const [showResumeBanner, setShowResumeBanner] = useState(false)

  const handleModeSelect = (mode: AssessmentMode) => {
    setAssessmentMode(mode)
  }

  const handleComplete = () => {
    markComplete()
    navigate('/report')
  }

  // If assessment is already complete and no wizard interaction, redirect to report
  useEffect(() => {
    if (assessmentStatus === 'complete' && currentStep === 0) {
      navigate('/report', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check for saved incomplete assessment on mount
  useEffect(() => {
    if (assessmentStatus === 'complete') return
    const state = useAssessmentStore.getState()
    if (state.currentStep > 0 && state.industry && state.lastWizardUpdate) {
      setShowResumeBanner(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Seed industry and country from persona store when starting fresh
  useEffect(() => {
    if (seededRef.current || assessmentStatus === 'complete') return
    const store = useAssessmentStore.getState()
    if (store.industry) return
    seededRef.current = true

    const { selectedIndustry, selectedRegion } = usePersonaStore.getState()
    if (selectedIndustry) store.setIndustry(selectedIndustry)
    if (selectedRegion && selectedRegion !== 'global') {
      const country = REGION_COUNTRIES_MAP[selectedRegion]?.[0]
      if (country) store.setCountry(country)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <ShieldCheck className="text-primary" size={28} />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-3">PQC Risk Assessment</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Answer a few questions to get a personalized quantum risk score, migration priorities, and
          actionable recommendations for your organization.
        </p>
        {metadata && (
          <div className="hidden lg:flex items-center justify-center gap-3 text-[10px] md:text-xs text-muted-foreground/60 font-mono mt-3">
            <p>
              Data Source: {metadata.filename} • Updated: {metadata.lastUpdate.toLocaleDateString()}
            </p>
            <ShareButton
              title="PQC Risk Assessment — Post-Quantum Cryptography Migration Tool"
              text="Get a personalized quantum risk score, migration priorities, and actionable recommendations for your organization."
            />
            <GlossaryButton />
          </div>
        )}
      </motion.div>

      {/* Banner: assessment already complete, link to report */}
      {assessmentStatus === 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="glass-panel p-4 border-l-4 border-l-success">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-foreground">
                Your assessment is complete. View your personalized report or update your answers
                below.
              </p>
              <Button
                size="sm"
                onClick={() => navigate('/report')}
                className="gap-1.5 text-xs font-semibold shrink-0"
              >
                <FileBarChart size={12} />
                View Report
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Banner: resume in-progress assessment */}
      {showResumeBanner && lastWizardUpdate && assessmentStatus !== 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="glass-panel p-4 border-l-4 border-l-primary">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Resume saved assessment?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {/* eslint-disable-next-line security/detect-object-injection */}
                  You left off at step {currentStep + 1} ({STEP_LABELS[currentStep] ?? ''}) on{' '}
                  {new Date(lastWizardUpdate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  .
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    reset()
                    setShowResumeBanner(false)
                  }}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                >
                  <RotateCcw size={12} />
                  Start Over
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowResumeBanner(false)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <PlayCircle size={12} />
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!assessmentMode ? (
        <ModeSelector onSelect={handleModeSelect} recommendedMode={recommendedMode} />
      ) : (
        <AssessWizard onComplete={handleComplete} mode={assessmentMode} />
      )}
    </div>
  )
}
