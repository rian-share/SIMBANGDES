import PetaProyek from '@/Components/PetaProyek';
import { BentoCard, BentoGrid, EmptyState, PageHeader, StatusBadge } from '@/Components/UI';
import PublicLayout from '@/Layouts/PublicLayout';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import { useState } from 'react';

export default function Peta({ proyek = [] }) {
    const [fokus, setFokus] = useState(null);
    const [q, setQ] = useState('');
    // Panel terbuka di desktop; di HP tertutup agar peta langsung terlihat.
    const [buka, setBuka] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
    const daftar = proyek.filter((p) => `${p.nama_proyek} ${p.lokasi}`.toLowerCase().includes(q.toLowerCase()));

    const pilih = (id) => {
        setFokus(id);
        if (window.matchMedia('(max-width: 1023px)').matches) setBuka(false);
    };

    return (
        <PublicLayout title="Peta Pembangunan">
            <PageHeader eyebrow="Sebaran proyek" title="Peta pembangunan" description={`${proyek.length} proyek memiliki koordinat`} />

            <BentoGrid>
                <BentoCard span="full" flush>
                    <div className="relative isolate h-[520px] md:h-[560px] lg:h-[620px]">
                        <PetaProyek proyek={proyek} fokus={fokus} className="!h-full !min-h-0" />

                        <div className="pointer-events-none absolute inset-x-3 bottom-3 top-3 z-[1000] flex flex-col justify-end lg:inset-x-auto lg:left-3 lg:w-80 lg:justify-start">
                            <div className="pointer-events-auto flex max-h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-pop backdrop-blur">
                                <button
                                    type="button"
                                    aria-expanded={buka}
                                    onClick={() => setBuka((s) => !s)}
                                    className="flex items-center justify-between gap-3 px-4 py-3 text-left"
                                >
                                    <span>
                                        <span className="block font-display text-sm font-semibold tracking-tight text-slate-900">Daftar proyek</span>
                                        <span className="block text-xs tabular-nums text-slate-500">{daftar.length} dari {proyek.length} proyek</span>
                                    </span>
                                    <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${buka ? 'rotate-180' : ''}`} aria-hidden="true" />
                                </button>

                                {buka && (
                                    <div className="flex min-h-0 flex-col border-t border-slate-100">
                                        <div className="relative p-3">
                                            <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                                            <input
                                                value={q}
                                                onChange={(e) => setQ(e.target.value)}
                                                aria-label="Cari proyek di peta"
                                                placeholder="Cari proyek"
                                                className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-600/10"
                                            />
                                        </div>
                                        {daftar.length === 0 ? (
                                            <EmptyState icon={MapPin} title="Proyek tidak ditemukan" />
                                        ) : (
                                            <ul className="max-h-56 space-y-0.5 overflow-y-auto px-2 pb-2 lg:max-h-[380px]">
                                                {daftar.map((p) => (
                                                    <li key={p.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => pilih(p.id)}
                                                            aria-pressed={fokus === p.id}
                                                            className={`relative w-full rounded-lg px-3 py-2.5 text-left transition-colors ${fokus === p.id ? 'bg-slate-100 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-red-600' : 'hover:bg-slate-50'}`}
                                                        >
                                                            <span className="block break-words text-sm font-medium text-slate-900">{p.nama_proyek}</span>
                                                            <span className="mt-0.5 block truncate text-xs text-slate-500">{p.lokasi}</span>
                                                            <span className="mt-1.5 block"><StatusBadge status={p.status_proyek} /></span>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
                                            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-900" aria-hidden="true" />Normal</span>
                                            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-600" aria-hidden="true" />Terlambat</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </BentoCard>
            </BentoGrid>
        </PublicLayout>
    );
}
