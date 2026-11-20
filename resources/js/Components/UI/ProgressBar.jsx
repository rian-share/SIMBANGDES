/** Merah hanya untuk kondisi kritis (danger). Label persen ditulis sebagai teks di luar bar. */
export default function ProgressBar({ value, danger = false, className = '' }) {
    const persen = Math.max(0, Math.min(100, Number(value) || 0));

    return (
        <div
            className={`h-1.5 overflow-hidden rounded-full bg-slate-100 ${className}`}
            role="progressbar"
            aria-valuenow={persen}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <div className={`h-full rounded-full transition-[width] ${danger ? 'bg-red-600' : 'bg-slate-800'}`} style={{ width: `${persen}%` }} />
        </div>
    );
}
