// SPDX-License-Identifier: AGPL-3.0-only
import { useState, useCallback } from 'react'
import { formatSessionTime } from '@/lib/format'

export type LogType = 'protocol' | 'openssl'

export const useDigitalIDLogs = () => {
  const [logs, setLogs] = useState<string[]>([])
  const [opensslLogs, setOpenSSLLogs] = useState<string[]>([])
  const [activeLogTab, setActiveLogTab] = useState<LogType>('protocol')

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${formatSessionTime(new Date())}] ${msg}`])
  }, [])

  const addOpenSSLLog = useCallback((msg: string) => {
    setOpenSSLLogs((prev) => [...prev, `[${formatSessionTime(new Date())}]\n${msg}\n`])
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
    setOpenSSLLogs([])
  }, [])

  return {
    logs,
    opensslLogs,
    activeLogTab,
    setActiveLogTab,
    addLog,
    addOpenSSLLog,
    clearLogs,
  }
}
