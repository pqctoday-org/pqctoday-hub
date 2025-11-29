import { useEffect, useRef } from 'react';
import { useOpenSSLStore } from './store';
import { Terminal, Trash2, Copy } from 'lucide-react';
import clsx from 'clsx';

export const TerminalOutput = () => {
    const { command, logs, clearLogs } = useOpenSSLStore();
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="h-full flex flex-col bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden font-mono text-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-2 text-muted">
                    <Terminal size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Terminal Output</span>
                </div>
                <button
                    onClick={clearLogs}
                    className="text-xs text-muted hover:text-white flex items-center gap-1 transition-colors"
                >
                    <Trash2 size={12} /> Clear
                </button>
            </div>

            {/* Command Preview */}
            <div className="p-4 border-b border-white/10 bg-black/20">
                <div className="text-xs text-muted mb-1 uppercase tracking-wider">Command Preview</div>
                <div className="flex items-center gap-2 group">
                    <code className="text-green-400 flex-1 break-all">
                        $ {command}
                    </code>
                    <button
                        onClick={() => navigator.clipboard.writeText(command)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-white"
                        title="Copy to clipboard"
                    >
                        <Copy size={14} />
                    </button>
                </div>
            </div>

            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                {logs.length === 0 && (
                    <div className="text-white/20 italic text-center mt-10">
                        Ready to execute commands...
                    </div>
                )}
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-2">
                        <span className="text-white/30 select-none">[{log.timestamp}]</span>
                        <span className={clsx(
                            "break-all whitespace-pre-wrap",
                            log.type === 'error' ? "text-red-400" :
                                log.type === 'info' ? "text-blue-300" :
                                    "text-white/80"
                        )}>
                            {log.message}
                        </span>
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
};
