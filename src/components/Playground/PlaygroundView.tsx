// SPDX-License-Identifier: GPL-3.0-only
import { InteractivePlayground } from './InteractivePlayground'
import { MobilePlaygroundOps } from './MobilePlaygroundOps'
import { EducationNotice } from '@/components/shared/EducationNotice'
import { useIsBelowMdViewport } from '@/hooks/useIsBelowMdViewport'

export const PlaygroundView = () => {
  const isPhone = useIsBelowMdViewport()
  return (
    <div>
      {/* Unconditional, on both widths and above the tool itself: until now the
          status was stated only in MobilePlaygroundView's "Powered By" footer,
          so a desktop visitor met the playground with no statement of what it
          is (education-notice remediation 2026-09-26). */}
      <EducationNotice tone="strong" className="mb-3" />
      {/* One of the two, not both hidden with CSS: both would keep their headings in the page, and
          a page has exactly one level-one heading. The phone version has none of its own (the phone
          header title is plain text), so it names the page here. */}
      {isPhone ? (
        <div>
          <h1 className="sr-only">Interactive Playground</h1>
          <MobilePlaygroundOps />
        </div>
      ) : (
        <InteractivePlayground />
      )}
    </div>
  )
}
