// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import docsMapRaw from '../data/openssl_docs_map.csv?raw'

let docsMapCache: Map<string, string> | null = null

const parseDocsMap = (): Map<string, string> => {
  if (docsMapCache) return docsMapCache

  const map = new Map<string, string>()
  const lines = docsMapRaw.trim().split('\n')

  // Skip header if present
  const startIndex = lines[0].startsWith('command,') ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const [cmd, filename] = line.split(',')
    if (cmd && filename) {
      map.set(cmd.toLowerCase().trim(), filename.trim())
    }
  }

  docsMapCache = map
  return map
}

export const getOpenSSLDocUrl = (commandLine: string): string => {
  // Base URL for OpenSSL 3.5 documentation
  const BASE_URL = 'https://www.openssl.org/docs/man3.5/man1'
  const DEFAULT_DOC = 'openssl.html'

  if (!commandLine) return `${BASE_URL}/${DEFAULT_DOC}`

  const map = parseDocsMap()

  // Simple command parsing
  const parts = commandLine.trim().split(/\s+/)

  // Handle "openssl cmd" vs just "cmd" (though usually it's input as just args in some contexts,
  // but here it seems to be the full command line "$ openssl ...")
  // The store probably has it as "genpkey -algorithm..." or "openssl genpkey..."
  // Let's assume the variable 'command' in the store is the arguments to openssl,
  // OR the full command.

  // In WorkbenchPreview.tsx: "$ {command}" implies command is just the args if the prompt adds $.
  // BUT the store default is 'genpkey'.
  // If the user types "genpkey ...", then parts[0] is genpkey.
  // If the user types "openssl genpkey ...", then parts[1] is genpkey.

  let primaryCommand = parts[0]

  if (primaryCommand === 'openssl' && parts.length > 1) {
    primaryCommand = parts[1]
  }

  // Handle flags (ignore them)
  if (primaryCommand.startsWith('-')) {
    return `${BASE_URL}/${DEFAULT_DOC}`
  }

  // 1. Direct match for the command
  if (map.has(primaryCommand)) {
    return `${BASE_URL}/${map.get(primaryCommand)}`
  }

  // 2. Check for algorithm specific mappings (e.g. ml-kem-768)
  // Sometimes algorithms are passed as flags or args, e.g. "genpkey -algorithm ml-kem-768"
  // or "req -new -newkey ml-kem-768"
  // We scan the args for known keys in our map that might be algorithms
  for (const part of parts) {
    const cleanPart = part.trim()
    if (map.has(cleanPart)) {
      return `${BASE_URL}/${map.get(cleanPart)}`
    }
  }

  // 3. Fallback: try to construct the filename if not in map (standard pattern)
  // Most commands are openssl-cmd.html
  // But we should be careful not to generate 404s.
  // If not in map, safe fallback is the main page or we try the pattern.
  // Given the explicit map request, maybe we should stick to map + generic fallback.

  return `${BASE_URL}/openssl-${primaryCommand}.html`
}

/** One-line descriptions for common OpenSSL CLI flags, shown as tooltip on hover. */
export const FLAG_HINTS: Record<string, string> = {
  '-algorithm': 'Key algorithm (e.g. rsa, ec, ml-kem-768, ml-dsa-65)',
  '-pkeyopt': 'Algorithm-specific option as name:value pair',
  '-out': 'Write output to this file',
  '-in': 'Read input from this file',
  '-key': 'Private key file',
  '-keyout': 'Write the generated private key to this file',
  '-pubkey': 'Output the public key alongside the certificate',
  '-pubout': 'Output the public key in PEM format',
  '-noout': 'Suppress encoded output; print only text form',
  '-text': 'Print human-readable details',
  '-new': 'Generate a new CSR (Certificate Signing Request)',
  '-x509': 'Output a self-signed certificate instead of a CSR',
  '-days': 'Certificate validity period in days',
  '-subj': 'Certificate subject as /CN=.../O=.../C=... DN string',
  '-CA': 'CA certificate used to sign the certificate',
  '-CAkey': 'Private key of the CA used to sign the certificate',
  '-CAcreateserial': 'Auto-create the CA serial number file if missing',
  '-digest': 'Message digest algorithm (e.g. sha256, sha3-256)',
  '-sign': 'Sign the input data using the given private key',
  '-verify': 'Verify a signature against the given public key',
  '-sigfile': 'File containing the signature to verify',
  '-binary': 'Treat the input as raw binary data',
  '-hex': 'Encode output in hexadecimal',
  '-aes-256-cbc': 'Encrypt / decrypt with AES-256 in CBC mode',
  '-aes-128-cbc': 'Encrypt / decrypt with AES-128 in CBC mode',
  '-iter': 'PBKDF2 iteration count for key derivation',
  '-nosalt': 'Skip salt in key derivation (not recommended)',
  '-d': 'Decrypt mode',
  '-e': 'Encrypt mode (default)',
  '-p': 'Print the salt, key, and IV used',
  '-k': 'Passphrase for key derivation',
  '-iv': 'Initialization vector as hex string',
  '-num': 'Number of random bytes to generate',
  '-base64': 'Base64-encode the output',
  '-newkey': 'Generate a new key pair of the specified type',
  '-nodes': 'Do not encrypt the private key (no DES)',
  '-passin': 'Input passphrase source (e.g. pass:secret, file:path)',
  '-passout': 'Output passphrase destination',
  '-inform': 'Input format: PEM, DER, or SMIME',
  '-outform': 'Output format: PEM, DER, or SMIME',
  '-certin': 'Input is a certificate (not a raw public key)',
  '-encrypt': 'Encrypt the input for the recipient certificate',
  '-decrypt': 'Decrypt the input using the private key',
  '-inkey': 'Input key for the PKCS#12 bundle or SMIME operation',
  '-certfile': 'Additional certificates file to include',
  '-caname': 'Override the friendly name for the CA certificate',
  '-export': 'Export a PKCS#12 file',
  '-legacy': 'Use legacy PKCS#12 algorithms (RC2/3DES)',
  '-nocerts': 'Omit certificates from output',
  '-nokeys': 'Omit private keys from output',
  '-clcerts': 'Output only client certificates',
  '-cacerts': 'Output only CA certificates',
}

/**
 * Tokenize an OpenSSL command string into annotated parts.
 * Returns an array of { text, hint } where hint is the tooltip for flag tokens.
 */
export function tokenizeCommand(cmd: string): { text: string; hint?: string }[] {
  if (!cmd) return []
  const tokens: { text: string; hint?: string }[] = []
  let remaining = cmd
  while (remaining.length > 0) {
    // Quoted segment — preserve as-is
    const qMatch = remaining.match(/^("[^"]*"|'[^']*')/)
    if (qMatch) {
      tokens.push({ text: qMatch[1] })
      remaining = remaining.slice(qMatch[1].length)
      continue
    }
    // Flag token (starts with -)
    const flagMatch = remaining.match(/^(-[a-zA-Z0-9_-]+)/)
    if (flagMatch) {
      const flag = flagMatch[1]
      tokens.push({ text: flag, hint: FLAG_HINTS[flag] })
      remaining = remaining.slice(flag.length)
      continue
    }
    // Whitespace
    const wsMatch = remaining.match(/^(\s+)/)
    if (wsMatch) {
      tokens.push({ text: wsMatch[1] })
      remaining = remaining.slice(wsMatch[1].length)
      continue
    }
    // Other word (command name, value)
    const wordMatch = remaining.match(/^(\S+)/)
    if (wordMatch) {
      tokens.push({ text: wordMatch[1] })
      remaining = remaining.slice(wordMatch[1].length)
      continue
    }
    break
  }
  return tokens
}
