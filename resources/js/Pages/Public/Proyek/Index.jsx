import { BentoCard, BentoGrid, EmptyState, FilterBar, FormInput, FormSelect, PageHeader, Pagination, ProgressBar, StatusBadge, formatPersen } from '@/Components/UI';
import PublicLayout from '@/Layouts/PublicLayout';
import { Link, router, useForm } from '@inertiajs/react';
import { MapPin, Search } from 'lucide-react';

const STATUS = ['Perencanaan', 'Berjalan', 'Terlambat', 'Selesai'];

export default function Index({ proyek, filter = {}, opsi = { kategori: [], tahun: [] } }) {
    const { data, setData } = useForm({ q: filter.q ?? '', status: filter.status ?? '', kategori: filter.kategori ?? '', tahun: filter.tahun ?? '' });
    const aktif = Object.values(data).filter((v) => v !== '').length;

    const cari = (nilai = data) => router.get(route('proyek.publik'), Object.fromEntries(Object.entries(nilai).filter(([, v]) => v !== '')), { preserveState: true });
    const ubah = (kunci) => (e) => {
        setData(kunci, e.target.value);
        // Dropdown berlaku langsung; kolom cari menunggu tombol Terapkan / Enter.
        if (kunci !== 'q') cari({ ...data, [kunci]: e.target.value });
    };

    return (
        <PublicLayout title="Katalog Proyek">
            <PageHeader eyebrow="Proyek desa" title="Katalog proyek pembangunan" description={`${proyek.total} proyek ditemukan`} />

            <BentoGrid>
                <BentoCard span="full" className="!p-5">
                    <FilterBar activeCount={aktif} onSubmit={() => cari()} onReset={() => router.get(route('proyek.publik'))}>
                        <FormInput aria-label="Cari proyek" placeholder="Cari nama atau lokasi" value={data.q} onChange={ubah('q')} className="lg:w-72" />
                        <FormSelect aria-label="Status" value={data.status} onChange={ubah('status')} className="lg:w-44">
                            <option value="">Semua status</option>
                            {STATUS.map((s) => <option key={s}>{s}</option>)}
                        </FormSelect>
                        <FormSelect aria-label="Kategori" value={data.kategori} onChange={ubah('kategori')} className="lg:w-48">
                            <option value="">Semua kategori</option>
                            {opsi.kategori.map((k) => <option key={k}>{k}</option>)}
                        </FormSelect>
                        <FormSelect aria-label="Tahun anggaran" value={data.tahun} onChange={ubah('tahun')} className="lg:w-40">
                            <option value="">Semua tahun</option>
                            {opsi.tahun.map((t) => <option key={t}>{t}</option>)}
                        </FormSelect>
                    </FilterBar>
                </BentoCard>

                {proyek.data.length === 0 && (
                    <BentoCard span="full">
                        <EmptyState icon={Search} title="Tidak ada proyek yang cocok" description="Ubah kata kunci atau filter pencarian." />
                    </BentoCard>
                )}

                {proyek.data.map((p) => (
                    <BentoCard key={p.id} className="flex flex-col md:col-span-3 lg:col-span-4">
                        <div className="flex items-start justify-between gap-3">
                            <Link href={route('proyek.publik.show', p.id)} className="break-words font-display text-base font-semibold leading-snug tracking-tight text-slate-900 hover:text-red-600">{p.nama_proyek}</Link>
                            <StatusBadge status={p.status_proyek} />
                        </div>
                        <p className="mt-2 flex items-start gap-1.5 text-[13px] text-slate-500">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="min-w-0 break-words">{p.lokasi}</span>
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {p.kategori && <StatusBadge status={p.kategori} />}
                            {p.anggaran && <StatusBadge status={`TA ${p.anggaran.tahun_anggaran}`} />}
                        </div>
                        <div className="mt-auto pt-6">
                            <div className="flex items-center gap-3">
                                <ProgressBar value={p.progres_aktual} danger={p.status_proyek === 'Terlambat'} className="flex-1" />
                                <span className="text-xs font-medium tabular-nums text-slate-700">{formatPersen(p.progres_aktual)}</span>
                            </div>
                        </div>
                    </BentoCard>
                ))}
            </BentoGrid>

            {proyek.last_page > 1 && <Pagination paginator={proyek} className="mt-6" />}
        </PublicLayout>
    );
}
