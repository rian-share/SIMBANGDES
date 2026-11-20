import { BentoCard, BentoGrid, Button, Callout, FileDropzone, FormInput, FormSelect, FormTextarea, PageHeader } from '@/Components/UI';
import PublicLayout from '@/Layouts/PublicLayout';
import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Check, Copy, RefreshCw, Send } from 'lucide-react';
import { useState } from 'react';

const LANGKAH = ['Isi formulir pengaduan beserta kode keamanan.', 'Simpan kode tiket yang muncul setelah terkirim.', 'Pantau tanggapan Pemdes lewat menu Cek Tiket.'];

export default function Create({ proyek = [], captchaSrc }) {
    const tiket = usePage().props.flash?.ticket_code;
    const [src, setSrc] = useState(captchaSrc);
    const [tersalin, setTersalin] = useState(false);
    const segarkan = () => setSrc(`${captchaSrc.split('?')[0]}?${Date.now()}`);
    const { data, setData, post, processing, errors, reset } = useForm({
        proyek_id: '', nama_pelapor: '', kontak_pelapor: '', lokasi_kejadian: '', isi_pengaduan: '', foto_bukti: null, captcha: '',
    });
    const isi = (k) => (e) => setData(k, e.target.value);

    const kirim = (e) => {
        e.preventDefault();
        post(route('pengaduan.store'), { forceFormData: true, onSuccess: () => reset(), onFinish: segarkan });
    };

    const salin = async () => {
        try {
            await navigator.clipboard.writeText(tiket);
            setTersalin(true);
            setTimeout(() => setTersalin(false), 2000);
        } catch {
            setTersalin(false);
        }
    };

    return (
        <PublicLayout title="Pengaduan Masyarakat">
            <PageHeader eyebrow="Layanan masyarakat" title="Sampaikan pengaduan" description="Tanpa login atau pendaftaran. Kontak Anda tidak ditampilkan secara publik." />

            <BentoGrid>
                {tiket && (
                    <div className="md:col-span-6 lg:col-span-12">
                        <Callout tone="success" title="Pengaduan terkirim. Simpan kode tiket Anda:" className="!p-5">
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                                <p className="font-mono text-2xl font-semibold tracking-wider text-slate-900 md:text-3xl">{tiket}</p>
                                <Button variant="secondary" size="sm" icon={tersalin ? Check : Copy} onClick={salin}>{tersalin ? 'Tersalin' : 'Salin kode'}</Button>
                            </div>
                            <Link href={`${route('pengaduan.cek')}?kode=${tiket}`} className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-slate-900 underline underline-offset-4">
                                Cek status tiket <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </Callout>
                    </div>
                )}

                <BentoCard span="hero" title="Formulir pengaduan">
                    <form onSubmit={kirim} className="grid gap-5 md:grid-cols-2">
                        <FormInput id="nama_pelapor" label="Nama" required value={data.nama_pelapor} onChange={isi('nama_pelapor')} error={errors.nama_pelapor} />
                        <FormInput id="kontak_pelapor" label="Kontak" hint="Opsional. Hanya dilihat petugas." value={data.kontak_pelapor} onChange={isi('kontak_pelapor')} error={errors.kontak_pelapor} />
                        <FormSelect id="proyek_id" label="Proyek terkait" hint="Opsional." value={data.proyek_id} onChange={isi('proyek_id')} error={errors.proyek_id}>
                            <option value="">Tidak spesifik</option>
                            {proyek.map((p) => <option key={p.id} value={p.id}>{p.nama_proyek}</option>)}
                        </FormSelect>
                        <FormInput id="lokasi_kejadian" label="Lokasi kejadian" required value={data.lokasi_kejadian} onChange={isi('lokasi_kejadian')} error={errors.lokasi_kejadian} />
                        <FormTextarea id="isi_pengaduan" label="Isi pengaduan" required rows={6} className="md:col-span-2" value={data.isi_pengaduan} onChange={isi('isi_pengaduan')} error={errors.isi_pengaduan} />

                        <FileDropzone
                            id="foto_bukti"
                            label="Foto bukti"
                            hint="Opsional · JPG, PNG, WEBP · maks 5 MB"
                            className="md:col-span-2"
                            value={data.foto_bukti}
                            onChange={(file) => setData('foto_bukti', file)}
                            error={errors.foto_bukti}
                        />

                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 md:col-span-2">
                            <p className="text-[13px] font-medium text-slate-700">Kode keamanan</p>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <img src={src} alt="Gambar kode keamanan" className="h-10 rounded-lg border border-slate-300 bg-white" />
                                <Button variant="ghost" size="sm" icon={RefreshCw} onClick={segarkan}>Ganti gambar</Button>
                            </div>
                            <FormInput aria-label="Kode keamanan" placeholder="Ketik kode pada gambar" autoComplete="off" className="mt-3 sm:max-w-xs" value={data.captcha} onChange={isi('captcha')} error={errors.captcha} />
                        </div>

                        <div className="flex justify-end border-t border-slate-100 pt-5 md:col-span-2">
                            <Button type="submit" disabled={processing} icon={Send} className="w-full sm:w-auto">{processing ? 'Mengirim…' : 'Kirim pengaduan'}</Button>
                        </div>
                    </form>
                </BentoCard>

                <div className="space-y-5 md:col-span-6 lg:col-span-4">
                    <BentoCard title="Cara kerja">
                        <ol className="space-y-4">
                            {LANGKAH.map((l, i) => (
                                <li key={l} className="flex gap-3 text-sm leading-6 text-slate-600">
                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-xs font-semibold tabular-nums text-slate-900">{i + 1}</span>
                                    {l}
                                </li>
                            ))}
                        </ol>
                    </BentoCard>
                    <BentoCard variant="inverse" title="Sudah mengadu?" description="Lacak status dengan kode tiket.">
                        <Link href={route('pengaduan.cek')} className="inline-flex items-center gap-1 text-[13px] font-medium text-white hover:underline">
                            Cek status tiket <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </BentoCard>
                    <BentoCard variant="muted" title="Privasi">
                        <p className="text-sm leading-6 text-slate-600">Nama dan kontak Anda hanya dilihat petugas Pemdes dan tidak muncul saat tiket dilacak.</p>
                    </BentoCard>
                </div>
            </BentoGrid>
        </PublicLayout>
    );
}
