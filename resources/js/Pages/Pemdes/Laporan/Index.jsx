import { BentoCard, BentoGrid, Button, Callout, EmptyState, FormSelect, FormTextarea, Modal, PageHeader, Pagination, StatusBadge, formatPersen, formatTanggal } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';

function ModalTolak({ laporan, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({ catatan_revisi: '' });
    const kirim = (e) => {
        e.preventDefault();
        post(route('pemdes.laporan.reject', laporan.id), { preserveScroll: true, onSuccess: () => { reset(); onClose(); } });
    };

    return (
        <Modal open onClose={onClose} title="Tolak laporan" description={`${laporan.proyek.nama_proyek} · ${formatPersen(laporan.persentase_fisik)}`}>
            <form onSubmit={kirim} className="space-y-4">
                <FormTextarea id="catatan_revisi" label="Catatan revisi" hint="Minimal 10 karakter. Pelaksana akan melihat catatan ini." rows={4} value={data.catatan_revisi} onChange={(e) => setData('catatan_revisi', e.target.value)} error={errors.catatan_revisi} />
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit" disabled={processing}>Tolak laporan</Button>
                </div>
            </form>
        </Modal>
    );
}

export default function Index({ laporan, filter }) {
    const [tolak, setTolak] = useState(null);

    return (
        <AuthenticatedLayout title="Verifikasi Laporan" hideTitle>
            <PageHeader
                title="Verifikasi laporan"
                description="Tinjau laporan progres pelaksana, lalu setujui atau kembalikan untuk direvisi."
                actions={(
                    <FormSelect
                        aria-label="Filter status"
                        value={filter.status ?? ''}
                        onChange={(e) => router.get(route('pemdes.laporan.index'), { status: e.target.value || undefined }, { preserveState: true })}
                        className="w-full sm:w-52"
                    >
                        <option value="">Semua status</option>
                        {['Menunggu', 'Disetujui', 'Ditolak'].map((s) => <option key={s}>{s}</option>)}
                    </FormSelect>
                )}
            />

            <BentoGrid>
                {laporan.data.length === 0 && <BentoCard span="full"><EmptyState title="Tidak ada laporan" description="Ubah filter status untuk melihat laporan lain." /></BentoCard>}

                {laporan.data.map((l) => (
                    <BentoCard key={l.id} span="full">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="break-words font-display text-base font-semibold tracking-tight text-slate-900">{l.proyek.nama_proyek}</p>
                                <p className="mt-1 text-[13px] tabular-nums text-slate-500">
                                    {l.pelaksana.nama_lengkap} · {formatTanggal(l.tanggal_laporan)} · progres {formatPersen(l.proyek.progres_aktual)} menjadi <b className="font-medium text-slate-900">{formatPersen(l.persentase_fisik)}</b>
                                </p>
                            </div>
                            <StatusBadge status={l.status_verifikasi} />
                        </div>

                        <p className="mt-4 max-w-[75ch] text-sm leading-6 text-slate-600">{l.keterangan}</p>
                        {l.kendala && <Callout tone="info" title="Kendala" className="mt-3">{l.kendala}</Callout>}
                        {l.catatan_revisi && <Callout tone="critical" title="Catatan revisi" className="mt-3">{l.catatan_revisi}</Callout>}

                        {l.foto.length > 0 && (
                            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                                {l.foto.map((f) => (
                                    <a key={f.id} href={`/storage/${f.file_path}`} target="_blank" rel="noreferrer" className="group block">
                                        <img src={`/storage/${f.file_path}`} alt={`Foto ${f.tahap}`} loading="lazy" className="aspect-[4/3] w-full rounded-lg border border-slate-200/80 object-cover" />
                                        <span className="mt-1 block text-xs text-slate-500">{f.tahap}</span>
                                    </a>
                                ))}
                            </div>
                        )}

                        {l.status_verifikasi === 'Menunggu' && (
                            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                                <Button onClick={() => router.post(route('pemdes.laporan.approve', l.id), {}, { preserveScroll: true })}>Setujui</Button>
                                <Button variant="secondary" onClick={() => setTolak(l)}>Tolak</Button>
                            </div>
                        )}
                    </BentoCard>
                ))}
            </BentoGrid>

            {laporan.last_page > 1 && <Pagination paginator={laporan} className="mt-6" />}
            {tolak && <ModalTolak key={tolak.id} laporan={tolak} onClose={() => setTolak(null)} />}
        </AuthenticatedLayout>
    );
}
