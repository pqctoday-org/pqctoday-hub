import { useEffect, useRef, useState } from 'react';
import { useOpenSSLStore } from './store';
import { Terminal, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export const TerminalOutput = () => {
    const { logs, clearLogs } = useOpenSSLStore();
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [showStdout, setShowStdout] = useState(true);
    const [showStderr, setShowStderr] = useState(true);
    const [showDebug, setShowDebug] = useState(false);

    // Auto-scroll to bottom
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs, showStdout, showStderr, showDebug]);

    const filteredLogs = logs.filter(log => {
        const isDebug = log.message.startsWith('[Debug]');
        if (isDebug) return showDebug;

        if (log.type === 'stdout' || log.type === 'info') return showStdout;
        if (log.type === 'stderr' || log.type === 'error') return showStderr;

        return true;
    });

    return (
        <div className="h-full flex flex-col bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden font-mono text-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-muted">
                        <Terminal size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Terminal Output</span>
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg">
                        <label className={clsx(
                            "flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors select-none",
                            showStdout ? "bg-white/10 text-green-400" : "text-muted hover:text-white"
                        )}>
                            <input
                                type="checkbox"
                                checked={showStdout}
                                onChange={(e) => setShowStdout(e.target.checked)}
                                className="w-3 h-3 rounded border-white/20 bg-black/40 text-green-500 focus:ring-0 focus:ring-offset-0"
                            />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Stdout</span>
                        </label>

                        <label className={clsx(
                            "flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors select-none",
                            showStderr ? "bg-white/10 text-red-400" : "text-muted hover:text-white"
                        )}>
                            <input
                                type="checkbox"
                                checked={showStderr}
                                onChange={(e) => setShowStderr(e.target.checked)}
                                className="w-3 h-3 rounded border-white/20 bg-black/40 text-red-500 focus:ring-0 focus:ring-offset-0"
                            />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Stderr</span>
                        </label>

                        <label className={clsx(
                            "flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors select-none",
                            showDebug ? "bg-white/10 text-blue-400" : "text-muted hover:text-white"
                        )}>
                            <input
                                type="checkbox"
                                checked={showDebug}
                                onChange={(e) => setShowDebug(e.target.checked)}
                                className="w-3 h-3 rounded border-white/20 bg-black/40 text-blue-500 focus:ring-0 focus:ring-offset-0"
                            />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Debug</span>
                        </label>
                    </div>
                </div>

                <button
                    onClick={clearLogs}
                    className="text-xs text-muted hover:text-white flex items-center gap-1 transition-colors"
                >
                    <Trash2 size={12} /> Clear
                </button>
            </div>

            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                {filteredLogs.length === 0 && (
                    <div className="text-white/20 italic text-center mt-10">
                        {logs.length === 0 ? "Ready to execute commands..." : "No output in this stream."}
                    </div>
                )}
                {filteredLogs.map((log) => (
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
