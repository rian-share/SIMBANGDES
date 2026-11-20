import { BentoGrid, ChartCard, DataTable, KpiCard, Money, PageHeader, ProgressBar, formatPersen, formatRupiah } from '@/Components/UI';
import PublicLayout from '@/Layouts/PublicLayout';
import { WARNA_CHART, potongLabel, tickRupiah } from '@/chartSetup';
import { Link } from '@inertiajs/react';
import { Bar, Doughnut } from 'react-chartjs-2';

const TOP = 10;

export default function Transparansi({ total, rincian = [] }) {
    const pagu = Number(total.pagu);
    const serapan = pagu > 0 ? Math.round((Number(total.realisasi) / pagu) * 1000) / 10 : 0;
    const teratas = rincian.slice(0, TOP); // rincian sudah terurut pagu terbesar dari controller

    const kolom = [
        { key: 'proyek', header: 'Proyek', primary: true, render: (r) => <Link href={route('proyek.publik.show', r.proyek_id)} className="hover:text-red-600">{r.proyek.nama_proyek}</Link> },
        { key: 'tahun_anggaran', header: 'TA' },
        { key: 'pagu_anggaran', header: 'Pagu', align: 'right', render: (r) => formatRupiah(r.pagu_anggaran) },
        { key: 'total_realisasi', header: 'Realisasi', align: 'right', render: (r) => formatRupiah(r.total_realisasi) },
        {
            key: 'serapan',
            header: 'Serapan',
            className: 'w-44',
            render: (r) => (
                <div className="flex items-center gap-3">
                    <ProgressBar value={r.persentase_serapan} danger={Number(r.persentase_serapan) >= 100} className="flex-1" />
                    <span className="w-12 text-right text-xs tabular-nums text-slate-700">{formatPersen(r.persentase_serapan)}</span>
                </div>
            ),
        },
    ];

    return (
        <PublicLayout title="Transparansi Anggaran">
            <PageHeader eyebrow="Anggaran" title="Transparansi anggaran" description="Pagu dan realisasi seluruh proyek yang dipublikasikan." />

            <BentoGrid>
                <KpiCard span="kpi3" label="Total pagu"><Money value={total.pagu} /></KpiCard>
                <KpiCard span="kpi3" label="Realisasi" hint={`Serapan ${formatPersen(serapan)}`}><Money value={total.realisasi} /></KpiCard>
                <KpiCard span="kpi3" label="Sisa anggaran"><Money value={total.sisa} /></KpiCard>

                <ChartCard span="chart" title="Pagu vs realisasi" description={`${teratas.length} proyek dengan pagu terbesar`} label="Grafik batang pagu dan realisasi per proyek">
                    <Bar
                        data={{
                            labels: teratas.map((r) => r.proyek.nama_proyek),
                            datasets: [
                                { label: 'Pagu', data: teratas.map((r) => Number(r.pagu_anggaran)), backgroundColor: WARNA_CHART.muda },
                                // Merah hanya bila realisasi sudah menyentuh pagu.
                                { label: 'Realisasi', data: teratas.map((r) => Number(r.total_realisasi)), backgroundColor: teratas.map((r) => (Number(r.total_realisasi) >= Number(r.pagu_anggaran) && Number(r.pagu_anggaran) > 0 ? WARNA_CHART.merah : WARNA_CHART.gelap)) },
                            ],
                        }}
                        options={{
                            scales: { x: { ticks: { callback(v) { return potongLabel(this.getLabelForValue(v)); } } }, y: { beginAtZero: true, ticks: { callback: tickRupiah } } },
                            plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatRupiah(c.parsed.y)}` } } },
                        }}
                    />
                </ChartCard>

                <ChartCard
                    span="list"
                    title="Serapan total"
                    description="Realisasi dibanding sisa"
                    height="h-64 md:h-72"
                    label={`Serapan total ${formatPersen(serapan)}`}
                    center={<span className="text-center"><span className="block font-display text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{formatPersen(serapan)}</span><span className="text-xs text-slate-500">terserap</span></span>}
                >
                    <Doughnut
                        data={{ labels: ['Realisasi', 'Sisa'], datasets: [{ data: [Number(total.realisasi), Number(total.sisa)], backgroundColor: [WARNA_CHART.gelap, WARNA_CHART.muda] }] }}
                        options={{ plugins: { tooltip: { callbacks: { label: (c) => `${c.label}: ${formatRupiah(c.parsed)}` } } } }}
                    />
                </ChartCard>

                <DataTable
                    title="Rincian serapan per proyek"
                    columns={kolom}
                    rows={rincian}
                    rowKey="id"
                    empty={{ title: 'Belum ada data anggaran' }}
                />
            </BentoGrid>
        </PublicLayout>
    );
}
