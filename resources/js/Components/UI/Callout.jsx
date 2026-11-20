import { CircleAlert, CircleCheck, Info } from 'lucide-react';

const NADA = {
    info: ['border-l-slate-900', Info, 'text-slate-500'],
    success: ['border-l-emerald-500', CircleCheck, 'text-emerald-600'],
    critical: ['border-l-red-600', CircleAlert, 'text-red-600'],
};

/** Pengganti kartu berlatar warna status: isi tetap putih, status lewat garis kiri + ikon. */
export default function Callout({ tone = 'info', title, className = '', children }) {
    const [garis, Ikon, warnaIkon] = NADA[tone];

    return (
        <div role={tone === 'critical' ? 'alert' : 'status'} className={`flex gap-3 rounded-xl border border-l-2 border-slate-200/80 bg-white p-4 ${garis} ${className}`}>
            <Ikon className={`mt-0.5 h-4 w-4 shrink-0 ${warnaIkon}`} aria-hidden="true" />
            <div className="min-w-0 text-sm text-slate-600">
                {title && <p className="font-medium text-slate-900">{title}</p>}
                {children}
            </div>
        </div>
    );
}
