export type ItemStatus = 'New' | 'Updated' | undefined

/**
 * Compares two arrays of objects to identify new and updated items.
 *
 * @param currentItems The latest list of items
 * @param previousItems The previous list of items
 * @param idField The field name to use as a unique identifier (e.g., 'id', 'name', 'referenceId')
 * @returns A Map where the key is the item ID and the value is the status ('New' | 'Updated')
 */
export function compareDatasets<T extends object>(
  currentItems: T[],
  previousItems: T[],
  idField: keyof T
): Map<string, ItemStatus> {
  const statusMap = new Map<string, ItemStatus>()
  const previousMap = new Map<string, T>()

  // Index previous items for O(1) lookup
  previousItems.forEach((item) => {
    // eslint-disable-next-line security/detect-object-injection
    const id = String(item[idField])
    previousMap.set(id, item)
  })

  currentItems.forEach((currentItem) => {
    // eslint-disable-next-line security/detect-object-injection
    const id = String(currentItem[idField])
    const previousItem = previousMap.get(id)

    if (!previousItem) {
      // ID doesn't exist in previous dataset -> New
      statusMap.set(id, 'New')
    } else {
      // ID exists, check for content changes
      // We convert to Record<string, unknown> to iterate keys
      const currentRecord = currentItem as Record<string, unknown>
      const previousRecord = previousItem as Record<string, unknown>

      const hasChanged = Object.keys(currentRecord).some((key) => {
        // Skip comparing the ID field itself
        if (key === idField) return false

        // Skip comparing internal fields
        if (key === 'children' || key === 'status') return false

        // eslint-disable-next-line security/detect-object-injection
        return JSON.stringify(currentRecord[key]) !== JSON.stringify(previousRecord[key])
      })

      if (hasChanged) {
        statusMap.set(id, 'Updated')
      }
    }
  })

  return statusMap
}
