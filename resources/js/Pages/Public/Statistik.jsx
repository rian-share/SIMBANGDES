import { BentoCard, BentoGrid, Button, ChartCard, EmptyState, KpiCard, Money, PageHeader, ProgressBar, formatPersen, formatRupiah } from '@/Components/UI';
import PublicLayout from '@/Layouts/PublicLayout';
import { WARNA_CHART, potongLabel, tickRupiah } from '@/chartSetup';
import { Bar, Doughnut } from 'react-chartjs-2';

const WARNA_STATUS = {
    Perencanaan: WARNA_CHART.pudar,
    Berjalan: WARNA_CHART.gelap,
    Terlambat: WARNA_CHART.merah,
    Selesai: WARNA_CHART.muda,
};

export default function Statistik({ ringkasan, uang, kategori = [], tren = [], status = {}, pengaduan }) {
    const pagu = Number(uang.pagu);
    const serapan = pagu > 0 ? Math.round((Number(uang.realisasi) / pagu) * 1000) / 10 : 0;
    const kosong = Number(ringkasan.jumlah_proyek) === 0;
    const statusLabel = Object.keys(status);
    const totalStatus = Object.values(status).reduce((a, b) => a + Number(b), 0);

    return (
        <PublicLayout title="Statistik Pembangunan">
            <PageHeader eyebrow="Statistik" title="Angka pembangunan desa" description="Ringkasan proyek, serapan anggaran, dan penanganan pengaduan. Hanya proyek yang dipublikasikan yang dihitung." />

            <BentoGrid>
                <div className="grid grid-cols-2 gap-5 md:col-span-6 lg:col-span-12 lg:grid-cols-4">
                    <KpiCard label="Proyek publik" value={ringkasan.jumlah_proyek} />
                    <KpiCard label="Total pagu" title={formatRupiah(uang.pagu)}><Money value={uang.pagu} ringkas /></KpiCard>
                    <KpiCard label="Serapan total" hint={formatRupiah(uang.realisasi, { ringkas: true })} value={formatPersen(serapan)} />
                    <KpiCard label="Rata-rata progres fisik" value={formatPersen(ringkasan.rata_progres)} />
                </div>

                <ChartCard span="chart" title="Tren serapan per tahun anggaran" description={tren.length === 1 ? 'Data 1 tahun anggaran' : 'Pagu, realisasi, dan persentase serapan'} label="Grafik tren pagu, realisasi, dan serapan per tahun anggaran">
                    {tren.length === 0 ? <EmptyState title="Belum ada data anggaran" /> : (
                        <Bar
                            data={{
                                labels: tren.map((t) => `TA ${t.tahun_anggaran}`),
                                datasets: [
                                    { label: 'Pagu', data: tren.map((t) => Number(t.pagu)), backgroundColor: WARNA_CHART.muda, yAxisID: 'y' },
                                    { label: 'Realisasi', data: tren.map((t) => Number(t.realisasi)), backgroundColor: WARNA_CHART.gelap, yAxisID: 'y' },
                                    { type: 'line', label: 'Serapan (%)', data: tren.map((t) => Number(t.persen_serapan)), borderColor: WARNA_CHART.merah, backgroundColor: WARNA_CHART.merah, yAxisID: 'y1', pointRadius: 3 },
                                ],
                            }}
                            options={{
                                scales: {
                                    y: { ticks: { callback: tickRupiah }, beginAtZero: true },
                                    y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, ticks: { callback: (v) => `${v}%` } },
                                },
                                plugins: { tooltip: { callbacks: { label: (c) => (c.dataset.yAxisID === 'y1' ? `${c.dataset.label}: ${c.parsed.y}%` : `${c.dataset.label}: ${formatRupiah(c.parsed.y)}`) } } },
                            }}
                        />
                    )}
                </ChartCard>

                <ChartCard
                    span="list"
                    title="Status proyek"
                    label={`Status ${totalStatus} proyek`}
                    center={!kosong && <span className="text-center"><span className="block font-display text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{totalStatus}</span><span className="text-xs text-slate-500">proyek</span></span>}
                >
                    {kosong ? <EmptyState title="Belum ada proyek" /> : (
                        <Doughnut data={{ labels: statusLabel, datasets: [{ data: statusLabel.map((s) => Number(status[s])), backgroundColor: statusLabel.map((s) => WARNA_STATUS[s] ?? WARNA_CHART.tengah) }] }} />
                    )}
                </ChartCard>

                <ChartCard span="chart" title="Proyek per kategori" label="Grafik jumlah proyek per kategori">
                    {kategori.length === 0 ? <EmptyState title="Belum ada proyek" /> : (
                        <Bar
                            data={{ labels: kategori.map((k) => k.label), datasets: [{ label: 'Jumlah proyek', data: kategori.map((k) => Number(k.jumlah)), backgroundColor: WARNA_CHART.gelap }] }}
                            options={{
                                indexAxis: 'y',
                                plugins: { legend: { display: false } },
                                scales: { y: { grid: { display: false }, ticks: { callback(v) { return potongLabel(this.getLabelForValue(v)); } } }, x: { ticks: { precision: 0 }, beginAtZero: true } },
                            }}
                        />
                    )}
                </ChartCard>

                <BentoCard span="list" title="Penanganan pengaduan" description={`${pengaduan.total} pengaduan masuk`}>
                    {pengaduan.total === 0 ? <EmptyState title="Belum ada pengaduan" /> : (
                        <>
                            <p className="font-display text-5xl font-semibold tracking-tight tabular-nums text-slate-900">{formatPersen(pengaduan.tingkat_selesai)}</p>
                            <p className="mt-1 text-sm text-slate-500">{pengaduan.rincian.Selesai} dari {pengaduan.total} pengaduan selesai ditangani</p>
                            <ul className="mt-6 space-y-4">
                                {Object.entries(pengaduan.rincian).map(([nama, jumlah]) => (
                                    <li key={nama}>
                                        <div className="flex justify-between text-sm"><span className="text-slate-600">{nama}</span><span className="font-medium tabular-nums text-slate-900">{jumlah}</span></div>
                                        <ProgressBar value={(Number(jumlah) / pengaduan.total) * 100} danger={nama === 'Ditolak'} className="mt-1.5" />
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    <Button href={route('pengaduan.create')} variant="secondary" className="mt-6 w-full">Sampaikan pengaduan</Button>
                </BentoCard>
            </BentoGrid>
        </PublicLayout>
    );
}
