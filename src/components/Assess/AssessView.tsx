import React, { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { AssessWizard } from './AssessWizard'
import { AssessReport } from './AssessReport'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { useAssessmentEngine } from '../../hooks/useAssessmentEngine'
import type { AssessmentInput } from '../../hooks/useAssessmentEngine'

const VALID_SENSITIVITIES = new Set(['low', 'medium', 'high', 'critical'])
const VALID_MIGRATIONS = new Set(['started', 'planning', 'not-started', 'unknown'])
const VALID_RETENTION = new Set(['under-1y', '1-5y', '5-10y', '10-25y', '25-plus', 'indefinite'])
const VALID_SYSTEM_COUNT = new Set(['1-10', '11-50', '51-200', '200-plus'])
const VALID_TEAM_SIZE = new Set(['1-10', '11-50', '51-200', '200-plus'])
const VALID_AGILITY = new Set(['fully-abstracted', 'partially-abstracted', 'hardcoded', 'unknown'])
const VALID_VENDOR = new Set(['heavy-vendor', 'open-source', 'mixed', 'in-house'])
const VALID_PRESSURE = new Set([
  'within-1y',
  'within-2-3y',
  'internal-deadline',
  'no-deadline',
  'unknown',
])

export const AssessView: React.FC = () => {
  const { isComplete, getInput, markComplete, setResult } = useAssessmentStore()
  const input = getInput()
  const result = useAssessmentEngine(isComplete ? input : null)
  const persistedRef = useRef(false)
  const [searchParams] = useSearchParams()
  const hydratedRef = useRef(false)

  // Hydrate store from shared URL params on first mount
  useEffect(() => {
    if (hydratedRef.current || isComplete) return
    const industry = searchParams.get('i')
    if (!industry) return
    hydratedRef.current = true

    const store = useAssessmentStore.getState()
    store.setIndustry(industry)

    const countryParam = searchParams.get('cy')
    if (countryParam) {
      store.setCountry(decodeURIComponent(countryParam))
    }

    const crypto = searchParams.get('c')
    if (crypto) {
      crypto
        .split(',')
        .filter(Boolean)
        .forEach((a) => {
          if (!store.currentCrypto.includes(a)) store.toggleCrypto(a)
        })
    }

    // dataSensitivity is now multi-value (comma-separated)
    const sensitivity = searchParams.get('d')
    if (sensitivity) {
      sensitivity
        .split(',')
        .filter((s) => VALID_SENSITIVITIES.has(s))
        .forEach((s) => {
          if (!store.dataSensitivity.includes(s)) store.toggleDataSensitivity(s)
        })
    }

    const frameworks = searchParams.get('f')
    if (frameworks) {
      frameworks
        .split(',')
        .filter(Boolean)
        .forEach((f) => {
          if (!store.complianceRequirements.includes(f)) store.toggleCompliance(f)
        })
    }

    const migration = searchParams.get('m')
    if (migration && VALID_MIGRATIONS.has(migration)) {
      store.setMigrationStatus(migration as AssessmentInput['migrationStatus'])
    }

    // Extended params
    const useCases = searchParams.get('u')
    if (useCases) {
      useCases
        .split(',')
        .filter(Boolean)
        .forEach((uc) => {
          if (!store.cryptoUseCases.includes(uc)) store.toggleCryptoUseCase(uc)
        })
    }

    // dataRetention is now multi-value (comma-separated)
    const retention = searchParams.get('r')
    if (retention) {
      retention
        .split(',')
        .filter((v) => VALID_RETENTION.has(v))
        .forEach((v) => {
          if (!store.dataRetention.includes(v)) store.toggleDataRetention(v)
        })
    }

    const sysCount = searchParams.get('s')
    if (sysCount && VALID_SYSTEM_COUNT.has(sysCount)) {
      store.setSystemCount(sysCount as NonNullable<AssessmentInput['systemCount']>)
    }

    const tSize = searchParams.get('t')
    if (tSize && VALID_TEAM_SIZE.has(tSize)) {
      store.setTeamSize(tSize as NonNullable<AssessmentInput['teamSize']>)
    }

    const agility = searchParams.get('a')
    if (agility && VALID_AGILITY.has(agility)) {
      store.setCryptoAgility(agility as NonNullable<AssessmentInput['cryptoAgility']>)
    }

    const infra = searchParams.get('n')
    if (infra) {
      infra
        .split(',')
        .filter(Boolean)
        .forEach((item) => {
          if (!store.infrastructure.includes(item)) store.toggleInfrastructure(item)
        })
    }

    const vendor = searchParams.get('v')
    if (vendor && VALID_VENDOR.has(vendor)) {
      store.setVendorDependency(vendor as NonNullable<AssessmentInput['vendorDependency']>)
    }

    const pressure = searchParams.get('p')
    if (pressure && VALID_PRESSURE.has(pressure)) {
      store.setTimelinePressure(pressure as NonNullable<AssessmentInput['timelinePressure']>)
    }

    store.markComplete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isComplete) {
      persistedRef.current = false
      return
    }
    if (result && !persistedRef.current) {
      persistedRef.current = true
      setResult(result)
    }
  }, [isComplete, result, setResult])

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
              Answer a few questions to get a personalized quantum risk score, migration priorities,
              and actionable recommendations for your organization.
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
