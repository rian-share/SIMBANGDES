import BentoCard from '@/Components/UI/BentoCard';

/** Kontainer chart bertinggi tetap: kanvas tidak meluber dan tidak melompat saat data dimuat. */
export function ChartFrame({ height = 'h-64 md:h-72', label, className = '', children }) {
    return (
        <div role="img" aria-label={label} className={`relative w-full min-w-0 ${height} ${className}`}>
            {children}
        </div>
    );
}

/** Kartu Bento berisi satu grafik. `center` menaruh teks (mis. total doughnut) di tengah kanvas. */
export default function ChartCard({ title, description, action, span, height, label, center, className = '', children }) {
    return (
        <BentoCard title={title} description={description} action={action} span={span} className={className}>
            <ChartFrame height={height} label={label ?? title}>
                {children}
                {center && <div className="pointer-events-none absolute inset-0 grid place-items-center">{center}</div>}
            </ChartFrame>
        </BentoCard>
    );
}
