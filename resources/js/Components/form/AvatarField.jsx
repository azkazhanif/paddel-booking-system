import FormField from '@/Components/form/FormField';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';

/**
 * Unggah satu foto profil. current: URL foto yang tersimpan, file: File baru,
 * removed: true bila foto lama ditandai hapus.
 */
export default function AvatarField({ id, label, hint, error, name, current, file, removed = false, onFileChange, onRemovedChange, className }) {
    const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

    useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

    const url = preview ?? (removed ? null : current);

    return (
        <FormField id={id} label={label} hint={hint} error={error} className={className}>
            <div className="flex items-center gap-4">
                <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-ink-800 text-sm font-semibold text-bone-50/50">
                    {url ? <img src={url} alt="" className="size-full object-cover" /> : initials(name)}
                </span>

                <div className="flex flex-wrap gap-2">
                    <label
                        htmlFor={id}
                        className={cn(
                            'inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-ink-700 px-4 text-sm font-medium transition-colors hover:border-court-500',
                            error && 'border-destructive',
                        )}
                    >
                        <ImagePlus aria-hidden className="size-4" />
                        {url ? 'Ganti foto' : 'Unggah foto'}
                        <input
                            id={id}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={(event) => {
                                const [selected] = event.target.files;

                                if (selected) {
                                    onFileChange(selected);
                                    onRemovedChange(false);
                                }

                                event.target.value = '';
                            }}
                        />
                    </label>

                    {url && (
                        <button
                            type="button"
                            onClick={() => {
                                onFileChange(null);
                                onRemovedChange(true);
                            }}
                            className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium text-bone-50/60 transition-colors hover:bg-white/5 hover:text-red-300"
                        >
                            <Trash2 aria-hidden className="size-4" />
                            Hapus
                        </button>
                    )}
                </div>
            </div>
        </FormField>
    );
}
