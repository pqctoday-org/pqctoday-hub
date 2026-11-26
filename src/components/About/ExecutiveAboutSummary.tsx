// SPDX-License-Identifier: AGPL-3.0-only
import { Link } from 'react-router'
import { Briefcase, ArrowRight, PlayCircle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'

/**
 * Executive-only orientation card at the top of /about. The About page is a long
 * 15-section platform/trust disclosure; a governance reader wants two answers
 * fast — "what does this do for my program?" and "how do I engage?". This card
 * gives both and links straight past the technical sections. Rendered only for
 * the executive persona (caller gates it), so other roles see the page unchanged.
 */
export function ExecutiveAboutSummary() {
  return (
    <div className="glass-panel bg-card backdrop-blur-none border-2 border-ink rounded-3xl shadow-[0_6px_0_hsl(var(--edge))] p-4 md:p-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Briefcase className="text-primary" size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold mb-1 font-display text-heading">
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
            <Link
              to="/simulation?run=exec"
              className={buttonVariants({ variant: 'gradient', size: 'sm', className: 'gap-1.5' })}
            >
              <PlayCircle size={14} aria-hidden="true" />
              Watch the guided overview
            </Link>
            <Link
              to="/business"
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5' })}
            >
              Open the Command Center
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link to="/assess" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Get a board-ready risk brief
            </Link>
            <a
              href="#about-enterprise"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Bring this to my organization
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
