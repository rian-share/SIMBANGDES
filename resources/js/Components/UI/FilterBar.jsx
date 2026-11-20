import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import Button from '@/Components/UI/Button';

/**
 * Baris filter. >= lg: satu baris. < lg: tombol "Filter" yang membuka panel (disclosure).
 * Kontrol anak sebaiknya memakai `className="lg:w-48"`; kontrol pencarian `lg:w-64`.
 */
export default function FilterBar({ onSubmit, onReset, activeCount = 0, children, className = '' }) {
    const [buka, setBuka] = useState(false);

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }} className={className}>
            <div className="lg:hidden">
                <Button variant="secondary" size="sm" icon={SlidersHorizontal} aria-expanded={buka} onClick={() => setBuka((s) => !s)}>
                    Filter{activeCount > 0 && <span className="tabular-nums"> ({activeCount})</span>}
                    <ChevronDown className={`h-4 w-4 transition-transform ${buka ? 'rotate-180' : ''}`} aria-hidden="true" />
                </Button>
            </div>
            <div className={`${buka ? 'mt-3 grid' : 'hidden'} gap-3 sm:grid-cols-2 lg:mt-0 lg:flex lg:flex-wrap lg:items-end`}>
                {children}
                <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                    {onSubmit && <Button type="submit" variant="secondary" size="sm">Terapkan</Button>}
                    {onReset && <Button variant="ghost" size="sm" onClick={onReset}>Reset</Button>}
                </div>
            </div>
        </form>
    );
}
