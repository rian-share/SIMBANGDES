import GrafikRencanaRealisasi from '@/Components/GrafikRencanaRealisasi';
import Selisih from '@/Components/Selisih';
import { BentoCard, BentoGrid, DataTable, EmptyState, FormSelect, KpiCard, Money, PageHeader, formatPersen, formatRupiah } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, router } from '@inertiajs/react';
import { Banknote, ClipboardList, Scale } from 'lucide-react';

const persen = (realisasi, rencana) => (Number(rencana) > 0 ? formatPersen(Math.round((Number(realisasi) / Number(rencana)) * 100)) : '—');

export default function RencanaRealisasi({ data, proyekPilihan = [], filter = {} }) {
    const pilih = (e) => router.get(route('pemdes.keuangan.rencana-realisasi'), e.target.value ? { proyek: e.target.value } : {}, { preserveState: true });
    const { baris, total } = data;

    const kolom = [
        { key: 'komponen', header: 'Komponen', primary: true },
        { key: 'rencana', header: 'Rencana', align: 'right', render: (b) => formatRupiah(b.rencana) },
        { key: 'realisasi', header: 'Realisasi', align: 'right', render: (b) => formatRupiah(b.realisasi) },
        { key: 'selisih', header: 'Selisih', align: 'right', render: (b) => <Selisih value={b.selisih} /> },
        { key: 'persen', header: 'Terhadap rencana', align: 'right', hideBelow: 'lg', render: (b) => persen(b.realisasi, b.rencana) },
    ];

    return (
        <AuthenticatedLayout title="Keuangan — Rencana vs Realisasi" hideTitle>
            <PageHeader
                title="Rencana vs realisasi"
                description="Perbandingan rencana dan realisasi biaya per komponen. Selisih positif berarti melebihi rencana."
                actions={(
                    <FormSelect aria-label="Cakupan" value={filter.proyek ?? ''} onChange={pilih} className="w-full sm:w-72">
                        <option value="">Rekap seluruh desa</option>
                        {proyekPilihan.map((p) => <option key={p.id} value={p.id}>{p.nama_proyek}</option>)}
                    </FormSelect>
                )}
            />

            <BentoGrid>
                <KpiCard span="kpi3" label="Total rencana" icon={ClipboardList}><Money value={total.rencana} ringkas /></KpiCard>
                <KpiCard span="kpi3" label="Total realisasi" icon={Banknote}><Money value={total.realisasi} ringkas /></KpiCard>
                <KpiCard span="kpi3" label="Selisih total" icon={Scale}><Selisih value={total.selisih} className="!text-xl md:!text-2xl" /></KpiCard>

                {baris.length === 0 ? (
                    <BentoCard span="full">
                        <EmptyState title="Belum ada rincian komponen rencana" action={filter.proyek ? <Link href={route('pemdes.anggaran.show', filter.proyek)} className="text-[13px] font-medium text-slate-900 underline underline-offset-4">Tambah komponen</Link> : null} />
                    </BentoCard>
                ) : (
                    <>
                        <BentoCard span="chart" title="Perbandingan per komponen" description="Batang merah: realisasi melebihi rencana">
                            <GrafikRencanaRealisasi baris={baris} />
                        </BentoCard>
                        <DataTable span="list" title="Rincian" columns={kolom} rows={[...baris, { komponen: 'Total', ...total }]} rowKey="komponen" />
                    </>
                )}
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
