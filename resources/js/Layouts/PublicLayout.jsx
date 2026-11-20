import FlashToast from '@/Components/FlashToast';
import Button, { IconButton } from '@/Components/UI/Button';
import { ConfirmProvider } from '@/Components/UI/Modal';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, BarChart3, ChevronDown, FolderKanban, Images, LogIn, Map, Megaphone, Menu, Wallet, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Menu bergrup: tingkat atas ringkas agar muat di 1024–1280px; grup berupa dropdown (desktop) atau seksi (seluler).
const MENU = [
    { label: 'Beranda', rute: 'beranda' },
    {
        label: 'Proyek',
        anak: [
            { label: 'Katalog Proyek', deskripsi: 'Daftar proyek pembangunan desa', rute: 'proyek.publik', aktif: 'proyek.publik*', ikon: FolderKanban },
            { label: 'Peta Pembangunan', deskripsi: 'Sebaran lokasi proyek', rute: 'peta', ikon: Map },
            { label: 'Galeri & Dokumentasi', deskripsi: 'Foto kemajuan di lapangan', rute: 'galeri', ikon: Images },
        ],
    },
    {
        label: 'Transparansi',
        anak: [
            { label: 'Transparansi Anggaran', deskripsi: 'Pagu dan serapan anggaran', rute: 'transparansi', ikon: Wallet },
            { label: 'Statistik Pembangunan', deskripsi: 'Ringkasan capaian pembangunan', rute: 'statistik', ikon: BarChart3 },
        ],
    },
    { label: 'Berita & Pengumuman', rute: 'berita.*', href: 'berita.index' },
    { label: 'Cek Tiket', rute: 'pengaduan.cek' },
];

const aktifItem = (m) => (m.anak ? m.anak.some(aktifItem) : route().current(m.aktif ?? m.rute));
const tujuan = (m) => route(m.href ?? m.rute);
const semuaTautan = MENU.flatMap((m) => m.anak ?? [m]);

export default function PublicLayout({ title, children }) {
    const { user } = usePage().props.auth;
    const [terbuka, setTerbuka] = useState(false);
    const [bukaGrup, setBukaGrup] = useState(null);
    const navRef = useRef(null);
    const urlMasuk = user ? route(`${user.role}.dashboard`) : route('login');
    const labelMasuk = user ? 'Ke panel' : 'Masuk';

    // Tutup menu saat navigasi, Esc, atau klik di luar dropdown; kunci scroll saat slide-over terbuka.
    useEffect(() => {
        const tutupSemua = () => { setTerbuka(false); setBukaGrup(null); };
        const esc = (e) => e.key === 'Escape' && tutupSemua();
        const luar = (e) => navRef.current && !navRef.current.contains(e.target) && setBukaGrup(null);
        document.addEventListener('keydown', esc);
        document.addEventListener('mousedown', luar);
        const lepas = router.on('navigate', tutupSemua);
        return () => {
            document.removeEventListener('keydown', esc);
            document.removeEventListener('mousedown', luar);
            lepas();
        };
    }, []);

    useEffect(() => {
        document.body.style.overflow = terbuka ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [terbuka]);

    const garisAktif = <span className="absolute inset-x-3 -bottom-[11px] h-0.5 rounded-full bg-red-600" aria-hidden="true" />;

    return (
        <ConfirmProvider>
            <div className="flex min-h-screen flex-col bg-slate-50">
                <Head title={title} />
                <FlashToast />

                <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/70 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
                        <Link href={route('beranda')} className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-600 text-sm font-semibold text-white">S</span>
                            <span className="font-display text-base font-semibold tracking-tight text-slate-900">SIMBANGDES</span>
                        </Link>

                        <nav ref={navRef} className="hidden items-center gap-0.5 text-sm font-medium lg:flex" aria-label="Menu utama">
                            {MENU.map((m) => {
                                const aktif = aktifItem(m);
                                const warna = aktif ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900';

                                if (!m.anak) {
                                    return (
                                        <Link key={m.label} href={tujuan(m)} aria-current={aktif ? 'page' : undefined} className={`relative rounded-lg px-3 py-2 transition-colors ${warna}`}>
                                            {m.label}
                                            {aktif && garisAktif}
                                        </Link>
                                    );
                                }

                                const buka = bukaGrup === m.label;
                                return (
                                    <div key={m.label} className="relative">
                                        <button
                                            type="button"
                                            aria-haspopup="true"
                                            aria-expanded={buka}
                                            onClick={() => setBukaGrup(buka ? null : m.label)}
                                            className={`relative inline-flex items-center gap-1 rounded-lg px-3 py-2 transition-colors ${warna}`}
                                        >
                                            {m.label}
                                            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${buka ? 'rotate-180' : ''}`} aria-hidden="true" />
                                            {aktif && garisAktif}
                                        </button>
                                        {buka && (
                                            <div className="absolute left-0 top-full z-30 mt-3 w-72 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-pop">
                                                {m.anak.map((a) => {
                                                    const Ikon = a.ikon;
                                                    const sini = aktifItem(a);
                                                    return (
                                                        <Link
                                                            key={a.rute}
                                                            href={tujuan(a)}
                                                            aria-current={sini ? 'page' : undefined}
                                                            className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${sini ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                                                        >
                                                            <Ikon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                                                            <span>
                                                                <span className="block text-sm font-medium text-slate-900">{a.label}</span>
                                                                <span className="block text-xs font-normal text-slate-500">{a.deskripsi}</span>
                                                            </span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>

                        <div className="flex items-center gap-1.5">
                            <div className="hidden items-center gap-1.5 sm:flex">
                                <Button variant="ghost" size="sm" href={urlMasuk} icon={LogIn}>{labelMasuk}</Button>
                                <Button variant="primary" size="sm" href={route('pengaduan.create')}>Buat pengaduan</Button>
                            </div>
                            <IconButton icon={Menu} label="Buka menu" aria-expanded={terbuka} onClick={() => setTerbuka(true)} className="!h-9 !w-9 lg:hidden" />
                        </div>
                    </div>
                </header>

                {/* Slide-over mobile dari kanan: selalu dirender agar transisi halus, inert saat tertutup. */}
                <div className={`fixed inset-0 z-40 lg:hidden ${terbuka ? '' : 'pointer-events-none'}`} inert={!terbuka}>
                    <button
                        type="button"
                        aria-label="Tutup menu"
                        tabIndex={-1}
                        onClick={() => setTerbuka(false)}
                        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-200 ${terbuka ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <aside
                        className={`absolute inset-y-0 right-0 flex w-80 max-w-[88vw] flex-col border-l border-slate-200/80 bg-white shadow-pop transition-transform duration-200 ease-out ${terbuka ? 'translate-x-0' : 'translate-x-full'}`}
                        aria-label="Menu seluler"
                    >
                        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 px-5">
                            <span className="font-display text-base font-semibold tracking-tight text-slate-900">Menu</span>
                            <IconButton icon={X} label="Tutup menu" onClick={() => setTerbuka(false)} className="!h-9 !w-9" />
                        </div>
                        <nav className="flex-1 overflow-y-auto px-3 py-4">
                            <ul className="space-y-1">
                                {MENU.map((m) => (
                                    <li key={m.label}>
                                        {m.anak ? (
                                            <>
                                                <p className="px-3 pb-1 pt-4 text-xs font-medium text-slate-500">{m.label}</p>
                                                <ul className="space-y-0.5">
                                                    {m.anak.map((a) => <li key={a.rute}><LinkSeluler item={a} /></li>)}
                                                </ul>
                                            </>
                                        ) : (
                                            <LinkSeluler item={m} />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </nav>
                        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-200/80 p-4">
                            <Button variant="primary" href={route('pengaduan.create')} icon={Megaphone}>Buat pengaduan</Button>
                            <Button variant="secondary" href={urlMasuk} icon={LogIn}>{labelMasuk}</Button>
                        </div>
                    </aside>
                </div>

                <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 md:px-6 lg:px-8 lg:py-10">{children}</main>

                <footer className="border-t border-slate-200/80 bg-white">
                    <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 md:grid-cols-12 md:px-6 lg:px-8">
                        <div className="md:col-span-6">
                            <div className="flex items-center gap-2.5">
                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-600 text-sm font-semibold text-white">S</span>
                                <span className="font-display text-base font-semibold tracking-tight text-slate-900">SIMBANGDES</span>
                            </div>
                            <p className="mt-5 max-w-md font-display text-xl font-semibold leading-snug tracking-tight text-slate-900">
                                Pembangunan desa yang dapat dipantau oleh siapa saja.
                            </p>
                            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                                Sistem Informasi Manajemen Pembangunan dan Transparansi Desa. Data proyek, anggaran, dan pengaduan dapat diakses tanpa perlu mendaftar.
                            </p>
                        </div>
                        <div className="md:col-span-3">
                            <p className="text-xs font-medium text-slate-500">Portal</p>
                            <ul className="mt-4 space-y-2.5 text-sm">
                                <li><Link href={route('beranda')} className="text-slate-700 hover:text-slate-900">Beranda</Link></li>
                                {semuaTautan.filter((m) => !['beranda', 'pengaduan.cek'].includes(m.rute)).map((m) => (
                                    <li key={m.rute}><Link href={tujuan(m)} className="text-slate-700 hover:text-slate-900">{m.label}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div className="md:col-span-3">
                            <p className="text-xs font-medium text-slate-500">Layanan</p>
                            <ul className="mt-4 space-y-2.5 text-sm">
                                <li><Link href={route('pengaduan.create')} className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900">Sampaikan pengaduan <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></li>
                                <li><Link href={route('pengaduan.cek')} className="text-slate-700 hover:text-slate-900">Cek status tiket</Link></li>
                                <li><Link href={urlMasuk} className="text-slate-700 hover:text-slate-900">{user ? 'Ke panel internal' : 'Masuk panel internal'}</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-100">
                        <p className="mx-auto max-w-[1280px] px-4 py-5 text-xs text-slate-500 md:px-6 lg:px-8">&copy; <span className="tabular-nums">{new Date().getFullYear()}</span> SIMBANGDES</p>
                    </div>
                </footer>
            </div>
        </ConfirmProvider>
    );
}

function LinkSeluler({ item }) {
    const aktif = aktifItem(item);
    const Ikon = item.ikon;

    return (
        <Link
            href={tujuan(item)}
            aria-current={aktif ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${aktif ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
            {Ikon && <Ikon className="h-4 w-4 text-slate-500" aria-hidden="true" />}
            {item.label}
        </Link>
    );
}
