import { cn } from '@/lib/utils';
import { useState } from 'react';

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

/**
 * Skala sekuensial satu hue (hijau court) dari gelap → terang di atas latar ink. Nilai 0 tetap netral.
 */
const STEPS = [
    { min: 80, className: 'bg-court-400' },
    { min: 60, className: 'bg-court-500' },
    { min: 40, className: 'bg-court-500/65' },
    { min: 20, className: 'bg-court-500/40' },
    { min: 1, className: 'bg-court-500/20' },
    { min: 0, className: 'bg-white/[0.04]' },
];

const stepFor = (value) => STEPS.find((step) => value >= step.min);

/**
 * Heatmap okupansi hari × jam. data: { hours: [6..22], rows: [{ day: 1-7, values: [persen] }] }.
 */
export default function OccupancyHeatmap({ data, className }) {
    const [active, setActive] = useState(null);

    if (!data?.hours?.length) return null;

    return (
        <div className={cn('flex flex-col gap-4', className)}>
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
                <table className="w-full min-w-[40rem] border-separate border-spacing-0.5 text-[11px]">
                    <caption className="sr-only">Okupansi per hari dan jam dalam persen</caption>
                    <thead>
                        <tr>
                            <th scope="col" className="w-10" />
                            {data.hours.map((hour) => (
                                <th key={hour} scope="col" className="pb-1 text-center font-normal text-bone-50/40 tabular-nums">
                                    {String(hour).padStart(2, '0')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.map((row) => (
                            <tr key={row.day}>
                                <th scope="row" className="pr-2 text-left font-medium text-bone-50/50">
                                    {DAYS[row.day - 1]}
                                </th>
                                {row.values.map((value, index) => (
                                    <td key={data.hours[index]} className="p-0">
                                        <div
                                            tabIndex={0}
                                            onPointerEnter={() => setActive({ day: row.day, hour: data.hours[index], value })}
                                            onPointerLeave={() => setActive(null)}
                                            onFocus={() => setActive({ day: row.day, hour: data.hours[index], value })}
                                            onBlur={() => setActive(null)}
                                            className={cn(
                                                'h-7 rounded-md outline-none transition-shadow hover:ring-2 hover:ring-bone-50/70 focus-visible:ring-2 focus-visible:ring-bone-50',
                                                stepFor(value).className,
                                            )}
                                            aria-label={`${DAY_NAMES[row.day - 1]} ${String(data.hours[index]).padStart(2, '0')}.00: ${value}%`}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-bone-50/50">
                <p aria-live="polite" className="min-h-4 tabular-nums">
                    {active ? (
                        <>
                            <span className="text-bone-50">
                                {DAY_NAMES[active.day - 1]}, {String(active.hour).padStart(2, '0')}.00
                            </span>{' '}
                            — okupansi {active.value}%
                        </>
                    ) : (
                        'Arahkan kursor ke kotak untuk melihat detail'
                    )}
                </p>
                <div className="flex items-center gap-1.5">
                    <span>0%</span>
                    {[...STEPS].reverse().map((step) => (
                        <span key={step.min} className={cn('size-3 rounded-md', step.className)} />
                    ))}
                    <span>80%+</span>
                </div>
            </div>
        </div>
    );
}
