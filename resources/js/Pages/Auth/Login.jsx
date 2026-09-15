import Reveal from '@/Components/animation/Reveal';
import MemberHighlight from '@/Components/auth/MemberHighlight';
import Button from '@/Components/common/Button';
import StatusMessage from '@/Components/common/StatusMessage';
import TextLink from '@/Components/common/TextLink';
import CheckboxField from '@/Components/form/CheckboxField';
import PasswordField from '@/Components/form/PasswordField';
import TextField from '@/Components/form/TextField';
import { useCheckboxField, useFormField } from '@/hooks/useFormField';
import AuthLayout from '@/Layouts/AuthLayout';
import { safeRoute } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { ArrowUpRight, Mail } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const field = useFormField(form);
    const checkbox = useCheckboxField(form);

    const submit = (event) => {
        event.preventDefault();
        form.post(route('login'), { onFinish: () => form.reset('password') });
    };

    return (
        <AuthLayout
            title="Masuk"
            eyebrow="Member area"
            heading="Welcome back."
            description="Masuk untuk melanjutkan booking, melunasi DP, dan melihat e-ticket kamu."
            aside={{
                title: 'Back to the court.',
                benefits: ['Lanjutkan booking yang tertunda', 'Lunasi DP & unduh invoice', 'Semua e-ticket di satu tempat'],
                highlight: <MemberHighlight />,
            }}
            footer={
                <div className="flex flex-col gap-3">
                    <p>
                        Belum punya akun? <TextLink href={route('register')}>Daftar gratis</TextLink>
                    </p>
                    <p>
                        Mau langsung main?{' '}
                        <TextLink href={`${safeRoute('home', '/')}#availability`} className="text-bone-50">
                            Booking sebagai tamu
                        </TextLink>
                    </p>
                </div>
            }
        >
            <StatusMessage className="mb-6">{status}</StatusMessage>

            <form onSubmit={submit} noValidate>
                <Reveal y={24} stagger={0.07} delay={0.1} className="flex flex-col gap-5">
                    <TextField
                        id="email"
                        type="email"
                        label="Email"
                        icon={Mail}
                        placeholder="nama@email.com"
                        autoComplete="username"
                        autoFocus
                        {...field('email')}
                    />

                    <PasswordField
                        id="password"
                        label="Password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...field('password')}
                        action={
                            canResetPassword && (
                                <TextLink href={route('password.request')} className="text-sm font-medium">
                                    Lupa password?
                                </TextLink>
                            )
                        }
                    />

                    <CheckboxField id="remember" {...checkbox('remember')}>
                        Ingat saya di perangkat ini
                    </CheckboxField>

                    <Button type="submit" size="lg" icon={ArrowUpRight} loading={form.processing} disabled={form.processing} className="mt-2 w-full">
                        Masuk
                    </Button>
                </Reveal>
            </form>
        </AuthLayout>
    );
}
