import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

const tombol = 'grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

/** Pratinjau foto layar penuh. items: [{ src, alt, caption }]; index null = tertutup. */
export default function Lightbox({ items, index, onClose, onIndexChange }) {
    const tutup = useRef(null);
    const terbuka = index !== null && items[index] !== undefined;
    const pindah = (arah) => onIndexChange((index + arah + items.length) % items.length);

    useEffect(() => {
        if (!terbuka) return undefined;
        const tombolKeyboard = (e) => {
            if (e.key === 'Escape') onClose();
            if (items.length > 1 && e.key === 'ArrowLeft') pindah(-1);
            if (items.length > 1 && e.key === 'ArrowRight') pindah(1);
        };
        document.addEventListener('keydown', tombolKeyboard);
        document.body.style.overflow = 'hidden';
        tutup.current?.focus();
        return () => {
            document.removeEventListener('keydown', tombolKeyboard);
            document.body.style.overflow = '';
        };
    });

    if (!terbuka) return null;
    const item = items[index];

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 p-4" role="dialog" aria-modal="true" aria-label="Pratinjau foto" onClick={onClose}>
            <div className="flex items-center justify-between text-sm text-slate-300">
                <span>{index + 1} / {items.length}</span>
                <button ref={tutup} type="button" aria-label="Tutup pratinjau" onClick={onClose} className={tombol}><X className="h-5 w-5" /></button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center gap-2">
                {items.length > 1 && (
                    <button type="button" aria-label="Foto sebelumnya" onClick={(e) => { e.stopPropagation(); pindah(-1); }} className={`${tombol} absolute left-0 z-10`}><ChevronLeft className="h-5 w-5" /></button>
                )}
                <img src={item.src} alt={item.alt} onClick={(e) => e.stopPropagation()} className="max-h-[80vh] max-w-full rounded-2xl object-contain" />
                {items.length > 1 && (
                    <button type="button" aria-label="Foto berikutnya" onClick={(e) => { e.stopPropagation(); pindah(1); }} className={`${tombol} absolute right-0 z-10`}><ChevronRight className="h-5 w-5" /></button>
                )}
            </div>
            {item.caption && <p className="mt-3 text-center text-sm text-slate-300">{item.caption}</p>}
        </div>
    );
}
