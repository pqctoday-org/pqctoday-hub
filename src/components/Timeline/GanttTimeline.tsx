interface GanttTimelineProps {
    startYear: number;
    endYear: number;
    className?: string;
}

export const GanttTimeline = ({ startYear, endYear, className = '' }: GanttTimelineProps) => {
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    const currentYear = new Date().getFullYear();

    return (
        <div className={`relative ${className}`}>
            {/* Year labels */}
            <div className="flex border-b border-white/10 pb-2">
                {years.map((year) => {
                    const isCurrentYear = year === currentYear;
                    return (
                        <div
                            key={year}
                            className="flex-1 text-center relative"
                            style={{ minWidth: '60px' }}
                        >
                            <span
                                className={`text-sm font-mono font-bold ${isCurrentYear ? 'text-primary' : 'text-muted'
                                    }`}
                            >
                                {year}
                            </span>
                            {isCurrentYear && (
                                <div
                                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-px h-4 bg-primary"
                                    aria-label="Current year indicator"
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Grid lines */}
            <div className="absolute inset-0 flex pointer-events-none" aria-hidden="true">
                {years.map((year) => (
                    <div
                        key={`grid-${year}`}
                        className="flex-1 border-r border-white/5"
                        style={{ minWidth: '60px' }}
                    />
                ))}
            </div>
        </div>
    );
};
