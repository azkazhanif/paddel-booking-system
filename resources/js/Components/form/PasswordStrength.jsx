import { cn } from '@/lib/utils';

const LEVELS = [
    { label: 'Terlalu lemah', className: 'bg-destructive' },
    { label: 'Lemah', className: 'bg-orange-400' },
    { label: 'Cukup', className: 'bg-lime-300' },
    { label: 'Kuat', className: 'bg-court-500' },
];

export function scorePassword(password) {
    if (!password) return 0;

    return [password.length >= 8, /[A-Z]/.test(password) && /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password) || password.length >= 12].filter(Boolean)
        .length;
}

export default function PasswordStrength({ password }) {
    const score = scorePassword(password);
    const level = LEVELS[Math.max(0, score - 1)];

    if (!password) return null;

    return (
        <div className="flex items-center gap-3" aria-live="polite">
            <div className="grid flex-1 grid-cols-4 gap-1.5">
                {LEVELS.map((_, index) => (
                    <span
                        key={index}
                        className={cn('h-1 rounded-full transition-colors duration-300', index < score ? level.className : 'bg-white/10')}
                    />
                ))}
            </div>
            <span className="w-24 text-right text-xs text-bone-50/60">{level.label}</span>
        </div>
    );
}
