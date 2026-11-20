import { ChevronDown } from 'lucide-react';
import { useId } from 'react';

/** Kelas kontrol dasar (tanpa margin); error menambah border merah. */
export const controlClass = (error = false) =>
    `w-full rounded-xl border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-4 disabled:bg-slate-50 disabled:text-slate-500 ${
        error ? 'border-red-600 focus:border-red-600 focus:ring-red-600/10' : 'border-slate-300 focus:border-red-600 focus:ring-red-600/10'
    }`;

/** Pembungkus label + hint + pesan error + ARIA yang dipakai semua kontrol form. */
function Kolom({ id, label, hint, error, required, className = '', children }) {
    return (
        <div className={className}>
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-slate-700">
                    {label}
                    {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
                </label>
            )}
            {children}
            {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">{hint}</p>}
            {error && <p id={`${id}-error`} className="mt-1.5 text-[13px] text-red-600">{error}</p>}
        </div>
    );
}

const aria = (id, error, hint) => ({
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
});

/** prefix/suffix: addon teks di dalam kontrol (mis. "Rp", "%"). className = kelas pembungkus. */
export function FormInput({ id, label, hint, error, required, prefix, suffix, className = '', inputClassName = '', ...props }) {
    const otomatis = useId();
    const kunci = id ?? otomatis;

    return (
        <Kolom id={kunci} label={label} hint={hint} error={error} required={required} className={className}>
            <div className="relative">
                {prefix && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">{prefix}</span>}
                <input
                    id={kunci}
                    required={required}
                    className={`${controlClass(error)} h-10 ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''} ${inputClassName}`}
                    {...aria(kunci, error, hint)}
                    {...props}
                />
                {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">{suffix}</span>}
            </div>
        </Kolom>
    );
}

export function FormSelect({ id, label, hint, error, required, className = '', children, ...props }) {
    const otomatis = useId();
    const kunci = id ?? otomatis;

    return (
        <Kolom id={kunci} label={label} hint={hint} error={error} required={required} className={className}>
            <div className="relative">
                <select id={kunci} required={required} className={`${controlClass(error)} h-10 appearance-none pr-10`} {...aria(kunci, error, hint)} {...props}>
                    {children}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            </div>
        </Kolom>
    );
}

export function FormTextarea({ id, label, hint, error, required, className = '', rows = 4, ...props }) {
    const otomatis = useId();
    const kunci = id ?? otomatis;

    return (
        <Kolom id={kunci} label={label} hint={hint} error={error} required={required} className={className}>
            <textarea id={kunci} rows={rows} required={required} className={`${controlClass(error)} min-h-28 py-2.5 leading-6`} {...aria(kunci, error, hint)} {...props} />
        </Kolom>
    );
}

export function FormCheckbox({ id, label, hint, className = '', ...props }) {
    const otomatis = useId();
    const kunci = id ?? otomatis;

    return (
        <div className={`flex items-start gap-2.5 ${className}`}>
            <input id={kunci} type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-red-600" {...props} />
            <label htmlFor={kunci} className="text-sm text-slate-700">
                {label}
                {hint && <span className="block text-xs text-slate-500">{hint}</span>}
            </label>
        </div>
    );
}
