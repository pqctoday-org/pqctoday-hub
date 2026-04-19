// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { Building2, ChevronDown, Mail, Container, AppWindow } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EnterpriseSection() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.38 }}
      className="glass-panel p-4 md:p-6"
    >
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left cursor-pointer"
      >
        <Building2 className="text-primary shrink-0" size={24} />
        <h2 className="text-xl font-semibold flex-1">Enterprise</h2>
        <ChevronDown
          size={20}
          className={clsx(
            'text-muted-foreground transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="prose prose-invert max-w-none mt-4 space-y-8">
              {/* Sandbox section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Container size={18} className="text-primary flex-shrink-0" />
                  <h3 className="text-base font-semibold text-foreground">
                    Sandbox — Advanced Scenario Testing
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The <strong className="text-foreground">Sandbox</strong> section of the Crypto
                  Workshop provides 30+ real-world PQC migration scenarios powered by actual
                  open-source tools running inside isolated Docker containers — strongSwan, OpenSSH,
                  HAProxy, PostgreSQL, Hyperledger Besu, Algorand, and more. Each scenario targets a
                  concrete enterprise use case such as quantum-resistant VPNs, DNSSEC zone signing,
                  supply-chain provenance, and CBOM compliance auditing.
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                  <li>
                    <strong className="text-foreground">On-demand containers</strong> &mdash; each
                    scenario spins up an isolated environment and is destroyed after the session.
                  </li>
                  <li>
                    <strong className="text-foreground">Real tools, real protocols</strong> &mdash;
                    no simulations; actual TLS handshakes, IKEv2 key exchange, and PKCS#11 calls.
                  </li>
                  <li>
                    <strong className="text-foreground">Four tracks</strong> &mdash; Cryptographic
                    Infrastructure, Web &amp; Network Security, Application Security, and Quantum
                    &amp; Discovery.
                  </li>
                </ul>
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                  Sandbox access is available upon request. Contact us to provision your
                  environment:
                  <div className="mt-3">
                    <a
                      href="mailto:pqctoday@gmail.com?subject=Sandbox%20Access%20Request"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-foreground text-sm font-medium rounded-lg transition-colors border border-primary/20"
                    >
                      <Mail size={15} />
                      pqctoday@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Embedding Mode section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AppWindow size={18} className="text-primary flex-shrink-0" />
                  <h3 className="text-base font-semibold text-foreground">Embedding Mode</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PQC Today offers a powerful{' '}
                  <strong className="text-foreground">Embedding Mode</strong> that allows
                  organizations and vendors to integrate tailored sections of the platform directly
                  into their own native workflows, dashboards, or documentation — with no coding
                  required. Configuration is handled through a visual web designer during
                  onboarding.
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                  <li>
                    <strong className="text-foreground">Zero-Trust Architecture</strong> &mdash; The
                    embed mode utilizes a strict ECDSA PKI Signature scheme. Content and tools are
                    only rendered if explicitly permitted by a cryptographically signed vendor
                    certificate.
                  </li>
                  <li>
                    <strong className="text-foreground">postMessage Bridge</strong> &mdash;
                    Communication between the host page and the embedded platform is handled
                    exclusively via secure cross-origin postMessage — no external API calls.
                  </li>
                  <li>
                    <strong className="text-foreground">Visual Designer</strong> &mdash; Choose
                    which modules and tools are visible, set the theme, and configure difficulty
                    ceilings — all through a no-code web designer, no development work needed.
                  </li>
                </ul>
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                  Embedding Mode requires a registered digital vendor signature and a formal
                  onboarding process. To get started:
                  <div className="mt-3">
                    <a
                      href="mailto:pqctoday@gmail.com?subject=Embedding%20Mode%20Request"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-foreground text-sm font-medium rounded-lg transition-colors border border-primary/20"
                    >
                      <Mail size={15} />
                      pqctoday@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
