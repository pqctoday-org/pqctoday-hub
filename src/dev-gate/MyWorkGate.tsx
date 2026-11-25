// SPDX-License-Identifier: AGPL-3.0-only
/**
 * MyWorkGate: a temporary development page for checking My work, Updates, the comment box and the strip on a
 * revised section in a real browser. NOT part of the product and never in a production build (see App.tsx).
 * The fixtures below are test data, written only when a button is pressed.
 */
import { useMemo, useState } from 'react'
import { StickerCard, StoryButton, Eyebrow } from '@/components/storybook'
import {
  CommentBox,
  MyWorkPanel,
  UpdatesPanel,
  RevisedSectionStrip,
  type MyWorkObjective,
  type UpdatesObjective,
} from '@/components/MyWork'
import { useMyWorkStore, EMPTY_MY_WORK } from '@/store/useMyWorkStore'
import { useUpdatesStore, EMPTY_UPDATES } from '@/store/useUpdatesStore'
import { useHistoryStore } from '@/store/useHistoryStore'
import { saveAnswer } from '@/services/assistant/savedAnswers'
import { buildCatalog, engagementOf } from '@/services/myWork/updates'
import { MODULE_ID_RENAMES } from '@/components/PKILearning/manifest/contentVersion'

const SECTION_TAG = 'LM-008/s:handshake'
type Fail = 'none' | 'quota' | 'blocked'

const originalSetItem = Storage.prototype.setItem

function setFailure(mode: Fail) {
  Storage.prototype.setItem =
    mode === 'none'
      ? originalSetItem
      : function () {
          throw new DOMException(
            mode === 'quota' ? 'The quota has been exceeded.' : 'Access denied',
            mode === 'quota' ? 'QuotaExceededError' : 'SecurityError'
          )
        }
}

export default function MyWorkGate() {
  const [fail, setFail] = useState<Fail>('none')
  const [tab, setTab] = useState<'work' | 'updates'>('work')
  const catalog = useMemo(() => buildCatalog(), [])
  const tls = catalog['LM-008']
  const objectives: MyWorkObjective[] = [
    { id: 'review', title: 'Review our TLS migration design', steps: [{ tag: 'LM-008' }] },
    {
      id: 'brief',
      title: 'Board briefing',
      steps: [{ tag: 'LM-008/w:simulate' }, { tag: 'LM-009' }],
    },
  ]
  const updatesObjectives: UpdatesObjective[] = [
    {
      id: 'review',
      title: 'Review our TLS migration design',
      state: 'active',
      steps: [{ tag: 'LM-008', required: true, status: 'now' }],
    },
    {
      id: 'brief',
      title: 'Board briefing',
      state: 'active',
      steps: [{ tag: 'LM-009', required: true, status: 'not-started' }],
    },
  ]

  function seed() {
    const w = useMyWorkStore.getState()
    w.addComment({
      id: 'demo-1',
      tag: SECTION_TAG,
      body: 'Why does the hybrid group come first here?',
    })
    w.addComment({
      id: 'demo-2',
      tag: 'LM-008',
      body: 'Good overview. Revisit before the review meeting.',
    })
    // One comment written against the previous version, as if the lesson was revised since.
    w.addComment({
      id: 'demo-3',
      tag: 'LM-008/s:ciphers',
      body: 'Need to check the cipher suite list against our policy.',
    })
    useMyWorkStore.setState((s) => ({
      comments: s.comments.map((c) =>
        c.id === 'demo-3'
          ? {
              ...c,
              contentVersion: tls.version - 1,
              createdAt: '2026-11-03T10:00:00.000Z',
              updatedAt: '2026-11-03T10:00:00.000Z',
            }
          : c
      ),
    }))
    useHistoryStore.getState().addEvent({
      type: 'tls_simulation',
      timestamp: Date.now(),
      title: 'Ran the TLS simulator',
      route: '/playground/tls-simulator',
    })
    saveAnswer({
      question: 'When is the CNSA 2.0 deadline?',
      savedAt: new Date().toISOString(),
      payload: {
        answerText: 'Here is what the Hub holds on this.',
        note: 'Answer drawn from the Hub’s compliance records.',
        rowTags: ['CMP:CNSA-2'],
        source: { tag: 'CMP:CNSA-2' },
      },
    })
    w.saveReference({ tag: 'GL:ml-kem', title: 'ML-KEM', kind: 'Glossary term', savedFrom: 'page' })
  }

  function makeRevised() {
    useUpdatesStore.setState({
      learnerReleaseSeen: '4.224.0',
      releaseSeenAt: '2026-11-20T00:00:00.000Z',
      engaged: { 'LM-008': { ...engagementOf(tls), version: tls.version - 1 } },
      noticesSeen: [],
    })
  }

  function reset() {
    setFailure('none')
    setFail('none')
    localStorage.removeItem('pqc-my-work')
    localStorage.removeItem('pqc-updates')
    useMyWorkStore.setState({ ...EMPTY_MY_WORK })
    useUpdatesStore.setState({ ...EMPTY_UPDATES })
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6" data-testid="my-work-gate">
      <header>
        <Eyebrow>Development page</Eyebrow>
        <h1 className="text-2xl font-extrabold text-heading">My work and Updates</h1>
        <p className="text-sm text-muted-foreground">
          Test data is written only when you press a button. Renames known to the Hub:{' '}
          {Object.keys(MODULE_ID_RENAMES).length}.
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Test controls">
          <StoryButton variant="secondary" onClick={seed}>
            Add sample work
          </StoryButton>
          <StoryButton variant="secondary" onClick={makeRevised}>
            Make TLS Basics look revised
          </StoryButton>
          <StoryButton
            variant="secondary"
            onClick={() => {
              setFailure('quota')
              setFail('quota')
            }}
          >
            Storage full
          </StoryButton>
          <StoryButton
            variant="secondary"
            onClick={() => {
              setFailure('blocked')
              setFail('blocked')
            }}
          >
            Storage blocked
          </StoryButton>
          <StoryButton
            variant="secondary"
            onClick={() => {
              setFailure('none')
              setFail('none')
            }}
          >
            Storage works
          </StoryButton>
          <StoryButton variant="quiet" onClick={reset}>
            Reset everything
          </StoryButton>
        </div>
        <p role="status" className="mt-2 text-sm font-bold text-heading">
          Storage: {fail === 'none' ? 'works' : fail}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <StickerCard>
            <Eyebrow>Lesson page, section “TLS 1.3 Handshake”</Eyebrow>
            <RevisedSectionStrip
              tag={SECTION_TAG}
              onReview={() => setTab('updates')}
              className="mt-3"
            />
            <CommentBox
              tag={SECTION_TAG}
              onReviewUpdate={() => setTab('updates')}
              className="mt-3"
            />
            <CommentBox tag="LM-008/s:ciphers" className="mt-3" />
          </StickerCard>
        </div>
        <div className="space-y-4">
          <div role="tablist" aria-label="Your journey views" className="flex gap-2">
            {(['work', 'updates'] as const).map((t) => (
              <StoryButton
                key={t}
                role="tab"
                aria-selected={tab === t}
                variant={tab === t ? 'primary' : 'secondary'}
                onClick={() => setTab(t)}
              >
                {t === 'work' ? 'My work' : 'Updates'}
              </StoryButton>
            ))}
          </div>
          {tab === 'work' ? (
            <MyWorkPanel
              objectives={objectives}
              onOpen={(href) => window.alert(`Would open ${href}`)}
            />
          ) : (
            <UpdatesPanel
              objectives={updatesObjectives}
              onOpen={(href) => window.alert(`Would open ${href}`)}
            />
          )}
        </div>
      </div>
    </main>
  )
}
