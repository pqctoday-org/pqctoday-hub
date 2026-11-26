// SPDX-License-Identifier: AGPL-3.0-only
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
        aria-expanded={isPqcAssistantOpen}
        className="flex items-center gap-3 w-full text-left cursor-pointer"
      >
        <BrainCircuit className="text-primary shrink-0" size={24} />
        <div className="flex-1">
          <h2 className="text-xl font-semibold">PQC Assistant</h2>
          <p className="text-xs text-muted-foreground">
            Answers from the Hub&apos;s own records · no language model
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
                The PQC Assistant answers from the Hub&apos;s own records. When you ask a question,
                it looks through those records on your device &mdash; algorithms, standards,
                threats, compliance certifications, migration products, leaders, glossary terms and
                lessons &mdash; and shows the closest match first, with its source and a link to the
                exact page or section in the Hub.
              </p>
              <p className="text-muted-foreground mt-3">
                It does not write answers of its own: every answer is a record the Hub already
                holds. It can still pick a record that is not the one you meant, or one that has
                since changed, so open the source it names and check it before relying on an answer
                for a decision. When the Hub holds nothing on a question, it says so and shows the
                closest records instead of guessing.
              </p>
              <p className="text-muted-foreground mt-3">
                There is no language model behind it, so there is nothing to download and no API key
                to enter.
              </p>
              <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30">
                <ShieldAlert className="text-status-warning mt-0.5 shrink-0" size={16} />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Data routing notice:</strong> your question is
                  answered on your device from files the Hub itself serves. It is not sent to Google
                  or to any other outside service.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
