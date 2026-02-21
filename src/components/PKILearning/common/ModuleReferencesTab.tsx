import { ExternalLink, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getLibraryItemsForModule } from '@/data/libraryData'

interface ModuleReferencesTabProps {
  moduleId: string
}

export function ModuleReferencesTab({ moduleId }: ModuleReferencesTabProps) {
  const items = getLibraryItemsForModule(moduleId)

  if (items.length === 0) {
    return (
      <div className="glass-panel p-8 text-center">
        <BookOpen size={32} className="mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">No references found for this module.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
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
            </div>
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
