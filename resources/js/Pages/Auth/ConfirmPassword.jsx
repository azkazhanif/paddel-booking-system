import Reveal from '@/Components/animation/Reveal';
import Button from '@/Components/common/Button';
import PasswordField from '@/Components/form/PasswordField';
import { useFormField } from '@/hooks/useFormField';
import AuthLayout from '@/Layouts/AuthLayout';
import { useForm } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';

export default function ConfirmPassword() {
    const form = useForm({ password: '' });
    const field = useFormField(form);

    const submit = (event) => {
        event.preventDefault();
        form.post(route('password.confirm'), {
            onFinish: () => form.reset('password'),
        });
    };

    return (
        <AuthLayout
            title="Konfirmasi password"
            eyebrow="Area aman"
            heading="Konfirmasi dulu."
            description="Halaman ini butuh konfirmasi password sebelum kamu melanjutkan."
            aside={{
                title: 'Safe hands.',
                benefits: ['Data pembayaran tidak pernah disimpan di PBS', 'Akses sensitif selalu dikonfirmasi ulang'],
            }}
        >
            <form onSubmit={submit}>
                <Reveal y={24} stagger={0.07} delay={0.1} className="flex flex-col gap-5">
                    <PasswordField
                        id="password"
                        label="Password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        autoFocus
                        {...field('password')}
                    />

                    <Button type="submit" size="lg" icon={ShieldCheck} loading={form.processing} disabled={form.processing} className="w-full">
                        Konfirmasi
                    </Button>
                </Reveal>
            </form>
        </AuthLayout>
    );
}
