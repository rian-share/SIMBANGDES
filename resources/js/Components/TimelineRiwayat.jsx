import EmptyState from '@/Components/UI/EmptyState';
import { History } from 'lucide-react';

const WARNA_TITIK = {
    Create: 'bg-slate-800',
    Update: 'bg-slate-400',
    Delete: 'bg-red-600',
    Disetujui: 'bg-emerald-500',
    Ditolak: 'bg-red-600',
};
const NAMA_ROLE = { admin: 'Admin', pemdes: 'Pemdes', pelaksana: 'Pelaksana' };

const kunciHari = (d) => d.toLocaleDateString('en-CA');
const labelHari = (d) => {
    const hari = 86400000;
    const selisih = Math.round((new Date(kunciHari(new Date())) - new Date(kunciHari(d))) / hari);
    if (selisih === 0) return 'Hari ini';
    if (selisih === 1) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Vertical timeline; items: [{ id, created_at, user, uraian: { aksi, judul, detail } }] terbaru di atas. */
export default function TimelineRiwayat({ items = [] }) {
    if (items.length === 0) {
        return <EmptyState icon={History} title="Belum ada riwayat untuk proyek ini" />;
    }

    const kelompok = [];
    items.forEach((item) => {
        const waktu = new Date(item.created_at);
        const kunci = kunciHari(waktu);
        if (kelompok.at(-1)?.kunci !== kunci) {
            kelompok.push({ kunci, label: labelHari(waktu), items: [] });
        }
        kelompok.at(-1).items.push({ ...item, waktu });
    });

    return (
        <div className="space-y-5">
            {kelompok.map((g) => (
                <div key={g.kunci}>
                    <p className="mb-3 text-xs font-medium text-slate-500">{g.label}</p>
                    <ol className="relative ml-2 border-l border-slate-200">
                        {g.items.map((l) => (
                            <li key={l.id} className="relative ml-6 pb-5 last:pb-0">
                                <span className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-white ${WARNA_TITIK[l.uraian.aksi] ?? 'bg-slate-300'}`} aria-hidden="true" />
                                <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                                    <time dateTime={l.created_at} className="font-semibold tabular-nums text-slate-700">
                                        {l.waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </time>
                                    <span>{l.user?.nama_lengkap ?? 'Sistem'}</span>
                                    {l.user && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{NAMA_ROLE[l.user.role] ?? l.user.role}</span>}
                                </div>
                                <p className="mt-0.5 text-sm font-semibold text-slate-900 first-letter:uppercase">{l.uraian.judul}</p>
                                {l.uraian.detail && <p className="text-sm text-slate-600">{l.uraian.detail}</p>}
                            </li>
                        ))}
                    </ol>
                </div>
            ))}
        </div>
    );
}
