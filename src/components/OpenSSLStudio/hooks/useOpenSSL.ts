import { useEffect, useRef, useCallback } from 'react';
import { useOpenSSLStore } from '../store';
import type { WorkerMessage, WorkerResponse } from '../worker/openssl.worker';

export const useOpenSSL = () => {
    const workerRef = useRef<Worker | null>(null);
    const { addLog, addFile, setIsProcessing, files } = useOpenSSLStore();

    useEffect(() => {
        // Initialize Worker
        const worker = new Worker(new URL('../worker/openssl.worker.ts', import.meta.url), {
            type: 'module'
        });

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { type } = event.data;

            switch (type) {
                case 'LOG':
                    addLog(event.data.stream === 'stderr' ? 'error' : 'stdout', event.data.message);
                    break;
                case 'FILE_CREATED':
                    addFile({
                        name: event.data.name,
                        type: event.data.name.endsWith('.key') ? 'key' : event.data.name.endsWith('.csr') ? 'csr' : 'text',
                        content: event.data.data,
                        size: event.data.data.byteLength,
                        timestamp: Date.now()
                    });
                    addLog('info', `File created: ${event.data.name}`);
                    break;
                case 'READY':
                    addLog('info', 'OpenSSL System Ready');
                    break;
                case 'ERROR':
                    addLog('error', `System Error: ${event.data.error}`);
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

    const executeCommand = useCallback((fullCommand: string) => {
        if (!workerRef.current) return;

        setIsProcessing(true);
        addLog('info', `$ ${fullCommand}`);

        // Sync files to worker
        files.forEach(file => {
            workerRef.current?.postMessage({
                type: 'FILE_UPLOAD',
                name: file.name,
                data: file.content
            });
        });

        // Parse command string to args, respecting quotes
        const args: string[] = [];
        let match;
        const regex = /[^\s"]+|"([^"]*)"/g;

        while ((match = regex.exec(fullCommand)) !== null) {
            // If it was a quoted string (group 1), use that. Otherwise use the whole match.
            args.push(match[1] ? match[1] : match[0]);
        }

        if (args[0] !== 'openssl') {
            addLog('error', 'Command must start with "openssl"');
            setIsProcessing(false);
            return;
        }

        const command = args[1];
        const cmdArgs = args.slice(2);

        workerRef.current.postMessage({
            type: 'COMMAND',
            command,
            args: cmdArgs
        } as WorkerMessage);
    }, [addLog, setIsProcessing, files]);

    return { executeCommand };
};
