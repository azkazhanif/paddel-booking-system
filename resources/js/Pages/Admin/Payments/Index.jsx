import DataTable from '@/Components/admin/DataTable';
import FilterBar from '@/Components/admin/FilterBar';
import EmptyState from '@/Components/common/EmptyState';
import PageHeader from '@/Components/common/PageHeader';
import Pagination from '@/Components/common/Pagination';
import Panel from '@/Components/common/Panel';
import StatusBadge, { STATUS_MAP } from '@/Components/common/StatusBadge';
import SelectField from '@/Components/form/SelectField';
import { Input } from '@/Components/ui/input';
import { useFilters } from '@/hooks/useFilters';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateTime, formatNumber, formatRupiah } from '@/lib/format';
import { Link } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';

const TYPE_LABEL = { full: 'Bayar penuh', dp: 'DP', settlement: 'Pelunasan', offline: 'Di venue' };
const PROVIDER_LABEL = { midtrans: 'Midtrans', cash: 'Tunai', venue_qris: 'QRIS venue', bank_transfer: 'Transfer bank' };

export default function AdminPayments({ payments, filters, summary }) {
    const { values, set, reset, active } = useFilters('admin.payments.index', {
        search: filters.search ?? '',
        status: filters.status ?? '',
        provider: filters.provider ?? '',
        type: filters.type ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
    });

    const select = (key) => ({ id: `filter-${key}`, size: 'sm', value: values[key], onChange: (event) => set(key, event.target.value) });

    const columns = [
        {
            key: 'order',
            header: 'Order',
            cell: (payment) => (
                <div className="max-w-56">
                    <p className="truncate font-mono text-xs">{payment.order_id}</p>
                    <p className="mt-0.5 text-xs text-bone-50/45">{formatDateTime(payment.created_at)}</p>
                </div>
            ),
        },
        {
            key: 'booking',
            header: 'Booking',
            cell: (payment) =>
                payment.booking ? (
                    <div className="max-w-48">
                        <Link
                            href={route('admin.bookings.show', payment.booking.id)}
                            className="font-mono text-xs font-semibold hover:text-court-400"
                        >
                            {payment.booking.code}
                        </Link>
                        <p className="truncate text-xs text-bone-50/50">{payment.booking.customer_name}</p>
                    </div>
                ) : (
                    <span className="text-bone-50/30">—</span>
                ),
        },
        { key: 'type', header: 'Jenis', cell: (payment) => TYPE_LABEL[payment.type] ?? payment.type },
        {
            key: 'method',
            header: 'Metode',
            cell: (payment) => (
                <div>
                    <p>{PROVIDER_LABEL[payment.provider] ?? payment.provider}</p>
                    {payment.payment_method && <p className="text-xs text-bone-50/45">{payment.payment_method}</p>}
                </div>
            ),
        },
        { key: 'amount', header: 'Nominal', align: 'right', cell: (payment) => <span className="tabular-nums">{formatRupiah(payment.amount)}</span> },
        { key: 'status', header: 'Status', cell: (payment) => <StatusBadge type="transaction" value={payment.status} /> },
        {
            key: 'paid_at',
            header: 'Dibayar',
            cell: (payment) => (payment.paid_at ? formatDateTime(payment.paid_at) : <span className="text-bone-50/30">—</span>),
        },
    ];

    return (
        <AdminLayout title="Pembayaran">
            <PageHeader title="Pembayaran" description="Seluruh transaksi, baik lewat Midtrans maupun yang dicatat di venue." />

            {summary && (
                <div className="grid gap-3 sm:grid-cols-3">
                    <Summary label="Diterima" value={formatRupiah(summary.settled)} tone="text-court-400" />
                    <Summary label="Menunggu" value={formatRupiah(summary.pending)} tone="text-amber-300" />
                    <Summary label="Jumlah transaksi" value={formatNumber(summary.count)} />
                </div>
            )}

            <Panel>
                <FilterBar
                    search={values.search}
                    onSearchChange={(value) => set('search', value)}
                    searchPlaceholder="Cari order id, kode booking, atau pemesan…"
                    showReset={active}
                    onReset={() => reset({ search: '', status: '', provider: '', type: '', date_from: '', date_to: '' })}
                >
                    <SelectField
                        {...select('status')}
                        placeholder="Semua status"
                        options={Object.entries(STATUS_MAP.transaction).map(([value, [label]]) => ({ value, label }))}
                    />
                    <SelectField
                        {...select('provider')}
                        placeholder="Semua metode"
                        options={Object.entries(PROVIDER_LABEL).map(([value, label]) => ({ value, label }))}
                    />
                    <SelectField
                        {...select('type')}
                        placeholder="Semua jenis"
                        options={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))}
                    />
                    <Input
                        type="date"
                        aria-label="Dari tanggal"
                        value={values.date_from}
                        onChange={(event) => set('date_from', event.target.value)}
                        className="h-10 text-sm"
                    />
                    <Input
                        type="date"
                        aria-label="Sampai tanggal"
                        value={values.date_to}
                        onChange={(event) => set('date_to', event.target.value)}
                        className="h-10 text-sm"
                    />
                </FilterBar>

                <DataTable
                    className="mt-5"
                    bare
                    columns={columns}
                    rows={payments.data}
                    empty={
                        <EmptyState icon={CreditCard} title="Belum ada transaksi" description="Transaksi akan muncul begitu ada pembayaran masuk." />
                    }
                />

                <Pagination paginator={payments} className="mt-5" />
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
