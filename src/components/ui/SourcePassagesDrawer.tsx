// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Quote } from 'lucide-react'
import { useSourcePassages } from '@/hooks/useSourcePassages'
import { Button } from '@/components/ui/button'

interface SourcePassagesDrawerProps {
  /** Full corpus chunk id (e.g., `library-FIPS 203`). Caller builds the id. */
  chunkId: string | undefined
  className?: string
}

function cachedHref(sourceDoc: string | undefined): string | undefined {
  if (!sourceDoc) return undefined
  return `/${sourceDoc.replace(/^public\//, '')}`
}

export function SourcePassagesDrawer({ chunkId, className = '' }: SourcePassagesDrawerProps) {
  const [open, setOpen] = useState(false)
  const { passages, sourceDoc, wasAttributedTo, isLoading } = useSourcePassages(chunkId)

  if (isLoading) return null
  if (passages.length === 0) return null

  const docHref = cachedHref(sourceDoc)
  const docLabel = sourceDoc ? sourceDoc.split('/').pop() : undefined
  const attribution = wasAttributedTo ?? 'unknown'
  const summary = `${passages.length} passage${passages.length === 1 ? '' : 's'} from ${docLabel ?? 'source'}`

  return (
    <div className={`border-t border-border pt-2 ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((p) => !p)
        }}
        aria-expanded={open}
        className="h-auto inline-flex items-center gap-1.5 text-[11px] px-1 py-0.5 text-muted-foreground hover:text-foreground"
        title="View source evidence from the cached document"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        <Quote size={11} aria-hidden="true" />
        Source evidence
        <span className="text-muted-foreground/70">
          ({attribution} · {summary})
        </span>
      </Button>

      {open && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          className="mt-2 space-y-1.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {passages.map((passage, i) => (
            <div
              key={i}
              className="text-[11px] text-muted-foreground bg-muted/20 border border-border rounded p-2 leading-relaxed italic"
            >
              &ldquo;{passage}&rdquo;
            </div>
          ))}
          {docHref && (
            <a
              href={docHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={10} aria-hidden="true" />
              View source document
            </a>
          )}
        </div>
      )}
    </div>
  )
}
