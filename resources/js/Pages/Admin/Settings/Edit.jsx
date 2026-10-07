import Button from '@/Components/common/Button';
import PageHeader from '@/Components/common/PageHeader';
import Panel from '@/Components/common/Panel';
import SelectField from '@/Components/form/SelectField';
import SwitchField from '@/Components/form/SwitchField';
import TextField from '@/Components/form/TextField';
import TextareaField from '@/Components/form/TextareaField';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatRupiah } from '@/lib/format';
import { useForm } from '@inertiajs/react';
import { Plus, Save, Trash2 } from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function AdminSettings({ settings, hours, closures, today }) {
    const form = useForm({
        venue: { ...settings.venue },
        booking: { ...settings.booking },
        guest: { ...settings.guest },
        dp: { ...settings.dp },
        reminder: { ...settings.reminder },
        invoice: { ...settings.invoice },
        hours: hours.map((hour) => ({ ...hour })),
        closures: [...closures],
    });

    // Semua field bersarang di bawah grupnya, jadi satu helper dipakai bersama.
    const group =
        (name) =>
        (key, options = {}) => ({
            value: form.data[name][key] ?? '',
            error: form.errors[`${name}.${key}`],
            onChange: (event) => {
                const raw = event.target.value;
                form.setData(name, { ...form.data[name], [key]: options.number ? (raw === '' ? '' : Number(raw)) : raw });
            },
        });

    const venue = group('venue');
    const booking = group('booking');
    const guest = group('guest');
    const dp = group('dp');
    const reminder = group('reminder');
    const invoice = group('invoice');

    const toggle = (name, key) => ({
        checked: Boolean(form.data[name][key]),
        error: form.errors[`${name}.${key}`],
        onCheckedChange: (value) => form.setData(name, { ...form.data[name], [key]: value }),
    });

    const setHour = (index, key, value) =>
        form.setData(
            'hours',
            form.data.hours.map((hour, hourIndex) => (hourIndex === index ? { ...hour, [key]: value } : hour)),
        );

    const submit = (event) => {
        event.preventDefault();
        form.put(route('admin.settings.update'), { preserveScroll: true });
    };

    return (
        <AdminLayout title="Pengaturan">
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                <PageHeader
                    title="Pengaturan venue"
                    description="Nilai di sini dipakai seluruh aplikasi: harga, batas booking, kebijakan DP, dan isi invoice."
                    actions={
                        <Button type="submit" icon={Save} loading={form.processing} disabled={form.processing}>
                            Simpan pengaturan
                        </Button>
                    }
                />

                <div className="grid gap-4 lg:grid-cols-2">
                    <Panel title="Identitas venue">
                        <div className="flex flex-col gap-4">
                            <TextField id="venue_name" label="Nama venue" {...venue('name')} />
                            <TextField id="venue_address" label="Alamat" {...venue('address')} />
                            <TextField id="venue_whatsapp" label="No. WhatsApp" placeholder="6281..." {...venue('whatsapp')} />
                            <div className="grid grid-cols-2 gap-3">
                                <TextField id="venue_lat" label="Latitude" type="number" step="any" {...venue('lat')} />
                                <TextField id="venue_lng" label="Longitude" type="number" step="any" {...venue('lng')} />
                            </div>
                            <TextField id="venue_instagram" label="Instagram" placeholder="https://instagram.com/..." {...venue('instagram')} />
                            <TextField id="venue_tiktok" label="TikTok" placeholder="https://tiktok.com/..." {...venue('tiktok')} />
                        </div>
                    </Panel>

                    <Panel title="Kebijakan booking">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SelectField
                                id="slot_duration"
                                label="Durasi slot"
                                options={[
                                    { value: '30', label: '30 menit' },
                                    { value: '60', label: '60 menit' },
                                    { value: '90', label: '90 menit' },
                                ]}
                                value={String(form.data.booking.slot_duration_minutes)}
                                error={form.errors['booking.slot_duration_minutes']}
                                onChange={(event) =>
                                    form.setData('booking', { ...form.data.booking, slot_duration_minutes: Number(event.target.value) })
                                }
                            />
                            <TextField
                                id="max_slots"
                                label="Maks. slot per booking"
                                type="number"
                                min="1"
                                max="8"
                                {...booking('max_slots_per_booking', { number: true })}
                            />
                            <TextField
                                id="advance_days"
                                label="Bisa booking sampai (hari)"
                                type="number"
                                min="1"
                                max="365"
                                {...booking('advance_days', { number: true })}
                            />
                            <TextField
                                id="hold_minutes"
                                label="Slot ditahan (menit)"
                                type="number"
                                min="5"
                                max="120"
                                {...booking('hold_minutes', { number: true })}
                            />
                            <TextField
                                id="max_pending"
                                label="Maks. booking pending/member"
                                type="number"
                                min="1"
                                max="10"
                                {...booking('max_pending_per_user', { number: true })}
                            />
                            <TextField
                                id="cancel_before"
                                label="Batas batal (jam sebelum main)"
                                type="number"
                                min="0"
                                max="168"
                                {...booking('cancel_before_hours', { number: true })}
                            />
                            <TextField
                                id="service_fee"
                                label="Biaya layanan"
                                type="number"
                                min="0"
                                step="1000"
                                hint={formatRupiah(Number(form.data.booking.service_fee) || 0)}
                                className="sm:col-span-2"
                                {...booking('service_fee', { number: true })}
                            />
                        </div>
                    </Panel>

                    <Panel title="Booking tamu">
                        <div className="flex flex-col gap-4">
                            <SwitchField id="guest_enabled" label="Izinkan booking tanpa akun" {...toggle('guest', 'enabled')} />
                            <TextField
                                id="guest_ip_limit"
                                label="Maks. booking per IP per jam"
                                type="number"
                                min="1"
                                max="50"
                                {...guest('max_bookings_per_ip_hour', { number: true })}
                            />
                        </div>
                    </Panel>

                    <Panel title="Kebijakan DP (member)">
                        <div className="flex flex-col gap-4">
                            <SwitchField id="dp_enabled" label="Izinkan pembayaran DP" {...toggle('dp', 'enabled')} />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextField
                                    id="dp_percentage"
                                    label="Persentase DP (%)"
                                    type="number"
                                    min="5"
                                    max="90"
                                    {...dp('percentage', { number: true })}
                                />
                                <TextField
                                    id="dp_min_days"
                                    label="DP mulai H- (hari)"
                                    type="number"
                                    min="0"
                                    max="30"
                                    {...dp('min_days_ahead', { number: true })}
                                />
                                <TextField
                                    id="dp_settle"
                                    label="Pelunasan maks. (jam sebelum main)"
                                    type="number"
                                    min="0"
                                    max="72"
                                    {...dp('settle_before_hours', { number: true })}
                                />
                                <TextField
                                    id="dp_grace"
                                    label="Toleransi no-show (menit)"
                                    type="number"
                                    min="0"
                                    max="180"
                                    {...dp('no_show_grace_minutes', { number: true })}
                                />
                                <TextField
                                    id="dp_max_unsettled"
                                    label="Maks. DP aktif per member"
                                    type="number"
                                    min="1"
                                    max="10"
                                    {...dp('max_unsettled_per_user', { number: true })}
                                />
                                <TextField
                                    id="dp_refundable"
                                    label="DP refundable (jam sebelum main)"
                                    type="number"
                                    min="0"
                                    max="168"
                                    {...dp('refundable_before_hours', { number: true })}
                                />
                            </div>
                        </div>
                    </Panel>

                    <Panel title="Pengingat">
                        <TextField
                            id="play_lead"
                            label="Pengingat WhatsApp sebelum main (menit)"
                            type="number"
                            min="15"
                            max="1440"
                            className="max-w-xs"
                            {...reminder('play_lead_minutes', { number: true })}
                        />
                    </Panel>

                    <Panel title="Invoice">
                        <div className="flex flex-col gap-4">
                            <TextField id="invoice_company" label="Nama perusahaan" {...invoice('company_name')} />
                            <TextField id="invoice_tax" label="NPWP (opsional)" {...invoice('tax_id')} />
                            <TextareaField id="invoice_note" label="Catatan kaki invoice" rows={2} {...invoice('footer_note')} />
                        </div>
                    </Panel>
                </div>

                <Panel title="Jam operasional" description="Hari yang ditutup tidak menampilkan slot apa pun di halaman booking.">
                    <ul className="flex flex-col gap-3">
                        {form.data.hours.map((hour, index) => (
                            <li key={hour.day_of_week} className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                                <p className="text-sm font-medium">{DAYS[hour.day_of_week - 1]}</p>
                                <TextField
                                    id={`open_${hour.day_of_week}`}
                                    label="Buka"
                                    type="time"
                                    value={hour.open_time}
                                    error={form.errors[`hours.${index}.open_time`]}
                                    onChange={(event) => setHour(index, 'open_time', event.target.value)}
                                />
                                <TextField
                                    id={`close_${hour.day_of_week}`}
                                    label="Tutup"
                                    type="time"
                                    value={hour.close_time}
                                    error={form.errors[`hours.${index}.close_time`]}
                                    onChange={(event) => setHour(index, 'close_time', event.target.value)}
                                />
                                <SwitchField
                                    id={`closed_${hour.day_of_week}`}
                                    label="Tutup seharian"
                                    checked={hour.is_closed}
                                    onCheckedChange={(value) => setHour(index, 'is_closed', value)}
                                />
                            </li>
                        ))}
                    </ul>
                </Panel>

                <Panel
                    title="Tanggal tutup"
                    description="Tanggal libur atau acara khusus — venue dianggap tutup penuh."
                    actions={
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            icon={Plus}
                            onClick={() => form.setData('closures', [...form.data.closures, today])}
                        >
                            Tambah tanggal
                        </Button>
                    }
                >
                    {form.data.closures.length ? (
                        <ul className="flex flex-wrap gap-3">
                            {form.data.closures.map((date, index) => (
                                <li key={`${date}-${index}`} className="flex items-end gap-2">
                                    <TextField
                                        id={`closure_${index}`}
                                        label={`Tanggal ${index + 1}`}
                                        type="date"
                                        value={date}
                                        error={form.errors[`closures.${index}`]}
                                        onChange={(event) =>
                                            form.setData(
                                                'closures',
                                                form.data.closures.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
                                            )
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        icon={Trash2}
                                        className="mb-1 text-red-300"
                                        onClick={() =>
                                            form.setData(
                                                'closures',
                                                form.data.closures.filter((_, itemIndex) => itemIndex !== index),
                                            )
                                        }
                                    >
                                        Hapus
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-bone-50/50">Belum ada tanggal tutup.</p>
                    )}
                </Panel>
            </form>
        </AdminLayout>
    );
}
