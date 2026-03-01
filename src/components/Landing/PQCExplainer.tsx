import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Cpu, ShieldCheck, ChevronDown, ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'

const STORAGE_KEY = 'pqc-explainer-dismissed'

const cards = [
  {
    icon: Lock,
    heading: "Today's encryption protects everything",
    body: 'Banking, health records, government secrets, software updates — all secured by RSA and ECC, algorithms designed decades ago.',
  },
  {
    icon: Cpu,
    heading: 'Quantum computers will break it',
    body: "A sufficiently powerful quantum computer could crack today's encryption in hours. Some organizations are already collecting encrypted data to decrypt later.",
  },
  {
    icon: ShieldCheck,
    heading: 'New standards are here — the clock is ticking',
    body: 'NIST published quantum-resistant standards in 2024. Governments mandate migration by 2030\u20132035. The transition takes years — starting now is critical.',
  },
] as const

function isDismissed(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEY)
  } catch {
    return false
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch {
    // localStorage unavailable
  }
}

export const PQCExplainer = () => {
  const [expanded, setExpanded] = useState(!isDismissed())

  const handleDismiss = () => {
    setExpanded(false)
    setDismissed()
  }

  if (!expanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground group"
      >
        <ShieldCheck size={14} className="text-primary" />
        <span className="underline underline-offset-4 decoration-primary/30 group-hover:decoration-primary/60">
          New to post-quantum cryptography?
        </span>
        <ChevronDown size={14} className="transition-transform group-hover:translate-y-0.5" />
      </Button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="glass-panel p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-4 text-center">
            Why does this matter?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {cards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30"
              >
                <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
                  <card.icon size={22} />
                </div>
                <h3 className="text-sm font-bold mb-2">{card.heading}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.body}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/learn/pqc-101">
              <Button variant="gradient" size="sm">
                Start with PQC 101
                <ArrowRight className="ml-1.5" size={14} />
              </Button>
            </Link>
            <Button
              variant="link"
              size="sm"
              onClick={handleDismiss}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              I already know PQC — skip
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
