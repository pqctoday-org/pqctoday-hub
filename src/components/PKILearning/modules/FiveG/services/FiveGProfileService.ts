import { openSSLService } from '../../../../../services/crypto/OpenSSLService'
import { bytesToHex } from '../../../../../services/crypto/FileUtils'
import type { FiveGTestVectors, FiveGState } from './FiveGTypes'

export class FiveGProfileService {
  private generatedFiles: Set<string>
  private testVectors?: FiveGTestVectors

  constructor(generatedFiles: Set<string>, testVectors?: FiveGTestVectors) {
    this.generatedFiles = generatedFiles
    this.testVectors = testVectors
  }

  private trackFile(filename: string) {
    this.generatedFiles.add(filename)
  }

  private getTimestamp(): string {
    const now = new Date()
    return now
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14)
  }

  private async injectKey(filename: string, content: string) {
    if (content.trim().startsWith('-----BEGIN')) {
      const bytes = new TextEncoder().encode(content)
      await openSSLService.execute('openssl version', [{ name: filename, data: bytes }])
    } else {
      const bytes = new Uint8Array(content.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
      await openSSLService.execute('openssl version', [{ name: filename, data: bytes }])
    }
  }

  private fallbackGen(ts: string, type: string) {
    const pub = `5g_hn_pub_fallback_${ts}.key`
    const priv = `5g_hn_priv_fallback_${ts}.key`
    this.trackFile(pub)
    this.trackFile(priv)
    return {
      output: `[Fallback] Generating ${type} Key Pair...`,
      pubKeyFile: pub,
      privKeyFile: priv,
    }
  }

  public async generateProfileA() {
    const ts = this.getTimestamp()
    const algo = 'x25519'

    const privFile = `5g_hn_priv_${ts}.key`
    const privDerFile = `5g_hn_priv_${ts}.der`
    const pubFile = `5g_hn_pub_${ts}.key`
    const derFile = `5g_hn_pub_${ts}.der`

    this.trackFile(privFile)
    this.trackFile(privDerFile)
    this.trackFile(pubFile)
    this.trackFile(derFile)

    const header = `═══════════════════════════════════════════════════════════════
              5G HOME NETWORK KEY GENERATION
═══════════════════════════════════════════════════════════════`

    try {
      const cmd1 = `openssl genpkey -algorithm ${algo} -out ${privFile}`

      if (this.testVectors?.profileA?.hnPriv) {
        await this.injectKey(privFile, this.testVectors.profileA.hnPriv)
      } else {
        await openSSLService.execute(cmd1)
      }

      await openSSLService.execute(`openssl pkey -in ${privFile} -outform DER -out ${privDerFile}`)

      const cmd2 = `openssl pkey -in ${privFile} -pubout -out ${pubFile}`
      await openSSLService.execute(cmd2)

      const derCmd = `openssl pkey -in ${pubFile} -pubout -outform DER -out ${derFile}`
      const resPubDer = await openSSLService.execute(derCmd)

      const pubDerData = resPubDer.files.find((f) => f.name === derFile)?.data
      const pubHex = pubDerData ? bytesToHex(pubDerData) : 'Simulated Hex'

      // Capture Private Key Hex for internal usage if possible (e.g. inject into state or return)
      // We need to read the private key DER to make it usable by WebCrypto or other services without FS reliance.
      await openSSLService.execute(`openssl pkey -in ${privFile} -outform DER -out ${privDerFile}`)
      // This reads the file we just wrote/converted.
      // If the FS is flaky, we might need to rely on the fact we just created it.
      // But wait, test vectors inject it.

      // Helpful: Get Priv Key Hex
      // Note: execute returns files if specifically requested or maybe we need to cat it?
      // OpenSSLService returns files created. `base64` command output is stdout.
      const resPriv = await openSSLService.execute(`openssl enc -base64 -in ${privDerFile}`)
      let privHex = ''
      if (resPriv.stdout) {
        const b64 = resPriv.stdout.replace(/\n/g, '')
        try {
          const binStr = atob(b64)
          const bytes = new Uint8Array(binStr.length)
          // eslint-disable-next-line security/detect-object-injection
          for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i)
          privHex = bytesToHex(bytes)
        } catch {
          /* ignore base64 decode error */
        }
      }

      return {
        output: `${header}
                    
Step 1: Generating Curve25519 Private Key...
$ ${cmd1}

Step 2: Deriving Public Key...
$ ${cmd2}
$ ${derCmd}

Step 3: Public Key Hex (Shareable):
$ xxd -p -c 32 ${derFile}

${(pubHex.match(/.{1,64}/g) || [pubHex]).join('\n')}

[SUCCESS] Home Network Key Pair Generated.
Private Key: ${privFile} (Hidden)
Public Key:  ${derFile}
Public Key Hex: ${pubHex}`,
        pubKeyFile: pubFile,
        privKeyFile: privFile,
        privKeyHex: privHex, // Return usage key
        pubKeyHex: pubHex,
      }
    } catch {
      return this.fallbackGen(ts, 'X25519')
    }
  }

  public async generateProfileB() {
    const ts = this.getTimestamp()

    // P-256
    const privFile = `5g_hn_priv_${ts}.key`
    const privDerFile = `5g_hn_priv_${ts}.der`
    const pubFile = `5g_hn_pub_${ts}.key`
    const derFile = `5g_hn_pub_${ts}.der`

    this.trackFile(privFile)
    this.trackFile(privDerFile)
    this.trackFile(pubFile)
    this.trackFile(derFile)

    const header = `═══════════════════════════════════════════════════════════════
              5G HOME NETWORK KEY GENERATION
═══════════════════════════════════════════════════════════════`

    try {
      const cmd1 = `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out ${privFile}`

      if (this.testVectors?.profileB?.hnPriv) {
        await this.injectKey(privFile, this.testVectors.profileB.hnPriv)
      } else {
        await openSSLService.execute(cmd1)
      }

      await openSSLService.execute(`openssl pkey -in ${privFile} -outform DER -out ${privDerFile}`)

      const cmd2 = `openssl pkey -in ${privFile} -pubout -out ${pubFile}`
      await openSSLService.execute(cmd2)

      const derCmd = `openssl pkey -in ${pubFile} -pubout -outform DER -out ${derFile}`
      const resPubDer = await openSSLService.execute(derCmd)

      const pubDerData = resPubDer.files.find((f) => f.name === derFile)?.data
      const pubHex = pubDerData ? bytesToHex(pubDerData) : 'Simulated Hex'

      // Capture Priv Key Hex for Profile B
      const resPriv = await openSSLService.execute(`openssl enc -base64 -in ${privDerFile}`)
      let privHex = ''
      if (resPriv.stdout) {
        const b64 = resPriv.stdout.replace(/\n/g, '')
        try {
          const binStr = atob(b64)
          const bytes = new Uint8Array(binStr.length)
          // eslint-disable-next-line security/detect-object-injection
          for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i)
          privHex = bytesToHex(bytes)
        } catch {
          /* ignore base64 decode error */
        }
      }

      return {
        output: `${header}

Step 1: Generating NIST P-256 Private Key...
$ ${cmd1}

Step 2: Deriving Public Key...
$ ${cmd2}
$ ${derCmd}

Step 3: Public Key Hex (Shareable):
$ xxd -p -c 32 ${derFile}

${(pubHex.match(/.{1,64}/g) || [pubHex]).join('\n')}

[SUCCESS] Home Network Key Pair Generated.
Private Key: ${privFile} (Hidden)
Public Key:  ${derFile}
Public Key Hex: ${pubHex}`,
        pubKeyFile: pubFile,
        privKeyFile: privFile,
        privKeyHex: privHex,
        pubKeyHex: pubHex,
      }
    } catch {
      return this.fallbackGen(ts, 'P-256')
    }
  }

  public async generateEphemeralKey(profile: 'A' | 'B', state: FiveGState) {
    const ts = this.getTimestamp()
    const algo = profile === 'A' ? 'X25519' : 'EC -pkeyopt ec_paramgen_curve:P-256'

    const privFile = `5g_eph_priv_${ts}.key`
    const privDer = `5g_eph_priv_${ts}.der`
    const pubFile = `5g_eph_pub_${ts}.key`
    const pubDer = `5g_eph_pub_${ts}.der`

    this.trackFile(privFile)
    this.trackFile(privDer)
    this.trackFile(pubFile)
    this.trackFile(pubDer)

    const header = `═══════════════════════════════════════════════════════════════
              EPHEMERAL KEY GENERATION (USIM)
═══════════════════════════════════════════════════════════════`

    try {
      const cmd1 = `openssl genpkey -algorithm ${algo} -out ${privFile}`

      const vec = profile === 'A' ? this.testVectors?.profileA : this.testVectors?.profileB
      if (vec?.ephPriv) {
        await this.injectKey(privFile, vec.ephPriv)
      } else {
        await openSSLService.execute(cmd1)
      }

      const cmd2 = `openssl pkey -in ${privFile} -pubout -out ${pubFile}`
      await openSSLService.execute(cmd2)

      await openSSLService.execute(
        `openssl pkey -in ${pubFile} -pubout -outform DER -out ${pubDer}`
      )
      const resPubDer = await openSSLService.execute(`openssl enc -base64 -in ${pubDer}`)
      let pubHex = ''
      if (resPubDer.stdout) {
        const b64 = resPubDer.stdout.replace(/\n/g, '')
        try {
          const binStr = atob(b64)
          const bytes = new Uint8Array(binStr.length)
          // eslint-disable-next-line security/detect-object-injection
          for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i)
          pubHex = bytesToHex(bytes)
        } catch {
          pubHex = 'ERROR_HEX'
        }
      }

      // Derive Private Key Hex similarly
      let privHex = ''
      await openSSLService.execute(`openssl pkey -in ${privFile} -outform DER -out ${privDer}`)
      const resPriv = await openSSLService.execute(`openssl enc -base64 -in ${privDer}`)
      if (resPriv.stdout) {
        const b64 = resPriv.stdout.replace(/\n/g, '')
        try {
          const binStr = atob(b64)
          const bytes = new Uint8Array(binStr.length)
          // eslint-disable-next-line security/detect-object-injection
          for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i)
          privHex = bytesToHex(bytes)
        } catch {
          /* ignore base64 decode error */
        }
      }

      if (state) {
        state.ephemeralPubKeyHex = pubHex
        // Matching property name in FiveGTypes
        state.ephPrivHex = privHex
      }

      return {
        output: `${header}

Step 1: Generating Ephemeral Private Key...
$ ${cmd1}

Step 2: Extracting Ephemeral Public Key...
$ ${cmd2}

[SUCCESS] Ephemeral Key Pair Ready.`,
        privKey: privFile,
        pubKey: pubFile,
        privKeyHex: privHex,
        pubKeyHex: pubHex,
      }
    } catch {
      return { output: 'Error', privKey: 'err', pubKey: 'err' }
    }
  }
}
