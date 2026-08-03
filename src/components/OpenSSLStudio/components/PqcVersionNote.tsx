// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Info } from 'lucide-react'

/**
 * Shared version-requirement note for every PQC-algorithm operation panel
 * (genpkey, KEM, PQC sign/verify). Native ML-KEM/ML-DSA/SLH-DSA support was
 * added to OpenSSL's default provider in 3.5 (verified against
 * docs.openssl.org/3.5 release notes) — earlier/distro OpenSSL builds need
 * the third-party oqs-provider plugin to run the same commands.
 */
export const PqcVersionNote: React.FC = () => (
  <div className="flex gap-2 text-xs text-muted-foreground bg-status-warning/10 border border-status-warning/20 rounded-lg px-3 py-2">
    <Info size={13} className="shrink-0 mt-0.5 text-status-warning" aria-hidden="true" />
    <p>
      Native PQC algorithm support requires <span className="font-semibold">OpenSSL 3.5+</span>{' '}
      (this Studio runs 3.6.3). On older or distro OpenSSL, this command fails with{' '}
      <code className="bg-muted px-1 rounded">unsupported</code> or{' '}
      <code className="bg-muted px-1 rounded">no such algorithm</code> unless you install{' '}
      <a
        href="https://github.com/open-quantum-safe/oqs-provider"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline font-medium"
      >
        oqs-provider
      </a>
      .
    </p>
  </div>
)
