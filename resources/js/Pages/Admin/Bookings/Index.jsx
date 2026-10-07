import DataTable from '@/Components/admin/DataTable';
import FilterBar from '@/Components/admin/FilterBar';
import Button from '@/Components/common/Button';
import EmptyState from '@/Components/common/EmptyState';
import PageHeader from '@/Components/common/PageHeader';
import Pagination from '@/Components/common/Pagination';
import StatusBadge, { STATUS_MAP } from '@/Components/common/StatusBadge';
import SelectField from '@/Components/form/SelectField';
import { Input } from '@/Components/ui/input';
import { useFilters } from '@/hooks/useFilters';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDate, formatRupiah, formatTimeRange } from '@/lib/format';
import { Link } from '@inertiajs/react';
import { CalendarPlus, CalendarSearch } from 'lucide-react';

const optionsOf = (type) => Object.entries(STATUS_MAP[type]).map(([value, [label]]) => ({ value, label }));

export default function BookingsIndex({ bookings, filters, courts }) {
    const { values, set, reset, active } = useFilters('admin.bookings.index', {
        search: filters.search ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        court_id: filters.court_id ?? '',
        status: filters.status ?? '',
        payment_status: filters.payment_status ?? '',
        customer_type: filters.customer_type ?? '',
        source: filters.source ?? '',
    });

    const select = (key) => ({ id: `filter-${key}`, size: 'sm', value: values[key], onChange: (event) => set(key, event.target.value) });

    const columns = [
        {
            key: 'code',
            header: 'Kode',
            cell: (booking) => (
                <Link href={route('admin.bookings.show', booking.id)} className="font-mono text-xs font-semibold tracking-wide hover:text-court-400">
                    {booking.code}
                </Link>
            ),
        },
        {
            key: 'customer',
            header: 'Pemesan',
            cell: (booking) => (
                <div className="max-w-52">
                    <p className="flex items-center gap-2 font-medium">
                        <span className="truncate">{booking.customer_name}</span>
                        <StatusBadge type="customerType" value={booking.customer_type} className="px-2 py-0.5 text-[10px]" />
                    </p>
                    <p className="truncate text-xs text-bone-50/50">{booking.customer_email}</p>
                </div>
            ),
        },
        {
            key: 'schedule',
            header: 'Jadwal',
            cell: (booking) => (
                <div>
                    <p className="font-medium">{formatDate(booking.date)}</p>
                    <p className="text-xs text-bone-50/50 tabular-nums">
                        {formatTimeRange(booking.start_time, booking.end_time)} · {booking.court?.name}
                    </p>
                </div>
            ),
        },
        { key: 'total', header: 'Total', align: 'right', cell: (booking) => <span className="tabular-nums">{formatRupiah(booking.total)}</span> },
        {
            key: 'remaining_amount',
            header: 'Sisa',
            align: 'right',
            cell: (booking) => (
                <span className={booking.remaining_amount ? 'text-amber-300 tabular-nums' : 'text-bone-50/40 tabular-nums'}>
                    {formatRupiah(booking.remaining_amount)}
                </span>
            ),
        },
        { key: 'status', header: 'Status', cell: (booking) => <StatusBadge type="booking" value={booking.status} /> },
        { key: 'payment_status', header: 'Bayar', cell: (booking) => <StatusBadge type="payment" value={booking.payment_status} /> },
        { key: 'source', header: 'Sumber', cell: (booking) => <StatusBadge type="source" value={booking.source} /> },
    ];

    return (
        <AdminLayout title="Booking">
            <PageHeader
                title="Booking"
                description="Semua booking online dan walk-in. Klik baris untuk detail, pembatalan, atau check-in."
                actions={
                    <Button href={route('admin.bookings.create')} icon={CalendarPlus}>
                        Booking di tempat
                    </Button>
                }
            />

            <div className="flex flex-col gap-4">
                <FilterBar
                    search={values.search}
                    onSearchChange={(value) => set('search', value)}
                    searchPlaceholder="Cari kode, nama, email, no. HP"
                    showReset={active}
                    onReset={() => reset()}
                >
                    <Input
                        type="date"
                        aria-label="Dari tanggal"
                        value={values.date_from}
                        onChange={(event) => set('date_from', event.target.value)}
                        className="h-10 text-sm sm:w-40"
                    />
                    <Input
                        type="date"
                        aria-label="Sampai tanggal"
                        value={values.date_to}
                        min={values.date_from || undefined}
                        onChange={(event) => set('date_to', event.target.value)}
                        className="h-10 text-sm sm:w-40"
                    />
                    <SelectField
                        {...select('court_id')}
                        aria-label="Lapangan"
                        placeholder="Semua lapangan"
                        options={courts.map((court) => ({ value: String(court.id), label: court.name }))}
                    />
                    <SelectField {...select('status')} aria-label="Status booking" placeholder="Semua status" options={optionsOf('booking')} />
                    <SelectField {...select('payment_status')} aria-label="Status bayar" placeholder="Status bayar" options={optionsOf('payment')} />
                    <SelectField
                        {...select('customer_type')}
                        aria-label="Tipe pemesan"
                        placeholder="Guest & member"
                        options={optionsOf('customerType')}
                    />
                    <SelectField {...select('source')} aria-label="Sumber" placeholder="Semua sumber" options={optionsOf('source')} />
                </FilterBar>

                <DataTable
                    columns={columns}
                    rows={bookings.data}
                    rowHref={(booking) => route('admin.bookings.show', booking.id)}
                    empty={<EmptyState icon={CalendarSearch} title="Booking tidak ditemukan" description="Coba ubah atau reset filter." />}
                />

                <Pagination paginator={bookings} />
            </div>
        </AdminLayout>
    );
}
