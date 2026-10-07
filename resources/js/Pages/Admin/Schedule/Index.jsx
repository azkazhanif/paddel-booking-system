import Button from '@/Components/common/Button';
import EmptyState from '@/Components/common/EmptyState';
import PageHeader from '@/Components/common/PageHeader';
import Panel from '@/Components/common/Panel';
import SelectField from '@/Components/form/SelectField';
import TextField from '@/Components/form/TextField';
import { useFormField } from '@/hooks/useFormField';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateLong, formatTime, formatTimeRange } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import { CalendarOff, Ban, Trash2 } from 'lucide-react';

const SLOT_STYLE = {
    available: 'border-ink-700 text-bone-50/70',
    booked: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
    blocked: 'border-red-500/30 bg-red-500/10 text-red-200',
    past: 'border-ink-800 bg-white/[0.02] text-bone-50/25',
};

const SLOT_LABEL = { available: 'Kosong', booked: 'Terisi', blocked: 'Diblokir', past: 'Lewat' };

export default function AdminSchedule({ courts, selected, slots, blocks, reasons, today }) {
    const form = useForm({
        court_id: selected.court_id ? String(selected.court_id) : '',
        date: selected.date,
        start_time: '',
        end_time: '',
        reason: reasons[0]?.value ?? 'maintenance',
        note: '',
    });

    const field = useFormField(form);

    const reload = (changes) => {
        const next = { court_id: form.data.court_id, date: form.data.date, ...changes };

        form.setData((data) => ({ ...data, ...changes }));
        router.reload({ only: ['slots', 'blocks', 'selected'], data: { court_id: next.court_id, date: next.date } });
    };

    const submit = (event) => {
        event.preventDefault();
        form.post(route('admin.schedule.blocks.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('start_time', 'end_time', 'note'),
        });
    };

    return (
        <AdminLayout title="Jadwal">
            <PageHeader
                title="Jadwal & blokir slot"
                description="Lihat slot yang sudah terisi, lalu blokir jam yang tidak boleh dijual (perawatan, turnamen, acara)."
            />

            <div className="grid gap-4 lg:grid-cols-12">
                <div className="flex flex-col gap-4 lg:col-span-8">
                    <Panel title="Slot hari ini" description={formatDateLong(selected.date)}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SelectField
                                id="filter_court"
                                label="Lapangan"
                                value={form.data.court_id}
                                onChange={(event) => reload({ court_id: event.target.value })}
                                options={courts.map((court) => ({ value: String(court.id), label: court.name }))}
                                placeholder={courts.length ? undefined : 'Belum ada lapangan aktif'}
                            />
                            <TextField
                                id="filter_date"
                                label="Tanggal"
                                type="date"
                                value={form.data.date}
                                onChange={(event) => reload({ date: event.target.value })}
                            />
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                            {slots.map((slot) => (
                                <div
                                    key={slot.start_time}
                                    className={cn('flex flex-col gap-0.5 rounded-md border px-3 py-2.5', SLOT_STYLE[slot.status])}
                                >
                                    <span className="text-sm font-semibold tabular-nums">{formatTimeRange(slot.start_time, slot.end_time)}</span>
                                    {slot.booking ? (
                                        <Link
                                            href={route('admin.bookings.show', slot.booking.id)}
                                            className="truncate text-xs underline-offset-2 hover:underline"
                                        >
                                            {slot.booking.code} · {slot.booking.customer_name}
                                        </Link>
                                    ) : (
                                        <span className="text-xs opacity-70">{SLOT_LABEL[slot.status]}</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {!slots.length && <p className="mt-4 text-sm text-bone-50/50">Venue tutup pada tanggal ini.</p>}
                    </Panel>

                    <Panel title="Blokir pada tanggal ini" description="Berlaku untuk semua lapangan yang diblokir hari itu.">
                        {blocks.length ? (
                            <ul className="divide-y divide-ink-800 text-sm">
                                {blocks.map((block) => (
                                    <li key={block.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                        <div className="min-w-0">
                                            <p className="font-medium">
                                                {block.court?.name} · {formatTimeRange(block.start_time, block.end_time)}
                                            </p>
                                            <p className="mt-0.5 text-xs text-bone-50/45">
                                                {reasons.find((reason) => reason.value === block.reason)?.label ?? block.reason}
                                                {block.note ? ` — ${block.note}` : ''}
                                                {block.created_by ? ` · oleh ${block.created_by}` : ''}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon={Trash2}
                                            className="text-red-300"
                                            onClick={() => router.delete(route('admin.schedule.blocks.destroy', block.id), { preserveScroll: true })}
                                        >
                                            Hapus
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <EmptyState
                                icon={CalendarOff}
                                title="Belum ada blokir"
                                description="Semua slot kosong pada tanggal ini bisa dipesan customer."
                            />
                        )}
                    </Panel>
                </div>

                <div className="lg:col-span-4">
                    <Panel title="Blokir slot baru" description="Slot yang masih dipegang booking aktif harus dibatalkan lebih dulu.">
                        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                            <SelectField
                                id="court_id"
                                label="Lapangan"
                                options={courts.map((court) => ({ value: String(court.id), label: court.name }))}
                                {...field('court_id')}
                            />
                            <TextField id="date" label="Tanggal" type="date" min={today} {...field('date')} />
                            <div className="grid grid-cols-2 gap-3">
                                <TextField id="start_time" label="Dari jam" type="time" step="900" {...field('start_time')} />
                                <TextField id="end_time" label="Sampai jam" type="time" step="900" {...field('end_time')} />
                            </div>
                            <SelectField id="reason" label="Alasan" options={reasons} {...field('reason')} />
                            <TextField id="note" label="Catatan (opsional)" placeholder="Mis. perbaikan lampu" {...field('note')} />

                            <Button type="submit" icon={Ban} loading={form.processing} disabled={form.processing} className="w-full">
                                Blokir slot
                            </Button>
                        </form>
                    </Panel>
                </div>
            </div>
        </AdminLayout>
    );
}
