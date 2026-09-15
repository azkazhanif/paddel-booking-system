import { cn } from '@/lib/utils';
import { CircleAlert, CircleCheck } from 'lucide-react';

const TONES = {
    success: { icon: CircleCheck, className: 'border-court-500/30 bg-court-500/10 text-court-400' },
    error: { icon: CircleAlert, className: 'border-destructive/30 bg-destructive/10 text-red-300' },
};

export default function StatusMessage({ tone = 'success', className, children }) {
    if (!children) return null;

    const { icon: Icon, className: toneClassName } = TONES[tone];

    return (
        <div role="status" className={cn('flex items-start gap-3 rounded-md border p-4 text-sm', toneClassName, className)}>
            <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
            <p>{children}</p>
        </div>
    );
}
