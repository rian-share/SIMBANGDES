import { BentoGrid, ChartCard, DataTable, KpiCard, Money, PageHeader, ProgressBar, StatusBadge, formatPersen, formatRupiah } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { WARNA_CHART } from '@/chartSetup';
import { Link } from '@inertiajs/react';
import { Banknote, Percent, PiggyBank, Wallet } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';

export default function Anggaran({ anggaran, ringkasan }) {
    const pagu = Number(ringkasan.pagu);
    const serapan = pagu > 0 ? Math.round((Number(ringkasan.realisasi) / pagu) * 1000) / 10 : 0;

    const kolom = [
        {
            key: 'proyek',
            header: 'Proyek',
            primary: true,
            render: (a) => <Link href={route('pemdes.proyek.show', a.proyek_id)} className="hover:text-red-600">{a.proyek.nama_proyek}</Link>,
        },
        { key: 'status', header: 'Status', badge: true, render: (a) => <StatusBadge status={a.proyek.status_proyek} /> },
        { key: 'tahun_anggaran', header: 'TA' },
        { key: 'pagu_anggaran', header: 'Pagu', align: 'right', render: (a) => formatRupiah(a.pagu_anggaran) },
        { key: 'total_realisasi', header: 'Realisasi', align: 'right', render: (a) => formatRupiah(a.total_realisasi) },
        {
            key: 'serapan',
            header: 'Serapan',
            className: 'w-36',
            render: (a) => (
                <div className="flex items-center gap-3">
                    <ProgressBar value={a.persentase_serapan} danger={a.persentase_serapan >= 100} className="flex-1" />
                    <span className="w-12 text-right text-xs tabular-nums text-slate-700">{formatPersen(a.persentase_serapan)}</span>
                </div>
            ),
        },
        { key: 'komponen_count', header: 'Komponen', align: 'right', hideBelow: 'lg' },
    ];

    return (
        <AuthenticatedLayout title="Keuangan — Anggaran" hideTitle>
            <PageHeader title="Anggaran" description="Pagu dan realisasi setiap proyek beserta rincian komponen rencananya." />

            <BentoGrid>
                <div className="grid grid-cols-2 gap-5 md:col-span-6 lg:col-span-12 lg:grid-cols-4">
                    <KpiCard label="Total pagu" icon={Wallet}><Money value={ringkasan.pagu} ringkas /></KpiCard>
                    <KpiCard label="Total realisasi" icon={Banknote}><Money value={ringkasan.realisasi} ringkas /></KpiCard>
                    <KpiCard label="Sisa anggaran" icon={PiggyBank}><Money value={ringkasan.sisa} ringkas /></KpiCard>
                    <KpiCard label="Serapan" icon={Percent} value={formatPersen(serapan)} />
                </div>

                <DataTable
                    span="hero"
                    title="Anggaran per proyek"
                    columns={kolom}
                    rows={anggaran.data}
                    paginator={anggaran}
                    empty={{ title: 'Belum ada anggaran' }}
                    actions={(a) => [{ label: 'Kelola anggaran', icon: Wallet, href: route('pemdes.anggaran.show', a.proyek_id) }]}
                />

                <ChartCard
                    span="highlight"
                    title="Serapan keseluruhan"
                    description="Realisasi dibanding sisa pagu"
                    height="h-64"
                    label={`Serapan keseluruhan ${formatPersen(serapan)}`}
                    center={<span className="font-display text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{formatPersen(serapan)}</span>}
                >
                    <Doughnut data={{ labels: ['Realisasi', 'Sisa'], datasets: [{ data: [Number(ringkasan.realisasi), Number(ringkasan.sisa)], backgroundColor: [WARNA_CHART.gelap, WARNA_CHART.muda] }] }} />
                </ChartCard>
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
