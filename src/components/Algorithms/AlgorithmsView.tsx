import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlgorithmComparison } from './AlgorithmComparison'
import { AlgorithmDetailedComparison } from './AlgorithmDetailedComparison'
import { ArrowRight, BarChart3 } from 'lucide-react'
import clsx from 'clsx'
import { loadPQCAlgorithmsData, loadedFileMetadata } from '../../data/pqcAlgorithmsData'
import { loadAlgorithmsData, loadedTransitionMetadata } from '../../data/algorithmsData'
import { SourcesButton } from '../ui/SourcesButton'
import { ShareButton } from '../ui/ShareButton'

type ViewType = 'transition' | 'detailed'

export function AlgorithmsView() {
  const [activeView, setActiveView] = useState<ViewType>('transition')
  const [metadata, setMetadata] = useState<{ filename: string; date: Date | null } | null>(null)
  const [transitionMetadata, setTransitionMetadata] = useState<{
    filename: string
    date: Date | null
  } | null>(null)

  useEffect(() => {
    // Ensure data is loaded to get metadata
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
        </div>
      </motion.div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveView('transition')}
          className={clsx(
            'flex items-center gap-2 px-6 py-3 border-b-2 transition-colors font-semibold',
            activeView === 'transition'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <ArrowRight size={20} />
          Transition Guide
        </button>
        <button
          onClick={() => setActiveView('detailed')}
          className={clsx(
            'flex items-center gap-2 px-6 py-3 border-b-2 transition-colors font-semibold',
            activeView === 'detailed'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <BarChart3 size={20} />
          Detailed Comparison
        </button>
      </div>

      {/* View Content */}
      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeView === 'transition' && <AlgorithmComparison />}
        {activeView === 'detailed' && <AlgorithmDetailedComparison />}
      </motion.div>
    </div>
  )
}
