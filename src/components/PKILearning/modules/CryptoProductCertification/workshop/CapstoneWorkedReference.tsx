// SPDX-License-Identifier: AGPL-3.0-only
import { ANCHOR_SCENARIO } from '../data/anchorScenario'
import {
  CAPSTONE_BOUNDARY_DECISIONS,
  CAPSTONE_REFERENCE,
  capstoneWorkedFields,
} from '../data/capstoneWorkedReference'
import {
  EIDAS_LINKS,
  MATRIX_SCHEMES,
  PATH_LABEL,
  SHARED_SOURCES,
  type CertPathId,
} from '../data/sharedData'
import { SourceLink } from '../components/sections/CoreSections'

const labels: Record<string, string> = {
  applies: 'Applies',
  'may-apply': 'May apply',
  'does-not-answer': 'Does not answer',
  covered: 'Covered by the fictional baseline record',
  planned: 'Planned — not covered',
  'not-covered': 'Not covered',
  none: 'No PP claim (ST-only)',
  'pp-en': 'Applicable HSM Protection Profile',
  'lab-scoping': 'Recognized laboratory scopes the change',
  exists: 'PQC notation records support, not algorithm approval',
  major: 'Major change',
  FS: 'Full submission (planning candidate)',
  're-evaluation': 'Re-evaluation',
  v5: 'PCI PTS HSM v5',
}

function fieldLabel(cell: string): string {
  const [group, item, sub] = cell.split('.')
  if (group === 'matrix') {
    const customer = ANCHOR_SCENARIO.customers.find((c) => c.id === item)?.label ?? item
    const scheme = MATRIX_SCHEMES.find((s) => s.id === sub)?.label ?? sub
    return `${customer} × ${scheme}`
  }
  if (group === 'boundaries') return `${item.toUpperCase()} boundary`
  if (group === 'release') return `${item.toUpperCase()} — ${sub} release`
  if (group === 'eidas' && item === 'links')
    return EIDAS_LINKS.find((link) => link.id === sub)?.label ?? sub
  return `${group === 'claims' ? 'Procurement claims' : group.toUpperCase()}${item ? ` — ${item.replace(/([A-Z])/g, ' $1').toLowerCase()}` : ''}`
}

/** No callbacks or store access: opening a reference cannot change learner work. */
export function CapstoneWorkedReference({
  path,
  artifact,
}: {
  path: CertPathId
  artifact: number
}) {
  const fields = capstoneWorkedFields(path, artifact)
  const sources =
    artifact === 2 || artifact === 1 || artifact === 10 || artifact === 12
      ? [
          SHARED_SOURCES.cmvpManual,
          SHARED_SOURCES.ccPart2,
          SHARED_SOURCES.eucc,
          SHARED_SOURCES.ptsListing,
        ]
      : path === 'fips'
        ? [SHARED_SOURCES.cmvpManual, SHARED_SOURCES.ig, SHARED_SOURCES.acvp]
        : path === 'cc'
          ? [SHARED_SOURCES.ccPart2, SHARED_SOURCES.ccdb014]
          : path === 'eucc-eidas'
            ? [SHARED_SOURCES.eidas, SHARED_SOURCES.eucc, SHARED_SOURCES.acm2]
            : [SHARED_SOURCES.ptsV5, SHARED_SOURCES.ptsListing, SHARED_SOURCES.kmo]

  return (
    <details
      className="rounded-lg border border-primary/20 bg-primary/5 p-3"
      data-testid={`capstone-reference-${artifact}`}
    >
      <summary className="cursor-pointer text-sm font-semibold text-primary">
        Worked reference and reasoning — artifact {artifact}
      </summary>
      <div className="mt-3 space-y-3 text-xs">
        <p>
          Hub-authored fictional Orrin N7 example · reference revision {CAPSTONE_REFERENCE.revision}
          . Compare decisions and reasoning; this reference does not fill your answers, grade them
          or establish certification.
        </p>
        {artifact >= 3 && artifact <= 6 && (
          <div>
            <p className="font-semibold">Worked assumptions — {PATH_LABEL[path]}</p>
            <ul className="list-disc space-y-1 pl-4">
              {CAPSTONE_REFERENCE.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </div>
        )}
        <dl className="space-y-3">
          {fields.map((field) => (
            <div key={field.cell} data-reference-cell={field.cell}>
              <dt className="font-semibold">
                {fieldLabel(field.cell)}
                {field.required ? '' : ' (context)'}
              </dt>
              <dd className="whitespace-pre-line">
                {(Array.isArray(field.answer) ? field.answer : [field.answer])
                  .map(
                    (answer) =>
                      (field.cell.startsWith('eidas.links.')
                        ? EIDAS_LINKS.find(
                            (link) => link.id === field.cell.split('.')[2]
                          )?.options.find((option) => option.id === answer)?.label
                        : undefined) ??
                      labels[answer] ??
                      ANCHOR_SCENARIO.components.find((component) => component.id === answer)
                        ?.label ??
                      answer
                  )
                  .join('; ')}
              </dd>
              <dd className="mt-1 text-muted-foreground">
                <strong>Why:</strong> {field.why}
              </dd>
            </div>
          ))}
        </dl>
        {artifact === 1 && (
          <ul className="space-y-2">
            {CAPSTONE_BOUNDARY_DECISIONS.map((decision) => (
              <li key={decision.cell} data-boundary-reference={decision.cell}>
                <strong>
                  {decision.lens.toUpperCase()} ·{' '}
                  {ANCHOR_SCENARIO.components.find((c) => c.id === decision.component)?.label}:{' '}
                  {decision.selected ? 'Inside' : 'Outside'}
                </strong>
                <p>{decision.why}</p>
                <p className="text-muted-foreground">If changed: {decision.contrary}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="flex flex-wrap gap-x-3 gap-y-1">
          Basis for comparison:{' '}
          {sources.map((source) => (
            <SourceLink key={source.id} source={source} />
          ))}
        </p>
        <p className="text-muted-foreground">
          In your production tools, inspect the named product, version, configuration and evidence
          behind each claim. A sample answer or a completed field does not verify that deployed
          scope.
        </p>
      </div>
    </details>
  )
}
