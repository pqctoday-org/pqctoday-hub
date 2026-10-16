// SPDX-License-Identifier: AGPL-3.0-only
import { applyGlossaryToChildren } from '@/utils/parseGlossary'

interface Props {
  children: React.ReactNode
}

export const GlossaryAutoWrap = ({ children }: Props) => <>{applyGlossaryToChildren(children)}</>
