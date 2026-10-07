import BookingSummary from '@/Components/booking/BookingSummary';
import ETicket from '@/Components/booking/ETicket';
import Button from '@/Components/common/Button';
import DetailList from '@/Components/common/DetailList';
import Panel from '@/Components/common/Panel';
import StatusBadge from '@/Components/common/StatusBadge';
import StatusMessage from '@/Components/common/StatusMessage';
import AppLayout from '@/Layouts/AppLayout';
import { formatDateLong, formatDateTime, formatRupiah, formatTimeRange } from '@/lib/format';
import { loadSnap } from '@/lib/snap';
import { safeRoute } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { CalendarPlus, CircleAlert, CircleCheckBig, Clock, FileText, MessageCircle, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

const POLL_MS = 5000;

const STATE = {
    paid: {
        icon: CircleCheckBig,
        tone: 'text-court-400 bg-court-500/15',
        title: 'Pembayaran lunas',
        description: 'Booking terkonfirmasi. Tunjukkan e-ticket di bawah saat tiba di venue.',
    },
    dp_paid: {
        icon: CircleCheckBig,
        tone: 'text-lime-300 bg-lime-300/15',
        title: 'DP diterima',
        description: 'Slot sudah dikunci untukmu. Lunasi sisa tagihan sebelum jam main.',
    },
    waiting: {
        icon: Clock,
        tone: 'text-amber-300 bg-amber-400/15',
        title: 'Menunggu pembayaran',
        description: 'Selesaikan pembayaran sebelum batas waktu, halaman ini akan memperbarui statusnya sendiri.',
    },
    failed: {
        icon: CircleAlert,
        tone: 'text-red-300 bg-red-500/15',
        title: 'Booking tidak aktif',
        description: 'Slot sudah dilepas. Silakan pilih jam lain untuk booking ulang.',
    },
};

export default function BookingStatus({ booking, payment, invoice, venue, snap }) {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const paid = booking.payment_status === 'paid';
    const dpPaid = booking.payment_status === 'dp_paid';
    const dead = ['expired', 'cancelled', 'no_show'].includes(booking.status);
    const waiting = !paid && !dpPaid && !dead;
    const state = STATE[paid ? 'paid' : dpPaid ? 'dp_paid' : dead ? 'failed' : 'waiting'];

    // Status dibaca dari database (hasil webhook); halaman menarik ulang selama masih menunggu.
    useEffect(() => {
        if (!waiting) return undefined;

        const timer = setInterval(() => router.reload({ only: ['booking', 'payment'] }), POLL_MS);

        return () => clearInterval(timer);
    }, [waiting]);

    const settle = async () => {
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

            setError('Halaman pembayaran belum tersedia. Hubungi admin venue.');
        } catch (exception) {
            setError(exception.response?.data?.message ?? 'Tidak bisa memulai pembayaran. Coba lagi sebentar.');
        }

        setProcessing(false);
    };

    const StateIcon = state.icon;

    return (
        <AppLayout title={`Booking ${booking.code}`} back={{ href: safeRoute('home', '/'), label: 'Beranda' }}>
            <div className="grid gap-6 lg:grid-cols-12">
                <div className="flex flex-col gap-6 lg:col-span-7">
                    <header className="flex flex-col items-start gap-4">
                        <span className={`grid size-14 place-items-center rounded-full ${state.tone}`}>
                            <StateIcon aria-hidden className="size-7" />
                        </span>
                        <div>
                            <h1 className="font-display text-4xl leading-none font-semibold tracking-tight md:text-5xl">{state.title}</h1>
                            <p className="mt-3 max-w-lg text-sm text-bone-50/55">{state.description}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/8 px-3 py-1 font-mono text-sm font-semibold">{booking.code}</span>
                            <StatusBadge type="booking" value={booking.status} />
                            <StatusBadge type="payment" value={booking.payment_status} />
                        </div>
                    </header>

                    {error && <StatusMessage tone="error">{error}</StatusMessage>}

                    {booking.customer_type === 'guest' && paid && (
                        <StatusMessage tone="success">
                            Simpan halaman ini sebagai bukti booking. Buat akun dengan email <strong>{booking.customer_email}</strong> supaya
                            riwayat booking tersimpan dan bisa bayar DP di booking berikutnya.
                        </StatusMessage>
                    )}

                    {(paid || dpPaid) && <ETicket booking={booking} />}

                    {waiting && (
                        <Panel title="Lanjutkan pembayaran">
                            <p className="text-sm text-bone-50/55">
                                Belum sempat membayar? Buka kembali halaman checkout selama slot masih ditahan.
                            </p>
                            <Button href={route('booking.checkout', booking.code)} icon={Wallet} className="mt-4">
                                Buka checkout
                            </Button>
                        </Panel>
                    )}

                    {dead && (
                        <Panel title="Booking ulang">
                            <p className="text-sm text-bone-50/55">Slot ini sudah dilepas dan bisa dipesan orang lain. Pilih jam lain yang masih kosong.</p>
                            <Button href={safeRoute('booking.create')} icon={CalendarPlus} className="mt-4">
                                Cari jadwal lain
                            </Button>
                        </Panel>
                    )}

                    {dpPaid && booking.can_settle && (
                        <Panel
                            title="Sisa tagihan"
                            description={
                                booking.settlement_due_at
                                    ? `Lunasi paling lambat ${formatDateTime(booking.settlement_due_at)} WIB, atau bayar di venue sebelum check-in.`
                                    : 'Lunasi sebelum jam main, atau bayar di venue sebelum check-in.'
                            }
                        >
                            <p className="font-display text-3xl font-semibold tabular-nums">{formatRupiah(booking.remaining_amount)}</p>
                            <Button icon={Wallet} loading={processing} disabled={processing} onClick={settle} className="mt-5">
                                Lunasi sekarang
                            </Button>
                        </Panel>
                    )}
                </div>

                <aside className="lg:col-span-5">
                    <div className="flex flex-col gap-4 lg:sticky lg:top-24">
                        <Panel title="Detail booking">
                            <DetailList
                                items={[
                                    { label: 'Lapangan', value: booking.court?.name },
                                    { label: 'Tanggal', value: formatDateLong(booking.date) },
                                    { label: 'Jam', value: formatTimeRange(booking.start_time, booking.end_time) },
                                    { label: 'Pemain', value: `${booking.players_count} orang` },
                                    { label: 'Atas nama', value: booking.customer_name },
                                    { label: 'Email', value: booking.customer_email },
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

                        {payment && (
                            <Panel title="Transaksi terakhir">
                                <DetailList
                                    items={[
                                        { label: 'Order ID', value: <span className="font-mono text-xs break-all">{payment.order_id}</span> },
                                        { label: 'Nominal', value: formatRupiah(payment.amount) },
                                        { label: 'Metode', value: payment.payment_method ?? '—' },
                                        { label: 'Status', value: <StatusBadge type="transaction" value={payment.status} /> },
                                        payment.paid_at && { label: 'Dibayar', value: formatDateTime(payment.paid_at) },
                                    ]}
                                />
                            </Panel>
                        )}

                        {invoice && (
                            <Button href={invoice.url} variant="outline" icon={FileText}>
                                Lihat invoice {invoice.number}
                            </Button>
                        )}

                        {venue.whatsapp && (
                            <Button href={`https://wa.me/${venue.whatsapp}?text=Halo,%20saya%20mau%20tanya%20booking%20${booking.code}`} variant="outline" icon={MessageCircle}>
                                Hubungi venue
                            </Button>
                        )}
                    </div>
                </aside>
            </div>
        </AppLayout>
    );
}
