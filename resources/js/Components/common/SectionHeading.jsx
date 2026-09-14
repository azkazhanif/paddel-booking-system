import Reveal from '@/Components/animation/Reveal';
import SplitHeading from '@/Components/animation/SplitHeading';
import Eyebrow from '@/Components/common/Eyebrow';
import { cn } from '@/lib/utils';

export default function SectionHeading({ eyebrow, title, description, action, align = 'left', className, titleClassName }) {
    return (
        <div
            className={cn(
                'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
                align === 'center' && 'items-center text-center md:flex-col md:items-center',
                className,
            )}
        >
            <div className={cn('max-w-3xl', align === 'center' && 'mx-auto')}>
                {eyebrow && (
                    <Reveal y={16}>
                        <Eyebrow className={cn('mb-5 opacity-70', align === 'center' && 'justify-center')}>{eyebrow}</Eyebrow>
                    </Reveal>
                )}
                <SplitHeading className={cn('text-[clamp(2.5rem,6vw,5.5rem)] uppercase', titleClassName, 'leading-[0.92]')}>
                    {title}
                </SplitHeading>
            </div>
            {(description || action) && (
                <Reveal y={24} delay={0.2} className={cn('flex max-w-sm flex-col gap-5', align === 'center' && 'items-center')}>
                    {description && <p className="text-base leading-relaxed opacity-70 md:text-lg">{description}</p>}
                    {action && <div>{action}</div>}
                </Reveal>
            )}
        </div>
    );
}
