import Button from '@/Components/common/Button';
import DetailList from '@/Components/common/DetailList';
import Panel from '@/Components/common/Panel';
import StatusBadge from '@/Components/common/StatusBadge';
import StatusMessage from '@/Components/common/StatusMessage';
import AppLayout from '@/Layouts/AppLayout';
import { formatDateLong, formatDateTime, formatRupiah, formatTimeRange } from '@/lib/format';
import { useForm, usePage } from '@inertiajs/react';
import { CircleAlert, CircleCheckBig, ListChecks } from 'lucide-react';

export default function StaffScan({ booking }) {
    const { flash } = usePage().props;
    const form = useForm({});

    const checkedIn = booking.status === 'checked_in';
    const blocked = Boolean(booking.check_in_blocker) && !checkedIn;

    return (
        <AppLayout title={`Check-in ${booking.code}`} back={{ href: route('staff.today'), label: 'Jadwal hari ini' }}>
            <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
                <header className="flex flex-col items-start gap-4">
                    <span
                        className={`grid size-14 place-items-center rounded-full ${
                            checkedIn ? 'bg-court-500/15 text-court-400' : blocked ? 'bg-amber-400/15 text-amber-300' : 'bg-white/8 text-bone-50/60'
                        }`}
                    >
                        {checkedIn ? (
                            <CircleCheckBig aria-hidden className="size-7" />
                        ) : blocked ? (
                            <CircleAlert aria-hidden className="size-7" />
                        ) : (
                            <ListChecks aria-hidden className="size-7" />
                        )}
                    </span>
                    <div>
                        <h1 className="font-display text-4xl leading-none font-semibold tracking-tight">
                            {checkedIn ? 'Sudah check-in' : blocked ? 'Belum bisa check-in' : 'Siap check-in'}
                        </h1>
                        <p className="mt-3 text-sm text-bone-50/55">
                            {booking.customer_name} · {booking.players_count} pemain
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/8 px-3 py-1 font-mono text-sm font-semibold">{booking.code}</span>
                        <StatusBadge type="booking" value={booking.status} />
                        <StatusBadge type="payment" value={booking.payment_status} />
                    </div>
                </header>

                {flash?.success && <StatusMessage tone="success">{flash.success}</StatusMessage>}
                {flash?.error && <StatusMessage tone="error">{flash.error}</StatusMessage>}
                {blocked && !flash?.error && <StatusMessage tone="error">{booking.check_in_blocker}</StatusMessage>}

                <Panel title="Detail booking">
                    <DetailList
                        items={[
                            { label: 'Lapangan', value: booking.court?.name },
                            { label: 'Tanggal', value: formatDateLong(booking.date) },
                            { label: 'Jam', value: formatTimeRange(booking.start_time, booking.end_time) },
                            { label: 'No. WhatsApp', value: booking.customer_phone },
                            { label: 'Total', value: formatRupiah(booking.total) },
                            { label: 'Sudah dibayar', value: formatRupiah(booking.paid_amount) },
                            booking.remaining_amount > 0 && {
                                label: 'Sisa tagihan',
                                value: <span className="text-amber-300">{formatRupiah(booking.remaining_amount)}</span>,
                            },
                            booking.notes && { label: 'Catatan', value: booking.notes },
                            booking.checked_in_at && { label: 'Check-in', value: formatDateTime(booking.checked_in_at) },
                        ]}
                    />

                    {!checkedIn && !blocked && (
                        <Button
                            icon={CircleCheckBig}
                            loading={form.processing}
                            disabled={form.processing}
                            onClick={() => form.post(route('staff.check-in', booking.code), { preserveScroll: true })}
                            className="mt-6 w-full"
                            size="lg"
                        >
                            Konfirmasi check-in
                        </Button>
                    )}

                    {booking.remaining_amount > 0 && (
                        <p className="mt-4 text-center text-xs text-bone-50/45">
                            Terima pelunasan dulu lewat panel admin (tunai atau QRIS), lalu ulangi check-in.
                        </p>
                    )}
                </Panel>
            </div>
        </AppLayout>
    );
}
