import { BentoGrid, Button, DataTable, FilterBar, FormInput, FormSelect, PageHeader, ProgressBar, StatusBadge, buttonClass, formatPersen, formatRupiah } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, router } from '@inertiajs/react';
import { Eye, FileDown, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { useState } from 'react';

export default function Index({ proyek, filter }) {
    const [q, setQ] = useState(filter.q ?? '');
    const cari = (extra = {}) => router.get(route('pemdes.proyek.index'), { q: q || undefined, status: filter.status, ...extra }, { preserveState: true });

    const kolom = [
        { key: 'nama_proyek', header: 'Proyek', primary: true, render: (p) => <Link href={route('pemdes.proyek.show', p.id)} className="hover:text-red-600">{p.nama_proyek}{!p.is_public && <span className="ml-2 text-xs font-normal text-slate-500">(internal)</span>}</Link> },
        { key: 'status_proyek', header: 'Status', badge: true, render: (p) => <StatusBadge status={p.status_proyek} /> },
        { key: 'pelaksana', header: 'Pelaksana', hideBelow: 'lg', render: (p) => p.pelaksana?.nama_lengkap ?? '-' },
        {
            key: 'progres',
            header: 'Progres',
            className: 'w-44',
            render: (p) => (
                <div className="flex items-center gap-3">
                    <ProgressBar value={p.progres_aktual} danger={p.status_proyek === 'Terlambat'} className="flex-1" />
                    <span className="text-xs tabular-nums text-slate-700">{formatPersen(p.progres_aktual)}</span>
                </div>
            ),
        },
        { key: 'pagu', header: 'Pagu', align: 'right', render: (p) => formatRupiah(p.anggaran?.pagu_anggaran) },
    ];

    return (
        <AuthenticatedLayout title="Proyek" hideTitle>
            <PageHeader
                title="Proyek"
                description="Kelola seluruh proyek pembangunan desa."
                actions={(
                    <>
                        <a href={route('pemdes.rekap.pdf')} className={buttonClass('secondary')}><FileDown className="h-4 w-4" aria-hidden="true" />Ekspor PDF</a>
                        <Button href={route('pemdes.proyek.create')} icon={Plus}>Tambah proyek</Button>
                    </>
                )}
            />

            <BentoGrid>
                <DataTable
                    columns={kolom}
                    rows={proyek.data}
                    paginator={proyek}
                    toolbar={(
                        <FilterBar activeCount={(filter.q ? 1 : 0) + (filter.status ? 1 : 0)} onSubmit={() => cari()} onReset={() => router.get(route('pemdes.proyek.index'))}>
                            <FormInput aria-label="Cari proyek" placeholder="Cari nama proyek" value={q} onChange={(e) => setQ(e.target.value)} className="lg:w-64" />
                            <FormSelect aria-label="Status" value={filter.status ?? ''} onChange={(e) => cari({ status: e.target.value || undefined })} className="lg:w-44">
                                <option value="">Semua status</option>
                                {['Perencanaan', 'Berjalan', 'Terlambat', 'Selesai'].map((s) => <option key={s}>{s}</option>)}
                            </FormSelect>
                        </FilterBar>
                    )}
                    actions={(p) => [
                        { label: 'Detail', icon: Eye, href: route('pemdes.proyek.show', p.id) },
                        { label: 'Anggaran', icon: Wallet, href: route('pemdes.anggaran.show', p.id) },
                        { label: 'Ubah', icon: Pencil, href: route('pemdes.proyek.edit', p.id) },
                        {
                            label: 'Hapus',
                            icon: Trash2,
                            danger: true,
                            confirm: { title: `Hapus proyek "${p.nama_proyek}"?`, description: 'Seluruh data dan berkas proyek ikut dihapus dan tidak dapat dikembalikan.' },
                            onClick: () => router.delete(route('pemdes.proyek.destroy', p.id)),
                        },
                    ]}
                    empty={{ title: 'Belum ada proyek', description: 'Tambahkan proyek pertama untuk mulai memantau pembangunan.', action: <Button size="sm" href={route('pemdes.proyek.create')} icon={Plus}>Tambah proyek</Button> }}
                />
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
