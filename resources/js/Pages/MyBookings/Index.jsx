import BookingCard from '@/Components/booking/BookingCard';
import Button from '@/Components/common/Button';
import EmptyState from '@/Components/common/EmptyState';
import Eyebrow from '@/Components/common/Eyebrow';
import SegmentedControl from '@/Components/common/SegmentedControl';
import StatusMessage from '@/Components/common/StatusMessage';
import AppLayout from '@/Layouts/AppLayout';
import { safeRoute } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import { CalendarPlus, CalendarRange, UserRound } from 'lucide-react';

const TABS = [
    { value: 'upcoming', label: 'Akan datang' },
    { value: 'past', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' },
];

const EMPTY = {
    upcoming: ['Belum ada booking aktif', 'Pilih jam yang masih kosong dan kunci lapanganmu.'],
    past: ['Belum ada riwayat main', 'Booking yang sudah lewat akan muncul di sini.'],
    cancelled: ['Tidak ada booking dibatalkan', 'Booking yang dibatalkan atau kedaluwarsa muncul di sini.'],
};

export default function MyBookingsIndex({ tab, counts, bookings }) {
    const { flash } = usePage().props;
    const [emptyTitle, emptyDescription] = EMPTY[tab];

    return (
        <AppLayout title="Booking saya">
            <div className="flex flex-col gap-6">
                <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div>
                        <Eyebrow className="text-court-500">Member area</Eyebrow>
                        <h1 className="mt-3 font-display text-4xl leading-none font-semibold tracking-tight md:text-5xl">Booking saya</h1>
                        <p className="mt-3 text-sm text-bone-50/55">Lanjutkan pembayaran, lunasi DP, atau lihat e-ticket booking kamu.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button href={safeRoute('profile.edit')} variant="outline" size="sm" icon={UserRound}>
                            Profil
                        </Button>
                        <Button href={safeRoute('booking.create')} size="sm" icon={CalendarPlus}>
                            Booking baru
                        </Button>
                    </div>
                </header>

                {flash?.success && <StatusMessage tone="success">{flash.success}</StatusMessage>}
                {flash?.error && <StatusMessage tone="error">{flash.error}</StatusMessage>}

                <SegmentedControl
                    label="Filter booking"
                    value={tab}
                    onChange={(value) => router.get(route('my-bookings.index'), { tab: value }, { preserveState: true, preserveScroll: true })}
                    options={TABS.map((item) => ({ ...item, count: counts[item.value] }))}
                />

                {bookings.length ? (
                    <div className="flex flex-col gap-3">
                        {bookings.map((booking) => (
                            <BookingCard
                                key={booking.code}
                                booking={booking}
                                href={route('my-bookings.show', booking.code)}
                                actions={
                                    booking.can_pay ? (
                                        <Button href={route('booking.checkout', booking.code)} size="sm">
                                            Bayar sekarang
                                        </Button>
                                    ) : booking.can_settle ? (
                                        <Button href={route('my-bookings.show', booking.code)} size="sm">
                                            Lunasi
                                        </Button>
                                    ) : null
                                }
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={CalendarRange}
                        title={emptyTitle}
                        description={emptyDescription}
                        className="rounded-md border border-dashed border-ink-700"
                        action={
                            <Button href={safeRoute('booking.create')} size="sm" icon={CalendarPlus}>
                                Cari jadwal
                            </Button>
                        }
                    />
                )}
            </div>
        </AppLayout>
    );
}
