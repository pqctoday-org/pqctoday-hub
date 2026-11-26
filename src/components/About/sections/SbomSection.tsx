// SPDX-License-Identifier: AGPL-3.0-only
import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { Info, Link2, ChevronDown, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SBOM_GROUPS,
  sbomGroupMembers,
  sbomHref,
  sbomLicense,
  sbomVersionLabel,
  type SbomComponent,
} from '@/data/sbomComponents'
import { SBOM_BUNDLED_TRANSITIVE } from '@/data/sbomVersions.generated'

// The list itself lives in src/data/sbomComponents.ts (which components, under
// which heading, with which license/link); the version column is derived at build
// time from package.json and from the shipped WASM binaries via
// src/data/sbomVersions.generated.ts. This file is only the accordion chrome
// around that data.

function SbomRow({ component }: { component: SbomComponent }) {
  const href = sbomHref(component)
  const members = sbomGroupMembers(component)
  return (
    <li className="flex justify-between items-start gap-2 flex-wrap text-sm border-b border-border pb-1">
      {href ? (
        <a
          href={href}
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
      <div className="flex flex-col items-end text-right max-w-[60%]">
        <span className="text-xs text-muted-foreground font-mono">{sbomLicense(component)}</span>
        <span className="text-xs text-muted-foreground">{sbomVersionLabel(component)}</span>
      </div>
      {component.note && (
        <p className="basis-full text-xs text-muted-foreground/80">{component.note}</p>
      )}
      {members.length > 0 && (
        <details className="basis-full text-xs text-muted-foreground">
          <summary className="cursor-pointer">Show the {members.length} crates</summary>
          <p className="mt-1 font-mono break-words">{members.join(' · ')}</p>
        </details>
      )}
    </li>
  )
}

export function SbomSection({ openFromLink = false }: { openFromLink?: boolean }) {
  const [isSbomOpen, setIsSbomOpen] = useState(openFromLink)
  const searchInput = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const search = query.trim().toLowerCase()
  const groups = SBOM_GROUPS.map((group) => ({
    ...group,
    components: group.components.filter((component) =>
      `${component.name} ${sbomVersionLabel(component)} ${group.category}`
        .toLowerCase()
        .includes(search)
    ),
  })).filter((group) => group.components.length > 0)

  const [prevOpenFromLink, setPrevOpenFromLink] = useState(openFromLink)
  if (openFromLink !== prevOpenFromLink) {
    setPrevOpenFromLink(openFromLink)
    if (openFromLink) setIsSbomOpen(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.33 }}
      className="glass-panel p-4 md:p-6"
    >
      <h2>
        <Button
          variant="ghost"
          onClick={() => setIsSbomOpen(!isSbomOpen)}
          aria-expanded={isSbomOpen}
          className="flex items-center gap-3 w-full text-left cursor-pointer"
        >
          <Info className="text-primary shrink-0" size={24} />
          <span className="text-base md:text-xl font-semibold flex-1 whitespace-normal">
            Software Bill of Materials (SBOM)
          </span>
          <ChevronDown
            size={18}
            className={clsx(
              'text-muted-foreground transition-transform duration-200 shrink-0',
              isSbomOpen && 'rotate-180'
            )}
          />
        </Button>
      </h2>
      <AnimatePresence>
        {isSbomOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex flex-wrap items-end gap-2 px-3 md:px-6">
              <label className="block min-w-0 flex-1 text-sm font-medium">
                Search SBOM components
                <input
                  ref={searchInput}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="mt-1 block min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              {query && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('')
                    searchInput.current?.focus()
                  }}
                >
                  Clear search
                </Button>
              )}
            </div>
            {groups.length === 0 && (
              <p role="status" className="mt-3 px-3 text-sm text-muted-foreground md:px-6">
                No components match that search.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-3 md:p-6 items-start">
              {groups.map((group) => (
                <div key={group.category} className="break-inside-avoid">
                  <h3 className="text-lg font-semibold mb-3 font-display text-heading">
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
            <div className="px-3 md:px-6 pb-3 space-y-2 text-sm">
              <p>
                <span className="font-semibold">
                  {SBOM_BUNDLED_TRANSITIVE.count} more npm packages
                </span>{' '}
                are bundled into the site because the packages above depend on them. By license:{' '}
                {SBOM_BUNDLED_TRANSITIVE.licenses
                  .map(([license, n]) => `${license} ${n}`)
                  .join(' · ')}
                .
              </p>
              <a
                href="/data/pqctoday-sbom.cdx.json"
                download
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <Download size={14} aria-hidden="true" />
                Download the complete SBOM (CycloneDX JSON, every package and component)
              </a>
            </div>
            <p className="px-3 md:px-6 pb-3 text-xs text-muted-foreground">
              Versions are read from package.json and from the WASM binaries this site serves; where
              a binary embeds no release number the entry shows the source commit it was built from
              (or says the commit is not recorded) instead of a release.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
