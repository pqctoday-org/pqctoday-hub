// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { Database } from 'lucide-react'
import { DATA_FOUNDATION } from '../aboutData'

export function DataFoundationSection() {
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

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
        {DATA_FOUNDATION.map(({ dataset, records, sources }) => (
          <div
            key={dataset}
            className="p-3 rounded-lg border border-border bg-muted/30 text-center"
          >
            <div className="text-lg font-bold text-gradient">{records}</div>
            <div className="text-xs font-medium text-foreground mt-1">{dataset}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{sources}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gradient">2,600+</span>
          <span className="text-sm text-muted-foreground">total curated records</span>
        </div>
        <span className="text-xs text-muted-foreground">Compliance data refreshed weekly</span>
      </div>
    </motion.div>
  )
}
