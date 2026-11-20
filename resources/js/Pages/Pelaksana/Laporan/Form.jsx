import { BentoCard, BentoGrid, Button, Callout, FileDropzone, FormCheckbox, FormInput, FormTextarea, PageHeader, formatPersen } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm } from '@inertiajs/react';

const TAHAP = [['Sebelum', '0% (Sebelum)'], ['Saat', '50% (Saat)'], ['Sesudah', '100% (Sesudah)']];

export default function Form({ proyek, laporan = null }) {
    const revisi = laporan !== null;
    const { data, setData, post, processing, errors } = useForm({
        persentase_fisik: laporan?.persentase_fisik ?? proyek.progres_aktual,
        keterangan: laporan?.keterangan ?? '',
        kendala: laporan?.kendala ?? '',
        foto: {},
        hapus_foto: [],
    });
    const submit = (e) => {
        e.preventDefault();
        post(revisi ? route('pelaksana.laporan.update', laporan.id) : route('pelaksana.laporan.store', proyek.id), { forceFormData: true });
    };
    const lama = (tahap) => laporan?.foto.find((f) => f.tahap === tahap);
    const toggleHapus = (id) => setData('hapus_foto', data.hapus_foto.includes(id) ? data.hapus_foto.filter((i) => i !== id) : [...data.hapus_foto, id]);
    // File dihapus dari dropzone = kunci tahap dibuang agar tidak terkirim sebagai null.
    const setFoto = (kode, file) => {
        const { [kode]: _, ...sisa } = data.foto;
        setData('foto', file ? { ...sisa, [kode]: file } : sisa);
    };

    return (
        <AuthenticatedLayout title={revisi ? 'Revisi Laporan' : 'Laporan Progres'} hideTitle>
            <PageHeader
                back={{ href: route('pelaksana.proyek.show', proyek.id), label: proyek.nama_proyek }}
                eyebrow={revisi ? 'Revisi laporan' : 'Laporan progres'}
                title={revisi ? 'Perbaiki laporan' : 'Kirim laporan progres'}
                description={`${proyek.nama_proyek} · progres disetujui saat ini ${formatPersen(proyek.progres_aktual)}`}
            />

            <form onSubmit={submit}>
                <BentoGrid>
                    {revisi && laporan.catatan_revisi && (
                        <div className="md:col-span-6 lg:col-span-12">
                            <Callout tone="critical" title="Catatan penolakan Pemdes">{laporan.catatan_revisi}</Callout>
                        </div>
                    )}

                    <BentoCard span="full" title="Data progres">
                        <div className="grid gap-5 md:grid-cols-3">
                            <FormInput id="persentase_fisik" label="Progres fisik" required suffix="%" type="number" step="0.01" value={data.persentase_fisik} onChange={(e) => setData('persentase_fisik', e.target.value)} error={errors.persentase_fisik} />
                            <FormTextarea id="keterangan" label="Keterangan" required rows={3} className="md:col-span-2" value={data.keterangan} onChange={(e) => setData('keterangan', e.target.value)} error={errors.keterangan} />
                            <FormTextarea id="kendala" label="Kendala" hint="Opsional." rows={2} className="md:col-span-3" value={data.kendala} onChange={(e) => setData('kendala', e.target.value)} error={errors.kendala} />
                        </div>
                    </BentoCard>

                    <BentoCard span="full" title="Dokumentasi foto" description="Minimal 1 foto dari 3 tahap · JPG, PNG, WEBP · maks 5 MB per foto">
                        <div className="grid gap-5 md:grid-cols-3">
                            {TAHAP.map(([kode, label]) => {
                                const ada = lama(kode);
                                const dihapus = ada && data.hapus_foto.includes(ada.id);
                                return (
                                    <div key={kode}>
                                        <FileDropzone
                                            id={`foto-${kode}`}
                                            label={label}
                                            value={data.foto[kode] ?? null}
                                            onChange={(file) => setFoto(kode, file)}
                                            existingUrl={ada && !dihapus ? `/storage/${ada.file_path}` : undefined}
                                            error={errors[`foto.${kode}`]}
                                        />
                                        {ada && <FormCheckbox id={`hapus-${kode}`} label="Hapus foto tersimpan" checked={dihapus} onChange={() => toggleHapus(ada.id)} className="mt-3" />}
                                    </div>
                                );
                            })}
                        </div>
                        {errors.foto && <p className="mt-4 text-[13px] text-red-600">{errors.foto}</p>}
                    </BentoCard>

                    <div className="flex justify-end gap-2 md:col-span-6 lg:col-span-12">
                        <Button variant="secondary" href={route('pelaksana.proyek.show', proyek.id)}>Batal</Button>
                        <Button type="submit" disabled={processing}>{revisi ? 'Kirim ulang' : 'Kirim laporan'}</Button>
                    </div>
                </BentoGrid>
            </form>
        </AuthenticatedLayout>
    );
}
