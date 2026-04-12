// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
}

interface PQC101ExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig: (config: WorkshopConfig) => void
}

const EXERCISES = [
  {
    q: "Why can't classical computers break RSA-2048 in reasonable time, but quantum computers could?",
    hint: "Classical computers require exponential time to factor large integers. Shor's Algorithm on a sufficiently powerful quantum computer reduces integer factorisation to polynomial time — making RSA-2048 breakable.",
    workshopStep: null,
  },
  {
    q: 'What is the difference between HNDL and HNFL, and which types of assets does each threaten?',
    hint: 'HNDL ("Harvest Now, Decrypt Later") targets confidentiality: adversaries collect encrypted ciphertext today and decrypt it once a CRQC exists — threatening any long-lived sensitive data (health records, state secrets). HNFL ("Harvest Now, Forge Later") targets authenticity and integrity: adversaries capture signed artifacts (firmware, certificates, code-signing blobs) today, then forge or repudiate those signatures later using a CRQC. HNDL demands migrating key-exchange algorithms (ML-KEM); HNFL demands migrating signing algorithms (ML-DSA, SLH-DSA). Both require action before quantum computers arrive.',
    workshopStep: null,
  },
  {
    q: "Why does Shor's Algorithm break RSA but not lattice-based cryptography like ML-KEM?",
    hint: "Shor's exploits the hidden periodicity in modular exponentiation — this is specific to factoring and discrete logarithm problems. Lattice problems like Learning With Errors (LWE) have no such algebraic structure. Try the lattice visualizer in Workshop Step 1 to see how adding dimensions makes the problem exponentially harder — even for a quantum computer.",
    workshopStep: 0,
  },
  {
    q: "Why is doubling the hash size a sufficient defense against Grover's Algorithm?",
    hint: "Grover's provides a quadratic speedup: it reduces a 2^n search to 2^(n/2). For a 256-bit hash, quantum search requires 2^128 operations — still computationally infeasible. This is fundamentally different from Shor's exponential speedup against RSA. Explore the hash-based visualization in Workshop Step 1 to compare the bars.",
    workshopStep: 0,
  },
  {
    q: 'Which NIST-standardised algorithm provides key encapsulation, and which provide digital signatures?',
    hint: 'ML-KEM (FIPS 203) handles key encapsulation. ML-DSA (FIPS 204) and SLH-DSA (FIPS 205) provide digital signatures. You can see all three in the Workshop comparison table.',
    workshopStep: 1,
  },
  {
    q: 'What mathematical problem does ML-KEM rely on, and why is it hard for quantum computers?',
    hint: "ML-KEM is based on the Module Learning With Errors (M-LWE) problem. Unlike RSA/ECC, there is no known quantum algorithm (including Grover's or Shor's) that solves LWE efficiently. See the Workshop Step 2 callout for a fuller explanation.",
    workshopStep: 1,
  },
  {
    q: 'In the Workshop comparison table, what is the public key size difference between ECC P-256 and ML-KEM-768?',
    hint: 'An ECC P-256 public key is 64 bytes; an ML-KEM-768 public key is 1,184 bytes — roughly 18× larger. You can also generate an ECC key in Workshop Step 3 and compare it live.',
    workshopStep: 2,
  },
]

export const PQC101Exercises: React.FC<PQC101ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        After reading the Learn section and exploring the Workshop, test your understanding with
        these review questions.
      </p>

      {EXERCISES.map((exercise, idx) => (
        <div key={idx} className="glass-panel p-6">
          <p className="font-semibold text-foreground mb-3">
            {idx + 1}. {exercise.q}
          </p>
          <details className="text-sm text-muted-foreground">
            <summary className="text-primary hover:underline cursor-pointer select-none">
              Show hint
            </summary>
            <p className="mt-2 leading-relaxed pl-4 border-l-2 border-primary/30">
              {exercise.hint}
            </p>
          </details>
          {exercise.workshopStep !== null && (
            <Button
              variant="ghost"
              onClick={() => {
                onSetWorkshopConfig({ step: exercise.workshopStep as number })
                onNavigateToWorkshop()
              }}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Explore in Workshop → Step {exercise.workshopStep + 1}
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
