import BookingSummary from '@/Components/booking/BookingSummary';
import CountdownTimer from '@/Components/booking/CountdownTimer';
import SandboxNotice from '@/Components/booking/SandboxNotice';
import VoucherField from '@/Components/booking/VoucherField';
import PaymentOptionCard from '@/Components/booking/PaymentOptionCard';
import Button from '@/Components/common/Button';
import DetailList from '@/Components/common/DetailList';
import Eyebrow from '@/Components/common/Eyebrow';
import Panel from '@/Components/common/Panel';
import StatusMessage from '@/Components/common/StatusMessage';
import AppLayout from '@/Layouts/AppLayout';
import { formatDateLong, formatRupiah, formatTimeRange } from '@/lib/format';
import { loadSnap } from '@/lib/snap';
import { safeRoute } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Check, Copy, ShieldCheck, Wallet } from 'lucide-react';
import { useState } from 'react';

export default function BookingCheckout({ booking, dp, snap }) {
    const [option, setOption] = useState('full');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const statusUrl = route('booking.status', booking.code);

    const pay = async () => {
        setProcessing(true);
        setError(null);

        try {
            const { data } = await window.axios.post(route('booking.pay', booking.code), { payment_option: option });

            if (snap.enabled && data.token) {
                const client = await loadSnap(snap);

                client.pay(data.token, {
                    onSuccess: () => router.visit(statusUrl),
                    onPending: () => router.visit(statusUrl),
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

    const copyGuestLink = async () => {
        try {
            await navigator.clipboard.writeText(booking.guest_url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('Salin link gagal. Salin manual dari kolom di atas.');
        }
    };

    const payingDp = option === 'dp' && dp.available;
    const amount = payingDp ? dp.amount : booking.remaining_amount;

    return (
        <AppLayout title={`Checkout ${booking.code}`} back={{ href: safeRoute('booking.create'), label: 'Ubah pilihan' }}>
            <div className="grid gap-6 lg:grid-cols-12">
                <div className="flex flex-col gap-6 lg:col-span-7">
                    <header>
                        <Eyebrow className="text-court-500">Checkout</Eyebrow>
                        <h1 className="mt-3 font-display text-4xl leading-none font-semibold tracking-tight md:text-5xl">Selesaikan pembayaran</h1>
                        <p className="mt-3 text-sm text-bone-50/55">
                            Booking <span className="font-mono font-semibold text-bone-50">{booking.code}</span> — slot ditahan sampai hitung mundur
                            habis.
                        </p>
                    </header>

                    <CountdownTimer until={booking.expires_at} onExpire={() => router.visit(statusUrl)} />

                    {error && <StatusMessage tone="error">{error}</StatusMessage>}

                    <SandboxNotice snap={snap} />

                    <Panel title="Metode pembayaran" description="Pilih nominal yang dibayar sekarang, lalu selesaikan lewat Midtrans.">
                        <div className="flex flex-col gap-2">
                            <PaymentOptionCard
                                id="pay-full"
                                name="payment_option"
                                value="full"
                                checked={option === 'full'}
                                onChange={setOption}
                                title="Bayar penuh"
                                amount={booking.total}
                                description="Langsung lunas — e-ticket terbit begitu pembayaran masuk."
                            />
                            <PaymentOptionCard
                                id="pay-dp"
                                name="payment_option"
                                value="dp"
                                checked={option === 'dp'}
                                onChange={setOption}
                                title={`DP ${dp.percentage}%`}
                                amount={dp.amount}
                                description={`Sisa ${formatRupiah(booking.total - dp.amount)} dilunasi paling lambat ${dp.settleBeforeHours} jam sebelum main.`}
                                locked={!dp.available}
                                lockedReason={dp.reason}
                                action={
                                    !dp.available &&
                                    booking.customer_type === 'guest' && (
                                        <Button href={safeRoute('register')} variant="outline" size="sm">
                                            Daftar gratis
                                        </Button>
                                    )
                                }
                            />
                        </div>

                        <Button icon={Wallet} loading={processing} disabled={processing} onClick={pay} className="mt-5 w-full" size="lg">
                            Bayar {formatRupiah(amount)}
                        </Button>

                        {!snap.enabled && (
                            <p className="mt-3 text-center text-xs text-amber-300/80">
                                Pembayaran online belum dikonfigurasi di server ini (kredensial Midtrans belum diisi).
                            </p>
                        )}

                        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-bone-50/40">
                            <ShieldCheck aria-hidden className="size-3.5" />
                            QRIS, e-wallet, virtual account, dan kartu — diproses oleh Midtrans.
                        </p>
                    </Panel>

                    <Panel title="Voucher" description="Potongan langsung memotong total tagihan sebelum pembayaran.">
                        <VoucherField code={booking.code} voucher={booking.voucher} />
                    </Panel>

                    {booking.guest_url && (
                        <Panel title="Simpan link booking" description="Buka link ini kapan saja untuk melanjutkan pembayaran atau melihat e-ticket.">
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                    readOnly
                                    value={booking.guest_url}
                                    aria-label="Link akses booking"
                                    onFocus={(event) => event.target.select()}
                                    className="h-11 w-full min-w-0 rounded-md border border-ink-700 bg-ink-900 px-4 text-sm text-bone-50/70"
                                />
                                <Button variant="outline" size="md" icon={copied ? Check : Copy} onClick={copyGuestLink} className="shrink-0">
                                    {copied ? 'Tersalin' : 'Salin'}
                                </Button>
                            </div>
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
                                        payingDp && { label: 'Dibayar sekarang (DP)', value: formatRupiah(dp.amount), tone: 'text-court-400' },
                                        payingDp && { label: 'Sisa tagihan', value: formatRupiah(booking.total - dp.amount), tone: 'text-amber-300' },
                                    ]}
                                />
                            </div>
                        </Panel>
                    </div>
                </aside>
            </div>
        </AppLayout>
    );
}
