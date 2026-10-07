import DataTable from '@/Components/admin/DataTable';
import FilterBar from '@/Components/admin/FilterBar';
import Button from '@/Components/common/Button';
import EmptyState from '@/Components/common/EmptyState';
import PageHeader from '@/Components/common/PageHeader';
import Pagination from '@/Components/common/Pagination';
import Panel from '@/Components/common/Panel';
import SegmentedControl from '@/Components/common/SegmentedControl';
import StatusBadge from '@/Components/common/StatusBadge';
import SelectField from '@/Components/form/SelectField';
import { useFilters } from '@/hooks/useFilters';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDate, formatDateTime, formatNumber, formatRupiah, formatTimeRange } from '@/lib/format';
import { Link } from '@inertiajs/react';
import { WalletCards } from 'lucide-react';

const SCOPES = [
    { value: 'upcoming', label: 'Akan datang' },
    { value: 'overdue', label: 'Lewat batas' },
    { value: 'past', label: 'Sudah lewat' },
    { value: 'all', label: 'Semua' },
];

export default function AdminReceivables({ receivables, filters, courts, summary }) {
    const { values, set, reset, active } = useFilters('admin.receivables.index', {
        search: filters.search ?? '',
        court_id: filters.court_id ?? '',
        scope: filters.scope ?? 'upcoming',
    });

    const columns = [
        {
            key: 'code',
            header: 'Booking',
            cell: (booking) => (
                <div className="max-w-52">
                    <Link href={route('admin.bookings.show', booking.id)} className="font-mono text-xs font-semibold hover:text-court-400">
                        {booking.code}
                    </Link>
                    <p className="truncate text-xs text-bone-50/50">{booking.customer_name}</p>
                </div>
            ),
        },
        {
            key: 'schedule',
            header: 'Jadwal',
            cell: (booking) => (
                <div>
                    <p className="font-medium">{formatDate(booking.date)}</p>
                    <p className="text-xs text-bone-50/50 tabular-nums">{formatTimeRange(booking.start_time, booking.end_time)}</p>
                </div>
            ),
        },
        { key: 'total', header: 'Total', align: 'right', cell: (booking) => <span className="tabular-nums">{formatRupiah(booking.total)}</span> },
        {
            key: 'paid',
            header: 'Dibayar',
            align: 'right',
            cell: (booking) => <span className="tabular-nums text-court-400">{formatRupiah(booking.paid_amount)}</span>,
        },
        {
            key: 'remaining',
            header: 'Sisa',
            align: 'right',
            cell: (booking) => <span className="font-semibold tabular-nums text-amber-300">{formatRupiah(booking.remaining_amount)}</span>,
        },
        {
            key: 'due',
            header: 'Batas pelunasan',
            cell: (booking) =>
                booking.settlement_due_at ? (
                    <span className={new Date(booking.settlement_due_at) < new Date() ? 'text-red-300' : undefined}>
                        {formatDateTime(booking.settlement_due_at)}
                    </span>
                ) : (
                    <span className="text-bone-50/30">—</span>
                ),
        },
        { key: 'status', header: 'Bayar', cell: (booking) => <StatusBadge type="payment" value={booking.payment_status} /> },
        {
            key: 'action',
            header: '',
            align: 'right',
            cell: (booking) => (
                <Button href={route('admin.bookings.payment', booking.id)} variant="outline" size="sm">
                    Tagih
                </Button>
            ),
        },
    ];

    return (
        <AdminLayout title="Sisa tagihan">
            <PageHeader
                title="Sisa tagihan"
                description="Booking aktif yang belum lunas. Urutannya mengikuti jam main terdekat agar yang mendesak tertagih lebih dulu."
            />

            <div className="grid gap-3 sm:grid-cols-3">
                <Summary label="Total sisa tagihan" value={formatRupiah(summary.total)} tone="text-amber-300" />
                <Summary label="Jumlah booking" value={formatNumber(summary.count)} />
                <Summary label="Lewat batas pelunasan" value={formatNumber(summary.overdue)} tone={summary.overdue ? 'text-red-300' : undefined} />
            </div>

            <Panel>
                <SegmentedControl label="Rentang" value={values.scope} onChange={(value) => set('scope', value)} options={SCOPES} className="mb-4" />

                <FilterBar
                    search={values.search}
                    onSearchChange={(value) => set('search', value)}
                    searchPlaceholder="Cari kode booking atau pemesan…"
                    showReset={active}
                    onReset={() => reset({ search: '', court_id: '', scope: 'upcoming' })}
                >
                    <SelectField
                        id="filter-court"
                        size="sm"
                        value={values.court_id}
                        onChange={(event) => set('court_id', event.target.value)}
                        placeholder="Semua lapangan"
                        options={courts.map((court) => ({ value: String(court.id), label: court.name }))}
                    />
                </FilterBar>

                <DataTable
                    className="mt-5"
                    bare
                    columns={columns}
                    rows={receivables.data}
                    empty={<EmptyState icon={WalletCards} title="Tidak ada sisa tagihan" description="Semua booking pada rentang ini sudah lunas." />}
                />

                <Pagination paginator={receivables} className="mt-5" />
            </Panel>
        </AdminLayout>
    );
}

function Summary({ label, value, tone }) {
    return (
        <div className="rounded-md border border-ink-800 bg-ink-900 p-5">
            <p className="text-xs tracking-[0.15em] text-bone-50/40 uppercase">{label}</p>
            <p className={`mt-2 font-display text-2xl font-semibold tabular-nums ${tone ?? ''}`}>{value}</p>
        </div>
    );
}
