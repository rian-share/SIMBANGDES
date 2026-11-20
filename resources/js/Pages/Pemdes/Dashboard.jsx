import { BentoCard, BentoGrid, Button, ChartCard, EmptyState, KpiCard, Money, PageHeader, StatusBadge, formatPersen, formatRupiah } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { WARNA_CHART, potongLabel, tickRupiah } from '@/chartSetup';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';

const WARNA_STATUS = { Perencanaan: WARNA_CHART.pudar, Berjalan: WARNA_CHART.gelap, Selesai: WARNA_CHART.muda, Terlambat: WARNA_CHART.merah };
const tautan = 'inline-flex items-center gap-1 text-[13px] font-medium text-slate-600 hover:text-slate-900';

export default function Dashboard({ kpi, statusProyek = [], anggaranPerProyek = [], laporanMenunggu = [], proyekBerisiko = [] }) {
    const serapan = Number(kpi.pagu) > 0 ? Math.round((Number(kpi.realisasi) / Number(kpi.pagu)) * 1000) / 10 : 0;

    return (
        <AuthenticatedLayout title="Dashboard Pemdes" hideTitle>
            <PageHeader title="Dashboard" description="Ringkasan proyek, anggaran, dan pekerjaan yang menunggu tindakan." />

            <BentoGrid>
                <div className="grid grid-cols-2 gap-5 md:col-span-6 lg:col-span-12 lg:grid-cols-4">
                    <KpiCard label="Total proyek" value={kpi.total} hint={`${kpi.berjalan} berjalan · ${kpi.selesai} selesai`} />
                    <KpiCard label="Terlambat" value={kpi.terlambat} tone={Number(kpi.terlambat) > 0 ? 'critical' : 'default'} />
                    <KpiCard label="Total pagu" title={formatRupiah(kpi.pagu)} hint={`Sisa ${formatRupiah(kpi.sisa, { ringkas: true })}`}><Money value={kpi.pagu} ringkas /></KpiCard>
                    <KpiCard label="Serapan anggaran" value={formatPersen(serapan)} hint={`Realisasi ${formatRupiah(kpi.realisasi, { ringkas: true })}`} />
                </div>

                <ChartCard span="chart" title="Pagu vs realisasi" description="10 proyek dengan pagu terbesar" label="Grafik batang pagu dan realisasi per proyek">
                    <Bar
                        data={{
                            labels: anggaranPerProyek.map((a) => a.nama),
                            datasets: [
                                { label: 'Pagu', data: anggaranPerProyek.map((a) => Number(a.pagu)), backgroundColor: WARNA_CHART.muda },
                                { label: 'Realisasi', data: anggaranPerProyek.map((a) => Number(a.realisasi)), backgroundColor: anggaranPerProyek.map((a) => (Number(a.pagu) > 0 && Number(a.realisasi) >= Number(a.pagu) ? WARNA_CHART.merah : WARNA_CHART.gelap)) },
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
                    title="Status proyek"
                    label={`Status ${kpi.total} proyek`}
                    center={<span className="text-center"><span className="block font-display text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{kpi.total}</span><span className="text-xs text-slate-500">proyek</span></span>}
                >
                    <Doughnut data={{ labels: statusProyek.map((s) => s.status), datasets: [{ data: statusProyek.map((s) => s.jumlah), backgroundColor: statusProyek.map((s) => WARNA_STATUS[s.status] ?? WARNA_CHART.tengah) }] }} />
                </ChartCard>

                <BentoCard
                    span="chart"
                    title="Laporan menunggu verifikasi"
                    action={<Link href={route('pemdes.laporan.index', { status: 'Menunggu' })} className={tautan}>Lihat semua <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
                >
                    {laporanMenunggu.length === 0 ? (
                        <EmptyState title="Tidak ada laporan menunggu" />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {laporanMenunggu.map((l) => (
                                <li key={l.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium text-slate-900">{l.proyek.nama_proyek}</span>
                                        <span className="block truncate text-xs text-slate-500">{l.pelaksana.nama_lengkap} · {formatPersen(l.persentase_fisik)}</span>
                                    </span>
                                    <Button size="sm" variant="secondary" href={route('pemdes.laporan.index', { status: 'Menunggu' })}>Tinjau</Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </BentoCard>

                <BentoCard
                    span="list"
                    title="Proyek berisiko"
                    action={<Link href={route('pemdes.monitoring')} className={tautan}>Monitoring <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
                >
                    {proyekBerisiko.length === 0 ? (
                        <EmptyState title="Tidak ada proyek berisiko" />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {proyekBerisiko.map((p) => (
                                <li key={p.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                                    <span className="min-w-0">
                                        <Link href={route('pemdes.proyek.show', p.id)} className="block truncate text-sm font-medium text-slate-900 hover:text-red-600">{p.nama_proyek}</Link>
                                        <span className="block text-xs tabular-nums text-slate-500">Deviasi {p.deviasi}%</span>
                                    </span>
                                    <StatusBadge status={p.risiko} />
                                </li>
                            ))}
                        </ul>
                    )}
                </BentoCard>
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
