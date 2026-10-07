import BarList from '@/Components/admin/BarList';
import DataTable from '@/Components/admin/DataTable';
import TrendChart from '@/Components/admin/TrendChart';
import Button from '@/Components/common/Button';
import EmptyState from '@/Components/common/EmptyState';
import PageHeader from '@/Components/common/PageHeader';
import Panel from '@/Components/common/Panel';
import SegmentedControl from '@/Components/common/SegmentedControl';
import { Input } from '@/Components/ui/input';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDate, formatDateShort, formatNumber, formatRupiah, formatRupiahShort } from '@/lib/format';
import { router } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useState } from 'react';

const PERIODS = [
    { value: '7d', label: '7 hari' },
    { value: '30d', label: '30 hari' },
    { value: '90d', label: '90 hari' },
    { value: 'month', label: 'Bulan ini' },
    { value: 'year', label: 'Tahun ini' },
    { value: 'custom', label: 'Kustom' },
];

const METHOD_LABEL = { cash: 'Tunai', venue_qris: 'QRIS venue', bank_transfer: 'Transfer bank', qris: 'QRIS', midtrans: 'Midtrans' };

export default function AdminReports({ filters, summary, revenueTrend, courts, paymentMethods, composition, exportUrl }) {
    const [custom, setCustom] = useState({ from: filters.from, to: filters.to });

    const periodLabel = filters.from === filters.to ? formatDate(filters.from) : `${formatDate(filters.from)} – ${formatDate(filters.to)}`;

    const applyPeriod = (period) => {
        if (period === 'custom') {
            router.get(route('admin.reports.index'), { period, ...custom }, { preserveScroll: true, preserveState: true });

            return;
        }

        router.get(route('admin.reports.index'), period === '30d' ? {} : { period }, { preserveScroll: true, preserveState: true });
    };

    const courtColumns = [
        { key: 'name', header: 'Lapangan', cell: (court) => <span className="font-medium">{court.name}</span> },
        { key: 'bookings', header: 'Booking', align: 'right', cell: (court) => formatNumber(court.bookings) },
        { key: 'hours', header: 'Slot terpakai', align: 'right', cell: (court) => formatNumber(court.hours) },
        { key: 'value', header: 'Nilai booking', align: 'right', cell: (court) => <span className="tabular-nums">{formatRupiah(court.value)}</span> },
        {
            key: 'paid',
            header: 'Terbayar',
            align: 'right',
            cell: (court) => <span className="tabular-nums text-court-400">{formatRupiah(court.paid)}</span>,
        },
    ];

    return (
        <AdminLayout title="Laporan">
            <PageHeader
                title="Laporan"
                description="Pendapatan dihitung dari pembayaran yang benar-benar masuk, bukan dari nilai booking."
                actions={
                    <Button href={exportUrl} variant="outline" icon={Download}>
                        Unduh CSV
                    </Button>
                }
            >
                <p className="mt-3 text-xs font-medium tracking-wide text-bone-50/40 uppercase">Periode: {periodLabel}</p>
            </PageHeader>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <SegmentedControl label="Periode" value={filters.period} onChange={applyPeriod} options={PERIODS} />
                {filters.period === 'custom' && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            type="date"
                            aria-label="Dari tanggal"
                            value={custom.from}
                            onChange={(event) => setCustom({ ...custom, from: event.target.value })}
                            className="h-10 w-auto text-sm"
                        />
                        <Input
                            type="date"
                            aria-label="Sampai tanggal"
                            value={custom.to}
                            onChange={(event) => setCustom({ ...custom, to: event.target.value })}
                            className="h-10 w-auto text-sm"
                        />
                        <Button size="sm" onClick={() => applyPeriod('custom')}>
                            Terapkan
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Pendapatan masuk" value={formatRupiah(summary.revenue)} tone="text-court-400" />
                <Stat label="Nilai booking" value={formatRupiah(summary.booked_value)} />
                <Stat label="Belum terbayar" value={formatRupiah(summary.outstanding)} tone={summary.outstanding ? 'text-amber-300' : undefined} />
                <Stat label="Rata-rata per booking" value={formatRupiah(summary.average_value)} />
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
                <Panel
                    title="Pendapatan harian"
                    description={`${summary.days} hari · ${formatNumber(summary.bookings)} booking`}
                    className="lg:col-span-8"
                >
                    <TrendChart
                        data={revenueTrend}
                        label="Pendapatan"
                        formatValue={formatRupiah}
                        formatAxis={formatRupiahShort}
                        formatDate={formatDateShort}
                    />
                </Panel>

                <Panel title="Metode pembayaran" description="Berdasarkan transaksi yang settle." className="lg:col-span-4">
                    {paymentMethods.length ? (
                        <BarList data={paymentMethods} formatValue={formatRupiah} formatLabel={(label) => METHOD_LABEL[label] ?? label} />
                    ) : (
                        <EmptyState title="Belum ada pembayaran" description="Belum ada transaksi yang settle di periode ini." className="py-8" />
                    )}
                </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
                <Panel title="Per lapangan" className="lg:col-span-8" bodyClassName="p-0 md:p-0">
                    <DataTable
                        bare
                        columns={courtColumns}
                        rows={courts}
                        rowKey="name"
                        empty={<EmptyState title="Belum ada data" description="Belum ada booking pada periode ini." className="py-8" />}
                    />
                </Panel>

                <Panel title="Komposisi" description="Jenis pemesan dan opsi pembayaran." className="lg:col-span-4">
                    <dl className="grid grid-cols-2 gap-3">
                        <Mini label="Tamu" value={formatNumber(composition.guest)} />
                        <Mini label="Member" value={formatNumber(composition.member)} />
                        <Mini label="Bayar penuh" value={formatNumber(composition.full)} />
                        <Mini label="DP" value={formatNumber(composition.dp)} />
                        <Mini label="No-show" value={formatNumber(summary.no_show)} tone={summary.no_show ? 'text-red-300' : undefined} />
                    </dl>
                </Panel>
            </div>
        </AdminLayout>
    );
}

function Stat({ label, value, tone }) {
    return (
        <div className="rounded-md border border-ink-800 bg-ink-900 p-5">
            <p className="text-xs tracking-[0.15em] text-bone-50/40 uppercase">{label}</p>
            <p className={`mt-2 font-display text-2xl font-semibold tabular-nums ${tone ?? ''}`}>{value}</p>
        </div>
    );
}

function Mini({ label, value, tone }) {
    return (
        <div className="rounded-md border border-ink-800 p-4">
            <dt className="text-xs text-bone-50/45">{label}</dt>
            <dd className={`mt-1 font-display text-xl font-semibold tabular-nums ${tone ?? ''}`}>{value}</dd>
        </div>
    );
}
