
import { Workbench } from './Workbench';
import { TerminalOutput } from './TerminalOutput';
import { FileManager } from './FileManager';
import { Terminal } from 'lucide-react';

export const OpenSSLStudioView = () => {
    return (
        <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in">
            <div className="mb-6 shrink-0">
                <h2 className="text-3xl font-bold text-gradient mb-2 flex items-center gap-3">
                    <Terminal className="text-primary" aria-hidden="true" />
                    OpenSSL Studio
                </h2>
                <p className="text-muted">
                    Interactive OpenSSL v3.5.4 environment running entirely in your browser via WebAssembly.
                </p>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* Left Pane: Workbench (Command Builder) */}
                <div className="col-span-12 lg:col-span-4 glass-panel flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-white/5">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            Workbench
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <Workbench />
                    </div>
                </div>

                {/* Right Pane: Terminal & Files */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 min-h-0">
                    {/* Top Right: Terminal Output */}
                    <div className="flex-[2] min-h-0">
                        <TerminalOutput />
                    </div>

                    {/* Bottom Right: File Manager */}
                    <div className="flex-1 min-h-0">
                        <FileManager />
                    </div>
                </div>
            </div>
        </div>
    );
};
