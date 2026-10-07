import DataTable from '@/Components/admin/DataTable';
import FilterBar from '@/Components/admin/FilterBar';
import Button from '@/Components/common/Button';
import EmptyState from '@/Components/common/EmptyState';
import PageHeader from '@/Components/common/PageHeader';
import Pagination from '@/Components/common/Pagination';
import Panel from '@/Components/common/Panel';
import SelectField from '@/Components/form/SelectField';
import { Input } from '@/Components/ui/input';
import { useFilters } from '@/hooks/useFilters';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDate, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Download, ReceiptText } from 'lucide-react';

const STATUS = {
    unpaid: ['Belum dibayar', 'bg-amber-400/15 text-amber-300'],
    partial: ['DP', 'bg-lime-300/15 text-lime-300'],
    paid: ['Lunas', 'bg-court-500/15 text-court-400'],
    void: ['Batal', 'bg-white/8 text-bone-50/50'],
};

export default function AdminInvoices({ invoices, filters, summary }) {
    const { values, set, reset, active } = useFilters('admin.invoices.index', {
        search: filters.search ?? '',
        status: filters.status ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
    });

    const columns = [
        {
            key: 'number',
            header: 'Nomor',
            cell: (invoice) => (
                <a href={invoice.url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs font-semibold hover:text-court-400">
                    {invoice.number}
                </a>
            ),
        },
        {
            key: 'booking',
            header: 'Booking',
            cell: (invoice) => (
                <div className="max-w-48">
                    <Link href={route('admin.bookings.show', invoice.booking.id)} className="font-mono text-xs font-semibold hover:text-court-400">
                        {invoice.booking.code}
                    </Link>
                    <p className="truncate text-xs text-bone-50/50">
                        {formatDate(invoice.booking.date)} · {invoice.booking.court}
                    </p>
                </div>
            ),
        },
        {
            key: 'billed',
            header: 'Ditagihkan ke',
            cell: (invoice) => (
                <div className="max-w-52">
                    <p className="truncate font-medium">{invoice.billed_name}</p>
                    <p className="truncate text-xs text-bone-50/50">{invoice.billed_email || '—'}</p>
                </div>
            ),
        },
        { key: 'total', header: 'Total', align: 'right', cell: (invoice) => <span className="tabular-nums">{formatRupiah(invoice.total)}</span> },
        {
            key: 'remaining',
            header: 'Sisa',
            align: 'right',
            cell: (invoice) => (
                <span className={cn('tabular-nums', invoice.remaining_amount > 0 && 'text-amber-300')}>{formatRupiah(invoice.remaining_amount)}</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (invoice) => {
                const [label, tone] = STATUS[invoice.status] ?? STATUS.unpaid;

                return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', tone)}>{label}</span>;
            },
        },
        { key: 'issued', header: 'Terbit', cell: (invoice) => formatDate(invoice.issued_at) },
        {
            key: 'pdf',
            header: '',
            align: 'right',
            cell: (invoice) => (
                <Button href={invoice.pdf_url} variant="ghost" size="sm" icon={Download}>
                    PDF
                </Button>
            ),
        },
    ];

    return (
        <AdminLayout title="Invoice">
            <PageHeader title="Invoice" description="Invoice terbit otomatis saat booking dibuat dan diperbarui setiap ada pembayaran." />

            {summary && (
                <div className="grid gap-3 sm:grid-cols-3">
                    <Summary label="Nilai invoice" value={formatRupiah(summary.total)} />
                    <Summary label="Sudah dibayar" value={formatRupiah(summary.paid)} tone="text-court-400" />
                    <Summary label="Belum dibayar" value={formatRupiah(summary.outstanding)} tone="text-amber-300" />
                </div>
            )}

            <Panel>
                <FilterBar
                    search={values.search}
                    onSearchChange={(value) => set('search', value)}
                    searchPlaceholder="Cari nomor invoice, kode booking, atau nama…"
                    showReset={active}
                    onReset={() => reset({ search: '', status: '', date_from: '', date_to: '' })}
                >
                    <SelectField
                        id="filter-status"
                        size="sm"
                        value={values.status}
                        onChange={(event) => set('status', event.target.value)}
                        placeholder="Semua status"
                        options={Object.entries(STATUS).map(([value, [label]]) => ({ value, label }))}
                    />
                    <Input
                        type="date"
                        aria-label="Terbit dari"
                        value={values.date_from}
                        onChange={(event) => set('date_from', event.target.value)}
                        className="h-10 text-sm"
                    />
                    <Input
                        type="date"
                        aria-label="Terbit sampai"
                        value={values.date_to}
                        onChange={(event) => set('date_to', event.target.value)}
                        className="h-10 text-sm"
                    />
                </FilterBar>

                <DataTable
                    className="mt-5"
                    bare
                    columns={columns}
                    rows={invoices.data}
                    empty={<EmptyState icon={ReceiptText} title="Belum ada invoice" description="Invoice terbit otomatis bersama booking baru." />}
                />

                <Pagination paginator={invoices} className="mt-5" />
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
