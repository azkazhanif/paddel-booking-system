import PaymentMethodCard from '@/Components/booking/PaymentMethodCard';
import SlotGrid from '@/Components/booking/SlotGrid';
import Button from '@/Components/common/Button';
import DetailList from '@/Components/common/DetailList';
import PageHeader from '@/Components/common/PageHeader';
import Panel from '@/Components/common/Panel';
import SelectField from '@/Components/form/SelectField';
import TextField from '@/Components/form/TextField';
import TextareaField from '@/Components/form/TextareaField';
import { useFormField } from '@/hooks/useFormField';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatRupiah, formatTime } from '@/lib/format';
import { router, useForm } from '@inertiajs/react';
import { Banknote, CalendarPlus, Clock, QrCode } from 'lucide-react';
import { useState } from 'react';

export default function BookingCreate({ courts, selected, availability, limits, serviceFee, today, qrisEnabled }) {
    const [loadingSlots, setLoadingSlots] = useState(false);

    const form = useForm({
        court_id: selected.court_id ? String(selected.court_id) : '',
        date: selected.date,
        slots: [],
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        players_count: 4,
        notes: '',
        payment_method: qrisEnabled ? 'qris' : 'cash',
    });

    const field = useFormField(form);

    // Jadwal diambil ulang dari server tiap kali lapangan atau tanggal berganti.
    const reloadSlots = (changes) => {
        const next = { court_id: form.data.court_id, date: form.data.date, ...changes };

        form.setData((data) => ({ ...data, ...changes, slots: [] }));
        router.reload({
            only: ['availability', 'selected'],
            data: { court_id: next.court_id, date: next.date },
            onStart: () => setLoadingSlots(true),
            onFinish: () => setLoadingSlots(false),
        });
    };

    const chosen = availability.filter((slot) => form.data.slots.includes(slot.start_time));
    const subtotal = chosen.reduce((sum, slot) => sum + slot.price, 0);
    const total = subtotal + (chosen.length ? serviceFee : 0);
    const maxDate = new Date(Date.now() + limits.advanceDays * 86_400_000).toISOString().slice(0, 10);

    return (
        <AdminLayout title="Booking di tempat">
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(route('admin.bookings.store'));
                }}
                className="flex flex-col gap-5"
            >
                <PageHeader
                    back={{ href: route('admin.bookings.index'), label: 'Booking' }}
                    title="Booking di tempat"
                    description="Buat booking untuk customer yang datang langsung, lalu terima pembayaran tunai atau QRIS."
                    actions={
                        <Button type="submit" icon={CalendarPlus} loading={form.processing} disabled={form.processing || !form.data.slots.length}>
                            Buat booking
                        </Button>
                    }
                />

                <div className="grid gap-4 lg:grid-cols-12">
                    <div className="flex flex-col gap-4 lg:col-span-8">
                        <Panel title="Lapangan & jam">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <SelectField
                                    id="court_id"
                                    label="Lapangan"
                                    value={form.data.court_id}
                                    error={form.errors.court_id}
                                    onChange={(event) => reloadSlots({ court_id: event.target.value })}
                                    options={courts.map((court) => ({ value: String(court.id), label: court.name }))}
                                    placeholder={courts.length ? undefined : 'Belum ada lapangan aktif'}
                                />
                                <TextField
                                    id="date"
                                    label="Tanggal main"
                                    type="date"
                                    min={today}
                                    max={maxDate}
                                    value={form.data.date}
                                    error={form.errors.date}
                                    onChange={(event) => reloadSlots({ date: event.target.value })}
                                />
                            </div>

                            <div className="mt-6">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium text-bone-50/80">Pilih jam (maks. {limits.maxSlots} slot berurutan)</p>
                                    {loadingSlots && (
                                        <span className="flex items-center gap-1.5 text-xs text-bone-50/50">
                                            <Clock aria-hidden className="size-3.5 animate-pulse" />
                                            Memuat jadwal…
                                        </span>
                                    )}
                                </div>
                                <SlotGrid
                                    slots={availability}
                                    value={form.data.slots}
                                    maxSlots={limits.maxSlots}
                                    onChange={(slots) => form.setData('slots', slots)}
                                    className={loadingSlots ? 'opacity-50' : undefined}
                                />
                                {form.errors.slots && (
                                    <p role="alert" className="mt-2 text-sm text-destructive">
                                        {form.errors.slots}
                                    </p>
                                )}
                            </div>
                        </Panel>

                        <Panel
                            title="Data customer"
                            description="Bila email atau nomornya sudah terdaftar, booking otomatis terhubung ke akun member."
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextField
                                    id="customer_name"
                                    label="Nama"
                                    placeholder="Nama customer"
                                    autoComplete="off"
                                    {...field('customer_name')}
                                />
                                <TextField
                                    id="customer_phone"
                                    label="No. WhatsApp"
                                    placeholder="0812…"
                                    inputMode="tel"
                                    autoComplete="off"
                                    {...field('customer_phone')}
                                />
                                <TextField
                                    id="customer_email"
                                    label="Email (opsional)"
                                    type="email"
                                    placeholder="untuk kirim invoice & e-ticket"
                                    autoComplete="off"
                                    {...field('customer_email')}
                                />
                                <TextField id="players_count" label="Jumlah pemain" type="number" min={1} max={12} {...field('players_count')} />
                            </div>
                            <TextareaField
                                id="notes"
                                label="Catatan (opsional)"
                                rows={2}
                                className="mt-4"
                                placeholder="Mis. minta raket sewa"
                                {...field('notes')}
                            />
                        </Panel>
                    </div>

                    <div className="flex flex-col gap-4 lg:col-span-4">
                        <Panel title="Ringkasan">
                            {chosen.length ? (
                                <ul className="mb-4 divide-y divide-ink-800 rounded-md border border-ink-800">
                                    {chosen.map((slot) => (
                                        <li key={slot.start_time} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                                            <span className="tabular-nums">
                                                {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                                            </span>
                                            <span className="tabular-nums">{formatRupiah(slot.price)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mb-4 text-sm text-bone-50/50">Pilih jam dulu untuk melihat total.</p>
                            )}
                            <DetailList
                                items={[
                                    { label: 'Subtotal', value: formatRupiah(subtotal) },
                                    serviceFee > 0 && { label: 'Biaya layanan', value: formatRupiah(chosen.length ? serviceFee : 0) },
                                    { label: 'Total', value: <span className="font-display text-lg font-semibold">{formatRupiah(total)}</span> },
                                ]}
                            />
                        </Panel>

                        <Panel title="Pembayaran">
                            <div className="flex flex-col gap-2">
                                <PaymentMethodCard
                                    id="pay-qris"
                                    name="payment_method"
                                    value="qris"
                                    icon={QrCode}
                                    title="QRIS (Midtrans)"
                                    description={
                                        qrisEnabled
                                            ? 'Tampilkan QR di layar, customer scan dan lunas seketika.'
                                            : 'Belum aktif — isi kredensial Midtrans di .env.'
                                    }
                                    disabled={!qrisEnabled}
                                    checked={form.data.payment_method === 'qris'}
                                    onChange={(value) => form.setData('payment_method', value)}
                                />
                                <PaymentMethodCard
                                    id="pay-cash"
                                    name="payment_method"
                                    value="cash"
                                    icon={Banknote}
                                    title="Tunai"
                                    description="Uang diterima sekarang. Booking langsung terkonfirmasi & lunas."
                                    checked={form.data.payment_method === 'cash'}
                                    onChange={(value) => form.setData('payment_method', value)}
                                />
                                <PaymentMethodCard
                                    id="pay-unpaid"
                                    name="payment_method"
                                    value="unpaid"
                                    icon={Clock}
                                    title="Bayar nanti"
                                    description="Slot ditahan, pembayaran dicatat belakangan dari halaman detail."
                                    checked={form.data.payment_method === 'unpaid'}
                                    onChange={(value) => form.setData('payment_method', value)}
                                />
                            </div>
                            {form.errors.payment_method && (
                                <p role="alert" className="mt-2 text-sm text-destructive">
                                    {form.errors.payment_method}
                                </p>
                            )}
                        </Panel>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
