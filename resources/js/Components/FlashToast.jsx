import { usePage } from '@inertiajs/react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { IconButton } from '@/Components/UI/Button';

const GAYA = {
    success: [CircleCheck, 'text-emerald-600'],
    error: [CircleAlert, 'text-red-600'],
    warning: [Info, 'text-slate-500'],
};

export default function FlashToast() {
    const { flash } = usePage().props;
    const [tertutup, setTertutup] = useState({});

    // Tampilkan ulang setiap kali pesan flash berubah, lalu hilang otomatis setelah 5 detik.
    useEffect(() => {
        setTertutup({});
        const timer = setTimeout(() => setTertutup({ success: true, error: true, warning: true }), 5000);
        return () => clearTimeout(timer);
    }, [flash?.success, flash?.error, flash?.warning]);

    const pesan = Object.keys(GAYA).filter((tipe) => flash?.[tipe] && !tertutup[tipe]);
    if (pesan.length === 0) return null;

    return (
        <div className="fixed inset-x-4 top-[4.5rem] z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-96" role="status" aria-live="polite">
            {pesan.map((tipe) => {
                const [Ikon, warna] = GAYA[tipe];
                return (
                    <div key={tipe} className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 text-sm text-slate-700 shadow-pop">
                        <Ikon className={`mt-0.5 h-4 w-4 shrink-0 ${warna}`} aria-hidden="true" />
                        <p className="min-w-0 flex-1 break-words">{flash[tipe]}</p>
                        <IconButton icon={X} label="Tutup" className="-my-1 -mr-1.5 !h-7 !w-7" onClick={() => setTertutup((s) => ({ ...s, [tipe]: true }))} />
                    </div>
                );
            })}
        </div>
    );
}
