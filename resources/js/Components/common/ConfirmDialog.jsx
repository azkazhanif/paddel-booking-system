import Button from '@/Components/common/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';

/**
 * Dialog konfirmasi aksi. children: isi tambahan (mis. field alasan) di antara deskripsi & tombol.
 */
export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Ya, lanjutkan',
    cancelLabel = 'Batal',
    destructive = false,
    processing = false,
    onConfirm,
    children,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-ink-700 text-bone-50">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        onConfirm();
                    }}
                    className="flex flex-col gap-6"
                >
                    <DialogHeader className="text-left">
                        <DialogTitle className="font-display text-2xl font-semibold tracking-tight">{title}</DialogTitle>
                        {description && <DialogDescription className="text-bone-50/60">{description}</DialogDescription>}
                    </DialogHeader>

                    {children}

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={processing}>
                            {cancelLabel}
                        </Button>
                        <Button
                            type="submit"
                            loading={processing}
                            disabled={processing}
                            className={destructive ? 'bg-red-500 text-bone-50 [--fill:var(--color-red-600)]' : undefined}
                        >
                            {confirmLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
