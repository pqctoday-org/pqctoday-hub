import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import type { TimelineEvent, TimelinePhase } from '../../data/timelineData';

interface GanttTooltipProps {
    content: TimelineEvent | TimelinePhase | null;
    position: { x: number; y: number };
    type: 'milestone' | 'phase';
}

export const GanttTooltip = ({ content, position, type }: GanttTooltipProps) => {
    if (!content) return null;

    const isMilestone = type === 'milestone';
    const event = content as TimelineEvent;
    const phase = content as TimelinePhase;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed z-50 pointer-events-none"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    transform: 'translate(-50%, -100%) translateY(-12px)',
                }}
            >
                <div className="glass-panel p-4 max-w-xs shadow-xl">
                    <div className="flex items-start gap-2 mb-2">
                        <div className="flex-1">
                            <h4 className="font-bold text-white mb-1">
                                {isMilestone ? event.title : phase.title}
                            </h4>
                            <p className="text-xs text-primary font-mono">
                                {isMilestone
                                    ? `${event.year}${event.quarter ? ` Q${event.quarter}` : ''}`
                                    : `${phase.startYear} - ${phase.endYear}`
                                }
                            </p>
                        </div>
                        {isMilestone && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 whitespace-nowrap">
                                {event.phase}
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-muted leading-relaxed mb-3">
                        {isMilestone ? event.description : phase.description}
                    </p>

                    {isMilestone && event.sourceUrl && (
                        <a
                            href={event.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted hover:text-white transition-colors pointer-events-auto"
                            aria-label={`Source for ${event.title} (opens in new window)`}
                        >
                            Source <ExternalLink size={10} aria-hidden="true" />
                        </a>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
