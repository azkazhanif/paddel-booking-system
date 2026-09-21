import BarList from '@/Components/admin/BarList';
import KpiCard from '@/Components/admin/KpiCard';
import OccupancyHeatmap from '@/Components/admin/OccupancyHeatmap';
import TrendChart from '@/Components/admin/TrendChart';
import BentoCard from '@/Components/common/BentoCard';
import BentoGrid from '@/Components/common/BentoGrid';
import EmptyState from '@/Components/common/EmptyState';
import PageHeader from '@/Components/common/PageHeader';
import Panel from '@/Components/common/Panel';
import SegmentedControl from '@/Components/common/SegmentedControl';
import StatusBadge from '@/Components/common/StatusBadge';
import TextLink from '@/Components/common/TextLink';
import { Input } from '@/Components/ui/input';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDate, formatDateShort, formatDateTime, formatNumber, formatPercent, formatRupiah, formatRupiahShort, formatTimeRange } from '@/lib/format';
import { Link, router, usePage } from '@inertiajs/react';
import { CalendarCheck, CalendarX, Gauge, TrendingUp, UserPlus, Wallet, WalletCards } from 'lucide-react';
import { useState } from 'react';

const PERIODS = [
    { value: 'today', label: 'Hari ini' },
    { value: '7d', label: '7 hari' },
    { value: '30d', label: '30 hari' },
    { value: 'month', label: 'Bulan ini' },
    { value: 'custom', label: 'Custom' },
];

const PAYMENT_TYPES = { full: 'Bayar penuh', dp: 'DP', settlement: 'Pelunasan', offline: 'Offline' };

const METHOD_LABELS = {
    qris: 'QRIS',
    gopay: 'GoPay',
    shopeepay: 'ShopeePay',
    bca_va: 'VA BCA',
    bni_va: 'VA BNI',
    bri_va: 'VA BRI',
    permata_va: 'VA Permata',
    credit_card: 'Kartu kredit',
    cash: 'Tunai',
    venue_qris: 'QRIS venue',
    bank_transfer: 'Transfer bank',
};

export default function Dashboard({ filters, kpis, revenueTrend, paymentMethods, courtBookings, heatmap, todayBookings, pendingPayments, topCustomers }) {
    const { auth } = usePage().props;
    const isOwner = auth.can.viewFinance;
    const [custom, setCustom] = useState({ from: filters.from, to: filters.to });
    const periodLabel = filters.from === filters.to ? formatDate(filters.from) : `${formatDate(filters.from)} – ${formatDate(filters.to)}`;

    const applyPeriod = (period) => {
        if (period === 'custom') {
            router.get(route('admin.dashboard'), { period, ...custom }, { preserveScroll: true, preserveState: true });
            return;
        }

        router.get(route('admin.dashboard'), period === '30d' ? {} : { period }, { preserveScroll: true, preserveState: true });
    };

    const { composition } = kpis;

    return (
        <AdminLayout title="Dashboard">
            <PageHeader
                title={`Halo, ${auth.user.name.split(' ')[0]}`}
                description={isOwner ? 'Ringkasan pendapatan, okupansi, dan aktivitas venue.' : 'Ringkasan okupansi dan aktivitas operasional venue.'}
            >
                <p className="mt-3 text-xs font-medium tracking-wide text-bone-50/40 uppercase">Periode: {periodLabel}</p>
            </PageHeader>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <SegmentedControl label="Periode" value={filters.period} onChange={applyPeriod} options={PERIODS} />
                {filters.period === 'custom' && (
                    <form
                        className="flex flex-wrap items-center gap-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            applyPeriod('custom');
                        }}
                    >
                        <Input type="date" aria-label="Dari tanggal" value={custom.from} max={custom.to} onChange={(event) => setCustom({ ...custom, from: event.target.value })} className="h-10 w-auto text-sm" />
                        <span className="text-bone-50/40">–</span>
                        <Input type="date" aria-label="Sampai tanggal" value={custom.to} min={custom.from} onChange={(event) => setCustom({ ...custom, to: event.target.value })} className="h-10 w-auto text-sm" />
                        <button type="submit" className="h-10 rounded-full bg-bone-50 px-4 text-sm font-semibold text-ink-950 hover:bg-court-500">
                            Terapkan
                        </button>
                    </form>
                )}
            </div>

            <BentoGrid className="md:auto-rows-[minmax(10rem,auto)]">
                {isOwner ? (
                    <KpiCard
                        tone="green"
                        colSpan={{ md: 6, lg: 6 }}
                        rowSpan={2}
                        label="Pendapatan diterima"
                        icon={Wallet}
                        value={formatRupiah(kpis.revenue.value)}
                        change={kpis.revenue.change}
                        footer={`Periode lalu ${formatRupiah(kpis.revenue.previous)}`}
                    />
                ) : (
                    <KpiCard
                        tone="green"
                        colSpan={{ md: 6, lg: 6 }}
                        rowSpan={2}
                        label="Jumlah booking"
                        icon={CalendarCheck}
                        value={formatNumber(kpis.bookings.value)}
                        change={kpis.bookings.change}
                        footer={`Periode lalu ${formatNumber(kpis.bookings.previous)}`}
                    />
                )}
                <KpiCard
                    colSpan={{ md: 3, lg: 3 }}
                    label="Okupansi"
                    icon={Gauge}
                    value={formatPercent(kpis.occupancy.value)}
                    change={kpis.occupancy.change}
                    footer="jam terpesan ÷ jam tersedia"
                />
                <KpiCard
                    tone="forest"
                    colSpan={{ md: 3, lg: 3 }}
                    label="Sisa tagihan DP"
                    icon={WalletCards}
                    value={formatRupiahShort(kpis.receivables.value)}
                    footer={`${formatNumber(kpis.receivables.count)} booking belum lunas`}
                />
                {isOwner ? (
                    <KpiCard
                        colSpan={{ md: 3, lg: 3 }}
                        label="Jumlah booking"
                        icon={CalendarCheck}
                        value={formatNumber(kpis.bookings.value)}
                        change={kpis.bookings.change}
                    />
                ) : (
                    <KpiCard colSpan={{ md: 3, lg: 3 }} label="Customer baru" icon={UserPlus} value={formatNumber(kpis.new_customers.value)} change={kpis.new_customers.change} />
                )}
                <KpiCard
                    colSpan={{ md: 3, lg: 3 }}
                    label="Tingkat pembatalan"
                    icon={CalendarX}
                    value={formatPercent(kpis.cancellation_rate.value)}
                    change={kpis.cancellation_rate.change}
                    invert
                />

                <CompositionCard composition={composition} wide={!isOwner} />

                {isOwner && (
                    <>
                        <KpiCard
                            colSpan={{ md: 3, lg: 4 }}
                            label="Rata-rata nilai booking"
                            icon={TrendingUp}
                            value={formatRupiah(kpis.average_value.value)}
                            change={kpis.average_value.change}
                        />
                        <KpiCard colSpan={{ md: 3, lg: 4 }} label="Customer baru" icon={UserPlus} value={formatNumber(kpis.new_customers.value)} change={kpis.new_customers.change} />
                    </>
                )}
            </BentoGrid>

            <div className="grid gap-4 lg:grid-cols-12">
                {isOwner && revenueTrend && (
                    <Panel title="Tren pendapatan harian" description="Pembayaran berstatus settlement (DP, pelunasan, bayar penuh)." className="lg:col-span-8">
                        {revenueTrend.length > 1 ? (
                            <TrendChart data={revenueTrend} label="Pendapatan" formatValue={formatRupiah} formatAxis={formatRupiahShort} formatDate={formatDateShort} />
                        ) : (
                            <p className="font-display text-5xl font-semibold tracking-tight tabular-nums">{formatRupiah(revenueTrend[0]?.value)}</p>
                        )}
                    </Panel>
                )}

                <Panel title="Booking per lapangan" description="Booking terkonfirmasi dalam periode." className={isOwner ? 'lg:col-span-4' : 'lg:col-span-5'}>
                    {courtBookings.some((court) => court.value > 0) ? (
                        <BarList data={courtBookings} formatValue={(value) => `${formatNumber(value)} booking`} />
                    ) : (
                        <EmptyState title="Belum ada booking" description="Belum ada booking terkonfirmasi di periode ini." className="py-8" />
                    )}
                </Panel>

                <Panel
                    title="Heatmap okupansi"
                    description="Persentase slot terisi per hari & jam — pakai untuk menentukan jam promo."
                    className={isOwner ? 'lg:col-span-8' : 'lg:col-span-7'}
                >
                    <OccupancyHeatmap data={heatmap} />
                </Panel>

                {isOwner && paymentMethods && (
                    <Panel title="Metode pembayaran" description="Total settlement per metode." className="lg:col-span-4">
                        {paymentMethods.length ? (
                            <BarList data={paymentMethods} formatValue={formatRupiahShort} formatLabel={(label) => METHOD_LABELS[label] ?? label} />
                        ) : (
                            <EmptyState title="Belum ada pembayaran" className="py-8" />
                        )}
                    </Panel>
                )}

                <Panel
                    title="Booking hari ini"
                    actions={<TextLink href={route('admin.bookings.index', { date_from: todayDate(), date_to: todayDate() })} className="text-sm">Lihat semua</TextLink>}
                    className="lg:col-span-5"
                    bodyClassName="px-0 md:px-0"
                >
                    {todayBookings.length ? (
                        <ul className="divide-y divide-ink-800">
                            {todayBookings.map((booking) => (
                                <li key={booking.id}>
                                    <Link href={route('admin.bookings.show', booking.id)} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/[0.03] md:px-6">
                                        <span className="w-24 shrink-0 font-display text-sm font-semibold tabular-nums">{formatTimeRange(booking.start_time, booking.end_time)}</span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">{booking.customer_name}</span>
                                            <span className="block truncate text-xs text-bone-50/50">{booking.court?.name}</span>
                                        </span>
                                        <StatusBadge type="booking" value={booking.status} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="Tidak ada booking hari ini" className="py-8" />
                    )}
                </Panel>

                <Panel title="Pembayaran pending" description="Menunggu customer menyelesaikan pembayaran." className="lg:col-span-3" bodyClassName="px-0 md:px-0">
                    {pendingPayments.length ? (
                        <ul className="divide-y divide-ink-800">
                            {pendingPayments.map((payment) => (
                                <li key={payment.id}>
                                    <Link href={route('admin.bookings.show', payment.booking_id)} className="block px-5 py-3 transition-colors hover:bg-white/[0.03] md:px-6">
                                        <span className="flex items-center justify-between gap-3 text-sm">
                                            <span className="truncate font-medium">{payment.booking?.customer_name}</span>
                                            <span className="font-semibold tabular-nums">{formatRupiahShort(payment.amount)}</span>
                                        </span>
                                        <span className="mt-0.5 block text-xs text-bone-50/50">
                                            {PAYMENT_TYPES[payment.type]} · {formatDateTime(payment.created_at)}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="Tidak ada yang pending" className="py-8" />
                    )}
                </Panel>

                <Panel
                    title="Top customer"
                    description={isOwner ? 'Berdasarkan total transaksi.' : 'Berdasarkan jumlah booking.'}
                    className="lg:col-span-4"
                    bodyClassName="px-0 md:px-0"
                >
                    {topCustomers.length ? (
                        <ol className="divide-y divide-ink-800">
                            {topCustomers.map((customer, index) => {
                                const content = (
                                    <>
                                        <span className="w-5 font-display text-sm font-semibold text-bone-50/40 tabular-nums">{index + 1}</span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">{customer.name}</span>
                                            <span className="block truncate text-xs text-bone-50/50">
                                                {formatNumber(customer.bookings)} booking · {customer.user_id ? 'Member' : 'Guest'}
                                            </span>
                                        </span>
                                        {customer.spent !== null && <span className="text-sm font-semibold tabular-nums">{formatRupiahShort(customer.spent)}</span>}
                                    </>
                                );

                                return (
                                    <li key={customer.email}>
                                        {customer.user_id ? (
                                            <Link href={route('admin.customers.show', customer.user_id)} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.03] md:px-6">
                                                {content}
                                            </Link>
                                        ) : (
                                            <div className="flex items-center gap-3 px-5 py-3 md:px-6">{content}</div>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    ) : (
                        <EmptyState title="Belum ada data" className="py-8" />
                    )}
                </Panel>
            </div>
        </AdminLayout>
    );
}

function CompositionCard({ composition, wide }) {
    const rows = [
        { label: 'Member', value: composition.member, other: 'Guest', otherValue: composition.guest },
        { label: 'DP', value: composition.dp, other: 'Bayar penuh', otherValue: composition.full },
    ];

    return (
        <BentoCard colSpan={{ md: 6, lg: wide ? 12 : 4 }} className="justify-between gap-5 p-5 md:p-6">
            <p className="text-sm font-medium text-bone-50/60">Komposisi booking</p>
            {rows.map((row) => {
                const total = row.value + row.otherValue;
                const ratio = total ? Math.round((row.value / total) * 100) : 0;

                return (
                    <div key={row.label}>
                        <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                            <span>
                                <span className="font-semibold">{row.label}</span> <span className="text-bone-50/50 tabular-nums">{formatNumber(row.value)}</span>
                            </span>
                            <span>
                                <span className="text-bone-50/50 tabular-nums">{formatNumber(row.otherValue)}</span> <span className="font-semibold">{row.other}</span>
                            </span>
                        </div>
                        <div className="flex h-2 gap-0.5" role="img" aria-label={`${row.label} ${ratio}%, ${row.other} ${100 - ratio}%`}>
                            {total ? (
                                <>
                                    <span className="rounded-full bg-court-500" style={{ width: `${ratio}%` }} />
                                    <span className="flex-1 rounded-full bg-bone-50/25" />
                                </>
                            ) : (
                                <span className="flex-1 rounded-full bg-white/5" />
                            )}
                        </div>
                    </div>
                );
            })}
        </BentoCard>
    );
}

function todayDate() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}
