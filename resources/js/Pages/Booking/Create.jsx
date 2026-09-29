import BookingSummary from '@/Components/booking/BookingSummary';
import CourtPicker from '@/Components/booking/CourtPicker';
import DateScroller from '@/Components/booking/DateScroller';
import SlotGrid from '@/Components/booking/SlotGrid';
import Button from '@/Components/common/Button';
import Eyebrow from '@/Components/common/Eyebrow';
import Panel from '@/Components/common/Panel';
import StatusMessage from '@/Components/common/StatusMessage';
import CheckboxField from '@/Components/form/CheckboxField';
import TextField from '@/Components/form/TextField';
import TextareaField from '@/Components/form/TextareaField';
import { useCheckboxField, useFormField } from '@/hooks/useFormField';
import AppLayout from '@/Layouts/AppLayout';
import { formatRupiah } from '@/lib/format';
import { cn, safeRoute } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import { ArrowRight, Clock, LogIn, UserRound } from 'lucide-react';
import { useState } from 'react';

const DRAFT_KEY = 'pbs:booking-draft';

function readDraft() {
    try {
        return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null');
    } catch {
        return null;
    }
}

function saveDraft(draft) {
    try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
        // sessionStorage tidak tersedia (private mode) — abaikan
    }
}

export default function BookingCreate({ courts, selected, availability, limits, serviceFee, today, customer, guestEnabled, dp }) {
    const draft = readDraft();
    const [loadingSlots, setLoadingSlots] = useState(false);
    // Tamu memilih dulu: masuk untuk bisa DP, atau lanjut tanpa akun.
    const [asGuest, setAsGuest] = useState(Boolean(customer) || Boolean(draft?.asGuest));

    const form = useForm({
        court_id: selected.court_id ?? '',
        date: selected.date,
        slots: draft?.date === selected.date && draft?.court_id === selected.court_id ? (draft.slots ?? []) : [],
        customer_name: customer?.name ?? draft?.customer_name ?? '',
        customer_email: customer?.email ?? draft?.customer_email ?? '',
        customer_email_confirmation: '',
        customer_phone: customer?.phone ?? draft?.customer_phone ?? '',
        players_count: draft?.players_count ?? 4,
        notes: '',
        terms: false,
    });

    const field = useFormField(form);
    const check = useCheckboxField(form);

    // Jadwal & sisa slot per lapangan selalu diambil ulang dari server.
    const reload = (changes) => {
        const next = { court_id: form.data.court_id, date: form.data.date, ...changes };

        form.setData((data) => ({ ...data, ...changes, slots: [] }));
        router.reload({
            only: ['availability', 'selected', 'courts'],
            data: { court_id: next.court_id, date: next.date },
            onStart: () => setLoadingSlots(true),
            onFinish: () => setLoadingSlots(false),
        });
    };

    // Batas tanggal untuk input date: hari ini + jendela booking dari settings.
    const maxDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(
        new Date(new Date(`${today}T00:00:00+07:00`).getTime() + limits.advanceDays * 86_400_000),
    );

    const chosen = availability.filter((slot) => form.data.slots.includes(slot.start_time));
    const subtotal = chosen.reduce((sum, slot) => sum + slot.price, 0);
    const fee = chosen.length ? serviceFee : 0;
    const total = subtotal + fee;
    const ready = chosen.length > 0 && (Boolean(customer) || asGuest);

    const submit = (event) => {
        event.preventDefault();
        form.post(route('booking.store'), { preserveScroll: true });
    };

    const goToLogin = () => {
        saveDraft({ ...form.data, asGuest: false });
        router.visit(safeRoute('login'));
    };

    return (
        <AppLayout title="Booking lapangan" back={{ href: safeRoute('home', '/'), label: 'Beranda' }}>
            <form onSubmit={submit} className="grid gap-6 lg:grid-cols-12">
                <div className="flex flex-col gap-6 lg:col-span-8">
                    <header>
                        <Eyebrow className="text-court-500">Booking</Eyebrow>
                        <h1 className="mt-3 font-display text-4xl leading-none font-semibold tracking-tight md:text-5xl">Pilih jam mainmu</h1>
                        <p className="mt-3 max-w-xl text-sm text-bone-50/55">
                            Slot yang dipilih ditahan {limits.holdMinutes} menit setelah booking dibuat. Harga sudah termasuk pemakaian lapangan
                            selama {limits.slotMinutes} menit per slot.
                        </p>
                    </header>

                    <Panel title="1. Tanggal main" description={`Bisa booking untuk hari ini sampai ${limits.advanceDays} hari ke depan.`}>
                        <DateScroller from={today} days={Math.min(limits.advanceDays, 13)} value={form.data.date} onChange={(date) => reload({ date })} />
                        <div className="mt-4 flex flex-wrap items-end gap-3">
                            <TextField
                                id="date"
                                label="Atau pilih tanggal lain"
                                type="date"
                                min={today}
                                max={maxDate}
                                value={form.data.date}
                                error={form.errors.date}
                                onChange={(event) => event.target.value && reload({ date: event.target.value })}
                                className="w-full sm:w-56"
                            />
                        </div>
                    </Panel>

                    <Panel title="2. Lapangan">
                        <CourtPicker courts={courts} value={form.data.court_id} onChange={(court_id) => reload({ court_id })} />
                        {form.errors.court_id && (
                            <p role="alert" className="mt-2 text-sm text-destructive">
                                {form.errors.court_id}
                            </p>
                        )}
                    </Panel>

                    <Panel
                        title="3. Jam main"
                        description={`Maksimal ${limits.maxSlots} slot berurutan dalam satu booking.`}
                        actions={
                            loadingSlots && (
                                <span className="flex items-center gap-1.5 text-xs text-bone-50/50">
                                    <Clock aria-hidden className="size-3.5 animate-pulse" />
                                    Memuat jadwal…
                                </span>
                            )
                        }
                    >
                        <SlotGrid
                            slots={availability}
                            value={form.data.slots}
                            maxSlots={limits.maxSlots}
                            onChange={(slots) => form.setData('slots', slots)}
                            className={loadingSlots ? 'opacity-50' : undefined}
                        />
                        {form.errors.slots && (
                            <p role="alert" className="mt-3 text-sm text-destructive">
                                {form.errors.slots}
                            </p>
                        )}
                    </Panel>

                    <Panel title="4. Data pemesan">
                        {!customer && !asGuest ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <ChoiceCard
                                    icon={LogIn}
                                    title="Masuk / Daftar"
                                    description={
                                        dp.enabled
                                            ? `Member bisa bayar DP ${dp.percentage}% dulu, sisanya dilunasi sebelum main. Riwayat & invoice juga tersimpan.`
                                            : 'Riwayat booking, invoice, dan e-ticket tersimpan di akunmu.'
                                    }
                                    highlight
                                    onClick={goToLogin}
                                    cta="Masuk untuk lanjut"
                                />
                                <ChoiceCard
                                    icon={UserRound}
                                    title="Lanjut sebagai tamu"
                                    description={
                                        guestEnabled
                                            ? 'Tanpa akun. Wajib bayar penuh, link bayar & e-ticket dikirim ke emailmu.'
                                            : 'Booking tanpa akun sedang ditutup. Silakan masuk terlebih dahulu.'
                                    }
                                    disabled={!guestEnabled}
                                    onClick={() => setAsGuest(true)}
                                    cta="Isi data tamu"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {!customer && (
                                    <StatusMessage tone="success">
                                        Kamu booking sebagai tamu — wajib bayar penuh.{' '}
                                        <button type="button" onClick={goToLogin} className="font-semibold underline underline-offset-2">
                                            Masuk
                                        </button>{' '}
                                        kalau mau bayar DP {dp.percentage}%.
                                    </StatusMessage>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <TextField id="customer_name" label="Nama lengkap" autoComplete="name" {...field('customer_name')} />
                                    <TextField
                                        id="customer_phone"
                                        label="No. WhatsApp"
                                        placeholder="0812…"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        {...field('customer_phone')}
                                    />
                                    {customer ? (
                                        <TextField id="customer_email" label="Email" type="email" readOnly value={customer.email} />
                                    ) : (
                                        <>
                                            <TextField
                                                id="customer_email"
                                                label="Email"
                                                type="email"
                                                autoComplete="email"
                                                hint="Link pembayaran, invoice, dan e-ticket dikirim ke sini."
                                                {...field('customer_email')}
                                            />
                                            <TextField
                                                id="customer_email_confirmation"
                                                label="Ulangi email"
                                                type="email"
                                                autoComplete="email"
                                                {...field('customer_email_confirmation')}
                                            />
                                        </>
                                    )}
                                    <TextField id="players_count" label="Jumlah pemain" type="number" min={1} max={12} {...field('players_count')} />
                                </div>

                                <TextareaField id="notes" label="Catatan (opsional)" rows={2} placeholder="Mis. minta raket sewa" {...field('notes')} />
                            </div>
                        )}
                    </Panel>
                </div>

                <aside className="lg:col-span-4">
                    <div className="flex flex-col gap-4 lg:sticky lg:top-24">
                        <Panel title="Ringkasan">
                            <BookingSummary items={chosen} subtotal={subtotal} serviceFee={fee} total={total} />

                            <CheckboxField id="terms" className="mt-5" {...check('terms')}>
                                Saya setuju dengan{' '}
                                <Link href={safeRoute('terms', '#')} className="font-semibold text-court-400 hover:underline">
                                    syarat &amp; ketentuan
                                </Link>{' '}
                                dan kebijakan pembatalan PBS.
                            </CheckboxField>

                            <Button
                                type="submit"
                                icon={ArrowRight}
                                loading={form.processing}
                                disabled={form.processing || !ready}
                                className="mt-5 w-full"
                            >
                                Lanjut ke pembayaran
                            </Button>
                            <p className="mt-3 text-center text-xs text-bone-50/40">Pembayaran diproses aman lewat Midtrans.</p>
                        </Panel>
                    </div>
                </aside>

                {/* Bar total yang menempel di bawah layar mobile */}
                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-800 bg-ink-950/95 p-3 backdrop-blur-md lg:hidden">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs text-bone-50/45">{chosen.length ? `${chosen.length} slot dipilih` : 'Belum ada slot'}</p>
                            <p className="font-display text-xl font-semibold tabular-nums">{formatRupiah(total)}</p>
                        </div>
                        <Button type="submit" size="sm" loading={form.processing} disabled={form.processing || !ready}>
                            Lanjut
                        </Button>
                    </div>
                </div>
                <div aria-hidden className="h-16 lg:hidden" />
            </form>
        </AppLayout>
    );
}

function ChoiceCard({ icon: Icon, title, description, cta, highlight = false, disabled = false, onClick }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'flex flex-col items-start gap-2 rounded-md border p-5 text-left transition-colors',
                highlight ? 'border-court-500/50 bg-court-500/10 hover:border-court-500' : 'border-ink-700 hover:border-ink-400/50',
                disabled && 'cursor-not-allowed opacity-50 hover:border-ink-700',
            )}
        >
            <span className={cn('grid size-9 place-items-center rounded-full', highlight ? 'bg-court-500 text-ink-950' : 'bg-white/8 text-bone-50/70')}>
                <Icon aria-hidden className="size-4" />
            </span>
            <span className="font-semibold">{title}</span>
            <span className="text-xs text-bone-50/55">{description}</span>
            <span className={cn('mt-2 text-xs font-semibold', highlight ? 'text-court-400' : 'text-bone-50/70')}>{cta} →</span>
        </button>
    );
}
