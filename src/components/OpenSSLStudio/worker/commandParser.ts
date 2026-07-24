// SPDX-License-Identifier: GPL-3.0-only
//
// commandParser — the single tokenizer for an `openssl ...` command string.
// Extracted from useOpenSSL.ts's inline parsing so the Learn tab's lesson
// runner (browser AND the Node-side curriculum replay test) tokenizes a
// command string exactly the same way the live Workbench does — no risk of
// the two drifting apart. Behavior is unchanged from the original inline
// version (including its quirk: an empty `""` arg falls back to the raw
// quoted token rather than an empty string — preserved as-is since fixing
// it is out of scope for the Learn tab work and no real command uses it).

/** Split a command line into argv-style tokens, respecting double-quoted
 * segments (e.g. `-subj "/C=US/O=Test"`), and drop a leading `openssl `
 * token if present. Returns the full remaining token list — callers decide
 * whether to shift() the first token off as the subcommand (Web Worker
 * protocol) or keep it as argv[0] (Node driver's callMain convention). */
export function parseOpensslArgs(commandLine: string): string[] {
  const cmdStr = commandLine.startsWith('openssl ') ? commandLine.slice(8) : commandLine

  const tokens: string[] = []
  const regex = /[^\s"]+|"([^"]*)"/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(cmdStr)) !== null) {
    tokens.push(match[1] ? match[1] : match[0])
  }
  return tokens
}
