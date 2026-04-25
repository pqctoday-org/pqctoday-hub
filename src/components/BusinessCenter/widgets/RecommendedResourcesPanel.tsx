// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router-dom'
import { ExternalLink, FlaskConical, Library, BookOpen } from 'lucide-react'
import { authoritativeSources } from '@/data/authoritativeSourcesData'
import { CSWP39_RESOURCE_MAP } from '../lib/cswp39ResourceMap'
import type { CSWP39StepId } from '../lib/cswp39Tier'

export interface RecommendedResourcesPanelProps {
  stepId: CSWP39StepId
}

export function RecommendedResourcesPanel({ stepId }: RecommendedResourcesPanelProps) {
  // eslint-disable-next-line security/detect-object-injection
  const resources = CSWP39_RESOURCE_MAP[stepId]
  if (!resources) return null

  const filteredAuthSources = resources.authoritativeSourceFilter
    ? authoritativeSources.filter(resources.authoritativeSourceFilter).slice(0, 6)
    : []

  return (
    <div className="space-y-4 mt-3 pt-3 border-t border-border">
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        Recommended resources
      </div>

      {/* In-app deep-links */}
      {resources.inApp.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground mb-1.5">
            <Library size={12} className="text-primary" />
            Examples in this app
          </div>
          <ul className="space-y-1">
            {resources.inApp.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  to={link.href}
                  className="text-xs text-primary hover:underline"
                  title={link.hint}
                >
                  {link.label}
                </Link>
                {link.hint && (
                  <span className="text-xs text-muted-foreground ml-2">— {link.hint}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* External authoritative references */}
      {(resources.external.length > 0 || filteredAuthSources.length > 0) && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground mb-1.5">
            <BookOpen size={12} className="text-primary" />
            External authoritative references
          </div>
          <ul className="space-y-1">
            {resources.external.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  title={link.hint}
                >
                  {link.label}
                  <ExternalLink size={10} />
                </a>
              </li>
            ))}
            {filteredAuthSources.map((src) => (
              <li key={src.sourceName}>
                <a
                  href={src.primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  title={src.description}
                >
                  {src.sourceName} ({src.region})
                  <ExternalLink size={10} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Playground row — horizontal scrollable strip */}
      {resources.playground.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground mb-1.5">
            <FlaskConical size={12} className="text-primary" />
            Try it in the Playground
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {resources.playground.map((tool) => (
              <Link
                key={tool.toolId}
                to={`/playground/${tool.toolId}`}
                className="shrink-0 px-3 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 text-xs text-foreground hover:text-primary transition-colors no-underline"
                title={tool.hint}
              >
                {tool.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
