import { BentoCard, BentoGrid, Button, FormCheckbox, FormInput, FormSelect, FormTextarea, PageHeader } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm } from '@inertiajs/react';

export default function Form({ proyek = null, pelaksana }) {
    const ubah = proyek !== null;
    const { data, setData, post, put, processing, errors } = useForm({
        nama_proyek: proyek?.nama_proyek ?? '',
        kategori: proyek?.kategori ?? '',
        lokasi: proyek?.lokasi ?? '',
        latitude: proyek?.latitude ?? '',
        longitude: proyek?.longitude ?? '',
        pelaksana_id: proyek?.pelaksana_id ?? '',
        tanggal_mulai: proyek?.tanggal_mulai?.slice(0, 10) ?? '',
        tanggal_selesai: proyek?.tanggal_selesai?.slice(0, 10) ?? '',
        target_progres: proyek?.target_progres ?? '100',
        is_public: proyek?.is_public ?? true,
        deskripsi: proyek?.deskripsi ?? '',
        tahun_anggaran: new Date().getFullYear(),
        sumber_dana: '',
        pagu_anggaran: '',
    });
    const set = (k) => (e) => setData(k, e.target.value);
    const submit = (e) => {
        e.preventDefault();
        if (ubah) {
            put(route('pemdes.proyek.update', proyek.id));
        } else {
            post(route('pemdes.proyek.store'));
        }
    };

    return (
        <AuthenticatedLayout title={ubah ? 'Ubah Proyek' : 'Tambah Proyek'} hideTitle>
            <PageHeader back={{ href: route('pemdes.proyek.index'), label: 'Proyek' }} title={ubah ? 'Ubah proyek' : 'Tambah proyek'} description={ubah ? proyek.nama_proyek : 'Isi data proyek, pelaksana, dan anggaran awal.'} />

            <form onSubmit={submit}>
                <BentoGrid>
                    <BentoCard span="hero" title="Data proyek">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <FormInput id="nama_proyek" label="Nama proyek" required value={data.nama_proyek} onChange={set('nama_proyek')} error={errors.nama_proyek} className="sm:col-span-2" />
                            <FormInput id="kategori" label="Kategori" value={data.kategori} onChange={set('kategori')} error={errors.kategori} />
                            <FormInput id="lokasi" label="Lokasi" required value={data.lokasi} onChange={set('lokasi')} error={errors.lokasi} />
                            <FormInput id="latitude" label="Latitude" type="number" step="any" value={data.latitude} onChange={set('latitude')} error={errors.latitude} />
                            <FormInput id="longitude" label="Longitude" type="number" step="any" value={data.longitude} onChange={set('longitude')} error={errors.longitude} />
                            <FormInput id="tanggal_mulai" label="Tanggal mulai" type="date" required value={data.tanggal_mulai} onChange={set('tanggal_mulai')} error={errors.tanggal_mulai} />
                            <FormInput id="tanggal_selesai" label="Tanggal selesai" type="date" required value={data.tanggal_selesai} onChange={set('tanggal_selesai')} error={errors.tanggal_selesai} />
                            <FormTextarea id="deskripsi" label="Deskripsi" rows={4} value={data.deskripsi} onChange={set('deskripsi')} error={errors.deskripsi} className="sm:col-span-2" />
                        </div>
                        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
                            <Button variant="secondary" href={route('pemdes.proyek.index')}>Batal</Button>
                            <Button type="submit" disabled={processing}>Simpan proyek</Button>
                        </div>
                    </BentoCard>

                    <div className="space-y-5 md:col-span-6 lg:col-span-4">
                        <BentoCard title="Pelaksanaan">
                            <div className="space-y-5">
                                <FormSelect id="pelaksana_id" label="Pelaksana" required value={data.pelaksana_id} onChange={set('pelaksana_id')} error={errors.pelaksana_id}>
                                    <option value="">Pilih pelaksana</option>
                                    {pelaksana.map((u) => <option key={u.id} value={u.id}>{u.nama_lengkap}</option>)}
                                </FormSelect>
                                <FormInput id="target_progres" label="Target progres" suffix="%" type="number" step="0.01" value={data.target_progres} onChange={set('target_progres')} error={errors.target_progres} />
                                <FormCheckbox id="is_public" label="Tampilkan di portal publik" checked={data.is_public} onChange={(e) => setData('is_public', e.target.checked)} />
                            </div>
                        </BentoCard>

                        {!ubah && (
                            <BentoCard title="Anggaran awal">
                                <div className="space-y-5">
                                    <FormInput id="tahun_anggaran" label="Tahun anggaran" type="number" value={data.tahun_anggaran} onChange={set('tahun_anggaran')} error={errors.tahun_anggaran} />
                                    <FormInput id="sumber_dana" label="Sumber dana" value={data.sumber_dana} onChange={set('sumber_dana')} error={errors.sumber_dana} />
                                    <FormInput id="pagu_anggaran" label="Pagu anggaran" prefix="Rp" type="number" step="0.01" inputMode="decimal" value={data.pagu_anggaran} onChange={set('pagu_anggaran')} error={errors.pagu_anggaran} />
                                </div>
                            </BentoCard>
                        )}
                    </div>
                </BentoGrid>
            </form>
        </AuthenticatedLayout>
    );
}
