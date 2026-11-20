import { BentoCard, BentoGrid, Button, EmptyState, PageHeader, ProgressBar, StatusBadge, formatPersen, formatTanggal } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';
import { MapPin } from 'lucide-react';

export default function Index({ proyek = [] }) {
    return (
        <AuthenticatedLayout title="Proyek Saya" hideTitle>
            <PageHeader title="Proyek saya" description="Proyek yang ditugaskan kepada Anda. Kirim laporan progres dari halaman detail." />

            <BentoGrid>
                {proyek.map((p) => (
                    <BentoCard key={p.id} className="flex flex-col md:col-span-3 lg:col-span-4">
                        <div className="flex items-start justify-between gap-3">
                            <Link href={route('pelaksana.proyek.show', p.id)} className="break-words font-display text-base font-semibold leading-snug tracking-tight text-slate-900 hover:text-red-600">{p.nama_proyek}</Link>
                            <StatusBadge status={p.status_proyek} />
                        </div>
                        <p className="mt-2 flex items-start gap-1.5 text-[13px] text-slate-500">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="min-w-0 break-words">{p.lokasi}</span>
                        </p>
                        <p className="mt-1 text-[13px] tabular-nums text-slate-500">Tenggat {formatTanggal(p.tanggal_selesai)}</p>
                        <div className="mt-auto pt-6">
                            <div className="flex items-center gap-3">
                                <ProgressBar value={p.progres_aktual} danger={p.status_proyek === 'Terlambat'} className="flex-1" />
                                <span className="text-xs tabular-nums text-slate-700">{formatPersen(p.progres_aktual)} / {formatPersen(p.target_progres)}</span>
                            </div>
                            <Button variant="secondary" size="sm" href={route('pelaksana.proyek.show', p.id)} className="mt-4 w-full">Buka proyek</Button>
                        </div>
                    </BentoCard>
                ))}
                {proyek.length === 0 && <BentoCard span="full"><EmptyState title="Belum ada proyek yang ditugaskan" /></BentoCard>}
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
