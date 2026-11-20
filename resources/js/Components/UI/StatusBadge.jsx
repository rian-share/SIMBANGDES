// Warna hanya di titik indikator; pill tetap netral. Pengecualian: status kritis (merah lembut).
const TITIK = {
    // berjalan
    Berjalan: ['netral', 'bg-slate-900'],
    Diproses: ['netral', 'bg-slate-900'],
    // menunggu
    Perencanaan: ['netral', 'bg-amber-500'],
    Menunggu: ['netral', 'bg-amber-500'],
    Waspada: ['netral', 'bg-amber-500'],
    // positif
    Selesai: ['netral', 'bg-emerald-500'],
    Disetujui: ['netral', 'bg-emerald-500'],
    Aman: ['netral', 'bg-emerald-500'],
    // kritis
    Terlambat: ['kritis', 'bg-red-600'],
    Ditolak: ['kritis', 'bg-red-600'],
    Kritis: ['kritis', 'bg-red-600'],
};

const PILL = {
    netral: 'bg-slate-100 text-slate-700',
    kritis: 'bg-red-50 text-red-700',
    lain: 'border border-slate-200 bg-white text-slate-600',
};

export default function StatusBadge({ status, label }) {
    const [jenis, titik] = TITIK[status] ?? ['lain', null];

    return (
        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${PILL[jenis]}`}>
            {titik && <span className={`h-1.5 w-1.5 rounded-full ${titik}`} aria-hidden="true" />}
            {label ?? status}
        </span>
    );
}
