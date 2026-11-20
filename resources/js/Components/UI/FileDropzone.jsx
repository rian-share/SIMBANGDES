import { FileText, UploadCloud, X } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { IconButton } from '@/Components/UI/Button';

const formatUkuran = (byte) => (byte >= 1048576 ? `${(byte / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(byte / 1024))} KB`);

/**
 * Pilih/seret berkas. value = File|null, onChange(File|null).
 * Pra-validasi ukuran & ekstensi hanya untuk umpan balik cepat; validasi server tetap otoritatif.
 */
export default function FileDropzone({ id, label, accept = '.jpg,.jpeg,.png,.webp', maxSizeMb = 5, value = null, onChange, error, hint, existingUrl, required, className = '' }) {
    const otomatis = useId();
    const kunci = id ?? otomatis;
    const [seret, setSeret] = useState(false);
    const [galatLokal, setGalatLokal] = useState(null);
    const gambar = value?.type?.startsWith('image/');
    const pratinjau = useMemo(() => (gambar ? URL.createObjectURL(value) : null), [value, gambar]);

    useEffect(() => () => pratinjau && URL.revokeObjectURL(pratinjau), [pratinjau]);

    const terima = (file) => {
        if (!file) return;
        const ekstensi = `.${file.name.split('.').pop().toLowerCase()}`;
        if (!accept.split(',').includes(ekstensi)) {
            setGalatLokal(`Format tidak didukung. Gunakan ${accept.replaceAll('.', '').replaceAll(',', ', ')}.`);
            return;
        }
        if (file.size > maxSizeMb * 1048576) {
            setGalatLokal(`Ukuran melebihi ${maxSizeMb} MB.`);
            return;
        }
        setGalatLokal(null);
        onChange(file);
    };

    const pesan = error ?? galatLokal;

    return (
        <div className={className}>
            {label && (
                <label htmlFor={kunci} className="mb-1.5 block text-[13px] font-medium text-slate-700">
                    {label}
                    {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
                </label>
            )}

            {value || existingUrl ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    {pratinjau || (existingUrl && !value) ? (
                        <img src={pratinjau ?? existingUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                        <span className="grid h-16 w-16 place-items-center rounded-lg bg-slate-50"><FileText className="h-5 w-5 text-slate-400" aria-hidden="true" /></span>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{value?.name ?? 'Berkas tersimpan'}</p>
                        {value && <p className="text-xs tabular-nums text-slate-500">{formatUkuran(value.size)}</p>}
                    </div>
                    {value && <IconButton icon={X} label="Hapus berkas" onClick={() => { setGalatLokal(null); onChange(null); }} />}
                </div>
            ) : null}

            <label
                htmlFor={kunci}
                onDragOver={(e) => { e.preventDefault(); setSeret(true); }}
                onDragLeave={() => setSeret(false)}
                onDrop={(e) => { e.preventDefault(); setSeret(false); terima(e.dataTransfer.files[0]); }}
                className={`${value || existingUrl ? 'mt-2' : ''} block cursor-pointer rounded-xl border border-dashed px-4 py-6 text-center transition focus-within:ring-4 focus-within:ring-red-600/10 ${
                    seret ? 'border-red-600 bg-red-50/40' : pesan ? 'border-red-600' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                }`}
            >
                <UploadCloud className="mx-auto h-5 w-5 text-slate-400" aria-hidden="true" />
                <p className="mt-2 text-sm text-slate-600"><span className="font-medium text-slate-900 underline underline-offset-4">Pilih berkas</span> atau seret ke sini</p>
                <p className="mt-1 text-xs text-slate-500">{hint ?? `${accept.replaceAll('.', '').replaceAll(',', ', ').toUpperCase()} · maks ${maxSizeMb} MB`}</p>
                <input id={kunci} type="file" accept={accept} className="sr-only" onChange={(e) => { terima(e.target.files[0]); e.target.value = ''; }} />
            </label>

            {pesan && <p className="mt-1.5 text-[13px] text-red-600">{pesan}</p>}
        </div>
    );
}
