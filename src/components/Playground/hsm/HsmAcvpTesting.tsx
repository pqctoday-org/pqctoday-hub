// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Play, CheckCircle, XCircle } from 'lucide-react'
import clsx from 'clsx'
import mlkemTestVectors from '../../../data/acvp/mlkem_test.json'
import mldsaTestVectors from '../../../data/acvp/mldsa_test.json'
import aesGcmTestVectors from '../../../data/acvp/aesgcm_test.json'
import hmacTestVectors from '../../../data/acvp/hmac_test.json'
import rsaPssTestVectors from '../../../data/acvp/rsapss_test.json'
import ecdsaTestVectors from '../../../data/acvp/ecdsa_test.json'
import { hexToBytes } from '../../../utils/dataInputUtils'
import {
  hsm_initialize,
  hsm_finalize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  hsm_importAESKey,
  hsm_aesDecrypt,
  hsm_importHMACKey,
  hsm_hmacVerify,
  hsm_importRSAPublicKey,
  hsm_rsaVerify,
  CKM_SHA256_RSA_PKCS_PSS,
  hsm_importECPublicKey,
  hsm_ecdsaVerify,
  hsm_importMLKEMPrivateKey,
  hsm_decapsulate,
  hsm_extractKeyValue,
  hsm_importMLDSAPublicKey,
  hsm_verifyBytes,
  hsm_generateMLDSAKeyPair,
  hsm_sign,
} from '../../../wasm/softhsm'
import type { SoftHSMModule } from '../../../wasm/softhsm'
import { useHsmContext } from './HsmContext'
import type { HsmKey } from './HsmContext'

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
  const {
    moduleRef,
    crossCheckModuleRef,
    engineMode,
    hSessionRef,
    phase,
    addHsmLog,
    addHsmKey,
    clearHsmKeys,
  } = useHsmContext()

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  const ts = () => new Date().toLocaleTimeString([], { hour12: false })

  /** Format bytes as hex string, truncated to maxBytes with … suffix */
  const toHex = (bytes: Uint8Array, maxBytes = 32) =>
    Array.from(bytes.slice(0, maxBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('') + (bytes.length > maxBytes ? '…' : '')

  const runTests = async () => {
    if (!moduleRef.current || phase !== 'session_open') {
      addLog('Error: HSM Session not open.')
      return
    }

    setLoading(true)
    setResults([])
    setLogs([])
    clearHsmKeys()
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
      const ACVP_GLOBAL_SEED = new Uint8Array(32).fill(0xac)

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
        const engineId = eName === 'C++' ? ('cpp' as const) : ('rust' as const)

        const regKey = (key: Omit<HsmKey, 'generatedAt'>) =>
          addHsmKey({ ...key, generatedAt: ts() })

        // ── 1. AES-GCM-256 Decrypt KAT (SP 800-38D) ────────────────────
        {
          const tv = aesGcmTestVectors.testGroups[0].tests[0]
          addLog(`[${eName}] Testing AES-GCM-256 Decrypt KAT (SP 800-38D)...`)
          try {
            const keyBytes = hexToBytes(tv.key)
            const ivBytes = hexToBytes(tv.iv)
            const ctBytes = hexToBytes(tv.ct)
            const tagBytes = hexToBytes(tv.tag)
            const expectedPt = hexToBytes(tv.pt)

            // Import known key
            const aesHandle = hsm_importAESKey(M, hSession, keyBytes)
            regKey({
              handle: aesHandle,
              family: 'aes',
              role: 'secret',
              label: `ACVP AES-256 (${eName})`,
              engine: engineId,
            })

            // Decrypt: ciphertext || tag → plaintext
            const ctWithTag = new Uint8Array(ctBytes.length + tagBytes.length)
            ctWithTag.set(ctBytes)
            ctWithTag.set(tagBytes, ctBytes.length)
            const recoveredPt = hsm_aesDecrypt(M, hSession, aesHandle, ctWithTag, ivBytes, 'gcm')

            // Compare recovered plaintext against NIST reference
            const matches =
              recoveredPt.length === expectedPt.length &&
              // eslint-disable-next-line security/detect-object-injection
              recoveredPt.every((b: number, i: number) => b === expectedPt[i])

            const ptHex = toHex(recoveredPt)
            newResults.push({
              id: `aes-acvp-${eName}`,
              algorithm: `AES-GCM-256 (${eName})`,
              testCase: 'Decrypt KAT',
              status: matches ? 'pass' : 'fail',
              details: matches
                ? `PT[${recoveredPt.length}B]: ${ptHex}`
                : `PT mismatch: got ${recoveredPt.length}B, expected ${expectedPt.length}B`,
            })
            addLog(`[${eName}] AES-GCM Decrypt KAT: ${matches ? 'PASS' : 'FAIL'} | PT: ${ptHex}`)
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `aes-err-${eName}`,
              algorithm: `AES-GCM-256 (${eName})`,
              testCase: 'Decrypt KAT',
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] AES-GCM: ${errMessage}`)
          }
        }

        // ── 2. HMAC-SHA256 Verify KAT (RFC 4231) ────────────────────────
        {
          const tv = hmacTestVectors.testGroups[0].tests[0]
          addLog(`[${eName}] Testing HMAC-SHA256 Verify KAT (RFC 4231)...`)
          try {
            const keyBytes = hexToBytes(tv.key)
            const msgBytes = hexToBytes(tv.msg)
            const macBytes = hexToBytes(tv.mac)

            // Import known HMAC key
            const hmacHandle = hsm_importHMACKey(M, hSession, keyBytes)
            regKey({
              handle: hmacHandle,
              family: 'hmac',
              role: 'secret',
              label: `ACVP HMAC-SHA256 (${eName})`,
              engine: engineId,
            })

            // Verify known MAC against reference
            const isValid = hsm_hmacVerify(M, hSession, hmacHandle, msgBytes, macBytes)

            const macHex = toHex(macBytes)
            newResults.push({
              id: `hmac-acvp-${eName}`,
              algorithm: `HMAC-SHA256 (${eName})`,
              testCase: 'Verify KAT',
              status: isValid ? 'pass' : 'fail',
              details: isValid
                ? `MAC[${macBytes.length}B] verified: ${macHex}`
                : 'MAC verification failed against RFC 4231 vector',
            })
            addLog(
              `[${eName}] HMAC-SHA256 Verify KAT: ${isValid ? 'PASS' : 'FAIL'} | MAC: ${macHex}`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `hmac-err-${eName}`,
              algorithm: `HMAC-SHA256 (${eName})`,
              testCase: 'Verify KAT',
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] HMAC-SHA256: ${errMessage}`)
          }
        }

        // ── 3. RSA-PSS-2048 SigVer KAT (FIPS 186-5) ────────────────────
        {
          const tv = rsaPssTestVectors.testGroups[0].tests[0]
          addLog(`[${eName}] Testing RSA-PSS-2048 SigVer KAT (FIPS 186-5)...`)
          try {
            const modBytes = hexToBytes(tv.n)
            const expBytes = hexToBytes(tv.e)
            const sigBytes = hexToBytes(tv.signature)

            // Import known RSA public key
            const rsaPubHandle = hsm_importRSAPublicKey(M, hSession, modBytes, expBytes)
            regKey({
              handle: rsaPubHandle,
              family: 'rsa',
              role: 'public',
              label: `ACVP RSA-2048 Public (${eName})`,
              variant: '2048',
              engine: engineId,
            })

            // Verify known signature
            const isValid = hsm_rsaVerify(
              M,
              hSession,
              rsaPubHandle,
              tv.msg,
              sigBytes,
              CKM_SHA256_RSA_PKCS_PSS
            )

            const rsaSigHex = toHex(sigBytes, 16)
            newResults.push({
              id: `rsa-acvp-${eName}`,
              algorithm: `RSA-PSS-2048 (${eName})`,
              testCase: 'SigVer KAT',
              status: isValid ? 'pass' : 'fail',
              details: isValid
                ? `Verified sig[${sigBytes.length}B]: ${rsaSigHex}…`
                : 'Signature verification failed against FIPS 186-5 vector',
            })
            addLog(
              `[${eName}] RSA-PSS SigVer KAT: ${isValid ? 'PASS' : 'FAIL'} | sig[0:16]: ${rsaSigHex}…`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `rsa-err-${eName}`,
              algorithm: `RSA-PSS-2048 (${eName})`,
              testCase: 'SigVer KAT',
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] RSA-PSS-2048: ${errMessage}`)
          }
        }

        // ── 4. ECDSA P-256 SigVer KAT (FIPS 186-5) ─────────────────────
        {
          const tv = ecdsaTestVectors.testGroups[0].tests[0]
          addLog(`[${eName}] Testing ECDSA P-256 SigVer KAT (FIPS 186-5)...`)
          try {
            const qx = hexToBytes(tv.qx)
            const qy = hexToBytes(tv.qy)
            const rBytes = hexToBytes(tv.r)
            const sBytes = hexToBytes(tv.s)
            // PKCS#11 ECDSA signature format: raw r || s
            const sigBytes = new Uint8Array(rBytes.length + sBytes.length)
            sigBytes.set(rBytes)
            sigBytes.set(sBytes, rBytes.length)

            // Import known EC public key
            const ecPubHandle = hsm_importECPublicKey(M, hSession, qx, qy, 'P-256')
            regKey({
              handle: ecPubHandle,
              family: 'ecdsa',
              role: 'public',
              label: `ACVP ECDSA P-256 Public (${eName})`,
              variant: 'P-256',
              engine: engineId,
            })

            // Verify known signature
            const isValid = hsm_ecdsaVerify(M, hSession, ecPubHandle, tv.msg, sigBytes)
            const ecSigHex = toHex(sigBytes, 16)

            newResults.push({
              id: `ecdsa-acvp-${eName}`,
              algorithm: `ECDSA P-256 (${eName})`,
              testCase: 'SigVer KAT',
              status: isValid ? 'pass' : 'fail',
              details: isValid
                ? `Verified sig[${sigBytes.length}B]: ${ecSigHex}…`
                : 'Signature verification failed against FIPS 186-5 vector',
            })
            addLog(
              `[${eName}] ECDSA P-256 SigVer KAT: ${isValid ? 'PASS' : 'FAIL'} | sig[0:16]: ${ecSigHex}…`
            )
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : String(e)
            newResults.push({
              id: `ecdsa-err-${eName}`,
              algorithm: `ECDSA P-256 (${eName})`,
              testCase: 'SigVer KAT',
              status: 'fail',
              details: errMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] ECDSA: ${errMessage}`)
          }
        }

        // ── 5. ML-DSA SigVer KAT (FIPS 204) ─────────────────────────────
        for (const group of mldsaTestVectors.testGroups) {
          const test = group.tests[0]
          const algo = group.parameterSet
          const variantNum = parseInt(algo.split('-')[2]) as 44 | 65 | 87
          addLog(`[${eName}] Testing ${algo} SigVer (FIPS 204)...`)

          try {
            const pkBytes = hexToBytes(test.pk)
            const msgBytes = hexToBytes(test.msg)
            const sigBytes = hexToBytes(test.sig)

            const pubHandle = hsm_importMLDSAPublicKey(M, hSession, variantNum, pkBytes)
            regKey({
              handle: pubHandle,
              family: 'ml-dsa',
              role: 'public',
              label: `ACVP ${algo} Public (${eName})`,
              variant: String(variantNum),
              engine: engineId,
            })

            const isValid = hsm_verifyBytes(M, hSession, pubHandle, msgBytes, sigBytes)
            const mldsaSigHex = toHex(sigBytes, 16)

            newResults.push({
              id: `mldsa-sigver-${algo}-${eName}`,
              algorithm: `${algo} (${eName})`,
              testCase: 'SigVer KAT',
              status: isValid ? 'pass' : 'fail',
              details: isValid
                ? `Verified sig[${sigBytes.length}B]: ${mldsaSigHex}…`
                : 'Signature verification failed',
            })
            addLog(
              `[${eName}] ${algo} SigVer: ${isValid ? 'PASS' : 'FAIL'} | sig[0:16]: ${mldsaSigHex}…`
            )
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            newResults.push({
              id: `mldsa-err-${algo}-${eName}`,
              algorithm: `${algo} (${eName})`,
              testCase: 'SigVer KAT',
              status: 'fail',
              details: errorMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] ${algo} SigVer Error: ${errorMessage}`)
          }
        }

        // ── 6. ML-DSA Functional Sign Test ───────────────────────────────
        addLog(`[${eName}] Testing ML-DSA-65 Sign (FIPS 204)...`)
        try {
          const mldsaPair = hsm_generateMLDSAKeyPair(M, hSession, 65)
          regKey({
            handle: mldsaPair.pubHandle,
            family: 'ml-dsa',
            role: 'public',
            label: `ACVP ML-DSA-65 Keygen Public (${eName})`,
            variant: '65',
            engine: engineId,
          })
          regKey({
            handle: mldsaPair.privHandle,
            family: 'ml-dsa',
            role: 'private',
            label: `ACVP ML-DSA-65 Keygen Private (${eName})`,
            variant: '65',
            engine: engineId,
          })
          const sig = hsm_sign(M, hSession, mldsaPair.privHandle, 'ACVP NIST PQC test')
          if (sig && sig.length > 0) {
            const signHex = toHex(sig, 16)
            newResults.push({
              id: `mldsa-sign-${eName}`,
              algorithm: `ML-DSA-65 (${eName})`,
              testCase: 'Functional Sign',
              status: 'pass',
              details: `sig[${sig.length}B]: ${signHex}…`,
            })
            addLog(`[${eName}] ML-DSA-65 Sign: PASS | sig[0:16]: ${signHex}…`)
          } else {
            throw new Error('Empty signature')
          }
        } catch (e: unknown) {
          const errMessage = e instanceof Error ? e.message : String(e)
          newResults.push({
            id: `mldsa-sign-err-${eName}`,
            algorithm: `ML-DSA-65 (${eName})`,
            testCase: 'Functional Sign',
            status: 'fail',
            details: errMessage,
          })
          addLog(`[DISCREPANCY] [${eName}] ML-DSA-65 Sign: ${errMessage}`)
        }

        // ── 7. ML-KEM Decapsulation KAT (FIPS 203) ──────────────────────
        for (const group of mlkemTestVectors.testGroups) {
          const test = group.tests[0]
          const algo = group.parameterSet
          const variantNum = (parseInt(algo.split('-')[2]) || 768) as 512 | 768 | 1024
          addLog(`[${eName}] Testing ${algo} Decapsulate KAT...`)

          try {
            const skBytes = hexToBytes(test.sk)
            const ctBytes = hexToBytes(test.ct)
            const expectedSsBytes = hexToBytes(test.ss)

            // Import private key from NIST vector
            const privHandle = hsm_importMLKEMPrivateKey(M, hSession, variantNum, skBytes)
            regKey({
              handle: privHandle,
              family: 'ml-kem',
              role: 'private',
              label: `ACVP ${algo} Private (${eName})`,
              variant: String(variantNum),
              engine: engineId,
            })

            // Decapsulate using NIST ciphertext
            const secretHandle = hsm_decapsulate(M, hSession, privHandle, ctBytes, variantNum)

            // Extract recovered shared secret
            const recoveredSs = hsm_extractKeyValue(M, hSession, secretHandle)

            // Compare byte-by-byte against NIST expected shared secret
            const matches =
              recoveredSs.length === expectedSsBytes.length &&
              // eslint-disable-next-line security/detect-object-injection
              recoveredSs.every((b: number, i: number) => b === expectedSsBytes[i])

            if (matches) {
              const ssHex = toHex(recoveredSs)
              newResults.push({
                id: `test-${algo}-decap-${eName}`,
                algorithm: `${algo} (${eName})`,
                testCase: 'Decapsulate KAT',
                status: 'pass',
                details: `SS[${recoveredSs.length}B]: ${ssHex}`,
              })
              addLog(`[${eName}] ${algo} Decapsulate: PASS | SS: ${ssHex}`)
            } else {
              const gotHex = Array.from(recoveredSs.slice(0, 16))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')
              const expHex = Array.from(expectedSsBytes.slice(0, 16))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')
              newResults.push({
                id: `test-${algo}-decap-${eName}`,
                algorithm: `${algo} (${eName})`,
                testCase: 'Decapsulate KAT',
                status: 'fail',
                details: `SS mismatch: got ${gotHex}... expected ${expHex}...`,
              })
              addLog(`[DISCREPANCY] [${eName}] ${algo} Decapsulate: SS mismatch`)
              addHsmLog({
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                fn: `[${eName}] C_DecapsulateKey(${algo})`,
                args: 'ACVP KAT Validation',
                rvHex: '0x00000005',
                rvName: 'CKR_GENERAL_ERROR (ACVP SS MISMATCH)',
                ms: 0,
                ok: false,
              })
            }
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            newResults.push({
              id: `test-${algo}-err-${eName}`,
              algorithm: `${algo} (${eName})`,
              testCase: 'Decapsulate KAT',
              status: 'fail',
              details: errorMessage,
            })
            addLog(`[DISCREPANCY] [${eName}] ${algo} Error: ${errorMessage}`)
            addHsmLog({
              id: Date.now(),
              timestamp: new Date().toLocaleTimeString(),
              fn: `[${eName}] C_DecapsulateKey(${algo})`,
              args: 'ACVP KAT Validation',
              rvHex: '0x00000005',
              rvName: `CKR_GENERAL_ERROR: ${errorMessage}`,
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
      // ACVP session stays alive — keys remain as live session objects
      // so C_GetAttributeValue works when inspecting via the eye icon.
      // Next ACVP run resets everything via clearHsmKeys() + finalize at top of runTests().
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
            Validates deterministic operations across the WASM PKCS#11 FFI using NIST CAVP target
            vectors.
          </p>
          <a
            href="https://github.com/usnistgov/ACVP-Server"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs hover:underline text-primary mt-2 block"
          >
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
          <h4 className="font-bold text-muted-foreground uppercase tracking-wider text-sm">
            Test Results
          </h4>
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
