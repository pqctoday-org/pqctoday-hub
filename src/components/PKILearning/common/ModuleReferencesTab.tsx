// SPDX-License-Identifier: GPL-3.0-only
import { ExternalLink, BookOpen, CalendarCheck } from 'lucide-react'
import { Link } from 'react-router'
import { getLibraryItemsForModule } from '@/data/libraryData'
import { MODULE_LAST_REVIEWED } from '@/data/moduleContentRegistry'
import { EmptyState } from '@/components/ui/empty-state'

interface ModuleReferencesTabProps {
  moduleId: string
}

function LastReviewedNote({ moduleId }: { moduleId: string }) {
  const lastReviewed = MODULE_LAST_REVIEWED[moduleId] // eslint-disable-line security/detect-object-injection
  if (!lastReviewed) return null
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
      <CalendarCheck size={13} aria-hidden="true" />
      <span>Content last reviewed {lastReviewed}</span>
    </div>
  )
}

export function ModuleReferencesTab({ moduleId }: ModuleReferencesTabProps) {
  const items = getLibraryItemsForModule(moduleId)

  if (items.length === 0) {
    return (
      <div>
        <LastReviewedNote moduleId={moduleId} />
        <EmptyState
          icon={<BookOpen size={32} />}
          title="No references yet"
          description="This module doesn't have linked references — the Learn tab is the place to dive in."
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <LastReviewedNote moduleId={moduleId} />
      <p className="text-sm text-muted-foreground mb-4">
        Standards, RFCs, and guidance documents relevant to this module. All items are also
        available in the{' '}
        <Link to="/library" className="text-primary hover:underline">
          Standards Library
        </Link>
        .
      </p>
      {items.map((item) => (
        <div key={item.referenceId} className="glass-panel p-4 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <a
                href={item.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1 group"
              >
                {item.documentTitle}
                <ExternalLink
                  size={12}
                  className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                />
              </a>
              {/* A paid standard is still worth naming — ISO/IEC 18013-5 defines
                  the mdoc format whether or not a reader can download it — but
                  the link above goes to a shop, not a document. Say so on the
                  link itself rather than letting it read as a download. */}
              {item.accessType === 'paid' && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-status-warning/10 text-status-warning border border-status-warning/20 whitespace-nowrap">
                  Purchase required
                </span>
              )}
            </div>
            {item.accessType === 'paid' && (
              <p className="text-xs text-muted-foreground mt-1">
                {item.authorsOrOrganization || 'The publisher'} sells this standard — the link above
                is a purchase page, not a free download.
                {item.freeSummaryUrl && (
                  <>
                    {' '}
                    <a
                      href={item.freeSummaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Read a free summary
                      <ExternalLink size={10} className="shrink-0" />
                    </a>{' '}
                    <span className="opacity-80">
                      (an abstract describing the standard — not the standard itself).
                    </span>
                  </>
                )}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">
                {item.authorsOrOrganization}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-muted/30">
                {item.documentType}
              </span>
              {item.documentStatus && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {item.documentStatus}
                </span>
              )}
              {item.pqcRound && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-info/10 text-info border border-info/20">
                  {item.pqcRound}
                </span>
              )}
              {item.mathFamily?.map((fam) => (
                <span
                  key={fam}
                  className="text-xs px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20"
                >
                  {fam}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {item.shortDescription}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
