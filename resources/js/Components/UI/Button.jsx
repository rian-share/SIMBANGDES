import { Link } from '@inertiajs/react';

const DASAR = 'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50';
const UKURAN = { md: 'h-10 px-4', sm: 'h-8 px-3 text-[13px]' };
const VARIAN = {
    primary: 'bg-red-600 text-white hover:bg-red-700',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'text-red-600 hover:bg-red-50',
};

/** String kelas tombol, untuk <Link>/<a>/<button> manual dan adaptor lama (tombolMerah, tombolAbu). */
export const buttonClass = (variant = 'primary', size = 'md', className = '') => `${DASAR} ${UKURAN[size]} ${VARIAN[variant]} ${className}`;

/** variant: primary | secondary | ghost | danger. Dengan `href` dirender sebagai <Link> Inertia. */
export default function Button({ variant = 'primary', size = 'md', icon: Ikon, href, className = '', children, type = 'button', ...props }) {
    const kelas = buttonClass(variant, size, className);
    const isi = (
        <>
            {Ikon && <Ikon className="h-4 w-4" aria-hidden="true" />}
            {children}
        </>
    );

    if (href) {
        return <Link href={href} className={kelas} {...props}>{isi}</Link>;
    }

    return <button type={type} className={kelas} {...props}>{isi}</button>;
}

/** Tombol ikon untuk aksi baris/topbar. `label` wajib: dipakai sebagai aria-label dan title. */
export function IconButton({ icon: Ikon, label, href, variant = 'ghost', className = '', type = 'button', ...props }) {
    const kelas = `inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${VARIAN[variant]} ${className}`;
    const isi = <Ikon className="h-4 w-4" aria-hidden="true" />;

    if (href) {
        return <Link href={href} aria-label={label} title={label} className={kelas} {...props}>{isi}</Link>;
    }

    return <button type={type} aria-label={label} title={label} className={kelas} {...props}>{isi}</button>;
}
