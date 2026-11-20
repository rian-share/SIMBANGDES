import { BentoCard, BentoGrid, Button, EmptyState, FormInput, PageHeader, Pagination, StatusBadge, formatTanggal } from '@/Components/UI';
import PublicLayout from '@/Layouts/PublicLayout';
import { Link, router } from '@inertiajs/react';
import { ArrowRight, Megaphone, Newspaper } from 'lucide-react';
import { useState } from 'react';

const KATEGORI = ['Semua', 'Berita', 'Pengumuman'];

// Dipakai juga oleh Berita/Show.
export function Cover({ berita, className = '' }) {
    return berita.gambar_cover ? (
        <img src={`/storage/${berita.gambar_cover}`} alt={berita.judul} loading="lazy" className={`w-full rounded-xl object-cover ${className}`} />
    ) : (
        <div className={`grid w-full place-items-center rounded-xl bg-slate-50 ${className}`}><Newspaper className="h-8 w-8 text-slate-300" aria-hidden="true" /></div>
    );
}

export function ChipKategori({ kategori }) {
    return <StatusBadge status={kategori} />;
}

export default function Index({ berita, pengumumanTerbaru = [], filter = {} }) {
    const [q, setQ] = useState(filter.q ?? '');
    const kategoriAktif = filter.kategori ?? 'Semua';
    const cari = (extra = {}) => {
        const params = { q: q || undefined, kategori: kategoriAktif === 'Semua' ? undefined : kategoriAktif, ...extra };
        router.get(route('berita.index'), params, { preserveState: true, replace: true });
    };

    // Sorotan hanya di halaman 1 tanpa filter; selebihnya semua item tampil sebagai kartu biasa.
    const adaFilter = Boolean(filter.q || filter.kategori);
    const sorotan = !adaFilter && berita.current_page === 1 ? berita.data[0] : null;
    const kartu = sorotan ? berita.data.slice(1) : berita.data;

    return (
        <PublicLayout title="Berita & Pengumuman">
            <PageHeader eyebrow="Kabar desa" title="Berita dan pengumuman" />

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex self-start rounded-xl bg-slate-100 p-1" role="tablist">
                    {KATEGORI.map((k) => (
                        <button
                            key={k}
                            type="button"
                            role="tab"
                            aria-selected={kategoriAktif === k}
                            onClick={() => cari({ kategori: k === 'Semua' ? undefined : k })}
                            className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors ${kategoriAktif === k ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500 hover:text-slate-900'}`}
                        >{k}</button>
                    ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); cari(); }} className="flex gap-2">
                    <FormInput aria-label="Cari judul" placeholder="Cari judul" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 sm:w-64 sm:flex-none" />
                    <Button type="submit" variant="secondary">Cari</Button>
                </form>
            </div>

            <BentoGrid>
                {sorotan && (
                    <BentoCard span="hero" flush>
                        <Link href={route('berita.show', sorotan.slug)} className="group block">
                            <Cover berita={sorotan} className="aspect-[16/9] !rounded-none" />
                            <div className="p-6 md:p-7">
                                <div className="flex items-center gap-2.5"><ChipKategori kategori={sorotan.kategori} /><span className="text-xs tabular-nums text-slate-500">{formatTanggal(sorotan.published_at)}</span></div>
                                <h2 className="mt-3 font-display text-2xl font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-red-600 md:text-[28px]">{sorotan.judul}</h2>
                                <p className="mt-2 max-w-[68ch] text-[15px] leading-7 text-slate-600">{sorotan.ringkasan}</p>
                                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-slate-900">Baca selengkapnya <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                            </div>
                        </Link>
                    </BentoCard>
                )}

                {sorotan && (
                    <BentoCard span="highlight" title="Pengumuman terbaru" action={<Megaphone className="h-4 w-4 text-slate-400" aria-hidden="true" />}>
                        {pengumumanTerbaru.length === 0 ? <EmptyState title="Belum ada pengumuman" /> : (
                            <ul className="divide-y divide-slate-100">
                                {pengumumanTerbaru.map((p) => (
                                    <li key={p.id} className="py-3.5 first:pt-0 last:pb-0">
                                        <Link href={route('berita.show', p.slug)} className="break-words text-sm font-medium leading-snug text-slate-900 hover:text-red-600">{p.judul}</Link>
                                        <p className="mt-1 text-xs tabular-nums text-slate-500">{formatTanggal(p.published_at)}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </BentoCard>
                )}

                {kartu.map((b) => (
                    <BentoCard key={b.id} flush className="md:col-span-3 lg:col-span-4">
                        <Link href={route('berita.show', b.slug)} className="group flex h-full flex-col">
                            <Cover berita={b} className="aspect-[4/3] !rounded-none" />
                            <div className="flex flex-1 flex-col p-5">
                                <div className="flex items-center gap-2.5"><ChipKategori kategori={b.kategori} /><span className="text-xs tabular-nums text-slate-500">{formatTanggal(b.published_at)}</span></div>
                                <h2 className="mt-3 font-display text-base font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-red-600">{b.judul}</h2>
                                <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-600">{b.ringkasan}</p>
                            </div>
                        </Link>
                    </BentoCard>
                ))}

                {berita.data.length === 0 && (
                    <BentoCard span="full"><EmptyState icon={Newspaper} title="Tidak ada berita atau pengumuman yang cocok" description="Ubah kata kunci atau kategori." /></BentoCard>
                )}
            </BentoGrid>

            {berita.last_page > 1 && <Pagination paginator={berita} className="mt-6" />}
        </PublicLayout>
    );
}
