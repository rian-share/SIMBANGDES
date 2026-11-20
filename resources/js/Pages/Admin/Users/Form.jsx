import { BentoCard, BentoGrid, Button, FormInput, FormSelect, PageHeader } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm } from '@inertiajs/react';

export default function Form({ user = null }) {
    const ubah = user !== null;
    const { data, setData, post, put, processing, errors } = useForm({
        nama_lengkap: user?.nama_lengkap ?? '', username: user?.username ?? '', email: user?.email ?? '', role: user?.role ?? 'pelaksana', password: '', password_confirmation: '',
    });
    const reset = useForm({ password: '', password_confirmation: '' });
    const set = (k) => (e) => setData(k, e.target.value);

    const simpan = (e) => {
        e.preventDefault();
        if (ubah) {
            put(route('admin.users.update', user.id));
        } else {
            post(route('admin.users.store'));
        }
    };

    return (
        <AuthenticatedLayout title={ubah ? 'Ubah User' : 'Tambah User'} hideTitle>
            <PageHeader back={{ href: route('admin.users.index'), label: 'Manajemen user' }} title={ubah ? 'Ubah user' : 'Tambah user'} description={ubah ? user.username : 'Buat akun baru untuk admin, Pemdes, atau pelaksana.'} />

            <BentoGrid>
                <BentoCard span="chart" title="Data akun">
                    <form onSubmit={simpan} className="grid gap-5 sm:grid-cols-2">
                        <FormInput id="nama_lengkap" label="Nama lengkap" required value={data.nama_lengkap} onChange={set('nama_lengkap')} error={errors.nama_lengkap} className="sm:col-span-2" />
                        <FormInput id="username" label="Username" required value={data.username} onChange={set('username')} error={errors.username} />
                        <FormSelect id="role" label="Role" value={data.role} onChange={set('role')} error={errors.role}>
                            {['admin', 'pemdes', 'pelaksana'].map((r) => <option key={r}>{r}</option>)}
                        </FormSelect>
                        <FormInput id="email" label="Email" type="email" required value={data.email} onChange={set('email')} error={errors.email} className="sm:col-span-2" />
                        {!ubah && (
                            <>
                                <FormInput id="password" label="Kata sandi" type="password" value={data.password} onChange={set('password')} error={errors.password} />
                                <FormInput id="password_confirmation" label="Ulangi kata sandi" type="password" value={data.password_confirmation} onChange={set('password_confirmation')} />
                            </>
                        )}
                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-5 sm:col-span-2">
                            <Button variant="secondary" href={route('admin.users.index')}>Kembali</Button>
                            <Button type="submit" disabled={processing}>Simpan</Button>
                        </div>
                    </form>
                </BentoCard>

                {ubah && (
                    <BentoCard span="list" title="Reset kata sandi" description="Atur kata sandi baru untuk akun ini.">
                        <form
                            onSubmit={(e) => { e.preventDefault(); reset.post(route('admin.users.reset-password', user.id), { preserveScroll: true, onSuccess: () => reset.reset() }); }}
                            className="space-y-5"
                        >
                            <FormInput id="rp" label="Kata sandi baru" type="password" value={reset.data.password} onChange={(e) => reset.setData('password', e.target.value)} error={reset.errors.password} />
                            <FormInput id="rpc" label="Ulangi kata sandi" type="password" value={reset.data.password_confirmation} onChange={(e) => reset.setData('password_confirmation', e.target.value)} />
                            <Button type="submit" variant="secondary" disabled={reset.processing}>Reset kata sandi</Button>
                        </form>
                    </BentoCard>
                )}
            </BentoGrid>
        </AuthenticatedLayout>
    );
}
