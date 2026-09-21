import StatusBadge from '@/Components/common/StatusBadge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { ChevronsUpDown, ExternalLink, LogOut } from 'lucide-react';

export default function AdminUserMenu({ className }) {
    const { user } = usePage().props.auth;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    'flex w-full items-center gap-3 rounded-full p-1.5 pr-3 text-left transition-colors outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-court-500',
                    className,
                )}
            >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-court-900 text-xs font-bold text-court-400">{initials(user.name)}</span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{user.name}</span>
                    <span className="block truncate text-xs text-bone-50/50">{user.email}</span>
                </span>
                <ChevronsUpDown aria-hidden className="size-4 text-bone-50/40" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-60 border-ink-700 bg-ink-800 text-bone-50">
                <DropdownMenuLabel className="flex items-center justify-between gap-2 font-normal">
                    <span className="text-xs text-bone-50/50">Masuk sebagai</span>
                    <StatusBadge type="role" value={user.role} />
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-ink-700" />
                <DropdownMenuItem asChild>
                    <Link href={route('home')}>
                        <ExternalLink />
                        Lihat situs
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild variant="destructive">
                    <Link href={route('logout')} method="post" as="button" className="w-full">
                        <LogOut />
                        Keluar
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
