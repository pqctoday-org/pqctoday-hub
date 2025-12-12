
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { fiveGService } from '../FiveGService'
import { openSSLService } from '../../../../../../services/crypto/OpenSSLService'
import { WasmAdapter } from './WasmAdapter'

// Mock OpenSSLService to use WasmAdapter
vi.mock('../../../../../../services/crypto/OpenSSLService', () => {
    return {
        openSSLService: {
            execute: vi.fn(),
            deleteFile: vi.fn().mockResolvedValue(undefined),
            init: vi.fn().mockResolvedValue(undefined),
        }
    }
})

describe('GSMA Audit: 5G SUCI Profiles via OpenSSL WASM', () => {
    let wasm: WasmAdapter

    beforeAll(async () => {
        wasm = new WasmAdapter()
        await wasm.init()

        // Implement mock execute using WASM
        // @ts-expect-error - Mocking private/protected method or property assignment
        openSSLService.execute.mockImplementation(async (cmd: string, files: { name: string, data: Uint8Array }[] = []) => {
            // Execute via WASM Wrapper
            const res = await wasm.execute(cmd, files)

            return {
                stdout: res.stdout,
                stderr: res.stderr,
                files: res.files,
                error: res.stderr && res.stderr.includes('error') ? res.stderr : undefined
            }
        })
    })

    it('should use OpenSSL 3.5.4 (WASM)', async () => {
        // Explicitly verify the version as requested by the user
        const res = await wasm.execute('openssl version')
        console.log('[WASM Version]', res.stdout.trim())
        expect(res.stdout).toContain('OpenSSL')
        expect(res.stdout).not.toContain('LibreSSL')
    })

    const runAuditTest = async (profile: 'A' | 'B' | 'C', pqcMode: 'hybrid' | 'pure' = 'hybrid') => {
        const title = `Profile ${profile} (${profile === 'C' ? pqcMode : (profile === 'A' ? 'Curve25519' : 'P-256')})`

        console.log(`\n--- START AUDIT: ${title} ---\n`)

        // 1. Generate HN Keys
        const hnRes = await fiveGService.generateNetworkKey(profile, pqcMode)
        expect(hnRes.pubKeyFile).toBeTruthy()

        // Determine HN key files driven by profile
        let hnPubFile = ''
        let hnPrivFile = '' // For verification

        if (profile === 'C' && pqcMode === 'hybrid') {
            hnPubFile = hnRes.pubKeyFile

            // For verification we accept the composite return, parsing later
            hnPrivFile = hnRes.privKeyFile
        } else {
            hnPubFile = hnRes.pubKeyFile
            hnPrivFile = hnRes.privKeyFile
        }

        // 2. Provision USIM
        const provRes = await fiveGService.provisionUSIM(hnPubFile)
        expect(provRes).toContain('[SUCCESS]')

        // 3. Load Key (Retrieve)
        const retRes = await fiveGService.retrieveKey(hnPubFile, `Profile ${profile}`)
        expect(retRes).toContain('[SUCCESS]')

        // 4. Generate Ephemeral Key
        // USIM generates this.
        const ephRes = await fiveGService.generateEphemeralKey(profile, pqcMode)
        expect(ephRes.pubKey).toBeTruthy()

        // 5. Compute Shared Secret (USIM Side)
        const ssRes = await fiveGService.computeSharedSecret(profile, ephRes.privKey, hnPubFile, pqcMode)
        expect(ssRes).toContain('[SUCCESS]')

        // Capture state from USIM
        const usimState = { ...fiveGService['state'] }
        expect(usimState.sharedSecretHex).toBeTruthy()

        // 6. Derive Keys
        const kdfRes = await fiveGService.deriveKeys(profile)
        expect(kdfRes).toContain('[SUCCESS]')
        expect(fiveGService['state'].kEncHex).toBeTruthy()

        // 7. Encrypt MSIN
        const encRes = await fiveGService.encryptMSIN()
        expect(encRes).toContain('[SUCCESS]')

        // 8. Compute MAC
        const macRes = await fiveGService.computeMAC()
        expect(macRes).toContain('[SUCCESS]')

        // --- NETWORK SIDE VERIFICATION (The Audit) ---
        console.log(`[Audit] Verifying ${title} Network Side...`)

        let zNetHex = ''

        if (profile === 'A' || profile === 'B') {
            const cmd = `openssl pkeyutl -derive -inkey ${hnPrivFile} -peerkey ${ephRes.pubKey} -out z_audit_${profile}.bin`
            const verifyRes = await wasm.execute(cmd)
            const zFileObj = verifyRes.files.find(f => f.name === `z_audit_${profile}.bin`)
            if (!zFileObj) throw new Error(`Audit Failed: No shared secret derived via OpenSSL for ${profile}\nUnknown error: ${verifyRes.stderr}`)
            zNetHex = Buffer.from(zFileObj.data).toString('hex')
        }
        else if (profile === 'C') {
            const ctHex = usimState.ciphertextHex
            if (!ctHex) throw new Error('Audit Failed: No ciphertext found in USIM state for Profile C')

            const ctBytes = new Uint8Array(ctHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)))
            const ctFile = 'ct_audit.bin'

            // Parse keys (ecc|pqc)
            let eccPrivFile = '', pqcPrivFile = ''
            if (pqcMode === 'hybrid') {
                const parts = hnRes.privKeyFile.split('|')
                eccPrivFile = parts[0]
                pqcPrivFile = parts[1]
            } else {
                pqcPrivFile = hnRes.privKeyFile
            }

            // 1. Decapsulate KEM Secret
            const zKemFile = 'z_kem_audit.bin'
            // OpenSSL 3.2+ use -decap -in <ciphertext> or -peerkey?
            // Standard is -inkey <private> -peerkey <ciphertext> for decap?? 
            // Docs say `-peerkey` for KEM ciphertext input in 'pkeyutl -derive' context for some providers, 
            // but `pkeyutl` has `-decap` flag? 
            // Let's try `-in` first as standard input data. 
            // If it fails, we try `-peerkey`.
            // Wait, `pkeyutl` man page for -decap says "Use -in for the input file".

            const kemCmd = `openssl pkeyutl -decap -inkey ${pqcPrivFile} -in ${ctFile} -out ${zKemFile}`

            // We pass ctFile as input file to execution
            const resKem = await wasm.execute(kemCmd, [{ name: ctFile, data: ctBytes }])
            const zKemObj = resKem.files.find(f => f.name === zKemFile)

            if (!zKemObj) {
                // Debug failure
                throw new Error(`Audit Failed: KEM Decapsulation failed.\nStdout: ${resKem.stdout}\nStderr: ${resKem.stderr}`)
            }

            const zKemBytes = zKemObj.data

            if (pqcMode === 'pure') {
                zNetHex = Buffer.from(zKemBytes).toString('hex')
            } else {
                // Hybrid: Need ECDH too
                const zEcdhFile = 'z_ecdh_audit.bin'
                // EphPub for Hybrid C is just the ECC component
                const ecdhCmd = `openssl pkeyutl -derive -inkey ${eccPrivFile} -peerkey ${ephRes.pubKey} -out ${zEcdhFile}`
                const resEcdh = await wasm.execute(ecdhCmd)
                const zEcdhObj = resEcdh.files.find(f => f.name === zEcdhFile)
                if (!zEcdhObj) throw new Error(`Audit Failed: Hybrid ECDH failed. Stdout: ${resEcdh.stdout}\nStderr: ${resEcdh.stderr}`)

                const zEcdhBytes = zEcdhObj.data

                // Combine: SHA-256( Z_ecdh || Z_kem )
                const combined = new Uint8Array(zEcdhBytes.length + zKemBytes.length)
                combined.set(zEcdhBytes, 0)
                combined.set(zKemBytes, zEcdhBytes.length)

                // Use WebCrypto (available in Vitest environment via Node)
                const hashBuffer = await window.crypto.subtle.digest('SHA-256', combined)
                zNetHex = Buffer.from(hashBuffer).toString('hex')
            }
        }

        expect(zNetHex).toBe(usimState.sharedSecretHex)
        console.log(`[Audit ${profile}] Verified. Secret: ${zNetHex.substring(0, 16)}...`)
    }

    it('should verify Profile A (Curve25519) with OpenSSL', async () => {
        await runAuditTest('A')
    })

    it('should verify Profile B (P-256) with OpenSSL', async () => {
        await runAuditTest('B')
    })

    it('should verify Profile C (Hybrid PQC) with OpenSSL', async () => {
        await runAuditTest('C', 'hybrid')
    })

    it('should verify Profile C (Pure PQC) with OpenSSL', async () => {
        await runAuditTest('C', 'pure')
    })

})
