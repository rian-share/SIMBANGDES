import { BentoGrid, DataTable, FormSelect, PageHeader, StatusBadge } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

export default function Index({ pengaduan, filter }) {
    const kolom = [
        { key: 'kode_tiket', header: 'Tiket', primary: true, render: (p) => <span className="font-mono tracking-wide">{p.kode_tiket}</span> },
        { key: 'status_pengaduan', header: 'Status', badge: true, render: (p) => <StatusBadge status={p.status_pengaduan} /> },
        { key: 'nama_pelapor', header: 'Pelapor' },
        { key: 'proyek', header: 'Proyek', render: (p) => p.proyek?.nama_proyek ?? '-' },
    ];

    return (
        <AuthenticatedLayout title="Pengaduan Masyarakat" hideTitle>
            <PageHeader title="Pengaduan masyarakat" description="Pengaduan yang masuk dari portal publik." />

            <BentoGrid>
                <DataTable
                    columns={kolom}
                    rows={pengaduan.data}
                    paginator={pengaduan}
                    empty={{ title: 'Belum ada pengaduan' }}
                    toolbar={(
                        <FormSelect
                            aria-label="Filter status"
                            value={filter.status ?? ''}
                            onChange={(e) => router.get(route('pemdes.pengaduan.index'), { status: e.target.value || undefined }, { preserveState: true })}
                            className="sm:w-52"
                        >
                            <option value="">Semua status</option>
                            {['Menunggu', 'Diproses', 'Selesai', 'Ditolak'].map((s) => <option key={s}>{s}</option>)}
                        </FormSelect>
                    )}
                    actions={(p) => [{ label: 'Buka pengaduan', icon: ArrowRight, href: route('pemdes.pengaduan.show', p.id) }]}
                />
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
