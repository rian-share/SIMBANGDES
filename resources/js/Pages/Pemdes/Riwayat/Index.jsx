import TimelineRiwayat from '@/Components/TimelineRiwayat';
import { BentoCard, BentoGrid, EmptyState, FormInput, FormSelect, PageHeader, Pagination, StatusBadge } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ proyek = [], dipilih, riwayat }) {
    const [q, setQ] = useState('');
    const pilih = (id) => router.get(route('pemdes.riwayat.index'), { proyek: id }, { preserveState: true, preserveScroll: true });
    const aktif = proyek.find((p) => p.id === dipilih);
    const daftar = proyek.filter((p) => p.nama_proyek.toLowerCase().includes(q.toLowerCase()));

    return (
        <AuthenticatedLayout title="Riwayat Proyek" hideTitle>
            <PageHeader title="Riwayat proyek" description="Catatan perubahan kronologis untuk setiap proyek." />

            <BentoGrid>
                <BentoCard span="highlight" title="Proyek" className="lg:sticky lg:top-20 lg:self-start">
                    <FormSelect aria-label="Pilih proyek" value={dipilih ?? ''} onChange={(e) => pilih(e.target.value)} className="lg:hidden">
                        {proyek.map((p) => <option key={p.id} value={p.id}>{p.nama_proyek}</option>)}
                    </FormSelect>

                    <div className="hidden lg:block">
                        <FormInput aria-label="Cari proyek" placeholder="Cari proyek" value={q} onChange={(e) => setQ(e.target.value)} className="mb-3" />
                        <ul className="max-h-[480px] space-y-0.5 overflow-y-auto">
                            {daftar.map((p) => (
                                <li key={p.id}>
                                    <button
                                        type="button"
                                        onClick={() => pilih(p.id)}
                                        aria-current={p.id === dipilih ? 'true' : undefined}
                                        className={`relative flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${p.id === dipilih ? 'bg-slate-100 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-red-600' : 'hover:bg-slate-50'}`}
                                    >
                                        <span className="min-w-0">
                                            <span className={`block break-words ${p.id === dipilih ? 'font-medium text-slate-900' : 'text-slate-700'}`}>{p.nama_proyek}</span>
                                            <span className="text-xs tabular-nums text-slate-500">{p.log_aktivitas_count} catatan</span>
                                        </span>
                                        <StatusBadge status={p.status_proyek} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {daftar.length === 0 && <EmptyState title="Proyek tidak ditemukan" />}
                    </div>
                </BentoCard>

                <BentoCard span="hero" title={aktif ? aktif.nama_proyek : 'Timeline'} description="Perubahan terbaru di atas" flush={false}>
                    {riwayat ? (
                        <>
                            <TimelineRiwayat items={riwayat.data} />
                            {riwayat.last_page > 1 && <Pagination paginator={riwayat} className="mt-6 border-t border-slate-100 pt-4" />}
                        </>
                    ) : (
                        <EmptyState title="Belum ada proyek" />
                    )}
                </BentoCard>
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
