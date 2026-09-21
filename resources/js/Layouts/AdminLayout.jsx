import AdminNav from '@/Components/admin/AdminNav';
import AdminUserMenu from '@/Components/admin/AdminUserMenu';
import FlashToast from '@/Components/common/FlashToast';
import Logo from '@/Components/common/Logo';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/Components/ui/sheet';
import { Head, Link, router } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Layout panel owner/admin: sidebar tetap di desktop, sheet menu di mobile. Tanpa animasi scroll.
 */
export default function AdminLayout({ title, children }) {
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => router.on('navigate', () => setMenuOpen(false)), []);

    return (
        <div className="min-h-svh bg-ink-950 font-sans text-bone-50">
            <Head title={title ? `${title} · Admin` : 'Admin'} />

            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ink-800 bg-ink-900 lg:flex">
                <div className="flex h-16 items-center px-6">
                    <Link href={route('admin.dashboard')} aria-label="PBS Admin — Dashboard" className="flex items-center gap-2">
                        <Logo className="text-lg" />
                        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-bone-50/60 uppercase">Admin</span>
                    </Link>
                </div>
                <AdminNav className="flex-1 overflow-y-auto px-3 py-4" />
                <div className="border-t border-ink-800 p-3">
                    <AdminUserMenu />
                </div>
            </aside>

            <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-800 bg-ink-950/85 px-4 backdrop-blur-md lg:hidden">
                <Link href={route('admin.dashboard')} aria-label="PBS Admin — Dashboard">
                    <Logo className="text-lg" />
                </Link>
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                    <SheetTrigger className="grid size-10 place-items-center rounded-full text-bone-50/70 hover:bg-white/5 hover:text-bone-50" aria-label="Buka menu">
                        <Menu className="size-5" />
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 gap-0 border-ink-800 bg-ink-900 p-0 text-bone-50">
                        <SheetTitle className="flex h-14 items-center px-5">
                            <Logo className="text-lg" />
                        </SheetTitle>
                        <SheetDescription className="sr-only">Navigasi panel admin</SheetDescription>
                        <AdminNav className="flex-1 overflow-y-auto px-3 py-4" onNavigate={() => setMenuOpen(false)} />
                        <div className="border-t border-ink-800 p-3">
                            <AdminUserMenu />
                        </div>
                    </SheetContent>
                </Sheet>
            </header>

            <main className="lg:pl-64">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">{children}</div>
            </main>

            <FlashToast />
        </div>
    );
}
