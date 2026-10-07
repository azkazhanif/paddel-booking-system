import Button from '@/Components/common/Button';
import TextField from '@/Components/form/TextField';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { TicketPercent, X } from 'lucide-react';

/**
 * Pasang / lepas kode voucher pada sebuah booking. Potongan dihitung server,
 * komponen ini hanya mengirim kodenya.
 */
export default function VoucherField({ code, voucher, className }) {
    const apply = useForm({ code: '' });
    const remove = useForm({});

    if (voucher) {
        return (
            <div
                className={cn(
                    'flex flex-wrap items-center justify-between gap-3 rounded-md border border-court-500/30 bg-court-500/10 p-4',
                    className,
                )}
            >
                <p className="flex items-center gap-2 text-sm">
                    <TicketPercent aria-hidden className="size-4 text-court-400" />
                    <span className="font-mono font-semibold">{voucher.code}</span>
                    <span className="text-bone-50/60">· {voucher.label}</span>
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    icon={X}
                    className="text-bone-50/60"
                    loading={remove.processing}
                    disabled={remove.processing}
                    onClick={() => remove.delete(route('booking.voucher.destroy', code), { preserveScroll: true })}
                >
                    Lepas
                </Button>
            </div>
        );
    }

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                apply.post(route('booking.voucher.store', code), { preserveScroll: true, onSuccess: () => apply.reset() });
            }}
            className={cn('flex flex-col gap-2 sm:flex-row sm:items-start', className)}
        >
            <TextField
                id="voucher_code"
                label="Punya kode voucher?"
                placeholder="MISALNYA PBS20"
                icon={TicketPercent}
                autoComplete="off"
                inputClassName="uppercase"
                className="flex-1"
                value={apply.data.code}
                error={apply.errors.code}
                onChange={(event) => {
                    apply.setData('code', event.target.value);
                    if (apply.errors.code) apply.clearErrors('code');
                }}
            />
            <Button
                type="submit"
                variant="outline"
                loading={apply.processing}
                disabled={apply.processing || !apply.data.code}
                className="shrink-0 sm:mt-8"
            >
                Pakai
            </Button>
        </form>
    );
}
