import { BentoCard, BentoGrid, Button, ChartCard, EmptyState, KpiCard, PageHeader } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { WARNA_CHART, potongLabel } from '@/chartSetup';
import { Bar, Doughnut } from 'react-chartjs-2';

const WARNA = { Menunggu: WARNA_CHART.muda, Disetujui: WARNA_CHART.gelap, Ditolak: WARNA_CHART.merah };

export default function Dashboard({ proyek = [], statusLaporan = [], perluRevisi = [] }) {
    const aktif = proyek.filter((p) => p.status_proyek !== 'Selesai').length;
    const totalLaporan = statusLaporan.reduce((n, s) => n + s.jumlah, 0);
    // Tinggi mengikuti jumlah proyek tetapi dibatasi; di atas batas, kartu menggulir internal.
    const tinggi = Math.max(240, proyek.length * 48);

    return (
        <AuthenticatedLayout title="Dashboard Pelaksana" hideTitle>
            <PageHeader title="Dashboard" description="Progres proyek yang ditugaskan dan status laporan Anda." />

            <BentoGrid>
                <KpiCard span="kpi3" label="Proyek ditugaskan" value={proyek.length} />
                <KpiCard span="kpi3" label="Proyek aktif" value={aktif} />
                <KpiCard span="kpi3" label="Perlu revisi" value={perluRevisi.length} tone={perluRevisi.length ? 'critical' : 'default'} />

                <BentoCard span="chart" title="Progres fisik per proyek" description="Aktual dibanding target (%)">
                    {proyek.length === 0 ? (
                        <EmptyState title="Belum ada proyek yang ditugaskan" />
                    ) : (
                        <div className="max-h-[480px] overflow-y-auto">
                            <div role="img" aria-label="Grafik progres fisik aktual dan target per proyek" className="relative w-full" style={{ height: tinggi }}>
                                <Bar
                                    data={{
                                        labels: proyek.map((p) => p.nama_proyek),
                                        datasets: [
                                            { label: 'Aktual', data: proyek.map((p) => Number(p.progres_aktual)), backgroundColor: proyek.map((p) => (p.status_proyek === 'Terlambat' ? WARNA_CHART.merah : WARNA_CHART.gelap)), maxBarThickness: 16 },
                                            { label: 'Target', data: proyek.map((p) => Number(p.target_progres)), backgroundColor: WARNA_CHART.muda, maxBarThickness: 16 },
                                        ],
                                    }}
                                    options={{
                                        indexAxis: 'y',
                                        scales: { x: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } }, y: { grid: { display: false }, ticks: { callback(v) { return potongLabel(this.getLabelForValue(v), 18); } } } },
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </BentoCard>

                <ChartCard
                    span="list"
                    title="Status laporan"
                    label={`Status ${totalLaporan} laporan`}
                    center={totalLaporan > 0 && <span className="text-center"><span className="block font-display text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{totalLaporan}</span><span className="text-xs text-slate-500">laporan</span></span>}
                >
                    {totalLaporan === 0 ? <EmptyState title="Belum ada laporan" /> : (
                        <Doughnut data={{ labels: statusLaporan.map((s) => s.status), datasets: [{ data: statusLaporan.map((s) => s.jumlah), backgroundColor: statusLaporan.map((s) => WARNA[s.status] ?? WARNA_CHART.tengah) }] }} />
                    )}
                </ChartCard>

                <BentoCard span="full" title="Laporan perlu revisi" description="Ditolak Pemdes. Perbaiki lalu kirim ulang.">
                    {perluRevisi.length === 0 ? (
                        <EmptyState title="Tidak ada laporan ditolak" />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {perluRevisi.map((l) => (
                                <li key={l.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                                    <span className="min-w-0 truncate text-sm font-medium text-slate-900">{l.proyek.nama_proyek}</span>
                                    <Button size="sm" variant="secondary" href={route('pelaksana.laporan.edit', l.id)}>Perbaiki</Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </BentoCard>
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
