// SPDX-License-Identifier: GPL-3.0-only
import { ArrowUpRight } from 'lucide-react'
import { Link, useInRouterContext, useLocation } from 'react-router'
import clsx from 'clsx'

interface OpenOnPageLinkProps {
  /** The item's CLEAN canonical link, e.g. `/library?ref=FIPS-203`. */
  to: string
  /** The item's home page path, e.g. `/library`. No link is shown there. */
  homePath: string
  /** Page name for the label, e.g. "Library". */
  pageLabel: string
  onNavigate?: () => void
  className?: string
}

/**
 * "Open on its page" for an item pop-up shown over ANOTHER page (e.g. the
 * Compliance For-You view opens Library / Threat / Timeline pop-ups as local
 * state). That host URL never names the item, so a reload loses it; this link
 * goes to the item's own canonical, restorable URL — the same one the
 * pop-up's ItemShareButton shares. Hidden on the item's home page, where the
 * pop-up is already the page's own URL-backed view.
 */
export function OpenOnPageLink(props: OpenOnPageLinkProps) {
  // Some hosts (unit tests, embeds) render pop-ups outside a router.
  if (!useInRouterContext()) return null
  return <OpenOnPageLinkInner {...props} />
}

function OpenOnPageLinkInner({
  to,
  homePath,
  pageLabel,
  onNavigate,
  className,
}: OpenOnPageLinkProps) {
  const { pathname } = useLocation()
  if (pathname === homePath || pathname.startsWith(`${homePath}/`)) return null
  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-label={`Open on the ${pageLabel} page`}
      title={`Open on the ${pageLabel} page`}
      className={clsx(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
        className
      )}
    >
      <ArrowUpRight size={16} aria-hidden="true" />
    </Link>
  )
}
