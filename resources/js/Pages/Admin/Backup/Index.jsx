import { BentoCard, BentoGrid, Button, DataTable, PageHeader } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router } from '@inertiajs/react';
import { DatabaseBackup, Download } from 'lucide-react';

export default function Index({ berkas = [] }) {
    const kolom = [
        { key: 'nama', header: 'Berkas', primary: true, render: (b) => <span className="break-all font-mono text-[13px]">{b.nama}</span> },
        { key: 'ukuran', header: 'Ukuran', align: 'right', render: (b) => `${(b.ukuran / 1024).toFixed(1)} KB` },
    ];

    return (
        <AuthenticatedLayout title="Backup Database" hideTitle>
            <PageHeader title="Backup database" description="Dump database MySQL disimpan di penyimpanan privat." />

            <BentoGrid>
                <BentoCard span="highlight" title="Buat backup" description="Cadangan baru muncul di daftar berkas.">
                    <Button icon={DatabaseBackup} onClick={() => router.post(route('admin.backup.store'))} className="w-full">Backup sekarang</Button>
                </BentoCard>

                <DataTable
                    span="hero"
                    title="Berkas backup"
                    columns={kolom}
                    rows={berkas}
                    rowKey="nama"
                    empty={{ title: 'Belum ada backup' }}
                    actions={(b) => [{ label: 'Unduh', icon: Download, onClick: () => { window.location.href = route('admin.backup.download', b.nama); } }]}
                />
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
