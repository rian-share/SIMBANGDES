import FlashToast from '@/Components/FlashToast';
import { IconButton } from '@/Components/UI/Button';
import { ConfirmProvider } from '@/Components/UI/Modal';
import PageHeader from '@/Components/UI/PageHeader';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity, ChevronDown, ChevronRight, ClipboardCheck, DatabaseBackup, ExternalLink, FileText, FolderKanban, History, LayoutDashboard,
    LogOut, Megaphone, Menu, Newspaper, ScrollText, UserCog, Users, Wallet, X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Menu per role. Item dengan `children` menjadi grup (dropdown bersarang).
const MENU = {
    pemdes: [
        { label: 'Dashboard', route: 'pemdes.dashboard', icon: LayoutDashboard },
        { label: 'Proyek', route: 'pemdes.proyek.index', match: ['pemdes.proyek.*'], icon: FolderKanban },
        {
            label: 'Keuangan',
            icon: Wallet,
            children: [
                { label: 'Anggaran', route: 'pemdes.keuangan.anggaran', match: ['pemdes.keuangan.anggaran', 'pemdes.anggaran.*'] },
                { label: 'Pengeluaran', route: 'pemdes.keuangan.pengeluaran' },
                { label: 'Rencana vs Realisasi', route: 'pemdes.keuangan.rencana-realisasi' },
            ],
        },
        { label: 'Riwayat Proyek', route: 'pemdes.riwayat.index', icon: History },
        { label: 'Monitoring Risiko', route: 'pemdes.monitoring', icon: Activity },
        { label: 'Verifikasi Laporan', route: 'pemdes.laporan.index', icon: ClipboardCheck },
        { label: 'Berita & Pengumuman', route: 'pemdes.berita.index', match: ['pemdes.berita.*'], icon: Newspaper },
        { label: 'Pengaduan', route: 'pemdes.pengaduan.index', match: ['pemdes.pengaduan.*'], icon: Megaphone },
    ],
    pelaksana: [
        { label: 'Dashboard', route: 'pelaksana.dashboard', icon: LayoutDashboard },
        { label: 'Proyek Saya', route: 'pelaksana.proyek.index', match: ['pelaksana.proyek.*', 'pelaksana.laporan.create'], icon: FolderKanban },
        { label: 'Riwayat Laporan', route: 'pelaksana.laporan.index', match: ['pelaksana.laporan.index', 'pelaksana.laporan.edit'], icon: FileText },
    ],
    admin: [
        { label: 'Dashboard', route: 'admin.dashboard', icon: LayoutDashboard },
        { label: 'Manajemen User', route: 'admin.users.index', match: ['admin.users.*'], icon: Users },
        { label: 'Audit Trail', route: 'admin.audit.index', icon: ScrollText },
        { label: 'Backup', route: 'admin.backup.index', icon: DatabaseBackup },
    ],
};
const PROFIL = { label: 'Profil Saya', route: 'profil.edit', icon: UserCog };
const NAMA_ROLE = { admin: 'Admin Sistem', pemdes: 'Pemerintah Desa', pelaksana: 'Pelaksana Proyek' };

const cocok = (item) => (item.match ?? [item.route]).some((m) => route().current(m));

/** Breadcrumb dari struktur menu: [grup?, item]. Halaman di luar menu jatuh ke judul halaman. */
function jejak(menu, judul) {
    for (const item of menu) {
        if (item.children) {
            const anak = item.children.find(cocok);
            if (anak) return [item.label, anak.label];
        } else if (cocok(item)) {
            return [item.label];
        }
    }
    return judul ? [judul] : [];
}

/** hideTitle: halaman yang sudah memakai <PageHeader> sendiri menonaktifkan judul bawaan layout. */
export default function AuthenticatedLayout({ title, hideTitle = false, children }) {
    const { user } = usePage().props.auth;
    const [terbuka, setTerbuka] = useState(false);
    const [grupTerbuka, setGrupTerbuka] = useState({});
    const [menuAvatar, setMenuAvatar] = useState(false);
    const avatarRef = useRef(null);
    const menu = [...(MENU[user.role] ?? []), PROFIL];
    const inisial = user.nama_lengkap.split(' ').map((k) => k[0]).slice(0, 2).join('').toUpperCase();
    const remah = jejak(menu, title);

    // Drawer mobile: tutup dengan Esc & kunci scroll body saat terbuka.
    useEffect(() => {
        if (!terbuka) return undefined;
        const esc = (e) => e.key === 'Escape' && setTerbuka(false);
        document.addEventListener('keydown', esc);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', esc);
            document.body.style.overflow = '';
        };
    }, [terbuka]);

    // Menu avatar: tutup saat klik di luar atau Esc.
    useEffect(() => {
        if (!menuAvatar) return undefined;
        const luar = (e) => avatarRef.current && !avatarRef.current.contains(e.target) && setMenuAvatar(false);
        const esc = (e) => e.key === 'Escape' && setMenuAvatar(false);
        document.addEventListener('mousedown', luar);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('mousedown', luar);
            document.removeEventListener('keydown', esc);
        };
    }, [menuAvatar]);

    const keluar = () => router.post(route('logout'));

    const sidebar = (
        <nav className="flex h-full flex-col bg-white" aria-label="Menu panel">
            <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-200/80 px-5">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-600 text-sm font-semibold text-white">S</span>
                <span className="font-display text-[15px] font-semibold tracking-tight text-slate-900">SIMBANGDES</span>
            </div>

            <ul className="flex-1 space-y-0.5 overflow-y-auto p-3">
                {menu.map((item) => {
                    const { label, route: nama, icon: Ikon, children: anak } = item;

                    if (anak) {
                        const anakAktif = anak.some(cocok);
                        const buka = grupTerbuka[label] ?? anakAktif;
                        const idGrup = `grup-${label.toLowerCase()}`;

                        return (
                            <li key={label}>
                                <button
                                    type="button"
                                    aria-expanded={buka}
                                    aria-controls={idGrup}
                                    onClick={() => setGrupTerbuka({ ...grupTerbuka, [label]: !buka })}
                                    className="relative flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                >
                                    <Ikon className={`h-5 w-5 ${anakAktif ? 'text-slate-900' : 'text-slate-400'}`} aria-hidden="true" />
                                    <span className={`flex-1 text-left ${anakAktif ? 'text-slate-900' : ''}`}>{label}</span>
                                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${buka ? 'rotate-180' : ''}`} aria-hidden="true" />
                                </button>
                                {buka && (
                                    <ul id={idGrup} className="ml-[22px] mt-0.5 space-y-0.5 border-l border-slate-200 pl-3">
                                        {anak.map((a) => {
                                            const aktifAnak = cocok(a);
                                            return (
                                                <li key={a.route}>
                                                    <Link
                                                        href={route(a.route)}
                                                        onClick={() => setTerbuka(false)}
                                                        aria-current={aktifAnak ? 'page' : undefined}
                                                        className={`flex h-8 items-center gap-2 rounded-lg px-2 text-sm transition-colors ${
                                                            aktifAnak ? 'font-medium text-slate-900 before:h-1.5 before:w-1.5 before:rounded-full before:bg-red-600' : 'text-slate-500 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        {a.label}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </li>
                        );
                    }

                    const aktif = cocok(item);
                    return (
                        <li key={nama}>
                            <Link
                                href={route(nama)}
                                onClick={() => setTerbuka(false)}
                                aria-current={aktif ? 'page' : undefined}
                                className={`relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                                    aktif
                                        ? 'bg-slate-100 text-slate-900 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-red-600'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <Ikon className={`h-5 w-5 ${aktif ? 'text-slate-900' : 'text-slate-400'}`} aria-hidden="true" />
                                {label}
                            </Link>
                        </li>
                    );
                })}
            </ul>

            <div className="flex shrink-0 items-center gap-3 border-t border-slate-200/80 p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">{inisial}</span>
                <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-[13px] font-medium text-slate-900">{user.nama_lengkap}</p>
                    <p className="truncate text-xs text-slate-500">{NAMA_ROLE[user.role]}</p>
                </div>
                <IconButton icon={LogOut} label="Keluar" onClick={keluar} />
            </div>
        </nav>
    );

    return (
        <ConfirmProvider>
            <div className="min-h-screen bg-slate-50">
                <Head title={title} />
                <FlashToast />

                <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/80 lg:block">{sidebar}</aside>

                {/* Drawer mobile: selalu dirender agar transisi halus; inert saat tertutup. */}
                <div className={`fixed inset-0 z-40 lg:hidden ${terbuka ? '' : 'pointer-events-none'}`} inert={!terbuka}>
                    <button
                        type="button"
                        aria-label="Tutup menu"
                        tabIndex={-1}
                        onClick={() => setTerbuka(false)}
                        className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-200 ${terbuka ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <aside className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-slate-200/80 shadow-pop transition-transform duration-200 ease-out ${terbuka ? 'translate-x-0' : '-translate-x-full'}`}>
                        {sidebar}
                    </aside>
                </div>

                <div className="lg:pl-64">
                    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md lg:px-8">
                        <IconButton icon={terbuka ? X : Menu} label={terbuka ? 'Tutup menu' : 'Buka menu'} onClick={() => setTerbuka((s) => !s)} className="-ml-2 !h-9 !w-9 lg:hidden" />

                        <nav aria-label="Jejak halaman" className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px]">
                            <span className="hidden text-slate-500 sm:inline">{NAMA_ROLE[user.role]}</span>
                            {remah.map((r, i) => (
                                <span key={r} className="flex min-w-0 items-center gap-1.5">
                                    <ChevronRight className={`h-4 w-4 shrink-0 text-slate-300 ${i === 0 ? 'hidden sm:block' : ''}`} aria-hidden="true" />
                                    <span className={`truncate ${i === remah.length - 1 ? 'font-medium text-slate-900' : 'text-slate-500'}`}>{r}</span>
                                </span>
                            ))}
                        </nav>

                        <Link href={route('beranda')} className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:inline-flex">
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            Portal publik
                        </Link>

                        <div ref={avatarRef} className="relative">
                            <button
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={menuAvatar}
                                aria-label="Menu akun"
                                onClick={() => setMenuAvatar((s) => !s)}
                                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                            >
                                {inisial}
                            </button>
                            {menuAvatar && (
                                <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-pop">
                                    <div className="px-2.5 py-2">
                                        <p className="truncate text-[13px] font-medium text-slate-900">{user.nama_lengkap}</p>
                                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                                    </div>
                                    <div className="my-1 border-t border-slate-100" />
                                    <Link role="menuitem" href={route('profil.edit')} onClick={() => setMenuAvatar(false)} className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-slate-700 hover:bg-slate-50">
                                        <UserCog className="h-4 w-4 text-slate-500" aria-hidden="true" />Profil saya
                                    </Link>
                                    <button type="button" role="menuitem" onClick={keluar} className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-slate-700 hover:bg-slate-50">
                                        <LogOut className="h-4 w-4 text-slate-500" aria-hidden="true" />Keluar
                                    </button>
                                </div>
                            )}
                        </div>
                    </header>

                    <main className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
                        {!hideTitle && title && <PageHeader title={title} />}
                        {children}
                    </main>
                </div>
            </div>
        </ConfirmProvider>
    );
}
