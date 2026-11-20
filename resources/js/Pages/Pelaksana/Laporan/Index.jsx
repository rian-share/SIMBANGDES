import { BentoGrid, DataTable, PageHeader, StatusBadge, formatPersen, formatTanggal } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Pencil } from 'lucide-react';

export default function Index({ laporan }) {
    const kolom = [
        {
            key: 'proyek',
            header: 'Proyek',
            primary: true,
            render: (l) => (
                <span className="block">
                    {l.proyek.nama_proyek}
                    {l.status_verifikasi === 'Ditolak' && l.catatan_revisi && <span className="mt-0.5 block text-[13px] font-normal text-red-600">Catatan Pemdes: {l.catatan_revisi}</span>}
                </span>
            ),
        },
        { key: 'status_verifikasi', header: 'Status', badge: true, render: (l) => <StatusBadge status={l.status_verifikasi} /> },
        { key: 'tanggal_laporan', header: 'Tanggal', render: (l) => <span className="whitespace-nowrap">{formatTanggal(l.tanggal_laporan)}</span> },
        { key: 'persentase_fisik', header: 'Progres', align: 'right', render: (l) => formatPersen(l.persentase_fisik) },
    ];

    return (
        <AuthenticatedLayout title="Riwayat Laporan" hideTitle>
            <PageHeader title="Riwayat laporan" description="Seluruh laporan progres yang pernah Anda kirim." />

            <BentoGrid>
                <DataTable
                    columns={kolom}
                    rows={laporan.data}
                    paginator={laporan}
                    empty={{ title: 'Belum ada laporan', description: 'Laporan dikirim dari halaman detail proyek.' }}
                    actions={(l) => (l.status_verifikasi === 'Ditolak' ? [{ label: 'Perbaiki laporan', icon: Pencil, href: route('pelaksana.laporan.edit', l.id) }] : [])}
                />
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
