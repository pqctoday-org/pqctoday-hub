// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { Construction } from 'lucide-react'
import { Link } from 'react-router-dom'

export function TransparencyBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-panel p-4 flex items-start gap-3"
    >
      <Construction size={18} className="text-primary mt-0.5 shrink-0" />
      <p className="text-sm text-muted-foreground leading-relaxed">
        <span className="font-medium text-foreground">Community-Driven Educational Resource</span>{' '}
        &mdash; PQC Today is built from publicly available information with thorough verification,
        but is not endorsed by the organizations cited and may contain inaccuracies.{' '}
        <Link to="/about#transparency" className="text-primary hover:underline">
          Learn more &rarr;
        </Link>
      </p>
    </motion.div>
  )
}
