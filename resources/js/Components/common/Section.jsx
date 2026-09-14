import { cn } from '@/lib/utils';

export const TONES = {
    dark: { bg: '#050605', className: 'bg-ink-950 text-bone-50' },
    ink: { bg: '#0b0d0b', className: 'bg-ink-900 text-bone-50' },
    forest: { bg: '#0a2e1f', className: 'bg-court-900 text-bone-50' },
    green: { bg: '#1ed760', className: 'bg-court-500 text-ink-950' },
    bone: { bg: '#f4f6f2', className: 'bg-bone-50 text-ink-950' },
};

/**
 * Section dengan tone warna. Saat scroll, PageBackground menganimasikan warna latar ke tone section aktif.
 * solid: section tipis (mis. marquee) yang selalu memakai warnanya sendiri dan tidak memicu transisi.
 */
export default function Section({ as: Tag = 'section', id, tone = 'dark', solid = false, className, children, ...props }) {
    const toneConfig = TONES[tone] ?? TONES.dark;

    return (
        <Tag
            id={id}
            data-tone={tone}
            data-bg={solid ? undefined : toneConfig.bg}
            className={cn('relative scroll-mt-16 py-24 md:py-32', toneConfig.className, className)}
            {...props}
        >
            {children}
        </Tag>
    );
}
