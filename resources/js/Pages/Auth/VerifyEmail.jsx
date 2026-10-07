import Reveal from '@/Components/animation/Reveal';
import MemberHighlight from '@/Components/auth/MemberHighlight';
import Button from '@/Components/common/Button';
import StatusMessage from '@/Components/common/StatusMessage';
import TextLink from '@/Components/common/TextLink';
import AuthLayout from '@/Layouts/AuthLayout';
import { safeRoute } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { Send } from 'lucide-react';

export default function VerifyEmail({ status }) {
    const form = useForm({});

    const resend = (event) => {
        event.preventDefault();
        form.post(route('verification.send'));
    };

    return (
        <AuthLayout
            title="Verifikasi email"
            eyebrow="Satu langkah lagi"
            heading="Cek inbox kamu."
            description="Kami mengirim link verifikasi ke emailmu. Klik link itu untuk mengaktifkan akun — setelah terverifikasi kamu bisa bayar DP 30%."
            aside={{
                title: 'Almost there.',
                benefits: ['Bayar DP 30% untuk booking member', 'Riwayat & invoice tersimpan', 'Pengingat jadwal otomatis'],
                highlight: <MemberHighlight />,
            }}
            footer={
                <p>
                    Salah alamat email? <TextLink href={route('profile.edit')}>Ubah di profil</TextLink>, atau{' '}
                    <Link href={route('logout')} method="post" as="button" className="font-semibold text-bone-50 underline-offset-4 hover:underline">
                        keluar
                    </Link>
                    .
                </p>
            }
        >
            {status === 'verification-link-sent' && (
                <StatusMessage className="mb-6">Link verifikasi baru sudah dikirim. Cek inbox (dan folder spam) emailmu.</StatusMessage>
            )}

            <form onSubmit={resend}>
                <Reveal y={24} stagger={0.07} delay={0.1} className="flex flex-col gap-5">
                    <p className="text-sm text-bone-50/55">
                        Belum menerima emailnya? Tunggu sebentar, lalu kirim ulang. Sementara itu kamu tetap bisa booking dengan bayar penuh.
                    </p>

                    <Button type="submit" size="lg" icon={Send} loading={form.processing} disabled={form.processing} className="w-full">
                        Kirim ulang link verifikasi
                    </Button>

                    <Button href={safeRoute('booking.create')} variant="outline" size="lg" className="w-full">
                        Lanjut booking dulu
                    </Button>
                </Reveal>
            </form>
        </AuthLayout>
    );
}
