import FormTransaksi from '@/Components/FormTransaksi';
import Selisih from '@/Components/Selisih';
import { BentoCard, BentoGrid, Button, DataTable, FormInput, KpiCard, Money, PageHeader, ProgressBar, StatusBadge, formatPersen, formatRupiah, formatTanggal } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router, useForm } from '@inertiajs/react';
import { Paperclip, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function Show({ proyek, anggaran, transaksi = [], komponen = [], rencana = { baris: [], total: { rencana: '0' } } }) {
    const [diubah, setDiubah] = useState(null);
    const [komponenDiubah, setKomponenDiubah] = useState(null);
    const pagu = useForm({ sumber_dana: anggaran.sumber_dana, pagu_anggaran: anggaran.pagu_anggaran });
    const formKomponen = useForm({ nama_komponen: '', nominal_rencana: '' });
    const serapan = Number(anggaran.persentase_serapan);
    const realisasiKomponen = Object.fromEntries(rencana.baris.map((b) => [b.komponen, b]));
    const belumDialokasi = Number(anggaran.pagu_anggaran) - Number(rencana.total.rencana);

    const simpanKomponen = (e) => {
        e.preventDefault();
        const opsi = { preserveScroll: true, onSuccess: () => { formKomponen.reset(); setKomponenDiubah(null); } };
        if (komponenDiubah) {
            formKomponen.patch(route('pemdes.komponen.update', komponenDiubah.id), opsi);
        } else {
            formKomponen.post(route('pemdes.komponen.store', proyek.id), opsi);
        }
    };

    const kolomTransaksi = [
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
        { key: 'komponen', header: 'Komponen', render: (t) => t.komponen?.nama_komponen ?? 'Tanpa komponen' },
        { key: 'nominal', header: 'Nominal', align: 'right', render: (t) => formatRupiah(t.nominal) },
    ];
    const kolomKomponen = [
        { key: 'nama_komponen', header: 'Komponen', primary: true },
        { key: 'nominal_rencana', header: 'Rencana', align: 'right', render: (k) => formatRupiah(k.nominal_rencana) },
        { key: 'realisasi', header: 'Realisasi', align: 'right', render: (k) => formatRupiah(realisasiKomponen[k.nama_komponen]?.realisasi ?? 0) },
        { key: 'selisih', header: 'Selisih', align: 'right', render: (k) => <Selisih value={realisasiKomponen[k.nama_komponen]?.selisih ?? 0} /> },
    ];

    return (
        <AuthenticatedLayout title={`Anggaran — ${proyek.nama_proyek}`} hideTitle>
            <PageHeader
                back={{ href: route('pemdes.keuangan.anggaran'), label: 'Anggaran' }}
                eyebrow="Anggaran proyek"
                title={proyek.nama_proyek}
                description={`Tahun anggaran ${anggaran.tahun_anggaran} · ${anggaran.sumber_dana}`}
                actions={<StatusBadge status={proyek.status_proyek} />}
            />

            <BentoGrid>
                <BentoCard span="hero" title="Ringkasan anggaran">
                    <div className="grid gap-5 sm:grid-cols-3">
                        <div><p className="text-[13px] text-slate-500">Pagu</p><p className="mt-1 text-xl font-semibold tracking-tight text-slate-900"><Money value={anggaran.pagu_anggaran} /></p></div>
                        <div><p className="text-[13px] text-slate-500">Realisasi</p><p className="mt-1 text-xl font-semibold tracking-tight text-slate-900"><Money value={anggaran.total_realisasi} /></p></div>
                        <div><p className="text-[13px] text-slate-500">Sisa</p><p className="mt-1 text-xl font-semibold tracking-tight text-slate-900"><Money value={anggaran.sisa_anggaran} /></p></div>
                    </div>
                    <ProgressBar value={serapan} danger={serapan >= 100} className="mt-6 !h-2.5" />
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><span className="tabular-nums">Serapan {formatPersen(serapan)}</span>{serapan >= 85 && <StatusBadge status="Waspada" />}</p>
                </BentoCard>

                <BentoCard span="highlight" title="Ubah pagu">
                    <form onSubmit={(e) => { e.preventDefault(); pagu.patch(route('pemdes.anggaran.update', proyek.id), { preserveScroll: true }); }} className="space-y-5">
                        <FormInput id="sumber_dana" label="Sumber dana" value={pagu.data.sumber_dana} onChange={(e) => pagu.setData('sumber_dana', e.target.value)} error={pagu.errors.sumber_dana} />
                        <FormInput id="pagu_anggaran" label="Pagu anggaran" prefix="Rp" type="number" step="0.01" inputMode="decimal" value={pagu.data.pagu_anggaran} onChange={(e) => pagu.setData('pagu_anggaran', e.target.value)} error={pagu.errors.pagu_anggaran} />
                        <Button type="submit" disabled={pagu.processing}>Simpan pagu</Button>
                    </form>
                </BentoCard>

                <DataTable
                    span="hero"
                    title="Transaksi pengeluaran"
                    columns={kolomTransaksi}
                    rows={transaksi}
                    empty={{ title: 'Belum ada transaksi' }}
                    actions={(t) => [
                        { label: 'Ubah', icon: Pencil, onClick: () => setDiubah(t) },
                        { label: 'Hapus', icon: Trash2, danger: true, confirm: { title: 'Hapus transaksi ini?', description: 'Realisasi anggaran dihitung ulang.' }, onClick: () => router.delete(route('pemdes.transaksi.destroy', t.id), { preserveScroll: true }) },
                    ]}
                />

                <BentoCard span="highlight" title={diubah ? 'Ubah pengeluaran' : 'Catat pengeluaran'}>
                    <FormTransaksi key={diubah?.id ?? 'baru'} proyekId={proyek.id} komponen={komponen} transaksi={diubah} onSelesai={() => setDiubah(null)} />
                </BentoCard>

                <DataTable
                    span="chart"
                    title="Rincian komponen rencana"
                    description={`Belum dialokasikan: ${formatRupiah(belumDialokasi)}`}
                    columns={kolomKomponen}
                    rows={komponen}
                    empty={{ title: 'Belum ada rincian komponen rencana' }}
                    actions={(k) => [
                        { label: 'Ubah', icon: Pencil, onClick: () => { setKomponenDiubah(k); formKomponen.setData({ nama_komponen: k.nama_komponen, nominal_rencana: k.nominal_rencana }); } },
                        { label: 'Hapus', icon: Trash2, danger: true, confirm: { title: `Hapus komponen "${k.nama_komponen}"?` }, onClick: () => router.delete(route('pemdes.komponen.destroy', k.id), { preserveScroll: true }) },
                    ]}
                />

                <BentoCard span="list" title={komponenDiubah ? 'Ubah komponen' : 'Tambah komponen'}>
                    <form onSubmit={simpanKomponen} className="space-y-5">
                        <FormInput id="nama_komponen" label="Nama komponen" list="saran-komponen" value={formKomponen.data.nama_komponen} onChange={(e) => formKomponen.setData('nama_komponen', e.target.value)} error={formKomponen.errors.nama_komponen} />
                        <datalist id="saran-komponen">{['Material', 'Tenaga Kerja', 'Transportasi', 'Peralatan', 'Lain-lain'].map((n) => <option key={n} value={n} />)}</datalist>
                        <FormInput id="nominal_rencana" label="Nominal rencana" prefix="Rp" type="number" step="0.01" inputMode="decimal" value={formKomponen.data.nominal_rencana} onChange={(e) => formKomponen.setData('nominal_rencana', e.target.value)} error={formKomponen.errors.nominal_rencana} />
                        <div className="flex gap-2">
                            <Button type="submit" disabled={formKomponen.processing}>{komponenDiubah ? 'Perbarui' : 'Tambah komponen'}</Button>
                            {komponenDiubah && <Button variant="secondary" onClick={() => { setKomponenDiubah(null); formKomponen.reset(); }}>Batal</Button>}
                        </div>
                    </form>
                </BentoCard>
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
