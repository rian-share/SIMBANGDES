const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
const angka1 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });
const relatif = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });

/** "Rp 150.000.000" (sen tampil hanya bila ≠ 0). ringkas: "Rp 150 jt", "Rp 1,2 M", "Rp 850 rb". */
export function formatRupiah(nilai, { ringkas = false } = {}) {
    const n = Number(nilai ?? 0);
    if (!ringkas) return rupiah.format(n);

    const a = Math.abs(n);
    const tanda = n < 0 ? '-' : '';
    if (a >= 1e12) return `${tanda}Rp ${angka1.format(a / 1e12)} T`;
    if (a >= 1e9) return `${tanda}Rp ${angka1.format(a / 1e9)} M`;
    if (a >= 1e6) return `${tanda}Rp ${angka1.format(a / 1e6)} jt`;
    if (a >= 1e3) return `${tanda}Rp ${angka1.format(a / 1e3)} rb`;
    return rupiah.format(n);
}

export const formatPersen = (nilai) => `${angka1.format(Number(nilai ?? 0))}%`;

export const formatTanggal = (nilai) =>
    nilai ? new Date(nilai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

export const formatTanggalWaktu = (nilai) =>
    nilai
        ? new Date(nilai).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-';

export function formatRelatif(nilai) {
    if (!nilai) return '-';
    const detik = Math.round((new Date(nilai).getTime() - Date.now()) / 1000);
    const satuan = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [nama, dtk] of satuan) {
        if (Math.abs(detik) >= dtk) return relatif.format(Math.round(detik / dtk), nama);
    }
    return 'baru saja';
}
