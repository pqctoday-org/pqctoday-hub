// SPDX-License-Identifier: AGPL-3.0-only
import { Link } from 'react-router'

export function ThreatResponsePractice({ threatId }: { threatId: string }) {
  if (threatId !== 'FIN-001' && threatId !== 'AUS-FIN-002') return null

  return (
    <section
      aria-label="Payment signature evidence and practice"
      className="space-y-2 rounded-lg border border-border bg-muted/20 p-3 text-xs"
    >
      <h3 className="font-semibold text-foreground">Payment signature evidence and practice</h3>
      <p className="text-muted-foreground">
        Project Leap Phase 2 tested a change to payment-message signatures during liquidity
        transfers in an acceptance test environment. The report describes what worked in that setup,
        along with performance and interoperability costs. It calls for further testing before
        deployment.
      </p>
      <p className="text-muted-foreground">
        In the Hub exercise, verify an intact sample and then change one signature component. This
        checks message authentication. For a payment rollout, measure verification with the intended
        libraries, message formats, infrastructure and traffic.
      </p>
      <Link
        to="/playground/hybrid-sigs"
        className="inline-flex min-h-11 items-center font-semibold text-primary underline"
      >
        Practice verifying both signature components
      </Link>
    </section>
  )
}
