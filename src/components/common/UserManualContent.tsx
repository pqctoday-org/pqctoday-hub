// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Lightbulb } from 'lucide-react'
import { pageManuals, type PageId } from '../../data/userManualData'

/**
 * A page's guide: its summary, its sections and its tips. One component for the drawer's Guide view
 * and for the modal panel (embedded mode), so there is one copy.
 */
export const UserManualContent: React.FC<{ pageId: PageId }> = ({ pageId }) => {
  const manual = pageManuals[pageId]
  return (
    <div
      role="region"
      aria-label={manual.title}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region with no focusable content is unreachable by keyboard; axe's `scrollable-region-focusable` fires without it (same pattern as ui/ScrollFadeContainer.tsx).
      tabIndex={0}
      className="flex-1 overflow-y-auto p-4 space-y-3"
    >
      <p className="text-sm text-muted-foreground">{manual.summary}</p>

      {manual.sections.map((section) => (
        <div key={section.heading} className="glass-panel p-4">
          <h3 className="font-semibold text-foreground mb-2">{section.heading}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
        </div>
      ))}

      {/* Tips */}
      {manual.tips && manual.tips.length > 0 && (
        <div className="glass-panel p-4 border-primary/20">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Lightbulb size={16} className="text-primary" />
            Tips
          </h3>
          <ul className="space-y-1.5">
            {manual.tips.map((tip) => (
              <li key={tip} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                <span className="text-primary shrink-0">*</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
