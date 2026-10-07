import Button from '@/Components/common/Button';
import ConfirmDialog from '@/Components/common/ConfirmDialog';
import Eyebrow from '@/Components/common/Eyebrow';
import Panel from '@/Components/common/Panel';
import StatusMessage from '@/Components/common/StatusMessage';
import AvatarField from '@/Components/form/AvatarField';
import PasswordField from '@/Components/form/PasswordField';
import TextField from '@/Components/form/TextField';
import { useFormField } from '@/hooks/useFormField';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatRupiah } from '@/lib/format';
import { safeRoute } from '@/lib/utils';
import { Link, useForm, usePage } from '@inertiajs/react';
import { BadgeCheck, Check, MailWarning, Save, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

export default function ProfileEdit({ mustVerifyEmail, status, profile, stats }) {
    const { flash } = usePage().props;
    const [confirmDelete, setConfirmDelete] = useState(false);

    const info = useForm({
        _method: 'patch',
        name: profile.name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        avatar: null,
        remove_avatar: false,
    });

    const password = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const remove = useForm({ password: '' });

    const infoField = useFormField(info);
    const passwordField = useFormField(password);

    // Unggahan file butuh POST + _method spoofing agar multipart terkirim utuh.
    const saveInfo = (event) => {
        event.preventDefault();
        info.post(route('profile.update'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => info.setData('avatar', null),
        });
    };

    const savePassword = (event) => {
        event.preventDefault();
        password.put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => password.reset(),
            onError: () => password.reset('password', 'password_confirmation'),
        });
    };

    return (
        <AppLayout
            title="Profil"
            back={{
                href: safeRoute('my-bookings.index', safeRoute('home', '/')),
                label: 'Booking saya',
            }}
        >
            <div className="flex flex-col gap-6">
                <header>
                    <Eyebrow className="text-court-500">Akun</Eyebrow>
                    <h1 className="mt-3 font-display text-4xl leading-none font-semibold tracking-tight md:text-5xl">Profil saya</h1>
                    <p className="mt-3 text-sm text-bone-50/55">
                        Member sejak {formatDate(profile.member_since)}. Data ini dipakai otomatis saat kamu booking.
                    </p>
                </header>

                {flash?.success && <StatusMessage tone="success">{flash.success}</StatusMessage>}
                {flash?.error && <StatusMessage tone="error">{flash.error}</StatusMessage>}
                {status === 'verification-link-sent' && <StatusMessage tone="success">Link verifikasi baru sudah dikirim ke emailmu.</StatusMessage>}
                {status === 'password-updated' && <StatusMessage tone="success">Password diperbarui.</StatusMessage>}

                {mustVerifyEmail && !profile.verified && (
                    <div className="flex flex-col gap-3 rounded-md border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200 sm:flex-row sm:items-center sm:justify-between">
                        <p className="flex items-start gap-3">
                            <MailWarning aria-hidden className="mt-0.5 size-4 shrink-0" />
                            Email kamu belum terverifikasi, jadi opsi bayar DP masih terkunci.
                        </p>
                        <Button href={route('verification.notice')} variant="outline" size="sm" className="shrink-0">
                            Verifikasi sekarang
                        </Button>
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-12">
                    <div className="flex flex-col gap-4 lg:col-span-7">
                        <Panel title="Data akun" description="Nama & nomor WhatsApp dipakai untuk konfirmasi booking dan pengingat jadwal.">
                            <form onSubmit={saveInfo} className="flex flex-col gap-5">
                                <AvatarField
                                    id="avatar"
                                    label="Foto profil"
                                    name={info.data.name}
                                    current={profile.avatar}
                                    file={info.data.avatar}
                                    removed={info.data.remove_avatar}
                                    error={info.errors.avatar}
                                    hint="JPG, PNG, atau WebP maksimal 2 MB."
                                    onFileChange={(file) => info.setData('avatar', file)}
                                    onRemovedChange={(value) => info.setData('remove_avatar', value)}
                                />

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <TextField id="name" label="Nama lengkap" autoComplete="name" {...infoField('name')} />
                                    <TextField
                                        id="phone"
                                        label="No. WhatsApp"
                                        placeholder="0812…"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        {...infoField('phone')}
                                    />
                                </div>

                                <TextField
                                    id="email"
                                    label="Email"
                                    type="email"
                                    autoComplete="email"
                                    hint="Mengganti email akan mencabut status verifikasi dan opsi DP sampai email baru diverifikasi."
                                    {...infoField('email')}
                                />

                                <div className="flex items-center gap-3">
                                    <Button type="submit" icon={Save} loading={info.processing} disabled={info.processing}>
                                        Simpan perubahan
                                    </Button>
                                    {info.recentlySuccessful && (
                                        <span className="flex items-center gap-1.5 text-sm text-court-400">
                                            <Check aria-hidden className="size-4" />
                                            Tersimpan
                                        </span>
                                    )}
                                </div>
                            </form>
                        </Panel>

                        <Panel title="Ganti password" description="Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.">
                            <form onSubmit={savePassword} className="flex flex-col gap-5">
                                <PasswordField
                                    id="current_password"
                                    label="Password saat ini"
                                    autoComplete="current-password"
                                    {...passwordField('current_password')}
                                />
                                <PasswordField
                                    id="password"
                                    label="Password baru"
                                    autoComplete="new-password"
                                    showStrength
                                    {...passwordField('password')}
                                />
                                <PasswordField
                                    id="password_confirmation"
                                    label="Ulangi password baru"
                                    autoComplete="new-password"
                                    {...passwordField('password_confirmation')}
                                />

                                <div className="flex items-center gap-3">
                                    <Button type="submit" variant="outline" loading={password.processing} disabled={password.processing}>
                                        Perbarui password
                                    </Button>
                                    {password.recentlySuccessful && (
                                        <span className="flex items-center gap-1.5 text-sm text-court-400">
                                            <Check aria-hidden className="size-4" />
                                            Diperbarui
                                        </span>
                                    )}
                                </div>
                            </form>
                        </Panel>
                    </div>

                    <div className="flex flex-col gap-4 lg:col-span-5">
                        <Panel title="Ringkasan">
                            <dl className="grid grid-cols-2 gap-3">
                                <Stat label="Total booking" value={stats.bookings} />
                                <Stat label="Akan datang" value={stats.upcoming} />
                                <Stat label="Belum lunas" value={stats.unsettled} />
                                <Stat label="Total dibayar" value={formatRupiah(stats.spent)} small />
                            </dl>

                            <div
                                className={`mt-4 flex items-start gap-3 rounded-md border p-4 text-sm ${
                                    profile.can_use_dp ? 'border-court-500/30 bg-court-500/10 text-court-400' : 'border-ink-700 text-bone-50/55'
                                }`}
                            >
                                <BadgeCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
                                <p>{profile.can_use_dp ? 'Kamu bisa bayar DP di booking berikutnya.' : 'Opsi DP belum aktif untuk akun ini.'}</p>
                            </div>

                            <Link
                                href={safeRoute('my-bookings.index', safeRoute('home', '/'))}
                                className="mt-4 inline-block text-sm font-semibold text-court-400 hover:underline"
                            >
                                Lihat semua booking →
                            </Link>
                        </Panel>

                        <Panel title="Hapus akun" description="Akun dan datanya dihapus permanen. Riwayat booking tetap tersimpan di catatan venue.">
                            <Button
                                variant="outline"
                                icon={TriangleAlert}
                                className="text-red-300 hover:border-red-400"
                                onClick={() => setConfirmDelete(true)}
                            >
                                Hapus akun saya
                            </Button>
                        </Panel>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmDelete}
                onOpenChange={(open) => {
                    setConfirmDelete(open);
                    if (!open) remove.reset();
                }}
                title="Hapus akun?"
                description="Tindakan ini tidak bisa dibatalkan. Masukkan password untuk konfirmasi."
                confirmLabel="Hapus akun"
                destructive
                processing={remove.processing}
                onConfirm={() =>
                    remove.delete(route('profile.destroy'), {
                        preserveScroll: true,
                        onSuccess: () => setConfirmDelete(false),
                    })
                }
            >
                <PasswordField
                    id="delete_password"
                    label="Password"
                    autoComplete="current-password"
                    value={remove.data.password}
                    error={remove.errors.password}
                    onChange={(event) => remove.setData('password', event.target.value)}
                />
            </ConfirmDialog>
        </AppLayout>
    );
}

function Stat({ label, value, small = false }) {
    return (
        <div className="rounded-md border border-ink-800 p-4">
            <dt className="text-xs text-bone-50/45">{label}</dt>
            <dd className={`mt-1 font-display font-semibold tabular-nums ${small ? 'text-lg' : 'text-2xl'}`}>{value}</dd>
        </div>
    );
}
