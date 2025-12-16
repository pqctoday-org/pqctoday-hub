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
