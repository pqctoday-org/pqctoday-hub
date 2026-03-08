import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '../../../../ui/button'
import { ErrorAlert } from '../../../../ui/error-alert'
import { hsm_generateRandom, hsm_seedRandom } from '../../../../../wasm/softhsm'
import { useHsmContext } from '../HsmContext'
import { HsmResultRow, toHex, hexSnippet } from '../shared'

export const RngPanel = () => {
  const { moduleRef, hSessionRef } = useHsmContext()
  const [length, setLength] = useState(32)
  const [randomBytes, setRandomBytes] = useState<Uint8Array | null>(null)
  const [seedHex, setSeedHex] = useState('')
  const [seedResult, setSeedResult] = useState<string | null>(null)
  const [loadingOp, setLoadingOp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const anyLoading = loadingOp !== null

  const withLoading = async (op: string, fn: () => Promise<void>) => {
    setLoadingOp(op)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(String(e))
    } finally {
      setLoadingOp(null)
    }
  }

  const doGenerate = () =>
    withLoading('gen', async () => {
      const M = moduleRef.current!
      const bytes = hsm_generateRandom(M, hSessionRef.current, length)
      setRandomBytes(bytes)
    })

  const doSeed = () =>
    withLoading('seed', async () => {
      const M = moduleRef.current!
      const bytes = new Uint8Array(seedHex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [])
      if (bytes.length === 0) throw new Error('Enter hex seed data')
      hsm_seedRandom(M, hSessionRef.current, bytes)
      setSeedResult(`Seeded ${bytes.length} bytes`)
      setTimeout(() => setSeedResult(null), 3000)
    })

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Generate Random Bytes
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {[16, 32, 48, 64, 128].map((n) => (
            <Button
              key={n}
              variant="ghost"
              size="sm"
              onClick={() => {
                setLength(n)
                setRandomBytes(null)
              }}
              disabled={anyLoading}
              className={
                length === n
                  ? 'bg-primary/20 text-primary text-xs h-7 px-3'
                  : 'text-muted-foreground text-xs h-7 px-3'
              }
            >
              {n} B
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={doGenerate}
            disabled={anyLoading}
            className="ml-auto h-7 text-xs"
          >
            {loadingOp === 'gen' && <Loader2 size={12} className="mr-1.5 animate-spin" />}
            Generate
          </Button>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          C_GenerateRandom(hSession, pRandom, {length}) → {length} bytes
        </p>
      </div>

      {randomBytes && (
        <div className="glass-panel p-4 space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Result
          </p>
          <HsmResultRow label="Length" value={`${randomBytes.length} bytes`} mono={false} />
          <HsmResultRow label="Hex (snippet)" value={hexSnippet(randomBytes, 32)} />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Full hex output</p>
            <p className="text-xs font-mono bg-muted rounded px-3 py-2 break-all text-foreground/80 select-all">
              {toHex(randomBytes)}
            </p>
          </div>
        </div>
      )}

      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Seed RNG (optional)
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={seedHex}
            onChange={(e) => setSeedHex(e.target.value.replace(/[^0-9a-fA-F]/g, ''))}
            placeholder="Hex entropy (e.g. deadbeef01020304)"
            className="flex-1 text-xs rounded-lg px-3 py-1.5 bg-muted border border-input text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={doSeed}
            disabled={anyLoading || seedHex.length < 2}
            className="h-7 text-xs"
          >
            {loadingOp === 'seed' && <Loader2 size={12} className="mr-1.5 animate-spin" />}
            Seed
          </Button>
        </div>
        {seedResult && <p className="text-xs text-status-success animate-fade-in">{seedResult}</p>}
        <p className="text-xs text-muted-foreground font-mono">
          C_SeedRandom(hSession, pSeed, seedLen) → CKR_OK
        </p>
      </div>

      {error && <ErrorAlert message={error} />}
    </div>
  )
}
