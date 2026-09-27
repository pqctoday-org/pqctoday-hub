// SPDX-License-Identifier: GPL-3.0-only
import { InteractivePlayground } from './InteractivePlayground'
import { MobilePlaygroundOps } from './MobilePlaygroundOps'
import { EducationNotice } from '@/components/shared/EducationNotice'

export const PlaygroundView = () => {
  return (
    <div>
      {/* Unconditional, on both widths and above the tool itself: until now the
          status was stated only in MobilePlaygroundView's "Powered By" footer,
          so a desktop visitor met the playground with no statement of what it
          is (education-notice remediation 2026-09-26). */}
      <EducationNotice tone="strong" className="mb-3" />
      {/* Mobile: reduced interactive experience */}
      <div className="md:hidden">
        <MobilePlaygroundOps />
      </div>
      {/* Desktop / embed: full interactive playground */}
      <div className="hidden md:block">
        <InteractivePlayground />
      </div>
    </div>
  )
}
