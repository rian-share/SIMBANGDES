import { BentoCard, BentoGrid, Button, FileDropzone, FormCheckbox, FormInput, FormSelect, FormTextarea, PageHeader } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm } from '@inertiajs/react';

export default function Form({ berita = null }) {
    const ubah = berita !== null;
    const { data, setData, post, processing, errors } = useForm({
        judul: berita?.judul ?? '',
        kategori: berita?.kategori ?? 'Berita',
        ringkasan: berita?.ringkasan ?? '',
        konten: berita?.konten ?? '',
        gambar_cover: null,
        is_published: berita?.is_published ?? false,
    });
    const set = (k) => (e) => setData(k, e.target.value);
    const submit = (e) => {
        e.preventDefault();
        post(ubah ? route('pemdes.berita.update', berita.id) : route('pemdes.berita.store'), { forceFormData: true });
    };

    return (
        <AuthenticatedLayout title={ubah ? 'Ubah Berita' : 'Tulis Berita'} hideTitle>
            <PageHeader back={{ href: route('pemdes.berita.index'), label: 'Berita dan pengumuman' }} title={ubah ? 'Ubah berita' : 'Tulis berita'} description={ubah ? berita.judul : 'Konten tampil di portal publik setelah diterbitkan.'} />

            <form onSubmit={submit}>
                <BentoGrid>
                    <BentoCard span="hero" title="Isi berita">
                        <div className="space-y-5">
                            <FormInput id="judul" label="Judul" required value={data.judul} onChange={set('judul')} error={errors.judul} />
                            <FormSelect id="kategori" label="Kategori" value={data.kategori} onChange={set('kategori')} error={errors.kategori}>
                                <option>Berita</option>
                                <option>Pengumuman</option>
                            </FormSelect>
                            <FormTextarea id="ringkasan" label="Ringkasan" required rows={3} maxLength={300} hint={`${data.ringkasan.length}/300 karakter`} value={data.ringkasan} onChange={set('ringkasan')} error={errors.ringkasan} />
                            <FormTextarea id="konten" label="Konten" required rows={14} hint="Pisahkan paragraf dengan baris kosong." value={data.konten} onChange={set('konten')} error={errors.konten} />
                        </div>
                        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
                            <Button variant="secondary" href={route('pemdes.berita.index')}>Batal</Button>
                            <Button type="submit" disabled={processing}>Simpan</Button>
                        </div>
                    </BentoCard>

                    <div className="space-y-5 md:col-span-6 lg:col-span-4">
                        <BentoCard title="Gambar sampul">
                            <FileDropzone
                                id="gambar_cover"
                                accept=".jpg,.jpeg,.png,.webp"
                                hint="JPG, PNG, WEBP · maks 5 MB · dikonversi ke WebP"
                                value={data.gambar_cover}
                                onChange={(file) => setData('gambar_cover', file)}
                                existingUrl={berita?.gambar_cover ? `/storage/${berita.gambar_cover}` : undefined}
                                error={errors.gambar_cover}
                            />
                        </BentoCard>

                        <BentoCard title="Publikasi">
                            <FormCheckbox id="is_published" label="Terbitkan di portal publik" checked={data.is_published} onChange={(e) => setData('is_published', e.target.checked)} />
                            {ubah && <p className="mt-3 break-all text-xs text-slate-500">Tautan: /berita/{berita.slug}</p>}
                        </BentoCard>
                    </div>
                </BentoGrid>
            </form>
        </AuthenticatedLayout>
    );
}
