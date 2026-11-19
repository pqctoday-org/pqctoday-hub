// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PAYMENT_HSM_SAMPLE } from '../data/pciData'

const PIN_ROC =
  'https://listings.pcisecuritystandards.org/documents/PCI_PIN_v3.1_ROC_Reporting_Template.pdf'
const SAMPLE = PAYMENT_HSM_SAMPLE

export function PciDeploymentEvidence({ onResult }: { onResult: (memo: string) => void }) {
  const id = useId()
  const [firmware, setFirmware] = useState<string>(SAMPLE.approvedFirmware[1])
  const [controlled, setControlled] = useState(false)
  const [fipsConfiguration, setFipsConfiguration] = useState(false)
  const [ptsEvidence, setPtsEvidence] = useState('')
  const [fipsEvidence, setFipsEvidence] = useState('')

  function clearResult() {
    setPtsEvidence('')
    setFipsEvidence('')
    onResult('')
  }

  function checkEvidence() {
    const listed = SAMPLE.approvedFirmware.some((listedFirmware) => listedFirmware === firmware)
    const listing = !listed
      ? `PTS listing ${SAMPLE.listingNumber} omits firmware ${firmware}. Request the listing for the deployed version.`
      : controlled
        ? `PTS listing ${SAMPLE.listingNumber} names firmware ${firmware} and the supplied deployment evidence addresses its controlled-environment condition.`
        : `PTS listing ${SAMPLE.listingNumber} names firmware ${firmware}. Provide evidence that the site meets the controlled-environment requirement in the Security Policy.`
    const certificate = `FIPS certificate ${SAMPLE.fipsNumber} covers ${SAMPLE.fipsFirmware} at Level 3.`
    const fips =
      firmware !== SAMPLE.fipsFirmware
        ? `${certificate} The sample deploys ${firmware}, so this certificate does not support that deployment.`
        : fipsConfiguration
          ? `${certificate} The deployment evidence matches the listed hardware and approved mode for the sample device check.`
          : `${certificate} Confirm the listed hardware and approved mode for this site.`
    setPtsEvidence(listing)
    setFipsEvidence(fips)
    onResult(
      `Fictional PIN translation device evidence\n${listing}\n${fips}\nSource: PCI SSC PIN Security v3.1, requirements 1-3 and 1-4 (pages 24–25), ${PIN_ROC}\nThe device check is one part of the entity assessment.`
    )
  }

  return (
    <section aria-labelledby={id} className="rounded-lg border border-border p-4 space-y-3">
      <h4 id={id} className="font-semibold text-sm">
        Check the device evidence for PIN translation
      </h4>
      <p className="text-xs text-muted-foreground">
        In the fictional Northgate scenario, the sample uses PIN Security v3.1. The reporting
        template for requirement 1-3 checks the equipment’s PCI PTS HSM approval or FIPS validation
        at Level 3 or higher. Requirement 1-4 ties the evidence to the device actually deployed.
        This sample assumes the same vendor and model for all three firmware selections.
      </p>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-xs space-y-1">
          <span className="block">Deployed Orrin N7 firmware</span>
          {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright combobox/selectOption tests */}
          <select
            className="min-h-[44px] rounded-md border border-border bg-background px-2 text-sm"
            value={firmware}
            onChange={(event) => {
              setFirmware(event.target.value)
              clearResult()
            }}
          >
            <option value={SAMPLE.fipsFirmware}>{SAMPLE.fipsFirmware}</option>
            <option value={SAMPLE.approvedFirmware[1]}>{SAMPLE.approvedFirmware[1]}</option>
            <option value={SAMPLE.proposedFirmware}>{SAMPLE.proposedFirmware}</option>
          </select>
        </label>
        {firmware === SAMPLE.fipsFirmware ? (
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fipsConfiguration}
              onChange={(event) => {
                setFipsConfiguration(event.target.checked)
                clearResult()
              }}
              className="accent-primary"
            />
            Listed hardware and approved mode documented for this site
          </label>
        ) : (
          <label className="flex items-center gap-2 min-h-[44px] text-sm">
            <input
              type="checkbox"
              checked={controlled}
              onChange={(event) => {
                setControlled(event.target.checked)
                clearResult()
              }}
              className="accent-primary"
            />
            Controlled environment documented for this site
          </label>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={checkEvidence}>
        Check sample device evidence
      </Button>
      <div role="status" aria-label="Sample PIN device evidence" className="space-y-1 text-sm">
        {ptsEvidence && (
          <>
            <p>{ptsEvidence}</p>
            <p>{fipsEvidence}</p>
          </>
        )}
      </div>
      <a
        className="text-xs text-primary underline"
        href={`${PIN_ROC}#page=27`}
        target="_blank"
        rel="noopener noreferrer"
      >
        PCI SSC PIN Security v3.1 reporting template, requirements 1-3 and 1-4 (pages 24–25)
      </a>
    </section>
  )
}
