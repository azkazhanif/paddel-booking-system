import Reveal from '@/Components/animation/Reveal';
import MemberHighlight from '@/Components/auth/MemberHighlight';
import Button from '@/Components/common/Button';
import TextLink from '@/Components/common/TextLink';
import CheckboxField from '@/Components/form/CheckboxField';
import PasswordField from '@/Components/form/PasswordField';
import TextField from '@/Components/form/TextField';
import { useCheckboxField, useFormField } from '@/hooks/useFormField';
import AuthLayout from '@/Layouts/AuthLayout';
import { safeRoute } from '@/lib/utils';
import { useForm, usePage } from '@inertiajs/react';
import { ArrowUpRight, Mail, Phone, User } from 'lucide-react';

export default function Register() {
    const { dpPercentage } = usePage().props;
    const form = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });
    const field = useFormField(form);
    const checkbox = useCheckboxField(form);

    const submit = (event) => {
        event.preventDefault();
        form.post(route('register'), { onFinish: () => form.reset('password', 'password_confirmation') });
    };

    const termsHref = safeRoute('terms', null);

    return (
        <AuthLayout
            title="Daftar"
            eyebrow="Gratis selamanya"
            heading="Join the club."
            description={`Buat akun member untuk booking dengan DP ${dpPercentage}% dan simpan semua riwayat mainmu.`}
            aside={{
                title: 'Play more, pay smarter.',
                benefits: [
                    `Amankan slot cukup dengan DP ${dpPercentage}%`,
                    'Riwayat booking & invoice tersimpan',
                    'Checkout lebih cepat tanpa isi data ulang',
                    'Pengingat jadwal & pelunasan otomatis',
                ],
                highlight: <MemberHighlight />,
            }}
            footer={
                <p>
                    Sudah punya akun? <TextLink href={route('login')}>Masuk</TextLink>
                </p>
            }
        >
            <form onSubmit={submit} noValidate>
                <Reveal y={24} stagger={0.06} delay={0.1} className="flex flex-col gap-5">
                    <TextField
                        id="name"
                        label="Nama lengkap"
                        icon={User}
                        placeholder="Nama sesuai identitas"
                        autoComplete="name"
                        autoFocus
                        {...field('name')}
                    />

                    <div className="grid gap-5 sm:grid-cols-2">
                        <TextField
                            id="email"
                            type="email"
                            label="Email"
                            icon={Mail}
                            placeholder="nama@email.com"
                            autoComplete="email"
                            {...field('email')}
                        />
                        <TextField
                            id="phone"
                            type="tel"
                            inputMode="tel"
                            label="No. WhatsApp"
                            icon={Phone}
                            placeholder="0812 3456 7890"
                            autoComplete="tel"
                            {...field('phone')}
                        />
                    </div>

                    <PasswordField
                        id="password"
                        label="Password"
                        placeholder="Minimal 8 karakter"
                        autoComplete="new-password"
                        showStrength
                        {...field('password')}
                    />

                    <PasswordField
                        id="password_confirmation"
                        label="Konfirmasi password"
                        placeholder="Ulangi password"
                        autoComplete="new-password"
                        {...field('password_confirmation')}
                    />

                    <CheckboxField id="terms" {...checkbox('terms')}>
                        Saya menyetujui{' '}
                        {termsHref ? <TextLink href={termsHref}>syarat & ketentuan</TextLink> : <span className="font-semibold text-bone-50">syarat & ketentuan</span>}{' '}
                        serta kebijakan privasi PBS.
                    </CheckboxField>

                    <Button type="submit" size="lg" icon={ArrowUpRight} loading={form.processing} disabled={form.processing} className="mt-2 w-full">
                        Buat Akun
                    </Button>
                </Reveal>
            </form>
        </AuthLayout>
    );
}
