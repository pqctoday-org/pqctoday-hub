// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import {
  AUDIT_SAMPLE_REQUIREMENT,
  AUDIT_SAMPLE_RECORDS,
  compareAuditSampleScope,
} from './auditSampleScope'
import { Button } from '@/components/ui/button'

export function AuditSampleScopeExercise() {
  const [selected, setSelected] = useState(1)
  const [checked, setChecked] = useState(false)
  const record = AUDIT_SAMPLE_RECORDS.find((_, index) => index === selected)!
  const gaps = compareAuditSampleScope(record)
  return (
    <section className="glass-panel p-4 space-y-3" aria-labelledby="audit-scope-exercise-title">
      <h3 id="audit-scope-exercise-title" className="font-bold">
        Practice: does the record cover the sample system?
      </h3>
      <p className="text-sm">
        You are reviewing the fictional customer portal’s cryptographic module:{' '}
        {AUDIT_SAMPLE_REQUIREMENT.module} {AUDIT_SAMPLE_REQUIREMENT.version},{' '}
        {AUDIT_SAMPLE_REQUIREMENT.platform}, on {AUDIT_SAMPLE_REQUIREMENT.date}. Predict which
        record supports this scope before checking.
      </p>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Fictional evidence record</legend>
        {AUDIT_SAMPLE_RECORDS.map((item, index) => (
          <label key={item.id} className="flex gap-2 text-sm p-2 border border-border rounded">
            <input
              type="radio"
              name="audit-sample-record"
              checked={selected === index}
              onChange={() => {
                setSelected(index)
                setChecked(false)
              }}
            />
            <span>
              {item.label}: version {item.version}, {item.platform}, valid through{' '}
              {item.validThrough}
            </span>
          </label>
        ))}
      </fieldset>
      <Button onClick={() => setChecked(true)}>Check sample scope</Button>
      <div role="status" aria-live="polite">
        {checked &&
          (gaps.length ? (
            <>
              <p>Scope is unsupported by this record:</p>
              <ul className="list-disc pl-5">
                {gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
              <p>Select another record and check again.</p>
            </>
          ) : (
            <p>
              The module, version, platform and sample validity date match. This establishes scope
              correspondence for these fictional fields. Algorithm coverage, approved mode and the
              deployed configuration still need their own evidence.
            </p>
          ))}
      </div>
      <p className="text-sm text-muted-foreground">
        In your production tools, look for version and platform matching, status history and links
        to the underlying security policy. Test whether changing the version or platform invalidates
        a match. Keep the original record and configuration evidence; a product name or a checked
        topic alone cannot support the decision. This sample comparison stays separate from your
        planning checklist.
      </p>
    </section>
  )
}
