import Lightbox from '@/Components/Lightbox';
import { BentoCard, BentoGrid, Button, EmptyState, FormSelect, KpiCard, PageHeader, Pagination, formatTanggal } from '@/Components/UI';
import PublicLayout from '@/Layouts/PublicLayout';
import { router } from '@inertiajs/react';
import { Image as IkonGambar } from 'lucide-react';
import { useState } from 'react';

const TAHAP = ['Sebelum', 'Saat', 'Sesudah'];

export default function Galeri({ foto, filter = {}, perTahap = {}, opsi = { proyek: [], tahun: [] } }) {
    const [lihat, setLihat] = useState(null);
    const tahapAktif = filter.tahap ?? 'Semua';
    const terapkan = (extra) => router.get(route('galeri'), { ...filter, ...extra }, { preserveState: true, replace: true });
    const items = foto.data.map((f) => ({
        src: `/storage/${f.file_path}`,
        alt: `Foto tahap ${f.tahap} — ${f.proyek.nama}`,
        caption: `${f.proyek.nama} · ${f.tahap} · ${formatTanggal(f.created_at)}`,
    }));

    return (
        <PublicLayout title="Galeri & Dokumentasi">
            <PageHeader eyebrow="Dokumentasi lapangan" title="Galeri dan dokumentasi" description="Foto dari laporan progres yang telah diverifikasi dan disetujui pemerintah desa." />

            <BentoGrid>
                <div className="grid grid-cols-3 gap-5 md:col-span-6 lg:col-span-12">
                    {TAHAP.map((t) => <KpiCard key={t} label={`Foto ${t.toLowerCase()}`} value={perTahap[t]} />)}
                </div>

                <BentoCard span="full" className="!p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <FormSelect aria-label="Filter proyek" value={filter.proyek ?? ''} onChange={(e) => terapkan({ proyek: e.target.value || undefined })} className="lg:w-72">
                            <option value="">Semua proyek</option>
                            {opsi.proyek.map((p) => <option key={p.id} value={p.id}>{p.nama_proyek}</option>)}
                        </FormSelect>
                        <FormSelect aria-label="Filter tahun anggaran" value={filter.tahun ?? ''} onChange={(e) => terapkan({ tahun: e.target.value || undefined })} className="lg:w-44">
                            <option value="">Semua tahun</option>
                            {opsi.tahun.map((t) => <option key={t} value={t}>TA {t}</option>)}
                        </FormSelect>
                        <div className="overflow-x-auto">
                            <div className="inline-flex rounded-xl bg-slate-100 p-1" role="tablist">
                                {['Semua', ...TAHAP].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        role="tab"
                                        aria-selected={tahapAktif === t}
                                        onClick={() => terapkan({ tahap: t === 'Semua' ? undefined : t })}
                                        className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors ${tahapAktif === t ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500 hover:text-slate-900'}`}
                                    >{t}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 lg:ml-auto">
                            <span className="text-[13px] tabular-nums text-slate-500">{foto.total} foto</span>
                            {Object.keys(filter).length > 0 && <Button variant="ghost" size="sm" onClick={() => router.get(route('galeri'))}>Reset</Button>}
                        </div>
                    </div>
                </BentoCard>

                <BentoCard span="full" flush>
                    {foto.data.length === 0 ? (
                        <EmptyState icon={IkonGambar} title="Belum ada foto dokumentasi yang cocok" description="Ubah filter untuk melihat foto lain." />
                    ) : (
                        <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 md:p-5 lg:grid-cols-4">
                            {foto.data.map((f, i) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setLihat(i)}
                                    className={`group flex flex-col text-left ${i === 0 ? 'col-span-2 lg:row-span-2' : ''}`}
                                >
                                    <span className="relative block min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50">
                                        <img src={items[i].src} alt={items[i].alt} loading="lazy" className={`w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${i === 0 ? 'aspect-[4/3] lg:h-full lg:aspect-auto' : 'aspect-[4/3]'}`} />
                                        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-800">{f.tahap}</span>
                                    </span>
                                    <span className="mt-2 block truncate text-[13px] font-medium text-slate-900">{f.proyek.nama}</span>
                                    <span className="block text-xs tabular-nums text-slate-500">{formatTanggal(f.created_at)}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <Pagination paginator={foto} className="border-t border-slate-100 px-6 py-4 md:px-7" />
                </BentoCard>
            </BentoGrid>

            <Lightbox items={items} index={lihat} onClose={() => setLihat(null)} onIndexChange={setLihat} />
        </PublicLayout>
    );
}
