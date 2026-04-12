// SPDX-License-Identifier: GPL-3.0-only
import { InteractivePlayground } from './InteractivePlayground'
import { MobilePlaygroundOps } from './MobilePlaygroundOps'

export const PlaygroundView = () => {
  return (
    <div>
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
