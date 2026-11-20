// Kelas span ditulis utuh agar Tailwind dapat mendeteksinya; semuanya berawalan md:/lg: (aman di grid 1 kolom).
export const SPAN = {
    full: 'md:col-span-6 lg:col-span-12',
    hero: 'md:col-span-6 lg:col-span-8',
    highlight: 'md:col-span-6 lg:col-span-4',
    chart: 'md:col-span-6 lg:col-span-7',
    list: 'md:col-span-6 lg:col-span-5',
    half: 'md:col-span-3 lg:col-span-6',
    kpi4: 'md:col-span-3 lg:col-span-3',
    kpi3: 'md:col-span-2 lg:col-span-4',
};

/** Grid 12 kolom. compact = 2 kolom di mobile (untuk baris KPI angka pendek). */
export function BentoGrid({ compact = false, className = '', children }) {
    return <div className={`grid gap-5 ${compact ? 'grid-cols-2' : 'grid-cols-1'} md:grid-cols-6 lg:grid-cols-12 ${className}`}>{children}</div>;
}

const VARIAN = {
    default: 'border-slate-200/80 bg-white',
    muted: 'border-slate-200/80 bg-slate-50/60 shadow-none',
    // Hanya portal publik, maksimal satu per halaman.
    inverse: 'border-slate-900 bg-slate-900 text-slate-300',
};

/** variant: default | muted | inverse. flush = tanpa padding (peta, tabel, galeri). */
export default function BentoCard({ title, description, action, span, flush = false, variant = 'default', as: Tag = 'section', className = '', children }) {
    const gelap = variant === 'inverse';

    return (
        <Tag className={`min-w-0 rounded-2xl border shadow-card ${VARIAN[variant]} ${flush ? 'overflow-hidden' : 'p-6 md:p-7'} ${span ? SPAN[span] : ''} ${className}`}>
            {(title || action) && (
                <header className={`mb-5 flex items-start justify-between gap-3 ${flush ? 'px-6 pt-6 md:px-7 md:pt-7' : ''}`}>
                    <div className="min-w-0">
                        {title && <h2 className={`font-display text-[15px] font-semibold tracking-tight ${gelap ? 'text-white' : 'text-slate-900'}`}>{title}</h2>}
                        {description && <p className={`mt-1 text-sm ${gelap ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>}
                    </div>
                    {action && <div className="shrink-0 text-[13px] font-medium">{action}</div>}
                </header>
            )}
            {children}
        </Tag>
    );
}
