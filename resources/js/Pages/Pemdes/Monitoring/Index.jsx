import { BentoGrid, DataTable, KpiCard, PageHeader, StatusBadge, formatPersen, formatTanggal } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';

export default function Index({ proyek = [] }) {
    const hitung = (level) => proyek.filter((p) => p.risiko === level).length;

    const kolom = [
        { key: 'nama_proyek', header: 'Proyek', primary: true, render: (p) => <Link href={route('pemdes.proyek.show', p.id)} className="hover:text-red-600">{p.nama_proyek}</Link> },
        { key: 'risiko', header: 'Risiko', badge: true, render: (p) => <StatusBadge status={p.risiko} /> },
        { key: 'pelaksana', header: 'Pelaksana', hideBelow: 'lg' },
        { key: 'status_proyek', header: 'Status', render: (p) => <StatusBadge status={p.status_proyek} /> },
        { key: 'tanggal_selesai', header: 'Tenggat', render: (p) => <span className="whitespace-nowrap">{formatTanggal(p.tanggal_selesai)}</span> },
        { key: 'progres_aktual', header: 'Aktual', align: 'right', render: (p) => formatPersen(p.progres_aktual) },
        { key: 'target_berjalan', header: 'Target', align: 'right', render: (p) => formatPersen(p.target_berjalan) },
        { key: 'deviasi', header: 'Deviasi', align: 'right', render: (p) => <span className={Number(p.deviasi) < 0 ? 'font-medium text-red-600' : 'text-slate-700'}>{formatPersen(p.deviasi)}</span> },
    ];

    return (
        <AuthenticatedLayout title="Monitoring Risiko" hideTitle>
            <PageHeader title="Monitoring risiko" description="Deviasi adalah progres aktual dikurangi target jadwal berjalan." />

            <BentoGrid>
                <KpiCard span="kpi3" label="Aman" value={hitung('Aman')} />
                <KpiCard span="kpi3" label="Waspada" value={hitung('Waspada')} />
                <KpiCard span="kpi3" label="Kritis" value={hitung('Kritis')} tone={hitung('Kritis') > 0 ? 'critical' : 'default'} />

                <DataTable title="Pemantauan keterlambatan proyek" columns={kolom} rows={proyek} empty={{ title: 'Belum ada proyek' }} />
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
