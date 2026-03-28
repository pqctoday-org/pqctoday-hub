// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlgorithmComparison } from './AlgorithmComparison'
import { AlgorithmDetailedComparison } from './AlgorithmDetailedComparison'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ArrowRight, BarChart3, Shield } from 'lucide-react'
import {
  loadPQCAlgorithmsData,
  loadedFileMetadata,
  type AlgorithmDetail,
} from '../../data/pqcAlgorithmsData'
import { loadAlgorithmsData, loadedTransitionMetadata } from '../../data/algorithmsData'
import { Skeleton } from '../ui/skeleton'
import { PageHeader } from '../common/PageHeader'
import { generateCsv, downloadCsv, csvFilename } from '../../utils/csvExport'
import { ALGORITHM_CSV_COLUMNS } from '../../utils/csvExportConfigs'
import { AlgorithmInfoModal } from './AlgorithmInfoModal'

export function AlgorithmsView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightAlgorithms = useMemo(() => {
    const raw = searchParams.get('highlight')
    if (!raw) return undefined
    return new Set(
      raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
  }, [searchParams])

  const [activeTab, setActiveTab] = useState<'transition' | 'detailed'>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'transition' || tab === 'detailed') return tab
    return searchParams.get('highlight') ? 'detailed' : 'transition'
  })

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'transition' || tab === 'detailed') {
      setActiveTab((prev) => (prev !== tab ? tab : prev))
    }
  }, [searchParams])

  const [metadata, setMetadata] = useState<{ filename: string; date: Date | null } | null>(null)
  const [transitionMetadata, setTransitionMetadata] = useState<{
    filename: string
    date: Date | null
  } | null>(null)
  const [algorithmData, setAlgorithmData] = useState<AlgorithmDetail[]>([])
  const [infoOpen, setInfoOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      loadPQCAlgorithmsData().then((data) => {
        setMetadata(loadedFileMetadata)
        setAlgorithmData(data)
      }),
      loadAlgorithmsData().then(() => {
        setTransitionMetadata(loadedTransitionMetadata)
      }),
    ]).finally(() => {
      setIsLoading(false)
    })
  }, [])

  const handleExportCsv = useCallback(() => {
    const csv = generateCsv(algorithmData, ALGORITHM_CSV_COLUMNS)
    downloadCsv(csv, csvFilename('pqc-algorithms'))
  }, [algorithmData])

  return (
    <div>
      <PageHeader
        icon={Shield}
        title="Post-Quantum Cryptography Algorithms"
        description="Migration from classical to post-quantum cryptographic algorithms"
        dataSource={
          `Data Sources: ${transitionMetadata?.filename ?? 'algorithms_transitions.csv'}, ` +
          `${metadata?.filename ?? 'pqc_complete_algorithm_reference.csv'} • Updated: ` +
          `${(metadata?.date ?? transitionMetadata?.date ?? new Date()).toLocaleDateString()}`
        }
        viewType="Algorithms"
        shareTitle="PQC Algorithm Comparison — ML-KEM, ML-DSA, SLH-DSA & More"
        shareText="Compare 42 post-quantum cryptographic algorithms side-by-side — security levels, key sizes, and performance."
        onExport={handleExportCsv}
      />

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      )}

      {/* View Tabs */}
      {!isLoading && (
        <Tabs
          value={activeTab}
          onValueChange={(t) => {
            const tab = t as 'transition' | 'detailed'
            setActiveTab(tab)
            setSearchParams(
              (prev) => {
                const next = new URLSearchParams(prev)
                if (tab !== 'transition') next.set('tab', tab)
                else next.delete('tab')
                return next
              },
              { replace: true }
            )
          }}
        >
          <TabsList className="mb-6 bg-muted/50 border border-border">
            <TabsTrigger value="transition" className="flex items-center gap-2">
              <ArrowRight size={18} />
              Transition Guide
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex items-center gap-2">
              <BarChart3 size={18} />
              Detailed Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transition">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AlgorithmComparison highlightAlgorithms={highlightAlgorithms} />
            </motion.div>
          </TabsContent>

          <TabsContent value="detailed">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AlgorithmDetailedComparison
                highlightAlgorithms={highlightAlgorithms}
                onInfoOpen={() => setInfoOpen(true)}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      )}

      <AlgorithmInfoModal isOpen={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  )
}
