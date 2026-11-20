import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Button from '@/Components/UI/Button';

const UKURAN = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' };

/** Dialog native <dialog>: fokus terkunci, Esc menutup, latar inert. Di mobile menempel ke bawah (bottom sheet). */
export default function Modal({ open, onClose, title, description, size = 'sm', footer, children }) {
    const ref = useRef(null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return undefined;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    return (
        <dialog
            ref={ref}
            onCancel={(e) => { e.preventDefault(); onClose(); }}
            onClick={(e) => e.target === ref.current && onClose()}
            className={`m-auto w-[calc(100vw-2rem)] ${UKURAN[size]} rounded-2xl border border-slate-200/80 bg-white p-0 text-slate-600 shadow-pop backdrop:bg-slate-900/40 backdrop:backdrop-blur-[2px] max-sm:mb-0 max-sm:mt-auto max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none`}
        >
            {open && (
                <div className="max-h-[85vh] overflow-y-auto p-6">
                    {title && <h2 className="font-display text-base font-semibold tracking-tight text-slate-900">{title}</h2>}
                    {description && <p className="mt-1.5 text-sm text-slate-500">{description}</p>}
                    {children && <div className="mt-4">{children}</div>}
                    {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
                </div>
            )}
        </dialog>
    );
}

const KonfirmasiContext = createContext(null);

/** Pasang sekali di layout. Dialog konfirmasi: `const ok = await confirm({ title, description })`. */
export function ConfirmProvider({ children }) {
    const [state, setState] = useState({ open: false });

    const confirm = useCallback((opsi) => new Promise((resolve) => setState({ open: true, resolve, ...opsi })), []);
    const tutup = (hasil) => {
        state.resolve?.(hasil);
        setState((s) => ({ ...s, open: false }));
    };

    return (
        <KonfirmasiContext.Provider value={confirm}>
            {children}
            <Modal
                open={state.open}
                onClose={() => tutup(false)}
                title={state.title ?? 'Konfirmasi'}
                description={state.description}
                footer={(
                    <>
                        <Button variant="secondary" onClick={() => tutup(false)}>Batal</Button>
                        <Button variant="primary" onClick={() => tutup(true)}>{state.confirmLabel ?? 'Hapus'}</Button>
                    </>
                )}
            />
        </KonfirmasiContext.Provider>
    );
}

export function useConfirm() {
    const confirm = useContext(KonfirmasiContext);
    if (!confirm) throw new Error('useConfirm harus dipakai di dalam ConfirmProvider (sudah dipasang di kedua layout).');

    return confirm;
}
