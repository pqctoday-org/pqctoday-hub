// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

interface ExercisesProps {
  onNavigateToWorkshop: () => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
}

// Each exercise names the workshop scenario to pick inside the one workshop step
// ("FHE + HSM Flows"); what to observe restates what that scenario's own text says.
const SCENARIOS: Scenario[] = [
  {
    id: 'ckks-where-it-breaks',
    title: '1. Where CKKS single-HSM custody breaks — find the step that does not scale',
    description:
      'In FHE + HSM Flows, select "CKKS single-HSM custody". Walk the steps until you reach the one titled "Export the evaluation keys: where this model breaks", then read the scenario\'s scaling note.',
    badge: 'Custody',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    observe:
      'The relinearization, rotation and bootstrapping keys are public, but each one encrypts something derived from the secret key, so only the HSM can make them. A bootstrappable CKKS set is gigabytes (estimated at about 1.5–5 GB even with seeded compression), far beyond what one HSM can hold or return through PKCS#11. The scenario is kept as a counter-example, and the planned engine refuses the export by design.',
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
  },
  {
    id: 'what-runs-in-the-hsm',
    title: '4. What can run in the HSM? — which FHE operations fit?',
    description:
      'Select "What can run in the HSM?" and note, for each FHE operation, whether it fits inside an HSM, is limited by size, or does not fit.',
    badge: 'Placement',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    observe:
      'Seed and secret-key generation and decryption fit: small inputs and milliseconds of compute. Evaluation-key generation is size-limited: a TFHE server key of about 30 MB fits, a CKKS bootstrapping key set does not. Homomorphic evaluation and bootstrapping do not run in the HSM: they need gigabytes of keys in memory plus GPU or FPGA acceleration, and they need no secret, so running them in the HSM would add nothing but load.',
  },
  {
    id: 'transciphering-kreyvium',
    title: '5. Transciphering with Kreyvium — why upload the stream cipher, not FHE ciphertexts',
    description:
      'Select "Transciphering: TFHE-rs Kreyvium". Follow the data from the client to the server and note what the client uploads, what the server runs, and what it gets back.',
    badge: 'Transciphering',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    observe:
      "The client uploads data encrypted with the Kreyvium stream cipher, plus its Kreyvium key encrypted under FHE once. The server runs the keystream inside FHE and ends with FHE ciphertexts it never saw in the clear. Uploads stay at plaintext size instead of FHE size, which can be a thousand times larger or more. Use Kreyvium's 128-bit key: Trivium's 80-bit key is already below the 112-bit minimum before Grover.",
  },
]

export const FheExercises: React.FC<ExercisesProps> = ({ onNavigateToWorkshop }) => {
  const navigate = useNavigate()

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these scenarios to see how FHE keys, ciphertexts and decryption requests move
          between a data owner, an HSM and an untrusted cloud. Each exercise names the scenario to
          pick in the FHE + HSM Flows workshop &mdash; click &quot;Open Workshop&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {SCENARIOS.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
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
                <p className="text-xs text-muted-foreground">
                  <strong>What to observe:</strong> {scenario.observe}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={onNavigateToWorkshop}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Open Workshop
              </Button>
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
