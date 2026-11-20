import { ArcElement, BarController, BarElement, CategoryScale, Chart as ChartJS, DoughnutController, Legend, LineController, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js';
import { formatRupiah } from '@/Components/UI/format';

// Registrasi & default Chart.js dipusatkan di sini; impor sekali dari halaman ber-chart.
// Controller didaftarkan di sini (bukan menunggu react-chartjs-2) agar default dataset di bawah sudah ada saat modul dimuat.
ChartJS.register(ArcElement, BarController, BarElement, DoughnutController, CategoryScale, LinearScale, LineController, LineElement, PointElement, Tooltip, Legend);

const d = ChartJS.defaults;
d.font.family = "'Inter', ui-sans-serif, system-ui, sans-serif";
d.font.size = 12;
d.color = '#64748b';
d.borderColor = '#f1f5f9';
d.responsive = true;
d.maintainAspectRatio = false;
d.layout.padding = 4;
d.animation.duration = 400;

d.plugins.legend.position = 'bottom';
d.plugins.legend.align = 'start';
Object.assign(d.plugins.legend.labels, { usePointStyle: true, pointStyle: 'circle', boxWidth: 6, boxHeight: 6, padding: 16 });

Object.assign(d.plugins.tooltip, {
    backgroundColor: '#0f172a',
    titleColor: '#ffffff',
    bodyColor: '#cbd5e1',
    titleFont: { weight: '600' },
    padding: 10,
    cornerRadius: 8,
    boxPadding: 4,
    usePointStyle: true,
    caretSize: 0,
});

// Tanpa grid vertikal; sumbu tanpa garis tepi; grid horizontal halus. Object.assign agar callback ticks bawaan tidak hilang.
Object.assign((d.scales.category.grid ??= {}), { display: false });
Object.assign((d.scales.category.border ??= {}), { display: false });
Object.assign((d.scales.linear.grid ??= {}), { color: '#f1f5f9', drawTicks: false });
Object.assign((d.scales.linear.border ??= {}), { display: false });
Object.assign((d.scales.linear.ticks ??= {}), { padding: 8, maxTicksLimit: 5 });

Object.assign(d.elements.bar, { borderRadius: 6, borderSkipped: false, maxBarThickness: 28 });
d.datasets.bar.categoryPercentage = 0.6;
d.datasets.bar.barPercentage = 0.85;
Object.assign(d.elements.line, { borderWidth: 2, tension: 0.35 });
Object.assign(d.elements.point, { radius: 0, hoverRadius: 4, hitRadius: 12 });
d.elements.arc.borderWidth = 0;
d.datasets.doughnut.cutout = '74%';

/** Palet tunggal: merah = sorotan kritis, gelap = data utama, muda = pembanding. */
export const WARNA_CHART = {
    merah: '#dc2626',
    gelap: '#1e293b',
    muda: '#cbd5e1',
    tengah: '#64748b',
    pudar: '#e2e8f0',
};

export const tickRupiah = (nilai) => formatRupiah(nilai, { ringkas: true });

/** Potong label kategori panjang di sumbu; nama lengkap tetap muncul di tooltip. */
export const potongLabel = (label, maks = 14) => (String(label).length > maks ? `${String(label).slice(0, maks - 1)}…` : label);

export { ChartJS };
