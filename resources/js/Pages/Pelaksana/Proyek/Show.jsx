import { BentoCard, BentoGrid, Button, Callout, EmptyState, KpiCard, Money, PageHeader, ProgressBar, StatusBadge, formatPersen, formatTanggal } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ proyek, laporan = [], bisaLapor }) {
    const terlambat = proyek.status_proyek === 'Terlambat';

    return (
        <AuthenticatedLayout title={proyek.nama_proyek} hideTitle>
            <PageHeader
                back={{ href: route('pelaksana.proyek.index'), label: 'Proyek saya' }}
                eyebrow={proyek.kategori}
                title={proyek.nama_proyek}
                description={`${proyek.lokasi} · ${formatTanggal(proyek.tanggal_mulai)} sampai ${formatTanggal(proyek.tanggal_selesai)}`}
                actions={bisaLapor ? <Button href={route('pelaksana.laporan.create', proyek.id)}>Buat laporan progres</Button> : <StatusBadge status={proyek.status_proyek} />}
            />

            <BentoGrid>
                <BentoCard span="hero" title="Informasi proyek" description="Data master bersifat read-only" action={<StatusBadge status={proyek.status_proyek} />}>
                    <p className={`font-display text-4xl font-semibold tracking-tight tabular-nums ${terlambat ? 'text-red-600' : 'text-slate-900'}`}>{formatPersen(proyek.progres_aktual)}</p>
                    <ProgressBar value={proyek.progres_aktual} danger={terlambat} className="mt-4 !h-2.5" />
                    <p className="mt-2 text-xs tabular-nums text-slate-500">Target {formatPersen(proyek.target_progres)}</p>
                    {proyek.deskripsi && <p className="mt-5 max-w-[68ch] text-sm leading-6 text-slate-600">{proyek.deskripsi}</p>}
                </BentoCard>

                <BentoCard span="highlight" title="Lapor progres">
                    {bisaLapor ? (
                        <>
                            <p className="mb-4 text-sm leading-6 text-slate-600">Kirim laporan beserta foto dokumentasi. Pemdes akan memverifikasinya.</p>
                            <Button href={route('pelaksana.laporan.create', proyek.id)} className="w-full">Buat laporan progres</Button>
                        </>
                    ) : (
                        <Callout tone="info">Tidak dapat melapor: proyek selesai atau masih ada laporan yang menunggu verifikasi.</Callout>
                    )}
                </BentoCard>

                <KpiCard span="kpi3" label="Pagu"><Money value={proyek.anggaran?.pagu_anggaran} ringkas /></KpiCard>
                <KpiCard span="kpi3" label="Realisasi"><Money value={proyek.anggaran?.total_realisasi} ringkas /></KpiCard>
                <KpiCard span="kpi3" label="Sisa anggaran"><Money value={proyek.anggaran?.sisa_anggaran} ringkas /></KpiCard>

                <BentoCard span="full" title="Riwayat laporan">
                    {laporan.length === 0 ? <EmptyState title="Belum ada laporan" /> : (
                        <ul className="divide-y divide-slate-100">
                            {laporan.map((l) => (
                                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                                    <div className="min-w-0">
                                        <p className="text-sm tabular-nums text-slate-900">{formatTanggal(l.tanggal_laporan)} · <b className="font-medium">{formatPersen(l.persentase_fisik)}</b> · {l.foto.length} foto</p>
                                        {l.catatan_revisi && <p className="mt-1 text-[13px] text-red-600">Catatan Pemdes: {l.catatan_revisi}</p>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={l.status_verifikasi} />
                                        {l.status_verifikasi === 'Ditolak' && <Button size="sm" variant="secondary" href={route('pelaksana.laporan.edit', l.id)}>Perbaiki</Button>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </BentoCard>
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
