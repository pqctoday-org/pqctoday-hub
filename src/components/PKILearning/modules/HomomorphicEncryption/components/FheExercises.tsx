// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Play, BookOpen, ArrowRight, Eye } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useLearnPathFilter } from '@/components/PKILearning/common/useLearnPath'
import type { PathScoped } from '@/components/PKILearning/manifest/types'

interface ExercisesProps {
  onNavigateToWorkshop: (step?: number) => void
  /** opens the Learn tab, for the exercises that work from the Learn sections */
  onNavigateToLearn?: () => void
}

interface Scenario extends PathScoped {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  /** where the exercise is worked: the workshop (default) or the Learn tab */
  target?: 'workshop' | 'learn'
  workshopStep?: number
}

// Exercises 1–5 name the workshop scenario to pick inside the one workshop step
// ("FHE + HSM Flows"); what to observe restates what that scenario's own text says.
// Exercises 6–8 work from the Learn sections; the answer restates what those
// sections say.
const SCENARIOS: Scenario[] = [
  {
    id: 'ckks-where-it-breaks',
    title: '1. CKKS single-HSM custody — find the heaviest step and what limits it',
    description:
      'In FHE + HSM Flows, select "CKKS single-HSM custody". Walk the steps until you reach the one titled "Stream the evaluation keys: the heaviest step", open its details and evidence, then read the scenario\'s scaling note.',
    badge: 'Custody',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    observe:
      'The relinearization, rotation and bootstrapping keys are public, but each one encrypts something derived from the secret key, so only the HSM can make them. A bootstrappable CKKS set is 7.87 GB, 3.94 GB as exported (measured): too large for an HSM to hold, so it streams the set out in 1,001 bounded PKCS#11 calls with a token peak of about 16 MiB. What limits the step is CPU time, not memory or the PKCS#11 interface: 473 s on one MX95 Cortex-A55 core, 42–44 s on one Mac core, with the network adding about 5 %. Letting the token cache work between calls cuts it to 214 s on one MX95 core and 72–84 s on six MX95 Pro cores, at the cost of more token memory (65–124 MiB). It is a one-time cost per key set, paid again on rotation or recovery.',
    paths: ['hsm-custody'],
    workshopStep: 1,
  },
  {
    id: 'tfhe-why-it-fits',
    title: '2. Why TFHE custody fits an HSM — compare key sizes with the CKKS scenario',
    description:
      'Select "TFHE single-HSM custody" and compare what the HSM creates and exports at each step with the CKKS scenario. Note which keys stay inside the HSM and which are published.',
    badge: 'Key sizes',
    badgeColor: 'bg-status-success/20 text-status-success border-status-success/50',
    observe:
      'Every key the HSM creates is kilobytes to tens of megabytes: the secret is a few hundred bytes of key bits (tens of KB as stored), the server key is tens of MB compressed and generated in seconds, and decryption is a dot product. The trade-off is that TFHE computes on bits and small integers, so heavy numeric workloads run slower than with CKKS.',
    paths: ['hsm-custody'],
    workshopStep: 1,
  },
  {
    id: 'threshold-no-single-decryptor',
    title: '3. Threshold FHE — no single party can decrypt',
    description:
      'Open "Threshold: OpenFHE BFV (3-of-3)" and then "Threshold: Lattigo BGV (2-of-3)". For each, note how the key is generated, who must contribute to a decryption, and what replaces bootstrapping keys.',
    badge: 'Threshold',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
    observe:
      "OpenFHE's threshold extension with BFV uses additive key shares and chained key generation, and every party must contribute a partial decryption. Lattigo's multiparty protocols with BGV use t-of-N shares and collective key generation, with an interactive refresh among the key holders instead of bootstrapping keys, so no GB-scale bootstrapping keys are generated. Each party still produces a full-size share of every Galois key the application needs.",
    paths: ['hsm-custody'],
    workshopStep: 1,
  },
  {
    id: 'what-runs-in-the-hsm',
    title: '4. What can run in the HSM? — which FHE operations fit?',
    description:
      'Select "What can run in the HSM?" and note, for each FHE operation, whether it fits inside an HSM, fits only when streamed, or does not fit.',
    badge: 'Placement',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    observe:
      'Seed and secret-key generation and decryption fit: small inputs and milliseconds of compute. Evaluation-key generation fits when streamed: a TFHE server key of about 30 MB fits in one piece, and a CKKS bootstrapping key set (3.94 GB exported) streams out in bounded pieces, taking minutes on a small board core. Homomorphic evaluation and bootstrapping do not run in the HSM: they need gigabytes of keys in memory plus GPU or FPGA acceleration, and they need no secret, so running them in the HSM would add nothing but load.',
    paths: ['hsm-custody'],
    workshopStep: 1,
  },
  {
    id: 'transciphering-kreyvium',
    title: '5. Transciphering with Kreyvium — why upload the stream cipher, not FHE ciphertexts',
    description:
      'Select "Transciphering: TFHE-rs Kreyvium". Follow the data from the client to the server and note what the client uploads, what the server runs, and what it gets back.',
    badge: 'Transciphering',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    observe:
      "The client uploads data encrypted with the Kreyvium stream cipher, plus its Kreyvium key encrypted under FHE once. The server runs the keystream inside FHE and ends with FHE ciphertexts it never saw in the clear. Uploads stay at plaintext size instead of FHE size, which can be a thousand times larger or more. Use Kreyvium's 128-bit key: Trivium's 80-bit key falls below the federal minimum of 112 bits of security strength for applying cryptographic protection before Grover.",
    paths: ['hsm-custody'],
    workshopStep: 1,
  },
  {
    id: 'read-noisy-ckks-result',
    title: '6. Read a noisy CKKS result — decide what precision to report',
    description:
      'In the Learn tab, open "Schemes, Data Types and Noisy Results" and find the illustration under "Reading a noisy CKKS result: rounding". The encrypted input was 3.14159265 and decryption returned 3.1415926481. Decide how many digits you would report, and what changes if the result goes to someone other than the key owner.',
    badge: 'Noise',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    observe:
      'The last digits of a CKKS result are noise, so report it rounded to a precision you trust: rounded to 20 bits (multiples of 2^-20 ≈ 0.00000095) it reads 3.141593 to six decimals. Rounding removes low-order noise bits but cannot recover bits the noise has already destroyed. If the result goes to others, rounding alone is not enough: decrypted CKKS results seen by others can lead to key recovery, and the research countermeasure, noise flooding, costs further precision. At the default parameters flooding for third parties leaves no correct bits (−12.8 bits in the noise-study emulation, and the token refuses the release); a second parameter set with higher-precision bootstrapping keeps 11.1–11.4 bits against a bar of 10 bits, measured with the corrected flood width on a Mac and with the token on both MX95 boards: a thin margin, set by the published sizing.',
    target: 'learn',
  },
  {
    id: 'pick-a-scheme',
    title: '7. Pick a scheme for three use cases',
    description:
      'Using "Which scheme for which data" in the Learn tab, pick a scheme for each: (a) counting how many encrypted records match a condition, exactly; (b) running a machine-learning model on encrypted real-valued measurements; (c) comparing encrypted values and branching on the result, or evaluating a lookup table.',
    badge: 'Schemes',
    badgeColor: 'bg-status-success/20 text-status-success border-status-success/50',
    observe:
      '(a) BFV or BGV: exact integer arithmetic; Microsoft SEAL notes that where exact values are necessary these schemes are more suitable. (b) CKKS: approximate arithmetic on real numbers, suited to evaluating machine-learning models; read the results to a trusted precision. (c) TFHE: it evaluates functions through lookup tables during bootstrapping, while with BFV, BGV and CKKS encrypted comparison is in most cases not feasible.',
    target: 'learn',
  },
  {
    id: 'check-a-compliance-claim',
    title: '8. Check a compliance claim — “our FHE service is FIPS 140-3 validated”',
    description:
      'A vendor writes: "Our FHE service is FIPS 140-3 validated." Using "Standards and Compliance" in the Learn tab, decide what part of that claim can be true and what question you would ask the vendor.',
    badge: 'Compliance',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    observe:
      'Only the conventional cryptography around the service can be validated: TLS, AES, key wrapping, signatures and random number generation in a FIPS 140-3 module. FHE is not among the approved security functions (NIST SP 800-140C), and a non-approved function does not run in a module’s approved mode. Ask for the CMVP certificate number and check which algorithms it lists: the certificate of an FHE-related product (#5175) lists only conventional algorithms.',
    target: 'learn',
  },
]

export const FheExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onNavigateToLearn,
}) => {
  const navigate = useNavigate()
  const scenarios = useLearnPathFilter(SCENARIOS, 'homomorphic-encryption')
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Predict the outcome first, try the linked interaction or Learn section, then reveal the
          explanation. The foundations path focuses on noise, scheme choice and assurance claims;
          the advanced path adds custody, threshold operation and transciphering.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{scenario.description}</p>
                <p className="text-xs font-semibold text-primary">
                  Predict first: what result do you expect, and why?
                </p>
                {revealed.has(scenario.id) && (
                  <p className="mt-2 text-xs text-muted-foreground" role="status">
                    <strong className="text-foreground">Explanation:</strong> {scenario.observe}
                  </p>
                )}
              </div>
              <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
                {scenario.target === 'learn' ? (
                  onNavigateToLearn && (
                    <Button
                      variant="ghost"
                      onClick={onNavigateToLearn}
                      className="flex items-center gap-2"
                    >
                      <BookOpen size={14} /> Open Learn
                    </Button>
                  )
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => onNavigateToWorkshop(scenario.workshopStep)}
                    className="flex items-center gap-2"
                  >
                    <Play size={14} fill="currentColor" /> Open Workshop
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() =>
                    setRevealed((current) => {
                      const next = new Set(current)
                      if (next.has(scenario.id)) next.delete(scenario.id)
                      else next.add(scenario.id)
                      return next
                    })
                  }
                  aria-expanded={revealed.has(scenario.id)}
                  className="gap-2"
                >
                  <Eye size={14} />{' '}
                  {revealed.has(scenario.id) ? 'Hide explanation' : 'Reveal explanation'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Link */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to test what you&apos;ve learned about homomorphic encryption and
                HSM key custody.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
