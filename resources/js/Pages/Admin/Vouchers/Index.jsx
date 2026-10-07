import DataTable from '@/Components/admin/DataTable';
import FilterBar from '@/Components/admin/FilterBar';
import Button from '@/Components/common/Button';
import ConfirmDialog from '@/Components/common/ConfirmDialog';
import EmptyState from '@/Components/common/EmptyState';
import PageHeader from '@/Components/common/PageHeader';
import Pagination from '@/Components/common/Pagination';
import Panel from '@/Components/common/Panel';
import SelectField from '@/Components/form/SelectField';
import { useFilters } from '@/hooks/useFilters';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDate, formatNumber, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import { Plus, TicketPercent, Trash2 } from 'lucide-react';
import { useState } from 'react';

const STATUSES = [
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Nonaktif' },
    { value: 'expired', label: 'Kedaluwarsa' },
];

export default function AdminVouchers({ vouchers, filters }) {
    const [confirmDelete, setConfirmDelete] = useState(null);
    const remove = useForm({});

    const { values, set, reset, active } = useFilters('admin.vouchers.index', {
        search: filters.search ?? '',
        status: filters.status ?? '',
    });

    const columns = [
        {
            key: 'code',
            header: 'Kode',
            cell: (voucher) => (
                <Link href={route('admin.vouchers.edit', voucher.id)} className="font-mono text-sm font-semibold hover:text-court-400">
                    {voucher.code}
                </Link>
            ),
        },
        {
            key: 'value',
            header: 'Potongan',
            cell: (voucher) => (
                <div>
                    <p className="font-medium">{voucher.type === 'percent' ? `${voucher.value}%` : formatRupiah(voucher.value)}</p>
                    {voucher.max_discount > 0 && voucher.type === 'percent' && (
                        <p className="text-xs text-bone-50/45">maks. {formatRupiah(voucher.max_discount)}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'min',
            header: 'Min. transaksi',
            align: 'right',
            cell: (voucher) => <span className="tabular-nums">{voucher.min_amount > 0 ? formatRupiah(voucher.min_amount) : '—'}</span>,
        },
        {
            key: 'quota',
            header: 'Terpakai',
            align: 'right',
            cell: (voucher) => (
                <span className="tabular-nums">
                    {formatNumber(voucher.used_count)}
                    {voucher.quota ? ` / ${formatNumber(voucher.quota)}` : ''}
                </span>
            ),
        },
        {
            key: 'period',
            header: 'Berlaku',
            cell: (voucher) =>
                voucher.starts_at || voucher.ends_at ? (
                    <span className="text-xs">
                        {voucher.starts_at ? formatDate(voucher.starts_at) : '—'} s/d {voucher.ends_at ? formatDate(voucher.ends_at) : '—'}
                    </span>
                ) : (
                    <span className="text-bone-50/30">Selalu</span>
                ),
        },
        {
            key: 'scope',
            header: 'Untuk',
            cell: (voucher) => (voucher.members_only ? 'Member' : 'Semua'),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (voucher) => (
                <button
                    type="button"
                    onClick={() => router.patch(route('admin.vouchers.toggle', voucher.id), {}, { preserveScroll: true })}
                    className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
                        voucher.is_active ? 'bg-court-500/15 text-court-400 hover:bg-court-500/25' : 'bg-white/8 text-bone-50/50 hover:bg-white/15',
                    )}
                >
                    {voucher.is_active ? 'Aktif' : 'Nonaktif'}
                </button>
            ),
        },
        {
            key: 'action',
            header: '',
            align: 'right',
            cell: (voucher) => (
                <Button variant="ghost" size="sm" icon={Trash2} className="text-red-300" onClick={() => setConfirmDelete(voucher)}>
                    Hapus
                </Button>
            ),
        },
    ];

    return (
        <AdminLayout title="Voucher">
            <PageHeader
                title="Voucher"
                description="Kode diskon yang bisa dipakai customer di halaman checkout. Kuota terpotong saat bookingnya terkonfirmasi."
                actions={
                    <Button href={route('admin.vouchers.create')} icon={Plus}>
                        Voucher baru
                    </Button>
                }
            />

            <Panel>
                <FilterBar
                    search={values.search}
                    onSearchChange={(value) => set('search', value)}
                    searchPlaceholder="Cari kode voucher…"
                    showReset={active}
                    onReset={() => reset({ search: '', status: '' })}
                >
                    <SelectField
                        id="filter-status"
                        size="sm"
                        value={values.status}
                        onChange={(event) => set('status', event.target.value)}
                        placeholder="Semua status"
                        options={STATUSES}
                    />
                </FilterBar>

                <DataTable
                    className="mt-5"
                    bare
                    columns={columns}
                    rows={vouchers.data}
                    empty={
                        <EmptyState
                            icon={TicketPercent}
                            title="Belum ada voucher"
                            description="Buat kode diskon untuk promo atau kompensasi customer."
                            action={
                                <Button href={route('admin.vouchers.create')} size="sm" icon={Plus}>
                                    Voucher baru
                                </Button>
                            }
                        />
                    }
                />

                <Pagination paginator={vouchers} className="mt-5" />
            </Panel>

            <ConfirmDialog
                open={Boolean(confirmDelete)}
                onOpenChange={(open) => !open && setConfirmDelete(null)}
                title={`Hapus voucher ${confirmDelete?.code}?`}
                description="Booking yang sudah memakai voucher ini tidak berubah."
                confirmLabel="Hapus voucher"
                destructive
                processing={remove.processing}
                onConfirm={() =>
                    remove.delete(route('admin.vouchers.destroy', confirmDelete.id), {
                        preserveScroll: true,
                        onSuccess: () => setConfirmDelete(null),
                    })
                }
            />
        </AdminLayout>
    );
}
