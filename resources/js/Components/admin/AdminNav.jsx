import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    CalendarClock,
    CalendarDays,
    CreditCard,
    FileText,
    LayoutDashboard,
    LayoutGrid,
    ReceiptText,
    ScrollText,
    Settings,
    TicketPercent,
    UserCog,
    Users,
    WalletCards,
} from 'lucide-react';

/**
 * Menu panel admin. route: nama route index, match: pola route().current untuk status aktif.
 * owner: true → hanya tampil untuk owner. Route yang belum dibuat tampil nonaktif dengan label "Segera".
 */
export const ADMIN_NAV = [
    {
        label: 'Ringkasan',
        items: [{ label: 'Dashboard', icon: LayoutDashboard, route: 'admin.dashboard', match: 'admin.dashboard' }],
    },
    {
        label: 'Operasional',
        items: [
            { label: 'Booking', icon: CalendarClock, route: 'admin.bookings.index', match: 'admin.bookings.*' },
            { label: 'Jadwal', icon: CalendarDays, route: 'admin.schedule.index', match: 'admin.schedule.*' },
            { label: 'Lapangan', icon: LayoutGrid, route: 'admin.courts.index', match: 'admin.courts.*' },
            { label: 'Customer', icon: Users, route: 'admin.customers.index', match: 'admin.customers.*' },
            { label: 'Voucher', icon: TicketPercent, route: 'admin.vouchers.index', match: 'admin.vouchers.*' },
        ],
    },
    {
        label: 'Keuangan',
        items: [
            { label: 'Pembayaran', icon: CreditCard, route: 'admin.payments.index', match: 'admin.payments.*' },
            { label: 'Sisa Tagihan', icon: WalletCards, route: 'admin.receivables.index', match: 'admin.receivables.*' },
            { label: 'Invoice', icon: ReceiptText, route: 'admin.invoices.index', match: 'admin.invoices.*' },
            { label: 'Laporan', icon: BarChart3, route: 'admin.reports.index', match: 'admin.reports.*', owner: true },
        ],
    },
    {
        label: 'Sistem',
        owner: true,
        items: [
            { label: 'Kelola User', icon: UserCog, route: 'admin.users.index', match: 'admin.users.*', owner: true },
            { label: 'Log Aktivitas', icon: ScrollText, route: 'admin.activity.index', match: 'admin.activity.*', owner: true },
            { label: 'Pengaturan', icon: Settings, route: 'admin.settings.edit', match: 'admin.settings.*', owner: true },
        ],
    },
];

export default function AdminNav({ onNavigate, className }) {
    const { auth } = usePage().props;
    const isOwner = auth.can?.viewFinance;

    return (
        <nav aria-label="Menu admin" className={cn('flex flex-col gap-6', className)}>
            {ADMIN_NAV.filter((group) => !group.owner || isOwner).map((group) => (
                <div key={group.label}>
                    <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.18em] text-bone-50/35 uppercase">{group.label}</p>
                    <ul className="flex flex-col gap-0.5">
                        {group.items
                            .filter((item) => !item.owner || isOwner)
                            .map((item) => (
                                <li key={item.route}>
                                    <NavItem item={item} onNavigate={onNavigate} />
                                </li>
                            ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
}

function NavItem({ item, onNavigate }) {
    const Icon = item.icon;
    const available = route().has(item.route);
    const active = available && route().current(item.match);

    const classes = cn(
        'flex h-10 items-center gap-3 rounded-full px-3 text-sm font-medium transition-colors',
        active ? 'bg-court-500 text-ink-950' : 'text-bone-50/70 hover:bg-white/5 hover:text-bone-50',
        !available && 'pointer-events-none text-bone-50/30',
    );

    if (!available) {
        return (
            <span className={classes} aria-disabled="true">
                <Icon aria-hidden className="size-4" />
                {item.label}
                <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[10px] tracking-wide uppercase">Segera</span>
            </span>
        );
    }

    return (
        <Link href={route(item.route)} className={classes} aria-current={active ? 'page' : undefined} onClick={onNavigate}>
            <Icon aria-hidden className="size-4" />
            {item.label}
        </Link>
    );
}
