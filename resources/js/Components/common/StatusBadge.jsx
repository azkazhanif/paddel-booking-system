import { cn } from '@/lib/utils';

const TONES = {
    green: 'bg-court-500/15 text-court-400',
    lime: 'bg-lime-300/15 text-lime-300',
    amber: 'bg-amber-400/15 text-amber-300',
    red: 'bg-red-500/15 text-red-300',
    blue: 'bg-sky-400/15 text-sky-300',
    muted: 'bg-white/8 text-bone-50/60',
};

/**
 * Label & warna per enum. Kunci sama dengan nilai enum di app/Enums.
 */
export const STATUS_MAP = {
    booking: {
        pending: ['Menunggu bayar', 'amber'],
        confirmed: ['Terkonfirmasi', 'blue'],
        checked_in: ['Check-in', 'green'],
        completed: ['Selesai', 'muted'],
        cancelled: ['Dibatalkan', 'red'],
        expired: ['Kedaluwarsa', 'muted'],
        no_show: ['No-show', 'red'],
    },
    payment: {
        unpaid: ['Belum dibayar', 'amber'],
        dp_paid: ['DP', 'lime'],
        paid: ['Lunas', 'green'],
        refunded: ['Refund', 'muted'],
        partially_refunded: ['Refund sebagian', 'muted'],
    },
    transaction: {
        pending: ['Pending', 'amber'],
        settlement: ['Settlement', 'green'],
        expired: ['Expired', 'muted'],
        failed: ['Gagal', 'red'],
        refunded: ['Refund', 'muted'],
    },
    customerType: {
        guest: ['Guest', 'muted'],
        member: ['Member', 'green'],
    },
    source: {
        online: ['Online', 'muted'],
        walk_in: ['Walk-in', 'blue'],
    },
    role: {
        owner: ['Owner', 'lime'],
        admin: ['Admin', 'green'],
        staff: ['Staff', 'blue'],
        customer: ['Customer', 'muted'],
    },
    account: {
        active: ['Aktif', 'green'],
        blocked: ['Nonaktif', 'red'],
    },
    court: {
        active: ['Aktif', 'green'],
        inactive: ['Nonaktif', 'muted'],
    },
};

export function statusLabel(type, value) {
    return STATUS_MAP[type]?.[value]?.[0] ?? value;
}

/**
 * Badge status enum. type: kunci STATUS_MAP (booking, payment, transaction, customerType, source, role, account, court).
 */
export default function StatusBadge({ type, value, className }) {
    const [label, tone] = STATUS_MAP[type]?.[value] ?? [value, 'muted'];

    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap', TONES[tone], className)}>
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {label}
        </span>
    );
}
