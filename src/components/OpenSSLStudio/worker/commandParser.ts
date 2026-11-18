// SPDX-License-Identifier: AGPL-3.0-only

// OpenSSL receives an argument vector. Double quotes keep a file name or
// option value together, including an escaped double quote or backslash.
const quotedArgument = /"((?:[^"\\]|\\[\s\S])*)"/g

export function quoteOpenSSLArgument(value: string): string {
  return /^[A-Za-z0-9_./:-]+$/.test(value) ? value : `"${value.replace(/[\\"]/g, '\\$&')}"`
}

export function hasUnquotedPipe(commandLine: string): boolean {
  return commandLine.replace(quotedArgument, '').includes('|')
}

/** Remove the optional OpenSSL command name and return the remaining arguments. */
export function parseOpensslArgs(commandLine: string): string[] {
  const command = commandLine.trim().replace(/^openssl\s+/, '')
  const argument = new RegExp(`${quotedArgument.source}|([^\\s"]+)`, 'g')
  return Array.from(command.matchAll(argument), (match) =>
    match[1] === undefined ? match[2] : match[1].replace(/\\([\\"])/g, '$1')
  )
}
