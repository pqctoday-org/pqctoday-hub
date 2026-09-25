// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import {
  TestTubes,
  Eye,
  Workflow,
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
import { Link } from 'react-router'

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
  // Entropy remediation P0 cleanup (2026-09-24): every exercise asks for a
  // decision about the current step's behaviour. Step indices follow
  // manifest.ts workshopSteps: 0 random-generation, 1 entropy-testing,
  // 2 esv-walkthrough, 3 drbg-state-machine, 4 source-combining. Outcomes
  // quoted in "observe" were checked against utils/entropyTests.ts and
  // workshop/sourceAssessment.ts; normative sentences carry their section.
  const exercises: Exercise[] = [
    {
      id: 'detect-bad-randomness',
      title: '1. A Stuck Source: Which Check Belongs in the Device?',
      description:
        'Load All Zeros (a stuck-at failure) and run the checks. Every result turns red. Decide which of them an entropy source has to run on its own raw samples while it operates, and why the others cannot stand in for it.',
      badge: 'SP 800-90B',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      borderColor: 'border-primary',
      icon: TestTubes,
      observe:
        'Every visual check lands outside range and both health tests signal a failure (Repetition Count sees a run of 64 against a cutoff of 4 at the assumed H = 8 bits/sample). Only the health tests belong in the device: SP 800-90B §4.3 says the health tests "shall include both continuous and start-up tests", and the Repetition Count Test is there "to quickly detect catastrophic failures that cause the noise source to become “stuck”" (§4.4.1). The visual checks describe one buffer after the fact.',
      config: { step: 1, sampleType: 'bad-zeros' },
    },
    {
      id: 'spot-repeating-pattern',
      title: '2. Repeating Pattern: Stuck or Biased?',
      description:
        'Load Repeating Pattern (0xDEADBEEF over and over) and run the checks. Before reading the health-test group, predict which of the two SP 800-90B health tests catches a source that never repeats a byte back-to-back but keeps returning to the same few values.',
      badge: 'Health tests',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      borderColor: 'border-warning',
      icon: Eye,
      observe:
        'Repetition Count signals nothing, because no byte repeats consecutively. Adaptive Proportion signals a failure: 0xDE recurs 16 times against a cutoff of 6. That is the split SP 800-90B describes — Repetition Count for a source stuck on one value (§4.4.1), Adaptive Proportion to detect "when some value begins to occur much more frequently than expected" (§4.4.2). With 64 samples the Adaptive Proportion window is partial (the specified window for 8-bit samples is 512), so this demonstrates the idea; it is not the test as specified.',
      config: { step: 1, sampleType: 'bad-pattern' },
    },
    {
      id: 'drbg-known-answer',
      title: '3. DRBG State Machine: What Does a Known-Answer Match Prove?',
      description:
        'Instantiate HMAC_DRBG, press Generate until it refuses, then Reseed. Run the known-answer check. Decide: if all 16 NIST vectors match byte for byte, what have you learned about the entropy input on this page?',
      badge: 'SP 800-90A',
      badgeColor: 'bg-success/20 text-success border-success/50',
      borderColor: 'border-success',
      icon: Workflow,
      observe:
        'Generate refuses once reseed_counter exceeds the demo interval of 10 (SP 800-90A Rev. 1 §10.1.2.5 step 1; Table 2 allows HMAC_DRBG up to 2^48 requests between reseeds), and Reseed takes fresh entropy input and sets the counter back to 1 (§10.1.2.4). The vectors match because HMAC_DRBG is deterministic: the same entropy input, nonce and personalization string always give the same output, and one flipped entropy-input bit gives a different one. So a match shows the mechanism is computed correctly — and nothing about the entropy input. The output is only as unpredictable as the seed, which is why SP 800-90C §2.6 has validated SP 800-90B entropy sources provide the seed material.',
      config: { step: 3 },
    },
    {
      id: 'compromised-source',
      title: '4. One Source Compromised: Does the Other Save You?',
      description:
        'In Step 6, load the "Stuck source, detected" counterexample, then "Malicious cancellation". In both, Source A is compromised and Source B is healthy. For each, decide before reading the verdict whether Source B justifies the construction.',
      badge: 'SP 800-90C',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      borderColor: 'border-secondary',
      icon: Shield,
      observe:
        'Stuck source: the raw-sample health tests catch Source A and its samples are excluded (SP 800-90C §3.1 item 4.a.1), so only Source B’s 256 declared bits are credited — fewer than the 384 bits (3s/2 for s = 256, §2.6 item 11) needed to instantiate the DRBG — and the sources are not validated: "Not enough evidence". Malicious cancellation: an attacker who controls A and can see B sets A = B, and A ⊕ B is all zeros: "Construction is unsafe". Whether the surviving source protects you depends on independence, the adversary’s control and the entropy you can credit — not on the combining function.',
      config: { step: 4 },
    },
    {
      id: 'health-test-placement',
      title: '5. Where Must the Health Test Sit?',
      description:
        'Load the "Conditioned output from a failed source" counterexample: Source A is biased toward 0x5A and the design conditions its samples anyway. Walk the pipeline to Step 5 and run the output diagnostics. Decide: could any check on the final output have caught this failure?',
      badge: 'Pipeline',
      badgeColor: 'bg-muted text-muted-foreground border-border',
      borderColor: 'border-muted-foreground',
      icon: Layers,
      observe:
        'In Step 2 only Adaptive Proportion signals Source A’s failure — 0x5A is every fourth sample but never repeats back-to-back, so Repetition Count stays quiet. After conditioning and the HKDF expansion, the output diagnostics usually land within range. No output check could have caught it: SP 800-90B §4.3 item 6 says "Health tests shall be performed on the noise source samples before any conditioning is done." The verdict is "Construction is unsafe" — entropy collected by a failed source shall not be used (SP 800-90C §3.1 item 4.a.1).',
      config: { step: 4 },
    },
    {
      id: 'counter-passes-health-tests',
      title: '6. A Counter Passes the Health Tests',
      description:
        'Load Incrementing (bytes 0x00, 0x01, 0x02, …) and run the checks, then look at the Bit Matrix and the lag plot. The sequence is completely predictable. Decide why both SP 800-90B health tests stay quiet, and what that tells you about what health tests are for.',
      badge: 'Limits',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      borderColor: 'border-primary',
      icon: Grid3x3,
      observe:
        'No byte repeats and no value recurs in the window, so Repetition Count and Adaptive Proportion signal nothing; the monobit and chi-squared checks and the straight line in the lag plot give the pattern away. Health tests are not an entropy assessment: SP 800-90B §4.2 says continuous tests "are usually designed so that only gross failures are likely to be detected". Whether a source is predictable is a question for the SP 800-90B entropy assessment of at least 1,000,000 raw noise-source samples (§3.1.1), not for any check on 64 bytes.',
      config: { step: 1, sampleType: 'bad-increment' },
    },
    {
      id: 'bad-rng-challenge',
      title: '7. Bad RNG Challenge',
      description:
        'Enable all four sources (Web Crypto, OpenSSL, Math.random, Timestamp LCG), generate, and use Predict Next 4 Bytes to show the LCG is fully predictable. Then press Compare All Tests. Decide what verdict about a generator the visual-check group can support.',
      badge: 'Security',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      borderColor: 'border-warning',
      icon: ShieldAlert,
      observe:
        'The prediction matches the LCG’s next bytes exactly, yet Math.random() and the LCG usually land within range on the visual checks and signal nothing on the health tests. That is the expected lesson: output statistics cannot tell a predictable generator from an unpredictable one, so the visual group supports no secure or insecure verdict. What separates the sources is how they are seeded — the LCG from the clock, Web Crypto and OpenSSL from the operating system’s entropy source.',
      config: { step: 0 },
    },
    {
      id: 'bit-corruption-threshold',
      title: '8. Corruption Without Structure',
      description:
        'Switch to Bit Flipper mode. Press Flip 10% a few times, then All Zeros. Decide why the checks barely react to random flips but all react to All Zeros, and what that means for spotting a degraded or tampered source from its output.',
      badge: 'Interactive',
      badgeColor: 'bg-success/20 text-success border-success/50',
      borderColor: 'border-success',
      icon: ToggleLeft,
      observe:
        'Flipping random bits of random data leaves random-looking data, so the visual checks mostly stay within range and the health tests stay quiet; All Zeros sends every visual check outside range and trips both health tests. Output checks only see structure. A degraded source that still emits unstructured output — or a generator seeded with a guessable value — looks the same as a healthy one, which is why assurance comes from assessing the noise source, not from checking its output.',
      config: { step: 1 },
    },
    {
      id: 'live-degradation',
      title: '9. Live Degradation: Which Health Test Fires?',
      description:
        'Switch to Live Monitor. Stream Web Crypto, then switch to All Zeros, then to Repeating 0xDEADBEEF. For each bad source, predict which SP 800-90B health test fires before you look.',
      badge: 'Real-time',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      borderColor: 'border-secondary',
      icon: Activity,
      observe:
        'All Zeros trips Repetition Count in the first batch — a stuck source is the failure it exists for (SP 800-90B §4.4.1). The repeating pattern never repeats a byte back-to-back, so Repetition Count stays quiet and Adaptive Proportion fires instead (§4.4.2, here on a 64-sample partial window). Continuous tests run on the noise-source output while it operates, to detect failures (§4.2), and SP 800-90B requires them (§4.3). These gauges run on 64-byte batches of browser output, so they demonstrate the idea; they are not an entropy-source health test.',
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
