import Lightbox from '@/Components/Lightbox';
import { BentoCard, BentoGrid, Button, PageHeader, formatTanggal } from '@/Components/UI';
import PublicLayout from '@/Layouts/PublicLayout';
import { Cover } from '@/Pages/Public/Berita/Index';
import { Head, Link } from '@inertiajs/react';
import { Check, Link as IkonTautan } from 'lucide-react';
import { useState } from 'react';

export default function Show({ berita, lainnya = [] }) {
    const [lihat, setLihat] = useState(null);
    const [tersalin, setTersalin] = useState(false);
    const salin = () => {
        navigator.clipboard?.writeText(window.location.href).then(() => {
            setTersalin(true);
            setTimeout(() => setTersalin(false), 2000);
        });
    };

    return (
        <PublicLayout title={berita.judul}>
            <Head><meta name="description" content={berita.ringkasan} /></Head>
            <PageHeader
                back={{ href: route('berita.index'), label: 'Berita dan pengumuman' }}
                eyebrow={berita.kategori}
                title={berita.judul}
                description={`${berita.penulis} · ${formatTanggal(berita.published_at)}`}
            />

            <BentoGrid>
                <BentoCard span="hero" flush>
                    {berita.gambar_cover && (
                        <button type="button" onClick={() => setLihat(0)} className="block w-full" aria-label="Perbesar gambar sampul">
                            <Cover berita={berita} className="aspect-[16/9] !rounded-none" />
                        </button>
                    )}
                    <article className="p-6 md:p-10">
                        <p className="max-w-[68ch] text-lg leading-8 text-slate-900">{berita.ringkasan}</p>
                        <div className="mt-6 max-w-[68ch] whitespace-pre-line break-words text-[15px] leading-7 text-slate-600">{berita.konten}</div>
                    </article>
                </BentoCard>

                <div className="space-y-5 md:col-span-6 lg:col-span-4">
                    <BentoCard title="Informasi">
                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between gap-3"><dt className="text-slate-500">Kategori</dt><dd className="font-medium text-slate-900">{berita.kategori}</dd></div>
                            <div className="flex justify-between gap-3"><dt className="text-slate-500">Terbit</dt><dd className="font-medium tabular-nums text-slate-900">{formatTanggal(berita.published_at)}</dd></div>
                            <div className="flex justify-between gap-3"><dt className="text-slate-500">Penulis</dt><dd className="text-right font-medium text-slate-900">{berita.penulis}</dd></div>
                        </dl>
                        <Button variant="secondary" onClick={salin} icon={tersalin ? Check : IkonTautan} className="mt-5 w-full">{tersalin ? 'Tautan tersalin' : 'Salin tautan'}</Button>
                    </BentoCard>

                    <BentoCard title="Berita lainnya">
                        <ul className="space-y-4">
                            {lainnya.map((b) => (
                                <li key={b.id}>
                                    <Link href={route('berita.show', b.slug)} className="group flex items-center gap-3">
                                        <Cover berita={b} className="h-16 w-16 shrink-0" />
                                        <span className="min-w-0">
                                            <span className="line-clamp-2 text-sm font-medium leading-snug text-slate-900 group-hover:text-red-600">{b.judul}</span>
                                            <span className="mt-0.5 block text-xs tabular-nums text-slate-500">{formatTanggal(b.published_at)}</span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                            {lainnya.length === 0 && <li className="text-sm text-slate-500">Belum ada berita lain.</li>}
                        </ul>
                    </BentoCard>
                </div>
            </BentoGrid>

            <Lightbox
                items={berita.gambar_cover ? [{ src: `/storage/${berita.gambar_cover}`, alt: berita.judul, caption: berita.judul }] : []}
                index={lihat}
                onClose={() => setLihat(null)}
                onIndexChange={setLihat}
            />
        </PublicLayout>
    );
}
