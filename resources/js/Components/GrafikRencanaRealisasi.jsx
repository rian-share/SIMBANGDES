import { ChartFrame } from '@/Components/UI/ChartCard';
import { formatRupiah } from '@/Components/UI/format';
import { WARNA_CHART, potongLabel, tickRupiah } from '@/chartSetup';
import { Bar } from 'react-chartjs-2';

/** Rencana (slate muda) vs Realisasi (slate gelap); realisasi melebihi rencana ditandai merah. baris: [{ komponen, rencana, realisasi }]. */
export default function GrafikRencanaRealisasi({ baris, className = 'h-64 md:h-72' }) {
    const data = {
        labels: baris.map((b) => potongLabel(b.komponen)),
        datasets: [
            { label: 'Rencana', data: baris.map((b) => Number(b.rencana)), backgroundColor: WARNA_CHART.muda },
            { label: 'Realisasi', data: baris.map((b) => Number(b.realisasi)), backgroundColor: baris.map((b) => (Number(b.realisasi) > Number(b.rencana) ? WARNA_CHART.merah : WARNA_CHART.gelap)) },
        ],
    };
    const options = {
        plugins: {
            tooltip: {
                callbacks: {
                    title: (items) => baris[items[0].dataIndex].komponen,
                    label: (c) => `${c.dataset.label}: ${formatRupiah(c.parsed.y)}`,
                },
            },
        },
        scales: { y: { beginAtZero: true, ticks: { callback: tickRupiah } } },
    };

    return (
        <ChartFrame height={className} label="Grafik rencana dibanding realisasi per komponen">
            <Bar data={data} options={options} />
        </ChartFrame>
    );
}
