import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileText, Plus, Sparkles, Bug, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { getCurrentVersion } from '../../store/useVersionStore'

// Import CHANGELOG.md as raw text
import changelogContent from '../../../CHANGELOG.md?raw'

type FilterType = 'added' | 'changed' | 'fixed'

interface FilterState {
  added: boolean
  changed: boolean
  fixed: boolean
}

export const ChangelogView = () => {
  const version = getCurrentVersion()

  const [filters, setFilters] = useState<FilterState>({
    added: true,
    changed: true,
    fixed: true,
  })

  const toggleFilter = (type: FilterType) => {
    // eslint-disable-next-line security/detect-object-injection
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  // Filter the changelog content based on active filters
  const filteredContent = useMemo(() => {
    const lines = changelogContent.split('\n')
    const result: string[] = []
    let skipSection = false

    for (const line of lines) {
      // Detect section headers
      if (line.startsWith('### Added')) {
        skipSection = !filters.added
        if (!skipSection) result.push(line)
      } else if (line.startsWith('### Changed')) {
        skipSection = !filters.changed
        if (!skipSection) result.push(line)
      } else if (line.startsWith('### Fixed')) {
        skipSection = !filters.fixed
        if (!skipSection) result.push(line)
      } else if (line.startsWith('### ')) {
        // Other sections like Documentation - always show
        skipSection = false
        result.push(line)
      } else if (line.startsWith('## ')) {
        // Version headers - always show
        skipSection = false
        result.push(line)
      } else if (line.startsWith('# ')) {
        // Main title - always show
        skipSection = false
        result.push(line)
      } else {
        // Content lines
        if (!skipSection) {
          result.push(line)
        }
      }
    }

    return result.join('\n')
  }, [filters])

  const allFiltersActive = filters.added && filters.changed && filters.fixed

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <FileText className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Changelog</h1>
              <p className="text-sm text-muted-foreground">
                Current version:{' '}
                <span className="font-mono text-primary font-bold">v{version}</span>
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to App</span>
          </Link>
        </div>
      </motion.div>

      {/* Filter Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-4 mb-6"
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground mr-2">Filter:</span>
          <button
            onClick={() => toggleFilter('added')}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all',
              filters.added
                ? 'bg-success/20 border-success/50 text-success'
                : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <Plus size={14} />
            <span>New Features</span>
          </button>
          <button
            onClick={() => toggleFilter('changed')}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all',
              filters.changed
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles size={14} />
            <span>Enhancements</span>
          </button>
          <button
            onClick={() => toggleFilter('fixed')}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all',
              filters.fixed
                ? 'bg-warning/20 border-warning/50 text-warning'
                : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <Bug size={14} />
            <span>Bug Fixes</span>
          </button>
          {!allFiltersActive && (
            <button
              onClick={() => setFilters({ added: true, changed: true, fixed: true })}
              className="ml-2 text-xs text-muted-foreground hover:text-foreground underline"
            >
              Show all
            </button>
          )}
        </div>
      </motion.div>

      {/* Changelog Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-6"
      >
        <article className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:mt-8 prose-h3:text-lg prose-h3:text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{filteredContent}</ReactMarkdown>
        </article>
      </motion.div>
    </div>
  )
}
