// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router-dom'
import { Globe, ExternalLink } from 'lucide-react'
import type { UserProfile } from '../../../utils/applicabilityEngine'

/**
 * Inline summary of the active profile — shown above the panel/view so users
 * can see what their results are scoped to and (optionally) jump to /assess
 * to refine.
 */
export function ProfileSummary({ profile, editable }: { profile: UserProfile; editable: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center gap-2 text-sm">
      <Globe size={14} className="text-muted-foreground" aria-hidden="true" />
      <span className="text-muted-foreground">Showing applicability for:</span>
      <span className="font-medium text-foreground">{profile.industry || 'Any industry'}</span>
      <span className="text-muted-foreground">in</span>
      <span className="font-medium text-foreground">
        {profile.country || (profile.region ? profile.region.toUpperCase() : 'Global')}
      </span>
      {editable && (
        <Link
          to="/assess"
          className="ml-auto text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          Edit profile
          <ExternalLink size={12} aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
