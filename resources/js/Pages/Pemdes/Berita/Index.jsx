import { BentoGrid, Button, DataTable, FilterBar, FormInput, FormSelect, PageHeader, StatusBadge, formatTanggal } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router } from '@inertiajs/react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function Index({ berita, filter }) {
    const [q, setQ] = useState(filter.q ?? '');
    const cari = (extra = {}) => router.get(route('pemdes.berita.index'), { ...filter, q: q || undefined, ...extra }, { preserveState: true });

    const kolom = [
        {
            key: 'judul',
            header: 'Judul',
            primary: true,
            render: (b) => (
                <span className="block max-w-md">
                    <span className="block">{b.judul}</span>
                    <span className="line-clamp-1 text-xs font-normal text-slate-500">{b.ringkasan}</span>
                </span>
            ),
        },
        { key: 'status', header: 'Status', badge: true, render: (b) => <StatusBadge status={b.is_published ? 'Selesai' : 'Draf'} label={b.is_published ? 'Terbit' : 'Draf'} /> },
        { key: 'kategori', header: 'Kategori' },
        { key: 'published_at', header: 'Terbit', render: (b) => <span className="whitespace-nowrap">{formatTanggal(b.published_at)}</span> },
    ];

    return (
        <AuthenticatedLayout title="Berita & Pengumuman" hideTitle>
            <PageHeader title="Berita dan pengumuman" description="Konten yang tampil di portal publik." actions={<Button href={route('pemdes.berita.create')} icon={Plus}>Tulis berita</Button>} />

            <BentoGrid>
                <DataTable
                    columns={kolom}
                    rows={berita.data}
                    paginator={berita}
                    empty={{ title: 'Belum ada berita atau pengumuman', action: <Button size="sm" href={route('pemdes.berita.create')} icon={Plus}>Tulis berita</Button> }}
                    toolbar={(
                        <FilterBar activeCount={['q', 'kategori', 'status'].filter((k) => filter[k]).length} onSubmit={() => cari()} onReset={() => router.get(route('pemdes.berita.index'))}>
                            <FormInput aria-label="Cari judul" placeholder="Cari judul" value={q} onChange={(e) => setQ(e.target.value)} className="lg:w-64" />
                            <FormSelect aria-label="Filter kategori" value={filter.kategori ?? ''} onChange={(e) => cari({ kategori: e.target.value || undefined })} className="lg:w-44">
                                <option value="">Semua kategori</option>
                                <option>Berita</option>
                                <option>Pengumuman</option>
                            </FormSelect>
                            <FormSelect aria-label="Filter status" value={filter.status ?? ''} onChange={(e) => cari({ status: e.target.value || undefined })} className="lg:w-40">
                                <option value="">Semua status</option>
                                <option value="terbit">Terbit</option>
                                <option value="draf">Draf</option>
                            </FormSelect>
                        </FilterBar>
                    )}
                    actions={(b) => [
                        ...(b.is_published ? [{ label: 'Lihat di portal', icon: ExternalLink, href: route('berita.show', b.slug) }] : []),
                        { label: 'Ubah', icon: Pencil, href: route('pemdes.berita.edit', b.id) },
                        {
                            label: 'Hapus',
                            icon: Trash2,
                            danger: true,
                            confirm: { title: `Hapus "${b.judul}"?`, description: 'Gambar sampul juga akan dihapus.' },
                            onClick: () => router.delete(route('pemdes.berita.destroy', b.id)),
                        },
                    ]}
                />
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
