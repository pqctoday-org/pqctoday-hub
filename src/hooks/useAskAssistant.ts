import { useCallback } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'

/**
 * Hook that opens the chat panel and queues a question for the PQC Assistant.
 * The question is sent automatically once the panel is open and the API key is configured.
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
