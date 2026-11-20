import { BentoGrid, ChartCard, DataTable, KpiCard, PageHeader, formatTanggalWaktu } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { WARNA_CHART } from '@/chartSetup';
import { Link } from '@inertiajs/react';
import { Doughnut, Line } from 'react-chartjs-2';

const WARNA_ROLE = { admin: WARNA_CHART.gelap, pemdes: WARNA_CHART.tengah, pelaksana: WARNA_CHART.muda };

export default function Dashboard({ kpi, loginHarian = [], userPerRole = [], logTerbaru = [] }) {
    const kolom = [
        { key: 'created_at', header: 'Waktu', render: (l) => <span className="whitespace-nowrap tabular-nums">{formatTanggalWaktu(l.created_at)}</span> },
        { key: 'user', header: 'User', render: (l) => l.user?.nama_lengkap ?? 'Sistem' },
        { key: 'aktivitas', header: 'Aktivitas', primary: true, render: (l) => <span className="break-words">{l.aktivitas}</span> },
    ];

    return (
        <AuthenticatedLayout title="Dashboard Admin" hideTitle>
            <PageHeader title="Dashboard" description="Aktivitas sistem dan komposisi pengguna." />

            <BentoGrid>
                <KpiCard span="kpi3" label="Total user" value={kpi.totalUser} />
                <KpiCard span="kpi3" label="User aktif" value={kpi.userAktif} />
                <KpiCard span="kpi3" label="Sesi berjalan" value={kpi.sesiBerjalan} />

                <ChartCard span="hero" title="Login harian" description="14 hari terakhir" label="Grafik jumlah login per hari">
                    <Line
                        data={{
                            labels: loginHarian.map((d) => d.hari.slice(5)),
                            datasets: [{ label: 'Login', data: loginHarian.map((d) => d.jumlah), borderColor: WARNA_CHART.gelap, backgroundColor: WARNA_CHART.gelap }],
                        }}
                        options={{ interaction: { intersect: false, mode: 'index' }, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }}
                    />
                </ChartCard>

                <ChartCard
                    span="highlight"
                    title="User aktif per role"
                    label="Komposisi user aktif per role"
                    center={<span className="text-center"><span className="block font-display text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{kpi.userAktif}</span><span className="text-xs text-slate-500">aktif</span></span>}
                >
                    <Doughnut data={{ labels: userPerRole.map((r) => r.role), datasets: [{ data: userPerRole.map((r) => r.jumlah), backgroundColor: userPerRole.map((r) => WARNA_ROLE[r.role] ?? WARNA_CHART.tengah) }] }} />
                </ChartCard>

                <DataTable
                    title="10 aktivitas terbaru"
                    action={<Link href={route('admin.audit.index')} className="text-[13px] font-medium text-slate-600 hover:text-slate-900">Audit trail</Link>}
                    columns={kolom}
                    rows={logTerbaru}
                    empty={{ title: 'Belum ada aktivitas' }}
                />
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
