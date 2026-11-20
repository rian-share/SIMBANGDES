import { BentoGrid, DataTable, FilterBar, FormInput, FormSelect, PageHeader, StatusBadge, formatTanggalWaktu } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router } from '@inertiajs/react';
import { useState } from 'react';

const JENIS = ['Login', 'Logout', 'Create', 'Update', 'Delete'];

export default function Index({ log, filter }) {
    const [f, setF] = useState({ q: filter.q ?? '', jenis: filter.jenis ?? '', dari: filter.dari ?? '', sampai: filter.sampai ?? '' });
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
    const terapkan = () => router.get(route('admin.audit.index'), Object.fromEntries(Object.entries(f).filter(([, v]) => v)), { preserveState: true });

    // Jenis = kata pertama aktivitas (Login, Create, ...); selebihnya (mis. "Download Backup") tampil netral.
    const jenisDari = (aktivitas) => aktivitas.split(' ')[0];

    const kolom = [
        { key: 'created_at', header: 'Waktu', render: (l) => <span className="whitespace-nowrap tabular-nums">{formatTanggalWaktu(l.created_at)}</span> },
        { key: 'jenis', header: 'Jenis', badge: true, render: (l) => <StatusBadge status={jenisDari(l.aktivitas)} /> },
        { key: 'aktivitas', header: 'Aktivitas', primary: true, render: (l) => <span className="break-words">{l.aktivitas}</span> },
        { key: 'user', header: 'User', render: (l) => l.user?.username ?? '-' },
        { key: 'ip_address', header: 'IP', hideBelow: 'lg', render: (l) => <span className="font-mono text-xs">{l.ip_address}</span> },
    ];

    return (
        <AuthenticatedLayout title="Audit Trail" hideTitle>
            <PageHeader title="Audit trail" description="Log aktivitas sistem. Bersifat read-only: data tidak dapat diubah atau dihapus." />

            <BentoGrid>
                {/* Sengaja tanpa kolom aksi: audit trail append-only (BR-SYS 6.1). */}
                <DataTable
                    columns={kolom}
                    rows={log.data}
                    paginator={log}
                    empty={{ title: 'Tidak ada aktivitas', description: 'Ubah filter pencarian.' }}
                    toolbar={(
                        <FilterBar activeCount={Object.values(filter).filter(Boolean).length} onSubmit={terapkan} onReset={() => router.get(route('admin.audit.index'))}>
                            <FormInput aria-label="Cari aktivitas atau user" placeholder="Cari aktivitas atau user" value={f.q} onChange={set('q')} className="lg:w-64" />
                            <FormSelect aria-label="Jenis aktivitas" value={f.jenis} onChange={set('jenis')} className="lg:w-40">
                                <option value="">Semua jenis</option>
                                {JENIS.map((j) => <option key={j}>{j}</option>)}
                            </FormSelect>
                            <FormInput aria-label="Dari tanggal" type="date" value={f.dari} onChange={set('dari')} className="lg:w-40" />
                            <FormInput aria-label="Sampai tanggal" type="date" value={f.sampai} onChange={set('sampai')} className="lg:w-40" />
                        </FilterBar>
                    )}
                />
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
