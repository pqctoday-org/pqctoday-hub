// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Core (Shared author)
/**
 * STUB (scaffold). One named export per Learn-section id, PascalCase from the
 * id (build spec §4). CertIntroduction wraps each in <LearnSection> (title,
 * anchor, path scope, optional badge) — render only the section BODY here.
 */
import { DraftPending } from '../DraftPending'

/** Learn section `four-questions` */
export const FourQuestions = () => <DraftPending owner="Core" />

/** Learn section `scope-before-level` */
export const ScopeBeforeLevel = () => <DraftPending owner="Core" />
