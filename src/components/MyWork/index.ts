// SPDX-License-Identifier: AGPL-3.0-only
// My work and Updates: self-contained panels for the integrator to place. Props are plain data; the stores are device-local.
export { CommentBox, type CommentBoxProps } from './CommentBox'
export { MyWorkPanel, type MyWorkPanelProps } from './MyWorkPanel'
export { UpdatesPanel, type UpdatesPanelProps } from './UpdatesPanel'
export { RevisedSectionStrip, type RevisedSectionStripProps } from './RevisedSectionStrip'
export { useUpdates, useUnseenUpdateCount, useRevisedStrip } from './useUpdates'
export type { MyWorkObjective } from '@/services/myWork/items'
export type { UpdatesObjective } from '@/services/myWork/updates'
