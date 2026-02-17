import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlgorithmComparison } from './AlgorithmComparison'
import { AlgorithmDetailedComparison } from './AlgorithmDetailedComparison'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ArrowRight, BarChart3 } from 'lucide-react'
import { loadPQCAlgorithmsData, loadedFileMetadata } from '../../data/pqcAlgorithmsData'
import { loadAlgorithmsData, loadedTransitionMetadata } from '../../data/algorithmsData'
import { SourcesButton } from '../ui/SourcesButton'
import { ShareButton } from '../ui/ShareButton'
import { GlossaryButton } from '../ui/GlossaryButton'

export function AlgorithmsView() {
  const [metadata, setMetadata] = useState<{ filename: string; date: Date | null } | null>(null)
  const [transitionMetadata, setTransitionMetadata] = useState<{
    filename: string
    date: Date | null
  } | null>(null)

  useEffect(() => {
    loadPQCAlgorithmsData().then(() => {
      setMetadata(loadedFileMetadata)
    })
    loadAlgorithmsData().then(() => {
      setTransitionMetadata(loadedTransitionMetadata)
    })
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-2 md:mb-12"
      >
        <h2 className="text-lg md:text-4xl font-bold mb-1 md:mb-4 text-gradient">
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
          <ShareButton
            title="PQC Algorithm Comparison — ML-KEM, ML-DSA, SLH-DSA & More"
            text="Compare 42 post-quantum cryptographic algorithms side-by-side — security levels, key sizes, and performance."
          />
          <GlossaryButton />
        </div>
      </motion.div>

      {/* View Tabs */}
      <Tabs defaultValue="transition">
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
            <AlgorithmComparison />
          </motion.div>
        </TabsContent>

        <TabsContent value="detailed">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AlgorithmDetailedComparison />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
