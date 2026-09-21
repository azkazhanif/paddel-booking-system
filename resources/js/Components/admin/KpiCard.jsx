import BentoCard from '@/Components/common/BentoCard';
import { formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

/**
 * Cell KPI di BentoGrid. change: persen vs periode sebelumnya (null = tidak ada pembanding).
 * invert: true bila kenaikan itu buruk (mis. tingkat pembatalan).
 */
export default function KpiCard({ label, value, change, invert = false, icon: Icon, footer, tone = 'ink', colSpan = { md: 3, lg: 3 }, rowSpan = 1, className }) {
    const onDark = tone !== 'green' && tone !== 'lime' && tone !== 'bone';

    return (
        <BentoCard tone={tone} colSpan={colSpan} rowSpan={rowSpan} className={cn('justify-between gap-6 p-5 md:p-6', className)}>
            <div className="flex items-start justify-between gap-3">
                <p className={cn('text-sm font-medium', onDark ? 'text-bone-50/60' : 'text-ink-950/70')}>{label}</p>
                {Icon && <Icon aria-hidden className={cn('size-4 shrink-0', onDark ? 'text-bone-50/40' : 'text-ink-950/60')} />}
            </div>
            <div>
                <p className={cn('font-display leading-none font-semibold tracking-tight tabular-nums', rowSpan > 1 ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl')}>
                    {value}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {change !== undefined && <Change value={change} invert={invert} onDark={onDark} />}
                    {footer && <span className={onDark ? 'text-bone-50/50' : 'text-ink-950/70'}>{footer}</span>}
                </div>
            </div>
        </BentoCard>
    );
}

function Change({ value, invert, onDark }) {
    if (value === null) {
        return <span className={onDark ? 'text-bone-50/40' : 'text-ink-950/60'}>Belum ada pembanding</span>;
    }

    const good = invert ? value < 0 : value > 0;
    const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold tabular-nums',
                value === 0 ? 'bg-white/8 text-bone-50/60' : good ? 'bg-court-500/15 text-court-400' : 'bg-red-500/15 text-red-300',
                !onDark && 'bg-ink-950/10 text-ink-950',
            )}
            title="Dibanding periode sebelumnya"
        >
            <Icon aria-hidden className="size-3.5" />
            {formatPercent(Math.abs(value))}
            <span className="sr-only">{value > 0 ? 'naik' : value < 0 ? 'turun' : 'tetap'} dibanding periode sebelumnya</span>
        </span>
    );
}
