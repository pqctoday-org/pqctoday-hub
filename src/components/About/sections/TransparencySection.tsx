// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { MessageSquare, ExternalLink, Construction, Wrench, Linkedin } from 'lucide-react'

export function TransparencySection() {
  return (
    <motion.div
      id="transparency"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="glass-panel p-4 md:p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Construction className="text-primary shrink-0" size={24} />
        <h2 className="text-xl font-semibold flex-1">Transparency &amp; Disclaimer</h2>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border border-status-warning/40 bg-status-warning/15 text-status-warning animate-pulse-glow">
          <Wrench size={12} className="animate-bounce-subtle" />
          WIP
        </span>
      </div>
      <div className="prose prose-invert max-w-none">
        <p className="text-muted-foreground">
          PQC Today is a{' '}
          <strong className="text-foreground">community-driven educational platform</strong> built
          to help professionals understand and prepare for the post-quantum cryptography transition.
        </p>
        <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground list-none pl-0">
          <li className="flex items-start gap-2.5">
            <span className="text-primary mt-1 shrink-0">&#9679;</span>
            <span>
              This website has <strong className="text-foreground">not received endorsement</strong>{' '}
              from the organizations, standards bodies, or government agencies referenced in its
              content
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-primary mt-1 shrink-0">&#9679;</span>
            <span>
              All information is sourced from{' '}
              <strong className="text-foreground">publicly available resources</strong> on the
              internet
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-primary mt-1 shrink-0">&#9679;</span>
            <span>
              Significant effort has gone into ensuring accuracy through{' '}
              <strong className="text-foreground">
                thorough automated and manual verification processes
              </strong>
              , but the content{' '}
              <strong className="text-foreground">may still contain inaccuracies</strong>
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-primary mt-1 shrink-0">&#9679;</span>
            <span>
              We are actively working to{' '}
              <strong className="text-foreground">
                collaborate with authoritative organizations and domain experts
              </strong>{' '}
              to cross-validate and continuously improve the quality of this content
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-primary mt-1 shrink-0">&#9679;</span>
            <span>
              Industry leaders featured on this platform are included only with their{' '}
              <strong className="text-foreground">written consent</strong>
            </span>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground mt-4">
          If you represent a cited organization, are a domain expert, or simply want to help improve
          the accuracy of this platform, we welcome your involvement:
        </p>
        <div className="flex flex-wrap gap-3 mt-3">
          <a
            href="https://github.com/pqctoday/pqc-timeline-app/discussions/108"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <MessageSquare size={14} />
            GitHub Discussions
            <ExternalLink size={12} />
          </a>
          <a
            href="https://www.linkedin.com/in/eric-amador-971850a"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Linkedin size={14} />
            Eric Amador
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </motion.div>
  )
}
