import { cn } from '@/lib/utils';
import { ExternalLink, FlaskConical } from 'lucide-react';

const SIMULATOR_URL = 'https://simulator.sandbox.midtrans.com';

const TEST_METHODS = [
    ['Kartu kredit', '4811 1111 1111 1114 · CVV 123 · kedaluwarsa bulan/tahun apa saja di masa depan · OTP 112233'],
    ['QRIS / GoPay / ShopeePay', 'Salin URL gambar QR dari Midtrans, lalu tempel di Simulator (menu QRIS).'],
    ['Virtual account', 'Salin nomor VA, lalu bayar di Simulator sesuai bank yang dipilih.'],
];

/**
 * Catatan mode demo: muncul hanya saat Midtrans memakai sandbox (snap.isProduction false).
 */
export default function SandboxNotice({ snap, className }) {
    if (!snap?.enabled || snap.isProduction) return null;

    return (
        <div role="note" className={cn('rounded-md border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100', className)}>
            <p className="flex items-start gap-3 font-medium text-amber-200">
                <FlaskConical aria-hidden className="mt-0.5 size-4 shrink-0" />
                Mode demo — pembayaran memakai Midtrans Sandbox, tidak ada uang sungguhan yang ditarik.
            </p>

            <dl className="mt-3 flex flex-col gap-2 pl-7 text-xs">
                {TEST_METHODS.map(([method, howTo]) => (
                    <div key={method}>
                        <dt className="font-semibold text-amber-200">{method}</dt>
                        <dd className="text-amber-100/70">{howTo}</dd>
                    </div>
                ))}
            </dl>

            <a
                href={SIMULATOR_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-3 ml-7 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200 underline-offset-4 hover:underline"
            >
                Buka Midtrans Simulator
                <ExternalLink aria-hidden className="size-3.5" />
            </a>
        </div>
    );
}
