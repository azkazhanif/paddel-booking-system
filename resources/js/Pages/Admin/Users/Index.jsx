import DataTable from '@/Components/admin/DataTable';
import FilterBar from '@/Components/admin/FilterBar';
import Button from '@/Components/common/Button';
import ConfirmDialog from '@/Components/common/ConfirmDialog';
import EmptyState from '@/Components/common/EmptyState';
import PageHeader from '@/Components/common/PageHeader';
import Pagination from '@/Components/common/Pagination';
import StatusBadge from '@/Components/common/StatusBadge';
import SelectField from '@/Components/form/SelectField';
import { useFilters } from '@/hooks/useFilters';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDate, initials } from '@/lib/format';
import { Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Power, UserCog } from 'lucide-react';
import { useState } from 'react';

export default function UsersIndex({ users, filters, roles }) {
    const { auth } = usePage().props;
    const [toggling, setToggling] = useState(null);
    const [processing, setProcessing] = useState(false);
    const { values, set, reset, active } = useFilters('admin.users.index', { search: filters.search ?? '', role: filters.role ?? '' });

    const columns = [
        {
            key: 'name',
            header: 'Nama',
            cell: (user) => (
                <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-court-900 text-xs font-bold text-court-400">
                        {initials(user.name)}
                    </span>
                    <div className="min-w-0">
                        <Link href={route('admin.users.edit', user.id)} className="block truncate font-medium hover:text-court-400">
                            {user.name}
                            {user.id === auth.user.id && <span className="ml-2 text-xs font-normal text-bone-50/40">(kamu)</span>}
                        </Link>
                        <p className="truncate text-xs text-bone-50/50">{user.email}</p>
                    </div>
                </div>
            ),
        },
        { key: 'role', header: 'Role', cell: (user) => <StatusBadge type="role" value={user.role} /> },
        { key: 'phone', header: 'WhatsApp', cell: (user) => <span className="text-bone-50/70 tabular-nums">{user.phone ?? '—'}</span> },
        { key: 'status', header: 'Status', cell: (user) => <StatusBadge type="account" value={user.is_blocked ? 'blocked' : 'active'} /> },
        { key: 'created_at', header: 'Dibuat', cell: (user) => <span className="text-bone-50/70">{formatDate(user.created_at)}</span> },
        {
            key: 'actions',
            header: <span className="sr-only">Aksi</span>,
            align: 'right',
            cell: (user) => (
                <div className="flex justify-end gap-1">
                    <Link
                        href={route('admin.users.edit', user.id)}
                        className="grid size-9 place-items-center rounded-full text-bone-50/60 hover:bg-white/5 hover:text-bone-50"
                        aria-label={`Ubah ${user.name}`}
                    >
                        <Pencil className="size-4" />
                    </Link>
                    {user.id !== auth.user.id && (
                        <button
                            type="button"
                            onClick={() => setToggling(user)}
                            className="grid size-9 place-items-center rounded-full text-bone-50/60 hover:bg-white/5 hover:text-bone-50"
                            aria-label={`${user.is_blocked ? 'Aktifkan' : 'Nonaktifkan'} ${user.name}`}
                        >
                            <Power className="size-4" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AdminLayout title="Kelola User">
            <PageHeader
                title="Kelola User"
                description="Akun internal: owner (akses penuh), admin (operasional), dan staff (resepsionis)."
                actions={
                    <Button href={route('admin.users.create')} icon={Plus}>
                        Tambah akun
                    </Button>
                }
            />

            <div className="flex flex-col gap-4">
                <FilterBar
                    search={values.search}
                    onSearchChange={(value) => set('search', value)}
                    searchPlaceholder="Cari nama atau email"
                    showReset={active}
                    onReset={() => reset()}
                >
                    <SelectField
                        id="filter-role"
                        size="sm"
                        aria-label="Role"
                        placeholder="Semua role"
                        options={roles}
                        value={values.role}
                        onChange={(event) => set('role', event.target.value)}
                    />
                </FilterBar>

                <DataTable
                    columns={columns}
                    rows={users.data}
                    rowHref={(user) => route('admin.users.edit', user.id)}
                    empty={<EmptyState icon={UserCog} title="Akun tidak ditemukan" />}
                />

                <Pagination paginator={users} />
            </div>

            <ConfirmDialog
                open={Boolean(toggling)}
                onOpenChange={(open) => !open && setToggling(null)}
                title={toggling?.is_blocked ? `Aktifkan ${toggling?.name}?` : `Nonaktifkan ${toggling?.name}?`}
                description={
                    toggling?.is_blocked
                        ? 'Akun bisa kembali mengakses panel sesuai role-nya.'
                        : 'Akun tidak bisa lagi mengakses panel admin/staff sampai diaktifkan kembali.'
                }
                confirmLabel={toggling?.is_blocked ? 'Aktifkan' : 'Nonaktifkan'}
                destructive={!toggling?.is_blocked}
                processing={processing}
                onConfirm={() =>
                    router.patch(
                        route('admin.users.toggle', toggling.id),
                        {},
                        {
                            preserveScroll: true,
                            onStart: () => setProcessing(true),
                            onFinish: () => {
                                setProcessing(false);
                                setToggling(null);
                            },
                        },
                    )
                }
            />
        </AdminLayout>
    );
}
