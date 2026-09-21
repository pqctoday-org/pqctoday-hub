// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { Info, Link2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SBOM_GROUPS, sbomVersionLabel, type SbomComponent } from '@/data/sbomComponents'

// The list itself lives in src/data/sbomComponents.ts (which components, under
// which heading, with which license/link); the version column is derived from
// package.json at build time via src/data/sbomVersions.generated.ts. This file
// is only the accordion chrome around that data.

function SbomRow({ component }: { component: SbomComponent }) {
  return (
    <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
      {component.href ? (
        <a
          href={component.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          {component.name}
          <Link2 size={12} aria-hidden="true" />
        </a>
      ) : (
        <span className="text-muted-foreground">{component.name}</span>
      )}
      <div className="flex flex-col items-end shrink-0">
        <span className="text-xs text-muted-foreground/40 font-mono">{component.license}</span>
        <span className="text-xs text-muted-foreground">{sbomVersionLabel(component)}</span>
      </div>
    </li>
  )
}

export function SbomSection() {
  const [isSbomOpen, setIsSbomOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.33 }}
      className="glass-panel p-4 md:p-6"
    >
      <Button
        variant="ghost"
        onClick={() => setIsSbomOpen(!isSbomOpen)}
        className="flex items-center gap-3 w-full text-left cursor-pointer"
      >
        <Info className="text-primary shrink-0" size={24} />
        <h2 className="text-xl font-semibold flex-1">Software Bill of Materials (SBOM)</h2>
        <ChevronDown
          size={18}
          className={clsx(
            'text-muted-foreground transition-transform duration-200 shrink-0',
            isSbomOpen && 'rotate-180'
          )}
        />
      </Button>
      <AnimatePresence>
        {isSbomOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-3 md:p-6 mt-6 items-start">
              {SBOM_GROUPS.map((group) => (
                <div key={group.category} className="break-inside-avoid">
                  <h3 className="text-lg font-semibold text-primary mb-3">
                    {group.category}
                    {group.note && (
                      <>
                        {' '}
                        <span className="text-xs font-normal text-muted-foreground">
                          {group.note}
                        </span>
                      </>
                    )}
                  </h3>
                  <ul className="space-y-2">
                    {group.components.map((component) => (
                      <SbomRow key={component.name} component={component} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
