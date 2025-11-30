import { X } from 'lucide-react';
import type { TimelinePhase } from '../../types/timeline';
import { phaseColors } from '../../data/timelineData';

interface GanttDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    phase: TimelinePhase | null;
}

export const GanttDetailModal = ({ isOpen, onClose, phase }: GanttDetailModalProps) => {
    if (!isOpen || !phase) return null;

    const colors = phaseColors[phase.phase];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-md bg-[#0b0d17] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Phase Color */}
                <div
                    className="p-6 pb-4 border-b border-white/10"
                    style={{
                        background: `linear-gradient(to bottom, ${colors.glow} 0%, transparent 100%)`
                    }}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div
                                className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white mb-2"
                                style={{ backgroundColor: colors.start }}
                            >
                                {phase.phase}
                            </div>
                            <h3 className="text-xl font-bold text-white">{phase.title}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-muted hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <h4 className="text-sm font-medium text-muted mb-1">Description</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            {phase.description}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <div>
                            <h4 className="text-xs font-medium text-muted uppercase tracking-wider">Start Year</h4>
                            <p className="text-lg font-mono text-white">{phase.startYear}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <div>
                            <h4 className="text-xs font-medium text-muted uppercase tracking-wider">End Year</h4>
                            <p className="text-lg font-mono text-white">{phase.endYear}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
