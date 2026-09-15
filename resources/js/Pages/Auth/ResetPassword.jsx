import Reveal from '@/Components/animation/Reveal';
import Button from '@/Components/common/Button';
import PasswordField from '@/Components/form/PasswordField';
import TextField from '@/Components/form/TextField';
import { useFormField } from '@/hooks/useFormField';
import AuthLayout from '@/Layouts/AuthLayout';
import { useForm } from '@inertiajs/react';
import { ArrowUpRight, Mail } from 'lucide-react';

export default function ResetPassword({ token, email }) {
    const form = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });
    const field = useFormField(form);

    const submit = (event) => {
        event.preventDefault();
        form.post(route('password.store'), { onFinish: () => form.reset('password', 'password_confirmation') });
    };

    return (
        <AuthLayout
            title="Reset Password"
            eyebrow="Reset password"
            heading="Buat password baru."
            description="Gunakan password yang kuat dan belum pernah kamu pakai sebelumnya."
            aside={{
                title: 'Almost back in the game.',
                benefits: ['Minimal 8 karakter', 'Kombinasikan huruf besar, kecil & angka', 'Jangan bagikan password ke siapa pun'],
            }}
        >
            <form onSubmit={submit} noValidate>
                <Reveal y={24} stagger={0.07} delay={0.1} className="flex flex-col gap-5">
                    <TextField
                        id="email"
                        type="email"
                        label="Email"
                        icon={Mail}
                        autoComplete="username"
                        {...field('email')}
                    />
                    <PasswordField
                        id="password"
                        label="Password baru"
                        placeholder="Minimal 8 karakter"
                        autoComplete="new-password"
                        autoFocus
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
                    <Button type="submit" size="lg" icon={ArrowUpRight} loading={form.processing} disabled={form.processing} className="mt-2 w-full">
                        Simpan Password
                    </Button>
                </Reveal>
            </form>
        </AuthLayout>
    );
}
