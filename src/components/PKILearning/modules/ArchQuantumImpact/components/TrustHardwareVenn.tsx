// SPDX-License-Identifier: AGPL-3.0-only
import React, { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import FocusLock from 'react-focus-lock'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOverlayEscape } from '@/hooks/useOverlayEscape'
import { VENN } from '../data/trustHardwareVenn'
import { SourceList } from './SourceList'

/** The overlap picture with its caption, a text version of its regions, and a full-size view. */
export const TrustHardwareVenn: React.FC = () => {
  const [open, setOpen] = useState(false)
  const lightboxRef = useRef<HTMLDivElement>(null)
  useOverlayEscape(open, () => setOpen(false), { rootRef: lightboxRef })

  return (
    <figure className="max-w-3xl mx-auto space-y-2" data-testid="trust-venn">
      <div className="w-full bg-muted/30 rounded-lg border border-border p-2 sm:p-3 flex flex-col items-center">
        <Button
          variant="ghost"
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full p-0 h-auto bg-transparent hover:bg-transparent cursor-zoom-in"
          aria-label="View the overlap diagram full size"
        >
          <img
            src={VENN.src}
            alt={VENN.alt}
            width={VENN.width}
            height={VENN.height}
            loading="lazy"
            decoding="async"
            className="w-full h-auto rounded-md shadow-md"
          />
        </Button>
        <p className="text-center text-[11px] text-muted-foreground mt-1.5">Click image to zoom</p>
      </div>
      <figcaption className="text-xs text-muted-foreground text-center">{VENN.caption}</figcaption>
      <div
        className="overflow-x-auto rounded-lg border border-border"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard users must be able to scroll the table sideways
        tabIndex={0}
        role="region"
        aria-label="Post-quantum and PKCS#11 comparison table, scrolls sideways"
        data-testid="trust-venn-table"
      >
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <caption className="sr-only">
            Post-quantum algorithms and PKCS#11 support for TPM 2.0, Tessera, traditional HSMs and
            cloud HSMs
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="bg-muted p-2 text-left text-xs font-semibold text-foreground"
              >
                <span className="sr-only">Topic</span>
              </th>
              {VENN.tableColumns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className="bg-muted p-2 text-left text-xs font-semibold text-foreground"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VENN.tableRows.map((row) => (
              <tr key={row.id} className="align-top">
                <th
                  scope="row"
                  className="border-t border-border bg-background p-2 text-left text-xs font-semibold text-foreground"
                >
                  {row.label}
                </th>
                {VENN.tableColumns.map((c) => {
                  const cell = row.cells[c.id]
                  return (
                    <td
                      key={c.id}
                      className="border-t border-border p-2 text-sm leading-snug text-foreground/90 space-y-1"
                      data-testid={`venn-cell-${row.id}-${c.id}`}
                    >
                      {cell.lines.map((l) => (
                        <p key={l}>{l}</p>
                      ))}
                      <SourceList ids={[...cell.sources]} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-foreground">
          Read the diagram as text
        </summary>
        <div className="mt-2 space-y-2 text-foreground/90">
          <ul className="list-disc pl-5 space-y-1">
            {VENN.regions.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <ul className="list-disc pl-5 space-y-1">
            {VENN.notes.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <SourceList ids={[...VENN.sources]} />
        </div>
      </details>

      {open &&
        createPortal(
          <FocusLock returnFocus className="contents">
            <div
              ref={lightboxRef}
              className="fixed inset-0 embed-backdrop z-dialog bg-card/95 backdrop-blur-sm flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Overlap diagram full view"
            >
              <Button
                variant="ghost"
                type="button"
                className="absolute inset-0 w-full h-full p-0 rounded-none bg-transparent hover:bg-transparent cursor-default"
                onClick={() => setOpen(false)}
                aria-label="Close diagram"
                tabIndex={-1}
              />
              {/* On a phone the picture opens wider than the screen and scrolls sideways, so its small text can be read. */}
              <div className="relative z-10 max-w-full max-h-[90vh] overflow-auto rounded-md">
                <img
                  src={VENN.src}
                  alt={VENN.alt}
                  width={VENN.width}
                  height={VENN.height}
                  className="block w-[1100px] max-w-none h-auto select-none md:w-auto md:max-w-full md:max-h-[90vh] md:object-contain"
                  style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
                />
              </div>
              <Button
                variant="ghost"
                className="absolute top-4 right-4 z-10 text-foreground hover:text-foreground/70 hover:bg-muted/30"
                onClick={() => setOpen(false)}
                aria-label="Close diagram"
              >
                <X size={24} />
              </Button>
              <p className="absolute bottom-4 left-0 right-0 z-10 text-center text-xs text-muted-foreground pointer-events-none">
                Pinch to zoom · Tap outside to close
              </p>
            </div>
          </FocusLock>,
          document.body
        )}
    </figure>
  )
}
