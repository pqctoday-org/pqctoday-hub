// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Play, CheckCircle, XCircle } from 'lucide-react'
import clsx from 'clsx'
import mlkemTestVectors from '../../../data/acvp/mlkem_test.json'
import { hexToBytes } from '../../../utils/dataInputUtils'
import {
  hsm_initialize, hsm_finalize, hsm_getFirstSlot, hsm_initToken, hsm_openUserSession,
  hsm_generateAESKey, hsm_aesEncrypt,
  hsm_generateHMACKey, hsm_hmac,
  hsm_generateRSAKeyPair, hsm_rsaSign,
  hsm_generateECKeyPair, hsm_ecdsaSign,
  hsm_encapsulate,
  hsm_generateMLDSAKeyPair, hsm_sign,
} from '../../../wasm/softhsm'
import type { SoftHSMModule } from '../../../wasm/softhsm'
import { useHsmContext } from './HsmContext'

interface TestResult {
  id: string
  algorithm: string
  testCase: string
  status: 'pass' | 'fail' | 'pending'
  details: string
}

export const HsmAcvpTesting = () => {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const { moduleRef, crossCheckModuleRef, engineMode, hSessionRef, phase, addHsmLog } = useHsmContext()

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  const runTests = async () => {
    if (!moduleRef.current || phase !== 'session_open') {
      addLog('Error: HSM Session not open.')
      return
    }

    setLoading(true)
    setResults([])
    setLogs([])
    addLog('Starting ACVP Validation Suite via PKCS#11...')

    const newResults: TestResult[] = []

    const engines: Array<{ M: SoftHSMModule; name: string; hSession: number }> = []
    if (engineMode === 'cpp') {
      engines.push({ M: moduleRef.current, name: 'C++', hSession: 0 })
    } else if (engineMode === 'rust') {
      engines.push({ M: moduleRef.current, name: 'Rust', hSession: 0 })
    } else if (engineMode === 'dual') {
      engines.push({ M: moduleRef.current, name: 'C++', hSession: 0 })
      if (crossCheckModuleRef.current) {
        engines.push({ M: crossCheckModuleRef.current, name: 'Rust', hSession: 0 })
      }
    }

    try {
      const ACVP_GLOBAL_SEED = new Uint8Array(32).fill(0xAC)

      // Restart HSM into strict ACVP mode with seed injection
      for (const engine of engines) {
        try {
          hsm_finalize(engine.M, hSessionRef.current)
        } catch {
          // Ignore invalid session handle during cross-engine shutdown
        }
        hsm_initialize(engine.M, ACVP_GLOBAL_SEED)
        const slot = hsm_getFirstSlot(engine.M)
        hsm_initToken(engine.M, slot, '12345678', 'ACVP_Token')
        engine.hSession = hsm_openUserSession(engine.M, slot, '12345678', 'user1234')
      }

      for (const engine of engines) {
        const M = engine.M
        const eName = engine.name
        const hSession = engine.hSession

        // 1. AES-GCM (SP 800-38D)
        addLog(`[${eName}] Testing AES-GCM-256 (SP 800-38D)...`)
        try {
          const aesKey = hsm_generateAESKey(M, hSession, 256)
          hsm_aesEncrypt(M, hSession, aesKey, new Uint8Array(16), 'gcm')
          const isVerified = false // Gap: No offline vector
          if (!isVerified) throw new Error("Validation Discrepancy: Missing SP 800-38D reference vectors to assert C_Encrypt accuracy.")
          newResults.push({ id: `aes-acvp-${eName}`, algorithm: `AES-GCM-256 (${eName})`, testCase: 'ACVP Mock Encryption', status: 'pass', details: 'WASM C_Encrypt validated.' })
        } catch (e: unknown) {
          const errMessage = e instanceof Error ? e.message : String(e)
          newResults.push({ id: `aes-err-${eName}`, algorithm: `AES-GCM-256 (${eName})`, testCase: 'ACVP Vector Error', status: 'fail', details: errMessage })
          addLog(`[DISCREPANCY] [${eName}] AES-GCM: ${errMessage}`)
        }

        // 2. HMAC-SHA256 (FIPS 198-1)
        addLog(`[${eName}] Testing HMAC-SHA256 (FIPS 198-1)...`)
        try {
          const hmacKey = hsm_generateHMACKey(M, hSession, 32)
          hsm_hmac(M, hSession, hmacKey, new Uint8Array(32))
          const isVerified = false
          if (!isVerified) throw new Error("Validation Discrepancy: Missing FIPS 198-1 HMAC reference vectors.")
          newResults.push({ id: `hmac-acvp-${eName}`, algorithm: `HMAC-SHA256 (${eName})`, testCase: 'ACVP Mock Digest', status: 'pass', details: 'WASM HMAC Sign validated.' })
        } catch (e: unknown) {
          const errMessage = e instanceof Error ? e.message : String(e)
          newResults.push({ id: `hmac-err-${eName}`, algorithm: `HMAC-SHA256 (${eName})`, testCase: 'ACVP Vector Error', status: 'fail', details: errMessage })
          addLog(`[DISCREPANCY] [${eName}] HMAC-SHA256: ${errMessage}`)
        }

        // 3. RSA-PSS (FIPS 186-5)
        addLog(`[${eName}] Testing RSA-PSS 2048 (FIPS 186-5)...`)
        try {
          const rsaPair = hsm_generateRSAKeyPair(M, hSession, 2048)
          hsm_rsaSign(M, hSession, rsaPair.privHandle, "ACVP NIST validation test")
          const isVerified = false
          if (!isVerified) throw new Error("Validation Discrepancy: Missing FIPS 186-5 RSA reference vectors.")
          newResults.push({ id: `rsa-acvp-${eName}`, algorithm: `RSA-PSS-2048 (${eName})`, testCase: 'ACVP Mock Signature', status: 'pass', details: 'WASM RSA Sign validated.' })
        } catch (e: unknown) {
          const errMessage = e instanceof Error ? e.message : String(e)
          newResults.push({ id: `rsa-err-${eName}`, algorithm: `RSA-PSS-2048 (${eName})`, testCase: 'ACVP Vector Error', status: 'fail', details: errMessage })
          addLog(`[DISCREPANCY] [${eName}] RSA-PSS-2048: ${errMessage}`)
        }

        // 4. ECDSA P-256 (FIPS 186-5)
        addLog(`[${eName}] Testing ECDSA P-256 (FIPS 186-5)...`)
        try {
          const ecPair = hsm_generateECKeyPair(M, hSession, 'P-256')
          hsm_ecdsaSign(M, hSession, ecPair.privHandle, "ACVP NIST validation test")
          const isVerified = false
          if (!isVerified) throw new Error("Validation Discrepancy: Missing FIPS 186-5 ECDSA reference vectors.")
          newResults.push({ id: `ecdsa-acvp-${eName}`, algorithm: `ECDSA P-256 (${eName})`, testCase: 'ACVP Mock Signature', status: 'pass', details: 'WASM ECDSA Sign validated.' })
        } catch (e: unknown) {
          const errMessage = e instanceof Error ? e.message : String(e)
          newResults.push({ id: `ecdsa-err-${eName}`, algorithm: `ECDSA P-256 (${eName})`, testCase: 'ACVP Vector Error', status: 'fail', details: errMessage })
          addLog(`[DISCREPANCY] [${eName}] ECDSA: ${errMessage}`)
        }

        // 5. ML-DSA-65 (FIPS 204)
        addLog(`[${eName}] Testing ML-DSA-65 (FIPS 204)...`)
        try {
          const mldsaPair = hsm_generateMLDSAKeyPair(M, hSession, 65)
          hsm_sign(M, hSession, mldsaPair.privHandle, "ACVP NIST PQC test")
          const isVerified = false
          if (!isVerified) throw new Error("Validation Discrepancy: ML-DSA offline JSON vectors not injected into frontend.")
          newResults.push({ id: `mldsa-acvp-${eName}`, algorithm: `ML-DSA-65 (${eName})`, testCase: 'ACVP Mock PQC Signature', status: 'pass', details: 'WASM ML-DSA C_Sign validated.' })
        } catch (e: unknown) {
          const errMessage = e instanceof Error ? e.message : String(e)
          newResults.push({ id: `mldsa-err-${eName}`, algorithm: `ML-DSA-65 (${eName})`, testCase: 'ACVP Vector Error', status: 'fail', details: errMessage })
          addLog(`[DISCREPANCY] [${eName}] ML-DSA-65: ${errMessage}`)
        }

        // ML-KEM explicitly using precise NIST JSON Reference vectors
        for (const group of mlkemTestVectors.testGroups) {
          const test = group.tests[0]
          const algo = group.parameterSet
          addLog(`[${eName}] Testing ${algo}...`)

          try {
            // Decapsulate Test (KAT) via PKCS#11
            const pkBytes = hexToBytes(test.pk)
            const ctBytes = hexToBytes(test.ct)
            const expectedSsBytes = hexToBytes(test.ss)
            const variantNum = parseInt(algo.split('-')[2]) || 768

            const { hsm_importMLKEMPublicKey, hsm_extractKeyValue } = await import('../../../wasm/softhsm')
            const pubHandle = hsm_importMLKEMPublicKey(M, hSession, variantNum as 512 | 768 | 1024, pkBytes)
            
            const result = hsm_encapsulate(M, hSession, pubHandle, variantNum as 512 | 768 | 1024)
            const ssBytes = hsm_extractKeyValue(M, hSession, result.secretHandle)
            
            // STRICT NIST VALIDATION ASSERTION
            // eslint-disable-next-line security/detect-object-injection
            const matchesCt = result.ciphertextBytes.every((b: number, i: number) => b === ctBytes[i])
            // eslint-disable-next-line security/detect-object-injection
            const matchesSs = ssBytes.every((b: number, i: number) => b === expectedSsBytes[i])

            if (!matchesCt || !matchesSs) {
              const hexCt = Array.from(result.ciphertextBytes).map(b => b.toString(16).padStart(2,'0')).join('').substring(0,64)
              const expectedHexCt = Array.from(ctBytes).map(b => b.toString(16).padStart(2,'0')).join('').substring(0,64)
              
              newResults.push({
                id: `test-${algo}-err-${eName}`,
                algorithm: `${algo} (${eName})`,
                testCase: 'Validation Error',
                status: 'fail',
                details: `Discrepancy in ACVP CT parity`,
              })
              addLog(`[DISCREPANCY] [${eName}] ${algo}: SoftHSM CT (${hexCt}...) != NIST Expected CT (${expectedHexCt}...)`)
              
              addHsmLog({
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                fn: `[${eName}] C_EncapsulateKey(${algo})`,
                args: 'ACVP Vector Validation',
                rvHex: '0x00000005',
                rvName: 'CKR_GENERAL_ERROR (ACVP MISMATCH)',
                ms: 0,
                ok: false,
              })
            } else {
              addLog(`[${eName}] ${algo} test vectors parsed successfully. Execute backend KAT suite for deep validation. (WASM boundary verified).`)
              newResults.push({
                id: `test-${algo}-kat-${eName}`,
                algorithm: `${algo} (${eName})`,
                testCase: 'Backend Encapsulate KAT',
                status: 'pass',
                details: 'WASM backend KAT executed',
              })
            }
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            newResults.push({
              id: `test-${algo}-err-${eName}`,
              algorithm: `${algo} (${eName})`,
              testCase: 'Validation Error',
              status: 'fail',
              details: errorMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] ${algo} Error: ${errorMessage}`)
            
            // Explicitly push PKCS11 Log for the Failure exactly as requested "generate error logs if discrepancies are found"
            addHsmLog({
              id: Date.now(),
              timestamp: new Date().toLocaleTimeString(),
              fn: `[${eName}] C_EncapsulateKey(${algo})`,
              args: 'ACVP Vector Validation',
              rvHex: '0x00000005',
              rvName: 'CKR_GENERAL_ERROR (ACVP MISMATCH)',
              ms: 0,
              ok: false,
            })
          }
        }
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      addLog(`Critical Error: ${errorMessage}`)
    } finally {
      // Restore standard HSM Mode for other playground tabs
      for (const engine of engines) {
        try {
          hsm_finalize(engine.M, engine.hSession)
        } catch {
          // ignore
        }
        try {
          hsm_initialize(engine.M)
          const slot = hsm_getFirstSlot(engine.M)
          hsm_initToken(engine.M, slot, '12345678', 'SoftHSM3')
          const finalSession = hsm_openUserSession(engine.M, slot, '12345678', 'user1234')
          if (engine.name === 'C++' && engineMode !== 'rust') hSessionRef.current = finalSession
          if (engine.name === 'Rust' && engineMode === 'rust') hSessionRef.current = finalSession
        } catch (err) {
          addLog(`Ambient Restore Error [${engine.name}]: ${String(err)}`)
        }
      }

      setResults(newResults)
      setLoading(false)
      addLog('Validation Suite Completed.')
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CheckCircle className="text-success" aria-hidden="true" size={20} />
            SoftHSMv3 FIPS Validation Mode (ACVP)
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Validates deterministic operations across the WASM PKCS#11 FFI using NIST CAVP target vectors.
          </p>
          <a href="https://github.com/usnistgov/ACVP-Server" target="_blank" rel="noreferrer" className="text-xs hover:underline text-blue-400 mt-2 block">
            View NIST ACVP JSON Reference Vectors
          </a>
        </div>
        <button
          onClick={runTests}
          className="btn-primary flex items-center gap-2"
          disabled={loading || phase !== 'session_open'}
        >
          <Play size={18} /> Execute ACVP Tests
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Results Column */}
        <div className="space-y-4 flex flex-col min-h-0">
          <h4 className="font-bold text-muted-foreground uppercase tracking-wider text-sm">Test Results</h4>
          <div className="bg-muted/30 border border-border rounded-lg overflow-hidden flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 text-muted-foreground uppercase text-xs sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="p-3 font-bold">Algorithm</th>
                  <th className="p-3 font-bold">Test Case</th>
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 font-bold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-foreground/30 italic">
                      No results yet. Run the validation suite to assert ACVP compliance.
                    </td>
                  </tr>
                ) : (
                  results.map((res) => (
                    <tr key={res.id} className="hover:bg-muted/30 transition-colors">
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
          <h4 className="font-bold text-muted-foreground uppercase tracking-wider text-sm">
            Execution Log
          </h4>
          <div className="bg-muted/50 border border-border rounded-lg p-4 font-mono text-xs text-success/80 overflow-y-auto custom-scrollbar flex-1">
            {logs.length === 0 ? (
              <span className="text-foreground/20 italic">Ready to engage HSM suite...</span>
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
