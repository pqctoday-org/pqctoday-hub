// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { ShieldAlert, BrainCircuit, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RagAiSection() {
  const [isPqcAssistantOpen, setIsPqcAssistantOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.41 }}
      className="glass-panel p-4 md:p-6"
    >
      <Button
        variant="ghost"
        onClick={() => setIsPqcAssistantOpen(!isPqcAssistantOpen)}
        className="flex items-center gap-3 w-full text-left cursor-pointer"
      >
        <BrainCircuit className="text-primary shrink-0" size={24} />
        <div className="flex-1">
          <h2 className="text-xl font-semibold">PQC Assistant</h2>
          <p className="text-xs text-muted-foreground">RAG + Gemini 2.5 Flash</p>
        </div>
        <ChevronDown
          size={20}
          className={clsx(
            'text-muted-foreground transition-transform duration-200 shrink-0',
            isPqcAssistantOpen && 'rotate-180'
          )}
        />
      </Button>
      <AnimatePresence>
        {isPqcAssistantOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="prose prose-invert max-w-none mt-4">
              <p className="text-muted-foreground">
                The PQC Assistant chatbot uses{' '}
                <strong className="text-foreground">Retrieval-Augmented Generation (RAG)</strong> to
                deliver grounded, sourced answers about post-quantum cryptography. When you ask a
                question, it searches a curated corpus of ~3,970 PQC knowledge chunks &mdash;
                covering algorithms, standards, threats, compliance certifications, migration
                products, leaders, and learning modules &mdash; retrieves the 10&ndash;20 most
                relevant passages (adaptive per query intent), and injects them as context into a{' '}
                <strong className="text-foreground">Gemini 2.5 Flash</strong> prompt. The result is
                an answer grounded in platform data, enriched with deep links to the exact page or
                section being discussed.
              </p>
              <p className="text-muted-foreground mt-3">
                To use the PQC Assistant, you need to provide your own{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio API key
                </a>
                . Your key is stored only in your browser&apos;s localStorage and is never sent to
                any server other than Google&apos;s Gemini API. You can obtain a free API key from
                Google AI Studio in seconds.
              </p>
              <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30">
                <ShieldAlert className="text-status-warning mt-0.5 shrink-0" size={16} />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Data routing notice:</strong> When you submit
                  a question, your query text and the retrieved context chunks are sent to{' '}
                  <strong className="text-foreground">Google&apos;s servers</strong> for processing
                  by the Gemini 2.5 Flash model. Do not include sensitive, confidential, or personal
                  information in your queries.{' '}
                  <a
                    href="https://ai.google.dev/gemini-api/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio terms
                  </a>{' '}
                  apply.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
