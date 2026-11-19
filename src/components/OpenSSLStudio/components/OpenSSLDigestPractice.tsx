// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useOpenSSLStore } from '../store'
import { parseOpensslArgs } from '../worker/commandParser'

const SAMPLE_NAME = 'hub-digest-sample.txt'
const SAMPLE_CONTENT = 'PQCToday OpenSSL digest practice\n'
const SAMPLE_COMMAND = `openssl dgst -sha256 ${SAMPLE_NAME}`

export function OpenSSLDigestPractice({
  runCommand,
}: {
  runCommand: (command: string) => Promise<{ stdout: string }>
}) {
  const isProcessing = useOpenSSLStore((state) => state.isProcessing)
  const isReady = useOpenSSLStore((state) => state.isReady)
  const [command, setCommand] = useState(SAMPLE_COMMAND)
  const [outcome, setOutcome] = useState<{ ok: boolean; text: string } | null>(null)

  async function run() {
    if (!isReady || useOpenSSLStore.getState().isProcessing) return
    const [operation] = parseOpensslArgs(command)
    if (operation !== 'dgst') {
      setOutcome({
        ok: false,
        text: 'Start with openssl dgst, followed by the digest flag and file name.',
      })
      return
    }
    const store = useOpenSSLStore.getState()
    if (!store.files.some((file) => file.name === SAMPLE_NAME)) {
      store.addFile({
        name: SAMPLE_NAME,
        type: 'text',
        content: SAMPLE_CONTENT,
        size: new TextEncoder().encode(SAMPLE_CONTENT).length,
        timestamp: Date.now(),
      })
    }
    setOutcome(null)
    try {
      const result = await runCommand(command)
      setOutcome({ ok: true, text: result.stdout.trim() || 'OpenSSL exited successfully.' })
    } catch (error) {
      setOutcome({ ok: false, text: error instanceof Error ? error.message : String(error) })
    }
  }

  return (
    <details className="glass-panel mb-4 p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        Edit an OpenSSL digest command
      </summary>
      <form
        aria-label="OpenSSL digest command practice"
        className="mt-3 space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          void run()
        }}
      >
        <p className="text-sm text-muted-foreground">
          Run the included file with SHA-256, change the flag to SHA-512 and compare the output.
        </p>
        <label className="block text-sm font-medium">
          OpenSSL digest command
          <input
            value={command}
            onChange={(event) => {
              setCommand(event.target.value)
              setOutcome(null)
            }}
            disabled={isProcessing}
            spellCheck={false}
            autoComplete="off"
            className="mt-1 block min-h-11 w-full rounded-md border border-border bg-background px-3 font-mono text-sm"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!isReady || isProcessing || !command.trim()}>
            Run digest command
          </Button>
          <a
            href="https://docs.openssl.org/3.6/man1/openssl-dgst/#options"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline"
          >
            OpenSSL 3.6 digest options
          </a>
        </div>
        {outcome && (
          <pre
            role={outcome.ok ? 'status' : 'alert'}
            className="whitespace-pre-wrap break-all rounded-md border border-border bg-muted/30 p-3 text-xs"
          >
            {outcome.text}
          </pre>
        )}
      </form>
    </details>
  )
}
