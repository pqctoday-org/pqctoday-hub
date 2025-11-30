import { motion } from 'framer-motion';
import { useState } from 'react';
import { phaseColors, type TimelineEvent } from '../../data/timelineData';

interface MilestoneMarkerProps {
    event: TimelineEvent;
    startYear: number;
    endYear: number;
    onHover?: (event: TimelineEvent | null, position: { x: number; y: number }) => void;
    onClick?: (event: TimelineEvent) => void;
}

export const MilestoneMarker = ({ event, startYear, endYear, onHover, onClick }: MilestoneMarkerProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const totalYears = endYear - startYear + 1;
    const yearOffset = event.year - startYear;
    // Position at the center of the year column
    const leftPercent = ((yearOffset + 0.5) / totalYears) * 100;

    const colors = phaseColors[event.phase];

    const handleMouseEnter = (e: React.MouseEvent) => {
        setIsHovered(true);
        if (onHover) {
            const rect = e.currentTarget.getBoundingClientRect();
            onHover(event, {
                x: rect.left + rect.width / 2,
                y: rect.top
            });
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (onHover) {
            onHover(null, { x: 0, y: 0 });
        }
    };

    const handleClick = () => {
        if (onClick) {
            onClick(event);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10"
            style={{
                left: `${leftPercent}%`,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`${event.title} in ${event.year}`}
        >
            <motion.div
                className="w-3 h-3 rotate-45 border-2 relative"
                style={{
                    borderColor: colors.start,
                    backgroundColor: colors.start,
                    boxShadow: isHovered
                        ? `0 0 16px ${colors.glow}, 0 0 24px ${colors.glow}`
                        : `0 0 8px ${colors.glow}`,
                }}
                animate={{
                    scale: isHovered ? 1.5 : 1,
                }}
                transition={{ duration: 0.2 }}
            >
                {/* Inner glow */}
                <div
                    className="absolute inset-0.5"
                    style={{
                        background: `linear-gradient(135deg, ${colors.start}, ${colors.end})`,
                        opacity: 0.8,
                    }}
                />
            </motion.div>
        </motion.div>
    );
};
