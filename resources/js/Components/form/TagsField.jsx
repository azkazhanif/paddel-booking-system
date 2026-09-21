import FormField from '@/Components/form/FormField';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Input daftar teks (mis. fasilitas). Enter/koma menambah chip; saran bisa diklik untuk menambah cepat.
 */
export default function TagsField({ id, label, hint, error, value = [], onChange, suggestions = [], placeholder, max = 12, className }) {
    const [draft, setDraft] = useState('');

    const add = (tag) => {
        const clean = tag.trim();

        if (!clean || value.includes(clean) || value.length >= max) return;

        onChange([...value, clean]);
        setDraft('');
    };

    const remove = (tag) => onChange(value.filter((item) => item !== tag));
    const available = suggestions.filter((item) => !value.includes(item));

    return (
        <FormField id={id} label={label} hint={hint} error={error} className={className}>
            <div
                className={cn(
                    'flex min-h-12 flex-wrap items-center gap-2 rounded-md border border-input bg-ink-900 px-3 py-2 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25',
                    error && 'border-destructive',
                )}
            >
                {value.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-white/10 py-1 pr-1 pl-3 text-sm">
                        {tag}
                        <button
                            type="button"
                            onClick={() => remove(tag)}
                            className="grid size-5 place-items-center rounded-full text-bone-50/60 hover:bg-white/15 hover:text-bone-50"
                            aria-label={`Hapus ${tag}`}
                        >
                            <X className="size-3" />
                        </button>
                    </span>
                ))}
                <input
                    id={id}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ',') {
                            event.preventDefault();
                            add(draft);
                        }

                        if (event.key === 'Backspace' && !draft && value.length) {
                            remove(value[value.length - 1]);
                        }
                    }}
                    onBlur={() => add(draft)}
                    placeholder={value.length ? '' : placeholder}
                    className="h-8 min-w-32 flex-1 border-0 bg-transparent p-0 text-base outline-none placeholder:text-muted-foreground/70 focus:ring-0"
                />
            </div>
            {available.length > 0 && value.length < max && (
                <div className="flex flex-wrap gap-1.5">
                    {available.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => add(item)}
                            className="inline-flex items-center gap-1 rounded-full border border-ink-700 px-2.5 py-1 text-xs text-bone-50/60 transition-colors hover:border-court-500/50 hover:text-bone-50"
                        >
                            <Plus className="size-3" />
                            {item}
                        </button>
                    ))}
                </div>
            )}
        </FormField>
    );
}
