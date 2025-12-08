import { openSSLService } from '../services/crypto/OpenSSLService'
import { useOpenSSLStore } from '../components/OpenSSLStudio/store'

/**
 * Extracts raw key bytes from a PEM file by asking OpenSSL to output text format
 * and parsing the hex dump.
 *
 * @param pemFile The name of the PEM file in the virtual filesystem
 * @param type 'private' or 'public'
 * @param files Optional list of files to pass to the worker. If not provided, it will try to find the file in the store.
 * @returns Uint8Array of the raw key bytes
 */
export const extractKeyFromOpenSSLOutput = async (
  pemFile: string,
  type: 'private' | 'public',
  files: { name: string; data: Uint8Array }[] = []
): Promise<Uint8Array> => {
  // Ensure the file is in the list to pass to worker
  const filesToPass = [...files]
  if (!filesToPass.find((f) => f.name === pemFile)) {
    const storedFile = useOpenSSLStore.getState().getFile(pemFile)
    if (storedFile) {
      filesToPass.push({ name: storedFile.name, data: storedFile.content as Uint8Array })
    }
  }

  // Use -text to let OpenSSL parse the key structure
  const pubIn = type === 'public' ? '-pubin' : ''
  const cmd = `openssl pkey -in ${pemFile} ${pubIn} -text -noout`
  const res = await openSSLService.execute(cmd, filesToPass)

  if (res.error || (type === 'private' && res.stderr.includes('Algorithm Ed25519 not found'))) {
    throw new Error(res.error || 'OpenSSL text parsing failed')
  }

  const output = res.stdout
  let hexBlock = ''

  if (type === 'private') {
    // Extract content between "priv:" and "pub:" (or end)
    const match = output.match(/priv:([\s\S]*?)(?:pub:|ASN1|$)/)
    if (!match) throw new Error('Could not find private key in OpenSSL output')
    hexBlock = match[1]
  } else {
    // Extract content between "pub:" and "ASN1" (or end)
    // Support potential blank lines or variations
    const match = output.match(/pub:([\s\S]*?)(?:ASN1|NIST CURVE|$)/)
    if (!match) throw new Error('Could not find public key in OpenSSL output')
    hexBlock = match[1]
  }

  // Clean up hex string (remove newlines, spaces, colons)
  const cleanHex = hexBlock.replace(/[\s:\n\r]/g, '')

  // Convert to bytes
  const bytes = new Uint8Array(cleanHex.length / 2)
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16)
  }

  // Sanity Check for Public Keys (secp256k1 uncompressed = 65 bytes)
  if (type === 'public' && bytes.length !== 65) {
    console.warn(
      `[cryptoUtils] Warning: Public key length is ${bytes.length} (expected 65). Hex: ${cleanHex.slice(0, 20)}...`
    )
    // Note: If OpenSSL format changed, we might be capturing garbage.
    // Try to clamp to 65 bytes if we have more
    if (bytes.length > 65) {
      return bytes.slice(0, 65)
    }
  }

  return bytes
}
