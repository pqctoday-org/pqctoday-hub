// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlgorithmComparison } from './AlgorithmComparison'
import { AlgorithmDetailedComparison } from './AlgorithmDetailedComparison'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ArrowRight, BarChart3, Info } from 'lucide-react'
import {
  loadPQCAlgorithmsData,
  loadedFileMetadata,
  type AlgorithmDetail,
} from '../../data/pqcAlgorithmsData'
import { loadAlgorithmsData, loadedTransitionMetadata } from '../../data/algorithmsData'
import { Skeleton } from '../ui/skeleton'
import { SourcesButton } from '../ui/SourcesButton'
import { ShareButton } from '../ui/ShareButton'
import { GlossaryButton } from '../ui/GlossaryButton'
import { ExportButton } from '../ui/ExportButton'
import { generateCsv, downloadCsv, csvFilename } from '../../utils/csvExport'
import { ALGORITHM_CSV_COLUMNS } from '../../utils/csvExportConfigs'
import { AlgorithmInfoModal } from './AlgorithmInfoModal'
import { Button } from '../ui/button'

export function AlgorithmsView() {
  const [searchParams] = useSearchParams()
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-2 md:mb-12"
      >
        <h2 className="text-xl md:text-4xl font-bold mb-1 md:mb-4 text-gradient">
          Post-Quantum Cryptography Algorithms
        </h2>
        <p className="hidden lg:block text-lg text-muted-foreground max-w-3xl mx-auto">
          Migration from classical to post-quantum cryptographic algorithms
        </p>
        <div className="hidden lg:flex items-center justify-center gap-3 text-[10px] md:text-xs text-muted-foreground/60 font-mono mt-1 md:mt-2">
          <p>
            Data Sources: {transitionMetadata?.filename || 'algorithms_transitions.csv'},{' '}
            {metadata?.filename || 'pqc_complete_algorithm_reference.csv'} • Updated:{' '}
            {metadata?.date
              ? metadata.date.toLocaleDateString()
              : transitionMetadata?.date
                ? transitionMetadata.date.toLocaleDateString()
                : new Date().toLocaleDateString()}
          </p>
          <SourcesButton viewType="Algorithms" />
          <Button
            variant="ghost"
            onClick={() => setInfoOpen(true)}
            className="p-1 h-auto w-auto rounded hover:bg-muted/30 text-muted-foreground hover:text-foreground"
            aria-label="About this data"
          >
            <Info size={14} />
          </Button>
          <ShareButton
            title="PQC Algorithm Comparison — ML-KEM, ML-DSA, SLH-DSA & More"
            text="Compare 42 post-quantum cryptographic algorithms side-by-side — security levels, key sizes, and performance."
          />
          <GlossaryButton />
          <ExportButton onExport={handleExportCsv} />
        </div>
      </motion.div>

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
        <Tabs defaultValue={highlightAlgorithms ? 'detailed' : 'transition'}>
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
              <AlgorithmDetailedComparison highlightAlgorithms={highlightAlgorithms} />
            </motion.div>
          </TabsContent>
        </Tabs>
      )}

      <AlgorithmInfoModal isOpen={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  )
}
