import Button from '@/Components/common/Button';
import PageHeader from '@/Components/common/PageHeader';
import Panel from '@/Components/common/Panel';
import PasswordField from '@/Components/form/PasswordField';
import TextField from '@/Components/form/TextField';
import { useFormField } from '@/hooks/useFormField';
import AdminLayout from '@/Layouts/AdminLayout';
import { cn } from '@/lib/utils';
import { useForm, usePage } from '@inertiajs/react';
import { Check, Mail, Phone, User } from 'lucide-react';

const ROLE_DESCRIPTIONS = {
    owner: 'Akses penuh: pendapatan, laporan, pengaturan venue, dan kelola user.',
    admin: 'Operasional: booking, jadwal, lapangan, customer, dan pembayaran.',
    staff: 'Resepsionis: jadwal hari ini, check-in, dan booking walk-in.',
};

export default function UserForm({ user, roles }) {
    const { auth } = usePage().props;
    const isEdit = Boolean(user);
    const isSelf = isEdit && user.id === auth.user.id;

    const form = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        role: user?.role ?? 'staff',
        password: '',
        password_confirmation: '',
    });
    const field = useFormField(form);

    const submit = (event) => {
        event.preventDefault();

        const options = { preserveScroll: true, onFinish: () => form.reset('password', 'password_confirmation') };

        if (isEdit) {
            form.put(route('admin.users.update', user.id), options);
            return;
        }

        form.post(route('admin.users.store'), options);
    };

    return (
        <AdminLayout title={isEdit ? `Ubah ${user.name}` : 'Tambah akun'}>
            <PageHeader
                back={{ href: route('admin.users.index'), label: 'Kelola User' }}
                title={isEdit ? user.name : 'Tambah akun'}
                description={isEdit ? 'Perbarui data akun atau reset password.' : 'Akun baru langsung aktif dan terverifikasi.'}
            />

            <form onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-12">
                <div className="flex flex-col gap-4 lg:col-span-8">
                    <Panel title="Data akun" bodyClassName="grid gap-5 md:grid-cols-2">
                        <TextField id="name" label="Nama" icon={User} autoComplete="off" className="md:col-span-2" {...field('name')} />
                        <TextField id="email" type="email" label="Email" icon={Mail} autoComplete="off" {...field('email')} />
                        <TextField id="phone" type="tel" label="WhatsApp" icon={Phone} placeholder="0812…" hint="Opsional" {...field('phone')} />
                    </Panel>

                    <Panel
                        title={isEdit ? 'Reset password' : 'Password'}
                        description={isEdit ? 'Kosongkan bila tidak ingin mengubah password.' : undefined}
                        bodyClassName="grid gap-5 md:grid-cols-2"
                    >
                        <PasswordField id="password" label="Password" autoComplete="new-password" showStrength {...field('password')} />
                        <PasswordField
                            id="password_confirmation"
                            label="Ulangi password"
                            autoComplete="new-password"
                            {...field('password_confirmation')}
                        />
                    </Panel>
                </div>

                <div className="flex flex-col gap-4 lg:col-span-4">
                    <Panel title="Role" description={isSelf ? 'Kamu tidak bisa mengubah role akunmu sendiri.' : undefined}>
                        <fieldset className="flex flex-col gap-2" disabled={isSelf}>
                            <legend className="sr-only">Role</legend>
                            {roles.map((role) => {
                                const selected = form.data.role === role.value;

                                return (
                                    <label
                                        key={role.value}
                                        className={cn(
                                            'flex cursor-pointer gap-3 rounded-md border p-4 transition-colors has-disabled:cursor-not-allowed has-disabled:opacity-60',
                                            selected ? 'border-court-500 bg-court-500/10' : 'border-ink-700 hover:border-ink-400/40',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={role.value}
                                            checked={selected}
                                            onChange={() => form.setData('role', role.value)}
                                            className="mt-1 size-4 border-ink-400 bg-ink-900 text-court-500 focus:ring-court-500 focus:ring-offset-ink-900"
                                        />
                                        <span>
                                            <span className="block text-sm font-semibold">{role.label}</span>
                                            <span className="mt-0.5 block text-sm text-bone-50/50">{ROLE_DESCRIPTIONS[role.value]}</span>
                                        </span>
                                    </label>
                                );
                            })}
                        </fieldset>
                        {form.errors.role && (
                            <p role="alert" className="mt-2 text-sm text-destructive">
                                {form.errors.role}
                            </p>
                        )}
                    </Panel>

                    <div className="flex flex-col gap-2">
                        <Button type="submit" size="lg" icon={Check} loading={form.processing} disabled={form.processing} className="w-full">
                            {isEdit ? 'Simpan perubahan' : 'Tambah akun'}
                        </Button>
                        <Button href={route('admin.users.index')} variant="ghost" className="w-full">
                            Batal
                        </Button>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
