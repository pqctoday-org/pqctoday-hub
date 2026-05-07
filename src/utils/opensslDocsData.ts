// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import docsMapRaw from '../data/openssl_docs_map.csv?raw'

interface DocsMapEntry {
  filename: string
  opensslVersion?: string
  docUrl?: string
  pqcRelevant?: boolean
}

let docsMapCache: Map<string, DocsMapEntry> | null = null

const parseDocsMap = (): Map<string, DocsMapEntry> => {
  if (docsMapCache) return docsMapCache

  const map = new Map<string, DocsMapEntry>()
  const lines = docsMapRaw.trim().split('\n')

  const startIndex = lines[0].startsWith('command,') ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(',')
    const cmd = parts[0]?.trim()
    const filename = parts[1]?.trim()
    if (!cmd || !filename) continue

    map.set(cmd.toLowerCase(), {
      filename,
      opensslVersion: parts[2]?.trim() || undefined,
      docUrl: parts[3]?.trim() || undefined,
      pqcRelevant: parts[4]?.trim().toLowerCase() === 'true',
    })
  }

  docsMapCache = map
  return map
}

/** Returns the entry metadata for a command, or undefined if not found. */
export const getOpenSSLDocEntry = (command: string): DocsMapEntry | undefined =>
  parseDocsMap().get(command.toLowerCase())

export const getOpenSSLDocUrl = (commandLine: string): string => {
  const BASE_URL = 'https://www.openssl.org/docs/man3.5/man1'
  const DEFAULT_DOC = 'openssl.html'

  if (!commandLine) return `${BASE_URL}/${DEFAULT_DOC}`

  const map = parseDocsMap()
  const parts = commandLine.trim().split(/\s+/)

  let primaryCommand = parts[0]
  if (primaryCommand === 'openssl' && parts.length > 1) primaryCommand = parts[1]
  if (primaryCommand.startsWith('-')) return `${BASE_URL}/${DEFAULT_DOC}`

  // 1. Direct match — prefer explicit doc_url from CSV if present
  const entry = map.get(primaryCommand)
  if (entry) return entry.docUrl ?? `${BASE_URL}/${entry.filename}`

  // 2. Scan args for known keys (algorithm names used as flags)
  for (const part of parts) {
    const e = map.get(part.trim())
    if (e) return e.docUrl ?? `${BASE_URL}/${e.filename}`
  }

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
