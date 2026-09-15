import Reveal from '@/Components/animation/Reveal';
import Button from '@/Components/common/Button';
import StatusMessage from '@/Components/common/StatusMessage';
import TextLink from '@/Components/common/TextLink';
import TextField from '@/Components/form/TextField';
import { useFormField } from '@/hooks/useFormField';
import AuthLayout from '@/Layouts/AuthLayout';
import { useForm } from '@inertiajs/react';
import { Mail, Send } from 'lucide-react';

export default function ForgotPassword({ status }) {
    const form = useForm({ email: '' });
    const field = useFormField(form);

    const submit = (event) => {
        event.preventDefault();
        form.post(route('password.email'));
    };

    return (
        <AuthLayout
            title="Lupa Password"
            eyebrow="Reset password"
            heading="Lupa password?"
            description="Masukkan email akunmu. Kami akan mengirim link untuk membuat password baru."
            aside={{
                title: 'No stress, reset fast.',
                benefits: ['Link reset dikirim ke email', 'Booking & DP kamu tetap aman', 'Kembali main dalam hitungan menit'],
            }}
            footer={
                <p>
                    Ingat password? <TextLink href={route('login')}>Kembali masuk</TextLink>
                </p>
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
                        autoComplete="email"
                        autoFocus
                        {...field('email')}
                    />
                    <Button type="submit" size="lg" icon={Send} loading={form.processing} disabled={form.processing} className="w-full">
                        Kirim Link Reset
                    </Button>
                </Reveal>
            </form>
        </AuthLayout>
    );
}
