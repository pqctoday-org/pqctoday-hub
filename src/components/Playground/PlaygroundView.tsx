// SPDX-License-Identifier: GPL-3.0-only
import { InteractivePlayground } from './InteractivePlayground'
import { MobilePlaygroundOps } from './MobilePlaygroundOps'

export const PlaygroundView = () => {
  return (
    <div>
      {/* Mobile: reduced interactive experience */}
      <div className="lg:hidden">
        <MobilePlaygroundOps />
      </div>
      {/* Desktop: full interactive playground */}
      <div className="hidden lg:block">
        <InteractivePlayground />
      </div>
    </div>
  )
}
