import Button from '@/Components/common/Button';
import Eyebrow from '@/Components/common/Eyebrow';
import Panel from '@/Components/common/Panel';
import StatusMessage from '@/Components/common/StatusMessage';
import TextField from '@/Components/form/TextField';
import { useFormField } from '@/hooks/useFormField';
import AppLayout from '@/Layouts/AppLayout';
import { safeRoute } from '@/lib/utils';
import { useForm, usePage } from '@inertiajs/react';
import { Mail, Search, Ticket } from 'lucide-react';

export default function BookingLookup({ status }) {
    const { flash } = usePage().props;
    const form = useForm({ code: '', email: '' });
    const field = useFormField(form);

    const submit = (event) => {
        event.preventDefault();
        form.post(route('booking.lookup.send'), { preserveScroll: true, onSuccess: () => form.reset() });
    };

    return (
        <AppLayout title="Cek booking" back={{ href: safeRoute('home', '/'), label: 'Beranda' }}>
            <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
                <header>
                    <Eyebrow className="text-court-500">Cek booking</Eyebrow>
                    <h1 className="mt-3 font-display text-4xl leading-none font-semibold tracking-tight md:text-5xl">Kehilangan linknya?</h1>
                    <p className="mt-3 text-sm text-bone-50/55">
                        Masukkan kode booking dan email yang dipakai saat memesan. Kami kirim ulang link aksesnya ke email tersebut.
                    </p>
                </header>

                {(status || flash?.status) && <StatusMessage tone="success">{status ?? flash.status}</StatusMessage>}

                <Panel>
                    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
                        <TextField
                            id="code"
                            label="Kode booking"
                            placeholder="PBS-XXXXXX"
                            icon={Ticket}
                            autoComplete="off"
                            inputClassName="font-mono uppercase"
                            {...field('code')}
                        />
                        <TextField
                            id="email"
                            label="Email pemesan"
                            type="email"
                            placeholder="nama@email.com"
                            icon={Mail}
                            autoComplete="email"
                            {...field('email')}
                        />

                        <Button type="submit" icon={Search} loading={form.processing} disabled={form.processing} className="w-full">
                            Kirim link booking
                        </Button>
                    </form>
                </Panel>

                <p className="text-center text-xs text-bone-50/40">
                    Demi keamanan, detail booking tidak ditampilkan di halaman ini — hanya dikirim ke email yang terdaftar pada booking.
                </p>
            </div>
        </AppLayout>
    );
}
