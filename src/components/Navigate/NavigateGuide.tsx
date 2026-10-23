// SPDX-License-Identifier: AGPL-3.0-only
import { BookOpen, List, Route, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PersonaId } from '@/data/learningPersonas'

const ROLE_START: Partial<Record<PersonaId, string>> = {
  executive:
    'Start with Standards, Compliance, and Vendors to see which hub records connect policy to implementation.',
  developer:
    'Start with Algorithms, Mechanisms, Protocols, and Products to trace implementation dependencies.',
  architect:
    'Start with Protocols and Products, then follow links outward to standards and migration guidance.',
  researcher:
    'Use the graph to discover linked records, then open the cited hub pages and sources before drawing conclusions.',
  'cert-engineer':
    'Start from the FIPS 140-3 compliance record or the CMVP trusted source to see the standards and products linked to them. A link records a reference in the dataset, not a validation, so confirm certificate status in the official CMVP register.',
  ops: 'Start with Products and Protocols to find operational records, then follow their standards and compliance links.',
  curious:
    'Try the guided tour first. It introduces the most-connected records in each visible category.',
}

interface NavigateGuideProps {
  persona: PersonaId | null
  onTour: () => void
  onList: () => void
  onDismiss: () => void
}

export function NavigateGuide({ persona, onTour, onList, onDismiss }: NavigateGuideProps) {
  return (
    <section
      // Narrow on a tablet or desktop: the graph is centred in the canvas, so a
      // 288 px card stays in the empty left margin and does not cover the
      // category labels (a wide card hid the "Trusted source" label).
      className="glass-panel absolute left-3 right-3 top-3 z-10 max-w-xl space-y-2 p-3 sm:left-4 sm:right-auto sm:top-4 sm:w-72"
      aria-labelledby="navigate-guide-title"
      data-testid="navigate-guide"
    >
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <h2 id="navigate-guide-title" className="text-sm font-semibold text-foreground">
          Explore how the hub connects
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="-my-1 -mr-1 ml-auto h-7 w-7 shrink-0"
          onClick={onDismiss}
          aria-label="Close guide"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Each node is a hub record; each line is a declared relationship in the dataset. Darker nodes
        have more recorded connections in this graph—they are not more important, trustworthy, or
        mature. The density control shows the most-connected records per category, so hidden nodes
        are not missing evidence.
      </p>
      {persona && ROLE_START[persona] && (
        <p className="text-xs leading-relaxed text-foreground">{ROLE_START[persona]}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" className="h-8 gap-1.5 text-xs" onClick={onTour}>
          <Route className="h-3.5 w-3.5" aria-hidden="true" />
          Start guided tour
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onList}>
          <List className="h-3.5 w-3.5" aria-hidden="true" />
          Open accessible list
        </Button>
      </div>
    </section>
  )
}
