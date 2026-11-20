import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const tombol = 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-medium tabular-nums transition-colors';

/**
 * Paginasi dari objek paginator Laravel (links, from, to, total). Label disaring menjadi teks biasa,
 * tanpa menyuntikkan HTML. `links` saja juga diterima (tanpa ringkasan "Menampilkan x–y").
 */
export default function Pagination({ paginator, links: linksLangsung, className = '' }) {
    const links = paginator?.links ?? linksLangsung ?? [];
    if (links.length <= 3) return null;

    const sebelumnya = links[0];
    const berikutnya = links[links.length - 1];
    const nomor = links.slice(1, -1);

    const Nav = ({ item, children, label }) => (
        item.url
            ? <Link href={item.url} preserveScroll preserveState aria-label={label} className={`${tombol} text-slate-600 hover:bg-slate-100`}>{children}</Link>
            : <span aria-hidden="true" className={`${tombol} text-slate-300`}>{children}</span>
    );

    return (
        <nav className={`flex flex-wrap items-center justify-between gap-3 ${className}`} aria-label="Paginasi">
            <p className="text-[13px] text-slate-500">
                {paginator?.total != null && (
                    <>Menampilkan <b className="font-medium tabular-nums text-slate-900">{paginator.from ?? 0}–{paginator.to ?? 0}</b> dari <b className="font-medium tabular-nums text-slate-900">{paginator.total}</b></>
                )}
            </p>
            <div className="flex items-center gap-1">
                <Nav item={sebelumnya} label="Halaman sebelumnya"><ChevronLeft className="h-4 w-4" /></Nav>
                <div className="hidden items-center gap-1 md:flex">
                    {nomor.map((l, i) => {
                        const teks = String(l.label).replace(/<[^>]*>/g, '');
                        if (!l.url) {
                            return <span key={i} className={`${tombol} ${l.active ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>{teks}</span>;
                        }
                        return <Link key={i} href={l.url} preserveScroll preserveState aria-current={l.active ? 'page' : undefined} className={`${tombol} ${l.active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{teks}</Link>;
                    })}
                </div>
                <Nav item={berikutnya} label="Halaman berikutnya"><ChevronRight className="h-4 w-4" /></Nav>
            </div>
        </nav>
    );
}
