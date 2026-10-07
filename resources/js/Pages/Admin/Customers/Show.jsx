import DataTable from '@/Components/admin/DataTable';
import KpiCard from '@/Components/admin/KpiCard';
import BentoGrid from '@/Components/common/BentoGrid';
import Button from '@/Components/common/Button';
import ConfirmDialog from '@/Components/common/ConfirmDialog';
import DetailList from '@/Components/common/DetailList';
import EmptyState from '@/Components/common/EmptyState';
import PageHeader from '@/Components/common/PageHeader';
import Panel from '@/Components/common/Panel';
import StatusBadge from '@/Components/common/StatusBadge';
import TextareaField from '@/Components/form/TextareaField';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDate, formatDateTime, formatNumber, formatRupiah, formatTimeRange, initials } from '@/lib/format';
import { Link, useForm } from '@inertiajs/react';
import { Ban, CalendarCheck, CircleAlert, Clock, LockOpen, MessageCircle, Wallet } from 'lucide-react';
import { useState } from 'react';

const PAYMENT_TYPES = { full: 'Bayar penuh', dp: 'DP', settlement: 'Pelunasan', offline: 'Offline' };

export default function CustomerShow({ customer, stats, bookings, payments }) {
    const [blockOpen, setBlockOpen] = useState(false);
    const blockForm = useForm({ is_blocked: !customer.is_blocked, blocked_reason: '' });
    const notesForm = useForm({ admin_notes: customer.admin_notes ?? '' });

    const toggleBlock = () =>
        blockForm.patch(route('admin.customers.block', customer.id), {
            preserveScroll: true,
            onSuccess: () => setBlockOpen(false),
        });

    const bookingColumns = [
        {
            key: 'code',
            header: 'Kode',
            cell: (booking) => (
                <Link href={route('admin.bookings.show', booking.id)} className="font-mono text-xs font-semibold hover:text-court-400">
                    {booking.code}
                </Link>
            ),
        },
        {
            key: 'schedule',
            header: 'Jadwal',
            cell: (booking) => (
                <div>
                    <p className="font-medium">{formatDate(booking.date)}</p>
                    <p className="text-xs text-bone-50/50">
                        {formatTimeRange(booking.start_time, booking.end_time)} · {booking.court?.name}
                    </p>
                </div>
            ),
        },
        { key: 'total', header: 'Total', align: 'right', cell: (booking) => <span className="tabular-nums">{formatRupiah(booking.total)}</span> },
        { key: 'status', header: 'Status', cell: (booking) => <StatusBadge type="booking" value={booking.status} /> },
        { key: 'payment_status', header: 'Bayar', cell: (booking) => <StatusBadge type="payment" value={booking.payment_status} /> },
    ];

    return (
        <AdminLayout title={customer.name}>
            <PageHeader
                back={{ href: route('admin.customers.index'), label: 'Customer' }}
                title={
                    <span className="flex items-center gap-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-court-900 font-sans text-base font-bold text-court-400">
                            {initials(customer.name)}
                        </span>
                        <span className="min-w-0 truncate">{customer.name}</span>
                    </span>
                }
                actions={
                    <>
                        {customer.phone && (
                            <Button href={`https://wa.me/${customer.phone}`} variant="outline" icon={MessageCircle}>
                                WhatsApp
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            icon={customer.is_blocked ? LockOpen : Ban}
                            onClick={() => {
                                blockForm.setData({ is_blocked: !customer.is_blocked, blocked_reason: '' });
                                setBlockOpen(true);
                            }}
                            className={
                                customer.is_blocked ? undefined : 'text-red-300 hover:border-red-500 [--fill:var(--color-red-500)] hover:text-bone-50'
                            }
                        >
                            {customer.is_blocked ? 'Buka blokir' : 'Blokir'}
                        </Button>
                    </>
                }
            >
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge type="account" value={customer.is_blocked ? 'blocked' : 'active'} />
                    <StatusBadge type="customerType" value="member" />
                </div>
            </PageHeader>

            {customer.is_blocked && (
                <div role="status" className="flex items-start gap-3 rounded-md border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
                    <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                    <p>Customer diblokir{customer.blocked_reason ? `: ${customer.blocked_reason}` : '.'} Customer tidak bisa memakai opsi DP.</p>
                </div>
            )}

            <BentoGrid className="md:auto-rows-[minmax(9rem,auto)]">
                <KpiCard tone="green" colSpan={{ md: 3, lg: 4 }} label="Total transaksi" icon={Wallet} value={formatRupiah(stats.spent)} />
                <KpiCard
                    colSpan={{ md: 3, lg: 3 }}
                    label="Booking"
                    icon={CalendarCheck}
                    value={formatNumber(stats.bookings)}
                    footer={`${stats.cancelled} batal · ${stats.no_show} no-show`}
                />
                <KpiCard
                    colSpan={{ md: 3, lg: 3 }}
                    label="Booking terakhir"
                    icon={Clock}
                    value={stats.last_booking ? formatDate(stats.last_booking, { day: 'numeric', month: 'short' }) : '—'}
                />
                <KpiCard
                    tone={stats.outstanding ? 'forest' : 'ink'}
                    colSpan={{ md: 3, lg: 2 }}
                    label="Sisa tagihan"
                    value={formatRupiah(stats.outstanding)}
                />
            </BentoGrid>

            <div className="grid gap-4 lg:grid-cols-12">
                <div className="flex flex-col gap-4 lg:col-span-8">
                    <Panel title="Riwayat booking" bodyClassName="p-0 pt-5 md:p-0 md:pt-6">
                        <DataTable
                            columns={bookingColumns}
                            rows={bookings}
                            rowHref={(booking) => route('admin.bookings.show', booking.id)}
                            bare
                            empty={<EmptyState title="Belum ada booking" />}
                        />
                    </Panel>

                    <Panel title="Riwayat pembayaran" description="20 transaksi terakhir." bodyClassName="px-0 md:px-0">
                        {payments.length ? (
                            <ul className="divide-y divide-ink-800">
                                {payments.map((payment) => (
                                    <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-6">
                                        <div>
                                            <p className="text-sm font-medium">
                                                {PAYMENT_TYPES[payment.type]} · <span className="font-mono text-xs">{payment.booking?.code}</span>
                                            </p>
                                            <p className="text-xs text-bone-50/50">{formatDateTime(payment.paid_at ?? payment.created_at)}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold tabular-nums">{formatRupiah(payment.amount)}</span>
                                            <StatusBadge type="transaction" value={payment.status} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="px-5 text-sm text-bone-50/50 md:px-6">Belum ada pembayaran.</p>
                        )}
                    </Panel>
                </div>

                <div className="flex flex-col gap-4 lg:col-span-4">
                    <Panel title="Profil">
                        <DetailList
                            items={[
                                { label: 'Email', value: customer.email },
                                { label: 'WhatsApp', value: customer.phone },
                                { label: 'Terdaftar', value: formatDate(customer.created_at) },
                                {
                                    label: 'Email terverifikasi',
                                    value: customer.email_verified_at ? formatDate(customer.email_verified_at) : 'Belum',
                                },
                                { label: 'Akses DP', value: customer.can_use_dp ? 'Boleh' : 'Tidak' },
                                customer.dp_suspended_until && { label: 'DP dicabut s.d.', value: formatDate(customer.dp_suspended_until) },
                            ]}
                        />
                    </Panel>

                    <Panel title="Catatan admin" description="Hanya terlihat oleh tim internal.">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                notesForm.patch(route('admin.customers.update', customer.id), { preserveScroll: true });
                            }}
                            className="flex flex-col gap-3"
                        >
                            <TextareaField
                                id="admin_notes"
                                rows={4}
                                placeholder="Mis. sering booking rombongan, minta lapangan indoor…"
                                value={notesForm.data.admin_notes}
                                onChange={(event) => notesForm.setData('admin_notes', event.target.value)}
                                error={notesForm.errors.admin_notes}
                                aria-label="Catatan admin"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                variant="light"
                                loading={notesForm.processing}
                                disabled={notesForm.processing || !notesForm.isDirty}
                                className="self-end"
                            >
                                Simpan catatan
                            </Button>
                        </form>
                    </Panel>
                </div>
            </div>

            <ConfirmDialog
                open={blockOpen}
                onOpenChange={setBlockOpen}
                title={customer.is_blocked ? `Buka blokir ${customer.name}?` : `Blokir ${customer.name}?`}
                description={
                    customer.is_blocked
                        ? 'Customer bisa kembali booking dan memakai opsi DP sesuai aturan.'
                        : 'Customer yang diblokir tidak bisa memakai opsi DP. Booking yang sudah ada tidak berubah.'
                }
                confirmLabel={customer.is_blocked ? 'Buka blokir' : 'Blokir customer'}
                destructive={!customer.is_blocked}
                processing={blockForm.processing}
                onConfirm={toggleBlock}
            >
                {!customer.is_blocked && (
                    <TextareaField
                        id="blocked_reason"
                        label="Alasan"
                        rows={3}
                        placeholder="Mis. 2x no-show tanpa kabar"
                        value={blockForm.data.blocked_reason}
                        onChange={(event) => blockForm.setData('blocked_reason', event.target.value)}
                        error={blockForm.errors.blocked_reason}
                        autoFocus
                    />
                )}
            </ConfirmDialog>
        </AdminLayout>
    );
}
