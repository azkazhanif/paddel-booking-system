import { usePage } from '@inertiajs/react';

export default function MemberHighlight() {
    const { dpPercentage } = usePage().props;

    return (
        <>
            <div>
                <p className="text-xs font-bold tracking-[0.2em] text-court-500 uppercase">Eksklusif member</p>
                <p className="mt-1 text-bone-50/70">Amankan slot favorit cukup bayar DP.</p>
            </div>
            <p className="font-display text-6xl leading-none font-semibold tracking-tighter">
                {dpPercentage}
                <span className="text-court-500">%</span>
            </p>
        </>
    );
}
