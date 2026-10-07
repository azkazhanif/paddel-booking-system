import Button from '@/Components/common/Button';
import EmptyState from '@/Components/common/EmptyState';
import Eyebrow from '@/Components/common/Eyebrow';
import Panel from '@/Components/common/Panel';
import StatusBadge from '@/Components/common/StatusBadge';
import StatusMessage from '@/Components/common/StatusMessage';
import SelectField from '@/Components/form/SelectField';
import TextField from '@/Components/form/TextField';
import AppLayout from '@/Layouts/AppLayout';
import { formatDateLong, formatRupiah, formatTime, formatTimeRange } from '@/lib/format';
import { router, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, CircleCheckBig, QrCode } from 'lucide-react';

export default function StaffToday({ courts, selected, today, bookings, summary }) {
    const { flash } = usePage().props;
    const checkIn = useForm({});

    const reload = (changes) =>
        router.get(
            route('staff.today'),
            { date: selected.date, court_id: selected.court_id ?? '', ...changes },
            { preserveState: true, preserveScroll: true },
        );

    return (
        <AppLayout title="Jadwal hari ini">
            <div className="flex flex-col gap-6">
                <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div>
                        <Eyebrow className="text-court-500">Staff</Eyebrow>
                        <h1 className="mt-3 font-display text-4xl leading-none font-semibold tracking-tight md:text-5xl">Hari ini di venue</h1>
                        <p className="mt-3 text-sm text-bone-50/55">
                            {formatDateLong(selected.date)} · {summary.total} booking · {summary.checked_in} sudah check-in
                            {summary.unsettled > 0 ? ` · ${summary.unsettled} belum lunas` : ''}
                        </p>
                    </div>
                    <p className="flex items-center gap-2 rounded-md border border-ink-800 bg-ink-900 px-4 py-3 text-sm text-bone-50/55">
                        <QrCode aria-hidden className="size-4 shrink-0 text-court-500" />
                        Pindai QR di e-ticket customer untuk check-in cepat.
                    </p>
                </header>

                {flash?.success && <StatusMessage tone="success">{flash.success}</StatusMessage>}
                {flash?.error && <StatusMessage tone="error">{flash.error}</StatusMessage>}

                <Panel>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                            id="date"
                            label="Tanggal"
                            type="date"
                            value={selected.date}
                            onChange={(event) => event.target.value && reload({ date: event.target.value })}
                        />
                        <SelectField
                            id="court_id"
                            label="Lapangan"
                            placeholder="Semua lapangan"
                            value={selected.court_id ? String(selected.court_id) : ''}
                            options={courts.map((court) => ({ value: String(court.id), label: court.name }))}
                            onChange={(event) => reload({ court_id: event.target.value })}
                        />
                    </div>
                    {selected.date !== today && (
                        <Button variant="ghost" size="sm" icon={CalendarDays} className="mt-3" onClick={() => reload({ date: today })}>
                            Kembali ke hari ini
                        </Button>
                    )}
                </Panel>

                {bookings.length ? (
                    <ul className="flex flex-col gap-3">
                        {bookings.map((booking) => (
                            <li key={booking.code}>
                                <article className="flex flex-col gap-4 rounded-md border border-ink-800 bg-ink-900 p-5 sm:flex-row sm:items-center">
                                    <div className="shrink-0 sm:w-32">
                                        <p className="font-display text-2xl font-semibold tabular-nums">{formatTime(booking.start_time)}</p>
                                        <p className="text-xs text-bone-50/45 tabular-nums">
                                            {formatTimeRange(booking.start_time, booking.end_time)}
                                        </p>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-sm font-semibold">{booking.code}</span>
                                            <StatusBadge type="booking" value={booking.status} />
                                            <StatusBadge type="payment" value={booking.payment_status} />
                                        </div>
                                        <p className="mt-2 font-medium">
                                            {booking.customer_name} · {booking.court?.name}
                                        </p>
                                        <p className="mt-0.5 text-sm text-bone-50/50">
                                            {booking.players_count} pemain · {booking.customer_phone}
                                            {booking.remaining_amount > 0 ? ` · sisa ${formatRupiah(booking.remaining_amount)}` : ''}
                                        </p>
                                        {booking.notes && <p className="mt-1 text-sm text-amber-300/80">Catatan: {booking.notes}</p>}
                                    </div>

                                    <div className="shrink-0">
                                        {booking.check_in_blocker ? (
                                            <p className="max-w-48 text-right text-xs text-bone-50/45">{booking.check_in_blocker}</p>
                                        ) : (
                                            <Button
                                                size="sm"
                                                icon={CircleCheckBig}
                                                loading={checkIn.processing}
                                                disabled={checkIn.processing}
                                                onClick={() => checkIn.post(route('staff.check-in', booking.code), { preserveScroll: true })}
                                            >
                                                Check-in
                                            </Button>
                                        )}
                                    </div>
                                </article>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={CalendarDays}
                        title="Belum ada booking"
                        description="Tidak ada jadwal pada tanggal & lapangan ini."
                        className="rounded-md border border-dashed border-ink-700"
                    />
                )}
            </div>
        </AppLayout>
    );
}
