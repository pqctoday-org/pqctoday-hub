// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { MLS_CIPHERSUITES } from '../data/mlsData'

const SUITES = MLS_CIPHERSUITES.filter(({ status }) => status !== 'draft-hybrid')
const CLASSICAL = 'mls_128_dhkemx25519_aes128gcm_sha256_ed25519'
const HYBRID_ED25519 = 'mls_128_mlkem768x25519_aes128gcm_sha256_ed25519'
const formatSuiteOption = ({ id, label }: (typeof SUITES)[number]) => (
  <option key={id} value={id}>
    {label}
  </option>
)
const selectClass =
  'block min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm'

export function MLSReinitializationCheck() {
  const id = useId()
  const [target, setTarget] = useState(HYBRID_ED25519)
  const [alicePackage, setAlicePackage] = useState(HYBRID_ED25519)
  const [bobPackage, setBobPackage] = useState(CLASSICAL)
  const [requirePqSignatures, setRequirePqSignatures] = useState(false)
  const blockers = [alicePackage !== target && 'Alice', bobPackage !== target && 'Bob'].filter(
    Boolean
  )
  const targetSuite = SUITES.find(({ id }) => id === target)
  const signatureAllowed = !requirePqSignatures || targetSuite?.signature.startsWith('ML-DSA')
  const ready = blockers.length === 0 && signatureAllowed

  return (
    <section aria-labelledby={id} className="glass-panel min-w-0 space-y-3 rounded-xl p-4">
      <h2 id={id} className="font-bold text-foreground">
        Check a proposed group reinitialization
      </h2>
      <p className="text-sm text-muted-foreground">
        Compare the target suite with the MLS 1.0 KeyPackages available for both existing members.
        This preflight uses fictional metadata and assumes package signatures and credentials are
        valid.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block min-w-0 space-y-1">
          <span>Target group cipher suite</span>
          {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright combobox/selectOption tests */}
          <select
            className={selectClass}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          >
            {SUITES.map(formatSuiteOption)}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={requirePqSignatures}
            onChange={(event) => setRequirePqSignatures(event.target.checked)}
          />
          Require post-quantum signatures
        </label>
        <label className="block min-w-0 space-y-1">
          <span>Alice’s available KeyPackage suite</span>
          {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright combobox/selectOption tests */}
          <select
            className={selectClass}
            value={alicePackage}
            onChange={(event) => setAlicePackage(event.target.value)}
          >
            {SUITES.map(formatSuiteOption)}
          </select>
        </label>
        <label className="block min-w-0 space-y-1">
          <span>Bob’s available KeyPackage suite</span>
          {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright combobox/selectOption tests */}
          <select
            className={selectClass}
            value={bobPackage}
            onChange={(event) => setBobPackage(event.target.value)}
          >
            {SUITES.map(formatSuiteOption)}
          </select>
        </label>
      </div>
      <div role="status" className="space-y-1 rounded-lg border border-border p-3 text-sm">
        <p className="font-semibold">{ready ? 'Preflight passed' : 'Hold reinitialization'}</p>
        {blockers.length > 0 && (
          <p>Matching KeyPackages still needed for {blockers.join(' and ')}.</p>
        )}
        {!signatureAllowed && (
          <p>The target uses a traditional signature and fails the selected policy.</p>
        )}
        {ready && (
          <p>
            In staging, commit the ReInit proposal, then validate the new group’s epoch 1 Welcome
            and its resumption PSK binding to the old group. After committing ReInit, the old group
            can no longer send messages.
          </p>
        )}
        {target === HYBRID_ED25519 && (
          <p>
            This draft suite uses Ed25519. Its post-quantum confidentiality claim covers passive
            attacks.
          </p>
        )}
      </div>
      <p className="text-sm">
        <a
          className="text-primary underline"
          href="https://www.rfc-editor.org/rfc/rfc9420.html#section-11.2"
          target="_blank"
          rel="noopener noreferrer"
        >
          RFC 9420 reinitialization
        </a>
        {' · '}
        <a
          className="text-primary underline"
          href="https://www.ietf.org/archive/id/draft-ietf-mls-pq-ciphersuites-07.html#section-4"
          target="_blank"
          rel="noopener noreferrer"
        >
          Draft cipher suite security considerations
        </a>
      </p>
    </section>
  )
}
