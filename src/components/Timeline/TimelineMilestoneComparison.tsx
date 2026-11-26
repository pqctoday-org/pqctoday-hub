// SPDX-License-Identifier: AGPL-3.0-only
import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { eventLinkKey, timelineData, timelineEventPageUrl } from '@/data/timelineData'
import { periodLabel } from '@/utils/timelinePeriod'
import { BindingForcePill } from './TimelineRecordFacts'

const milestonesByCountry = timelineData
  .map(({ countryName, bodies }) => ({
    countryName,
    records: bodies.flatMap(({ name, events }) =>
      events
        .filter((event) => event.type === 'Milestone')
        .map((event) => ({
          key: JSON.stringify([countryName, name, eventLinkKey(event)]),
          countryName,
          issuer: name,
          event,
        }))
    ),
  }))
  .filter(({ records }) => records.length > 0)
const milestonesByKey = new Map(
  milestonesByCountry.flatMap(({ records }) =>
    records.map((milestone) => [milestone.key, milestone] as const)
  )
)
const fields = [
  { key: 'milestoneA', label: 'First milestone' },
  { key: 'milestoneB', label: 'Second milestone' },
] as const

export function TimelineMilestoneComparison() {
  const [params, setParams] = useSearchParams()
  const hasSelection = fields.some(({ key }) => params.has(key))
  const [open, setOpen] = useState(hasSelection)
  const firstSelect = useRef<HTMLSelectElement>(null)

  const setMilestone = (key: (typeof fields)[number]['key'], value: string) => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true, preventScrollReset: true }
    )
  }

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="glass-panel my-4 p-3"
    >
      <summary className="min-h-8 cursor-pointer font-semibold text-foreground">
        Compare published milestones
      </summary>
      {open && (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            Compare dates, issuers and binding status. Open each source to check which organizations
            and systems it covers.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {fields.map(({ key, label }) => {
              const selectedKey = params.get(key) ?? ''
              const selected = milestonesByKey.get(selectedKey)
              const event = selected?.event
              return (
                <div key={key} className="min-w-0 space-y-3">
                  <label className="block min-w-0 space-y-1 text-sm font-medium">
                    <span>{label}</span>
                    {/* eslint-disable-next-line no-restricted-syntax -- Native <select> is required for country <optgroup> grouping, focus ref, and combobox/selectOption semantics */}
                    <select
                      ref={key === 'milestoneA' ? firstSelect : undefined}
                      className="block min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm"
                      value={selectedKey}
                      onChange={(change) => setMilestone(key, change.target.value)}
                    >
                      <option value="">Choose a record</option>
                      {!selected && selectedKey && (
                        <option value={selectedKey}>Record unavailable</option>
                      )}
                      {milestonesByCountry.map(({ countryName, records }) => (
                        <optgroup key={countryName} label={countryName}>
                          {records.map(({ key: recordKey, event: { title }, issuer }) => (
                            <option key={recordKey} value={recordKey}>
                              {issuer} — {title}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  {selected && event ? (
                    <article
                      aria-label={`${label} details`}
                      className="min-w-0 space-y-2 break-words rounded-2xl border border-border p-3 text-sm"
                    >
                      <h3 className="font-semibold text-foreground">{event.title}</h3>
                      <p>
                        {selected.countryName} · {selected.issuer}
                      </p>
                      <p>{periodLabel(event.startYear, event.endYear, event.openEnded)}</p>
                      <p>
                        {event.bindingForce ? (
                          <BindingForcePill value={event.bindingForce} />
                        ) : (
                          'Binding status unavailable'
                        )}
                      </p>
                      <p>{event.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        <Link
                          to={timelineEventPageUrl(selected.countryName, eventLinkKey(event))}
                          className="text-primary underline"
                        >
                          Open timeline record
                        </Link>
                        {event.sourceUrl && (
                          <a
                            className="text-primary underline"
                            href={event.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {event.sourceClass === 'primary'
                              ? 'Open primary source'
                              : 'Open cited source'}
                          </a>
                        )}
                      </div>
                    </article>
                  ) : (
                    selectedKey && (
                      <div role="status" className="text-sm text-muted-foreground">
                        This milestone is unavailable in the current timeline. Choose a current
                        record.
                      </div>
                    )
                  )}
                </div>
              )
            })}
          </div>
          {hasSelection && (
            <Button
              type="button"
              variant="outline"
              className="mt-3 min-h-11"
              onClick={() => {
                setParams(
                  (previous) => {
                    const next = new URLSearchParams(previous)
                    fields.forEach(({ key }) => next.delete(key))
                    return next
                  },
                  { replace: true, preventScrollReset: true }
                )
                firstSelect.current?.focus()
              }}
            >
              Clear comparison
            </Button>
          )}
        </>
      )}
    </details>
  )
}
