import BookingSummary from '@/Components/booking/BookingSummary';
import ETicket from '@/Components/booking/ETicket';
import SandboxNotice from '@/Components/booking/SandboxNotice';
import Button from '@/Components/common/Button';
import ConfirmDialog from '@/Components/common/ConfirmDialog';
import DetailList from '@/Components/common/DetailList';
import Panel from '@/Components/common/Panel';
import StatusBadge from '@/Components/common/StatusBadge';
import StatusMessage from '@/Components/common/StatusMessage';
import TextField from '@/Components/form/TextField';
import AppLayout from '@/Layouts/AppLayout';
import { formatDateLong, formatDateTime, formatRupiah, formatTimeRange } from '@/lib/format';
import { loadSnap } from '@/lib/snap';
import { safeRoute } from '@/lib/utils';
import { router, useForm, usePage } from '@inertiajs/react';
import { CircleSlash, FileText, MapPin, MessageCircle, Wallet } from 'lucide-react';
import { useState } from 'react';

const TYPE_LABEL = { full: 'Bayar penuh', dp: 'DP', settlement: 'Pelunasan', offline: 'Di venue' };

export default function MyBookingShow({ booking, payments, invoice, venue, snap }) {
    const { flash } = usePage().props;
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [confirmCancel, setConfirmCancel] = useState(false);

    const cancelForm = useForm({ reason: '' });

    const pay = async () => {
        setProcessing(true);
        setError(null);

        try {
            const { data } = await window.axios.post(route('booking.pay', booking.code), { payment_option: 'full' });

            if (snap.enabled && data.token) {
                const client = await loadSnap(snap);

                client.pay(data.token, {
                    onSuccess: () => router.reload(),
                    onPending: () => router.reload(),
                    onError: () => {
                        setError('Pembayaran gagal diproses. Silakan coba lagi.');
                        setProcessing(false);
                    },
                    onClose: () => setProcessing(false),
                });

                return;
            }

            if (data.redirect_url) {
                window.location.href = data.redirect_url;

                return;
            }

            setError('Halaman pembayaran belum tersedia. Hubungi venue.');
        } catch (exception) {
            setError(exception.response?.data?.message ?? 'Tidak bisa memulai pembayaran. Coba lagi sebentar.');
        }

        setProcessing(false);
    };

    const paid = booking.payment_status === 'paid';
    const dpPaid = booking.payment_status === 'dp_paid';
    const mapsUrl = venue.coordinates?.lat
        ? `https://www.google.com/maps/search/?api=1&query=${venue.coordinates.lat},${venue.coordinates.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address || venue.name)}`;

    return (
        <AppLayout title={`Booking ${booking.code}`} back={{ href: route('my-bookings.index'), label: 'Booking saya' }}>
            <div className="grid gap-6 lg:grid-cols-12">
                <div className="flex flex-col gap-6 lg:col-span-7">
                    <header>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/8 px-3 py-1 font-mono text-sm font-semibold">{booking.code}</span>
                            <StatusBadge type="booking" value={booking.status} />
                            <StatusBadge type="payment" value={booking.payment_status} />
                        </div>
                        <h1 className="mt-4 font-display text-4xl leading-none font-semibold tracking-tight md:text-5xl">
                            {formatDateLong(booking.date)}
                        </h1>
                        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-bone-50/55">
                            <span className="tabular-nums">{formatTimeRange(booking.start_time, booking.end_time)} WIB</span>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center gap-1">
                                <MapPin aria-hidden className="size-3.5" />
                                {booking.court?.name}
                            </span>
                        </p>
                    </header>

                    {flash?.success && <StatusMessage tone="success">{flash.success}</StatusMessage>}
                    {(flash?.error || error) && <StatusMessage tone="error">{error ?? flash.error}</StatusMessage>}

                    {(paid || dpPaid) && <ETicket booking={booking} />}

                    {booking.can_pay && (
                        <Panel title="Pembayaran belum selesai" description="Slot masih ditahan sampai batas waktu pembayaran.">
                            <Button href={route('booking.checkout', booking.code)} icon={Wallet}>
                                Lanjutkan pembayaran
                            </Button>
                        </Panel>
                    )}

                    {booking.can_settle && (
                        <Panel
                            title="Sisa tagihan"
                            description={
                                booking.settlement_due_at
                                    ? `Lunasi paling lambat ${formatDateTime(booking.settlement_due_at)} WIB, atau bayar di venue sebelum check-in.`
                                    : 'Lunasi sebelum jam main, atau bayar di venue sebelum check-in.'
                            }
                        >
                            <p className="font-display text-3xl font-semibold tabular-nums">{formatRupiah(booking.remaining_amount)}</p>
                            <Button icon={Wallet} loading={processing} disabled={processing} onClick={pay} className="mt-5">
                                Lunasi sekarang
                            </Button>
                            <SandboxNotice snap={snap} className="mt-4" />
                        </Panel>
                    )}

                    {booking.status === 'cancelled' && booking.cancel_reason && (
                        <Panel title="Alasan pembatalan">
                            <p className="text-sm text-bone-50/70">{booking.cancel_reason}</p>
                        </Panel>
                    )}

                    <Panel title="Riwayat pembayaran">
                        {payments.length ? (
                            <ul className="divide-y divide-ink-800 text-sm">
                                {payments.map((payment) => (
                                    <li
                                        key={payment.order_id}
                                        className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium">{TYPE_LABEL[payment.type] ?? payment.type}</p>
                                            <p className="mt-0.5 text-xs text-bone-50/45">
                                                {payment.paid_at ? formatDateTime(payment.paid_at) : 'Belum dibayar'}
                                                {payment.payment_method ? ` · ${payment.payment_method}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="tabular-nums">{formatRupiah(payment.amount)}</span>
                                            <StatusBadge type="transaction" value={payment.status} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-bone-50/45">Belum ada transaksi.</p>
                        )}
                    </Panel>
                </div>

                <aside className="lg:col-span-5">
                    <div className="flex flex-col gap-4 lg:sticky lg:top-24">
                        <Panel title="Rincian">
                            <DetailList
                                items={[
                                    { label: 'Lapangan', value: booking.court?.name },
                                    { label: 'Pemain', value: `${booking.players_count} orang` },
                                    { label: 'Atas nama', value: booking.customer_name },
                                    { label: 'No. WhatsApp', value: booking.customer_phone },
                                    booking.notes && { label: 'Catatan', value: booking.notes },
                                    booking.checked_in_at && { label: 'Check-in', value: formatDateTime(booking.checked_in_at) },
                                ]}
                            />
                            <div className="mt-6 border-t border-ink-800 pt-6">
                                <BookingSummary
                                    items={booking.items}
                                    subtotal={booking.subtotal}
                                    serviceFee={booking.service_fee}
                                    discount={booking.discount}
                                    total={booking.total}
                                    rows={[
                                        { label: 'Sudah dibayar', value: formatRupiah(booking.paid_amount), tone: 'text-court-400' },
                                        booking.remaining_amount > 0 && {
                                            label: 'Sisa tagihan',
                                            value: formatRupiah(booking.remaining_amount),
                                            tone: 'text-amber-300',
                                        },
                                    ]}
                                />
                            </div>
                        </Panel>

                        <div className="flex flex-col gap-2">
                            {invoice && (
                                <Button href={invoice.url} variant="outline" icon={FileText}>
                                    Invoice {invoice.number}
                                </Button>
                            )}
                            <Button href={mapsUrl} variant="outline" icon={MapPin}>
                                Petunjuk arah
                            </Button>
                            {venue.whatsapp && (
                                <Button
                                    href={`https://wa.me/${venue.whatsapp}?text=Halo,%20saya%20mau%20tanya%20booking%20${booking.code}`}
                                    variant="outline"
                                    icon={MessageCircle}
                                >
                                    Hubungi venue
                                </Button>
                            )}
                            {booking.can_cancel ? (
                                <Button variant="ghost" icon={CircleSlash} className="text-red-300" onClick={() => setConfirmCancel(true)}>
                                    Batalkan booking
                                </Button>
                            ) : (
                                ['pending', 'confirmed'].includes(booking.status) && (
                                    <p className="px-2 text-center text-xs text-bone-50/40">
                                        Pembatalan mandiri hanya sampai {booking.cancel_before_hours} jam sebelum jam main. Setelah itu hubungi venue.
                                    </p>
                                )
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            <ConfirmDialog
                open={confirmCancel}
                onOpenChange={(open) => {
                    setConfirmCancel(open);
                    if (!open) cancelForm.reset();
                }}
                title="Batalkan booking?"
                description={
                    booking.paid_amount > 0
                        ? 'Slot akan dilepas. Pengajuan refund akan ditinjau admin sesuai kebijakan pembatalan.'
                        : 'Slot akan dilepas dan booking ini tidak bisa dibayar lagi.'
                }
                confirmLabel="Batalkan booking"
                cancelLabel="Tidak, kembali"
                destructive
                processing={cancelForm.processing}
                onConfirm={() =>
                    cancelForm.post(route('my-bookings.cancel', booking.code), {
                        preserveScroll: true,
                        onSuccess: () => setConfirmCancel(false),
                    })
                }
            >
                <TextField
                    id="reason"
                    label="Alasan (opsional)"
                    placeholder="Mis. ada perubahan jadwal"
                    value={cancelForm.data.reason}
                    error={cancelForm.errors.reason}
                    onChange={(event) => cancelForm.setData('reason', event.target.value)}
                />
            </ConfirmDialog>
        </AppLayout>
    );
}
