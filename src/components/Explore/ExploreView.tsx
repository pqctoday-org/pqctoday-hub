// SPDX-License-Identifier: GPL-3.0-only
import { useNavigate } from 'react-router-dom'
import {
  Compass,
  GraduationCap,
  Globe,
  AlertTriangle,
  ShieldCheck,
  ClipboardCheck,
  Shield,
  Unlock,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { logExploreTileClick, logExploreUnlock } from '@/utils/analytics'

interface ExploreTile {
  icon: LucideIcon
  title: string
  description: string
  path: string
  /** Alternate destination for gated-curious users (avoids sending them to blocked routes). */
  gatedPath?: string
  accent: string
}

const TILES: ExploreTile[] = [
  {
    icon: GraduationCap,
    title: 'Learn PQC Basics',
    description:
      "Start with the essentials. Why quantum computers threaten today's encryption and what's being done about it.",
    path: '/learn',
    accent: 'text-primary bg-primary/10',
  },
  {
    icon: Globe,
    title: 'Global Migration Timeline',
    description:
      'See which governments and organizations have already committed to post-quantum cryptography — and when.',
    path: '/timeline',
    accent: 'text-secondary bg-secondary/10',
  },
  {
    icon: AlertTriangle,
    title: 'Understand the Threat',
    description:
      '"Harvest now, decrypt later" attacks are happening today. Learn what data is already at risk.',
    path: '/threats',
    accent: 'text-status-warning bg-status-warning/10',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Landscape',
    description:
      'NIST, FIPS, NSA CNSA — see which regulations apply to your industry and how to stay ahead.',
    path: '/compliance',
    accent: 'text-accent bg-accent/10',
  },
  {
    icon: ClipboardCheck,
    title: 'Assess Your Risk',
    description:
      "A 2-minute questionnaire that estimates your organization's exposure to the quantum threat.",
    path: '/assess',
    accent: 'text-primary bg-primary/10',
  },
  {
    icon: Shield,
    title: 'Compare PQC Algorithms',
    description:
      'ML-KEM, ML-DSA, SLH-DSA — compare the new NIST-standardized algorithms side by side.',
    path: '/algorithms',
    gatedPath: '/learn/pqc-101',
    accent: 'text-secondary bg-secondary/10',
  },
]

export function ExploreView() {
  const navigate = useNavigate()
  const { selectedPersona, experienceLevel, viewAccess, setViewAccess } = usePersonaStore()
  const isCurious = selectedPersona === 'curious' || experienceLevel === 'curious'
  const isGated = isCurious && viewAccess === 'gated'
  const showUnlockPrompt = isGated

  return (
    <div className="max-w-5xl mx-auto py-4 md:py-8 px-2">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-xl md:text-4xl font-bold text-gradient flex items-center justify-center gap-2 md:gap-3 mb-3">
          <Compass className="w-5 h-5 md:w-9 md:h-9 text-primary shrink-0" aria-hidden="true" />
          Explore PQC Today
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
          Post-quantum cryptography is changing how the world secures data. Pick a topic to start
          exploring — no background required.
        </p>
      </div>

      {/* Tile grid — max-w-5xl prevents stretching on ultrawide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {TILES.map((tile) => {
          const Icon = tile.icon
          const destination = isGated && tile.gatedPath ? tile.gatedPath : tile.path
          return (
            <Button
              key={tile.path}
              variant="ghost"
              onClick={() => {
                logExploreTileClick(destination)
                navigate(destination)
              }}
              className="glass-panel h-auto p-5 flex-col items-start text-left whitespace-normal hover:bg-transparent hover:border-primary/40 group"
            >
              <div className={`p-2.5 rounded-lg mb-3 ${tile.accent}`}>
                <Icon size={20} aria-hidden="true" />
              </div>
              <span className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                {tile.title}
              </span>
              <span className="text-sm text-muted-foreground leading-relaxed">
                {tile.description}
              </span>
            </Button>
          )
        })}
      </div>

      {/* Advanced unlock prompt for curious persona */}
      {showUnlockPrompt && (
        <div className="mt-8 glass-panel p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
            <Unlock size={20} className="text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-0.5">Ready to go deeper?</p>
            <p className="text-xs text-muted-foreground">
              Unlock algorithms, playground tools, and technical documentation when you&apos;re
              ready to explore beyond the basics.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logExploreUnlock()
              setViewAccess('unlocked')
            }}
            className="shrink-0"
          >
            Unlock Advanced Views
          </Button>
        </div>
      )}

      {/* Soft CTA */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          Want a personalized experience?{' '}
          <Button
            variant="link"
            className="text-xs text-primary p-0 h-auto"
            onClick={() => navigate('/')}
          >
            Choose your role on the home page →
          </Button>
        </p>
      </div>
    </div>
  )
}
