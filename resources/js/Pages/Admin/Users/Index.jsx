import { BentoGrid, Button, DataTable, FilterBar, FormInput, FormSelect, PageHeader, StatusBadge } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Power } from 'lucide-react';
import { useState } from 'react';

const NAMA_ROLE = { admin: 'Admin', pemdes: 'Pemdes', pelaksana: 'Pelaksana' };

export default function Index({ users, filter }) {
    const sayaId = usePage().props.auth.user.id;
    const [q, setQ] = useState(filter.q ?? '');
    const cari = (extra = {}) => router.get(route('admin.users.index'), { q: q || undefined, role: filter.role, ...extra }, { preserveState: true });

    const kolom = [
        { key: 'nama_lengkap', header: 'Nama', primary: true },
        { key: 'status_aktif', header: 'Status', badge: true, render: (u) => <StatusBadge status={u.status_aktif ? 'Selesai' : 'Nonaktif'} label={u.status_aktif ? 'Aktif' : 'Nonaktif'} /> },
        { key: 'username', header: 'Username' },
        { key: 'email', header: 'Email', hideBelow: 'lg' },
        { key: 'role', header: 'Role', render: (u) => NAMA_ROLE[u.role] ?? u.role },
    ];

    return (
        <AuthenticatedLayout title="Manajemen User" hideTitle>
            <PageHeader title="Manajemen user" description="Kelola akun admin, Pemdes, dan pelaksana." actions={<Button href={route('admin.users.create')} icon={Plus}>Tambah user</Button>} />

            <BentoGrid>
                <DataTable
                    columns={kolom}
                    rows={users.data}
                    paginator={users}
                    empty={{ title: 'Tidak ada akun yang cocok' }}
                    toolbar={(
                        <FilterBar activeCount={(filter.q ? 1 : 0) + (filter.role ? 1 : 0)} onSubmit={() => cari()} onReset={() => router.get(route('admin.users.index'))}>
                            <FormInput aria-label="Cari akun" placeholder="Cari nama, username, atau email" value={q} onChange={(e) => setQ(e.target.value)} className="lg:w-72" />
                            <FormSelect aria-label="Filter role" value={filter.role ?? ''} onChange={(e) => cari({ role: e.target.value || undefined })} className="lg:w-44">
                                <option value="">Semua role</option>
                                {['admin', 'pemdes', 'pelaksana'].map((r) => <option key={r} value={r}>{NAMA_ROLE[r]}</option>)}
                            </FormSelect>
                        </FilterBar>
                    )}
                    actions={(u) => [
                        { label: 'Ubah', icon: Pencil, href: route('admin.users.edit', u.id) },
                        ...(u.id !== sayaId
                            ? [{
                                label: u.status_aktif ? 'Nonaktifkan' : 'Aktifkan',
                                icon: Power,
                                danger: Boolean(u.status_aktif),
                                confirm: u.status_aktif ? { title: `Nonaktifkan ${u.nama_lengkap}?`, description: 'Akun tidak dapat masuk sampai diaktifkan kembali.', confirmLabel: 'Nonaktifkan' } : undefined,
                                onClick: () => router.patch(route('admin.users.status', u.id), {}, { preserveScroll: true }),
                            }]
                            : []),
                    ]}
                />
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
