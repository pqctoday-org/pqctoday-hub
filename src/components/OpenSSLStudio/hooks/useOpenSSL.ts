import { useEffect, useRef, useCallback } from 'react';
import { useOpenSSLStore } from '../store';
import type { WorkerMessage, WorkerResponse } from '../worker/types';

export const useOpenSSL = () => {
    const workerRef = useRef<Worker | null>(null);
    const {
        addLog,
        clearLogs,
        setIsProcessing,
        addFile,
        files,
        command: currentCommand
    } = useOpenSSLStore();

    useEffect(() => {
        // Initialize Worker
        const worker = new Worker(new URL('../worker/openssl.worker.ts', import.meta.url), {
            type: 'classic'
        });

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { type } = event.data;

            switch (type) {
                case 'LOG':
                    addLog(event.data.stream === 'stderr' ? 'error' : 'info', event.data.message);
                    break;
                case 'FILE_CREATED':
                    addFile({
                        name: event.data.name,
                        type: event.data.name.endsWith('.key') ? 'key' : event.data.name.endsWith('.csr') ? 'csr' : 'text',
                        content: event.data.data,
                        size: event.data.data.byteLength,
                        timestamp: Date.now()
                    });
                    addLog('info', `File created: ${event.data.name} `);
                    break;
                case 'READY':
                    addLog('info', 'OpenSSL System Ready');
                    break;
                case 'ERROR':
                    addLog('error', `System Error: ${event.data.error} `);
                    setIsProcessing(false);
                    break;
                case 'DONE':
                    setIsProcessing(false);
                    break;
            }
        };

        workerRef.current = worker;

        // Signal load
        worker.postMessage({ type: 'LOAD', url: '' });

        return () => {
            worker.terminate();
        };
    }, [addLog, addFile, setIsProcessing]);

    const executeCommand = useCallback(async (cmdOverride?: string) => {
        const commandToExecute = cmdOverride || currentCommand;
        if (!commandToExecute) return;

        setIsProcessing(true);
        clearLogs(); // Auto-clear logs on new run
        addLog('info', `$ ${commandToExecute}`);

        // Parse command string to args, respecting quotes
        const args: string[] = [];
        let match;
        const regex = /[^\s"]+|"([^"]*)"/g;

        // Skip 'openssl' if present
        const cmdStr = commandToExecute.startsWith('openssl ') ? commandToExecute.slice(8) : commandToExecute;

        while ((match = regex.exec(cmdStr)) !== null) {
            // If it was a quoted string (group 1), use that. Otherwise use the whole match.
            args.push(match[1] ? match[1] : match[0]);
        }

        const cmd = args.shift() || '';

        if (workerRef.current) {
            // Generate unique request ID for tracking
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            // Send command AND files in one message to ensure they are written to the fresh module
            workerRef.current.postMessage({
                type: 'COMMAND',
                command: cmd,
                args,
                files: files.map(f => ({ name: f.name, data: f.content })),
                requestId
            } as WorkerMessage);
        }
    }, [currentCommand, setIsProcessing, clearLogs, addLog, files]);

    return { executeCommand };
};
