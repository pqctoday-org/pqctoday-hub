// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router-dom'
import { Briefcase, ArrowRight, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Executive-only orientation card at the top of /about. The About page is a long
 * 15-section platform/trust disclosure; a governance reader wants two answers
 * fast — "what does this do for my program?" and "how do I engage?". This card
 * gives both and links straight past the technical sections. Rendered only for
 * the executive persona (caller gates it), so other roles see the page unchanged.
 */
export function ExecutiveAboutSummary() {
  return (
    <div className="glass-panel p-4 md:p-6 border-primary/30">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Briefcase className="text-primary" size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            For risk & governance leaders
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            PQC Today is a neutral, independent platform for planning and governing your
            post-quantum migration — quantify the risk, track the compliance deadlines that apply to
            you, build the business case, and produce board-ready artifacts. The rest of this page
            covers how the platform is built and kept trustworthy; the links below jump straight to
            what a decision-maker needs.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/simulation?run=exec">
              <Button variant="gradient" size="sm" className="gap-1.5">
                <PlayCircle size={14} aria-hidden="true" />
                Watch the guided overview
              </Button>
            </Link>
            <Link to="/business">
              <Button variant="outline" size="sm" className="gap-1.5">
                Open the Command Center
                <ArrowRight size={14} aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/assess">
              <Button variant="outline" size="sm">
                Get a board-ready risk brief
              </Button>
            </Link>
            <a href="#about-enterprise">
              <Button variant="outline" size="sm">
                Bring this to my organization
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
