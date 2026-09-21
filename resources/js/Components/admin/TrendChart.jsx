import { cn } from '@/lib/utils';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

const HEIGHT = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 56 };

/**
 * Area chart satu seri dengan crosshair + tooltip. data: [{ date, value }].
 * formatValue: label nilai (tooltip & sumbu), formatAxis: label sumbu y ringkas, formatDate: label tanggal.
 */
export default function TrendChart({ data, formatValue, formatAxis = formatValue, formatDate, label = 'Nilai', className }) {
    const gradientId = useId();
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const [width, setWidth] = useState(640);
    const [hover, setHover] = useState(null);

    // Lebar viewBox mengikuti container agar teks sumbu tidak ikut membesar/mengecil
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
        if (containerRef.current) observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    const { points, ticks, max } = useMemo(() => {
        const maxValue = Math.max(...data.map((point) => point.value), 0);
        const niceMax = niceCeil(maxValue);
        const innerWidth = width - PAD.left - PAD.right;
        const innerHeight = HEIGHT - PAD.top - PAD.bottom;
        const step = data.length > 1 ? innerWidth / (data.length - 1) : 0;

        return {
            max: niceMax,
            ticks: [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({ value: niceMax * ratio, y: PAD.top + innerHeight * (1 - ratio) })),
            points: data.map((point, index) => ({
                ...point,
                x: PAD.left + (data.length > 1 ? step * index : innerWidth / 2),
                y: PAD.top + innerHeight * (1 - (niceMax ? point.value / niceMax : 0)),
            })),
        };
    }, [data, width]);

    if (!data.length) return null;

    const baseline = HEIGHT - PAD.bottom;
    const line = points.map((point, index) => `${index ? 'L' : 'M'}${point.x},${point.y}`).join(' ');
    const area = `${line} L${points[points.length - 1].x},${baseline} L${points[0].x},${baseline} Z`;
    const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(width / 90))));

    const handleMove = (event) => {
        const rect = svgRef.current.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * width;
        const nearest = points.reduce((best, point) => (Math.abs(point.x - x) < Math.abs(best.x - x) ? point : best), points[0]);
        setHover(nearest);
    };

    return (
        <div ref={containerRef} className={cn('relative w-full', className)}>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${HEIGHT}`}
                width="100%"
                height={HEIGHT}
                role="img"
                aria-label={`${label}: grafik tren ${points.length} hari, tertinggi ${formatValue(Math.max(...data.map((point) => point.value)))}`}
                onPointerMove={handleMove}
                onPointerLeave={() => setHover(null)}
                className="touch-pan-y overflow-visible"
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-court-500)" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="var(--color-court-500)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {ticks.map((tick) => (
                    <g key={tick.value}>
                        <line x1={PAD.left} x2={width - PAD.right} y1={tick.y} y2={tick.y} stroke="currentColor" strokeOpacity={tick.value === 0 ? 0.2 : 0.06} />
                        <text x={PAD.left - 10} y={tick.y} dy="0.32em" textAnchor="end" className="fill-bone-50/40 text-[11px] tabular-nums">
                            {max ? formatAxis(tick.value) : tick.value === 0 ? formatAxis(0) : ''}
                        </text>
                    </g>
                ))}

                {points.map((point, index) =>
                    index % labelEvery === 0 || index === points.length - 1 ? (
                        <text key={point.date} x={point.x} y={HEIGHT - 8} textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'} className="fill-bone-50/40 text-[11px]">
                            {formatDate(point.date)}
                        </text>
                    ) : null,
                )}

                <path d={area} fill={`url(#${gradientId})`} />
                <path d={line} fill="none" stroke="var(--color-court-500)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

                {hover && (
                    <g>
                        <line x1={hover.x} x2={hover.x} y1={PAD.top} y2={baseline} stroke="currentColor" strokeOpacity="0.25" strokeDasharray="3 3" />
                        <circle cx={hover.x} cy={hover.y} r="5" fill="var(--color-court-500)" stroke="var(--color-ink-900)" strokeWidth="2" />
                    </g>
                )}
            </svg>

            {hover && (
                <div
                    className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-xs whitespace-nowrap shadow-xl shadow-black/40"
                    style={{ left: `${Math.min(Math.max((hover.x / width) * 100, 12), 88)}%` }}
                >
                    <p className="text-bone-50/50">{formatDate(hover.date)}</p>
                    <p className="mt-0.5 font-semibold tabular-nums">{formatValue(hover.value)}</p>
                </div>
            )}
        </div>
    );
}

function niceCeil(value) {
    if (value <= 0) return 0;

    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;
    const nice = [1, 2, 2.5, 5, 10].find((step) => normalized <= step);

    return nice * magnitude;
}
