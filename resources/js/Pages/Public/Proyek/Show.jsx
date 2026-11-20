import Lightbox from '@/Components/Lightbox';
import { BentoCard, BentoGrid, EmptyState, KpiCard, Money, PageHeader, ProgressBar, StatusBadge, formatPersen, formatTanggal } from '@/Components/UI';
import PublicLayout from '@/Layouts/PublicLayout';
import { Image as IkonGambar } from 'lucide-react';
import { useState } from 'react';

const TAHAP = ['Sebelum', 'Saat', 'Sesudah'];

export default function Show({ proyek, riwayat = [], galeri = {} }) {
    const a = proyek.anggaran;
    const [tahap, setTahap] = useState(TAHAP.find((t) => (galeri[t] ?? []).length > 0) ?? 'Sebelum');
    const [lihat, setLihat] = useState(null);
    const foto = galeri[tahap] ?? [];
    const itemsLightbox = foto.map((f) => ({ src: `/storage/${f.file_path}`, alt: `Foto ${tahap}`, caption: `${proyek.nama_proyek} · ${tahap}` }));
    const terlambat = proyek.status_proyek === 'Terlambat';

    return (
        <PublicLayout title={proyek.nama_proyek}>
            <PageHeader
                back={{ href: route('proyek.publik'), label: 'Katalog proyek' }}
                eyebrow={proyek.kategori}
                title={proyek.nama_proyek}
                description={`${proyek.lokasi} · ${formatTanggal(proyek.tanggal_mulai)} sampai ${formatTanggal(proyek.tanggal_selesai)}`}
                actions={<StatusBadge status={proyek.status_proyek} />}
            />

            <BentoGrid>
                <BentoCard span="hero" title="Tentang proyek">
                    {proyek.deskripsi
                        ? <p className="max-w-[68ch] whitespace-pre-line text-[15px] leading-7 text-slate-600">{proyek.deskripsi}</p>
                        : <p className="text-sm text-slate-500">Belum ada deskripsi.</p>}
                </BentoCard>

                <BentoCard span="highlight" title="Progres fisik">
                    <p className={`font-display text-5xl font-semibold tracking-tight tabular-nums ${terlambat ? 'text-red-600' : 'text-slate-900'}`}>{formatPersen(proyek.progres_aktual)}</p>
                    <ProgressBar value={proyek.progres_aktual} danger={terlambat} className="mt-5 !h-2.5" />
                    <p className="mt-2 text-xs tabular-nums text-slate-500">Target {formatPersen(proyek.target_progres)}</p>
                </BentoCard>

                {a && (
                    <>
                        <KpiCard span="kpi3" label="Pagu" hint={`TA ${a.tahun_anggaran} · ${a.sumber_dana}`}><Money value={a.pagu_anggaran} /></KpiCard>
                        <KpiCard span="kpi3" label="Realisasi"><Money value={a.total_realisasi} /></KpiCard>
                        <KpiCard span="kpi3" label="Sisa anggaran"><Money value={a.sisa_anggaran} /></KpiCard>
                    </>
                )}

                <BentoCard span="chart" title="Galeri dokumentasi" description="Dari laporan yang telah disetujui">
                    <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1" role="tablist">
                        {TAHAP.map((t) => (
                            <button
                                key={t}
                                type="button"
                                role="tab"
                                aria-selected={tahap === t}
                                onClick={() => setTahap(t)}
                                className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors ${tahap === t ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                {t} <span className="tabular-nums text-slate-500">{(galeri[t] ?? []).length}</span>
                            </button>
                        ))}
                    </div>
                    {foto.length === 0 ? (
                        <EmptyState icon={IkonGambar} title={`Belum ada foto tahap ${tahap}`} />
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {foto.map((f, i) => (
                                <button key={f.id} type="button" onClick={() => setLihat(i)} className="group overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50">
                                    <img src={`/storage/${f.file_path}`} alt={`Foto ${tahap}`} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                                </button>
                            ))}
                        </div>
                    )}
                </BentoCard>

                <BentoCard span="list" title="Riwayat laporan" description="Laporan yang disetujui">
                    {riwayat.length === 0 ? (
                        <EmptyState title="Belum ada laporan disetujui" />
                    ) : (
                        <ol className="relative ml-1.5 border-l border-slate-200">
                            {riwayat.map((r) => (
                                <li key={r.id} className="relative ml-5 pb-6 last:pb-0">
                                    <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-900 ring-4 ring-white" aria-hidden="true" />
                                    <p className="text-sm font-medium tabular-nums text-slate-900">{formatPersen(r.persentase_fisik)} <span className="font-normal text-slate-500">· {formatTanggal(r.tanggal_laporan)}</span></p>
                                    <p className="mt-0.5 break-words text-sm text-slate-600">{r.keterangan}</p>
                                </li>
                            ))}
                        </ol>
                    )}
                </BentoCard>
            </BentoGrid>

            <Lightbox items={itemsLightbox} index={lihat} onClose={() => setLihat(null)} onIndexChange={setLihat} />
        </PublicLayout>
    );
}
