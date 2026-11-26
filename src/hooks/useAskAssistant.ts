// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'

/**
 * Hook that opens the chat panel and queues a question for the PQC Assistant.
 * The Assistant picks the question up as soon as the panel is open.
 */
export function useAskAssistant() {
  const setPendingQuestion = useChatStore((s) => s.setPendingQuestion)
  const open = useRightPanelStore((s) => s.open)

  return useCallback(
    (question: string) => {
      setPendingQuestion(question)
      open('chat')
    },
    [setPendingQuestion, open]
  )
}
