// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { ShieldAlert, BrainCircuit, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RagAiSection() {
  const [isPqcAssistantOpen, setIsPqcAssistantOpen] = useState(false)
  // Live corpus size — read from the embedding-index manifest so it never goes stale
  // as the corpus grows. Falls back to a static estimate if the fetch fails.
  const [chunkCount, setChunkCount] = useState<number | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch('/data/embeddings-meta.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((meta) => {
        if (!cancelled && meta && typeof meta.chunkCount === 'number') {
          setChunkCount(meta.chunkCount)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

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
          <p className="text-xs text-muted-foreground">
            RAG · cloud (Gemini) or in-browser local model
          </p>
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
                question, it searches a curated corpus of ~{(chunkCount ?? 12000).toLocaleString()}{' '}
                PQC knowledge chunks &mdash; covering algorithms, standards, threats, compliance
                certifications, migration products, leaders, and learning modules &mdash; retrieves
                the 10&ndash;20 most relevant passages (adaptive per query intent), and injects them
                as context into the language model&apos;s prompt. The result is an answer grounded
                in platform data, enriched with deep links to the exact page or section being
                discussed.
              </p>
              <p className="text-muted-foreground mt-3">
                You choose where the model runs:{' '}
                <strong className="text-foreground">cloud mode</strong> uses Google&apos;s{' '}
                <strong className="text-foreground">Gemini 2.5 Flash</strong>, or{' '}
                <strong className="text-foreground">local mode</strong> runs an in-browser model (
                Qwen3-8B over WebGPU) entirely on your device. In local mode your queries and the
                retrieved context never leave your machine &mdash; it even works in airplane mode.
              </p>
              <p className="text-muted-foreground mt-3">
                To use <strong className="text-foreground">cloud mode</strong>, you provide your own{' '}
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
                Google AI Studio in seconds. Local mode needs no key &mdash; just a WebGPU-capable
                browser and a one-time model download.
              </p>
              <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30">
                <ShieldAlert className="text-status-warning mt-0.5 shrink-0" size={16} />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Data routing notice:</strong> In{' '}
                  <strong className="text-foreground">cloud mode</strong>, when you submit a
                  question your query text and the retrieved context chunks are sent to{' '}
                  <strong className="text-foreground">Google&apos;s servers</strong> for processing
                  by the Gemini 2.5 Flash model. Do not include sensitive, confidential, or personal
                  information in cloud-mode queries (local mode sends nothing off-device).{' '}
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
