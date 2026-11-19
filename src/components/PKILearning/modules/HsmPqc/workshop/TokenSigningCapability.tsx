// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { UseHSMResult } from '@/hooks/useHSM'
import { hsm_getMechanismInfo, hsm_getMechanismList, hsm_getSessionInfo } from '@/wasm/softhsm'
import { CKF_SIGN, CKM_ML_DSA, CKM_ML_KEM } from '@/wasm/softhsm/constants'

const MECHANISMS = ['CKM_ML_KEM', 'CKM_ML_DSA'] as const
type Mechanism = (typeof MECHANISMS)[number]

export function TokenSigningCapability({ hsm }: { hsm: UseHSMResult }) {
  const id = useId()
  const [mechanism, setMechanism] = useState<Mechanism>('CKM_ML_KEM')
  const [result, setResult] = useState('')
  const [prevReady, setPrevReady] = useState(hsm.isReady)
  if (prevReady !== hsm.isReady) {
    setPrevReady(hsm.isReady)
    if (!hsm.isReady) setResult('')
  }

  const check = () => {
    const module = hsm.moduleRef.current
    const activeSession = hsm.hSessionRef.current
    if (!module || !activeSession) {
      setResult('The active HSM session is unavailable.')
      return
    }
    // Resolve the constants after the engine modules have loaded.
    const mechanismId = mechanism === 'CKM_ML_KEM' ? CKM_ML_KEM : CKM_ML_DSA
    try {
      hsm.addStepLog(`Check signing support — ${mechanism}`)
      const slot = hsm_getSessionInfo(module, activeSession).slotID
      const mechanisms = hsm_getMechanismList(module, slot)
      if (mechanisms.length === 0) {
        setResult('The HSM returned no mechanism list. Retry after checking the active token.')
        return
      }
      if (!mechanisms.includes(mechanismId)) {
        setResult(`${mechanism} is absent from the active token’s mechanism list.`)
        return
      }
      const info = hsm_getMechanismInfo(module, slot, mechanismId)
      if (!info) {
        setResult(`${mechanism} is listed. The HSM returned no mechanism flags.`)
        return
      }
      setResult(
        info.flags & CKF_SIGN
          ? `${mechanism} is listed and advertises CKF_SIGN.`
          : `${mechanism} is listed without CKF_SIGN. Choose a signing mechanism.`
      )
    } catch {
      setResult('The token’s signing support could not be read. Check the live HSM session.')
    }
  }

  return (
    <section aria-labelledby={id} className="space-y-3 rounded-lg border border-border p-4">
      <h4 id={id} className="font-semibold">
        Check which mechanism can sign
      </h4>
      <p className="text-sm text-muted-foreground">
        Query the active sample token for the selected mechanism and its signing flag. A signing
        operation also needs a compatible key and permission under the token’s policy.
      </p>
      <label htmlFor={`${id}-mechanism`} className="block text-sm font-medium">
        Mechanism to look up
      </label>
      <div className="flex flex-wrap gap-2">
        {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright selectOption tests */}
        <select
          id={`${id}-mechanism`}
          value={mechanism}
          onChange={(event) => {
            setMechanism(event.target.value as Mechanism)
            setResult('')
          }}
          className="rounded-md border border-input bg-background p-2 text-sm"
        >
          {MECHANISMS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <Button disabled={!hsm.isReady} onClick={check}>
          Check signing support
        </Button>
      </div>
      <p role="status" aria-label="Token signing capability" className="text-sm">
        {hsm.isReady ? result : 'Enable the live HSM to read mechanism information.'}
      </p>
    </section>
  )
}
