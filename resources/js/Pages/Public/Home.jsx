import { BentoCard, BentoGrid, Button, EmptyState, KpiCard, Money, ProgressBar, StatusBadge, formatPersen, formatTanggal } from '@/Components/UI';
import PublicLayout from '@/Layouts/PublicLayout';
import { Link } from '@inertiajs/react';
import { ArrowRight, FolderKanban, Map, Megaphone } from 'lucide-react';

const tautanKartu = 'inline-flex items-center gap-1 text-[13px] font-medium text-slate-600 hover:text-slate-900';

export default function Home({ statistik, anggaran, terbaru = [], berita = [] }) {
    const serapan = Number(anggaran.pagu) > 0 ? (Number(anggaran.realisasi) / Number(anggaran.pagu)) * 100 : 0;

    return (
        <PublicLayout title="Beranda">
            <BentoGrid>
                <BentoCard span="hero" className="flex flex-col justify-center md:!p-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-red-600">Portal transparansi desa</p>
                    <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 md:text-5xl">
                        Pembangunan desa, terbuka untuk dipantau siapa saja.
                    </h1>
                    <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                        Lihat proyek yang sedang berjalan, serapan anggarannya, dan sampaikan pengaduan langsung, tanpa perlu mendaftar.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Button href={route('proyek.publik')} icon={FolderKanban}>Lihat katalog proyek</Button>
                        <Button href={route('peta')} variant="secondary" icon={Map}>Buka peta</Button>
                    </div>
                </BentoCard>

                <BentoCard span="highlight" variant="inverse" className="flex flex-col justify-between">
                    <div>
                        <Megaphone className="h-5 w-5 text-slate-400" aria-hidden="true" />
                        <h2 className="mt-4 font-display text-xl font-semibold leading-snug tracking-tight text-white">Ada masalah pada proyek desa?</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-400">Laporkan lewat formulir singkat, lalu lacak tanggapannya dengan kode tiket.</p>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-2">
                        <Button href={route('pengaduan.create')}>Buat pengaduan</Button>
                        <Button href={route('pengaduan.cek')} variant="secondary">Cek tiket</Button>
                    </div>
                </BentoCard>

                <div className="grid grid-cols-2 gap-5 md:col-span-6 lg:col-span-12 lg:grid-cols-4">
                    <KpiCard label="Total proyek" value={statistik.total} />
                    <KpiCard label="Berjalan" value={statistik.berjalan} />
                    <KpiCard label="Selesai" value={statistik.selesai} />
                    <KpiCard label="Terlambat" value={statistik.terlambat} tone={Number(statistik.terlambat) > 0 ? 'critical' : 'default'} />
                </div>

                <BentoCard
                    span="chart"
                    title="Proyek terbaru"
                    action={<Link href={route('proyek.publik')} className={tautanKartu}>Semua proyek <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
                >
                    {terbaru.length === 0 ? (
                        <EmptyState title="Belum ada proyek" />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {terbaru.map((p) => (
                                <li key={p.id} className="py-4 first:pt-0 last:pb-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <Link href={route('proyek.publik.show', p.id)} className="break-words font-medium text-slate-900 hover:text-red-600">{p.nama_proyek}</Link>
                                            <p className="mt-0.5 truncate text-[13px] text-slate-500">{p.lokasi}</p>
                                        </div>
                                        <StatusBadge status={p.status_proyek} />
                                    </div>
                                    <div className="mt-3 flex items-center gap-3">
                                        <ProgressBar value={p.progres_aktual} danger={p.status_proyek === 'Terlambat'} className="flex-1" />
                                        <span className="w-10 text-right text-xs tabular-nums text-slate-500">{formatPersen(p.progres_aktual)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </BentoCard>

                <BentoCard
                    span="list"
                    title="Sorotan anggaran"
                    description="Seluruh proyek publik"
                    action={<Link href={route('transparansi')} className={tautanKartu}>Rincian <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
                >
                    <p className="font-display text-5xl font-semibold tracking-tight tabular-nums text-slate-900">{formatPersen(Math.round(serapan * 10) / 10)}</p>
                    <p className="mt-1 text-sm text-slate-500">anggaran telah terserap</p>
                    <ProgressBar value={serapan} className="mt-5 !h-2.5" />
                    <dl className="mt-6 space-y-3 text-sm">
                        {[['Pagu', anggaran.pagu], ['Realisasi', anggaran.realisasi], ['Sisa', anggaran.sisa]].map(([nama, nilai]) => (
                            <div key={nama} className="flex items-baseline justify-between gap-3 border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                                <dt className="text-slate-500">{nama}</dt>
                                <dd className="font-medium text-slate-900"><Money value={nilai} /></dd>
                            </div>
                        ))}
                    </dl>
                </BentoCard>

                <BentoCard
                    span="full"
                    title="Berita dan pengumuman terbaru"
                    action={<Link href={route('berita.index')} className={tautanKartu}>Semua berita <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
                >
                    {berita.length === 0 ? (
                        <EmptyState title="Belum ada berita" />
                    ) : (
                        <div className="grid gap-6 md:grid-cols-3 md:gap-0 md:divide-x md:divide-slate-100">
                            {berita.map((b) => (
                                <Link key={b.id} href={route('berita.show', b.slug)} className="group block md:px-6 md:first:pl-0 md:last:pr-0">
                                    <div className="flex items-center gap-2.5">
                                        <StatusBadge status={b.kategori} />
                                        <span className="text-xs tabular-nums text-slate-500">{formatTanggal(b.published_at)}</span>
                                    </div>
                                    <p className="mt-3 font-display text-base font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-red-600">{b.judul}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </BentoCard>
            </BentoGrid>
        </PublicLayout>
    );
}
