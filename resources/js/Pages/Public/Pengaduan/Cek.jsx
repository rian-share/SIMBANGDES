import { BentoCard, BentoGrid, Button, Callout, EmptyState, FormInput, PageHeader, StatusBadge, formatTanggalWaktu } from '@/Components/UI';
import PublicLayout from '@/Layouts/PublicLayout';
import { router } from '@inertiajs/react';
import { Check, Search, SearchX } from 'lucide-react';
import { useState } from 'react';

const KETERANGAN = {
    Menunggu: 'Pengaduan diterima dan menunggu ditinjau petugas.',
    Diproses: 'Pengaduan sedang ditinjau dan ditindaklanjuti.',
    Selesai: 'Pengaduan telah selesai ditangani.',
    Ditolak: 'Pengaduan tidak dapat ditindaklanjuti.',
};

/** Timeline vertikal 3 tahap: tahap lalu = centang, tahap kini = cincin, tahap berikutnya = kosong. */
function Tahapan({ status, dibuat, diperbarui }) {
    const akhir = status === 'Ditolak' ? 'Ditolak' : 'Selesai';
    const urutan = ['Menunggu', 'Diproses', akhir];
    const indeks = urutan.indexOf(status);

    return (
        <ol aria-label="Tahapan pengaduan">
            {urutan.map((t, i) => {
                const selesai = i < indeks || (i === indeks && i === urutan.length - 1);
                const kini = i === indeks && !selesai;
                const kritis = t === 'Ditolak' && i <= indeks;
                const terakhir = i === urutan.length - 1;
                const waktu = i === 0 ? dibuat : i === indeks ? diperbarui : null;

                return (
                    <li key={t} className="relative flex gap-4 pb-7 last:pb-0">
                        {!terakhir && <span className={`absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-px ${i < indeks ? 'bg-slate-900' : 'bg-slate-200'}`} aria-hidden="true" />}
                        <span
                            className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                                selesai ? (kritis ? 'bg-red-600 text-white' : 'bg-slate-900 text-white') : kini ? 'border-2 border-slate-900 bg-white' : 'border border-slate-300 bg-white'
                            }`}
                        >
                            {selesai ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : kini ? <span className="h-2 w-2 rounded-full bg-slate-900" /> : null}
                        </span>
                        <div className="min-w-0 -mt-0.5">
                            <p className={`text-sm font-medium ${i <= indeks ? 'text-slate-900' : 'text-slate-500'}`}>{t}</p>
                            <p className="text-[13px] text-slate-500">{KETERANGAN[t]}</p>
                            {waktu && i <= indeks && <p className="mt-0.5 text-xs tabular-nums text-slate-500">{formatTanggalWaktu(waktu)}</p>}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

export default function Cek({ kode, hasil }) {
    const [input, setInput] = useState(kode);
    const cari = (e) => {
        e.preventDefault();
        router.get(route('pengaduan.cek'), { kode: input });
    };

    return (
        <PublicLayout title="Cek Tiket Pengaduan">
            <PageHeader eyebrow="Layanan masyarakat" title="Cek status pengaduan" description="Masukkan kode tiket yang Anda terima, contoh ADU-2026-AB12." />

            <BentoGrid>
                <BentoCard span="list" title="Kode tiket">
                    <form onSubmit={cari} className="space-y-4">
                        <FormInput
                            aria-label="Kode tiket"
                            placeholder="ADU-YYYY-XXXX"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            inputClassName="font-mono uppercase tracking-wider"
                        />
                        <Button type="submit" icon={Search} className="w-full">Cek status</Button>
                    </form>
                </BentoCard>

                {kode && (
                    <BentoCard span="chart" title="Hasil pelacakan">
                        {!hasil ? (
                            <EmptyState icon={SearchX} title="Tiket tidak ditemukan" description="Periksa kembali kode tiket Anda." />
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="font-mono text-xl font-semibold tracking-wider text-slate-900">{hasil.kode_tiket}</p>
                                    <StatusBadge status={hasil.status_pengaduan} />
                                </div>
                                <Tahapan status={hasil.status_pengaduan} dibuat={hasil.created_at} diperbarui={hasil.updated_at} />
                                <Callout title="Tanggapan Pemdes">
                                    <p className="mt-1 whitespace-pre-line break-words">{hasil.tanggapan_pemdes ?? 'Belum ada tanggapan.'}</p>
                                </Callout>
                            </div>
                        )}
                    </BentoCard>
                )}
            </BentoGrid>
        </PublicLayout>
    );
}
