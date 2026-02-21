import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Loader2, Check, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useModuleStore } from '../../../../store/useModuleStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PQC101Module } from './PQC101Module'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { openSSLService } from '../../../../services/crypto/OpenSSLService'

const MODULE_ID = 'introduction'

// NIST-specified key and output sizes (bytes)
const ALGO_DATA = [
  {
    name: 'RSA-2048',
    type: 'KEM + Sig',
    quantumSafe: false,
    nistStd: '—',
    pubKeyB: 256,
    privKeyB: 1192,
    outputB: 256,
    level: 'Classical',
    note: "Broken by Shor's Algorithm on a sufficiently large quantum computer.",
    opensslCmd: 'openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.key',
    outputFile: 'private.key',
  },
  {
    name: 'ECC P-256',
    type: 'KEM + Sig',
    quantumSafe: false,
    nistStd: 'FIPS 186-5',
    pubKeyB: 64,
    privKeyB: 32,
    outputB: 64,
    level: 'Classical',
    note: "Broken by Shor's Algorithm. Widely used today in TLS, SSH, and code signing.",
    opensslCmd: 'openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out private.key',
    outputFile: 'private.key',
  },
  {
    name: 'ML-KEM-768',
    type: 'KEM',
    quantumSafe: true,
    nistStd: 'FIPS 203',
    pubKeyB: 1184,
    privKeyB: 2400,
    outputB: 1088,
    level: 'L3 (AES-192)',
    note: 'Based on Module-LWE. No known quantum or classical algorithm breaks it efficiently.',
    opensslCmd: null,
    outputFile: null,
  },
  {
    name: 'ML-DSA-65',
    type: 'Signature',
    quantumSafe: true,
    nistStd: 'FIPS 204',
    pubKeyB: 1952,
    privKeyB: 4032,
    outputB: 3293,
    level: 'L3 (AES-192)',
    note: 'Lattice-based signature. Drop-in replacement for ECDSA in certificates and code signing.',
    opensslCmd: null,
    outputFile: null,
  },
  {
    name: 'SLH-DSA-128s',
    type: 'Signature',
    quantumSafe: true,
    nistStd: 'FIPS 205',
    pubKeyB: 32,
    privKeyB: 64,
    outputB: 7856,
    level: 'L1 (AES-128)',
    note: 'Hash-based. Tiny keys but large signatures. Stateless and conservative security assumption.',
    opensslCmd: null,
    outputFile: null,
  },
]

const fmt = (b: number) => (b >= 1000 ? `${(b / 1000).toFixed(1)} KB` : `${b} B`)

export const Module1: React.FC = () => {
  const { markStepComplete, updateModuleProgress } = useModuleStore()
  const [activeTab, setActiveTab] = useState('learn')
  const [selectedAlgo, setSelectedAlgo] = useState(0) // index into ALGO_DATA classical entries
  const [isGenerating, setIsGenerating] = useState(false)
  const [genOutput, setGenOutput] = useState('')
  const [genDone, setGenDone] = useState(false)
  const startTimeRef = useRef(0)

  const classicalAlgos = ALGO_DATA.filter((a) => !a.quantumSafe)

  useEffect(() => {
    startTimeRef.current = Date.now()
    updateModuleProgress(MODULE_ID, {
      status: 'in-progress',
      lastVisited: Date.now(),
    })

    return () => {
      const elapsedMins = (Date.now() - startTimeRef.current) / 60000
      if (elapsedMins > 0) {
        const current = useModuleStore.getState().modules[MODULE_ID]
        updateModuleProgress(MODULE_ID, {
          timeSpent: (current?.timeSpent || 0) + elapsedMins,
        })
      }
    }
  }, [updateModuleProgress])

  const handleTabChange = useCallback(
    (tab: string) => {
      markStepComplete(MODULE_ID, activeTab)
      setActiveTab(tab)
    },
    [activeTab, markStepComplete]
  )

  const navigateToWorkshop = useCallback(() => {
    markStepComplete(MODULE_ID, activeTab)
    setActiveTab('workshop')
  }, [activeTab, markStepComplete])

  const handleGenerate = async () => {
    /* eslint-disable-next-line security/detect-object-injection */
    const algo = classicalAlgos[selectedAlgo]
    if (!algo?.opensslCmd) return

    setIsGenerating(true)
    setGenOutput(`$ ${algo.opensslCmd}\n`)
    setGenDone(false)

    try {
      const result = await openSSLService.execute(algo.opensslCmd)
      if (result.error) {
        setGenOutput((prev) => prev + `Error: ${result.error}\n`)
        return
      }

      const keyFile = result.files.find((f) => f.name === algo.outputFile)
      if (keyFile) {
        const keyContent = new TextDecoder().decode(keyFile.data)
        // Extract just the public key too
        const pubCmd = 'openssl pkey -in private.key -pubout -out public.key'
        setGenOutput((prev) => prev + `\nKey generated successfully!\n\n$ ${pubCmd}\n`)
        const pubResult = await openSSLService.execute(pubCmd, [keyFile])
        const pubFile = pubResult.files.find((f) => f.name === 'public.key')
        const pubContent = pubFile ? new TextDecoder().decode(pubFile.data) : ''
        setGenOutput((prev) => prev + pubContent + '\n' + keyContent)
        setGenDone(true)
        markStepComplete(MODULE_ID, 'workshop-keygen')
      }
    } catch (err) {
      setGenOutput(
        (prev) => prev + `Error: ${err instanceof Error ? err.message : 'Unknown error'}\n`
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient">PQC 101: Introduction</h1>
        <p className="text-muted-foreground mt-2">
          Understand the quantum threat, explore NIST PQC standards, and compare classical vs
          post-quantum cryptography.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
        </TabsList>

        {/* Learn Tab */}
        <TabsContent value="learn">
          <PQC101Module />
          <div className="mt-6 flex justify-end">
            <button
              onClick={navigateToWorkshop}
              className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Workshop &rarr;
            </button>
          </div>
        </TabsContent>

        {/* Workshop Tab */}
        <TabsContent value="workshop">
          <div className="space-y-8">
            {/* Section 1: Comparison Table */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Classical vs Post-Quantum: Algorithm Comparison
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Compare key sizes, output sizes, and quantum resilience across the major algorithm
                  families. This table directly supports Exercise 5.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-semibold text-foreground">
                        Algorithm
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Type</th>
                      <th className="text-center px-4 py-3 font-semibold text-foreground">
                        Quantum-Safe
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">
                        NIST Std
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-foreground">
                        Public Key
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-foreground">
                        Private Key
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-foreground">
                        Ciphertext / Sig
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALGO_DATA.map((algo, idx) => (
                      <tr
                        key={algo.name}
                        className={`border-b border-border last:border-0 transition-colors ${
                          algo.quantumSafe
                            ? 'bg-success/5 hover:bg-success/10'
                            : 'bg-destructive/5 hover:bg-destructive/10'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-foreground">
                            {algo.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{algo.type}</td>
                        <td className="px-4 py-3 text-center">
                          {algo.quantumSafe ? (
                            <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                              <ShieldCheck size={14} /> Safe
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-destructive text-xs font-semibold">
                              <ShieldAlert size={14} /> Vulnerable
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {algo.nistStd}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono tabular-nums ${idx === 1 ? 'font-bold text-primary' : 'text-foreground'}`}
                        >
                          {fmt(algo.pubKeyB)}
                          {idx === 1 && <span className="text-xs text-primary ml-1">↑</span>}
                          {algo.name === 'ML-KEM-768' && (
                            <span className="text-xs text-success ml-1">↑</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                          {fmt(algo.privKeyB)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                          {fmt(algo.outputB)}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{algo.level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Exercise 5 callout */}
              <div className="glass-panel p-4 border-l-4 border-l-primary bg-primary/5">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Exercise 5 preview:</span> ECC P-256 has a{' '}
                  <span className="font-mono font-bold text-primary">{fmt(64)}</span> public key.
                  ML-KEM-768 has a{' '}
                  <span className="font-mono font-bold text-success">{fmt(1184)}</span> public key —
                  roughly <span className="font-bold">18× larger</span>. This size increase is the
                  main migration cost of PQC.
                </p>
              </div>

              {/* Exercise 4 callout — M-LWE explanation */}
              <div className="glass-panel p-5 border-l-4 border-l-success">
                <h3 className="font-semibold text-foreground mb-2">
                  Why is ML-KEM quantum-resistant?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ML-KEM is built on the{' '}
                  <strong className="text-foreground">Module Learning With Errors (M-LWE)</strong>{' '}
                  problem. RSA relies on integer factorisation — solvable by Shor&apos;s Algorithm
                  on a quantum computer. ECC relies on the discrete logarithm — same problem. M-LWE
                  is fundamentally different: no known algorithm (quantum or classical) solves it
                  efficiently. This is why NIST chose lattice-based cryptography as the primary PQC
                  standard.
                </p>
              </div>
            </div>

            {/* Section 2: Try It — Generate a Classical Key */}
            <div className="glass-panel p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Try It: Generate a Classical Key Pair
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate a real key pair with OpenSSL and observe how small classical keys are
                  compared to the ML-KEM-768 row above.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="space-y-1">
                  <label htmlFor="algo-select" className="text-sm text-muted-foreground">
                    Algorithm
                  </label>
                  <select
                    id="algo-select"
                    value={selectedAlgo}
                    onChange={(e) => {
                      setSelectedAlgo(Number(e.target.value))
                      setGenOutput('')
                      setGenDone(false)
                    }}
                    className="bg-muted/30 border border-border rounded px-3 py-2 text-foreground text-sm"
                  >
                    {classicalAlgos.map((algo, idx) => (
                      <option key={algo.name} value={idx}>
                        {algo.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isGenerating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Play size={16} />
                  )}
                  Generate Key Pair
                </button>
              </div>

              {genOutput && (
                <div className="bg-black/40 rounded-lg p-4 font-mono text-xs border border-border overflow-y-auto max-h-64 custom-scrollbar">
                  <pre className="text-green-400 whitespace-pre-wrap">{genOutput}</pre>
                </div>
              )}

              {genDone && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-success/10 border border-success/30">
                  <Check size={18} className="text-success shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">
                      {/* eslint-disable-next-line security/detect-object-injection */}
                      Generated {classicalAlgos[selectedAlgo].name} key pair
                    </p>
                    <p className="text-muted-foreground mt-1">
                      The public key above is {}
                      <strong className="text-primary">
                        {fmt(classicalAlgos[selectedAlgo].pubKeyB)}
                      </strong>
                      . Scroll up to compare with{' '}
                      <strong className="text-success">ML-KEM-768 (1,184 B)</strong> — now you have
                      a concrete sense of the size difference Exercise 5 asks about.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                PQC key generation requires specialised WASM libraries. The sizes shown in the table
                for ML-KEM and ML-DSA are NIST-specified constants — not approximations.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Exercises Tab */}
        <TabsContent value="exercises">
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              After reading the Learn section and exploring the Workshop comparison table, test your
              understanding with these review questions.
            </p>

            {[
              {
                q: "Why can't classical computers break RSA-2048 in reasonable time, but quantum computers could?",
                hint: "Classical computers require exponential time to factor large integers. Shor's Algorithm on a sufficiently powerful quantum computer reduces integer factorisation to polynomial time — making RSA-2048 breakable.",
              },
              {
                q: 'What is the difference between HNDL and HNFL, and which types of assets does each threaten?',
                hint: 'HNDL ("Harvest Now, Decrypt Later") targets confidentiality: adversaries collect encrypted ciphertext today and decrypt it once a CRQC exists — threatening any long-lived sensitive data (health records, state secrets). HNFL ("Harvest Now, Forge Later") targets authenticity and integrity: adversaries capture signed artifacts (firmware, certificates, code-signing blobs) today, then forge or repudiate those signatures later using a CRQC. HNDL demands migrating key-exchange algorithms (ML-KEM); HNFL demands migrating signing algorithms (ML-DSA, SLH-DSA). Both require action before quantum computers arrive.',
              },
              {
                q: 'Which NIST-standardised algorithm provides key encapsulation, and which provide digital signatures?',
                hint: 'ML-KEM (FIPS 203) handles key encapsulation. ML-DSA (FIPS 204) and SLH-DSA (FIPS 205) provide digital signatures. You can see all three in the Workshop comparison table.',
              },
              {
                q: 'What mathematical problem does ML-KEM rely on, and why is it hard for quantum computers?',
                hint: "ML-KEM is based on the Module Learning With Errors (M-LWE) problem. Unlike RSA/ECC, there is no known quantum algorithm (including Grover's or Shor's) that solves LWE efficiently. See the Workshop callout for a fuller explanation.",
              },
              {
                q: 'In the Workshop comparison table, what is the public key size difference between ECC P-256 and ML-KEM-768?',
                hint: 'An ECC P-256 public key is 64 bytes; an ML-KEM-768 public key is 1,184 bytes — roughly 18× larger. You can also generate an ECC key in the Workshop and compare it live.',
              },
            ].map((exercise, idx) => (
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
              </div>
            ))}
          </div>
        </TabsContent>

        {/* References Tab */}
        <TabsContent value="references">
          <ModuleReferencesTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
