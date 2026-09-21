import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}>
            <span className="grid size-12 place-items-center rounded-full bg-white/5 text-bone-50/40">
                <Icon aria-hidden className="size-5" />
            </span>
            <div>
                <p className="font-semibold">{title}</p>
                {description && <p className="mt-1 max-w-sm text-sm text-bone-50/50">{description}</p>}
            </div>
            {action}
        </div>
    );
}
