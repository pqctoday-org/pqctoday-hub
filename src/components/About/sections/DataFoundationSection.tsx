// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Database } from 'lucide-react'
import { buildDataFoundation, totalModuleMinutes } from '../aboutData'
import { timelineData } from '@/data/timelineData'
import { countSovereignCountries } from '@/data/timelineCountries'
import { libraryData } from '@/data/libraryData'
import { complianceFrameworks, complianceMetadata } from '@/data/complianceData'
import { softwareData } from '@/data/migrateData'
import { threatsData } from '@/data/threatsData'
import { leadersData } from '@/data/leadersData'
import { quizQuestions } from '@/data/quizDataLoader'
import { authoritativeSources } from '@/data/authoritativeSourcesData'
import { patentsData } from '@/data/patentsData'
import { loadPQCAlgorithmsData } from '@/data/pqcAlgorithmsData'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { vendors } from '@/data/vendorData'
import { vendorRoadmaps } from '@/data/vendorRoadmapData'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'
import { PROTOCOL_MATRIX } from '@/data/pqcProtocolMatrix'
import { glossaryTerms } from '@/data/glossaryData'

// Excludes the synthetic 'quiz' entry — matches the count Landing already shows.
const MODULE_COUNT = Object.keys(MODULE_CATALOG).filter((k) => k !== 'quiz').length
const TIMELINE_EVENT_COUNT = timelineData.flatMap((c) => c.bodies.flatMap((b) => b.events)).length
// Sovereign countries only: blocs, bodies and territories are left out (see timelineCountries.ts).
const TIMELINE_COUNTRY_COUNT = countSovereignCountries(timelineData)
const TIMELINE_ORG_COUNT = new Set(
  timelineData.flatMap((c) => c.bodies.flatMap((b) => b.events.map((e) => e.orgName)))
).size
const THREAT_SECTOR_COUNT = new Set(threatsData.map((t) => t.industry)).size
// A product can sit on several layers ("Hardware,Security Stack"); count each layer once.
const MIGRATE_LAYER_COUNT = new Set(
  softwareData.flatMap((p) =>
    p.infrastructureLayer
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean)
  )
).size
const MODULE_MINUTES = totalModuleMinutes(
  Object.entries(MODULE_CATALOG)
    .filter(([k]) => k !== 'quiz')
    .map(([, m]) => m.duration)
)
const LANDSCAPE_USE_CASE_COUNT = loadIndustryLandscape().useCases.length

function formatLastUpdate(date: Date | null | undefined): string | null {
  if (!date) return null
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function DataFoundationSection() {
  // Algorithm reference data loads async (CSV fetched at runtime); every
  // other dataset below is a synchronous top-level export already resolved
  // at module load, same as the rest of this app's data layer.
  const [algorithmCount, setAlgorithmCount] = useState<number | null>(null)

  useEffect(() => {
    loadPQCAlgorithmsData().then((data) => setAlgorithmCount(data.length))
  }, [])

  const dataFoundation = buildDataFoundation(
    {
      timeline: TIMELINE_EVENT_COUNT,
      library: libraryData.length,
      algorithms: algorithmCount !== null ? algorithmCount : '…',
      compliance: complianceFrameworks.length,
      migrate: softwareData.length,
      threats: threatsData.length,
      leaders: leadersData.length,
      quiz: quizQuestions.length,
      sources: authoritativeSources.length,
      modules: MODULE_COUNT,
      patents: patentsData.length,
      vendors: vendors.length,
      roadmaps: vendorRoadmaps.length,
      landscape: LANDSCAPE_USE_CASE_COUNT,
      protocols: PROTOCOL_MATRIX.length,
      glossary: glossaryTerms.length,
    },
    {
      timeline: `${TIMELINE_ORG_COUNT} orgs, ${TIMELINE_COUNTRY_COUNT} countries`,
      threats: `${THREAT_SECTOR_COUNT} industry sectors`,
      migrate: `${MIGRATE_LAYER_COUNT} infrastructure layers`,
      ...(MODULE_MINUTES > 0
        ? { modules: `${MODULE_MINUTES.toLocaleString()}+ min of content` }
        : {}),
    }
  )

  const totalRecords = dataFoundation.reduce(
    (sum, row) => sum + (typeof row.records === 'number' ? row.records : 0),
    0
  )

  const complianceLastUpdate = formatLastUpdate(complianceMetadata?.lastUpdate ?? null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass-panel p-4 md:p-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <Database className="text-primary shrink-0" size={24} />
        <div>
          <h2 className="text-xl font-semibold">Platform Data</h2>
          <p className="text-xs text-muted-foreground">Curated datasets powering every page</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
        {dataFoundation.map(({ dataset, records, sources }) => (
          <div
            key={dataset}
            className="p-3 rounded-lg border border-border bg-muted/30 text-center"
          >
            <div className="text-lg font-bold text-gradient">{records}</div>
            <div className="text-xs font-medium text-foreground mt-1">{dataset}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{sources}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gradient">
            {totalRecords > 0 ? `${totalRecords.toLocaleString()}+` : '5,000+'}
          </span>
          <span className="text-sm text-muted-foreground">total curated records</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {complianceLastUpdate
            ? `Compliance data last updated ${complianceLastUpdate}`
            : 'Compliance data freshness unavailable'}
        </span>
      </div>
    </motion.div>
  )
}
