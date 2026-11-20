import BentoCard from '@/Components/UI/BentoCard';

/**
 * KPI minimalis: label, nilai besar, keterangan. Tanpa kotak ikon berwarna.
 * tone="critical" hanya mewarnai nilai merah (Terlambat, Kritis, Perlu revisi).
 * Nilai boleh lewat prop `value` atau children.
 */
export default function KpiCard({ label, value, hint, delta, icon: Ikon, tone = 'default', span, title, className = '', children }) {
    return (
        <BentoCard span={span} className={`!p-5 md:!p-6 ${className}`}>
            <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium text-slate-500">{label}</p>
                {Ikon && <Ikon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />}
            </div>
            <p title={title} className={`mt-2 break-words text-2xl font-semibold tracking-tight tabular-nums md:text-[28px] ${tone === 'critical' ? 'text-red-600' : 'text-slate-900'}`}>
                {value ?? children}
            </p>
            {(hint || delta) && (
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                    {delta && <span className="font-medium tabular-nums text-slate-700">{delta.value}</span>}
                    <span>{delta?.label ?? hint}</span>
                </p>
            )}
        </BentoCard>
    );
}
