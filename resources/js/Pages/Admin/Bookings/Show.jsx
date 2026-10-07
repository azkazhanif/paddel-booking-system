import Button from '@/Components/common/Button';
import ConfirmDialog from '@/Components/common/ConfirmDialog';
import DetailList from '@/Components/common/DetailList';
import PageHeader from '@/Components/common/PageHeader';
import Panel from '@/Components/common/Panel';
import StatusBadge from '@/Components/common/StatusBadge';
import TextLink from '@/Components/common/TextLink';
import SelectField from '@/Components/form/SelectField';
import TextField from '@/Components/form/TextField';
import TextareaField from '@/Components/form/TextareaField';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateLong, formatDateTime, formatRupiah, formatTimeRange } from '@/lib/format';
import { useForm } from '@inertiajs/react';
import { CircleAlert, MessageCircle, QrCode, ScanLine, Wallet, XCircle } from 'lucide-react';
import { useState } from 'react';

const PAYMENT_TYPES = { full: 'Bayar penuh', dp: 'DP', settlement: 'Pelunasan', offline: 'Offline' };
const PROVIDERS = { midtrans: 'Midtrans', cash: 'Tunai', venue_qris: 'QRIS venue', bank_transfer: 'Transfer bank' };

const OFFLINE_PROVIDERS = [
    { value: 'cash', label: 'Tunai' },
    { value: 'venue_qris', label: 'QRIS mesin venue' },
    { value: 'bank_transfer', label: 'Transfer bank' },
];

const REFUND_LABEL = { none: 'Tidak ada', requested: 'Menunggu diproses', processed: 'Sudah direfund', rejected: 'Ditolak' };

export default function BookingShow({ booking, can, checkInBlocker }) {
    const [cancelOpen, setCancelOpen] = useState(false);
    const [payOpen, setPayOpen] = useState(false);
    const cancelForm = useForm({ reason: '' });
    const checkInForm = useForm({});
    const payForm = useForm({ amount: booking.remaining_amount, provider: 'cash' });
    const refundForm = useForm({ amount: booking.paid_amount, status: 'processed' });

    const whatsapp = booking.customer_phone ? `https://wa.me/${booking.customer_phone}` : null;
    const paidRatio = booking.total ? Math.min(100, Math.round((booking.paid_amount / booking.total) * 100)) : 0;

    return (
        <AdminLayout title={`Booking ${booking.code}`}>
            <PageHeader
                back={{ href: route('admin.bookings.index'), label: 'Booking' }}
                title={<span className="font-mono tracking-wide">{booking.code}</span>}
                actions={
                    <>
                        {can.chargeQris && (
                            <Button href={route('admin.bookings.payment', booking.id)} icon={QrCode}>
                                Bayar QRIS
                            </Button>
                        )}
                        {can.recordPayment && (
                            <Button variant="outline" icon={Wallet} onClick={() => setPayOpen(true)}>
                                Catat pembayaran
                            </Button>
                        )}
                        {can.checkIn && (
                            <Button
                                icon={ScanLine}
                                loading={checkInForm.processing}
                                disabled={checkInForm.processing}
                                onClick={() => checkInForm.post(route('admin.bookings.check-in', booking.id), { preserveScroll: true })}
                            >
                                Check-in
                            </Button>
                        )}
                        {can.cancel && (
                            <Button
                                variant="outline"
                                icon={XCircle}
                                onClick={() => setCancelOpen(true)}
                                className="text-red-300 hover:border-red-500 [--fill:var(--color-red-500)] hover:text-bone-50"
                            >
                                Batalkan
                            </Button>
                        )}
                    </>
                }
            >
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge type="booking" value={booking.status} />
                    <StatusBadge type="payment" value={booking.payment_status} />
                    <StatusBadge type="customerType" value={booking.customer_type} />
                    <StatusBadge type="source" value={booking.source} />
                </div>
            </PageHeader>

            {booking.status === 'confirmed' && checkInBlocker && (
                <div
                    role="status"
                    className="flex items-start gap-3 rounded-md border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-200"
                >
                    <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                    <p>
                        {checkInBlocker}
                        {booking.remaining_amount > 0 && (
                            <>
                                {' '}
                                Sisa tagihan <strong className="tabular-nums">{formatRupiah(booking.remaining_amount)}</strong>.
                            </>
                        )}
                    </p>
                </div>
            )}

            {booking.status === 'cancelled' && (
                <div role="status" className="flex items-start gap-3 rounded-md border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
                    <XCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
                    <p>
                        Dibatalkan {booking.cancelled_by ? `oleh ${booking.cancelled_by.name} ` : ''}pada {formatDateTime(booking.cancelled_at)}
                        {booking.cancel_reason && <> — “{booking.cancel_reason}”</>}
                    </p>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-12">
                <div className="flex flex-col gap-4 lg:col-span-8">
                    <Panel title="Jadwal main">
                        <p className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{formatDateLong(booking.date)}</p>
                        <p className="mt-1 text-bone-50/60">
                            {formatTimeRange(booking.start_time, booking.end_time)} · {booking.court?.name} · {booking.players_count} pemain
                        </p>
                        <ul className="mt-6 divide-y divide-ink-800 rounded-md border border-ink-800">
                            {booking.items.map((item) => (
                                <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                                    <span className="tabular-nums">{formatTimeRange(item.start_time, item.end_time)}</span>
                                    <span className="flex items-center gap-3">
                                        {item.price_label && (
                                            <span className="text-xs text-bone-50/50 capitalize">{item.price_label.replace('_', ' ')}</span>
                                        )}
                                        <span className="font-medium tabular-nums">{formatRupiah(item.price)}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {booking.notes && <p className="mt-4 rounded-md bg-white/[0.03] p-4 text-sm text-bone-50/70">Catatan: {booking.notes}</p>}
                    </Panel>

                    <Panel title="Riwayat pembayaran" bodyClassName="px-0 md:px-0">
                        {booking.payments.length ? (
                            <ul className="divide-y divide-ink-800">
                                {booking.payments.map((payment) => (
                                    <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 md:px-6">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">
                                                {PAYMENT_TYPES[payment.type]} ·{' '}
                                                {payment.payment_method?.replaceAll('_', ' ').toUpperCase() ?? PROVIDERS[payment.provider]}
                                            </p>
                                            <p className="text-xs text-bone-50/50">
                                                <span className="font-mono">{payment.order_id}</span> ·{' '}
                                                {formatDateTime(payment.paid_at ?? payment.created_at)}
                                                {payment.recorded_by && <> · dicatat {payment.recorded_by.name}</>}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold tabular-nums">{formatRupiah(payment.amount)}</span>
                                            <StatusBadge type="transaction" value={payment.status} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="px-5 text-sm text-bone-50/50 md:px-6">Belum ada transaksi.</p>
                        )}
                    </Panel>
                </div>

                <div className="flex flex-col gap-4 lg:col-span-4">
                    <Panel title="Tagihan">
                        <div className="mb-5">
                            <div className="mb-2 flex items-baseline justify-between text-sm">
                                <span className="text-bone-50/50">Dibayar</span>
                                <span className="font-semibold tabular-nums">{paidRatio}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/5">
                                <div className="h-full rounded-full bg-court-500" style={{ width: `${paidRatio}%` }} />
                            </div>
                        </div>
                        <DetailList
                            items={[
                                { label: 'Subtotal', value: formatRupiah(booking.subtotal) },
                                booking.discount > 0 && { label: 'Diskon', value: `−${formatRupiah(booking.discount)}` },
                                booking.service_fee > 0 && { label: 'Biaya layanan', value: formatRupiah(booking.service_fee) },
                                { label: 'Total', value: <span className="font-display text-lg font-semibold">{formatRupiah(booking.total)}</span> },
                                {
                                    label: 'Opsi bayar',
                                    value:
                                        booking.payment_option === 'dp'
                                            ? `DP ${booking.dp_percentage}% (${formatRupiah(booking.dp_amount)})`
                                            : 'Bayar penuh',
                                },
                                { label: 'Sudah dibayar', value: formatRupiah(booking.paid_amount) },
                                {
                                    label: 'Sisa',
                                    value: (
                                        <span className={booking.remaining_amount ? 'text-amber-300' : ''}>
                                            {formatRupiah(booking.remaining_amount)}
                                        </span>
                                    ),
                                },
                                booking.settlement_due_at &&
                                    booking.remaining_amount > 0 && { label: 'Batas pelunasan', value: formatDateTime(booking.settlement_due_at) },
                                booking.invoice && { label: 'Invoice', value: <span className="font-mono text-xs">{booking.invoice.number}</span> },
                            ]}
                        />
                    </Panel>

                    <Panel
                        title="Pemesan"
                        actions={
                            booking.user && (
                                <TextLink href={route('admin.customers.show', booking.user.id)} className="text-sm">
                                    Profil member
                                </TextLink>
                            )
                        }
                    >
                        <DetailList
                            items={[
                                { label: 'Nama', value: booking.customer_name },
                                { label: 'Email', value: booking.customer_email },
                                { label: 'WhatsApp', value: booking.customer_phone },
                            ]}
                        />
                        {whatsapp && (
                            <Button href={whatsapp} variant="outline" size="sm" icon={MessageCircle} className="mt-5 w-full">
                                Hubungi via WhatsApp
                            </Button>
                        )}
                    </Panel>

                    {booking.paid_amount > 0 && booking.refund_status !== 'none' && (
                        <Panel title="Refund" description="Dana dikembalikan manual; di sini hanya dicatat agar invoice & laporan menyesuaikan.">
                            <DetailList
                                items={[
                                    { label: 'Status', value: REFUND_LABEL[booking.refund_status] ?? booking.refund_status },
                                    booking.refund_amount > 0 && { label: 'Nominal direfund', value: formatRupiah(booking.refund_amount) },
                                    { label: 'Maksimal', value: formatRupiah(booking.paid_amount) },
                                ]}
                            />
                            {booking.refund_status === 'requested' && (
                                <div className="mt-5 flex flex-col gap-3">
                                    <TextField
                                        id="refund_amount"
                                        label="Nominal yang dikembalikan"
                                        type="number"
                                        min="1"
                                        max={booking.paid_amount}
                                        step="1000"
                                        value={refundForm.data.amount}
                                        error={refundForm.errors.amount}
                                        onChange={(event) => refundForm.setData('amount', event.target.value)}
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            loading={refundForm.processing}
                                            disabled={refundForm.processing}
                                            onClick={() =>
                                                refundForm
                                                    .transform((data) => ({ ...data, status: 'processed' }))
                                                    .patch(route('admin.bookings.refund', booking.id), {
                                                        preserveScroll: true,
                                                    })
                                            }
                                        >
                                            Tandai sudah direfund
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-300"
                                            disabled={refundForm.processing}
                                            onClick={() =>
                                                refundForm
                                                    .transform((data) => ({ ...data, status: 'rejected' }))
                                                    .patch(route('admin.bookings.refund', booking.id), {
                                                        preserveScroll: true,
                                                    })
                                            }
                                        >
                                            Tolak
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Panel>
                    )}

                    <Panel title="Aktivitas">
                        <DetailList
                            items={[
                                { label: 'Dibuat', value: formatDateTime(booking.created_at) },
                                booking.created_by && { label: 'Dibuat oleh', value: booking.created_by.name },
                                booking.confirmed_at && { label: 'Terkonfirmasi', value: formatDateTime(booking.confirmed_at) },
                                booking.paid_at && { label: 'Lunas', value: formatDateTime(booking.paid_at) },
                                booking.checked_in_at && {
                                    label: 'Check-in',
                                    value: `${formatDateTime(booking.checked_in_at)}${booking.checked_in_by ? ` · ${booking.checked_in_by.name}` : ''}`,
                                },
                            ]}
                        />
                    </Panel>
                </div>
            </div>

            <ConfirmDialog
                open={payOpen}
                onOpenChange={(open) => {
                    setPayOpen(open);
                    if (!open) payForm.reset();
                }}
                title="Catat pembayaran diterima"
                description={`Sisa tagihan booking ini ${formatRupiah(booking.remaining_amount)}. Pembayaran langsung tercatat masuk.`}
                confirmLabel="Simpan pembayaran"
                processing={payForm.processing}
                onConfirm={() =>
                    payForm.post(route('admin.bookings.payment.store', booking.id), {
                        preserveScroll: true,
                        onSuccess: () => {
                            setPayOpen(false);
                            payForm.reset();
                        },
                    })
                }
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                        id="amount"
                        label="Nominal"
                        type="number"
                        min={1}
                        max={booking.remaining_amount}
                        value={payForm.data.amount}
                        error={payForm.errors.amount}
                        onChange={(event) => payForm.setData('amount', event.target.value)}
                        autoFocus
                    />
                    <SelectField
                        id="provider"
                        label="Metode"
                        options={OFFLINE_PROVIDERS}
                        value={payForm.data.provider}
                        error={payForm.errors.provider}
                        onChange={(event) => payForm.setData('provider', event.target.value)}
                    />
                </div>
            </ConfirmDialog>

            <ConfirmDialog
                open={cancelOpen}
                onOpenChange={(open) => {
                    setCancelOpen(open);
                    if (!open) cancelForm.reset();
                }}
                title="Batalkan booking ini?"
                description="Slot akan dilepas dan bisa dibooking customer lain. Refund (bila ada) diproses terpisah."
                confirmLabel="Batalkan booking"
                destructive
                processing={cancelForm.processing}
                onConfirm={() =>
                    cancelForm.post(route('admin.bookings.cancel', booking.id), {
                        preserveScroll: true,
                        onSuccess: () => {
                            setCancelOpen(false);
                            cancelForm.reset();
                        },
                    })
                }
            >
                <TextareaField
                    id="reason"
                    label="Alasan pembatalan"
                    rows={3}
                    placeholder="Mis. lapangan maintenance, permintaan customer…"
                    value={cancelForm.data.reason}
                    onChange={(event) => cancelForm.setData('reason', event.target.value)}
                    error={cancelForm.errors.reason}
                    autoFocus
                />
            </ConfirmDialog>
        </AdminLayout>
    );
}
