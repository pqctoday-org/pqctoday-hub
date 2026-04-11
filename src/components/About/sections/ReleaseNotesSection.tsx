// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { FileText, Sparkles, ChevronRight } from 'lucide-react'
import { getCurrentVersion, useVersionStore } from '@/store/useVersionStore'
import { Button } from '@/components/ui/button'

export function ReleaseNotesSection() {
  const version = getCurrentVersion()
  const requestShowWhatsNew = useVersionStore((s) => s.requestShowWhatsNew)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4 md:p-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 md:p-0 rounded-full bg-primary/10 md:bg-transparent text-primary shrink-0">
            <FileText className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-xl font-semibold">Release Notes</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              What&apos;s new in v{version} — features, fixes, and improvements
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto">
          <Button
            variant="ghost"
            onClick={requestShowWhatsNew}
            className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg border border-border text-foreground font-semibold text-xs md:text-sm hover:bg-muted/40 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
            What&apos;s New
          </Button>
          <a
            href="/changelog"
            className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg bg-primary text-black font-semibold text-xs md:text-sm hover:bg-primary/90 transition-colors"
          >
            View
            <span className="hidden md:inline"> Changelog</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </motion.div>
  )
}
