// SPDX-License-Identifier: AGPL-3.0-only
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { securityAuditDate } from '@/data/securityAuditData'

export function SecurityAuditSection() {
  const lastAudited = securityAuditDate
    ? securityAuditDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'date unavailable'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass-panel p-4 md:p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-primary" size={24} />
        <div>
          <h2 className="text-xl font-semibold">Recorded Security Review</h2>
          <p className="text-xs text-muted-foreground">Latest recorded report: {lastAudited}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <ShieldCheck className="text-primary mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-sm font-semibold text-foreground">Dated review snapshot</p>
            <p className="text-xs text-muted-foreground mt-1">
              The recorded report describes a production npm dependency scan and static-code review
              of an earlier application version. It does not establish the current vulnerability
              status of all dependencies, bundled engines or configurations.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <ShieldCheck className="text-primary mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-sm font-semibold text-foreground">Scope and browser key storage</p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
              <li>A dependency scan or lint check does not establish OWASP Top 10 compliance.</li>
              <li>
                Rendering controls must be assessed where HTML is inserted; this page does not claim
                that every component avoids HTML insertion.
              </li>
              <li>
                User-supplied cloud API keys are saved in browser storage. Public build-time
                identifiers are distinct from secret credentials.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
