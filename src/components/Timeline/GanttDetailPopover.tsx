import { X, ExternalLink, Calendar } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { TimelinePhase } from '../../types/timeline';
import { phaseColors } from '../../data/timelineData';
import { useEffect, useRef, useState } from 'react';

interface GanttDetailPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    phase: TimelinePhase | null;
    position: { x: number; y: number } | null;
}

export const GanttDetailPopover = ({ isOpen, onClose, phase, position }: GanttDetailPopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

    useEffect(() => {
        setMounted(true);
        const handleResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => {
            setMounted(false);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!mounted || !isOpen || !phase || !position) return null;

    const colors = phaseColors[phase.phase] || { start: '#64748b', end: '#94a3b8', glow: 'rgba(100, 116, 139, 0.5)' };

    // Get source details from the first event (assuming main event details are primary)
    const primaryEvent = phase.events[0];
    const sourceUrl = primaryEvent?.sourceUrl;
    const sourceDate = primaryEvent?.sourceDate;

    // Popover width in pixels (36rem = 576px)
    const POPOVER_WIDTH = 576;
    const HALF_WIDTH = POPOVER_WIDTH / 2;
    const MARGIN = 20; // Safety margin from screen edges

    // Calculate left position with boundary checks
    let left = position.x;
    let transformX = '-50%';

    // Check left boundary
    if (left - HALF_WIDTH < MARGIN) {
        left = MARGIN;
        transformX = '0%'; // Align left edge
    }
    // Check right boundary
    else if (left + HALF_WIDTH > viewportWidth - MARGIN) {
        left = viewportWidth - MARGIN;
        transformX = '-100%'; // Align right edge
    }

    // Calculate position style to keep it on screen
    const style: React.CSSProperties = {
        position: 'fixed',
        left: left,
        top: position.y,
        transform: `translate(${transformX}, -100%) translateY(-10px)`, // Move up and adjust horizontal alignment
        zIndex: 9999, // Ensure it's on top of everything
        backgroundColor: '#111827', // Force opaque dark gray (Tailwind gray-900)
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', // Strong shadow
    };

    const content = (
        <div
            ref={popoverRef}
            className="w-[36rem] border border-white/20 rounded-xl overflow-hidden animate-in zoom-in-95 duration-200"
            style={style}
        >
            {/* Header with Phase Color */}
            <div
                className="grid grid-cols-[auto_1fr] gap-4 items-center p-3 border-b border-white/10"
                style={{
                    background: `linear-gradient(to bottom, ${colors.glow} 0%, transparent 100%)`
                }}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted hover:text-white flex-none"
                    aria-label="Close details"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="min-w-0 flex flex-col justify-center">
                    <div
                        className="self-start inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white mb-1"
                        style={{ backgroundColor: colors.start }}
                    >
                        {phase.phase}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-tight truncate w-full">{phase.title}</h3>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                <div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                        {phase.description}
                    </p>
                </div>

                {/* Table Layout for Details: 4 columns (Label Value Label Value) */}
                <div className="pt-3 border-t border-white/5">
                    <table className="w-full text-xs border-collapse">
                        <tbody>
                            {/* Row 1: Start and End */}
                            <tr>
                                <td className="py-1.5 pr-3 text-muted uppercase tracking-wider font-medium text-[10px] whitespace-nowrap w-1">Start</td>
                                <td className="py-1.5 pr-6 font-mono text-white">{phase.startYear}</td>

                                <td className="py-1.5 pr-3 text-muted uppercase tracking-wider font-medium text-[10px] whitespace-nowrap w-1">End</td>
                                <td className="py-1.5 font-mono text-white">{phase.endYear}</td>
                            </tr>

                            {/* Row 2: Source and Date */}
                            <tr>
                                <td className="py-1.5 pr-3 text-muted uppercase tracking-wider font-medium text-[10px] whitespace-nowrap">Source</td>
                                <td className="py-1.5 pr-6">
                                    {sourceUrl ? (
                                        <a
                                            href={sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors truncate max-w-[120px]"
                                            title={sourceUrl}
                                        >
                                            <ExternalLink className="w-3 h-3 shrink-0" />
                                            <span className="truncate">View</span>
                                        </a>
                                    ) : (
                                        <span className="text-muted">-</span>
                                    )}
                                </td>

                                <td className="py-1.5 pr-3 text-muted uppercase tracking-wider font-medium text-[10px] whitespace-nowrap">Date</td>
                                <td className="py-1.5">
                                    <div className="flex items-center gap-1.5 text-white">
                                        <Calendar className="w-3 h-3 text-muted shrink-0" />
                                        <span className="truncate">{sourceDate || '-'}</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};
