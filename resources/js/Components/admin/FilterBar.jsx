import { Input } from '@/Components/ui/input';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';

/**
 * Baris filter di atas tabel: pencarian di kiri, filter tambahan (children) di kanan, dan tombol reset.
 */
export default function FilterBar({ search, onSearchChange, searchPlaceholder = 'Cari…', onReset, showReset = false, className, children }) {
    return (
        <div className={cn('flex flex-col gap-3 lg:flex-row lg:items-center', className)}>
            {onSearchChange && (
                <div className="relative lg:w-72 lg:shrink-0">
                    <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-bone-50/40" />
                    <Input
                        type="search"
                        value={search ?? ''}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder={searchPlaceholder}
                        aria-label={searchPlaceholder}
                        className="h-10 pl-10 text-sm"
                    />
                </div>
            )}
            <div className="grid flex-1 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">{children}</div>
            {showReset && (
                <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex h-10 items-center justify-center gap-1.5 self-start rounded-full px-4 text-sm font-medium text-bone-50/60 transition-colors hover:bg-white/5 hover:text-bone-50"
                >
                    <X className="size-4" />
                    Reset
                </button>
            )}
        </div>
    );
}
