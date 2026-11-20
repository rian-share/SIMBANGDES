import { formatRupiah } from '@/Components/UI/format';
import { TrendingDown, TrendingUp } from 'lucide-react';

/** Selisih realisasi − rencana: positif (melebihi) merah, negatif (hemat) hijau. Tanda +/− tetap tertulis. */
export default function Selisih({ value, className = '' }) {
    const angka = Number(value ?? 0);

    if (angka === 0) {
        return <span className={`text-slate-500 ${className}`}>Sesuai rencana</span>;
    }

    const lebih = angka > 0;
    const Ikon = lebih ? TrendingUp : TrendingDown;

    return (
        <span className={`inline-flex items-center gap-1 whitespace-nowrap font-medium tabular-nums ${lebih ? 'text-red-600' : 'text-emerald-600'} ${className}`}>
            <Ikon className="h-3.5 w-3.5" aria-hidden="true" />
            {lebih ? '+' : '−'}{formatRupiah(Math.abs(angka))}
        </span>
    );
}
