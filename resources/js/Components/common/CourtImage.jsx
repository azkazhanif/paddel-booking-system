import CourtVisual from '@/Components/common/CourtVisual';
import { cn } from '@/lib/utils';

/**
 * Foto lapangan dengan fallback ilustrasi bila foto belum diunggah admin.
 */
export default function CourtImage({ src, alt, className, imageClassName }) {
    return (
        <div className={cn('relative overflow-hidden rounded-md bg-court-900', className)}>
            {src ? (
                <img src={src} alt={alt} loading="lazy" className={cn('size-full object-cover', imageClassName)} />
            ) : (
                <div className={cn('court-stripes grid size-full place-items-center bg-linear-to-br from-court-700 to-court-900 p-8', imageClassName)}>
                    <CourtVisual className="max-w-[80%] text-bone-50/40" />
                </div>
            )}
        </div>
    );
}
