import { Button, FileDropzone, FormInput, FormSelect } from '@/Components/UI';
import { useForm } from '@inertiajs/react';

/**
 * Form catat/ubah pengeluaran. komponen: [{ id, nama_komponen }] milik anggaran proyek terkait.
 * Update memakai POST multipart (lihat route transaksi.update).
 */
export default function FormTransaksi({ proyekId, komponen = [], transaksi = null, onSelesai = () => {} }) {
    const ubah = transaksi !== null;
    const { data, setData, post, processing, errors, reset } = useForm({
        tanggal_transaksi: transaksi?.tanggal_transaksi?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        rab_komponen_id: transaksi?.rab_komponen_id ?? '',
        uraian: transaksi?.uraian ?? '',
        nominal: transaksi?.nominal ?? '',
        bukti_transaksi: null,
    });
    const set = (k) => (e) => setData(k, e.target.value);
    const submit = (e) => {
        e.preventDefault();
        post(ubah ? route('pemdes.transaksi.update', transaksi.id) : route('pemdes.transaksi.store', proyekId), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => { reset(); onSelesai(); },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <FormInput id="tanggal_transaksi" label="Tanggal" type="date" value={data.tanggal_transaksi} onChange={set('tanggal_transaksi')} error={errors.tanggal_transaksi} />
            <FormSelect id="rab_komponen_id" label="Jenis pengeluaran" value={data.rab_komponen_id} onChange={set('rab_komponen_id')} error={errors.rab_komponen_id}>
                <option value="">Tanpa komponen</option>
                {komponen.map((k) => <option key={k.id} value={k.id}>{k.nama_komponen}</option>)}
            </FormSelect>
            <FormInput id="nominal" label="Nominal" prefix="Rp" type="number" step="0.01" inputMode="decimal" value={data.nominal} onChange={set('nominal')} error={errors.nominal} />
            <FormInput id="uraian" label="Keterangan" value={data.uraian} onChange={set('uraian')} error={errors.uraian} />
            <FileDropzone
                id="bukti_transaksi"
                label="Bukti transaksi"
                accept=".jpg,.jpeg,.png,.pdf"
                hint="JPG, PNG, PDF · maks 5 MB"
                value={data.bukti_transaksi}
                onChange={(file) => setData('bukti_transaksi', file)}
                existingUrl={ubah && transaksi.bukti_transaksi && /\.(jpe?g|png)$/i.test(transaksi.bukti_transaksi) ? `/storage/${transaksi.bukti_transaksi}` : undefined}
                error={errors.bukti_transaksi}
            />
            <div className="flex gap-2">
                <Button type="submit" disabled={processing}>{ubah ? 'Perbarui' : 'Catat pengeluaran'}</Button>
                {ubah && <Button variant="secondary" onClick={onSelesai}>Batal</Button>}
            </div>
        </form>
    );
}
