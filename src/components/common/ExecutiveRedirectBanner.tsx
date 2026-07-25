// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ExecutiveRedirectCta {
  label: string
  to: string
}

interface ExecutiveRedirectBannerProps {
  /** Bold lead line, e.g. "OpenSSL Studio is a hands-on engineering tool." */
  title: string
  /** Muted follow-up line explaining why an executive is being redirected. */
  subtitle: string
  /** Higher-level governance pages to point the executive toward. */
  ctas: ExecutiveRedirectCta[]
  className?: string
}

/**
 * Orientation banner for the executive / business reader who lands on a
 * hands-on engineering surface (a lab). Instead of dropping them into a
 * workbench, it names the surface for what it is and links out to the
 * governance pages they actually want.
 *
 * Render only for the executive persona — callers own that gate so technical
 * personas never see this.
 */
export function ExecutiveRedirectBanner({
  title,
  subtitle,
  ctas,
  className,
}: ExecutiveRedirectBannerProps) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg bg-info/5 border border-info/30 text-sm ${
        className ?? ''
      }`}
    >
      <Info size={16} className="shrink-0 text-info mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-foreground/90 font-medium mb-1">{title}</p>
        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{subtitle}</p>
        <div className="flex flex-wrap gap-2">
          {ctas.map((cta) => (
            <Link key={cta.to} to={cta.to}>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                {cta.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
