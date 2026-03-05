// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import type { LogEntry } from '../../../types'
import * as MLDSA from '../../../wasm/liboqs_dsa'
import { SettingsContext } from './SettingsContext'
import type { ExecutionMode, SortColumn, SortDirection, ClassicalAlgorithm } from './types'

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State definitions — ?algo= deep link pre-selects algorithm on mount
  const [algorithm, setAlgorithm] = useState<string>(() => {
    const algoParam = new URLSearchParams(window.location.search).get('algo')
    if (algoParam) {
      // Normalize: accept 'ML-KEM-768' → 'ML-KEM', 'ML-DSA-65' → 'ML-DSA', etc.
      const base = algoParam.replace(/-\d+$/, '')
      if (['ML-KEM', 'ML-DSA', 'SLH-DSA', 'FN-DSA'].includes(base)) return base
      if (algoParam === 'ML-KEM' || algoParam === 'ML-DSA') return algoParam
    }
    return 'ML-KEM'
  })
  const [keySize, setKeySize] = useState<string>(() => {
    const algoParam = new URLSearchParams(window.location.search).get('algo')
    if (algoParam) {
      // Extract key size suffix: 'ML-KEM-1024' → '1024', 'ML-DSA-44' → '44'
      const sizeMatch = algoParam.match(/-(\d+)$/)
      if (sizeMatch) return sizeMatch[1]
      // Default sizes per algorithm family
      const base = algoParam.replace(/-\d+$/, '')
      if (base === 'ML-KEM') return '768'
      return '65'
    }
    return '768'
  })
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(() => {
    const isWasmSupported = typeof WebAssembly === 'object'
    if (!isWasmSupported) return 'mock'
    try {
      const savedMode = sessionStorage.getItem('playground-execution-mode')
      return savedMode === 'wasm' || savedMode === 'mock' ? savedMode : 'wasm'
    } catch {
      return 'wasm'
    }
  })
  const [wasmLoaded, setWasmLoaded] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [lastLogEntry, setLastLogEntry] = useState<LogEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(() => {
    return typeof WebAssembly === 'object'
      ? null
      : 'WebAssembly not supported in this browser. Using Mock mode.'
  })
  const [sortColumn, setSortColumn] = useState<SortColumn>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({
    timestamp: 150,
    keyLabel: 200,
    operation: 180,
    result: 300,
    executionTime: 120,
  })
  const [resizingColumn, setResizingColumn] = useState<SortColumn | null>(null)
  const resizeStartX = useRef<number>(0)
  const resizeStartWidth = useRef<number>(0)
  const [activeTab, setActiveTab] = useState<
    | 'data'
    | 'kem_ops'
    | 'sign_verify'
    | 'keystore'
    | 'logs'
    | 'acvp'
    | 'symmetric'
    | 'hashing'
    | 'softhsm'
    | 'key_agree'
    | 'key_derive'
    | 'classical_sign'
  >('keystore')
  const [classicalAlgorithm, setClassicalAlgorithm] = useState<ClassicalAlgorithm>('RSA-2048')
  const [hsmMode, setHsmMode] = useState(false)
  const toggleHsmMode = useCallback(() => {
    setHsmMode((m) => !m)
    setActiveTab('keystore')
  }, [])

  // --- Helpers (stable callbacks) ---
  const handleAlgorithmChange = useCallback((newAlgorithm: string) => {
    setAlgorithm(newAlgorithm)
    setKeySize(newAlgorithm === 'ML-KEM' ? '768' : '65')
  }, [])

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      }),
      ...entry,
    }
    setLogs((prev) => {
      const updated = [newEntry, ...prev]
      return updated.length > 1000 ? updated.slice(0, 1000) : updated
    })
    setLastLogEntry(newEntry)
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
    setLastLogEntry(null)
  }, [])

  const handleSort = useCallback(
    (column: SortColumn) => {
      if (sortColumn === column) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
      } else {
        setSortColumn(column)
        setSortDirection('desc')
      }
    },
    [sortColumn, sortDirection]
  )

  const startResize = useCallback(
    (e: React.MouseEvent, column: SortColumn) => {
      e.preventDefault()
      e.stopPropagation()
      setResizingColumn(column)
      resizeStartX.current = e.clientX
      // eslint-disable-next-line security/detect-object-injection
      resizeStartWidth.current = columnWidths[column]
      document.body.style.cursor = 'col-resize'
    },
    [columnWidths]
  )

  // --- Effects ---
  useEffect(() => {
    const loadWASM = async () => {
      if (executionMode === 'wasm' && !wasmLoaded) {
        try {
          await MLDSA.load()
          setWasmLoaded(true)
          addLog({
            keyLabel: 'System',
            operation: 'Load WASM',
            result: 'Libraries loaded successfully',
            executionTime: 0,
          })
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          setError(`Failed to load WASM libraries: ${errorMessage}. Falling back to Mock mode.`)
          setExecutionMode('mock')
        }
      }
    }
    loadWASM()
  }, [executionMode, wasmLoaded, addLog])

  useEffect(() => {
    try {
      sessionStorage.setItem('playground-execution-mode', executionMode)
    } catch {
      // sessionStorage unavailable (private browsing, iframe restrictions)
    }
  }, [executionMode])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn) {
        const diff = e.clientX - resizeStartX.current
        const newWidth = Math.max(50, resizeStartWidth.current + diff)
        setColumnWidths((prev) => ({ ...prev, [resizingColumn]: newWidth }))
      }
    }
    const handleMouseUp = () => {
      if (resizingColumn) {
        setResizingColumn(null)
        document.body.style.cursor = 'default'
      }
    }
    if (resizingColumn) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingColumn])

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      // eslint-disable-next-line security/detect-object-injection
      let aValue: string | number = a[sortColumn]
      // eslint-disable-next-line security/detect-object-injection
      let bValue: string | number = b[sortColumn]
      if (sortColumn === 'executionTime')
        return sortDirection === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      aValue = String(aValue).toLowerCase()
      bValue = String(bValue).toLowerCase()
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [logs, sortColumn, sortDirection])

  const contextValue = useMemo(
    () => ({
      algorithm,
      setAlgorithm,
      keySize,
      setKeySize,
      executionMode,
      setExecutionMode,
      wasmLoaded,
      logs,
      lastLogEntry,
      loading,
      setLoading,
      error,
      setError,
      sortColumn,
      setSortColumn,
      sortDirection,
      setSortDirection,
      columnWidths,
      setColumnWidths,
      resizingColumn,
      setResizingColumn,
      startResize,
      handleSort,
      sortedLogs,
      classicalAlgorithm,
      setClassicalAlgorithm,
      handleAlgorithmChange,
      activeTab,
      setActiveTab,
      addLog,
      clearLogs,
      hsmMode,
      setHsmMode,
      toggleHsmMode,
    }),
    [
      algorithm,
      keySize,
      executionMode,
      wasmLoaded,
      logs,
      lastLogEntry,
      loading,
      error,
      sortColumn,
      sortDirection,
      columnWidths,
      resizingColumn,
      sortedLogs,
      classicalAlgorithm,
      activeTab,
      startResize,
      handleSort,
      handleAlgorithmChange,
      addLog,
      clearLogs,
      hsmMode,
      toggleHsmMode,
    ]
  )

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>
}
