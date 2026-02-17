import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { AssessWizard } from './AssessWizard'
import { AssessReport } from './AssessReport'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { useAssessmentEngine } from '../../hooks/useAssessmentEngine'

export const AssessView: React.FC = () => {
  const { isComplete, getInput, markComplete } = useAssessmentStore()
  const input = getInput()
  const result = useAssessmentEngine(isComplete ? input : null)

  return (
    <div className="container mx-auto p-4 animate-fade-in">
      {!isComplete ? (
        <>
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
            <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-3">
              PQC Risk Assessment
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Answer 5 quick questions to get a personalized quantum risk score, migration
              priorities, and actionable recommendations for your organization.
            </p>
          </motion.div>
          <AssessWizard onComplete={markComplete} />
        </>
      ) : result ? (
        <AssessReport result={result} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Unable to generate report. Please complete all required fields.</p>
        </div>
      )}
    </div>
  )
}

export default AssessView
