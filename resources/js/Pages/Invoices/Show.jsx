import Button from '@/Components/common/Button';
import Eyebrow from '@/Components/common/Eyebrow';
import InvoiceView from '@/Components/invoice/InvoiceView';
import AppLayout from '@/Layouts/AppLayout';
import { safeRoute } from '@/lib/utils';
import { Download } from 'lucide-react';

export default function InvoiceShow({ invoice, booking, payments, venue }) {
    return (
        <AppLayout title={`Invoice ${invoice.number}`} back={{ href: safeRoute('my-bookings.index', safeRoute('home', '/')), label: 'Booking saya' }}>
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Eyebrow className="text-court-500">Invoice</Eyebrow>
                        <h1 className="mt-3 font-display text-3xl leading-none font-semibold tracking-tight md:text-4xl">Rincian tagihan</h1>
                    </div>
                    <Button href={invoice.pdf_url} variant="outline" icon={Download} className="shrink-0">
                        Unduh PDF
                    </Button>
                </header>

                <InvoiceView invoice={invoice} booking={booking} payments={payments} venue={venue} />
            </div>
        </AppLayout>
    );
}
