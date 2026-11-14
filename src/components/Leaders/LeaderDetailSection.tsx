// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef } from 'react'
import {
  MapPin,
  Briefcase,
  Building2,
  Clock,
  ShieldCheck,
  X,
  CheckCircle2,
  Award,
  FolderGit2,
} from 'lucide-react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import type { Leader } from '../../data/leadersData'
import { CountryFlag } from '../common/CountryFlag'
import {
  FLAG_CODE_MAP,
  catalogProductsHeading,
  leaderTimelineCountry,
  productLabelFromId,
} from './leadersConstants'
import { LeaderKeyResources } from '@/components/common/LeaderKeyResources'
import { Button } from '@/components/ui/button'
import { leaderPatentsHref } from './leaderDeepLink'
import { ItemShareButton, itemShareTitle } from '@/components/common/ItemShareButton'

interface LeaderDetailSectionProps {
  leader: Leader
  onClose: () => void
  /** Also show the role, every organization and the full bio — for the Table
   *  view, whose row shows none of them (a card already shows them above). */
  showProfile?: boolean
}

export const LeaderDetailSection = ({
  leader,
  onClose,
  showProfile = false,
}: LeaderDetailSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const flagCode = FLAG_CODE_MAP[leader.country] ?? 'un'
  const timelineCountry = leaderTimelineCountry(leader.country)

  useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [leader.id])

  return (
    <motion.section
      ref={containerRef}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
      role="region"
      aria-label={`Additional details for ${leader.name}`}
    >
      <div className="mt-4 pt-3 border-t border-border space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            {leader.category && (
              <span className="px-2 py-0.5 rounded-full font-medium bg-muted/50">
                {leader.category}
              </span>
            )}
            {leader.country && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} className="shrink-0" aria-hidden="true" />
                <CountryFlag code={flagCode} width={16} height={11} />
                {leader.country}
              </span>
            )}
            {leader.verifiedDate && (
              <span
                className="inline-flex items-center gap-1.5 text-status-success"
                title="Affiliation and role last confirmed against public sources"
              >
                <CheckCircle2 size={12} className="shrink-0" aria-hidden="true" />
                Profile sources checked {leader.verifiedDate}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* The expanded card is this person's item view — share its clean
                link (page + ?leader= only), same as the Community pop-up. */}
            <ItemShareButton
              title={itemShareTitle(leader.name)}
              path={`/leaders?leader=${encodeURIComponent(leader.leaderId || leader.name)}`}
            />
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-7 w-7 p-0 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              aria-label="Collapse details"
            >
              <X size={14} />
            </Button>
          </div>
        </div>

        {showProfile && (
          <div className="space-y-1.5" data-testid="leader-detail-profile">
            {leader.title && (
              <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <Briefcase size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span>{leader.title}</span>
              </p>
            )}
            {leader.organizations.map((org, i) => (
              <p
                key={`${i}-${org}`}
                className="flex items-start gap-1.5 text-sm font-semibold text-primary"
              >
                <Building2 size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span>{org}</span>
              </p>
            ))}
            {leader.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed">{leader.bio}</p>
            )}
          </div>
        )}

        {leader.country && (
          <div className="flex flex-wrap gap-2">
            {timelineCountry && (
              <Link
                to={`/timeline?country=${encodeURIComponent(timelineCountry)}`}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-muted/30 border border-border hover:bg-muted/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
                title={`View timeline events from ${timelineCountry}`}
              >
                <Clock size={12} aria-hidden="true" />
                Events from {timelineCountry}
              </Link>
            )}
            <Link
              to="/compliance"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-muted/30 border border-border hover:bg-muted/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
              title="Learn how compliance sources and applicability are assessed"
            >
              <ShieldCheck size={12} aria-hidden="true" />
              Explore compliance sources
            </Link>
          </div>
        )}

        {leader.patentRefs && leader.patentRefs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link
              to={leaderPatentsHref(leader.patentRefs)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-muted/30 border border-border hover:bg-muted/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
              title={`View ${leader.name}'s patents`}
            >
              <Award size={12} aria-hidden="true" />
              View {leader.patentRefs.length} patent{leader.patentRefs.length === 1 ? '' : 's'}
            </Link>
          </div>
        )}

        {leader.migrateCatalogRefs && leader.migrateCatalogRefs.length > 0 && (
          <div className="rounded-lg bg-muted/20 border border-border p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1.5">
              {catalogProductsHeading(leader.migrateCatalogRefs)}
            </p>
            <div className="flex flex-col gap-0.5">
              {leader.migrateCatalogRefs.map((productId) => (
                <Link
                  key={productId}
                  to={`/migrate?product=${encodeURIComponent(productId)}&tab=replace`}
                  className="text-xs font-medium text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1.5"
                  title={`View ${productId} in the Migrate catalog`}
                >
                  <FolderGit2 size={11} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">{productLabelFromId(productId)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <LeaderKeyResources leader={leader} size="xs" limit={6} />

        {leader.vettingBody && leader.vettingBody.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Institutions in source metadata:</span>{' '}
            {leader.vettingBody.join(', ')}. These recorded names do not establish institutional
            review or endorsement of this profile.
          </div>
        )}

        {(leader.websiteUrl || leader.linkedinUrl) && (
          <div className="flex flex-wrap gap-2">
            {leader.websiteUrl && (
              <a
                href={leader.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${leader.name}'s website (opens in new window)`}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary font-medium"
              >
                Website
              </a>
            )}
            {leader.linkedinUrl && (
              <a
                href={leader.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${leader.name}'s LinkedIn profile (opens in new window)`}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-status-info hover:bg-primary/20 border-status-info/50 hover:border-primary/40 text-status-info font-medium"
              >
                LinkedIn
              </a>
            )}
          </div>
        )}
      </div>
    </motion.section>
  )
}
