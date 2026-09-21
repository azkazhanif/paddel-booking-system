import FormField from '@/Components/form/FormField';
import { cn } from '@/lib/utils';
import { ImagePlus, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';

/**
 * Unggah banyak gambar. existing: [{ id, url }] dari server, removed: id yang ditandai hapus, files: File baru.
 */
export default function ImageUploadField({ id, label, hint, error, existing = [], removed = [], files = [], onRemovedChange, onFilesChange, max = 8, className }) {
    const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

    useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

    const kept = existing.filter((image) => !removed.includes(image.id));
    const remaining = max - kept.length - files.length;

    return (
        <FormField id={id} label={label} hint={hint} error={error} className={className}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {kept.map((image) => (
                    <Thumb key={image.id} url={image.url} onRemove={() => onRemovedChange([...removed, image.id])} />
                ))}
                {previews.map((preview, index) => (
                    <Thumb key={preview.url} url={preview.url} isNew onRemove={() => onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))} />
                ))}
                {remaining > 0 && (
                    <label
                        htmlFor={id}
                        className={cn(
                            'flex aspect-4/3 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-ink-700 bg-ink-900 text-sm text-bone-50/50 transition-colors hover:border-court-500/60 hover:text-bone-50',
                            error && 'border-destructive',
                        )}
                    >
                        <ImagePlus className="size-5" />
                        Tambah foto
                        <input
                            id={id}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="sr-only"
                            onChange={(event) => {
                                onFilesChange([...files, ...Array.from(event.target.files).slice(0, remaining)]);
                                event.target.value = '';
                            }}
                        />
                    </label>
                )}
            </div>
        </FormField>
    );
}

function Thumb({ url, isNew = false, onRemove }) {
    return (
        <div className="group relative aspect-4/3 overflow-hidden rounded-md bg-ink-800">
            <img src={url} alt="" className="size-full object-cover" />
            {isNew && <span className="absolute bottom-2 left-2 rounded-full bg-court-500 px-2 py-0.5 text-[10px] font-bold text-ink-950 uppercase">Baru</span>}
            <button
                type="button"
                onClick={onRemove}
                className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-ink-950/80 text-bone-50 opacity-100 backdrop-blur transition-opacity hover:bg-red-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                aria-label="Hapus foto"
            >
                <X className="size-3.5" />
            </button>
        </div>
    );
}
