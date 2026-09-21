import DataTable from '@/Components/admin/DataTable';
import FilterBar from '@/Components/admin/FilterBar';
import EmptyState from '@/Components/common/EmptyState';
import PageHeader from '@/Components/common/PageHeader';
import Pagination from '@/Components/common/Pagination';
import SegmentedControl from '@/Components/common/SegmentedControl';
import StatusBadge from '@/Components/common/StatusBadge';
import SelectField from '@/Components/form/SelectField';
import { useFilters } from '@/hooks/useFilters';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDate, formatNumber, formatRupiah } from '@/lib/format';
import { Link } from '@inertiajs/react';
import { Users } from 'lucide-react';

const SEGMENTS = [
    { value: 'new', label: 'Baru (≤30 hari)' },
    { value: 'loyal', label: 'Loyal (≥5 booking)' },
    { value: 'inactive', label: 'Tidak aktif (>60 hari)' },
];

const SORTS = [
    { value: 'latest', label: 'Terbaru' },
    { value: 'spent', label: 'Total transaksi' },
    { value: 'bookings', label: 'Jumlah booking' },
    { value: 'last_booking', label: 'Booking terakhir' },
];

export default function CustomersIndex({ customers, filters, counts }) {
    const { values, set, reset } = useFilters('admin.customers.index', {
        tab: filters.tab,
        search: filters.search ?? '',
        segment: filters.segment ?? '',
        sort: filters.sort,
    });

    const isGuest = values.tab === 'guest';
    const hasFilter = Boolean(values.search || values.segment || values.sort !== 'latest');

    const columns = [
        {
            key: 'name',
            header: 'Customer',
            cell: (customer) => (
                <div className="max-w-64">
                    {isGuest ? (
                        <p className="truncate font-medium">{customer.name}</p>
                    ) : (
                        <Link href={route('admin.customers.show', customer.id)} className="block truncate font-medium hover:text-court-400">
                            {customer.name}
                        </Link>
                    )}
                    <p className="truncate text-xs text-bone-50/50">{customer.email}</p>
                </div>
            ),
        },
        { key: 'phone', header: 'WhatsApp', cell: (customer) => <span className="text-bone-50/70 tabular-nums">{customer.phone ?? '—'}</span> },
        {
            key: 'created_at',
            header: isGuest ? 'Booking pertama' : 'Terdaftar',
            cell: (customer) => <span className="text-bone-50/70">{formatDate(customer.created_at)}</span>,
        },
        { key: 'bookings_count', header: 'Booking', align: 'right', cell: (customer) => <span className="tabular-nums">{formatNumber(customer.bookings_count)}</span> },
        { key: 'spent', header: 'Total transaksi', align: 'right', cell: (customer) => <span className="font-medium tabular-nums">{formatRupiah(Number(customer.spent ?? 0))}</span> },
        { key: 'last_booking', header: 'Booking terakhir', cell: (customer) => <span className="text-bone-50/70">{customer.last_booking ? formatDate(customer.last_booking) : '—'}</span> },
        !isGuest && {
            key: 'is_blocked',
            header: 'Status',
            cell: (customer) => <StatusBadge type="account" value={customer.is_blocked ? 'blocked' : 'active'} />,
        },
        isGuest && {
            key: 'history',
            header: <span className="sr-only">Aksi</span>,
            align: 'right',
            cell: (customer) => (
                <Link href={route('admin.bookings.index', { search: customer.email })} className="text-sm font-medium text-court-500 hover:text-court-400">
                    Lihat booking
                </Link>
            ),
        },
    ].filter(Boolean);

    return (
        <AdminLayout title="Customer">
            <PageHeader title="Customer" description="Member terdaftar dan guest (dikelompokkan per email)." />

            <div className="flex flex-col gap-4">
                <SegmentedControl
                    label="Tipe customer"
                    value={values.tab}
                    onChange={(tab) => reset({ tab, search: '', segment: '', sort: 'latest' })}
                    options={[
                        { value: 'member', label: 'Member', count: counts.member },
                        { value: 'guest', label: 'Guest', count: counts.guest },
                    ]}
                    className="self-start"
                />

                <FilterBar
                    search={values.search}
                    onSearchChange={(value) => set('search', value)}
                    searchPlaceholder="Cari nama, email, no. HP"
                    showReset={hasFilter}
                    onReset={() => reset({ tab: values.tab, search: '', segment: '', sort: 'latest' })}
                >
                    <SelectField id="filter-segment" size="sm" aria-label="Segmen" placeholder="Semua segmen" options={SEGMENTS} value={values.segment} onChange={(event) => set('segment', event.target.value)} />
                    <SelectField id="filter-sort" size="sm" aria-label="Urutkan" options={SORTS} value={values.sort} onChange={(event) => set('sort', event.target.value)} />
                </FilterBar>

                <DataTable
                    columns={columns}
                    rows={customers.data}
                    rowKey={isGuest ? 'email' : 'id'}
                    rowHref={isGuest ? undefined : (customer) => route('admin.customers.show', customer.id)}
                    empty={<EmptyState icon={Users} title="Customer tidak ditemukan" description="Coba ubah kata kunci atau segmen." />}
                />

                <Pagination paginator={customers} />
            </div>
        </AdminLayout>
    );
}
