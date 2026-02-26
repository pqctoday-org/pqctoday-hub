import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BookDown, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { generateStudyPack } from '@/services/export/StudyPackService'

export const StudyPackCard: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      await generateStudyPack()
    } catch (err) {
      console.error('Failed to generate study pack:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <BookDown className="text-primary" size={24} />
        <h3 className="text-xl font-bold text-foreground">Study Pack for NotebookLM</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Download all PQC Today content as a structured ZIP file. Upload to{' '}
        <a
          href="https://notebooklm.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Google NotebookLM
        </a>{' '}
        for AI-powered study sessions and audio overviews.
      </p>

      <ul className="text-sm text-muted-foreground space-y-1 mb-5 ml-4 list-disc">
        <li>280+ glossary terms and definitions</li>
        <li>Algorithm specifications and performance metrics</li>
        <li>Classical-to-PQC transition roadmap</li>
        <li>Global migration timeline by country</li>
        <li>Quantum threats by industry</li>
        <li>Compliance frameworks and deadlines</li>
        <li>Reference library documents</li>
        <li>PQC-ready software catalog</li>
        <li>Industry leaders and organizations</li>
        <li>Learning module summaries</li>
        <li>380+ quiz questions with explanations</li>
        <li>Authoritative sources and provenance</li>
      </ul>

      <Button
        variant="gradient"
        onClick={handleDownload}
        disabled={isGenerating}
        className="w-full sm:w-auto"
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <BookDown size={16} />
            Download Study Pack
          </>
        )}
      </Button>
    </motion.div>
  )
}
