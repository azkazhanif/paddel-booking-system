import { cn } from '@/lib/utils';

/**
 * Ilustrasi garis lapangan padel (tampak atas). Dipakai sebagai visual hero & fallback foto lapangan.
 * Elemen [data-court-line] bisa dianimasikan dengan DrawSVG.
 */
export default function CourtVisual({ className, strokeClassName = 'stroke-current', glow = false }) {
    return (
        <svg viewBox="0 0 400 200" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
            {glow && <rect x="0" y="0" width="400" height="200" rx="6" className="fill-court-500/5" />}
            <g className={strokeClassName} strokeWidth="2" vectorEffect="non-scaling-stroke">
                <rect data-court-line x="10" y="10" width="380" height="180" rx="4" />
                <line data-court-line x1="200" y1="4" x2="200" y2="196" strokeDasharray="4 6" />
                <line data-court-line x1="80" y1="10" x2="80" y2="190" />
                <line data-court-line x1="320" y1="10" x2="320" y2="190" />
                <line data-court-line x1="80" y1="100" x2="320" y2="100" />
            </g>
        </svg>
    );
}
