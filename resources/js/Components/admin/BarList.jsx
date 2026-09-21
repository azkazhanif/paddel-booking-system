import { cn } from '@/lib/utils';

/**
 * Bar horizontal satu seri untuk perbandingan besaran (lapangan, metode bayar). data: [{ label, value }].
 * Label & nilai memakai warna teks; bar hanya penanda besaran.
 */
export default function BarList({ data, formatValue = String, formatLabel = (label) => label, className }) {
    const max = Math.max(...data.map((item) => item.value), 0);

    return (
        <ul className={cn('flex flex-col gap-4', className)}>
            {data.map((item) => {
                const ratio = max ? item.value / max : 0;

                return (
                    <li key={item.label} className="group" title={`${formatLabel(item.label)}: ${formatValue(item.value)}`}>
                        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                            <span className="truncate text-bone-50/80">{formatLabel(item.label)}</span>
                            <span className="font-semibold tabular-nums">{formatValue(item.value)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5">
                            <div
                                className="h-full rounded-full bg-court-500 transition-[width,opacity] duration-500 group-hover:opacity-80"
                                style={{ width: `${Math.max(ratio * 100, item.value ? 2 : 0)}%` }}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
