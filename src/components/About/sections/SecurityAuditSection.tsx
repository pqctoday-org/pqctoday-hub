// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

export function SecurityAuditSection() {
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
          <h2 className="text-xl font-semibold">Security Audit</h2>
          <p className="text-xs text-muted-foreground">Last audited: March 22, 2026</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Production Status */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-status-success border border-status-success">
          <ShieldCheck className="text-status-success mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-sm font-semibold text-status-success">
              0 vulnerabilities (production and dev)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              All dependencies &mdash; runtime and development &mdash; have zero known CVEs.
              Verified via <code className="text-xs">npm audit</code> in CI on every push.
            </p>
          </div>
        </div>

        {/* OWASP Compliance */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <ShieldCheck className="text-primary mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-sm font-semibold text-foreground">OWASP Top 10 compliant</p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
              <li>
                No <code className="text-xs">dangerouslySetInnerHTML</code>,{' '}
                <code className="text-xs">eval()</code>, or{' '}
                <code className="text-xs">innerHTML</code> in production code
              </li>
              <li>
                All 118 external links protected against tabnabbing (
                <code className="text-xs">rel=&quot;noopener noreferrer&quot;</code>)
              </li>
              <li>No hardcoded secrets &mdash; all credentials via environment variables</li>
              <li>Content Security Policy configured with scoped connect-src whitelist</li>
              <li>ESLint security plugin active in CI</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
