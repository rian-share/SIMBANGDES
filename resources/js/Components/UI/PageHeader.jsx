import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

/** Satu-satunya judul halaman. Dirender di atas BentoGrid, bukan di dalamnya. */
export default function PageHeader({ eyebrow, title, description, back, actions, className = '' }) {
    return (
        <header className={`mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`}>
            <div className="min-w-0">
                {back && (
                    <Link href={back.href} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900">
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        {back.label ?? 'Kembali'}
                    </Link>
                )}
                {eyebrow && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-red-600">{eyebrow}</p>}
                <h1 className="break-words font-display text-2xl font-semibold tracking-tight text-slate-900 md:text-[28px]">{title}</h1>
                {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
        </header>
    );
}
