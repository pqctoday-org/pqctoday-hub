// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import {
  TestTubes,
  Eye,
  Atom,
  Shield,
  Layers,
  ArrowRight,
  BookOpen,
  Grid3x3,
  ToggleLeft,
  Activity,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export interface WorkshopConfig {
  step: number
  sampleType?: 'good' | 'bad-zeros' | 'bad-pattern' | 'bad-increment'
}

interface EntropyExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig: (config: WorkshopConfig) => void
}

interface Exercise {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  borderColor: string
  icon: React.ElementType
  observe: string
  config: WorkshopConfig
}

export const EntropyExercises: React.FC<EntropyExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const exercises: Exercise[] = [
    {
      id: 'detect-bad-randomness',
      title: '1. Detect Bad Randomness',
      description:
        'Load a sample of all-zero bytes into the entropy testing step. Run the tests and observe which fail and why. This simulates a stuck-at hardware failure.',
      badge: 'Testing',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      borderColor: 'border-primary',
      icon: TestTubes,
      observe:
        'All tests should fail. The frequency test shows 0% ones. Chi-squared shows extreme deviation. Min-entropy = 0 bits/byte.',
      config: { step: 1, sampleType: 'bad-zeros' },
    },
    {
      id: 'spot-repeating-pattern',
      title: '2. Spot the Repeating Pattern',
      description:
        'Load a repeating 4-byte pattern (0xDEADBEEF). The frequency test may pass since only 4 byte values appear with equal frequency, but the runs test should catch the repetition.',
      badge: 'Pattern',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      borderColor: 'border-warning',
      icon: Eye,
      observe:
        'The chi-squared test shows extreme deviation (only 4 of 256 byte values present). The runs test detects the periodic pattern.',
      config: { step: 1, sampleType: 'bad-pattern' },
    },
    {
      id: 'compare-trng-qrng',
      title: '3. Compare TRNG and QRNG',
      description:
        'Run entropy tests on both pre-fetched QRNG data and locally generated TRNG data. Compare the results side-by-side.',
      badge: 'Quantum',
      badgeColor: 'bg-success/20 text-success border-success/50',
      borderColor: 'border-success',
      icon: Atom,
      observe:
        'Both sources should pass all tests. The educational point: both produce high-quality randomness — the difference is the physical source, not the statistical output.',
      config: { step: 3 },
    },
    {
      id: 'defense-in-depth',
      title: '4. Defense-in-Depth Combination',
      description:
        "Combine TRNG and QRNG sources using XOR and HMAC conditioning. Then use the 'compromise Source A' demo to see that entropy is preserved from Source B.",
      badge: 'SP 800-90C',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      borderColor: 'border-secondary',
      icon: Shield,
      observe:
        "When Source A is all zeros, XOR(0, B) = B, so the output retains Source B's entropy. HMAC conditioning further distributes the entropy uniformly.",
      config: { step: 4 },
    },
    {
      id: 'end-to-end-rbg',
      title: '5. End-to-End RBG Pipeline',
      description:
        'Build a complete Random Bit Generator: generate TRNG bytes, combine with QRNG, apply HMAC conditioning, expand with HKDF, and run entropy tests on the final output.',
      badge: 'Pipeline',
      badgeColor: 'bg-muted text-muted-foreground border-border',
      borderColor: 'border-muted-foreground',
      icon: Layers,
      observe:
        'The final DRBG output should have near-perfect statistical properties. Each stage of the pipeline contributes to the quality of the output.',
      config: { step: 4 },
    },
    {
      id: 'visual-pattern-recognition',
      title: '6. Visual Pattern Recognition',
      description:
        'Load each bad sample (zeros, repeating, incrementing) and observe the Bit Matrix visualization. Compare what your eyes can detect vs what statistical tests catch.',
      badge: 'Visual',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      borderColor: 'border-primary',
      icon: Grid3x3,
      observe:
        'All-zeros produces a solid block. The repeating pattern shows clear stripes in the bit matrix. The incrementing pattern shows a diagonal gradient. Random data looks like TV static. The lag plot reveals correlations invisible in the histogram.',
      config: { step: 1, sampleType: 'bad-pattern' },
    },
    {
      id: 'bad-rng-challenge',
      title: '7. Bad RNG Challenge',
      description:
        'Enable all 4 RNG sources (Web Crypto, OpenSSL, Math.random, LCG) and generate data. Use the LCG prediction feature to prove determinism. Compare test results across all sources.',
      badge: 'Security',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      borderColor: 'border-warning',
      icon: ShieldAlert,
      observe:
        'Math.random() output looks random and may pass some tests at small sample sizes, but it is fully deterministic. The LCG prediction demo proves this by correctly predicting future output.',
      config: { step: 0 },
    },
    {
      id: 'bit-corruption-threshold',
      title: '8. Bit Corruption Threshold',
      description:
        'Switch to Bit Flipper mode in the testing step. Start with random data, then flip bits one at a time or in batches. Discover how many corruptions it takes before each test fails.',
      badge: 'Interactive',
      badgeColor: 'bg-success/20 text-success border-success/50',
      borderColor: 'border-success',
      icon: ToggleLeft,
      observe:
        'A few random flips rarely trigger failures. The frequency test fails when bit balance shifts significantly (~10% bias). The runs test catches systematic flipping first. Try "All Zeros" to see instant total failure.',
      config: { step: 1 },
    },
    {
      id: 'live-degradation',
      title: '9. Live Degradation',
      description:
        'Switch to Live Monitor mode. Start streaming with Web Crypto (good source), then switch to "All Zeros" or "Repeating Pattern" mid-stream. Watch how quickly the gauges react.',
      badge: 'Real-time',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      borderColor: 'border-secondary',
      icon: Activity,
      observe:
        'The min-entropy and repetition count gauges respond immediately to bad data. The chi-squared test may take 1-2 samples to show the full impact. This demonstrates why continuous health monitoring is mandatory in SP 800-90B.',
      config: { step: 1 },
    },
  ]

  const handleOpenExercise = (exercise: Exercise) => {
    onSetWorkshopConfig(exercise.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 w-full">
      {/* Intro */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Hands-On Exercises</h2>
        <p className="text-muted-foreground text-sm">
          These exercises guide you through practical entropy analysis scenarios. Each exercise
          opens the Workshop tab with pre-configured settings.
        </p>
      </div>

      {/* Exercise Cards */}
      <div className="space-y-4">
        {exercises.map((exercise) => {
          const Icon = exercise.icon
          return (
            <div key={exercise.id} className={`glass-panel p-5 border-l-4 ${exercise.borderColor}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={18} className="text-primary shrink-0" />
                    <h3 className="text-lg font-bold text-foreground">{exercise.title}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-bold ${exercise.badgeColor}`}
                    >
                      {exercise.badge}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 mb-2">{exercise.description}</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>What to observe:</strong> {exercise.observe}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleOpenExercise(exercise)}
                  className="flex items-center gap-2 shrink-0"
                >
                  Open Exercise <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quiz Link */}
      <section className="glass-panel p-6 text-center">
        <BookOpen className="mx-auto mb-3 text-primary" size={32} />
        <h3 className="text-lg font-bold text-foreground mb-2">Test Your Knowledge</h3>
        <p className="text-muted-foreground mb-4">
          Ready to test what you&apos;ve learned about entropy and randomness?
        </p>
        <Link to="/learn/quiz">
          <Button variant="gradient">
            Take the Quiz <ArrowRight size={14} />
          </Button>
        </Link>
      </section>
    </div>
  )
}
