import DataTable from '@/Components/admin/DataTable';
import Button from '@/Components/common/Button';
import ConfirmDialog from '@/Components/common/ConfirmDialog';
import CourtImage from '@/Components/common/CourtImage';
import EmptyState from '@/Components/common/EmptyState';
import PageHeader from '@/Components/common/PageHeader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Switch } from '@/Components/ui/switch';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatNumber, formatRupiah } from '@/lib/format';
import { Link, router } from '@inertiajs/react';
import { Ellipsis, LayoutGrid, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function CourtsIndex({ courts }) {
    const [deleting, setDeleting] = useState(null);
    const [processing, setProcessing] = useState(false);

    const columns = [
        {
            key: 'name',
            header: 'Lapangan',
            cell: (court) => (
                <div className="flex items-center gap-3">
                    <CourtImage src={court.image} alt={court.name} className="h-12 w-16 shrink-0" imageClassName="p-2" />
                    <div className="min-w-0">
                        <Link href={route('admin.courts.edit', court.id)} className="font-semibold hover:text-court-400">
                            {court.name}
                        </Link>
                        <p className="text-xs text-bone-50/50">{court.surface ?? '—'}</p>
                    </div>
                </div>
            ),
        },
        { key: 'type', header: 'Tipe', cell: (court) => <span className="capitalize">{court.type}</span> },
        { key: 'base_price', header: 'Harga dasar', align: 'right', cell: (court) => <span className="tabular-nums">{formatRupiah(court.base_price)}</span> },
        { key: 'month_bookings_count', header: 'Booking bulan ini', align: 'right', cell: (court) => <span className="tabular-nums">{formatNumber(court.month_bookings_count)}</span> },
        {
            key: 'is_active',
            header: 'Aktif',
            align: 'center',
            cell: (court) => (
                <Switch
                    checked={court.is_active}
                    onCheckedChange={() => router.patch(route('admin.courts.toggle', court.id), {}, { preserveScroll: true })}
                    aria-label={`${court.is_active ? 'Nonaktifkan' : 'Aktifkan'} ${court.name}`}
                />
            ),
        },
        {
            key: 'actions',
            header: <span className="sr-only">Aksi</span>,
            align: 'right',
            cell: (court) => (
                <DropdownMenu>
                    <DropdownMenuTrigger className="grid size-9 place-items-center rounded-full text-bone-50/60 hover:bg-white/5 hover:text-bone-50" aria-label={`Aksi untuk ${court.name}`}>
                        <Ellipsis className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 border-ink-700 bg-ink-800 text-bone-50">
                        <DropdownMenuItem asChild>
                            <Link href={route('admin.courts.edit', court.id)}>
                                <Pencil />
                                Ubah
                            </Link>
                        </DropdownMenuItem>
                        {route().has('admin.courts.pricing') && (
                            <DropdownMenuItem asChild>
                                <Link href={route('admin.courts.pricing', court.id)}>
                                    <Tags />
                                    Atur harga
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-ink-700" />
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(court)}>
                            <Trash2 />
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AdminLayout title="Lapangan">
            <PageHeader
                title="Lapangan"
                description="Kelola daftar lapangan, foto, fasilitas, harga dasar, dan status aktif."
                actions={
                    <Button href={route('admin.courts.create')} icon={Plus}>
                        Tambah lapangan
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                rows={courts}
                rowHref={(court) => route('admin.courts.edit', court.id)}
                empty={
                    <EmptyState
                        icon={LayoutGrid}
                        title="Belum ada lapangan"
                        description="Tambahkan lapangan pertama agar customer bisa mulai booking."
                        action={
                            <Button href={route('admin.courts.create')} size="sm" icon={Plus}>
                                Tambah lapangan
                            </Button>
                        }
                    />
                }
            />

            <ConfirmDialog
                open={Boolean(deleting)}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Hapus ${deleting?.name}?`}
                description="Lapangan disembunyikan dari customer dan panel admin. Riwayat booking tetap tersimpan. Lapangan yang masih punya booking mendatang tidak bisa dihapus."
                confirmLabel="Hapus lapangan"
                destructive
                processing={processing}
                onConfirm={() =>
                    router.delete(route('admin.courts.destroy', deleting.id), {
                        preserveScroll: true,
                        onStart: () => setProcessing(true),
                        onFinish: () => {
                            setProcessing(false);
                            setDeleting(null);
                        },
                    })
                }
            />
        </AdminLayout>
    );
}
