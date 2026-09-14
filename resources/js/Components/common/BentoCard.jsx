import { cn } from '@/lib/utils';

const MD_SPAN = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
    5: 'md:col-span-5',
    6: 'md:col-span-6',
};

const LG_SPAN = {
    2: 'lg:col-span-2',
    3: 'lg:col-span-3',
    4: 'lg:col-span-4',
    5: 'lg:col-span-5',
    6: 'lg:col-span-6',
    7: 'lg:col-span-7',
    8: 'lg:col-span-8',
    9: 'lg:col-span-9',
    12: 'lg:col-span-12',
};

const ROW_SPAN = {
    1: 'md:row-span-1',
    2: 'md:row-span-2',
    3: 'md:row-span-3',
};

const TONES = {
    ink: 'bg-ink-800 text-bone-50 border border-ink-700',
    dark: 'bg-ink-950 text-bone-50',
    green: 'bg-court-500 text-ink-950',
    lime: 'bg-lime-300 text-ink-950',
    forest: 'bg-court-900 text-bone-50',
    bone: 'bg-bone-50 text-ink-950',
    outline: 'border border-current/15 bg-transparent',
};

/**
 * Cell bento. colSpan: { md: 1-6, lg: 2-12 }, rowSpan: 1-3. Di mobile selalu 1 kolom.
 */
export default function BentoCard({
    as: Tag = 'div',
    colSpan = { md: 3, lg: 4 },
    rowSpan = 1,
    tone = 'ink',
    className,
    children,
    ...props
}) {
    return (
        <Tag
            data-bento
            className={cn(
                'relative flex flex-col overflow-hidden rounded-md p-6 md:p-8',
                MD_SPAN[colSpan.md],
                LG_SPAN[colSpan.lg],
                ROW_SPAN[rowSpan],
                TONES[tone],
                className,
            )}
            {...props}
        >
            {children}
        </Tag>
    );
}
