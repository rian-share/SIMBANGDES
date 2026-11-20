import { BentoCard, BentoGrid, Button, FormSelect, FormTextarea, PageHeader, StatusBadge, formatTanggalWaktu } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm } from '@inertiajs/react';

export default function Show({ pengaduan }) {
    const { data, setData, patch, processing, errors } = useForm({
        status_pengaduan: pengaduan.status_pengaduan === 'Menunggu' ? 'Diproses' : pengaduan.status_pengaduan,
        tanggapan_pemdes: pengaduan.tanggapan_pemdes ?? '',
    });

    return (
        <AuthenticatedLayout title={`Pengaduan ${pengaduan.kode_tiket}`} hideTitle>
            <PageHeader
                back={{ href: route('pemdes.pengaduan.index'), label: 'Pengaduan' }}
                eyebrow="Pengaduan masyarakat"
                title={pengaduan.kode_tiket}
                description={`Diajukan ${formatTanggalWaktu(pengaduan.created_at)}`}
                actions={<StatusBadge status={pengaduan.status_pengaduan} />}
            />

            <BentoGrid>
                <BentoCard span="chart" title="Isi pengaduan" description={`${pengaduan.nama_pelapor}${pengaduan.kontak_pelapor ? ` · ${pengaduan.kontak_pelapor}` : ''}`}>
                    <dl className="mb-5 grid gap-4 text-sm sm:grid-cols-2">
                        <div><dt className="text-xs text-slate-500">Lokasi kejadian</dt><dd className="mt-0.5 font-medium text-slate-900">{pengaduan.lokasi_kejadian}</dd></div>
                        <div><dt className="text-xs text-slate-500">Proyek terkait</dt><dd className="mt-0.5 font-medium text-slate-900">{pengaduan.proyek?.nama_proyek ?? '-'}</dd></div>
                    </dl>
                    <p className="max-w-[68ch] whitespace-pre-line break-words text-[15px] leading-7 text-slate-700">{pengaduan.isi_pengaduan}</p>
                    {pengaduan.foto_bukti && (
                        <a href={`/storage/${pengaduan.foto_bukti}`} target="_blank" rel="noreferrer" className="mt-5 block">
                            <img src={`/storage/${pengaduan.foto_bukti}`} alt="Foto bukti pengaduan" className="max-h-72 rounded-xl border border-slate-200/80" />
                        </a>
                    )}
                </BentoCard>

                <BentoCard span="list" title="Tanggapan resmi">
                    <form onSubmit={(e) => { e.preventDefault(); patch(route('pemdes.pengaduan.update', pengaduan.id), { preserveScroll: true }); }} className="space-y-5">
                        <FormSelect id="status_pengaduan" label="Status" value={data.status_pengaduan} onChange={(e) => setData('status_pengaduan', e.target.value)} error={errors.status_pengaduan}>
                            {['Diproses', 'Selesai', 'Ditolak'].map((s) => <option key={s}>{s}</option>)}
                        </FormSelect>
                        <FormTextarea id="tanggapan_pemdes" label="Tanggapan" rows={6} value={data.tanggapan_pemdes} onChange={(e) => setData('tanggapan_pemdes', e.target.value)} error={errors.tanggapan_pemdes} />
                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>Simpan tanggapan</Button>
                            <Button variant="secondary" href={route('pemdes.pengaduan.index')}>Kembali</Button>
                        </div>
                    </form>
                </BentoCard>
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
