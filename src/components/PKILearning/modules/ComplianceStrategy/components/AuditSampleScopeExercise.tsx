// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import {
  AUDIT_SAMPLE_REQUIREMENT,
  AUDIT_SAMPLE_RECORDS,
  compareAuditSampleScope,
  type AuditSampleRecord,
} from './auditSampleScope'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AuditSampleScopeExercise() {
  const id = useId()
  const [record, setRecord] = useState<AuditSampleRecord>(AUDIT_SAMPLE_RECORDS[1])
  const [reviewDate, setReviewDate] = useState(AUDIT_SAMPLE_REQUIREMENT.date)
  const [checked, setChecked] = useState(false)
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(reviewDate)
  const gaps = checked ? compareAuditSampleScope(record, reviewDate) : []
  return (
    <section className="glass-panel p-4 space-y-3" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="font-bold">
        Practice: does the record cover the sample system?
      </h2>
      <p className="text-sm">
        You are reviewing the fictional customer portal’s cryptographic module:{' '}
        {AUDIT_SAMPLE_REQUIREMENT.module} {AUDIT_SAMPLE_REQUIREMENT.version},{' '}
        {AUDIT_SAMPLE_REQUIREMENT.platform}. Predict which record supports this scope before
        checking.
      </p>
      <div className="space-y-1">
        <label htmlFor={`${id}-date`} className="block text-sm font-medium">
          Sample review date
        </label>
        <Input
          id={`${id}-date`}
          type="date"
          className="w-full sm:max-w-48"
          value={reviewDate}
          onChange={(event) => {
            setReviewDate(event.target.value)
            setChecked(false)
          }}
        />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Fictional evidence record</legend>
        {AUDIT_SAMPLE_RECORDS.map((item) => (
          <label key={item.id} className="flex gap-2 text-sm p-2 border border-border rounded">
            <input
              type="radio"
              name={id}
              checked={record.id === item.id}
              onChange={() => {
                setRecord(item)
                setChecked(false)
              }}
            />
            <span>
              {item.label}: version {item.version}, {item.platform}, valid {item.validFrom} through{' '}
              {item.validThrough}
            </span>
          </label>
        ))}
      </fieldset>
      <Button onClick={() => setChecked(true)} disabled={!validDate}>
        Check sample scope
      </Button>
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
