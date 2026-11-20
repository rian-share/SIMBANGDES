import FormTransaksi from '@/Components/FormTransaksi';
import { BentoCard, BentoGrid, DataTable, EmptyState, FilterBar, FormInput, FormSelect, PageHeader, formatRupiah, formatTanggal } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, router } from '@inertiajs/react';
import { Paperclip, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function Pengeluaran({ transaksi, filter = {}, proyekPilihan = [], namaKomponen = [] }) {
    const [f, setF] = useState({ proyek: filter.proyek ?? '', komponen: filter.komponen ?? '', dari: filter.dari ?? '', sampai: filter.sampai ?? '' });
    const [diubah, setDiubah] = useState(null);
    const [proyekForm, setProyekForm] = useState(filter.proyek ?? '');

    const terapkan = () => router.get(route('pemdes.keuangan.pengeluaran'), Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '')), { preserveState: true });
    const ubahF = (k) => (e) => setF({ ...f, [k]: e.target.value });
    const proyekAktif = diubah ? String(diubah.anggaran.proyek_id) : proyekForm;
    const komponenForm = proyekPilihan.find((p) => String(p.id) === String(proyekAktif))?.komponen ?? [];

    const kolom = [
        { key: 'tanggal_transaksi', header: 'Tanggal', render: (t) => <span className="whitespace-nowrap">{formatTanggal(t.tanggal_transaksi)}</span> },
        {
            key: 'uraian',
            header: 'Keterangan',
            primary: true,
            render: (t) => (
                <span>
                    {t.uraian}
                    {t.bukti_transaksi && <a href={`/storage/${t.bukti_transaksi}`} target="_blank" rel="noreferrer" aria-label="Lihat bukti" className="ml-2 inline-block align-middle text-slate-500 hover:text-red-600"><Paperclip className="h-3.5 w-3.5" /></a>}
                </span>
            ),
        },
        { key: 'proyek', header: 'Proyek', render: (t) => <Link href={route('pemdes.proyek.show', t.anggaran.proyek_id)} className="hover:text-red-600">{t.anggaran.proyek.nama_proyek}</Link> },
        { key: 'komponen', header: 'Jenis', render: (t) => t.komponen?.nama_komponen ?? 'Tanpa komponen' },
        { key: 'nominal', header: 'Nominal', align: 'right', render: (t) => formatRupiah(t.nominal) },
    ];

    return (
        <AuthenticatedLayout title="Keuangan — Pengeluaran" hideTitle>
            <PageHeader title="Pengeluaran" description="Catat dan telusuri transaksi pengeluaran seluruh proyek." />

            <BentoGrid>
                <DataTable
                    span="hero"
                    columns={kolom}
                    rows={transaksi.data}
                    paginator={transaksi}
                    empty={{ title: 'Belum ada pengeluaran', description: 'Ubah filter atau catat pengeluaran baru.' }}
                    toolbar={(
                        <FilterBar activeCount={Object.values(filter).filter(Boolean).length} onSubmit={terapkan} onReset={() => router.get(route('pemdes.keuangan.pengeluaran'))}>
                            <FormSelect aria-label="Proyek" value={f.proyek} onChange={ubahF('proyek')} className="lg:w-52">
                                <option value="">Semua proyek</option>
                                {proyekPilihan.map((p) => <option key={p.id} value={p.id}>{p.nama_proyek}</option>)}
                            </FormSelect>
                            <FormSelect aria-label="Jenis pengeluaran" value={f.komponen} onChange={ubahF('komponen')} className="lg:w-44">
                                <option value="">Semua jenis</option>
                                {namaKomponen.map((n) => <option key={n}>{n}</option>)}
                                <option value="_tanpa">Tanpa komponen</option>
                            </FormSelect>
                            <FormInput aria-label="Dari tanggal" type="date" value={f.dari} onChange={ubahF('dari')} className="lg:w-40" />
                            <FormInput aria-label="Sampai tanggal" type="date" value={f.sampai} onChange={ubahF('sampai')} className="lg:w-40" />
                        </FilterBar>
                    )}
                    actions={(t) => [
                        { label: 'Ubah', icon: Pencil, onClick: () => setDiubah(t) },
                        { label: 'Hapus', icon: Trash2, danger: true, confirm: { title: 'Hapus transaksi ini?', description: 'Realisasi anggaran dihitung ulang.' }, onClick: () => router.delete(route('pemdes.transaksi.destroy', t.id), { preserveScroll: true }) },
                    ]}
                />

                <BentoCard span="highlight" title={diubah ? 'Ubah pengeluaran' : 'Catat pengeluaran'} className="lg:sticky lg:top-20 lg:self-start">
                    <FormSelect id="proyek_form" label="Proyek" value={proyekAktif} disabled={diubah !== null} onChange={(e) => setProyekForm(e.target.value)} className="mb-5">
                        <option value="">Pilih proyek…</option>
                        {proyekPilihan.map((p) => <option key={p.id} value={p.id}>{p.nama_proyek}</option>)}
                    </FormSelect>
                    {proyekAktif
                        ? <FormTransaksi key={`${diubah?.id ?? 'baru'}-${proyekAktif}`} proyekId={proyekAktif} komponen={komponenForm} transaksi={diubah} onSelesai={() => setDiubah(null)} />
                        : <EmptyState title="Pilih proyek" description="Pilih proyek untuk mencatat pengeluaran." />}
                </BentoCard>
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
