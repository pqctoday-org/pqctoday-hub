import { useState, useCallback } from 'react'

export type LogType = 'protocol' | 'openssl'

export const useDigitalIDLogs = () => {
  const [logs, setLogs] = useState<string[]>([])
  const [opensslLogs, setOpenSSLLogs] = useState<string[]>([])
  const [activeLogTab, setActiveLogTab] = useState<LogType>('protocol')

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }, [])

  const addOpenSSLLog = useCallback((msg: string) => {
    setOpenSSLLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}]\n${msg}\n`])
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
