import { useSettingsContext } from './contexts/SettingsContext'
import { useKeyStoreContext } from './contexts/KeyStoreContext'
import { useOperationsContext } from './contexts/OperationsContext'

// Re-export types for consumers
export type { ExecutionMode, SortColumn, SortDirection, ClassicalAlgorithm } from './contexts/types'
export const usePlaygroundContext = () => {
  const settings = useSettingsContext()
  const keyStore = useKeyStoreContext()
  const operations = useOperationsContext()

  return {
    ...settings,
    ...keyStore,
    ...operations,
    // Map clearKeys to clear both keys and operations to match old behavior
    clearKeys: () => {
      keyStore.clearKeys()
      operations.clearOperations()
    },
  }
}
