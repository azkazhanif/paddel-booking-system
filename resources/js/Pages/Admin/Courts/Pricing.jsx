import Button from '@/Components/common/Button';
import EmptyState from '@/Components/common/EmptyState';
import PageHeader from '@/Components/common/PageHeader';
import Panel from '@/Components/common/Panel';
import DaysField from '@/Components/form/DaysField';
import SelectField from '@/Components/form/SelectField';
import SwitchField from '@/Components/form/SwitchField';
import TextField from '@/Components/form/TextField';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatRupiah, formatRupiahCompact } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { CalendarPlus, Check, Plus, Tags, Trash2 } from 'lucide-react';

const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const EMPTY_RULE = { id: null, label: 'off_peak', days_of_week: [1, 2, 3, 4, 5], start_time: '06:00', end_time: '16:00', price: '', is_active: true };
const EMPTY_SPECIAL = { id: null, date: '', start_time: '', end_time: '', price: '', note: '' };

export default function CourtPricing({ court, rules, specialPrices, labels, preview }) {
    const form = useForm({
        base_price: court.base_price,
        rules: rules.map((rule) => ({ ...rule })),
        special_prices: specialPrices.map((special) => ({ ...special })),
    });

    const setRow = (key, index, field, value) =>
        form.setData(
            key,
            form.data[key].map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
        );

    const addRow = (key, blank) => form.setData(key, [...form.data[key], { ...blank }]);
    const removeRow = (key, index) =>
        form.setData(
            key,
            form.data[key].filter((_, rowIndex) => rowIndex !== index),
        );

    const submit = (event) => {
        event.preventDefault();
        form.put(route('admin.courts.pricing.update', court.id), { preserveScroll: true });
    };

    return (
        <AdminLayout title={`Harga ${court.name}`}>
            <PageHeader
                back={{ href: route('admin.courts.index'), label: 'Lapangan' }}
                title={`Harga — ${court.name}`}
                description="Urutan prioritas saat booking: harga khusus tanggal, lalu aturan hari & jam, terakhir harga dasar."
            />

            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                <Panel title="Harga dasar" description="Dipakai bila tidak ada aturan atau harga khusus yang cocok.">
                    <TextField
                        id="base_price"
                        type="number"
                        min="0"
                        step="1000"
                        inputMode="numeric"
                        label="Harga per jam"
                        className="max-w-xs"
                        hint={form.data.base_price ? formatRupiah(Number(form.data.base_price)) : undefined}
                        value={form.data.base_price}
                        onChange={(event) => form.setData('base_price', event.target.value)}
                        error={form.errors.base_price}
                    />
                </Panel>

                <Panel
                    title="Aturan harga"
                    description="Mis. weekday 06.00–16.00 Rp250.000, weekday 16.00–23.00 Rp350.000. Jam mulai termasuk, jam selesai tidak."
                    actions={
                        <Button type="button" size="sm" variant="outline" icon={Plus} onClick={() => addRow('rules', EMPTY_RULE)}>
                            Tambah aturan
                        </Button>
                    }
                    bodyClassName="flex flex-col gap-4"
                >
                    {form.data.rules.length === 0 && (
                        <EmptyState
                            icon={Tags}
                            title="Belum ada aturan harga"
                            description="Tanpa aturan, semua jam memakai harga dasar."
                            className="py-8"
                        />
                    )}

                    {form.data.rules.map((rule, index) => (
                        <fieldset key={index} className="rounded-md border border-ink-800 p-4 md:p-5">
                            <legend className="px-2 text-xs font-semibold tracking-wide text-bone-50/40 uppercase">Aturan {index + 1}</legend>

                            <div className="grid gap-4 md:grid-cols-12">
                                <SelectField
                                    id={`rules-${index}-label`}
                                    label="Label"
                                    className="md:col-span-3"
                                    size="sm"
                                    options={labels}
                                    value={rule.label}
                                    onChange={(event) => setRow('rules', index, 'label', event.target.value)}
                                    error={form.errors[`rules.${index}.label`]}
                                />
                                <TextField
                                    id={`rules-${index}-start`}
                                    type="time"
                                    label="Mulai"
                                    className="md:col-span-2"
                                    inputClassName="h-10 text-sm"
                                    value={rule.start_time}
                                    onChange={(event) => setRow('rules', index, 'start_time', event.target.value)}
                                    error={form.errors[`rules.${index}.start_time`]}
                                />
                                <TextField
                                    id={`rules-${index}-end`}
                                    type="time"
                                    label="Selesai"
                                    className="md:col-span-2"
                                    inputClassName="h-10 text-sm"
                                    value={rule.end_time}
                                    onChange={(event) => setRow('rules', index, 'end_time', event.target.value)}
                                    error={form.errors[`rules.${index}.end_time`]}
                                />
                                <TextField
                                    id={`rules-${index}-price`}
                                    type="number"
                                    min="0"
                                    step="1000"
                                    inputMode="numeric"
                                    label="Harga / jam"
                                    className="md:col-span-3"
                                    inputClassName="h-10 text-sm"
                                    value={rule.price}
                                    onChange={(event) => setRow('rules', index, 'price', event.target.value)}
                                    error={form.errors[`rules.${index}.price`]}
                                />
                                <div className="flex items-end md:col-span-2 md:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeRow('rules', index)}
                                        className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-bone-50/50 transition-colors hover:bg-red-500/10 hover:text-red-300"
                                    >
                                        <Trash2 className="size-4" />
                                        Hapus
                                    </button>
                                </div>

                                <DaysField
                                    label="Berlaku pada hari"
                                    className="md:col-span-8"
                                    value={rule.days_of_week}
                                    onChange={(value) => setRow('rules', index, 'days_of_week', value)}
                                    error={form.errors[`rules.${index}.days_of_week`]}
                                />
                                <SwitchField
                                    id={`rules-${index}-active`}
                                    label="Aturan aktif"
                                    className="md:col-span-4"
                                    checked={rule.is_active}
                                    onCheckedChange={(value) => setRow('rules', index, 'is_active', value)}
                                />
                            </div>
                        </fieldset>
                    ))}
                </Panel>

                <Panel
                    title="Harga khusus tanggal"
                    description="Untuk hari libur nasional atau event. Kosongkan jam bila berlaku sepanjang hari."
                    actions={
                        <Button type="button" size="sm" variant="outline" icon={CalendarPlus} onClick={() => addRow('special_prices', EMPTY_SPECIAL)}>
                            Tambah tanggal
                        </Button>
                    }
                    bodyClassName="flex flex-col gap-4"
                >
                    {form.data.special_prices.length === 0 && (
                        <EmptyState
                            icon={CalendarPlus}
                            title="Belum ada harga khusus"
                            description="Semua tanggal mengikuti aturan harga di atas."
                            className="py-8"
                        />
                    )}

                    {form.data.special_prices.map((special, index) => (
                        <div key={index} className="grid gap-4 rounded-md border border-ink-800 p-4 md:grid-cols-12 md:p-5">
                            <TextField
                                id={`special-${index}-date`}
                                type="date"
                                label="Tanggal"
                                className="md:col-span-3"
                                inputClassName="h-10 text-sm"
                                value={special.date}
                                onChange={(event) => setRow('special_prices', index, 'date', event.target.value)}
                                error={form.errors[`special_prices.${index}.date`]}
                            />
                            <TextField
                                id={`special-${index}-start`}
                                type="time"
                                label="Mulai"
                                className="md:col-span-2"
                                inputClassName="h-10 text-sm"
                                value={special.start_time}
                                onChange={(event) => setRow('special_prices', index, 'start_time', event.target.value)}
                                error={form.errors[`special_prices.${index}.start_time`]}
                            />
                            <TextField
                                id={`special-${index}-end`}
                                type="time"
                                label="Selesai"
                                className="md:col-span-2"
                                inputClassName="h-10 text-sm"
                                value={special.end_time}
                                onChange={(event) => setRow('special_prices', index, 'end_time', event.target.value)}
                                error={form.errors[`special_prices.${index}.end_time`]}
                            />
                            <TextField
                                id={`special-${index}-price`}
                                type="number"
                                min="0"
                                step="1000"
                                inputMode="numeric"
                                label="Harga / jam"
                                className="md:col-span-2"
                                inputClassName="h-10 text-sm"
                                value={special.price}
                                onChange={(event) => setRow('special_prices', index, 'price', event.target.value)}
                                error={form.errors[`special_prices.${index}.price`]}
                            />
                            <TextField
                                id={`special-${index}-note`}
                                label="Catatan"
                                placeholder="Libur Lebaran"
                                className="md:col-span-2"
                                inputClassName="h-10 text-sm"
                                value={special.note ?? ''}
                                onChange={(event) => setRow('special_prices', index, 'note', event.target.value)}
                                error={form.errors[`special_prices.${index}.note`]}
                            />
                            <div className="flex items-end md:col-span-1 md:justify-end">
                                <button
                                    type="button"
                                    onClick={() => removeRow('special_prices', index)}
                                    className="grid size-10 place-items-center rounded-full text-bone-50/50 transition-colors hover:bg-red-500/10 hover:text-red-300"
                                    aria-label={`Hapus harga khusus ${index + 1}`}
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </Panel>

                <div className="flex flex-wrap items-center gap-2">
                    <Button type="submit" size="lg" icon={Check} loading={form.processing} disabled={form.processing}>
                        Simpan harga
                    </Button>
                    <Button href={route('admin.courts.index')} variant="ghost">
                        Batal
                    </Button>
                </div>
            </form>

            <Panel title="Preview harga mingguan" description="Hasil kombinasi aturan yang sudah tersimpan. Simpan dulu untuk melihat perubahan.">
                <WeeklyPreview preview={preview} />
            </Panel>
        </AdminLayout>
    );
}

function WeeklyPreview({ preview }) {
    if (!preview.hours.length) {
        return (
            <EmptyState
                title="Jam operasional belum diatur"
                description="Atur jam buka venue dulu agar preview harga bisa dihitung."
                className="py-8"
            />
        );
    }

    const prices = preview.rows.flatMap((row) => row.prices).filter(Boolean);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return (
        <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[46rem] border-separate border-spacing-0.5 text-[11px]">
                <caption className="sr-only">Harga per hari dan jam dalam rupiah</caption>
                <thead>
                    <tr>
                        <th scope="col" className="w-10" />
                        {preview.hours.map((hour) => (
                            <th key={hour} scope="col" className="pb-1 text-center font-normal text-bone-50/40 tabular-nums">
                                {String(hour).padStart(2, '0')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {preview.rows.map((row) => (
                        <tr key={row.day}>
                            <th scope="row" className="pr-2 text-left font-medium text-bone-50/50">
                                {DAY_LABELS[row.day - 1]}
                            </th>
                            {row.prices.map((price, index) => (
                                <td key={preview.hours[index]} className="p-0">
                                    <div
                                        title={price === null ? 'Tutup' : formatRupiah(price)}
                                        className={cn(
                                            'grid h-8 place-items-center rounded-md font-medium tabular-nums',
                                            price === null
                                                ? 'bg-white/[0.03] text-bone-50/20'
                                                : max > min && price === max
                                                  ? 'bg-court-500 text-ink-950'
                                                  : max > min && price === min
                                                    ? 'bg-court-500/20 text-bone-50'
                                                    : 'bg-court-500/45 text-ink-950',
                                        )}
                                    >
                                        {price === null ? '—' : formatRupiahCompact(price)}
                                    </div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
