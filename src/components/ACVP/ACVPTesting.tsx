import { useState } from 'react'
import { FileJson, Play, CheckCircle, XCircle } from 'lucide-react'
import clsx from 'clsx'
import type { Key } from '../../types'
import mlkemTestVectors from '../../data/acvp/mlkem_test.json'
import mldsaTestVectors from '../../data/acvp/mldsa_test.json'
import { hexToBytes } from '../../utils/dataInputUtils'
import * as MLKEM_LIBOQS from '../../wasm/liboqs_kem'
import * as MLDSA from '../../wasm/liboqs_dsa'

interface ACVPTestingProps {
  keyStore: Key[]
  setKeyStore: React.Dispatch<React.SetStateAction<Key[]>>
}

interface TestResult {
  id: string
  algorithm: string
  testCase: string
  status: 'pass' | 'fail' | 'pending'
  details: string
}

export const ACVPTesting = ({ keyStore, setKeyStore }: ACVPTestingProps) => {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  const importKeys = () => {
    addLog('Importing ACVP Test Keys...')
    const newKeys: Key[] = []
    // const timestamp = new Date().toLocaleTimeString([], { hour12: false });

    // Import ML-KEM Keys (One per size)
    mlkemTestVectors.testGroups.forEach((group) => {
      const test = group.tests[0] // Take first test case
      const size = group.parameterSet.split('-')[2]

      // Public Key
      newKeys.push({
        id: `acvp-pk-mlkem-${size}`,
        name: `ACVP ML-KEM-${size} Public Key`,
        type: 'public',
        algorithm: 'ML-KEM',
        value: test.pk,
        data: hexToBytes(test.pk),
        dataType: 'binary',
        timestamp: Date.now(),
      })

      // Private Key
      newKeys.push({
        id: `acvp-sk-mlkem-${size}`,
        name: `ACVP ML-KEM-${size} Private Key`,
        type: 'private',
        algorithm: 'ML-KEM',
        value: test.sk,
        data: hexToBytes(test.sk),
        dataType: 'binary',
        timestamp: Date.now(),
      })
    })

    // Import ML-DSA Keys (One per size)
    mldsaTestVectors.testGroups.forEach((group) => {
      const test = group.tests[0]
      const size = group.parameterSet.split('-')[2]

      newKeys.push({
        id: `acvp-pk-mldsa-${size}`,
        name: `ACVP ML-DSA-${size} Public Key`,
        type: 'public',
        algorithm: 'ML-DSA',
        value: test.pk,
        data: hexToBytes(test.pk),
        dataType: 'binary',
        timestamp: Date.now(),
      })

      newKeys.push({
        id: `acvp-sk-mldsa-${size}`,
        name: `ACVP ML-DSA-${size} Private Key`,
        type: 'private',
        algorithm: 'ML-DSA',
        value: test.sk,
        data: hexToBytes(test.sk),
        dataType: 'binary',
        timestamp: Date.now(),
      })
    })

    // Filter out duplicates if already imported
    const uniqueNewKeys = newKeys.filter((nk) => !keyStore.some((k) => k.id === nk.id))

    if (uniqueNewKeys.length > 0) {
      setKeyStore((prev) => [...prev, ...uniqueNewKeys])
      addLog(`Imported ${uniqueNewKeys.length} new ACVP keys.`)
    } else {
      addLog('ACVP keys already imported.')
    }
  }

  const runTests = async () => {
    setLoading(true)
    setResults([])
    setLogs([])
    addLog('Starting ACVP Validation Suite...')

    const newResults: TestResult[] = []

    try {
      // ML-KEM Tests
      for (const group of mlkemTestVectors.testGroups) {
        const test = group.tests[0]
        const algo = group.parameterSet
        addLog(`Testing ${algo}...`)

        try {
          // 1. Encapsulate (using imported PK)
          // Note: We can't strictly validate Encapsulate against KAT unless we can force the randomness.
          // But we can validate Decapsulate using the KAT ciphertext.

          // Decapsulate Test (KAT)
          const skBytes = hexToBytes(test.sk)
          const ctBytes = hexToBytes(test.ct)
          const expectedSsBytes = hexToBytes(test.ss)

          const recoveredSs = await MLKEM_LIBOQS.decapsulateBits({ name: algo }, skBytes, ctBytes)

          // Compare
          // eslint-disable-next-line security/detect-object-injection
          const matches = recoveredSs.every((b: number, i: number) => b === expectedSsBytes[i])

          newResults.push({
            id: `test-${algo}-decap`,
            algorithm: algo,
            testCase: 'Decapsulate (KAT)',
            status: matches ? 'pass' : 'fail',
            details: matches
              ? 'Recovered shared secret matches KAT'
              : 'Recovered shared secret mismatch',
          })
          addLog(`${algo} Decapsulate: ${matches ? 'PASS' : 'FAIL'}`)
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          newResults.push({
            id: `test-${algo}-err`,
            algorithm: algo,
            testCase: 'Validation Error',
            status: 'fail',
            details: errorMessage,
          })
          addLog(`${algo} Error: ${errorMessage}`)
        }
      }

      // ML-DSA Tests
      for (const group of mldsaTestVectors.testGroups) {
        const test = group.tests[0]
        const algo = group.parameterSet
        addLog(`Testing ${algo}...`)

        try {
          // Verify Test (KAT)
          const pkBytes = hexToBytes(test.pk)
          const msgBytes = hexToBytes(test.msg)
          const sigBytes = hexToBytes(test.sig)

          const isValid = await MLDSA.verify(sigBytes, msgBytes, pkBytes)

          newResults.push({
            id: `test-${algo}-verify`,
            algorithm: algo,
            testCase: 'Verify (KAT)',
            status: isValid ? 'pass' : 'fail',
            details: isValid
              ? 'Signature verification successful'
              : 'Signature verification failed',
          })
          addLog(`${algo} Verify: ${isValid ? 'PASS' : 'FAIL'}`)
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          newResults.push({
            id: `test-${algo}-err`,
            algorithm: algo,
            testCase: 'Validation Error',
            status: 'fail',
            details: errorMessage,
          })
          addLog(`${algo} Error: ${errorMessage}`)
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      addLog(`Critical Error: ${errorMessage}`)
    } finally {
      setResults(newResults)
      setLoading(false)
      addLog('Validation Suite Completed.')
    }
  }

  return (
    <div className="glass-panel p-6 h-[85vh] flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <CheckCircle className="text-success" aria-hidden="true" />
          ACVP Automated Testing
        </h3>
        <div className="flex gap-3">
          <button
            onClick={importKeys}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <FileJson size={18} /> Import Test Keys
          </button>
          <button
            onClick={runTests}
            className="btn-primary flex items-center gap-2"
            disabled={loading}
          >
            <Play size={18} /> Run Validation Suite
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Results Column */}
        <div className="space-y-4 flex flex-col min-h-0">
          <h4 className="font-bold text-muted-foreground uppercase tracking-wider">Test Results</h4>
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-muted-foreground uppercase text-xs sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="p-3 font-bold">Algorithm</th>
                  <th className="p-3 font-bold">Test Case</th>
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 font-bold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-foreground/30 italic">
                      No results yet. Run the validation suite.
                    </td>
                  </tr>
                ) : (
                  results.map((res) => (
                    <tr key={res.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-medium text-foreground">{res.algorithm}</td>
                      <td className="p-3 text-muted-foreground">{res.testCase}</td>
                      <td className="p-3">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded text-[10px] uppercase font-bold flex items-center gap-1 w-fit',
                            res.status === 'pass'
                              ? 'bg-success/20 text-success'
                              : 'bg-destructive/20 text-destructive'
                          )}
                        >
                          {res.status === 'pass' ? (
                            <CheckCircle size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {res.status}
                        </span>
                      </td>
                      <td
                        className="p-3 text-muted-foreground truncate max-w-[200px]"
                        title={res.details}
                      >
                        {res.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Logs Column */}
        <div className="space-y-4 flex flex-col min-h-0">
          <h4 className="font-bold text-muted-foreground uppercase tracking-wider">
            Execution Log
          </h4>
          <div className="bg-muted/50 border border-white/10 rounded-lg p-4 font-mono text-xs text-success/80 overflow-y-auto custom-scrollbar flex-1">
            {logs.length === 0 ? (
              <span className="text-foreground/20 italic">Ready to start...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
