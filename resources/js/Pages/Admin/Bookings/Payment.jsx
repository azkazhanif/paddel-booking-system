import Button from '@/Components/common/Button';
import DetailList from '@/Components/common/DetailList';
import PageHeader from '@/Components/common/PageHeader';
import Panel from '@/Components/common/Panel';
import StatusBadge from '@/Components/common/StatusBadge';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateLong, formatRupiah, formatTimeRange } from '@/lib/format';
import { Link, router } from '@inertiajs/react';
import { CircleAlert, CircleCheckBig, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

const POLL_MS = 4000;

export default function BookingPayment({ booking, payment, error }) {
    const settled = booking.payment_status === 'paid' || booking.remaining_amount === 0;
    const waiting = Boolean(payment) && !settled && payment.status === 'pending';

    // Selama QR aktif, halaman menarik status dari Midtrans berkala supaya pembayaran
    // tetap terdeteksi walau webhook belum sampai (mis. saat jalan di localhost).
    useEffect(() => {
        if (!waiting) return undefined;

        const timer = setInterval(() => router.reload({ only: ['booking', 'payment'] }), POLL_MS);

        return () => clearInterval(timer);
    }, [waiting]);

    return (
        <AdminLayout title={`Bayar ${booking.code}`}>
            <PageHeader
                back={{ href: route('admin.bookings.show', booking.id), label: `Detail ${booking.code}` }}
                title="Scan QRIS"
                description="Arahkan layar ini ke customer. Status akan berubah otomatis begitu pembayaran masuk."
                actions={
                    !settled && (
                        <Button
                            variant="outline"
                            icon={RefreshCw}
                            onClick={() => router.put(route('admin.bookings.payment.refresh', booking.id), {}, { preserveScroll: true })}
                        >
                            Buat QR baru
                        </Button>
                    )
                }
            />

            {error && (
                <div role="alert" className="flex items-start gap-3 rounded-md border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
                    <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-12">
                <Panel className="lg:col-span-7" bodyClassName="flex flex-col items-center justify-center gap-5 py-10">
                    {settled ? (
                        <Paid booking={booking} />
                    ) : payment?.qr_url ? (
                        <>
                            <div className="rounded-md bg-bone-50 p-4">
                                <img src={payment.qr_url} alt={`QRIS untuk booking ${booking.code}`} width={288} height={288} className="size-72 object-contain" />
                            </div>
                            <div className="text-center">
                                <p className="font-display text-3xl font-semibold tracking-tight">{formatRupiah(payment.amount)}</p>
                                <p className="mt-1 text-sm text-bone-50/55">Scan dengan aplikasi apa pun yang mendukung QRIS.</p>
                            </div>
                            <Waiting />
                        </>
                    ) : (
                        <p className="max-w-sm text-center text-sm text-bone-50/55">
                            QRIS belum tersedia. Coba “Buat QR baru”, atau catat pembayaran tunai dari halaman detail booking.
                        </p>
                    )}
                </Panel>

                <div className="flex flex-col gap-4 lg:col-span-5">
                    <Panel title="Booking">
                        <p className="font-mono text-sm font-semibold tracking-wide">{booking.code}</p>
                        <p className="mt-1 text-sm text-bone-50/60">
                            {formatDateLong(booking.date)} · {formatTimeRange(booking.start_time, booking.end_time)}
                        </p>
                        <div className="mt-4">
                            <DetailList
                                items={[
                                    { label: 'Lapangan', value: booking.court?.name },
                                    { label: 'Customer', value: booking.customer_name },
                                    { label: 'Total', value: formatRupiah(booking.total) },
                                    { label: 'Sudah dibayar', value: formatRupiah(booking.paid_amount) },
                                    { label: 'Sisa', value: <span className={booking.remaining_amount ? 'text-amber-300' : ''}>{formatRupiah(booking.remaining_amount)}</span> },
                                    { label: 'Status', value: <StatusBadge type="payment" value={booking.payment_status} /> },
                                ]}
                            />
                        </div>
                        <Button href={route('admin.bookings.show', booking.id)} variant="outline" size="sm" className="mt-5 w-full">
                            Buka detail booking
                        </Button>
                    </Panel>

                    {payment && (
                        <Panel title="Transaksi">
                            <DetailList
                                items={[
                                    { label: 'Order ID', value: <span className="font-mono text-xs">{payment.order_id}</span> },
                                    { label: 'Nominal', value: formatRupiah(payment.amount) },
                                    { label: 'Status', value: <StatusBadge type="transaction" value={payment.status} /> },
                                ]}
                            />
                        </Panel>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

function Waiting() {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setDots((value) => (value.length >= 3 ? '' : `${value}.`)), 500);

        return () => clearInterval(timer);
    }, []);

    return (
        <p role="status" className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-bone-50/60">
            <span aria-hidden className="size-2 animate-pulse rounded-full bg-amber-300" />
            Menunggu pembayaran{dots}
        </p>
    );
}

function Paid({ booking }) {
    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-court-500/15 text-court-400">
                <CircleCheckBig aria-hidden className="size-8" />
            </span>
            <div>
                <p className="font-display text-3xl font-semibold tracking-tight">Pembayaran diterima</p>
                <p className="mt-1 text-sm text-bone-50/55">Booking {booking.code} sudah lunas dan siap check-in.</p>
            </div>
            <Link href={route('admin.bookings.show', booking.id)} className="text-sm font-semibold text-court-400 hover:underline">
                Lihat detail booking
            </Link>
        </div>
    );
}
