import { BentoCard, BentoGrid, Button, FormInput, PageHeader } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm, usePage } from '@inertiajs/react';

export default function Edit() {
    const { user } = usePage().props.auth;
    const { data, setData, patch, processing, errors, reset } = useForm({
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const isi = (k) => (e) => setData(k, e.target.value);

    const submit = (e) => {
        e.preventDefault();
        patch(route('profil.update'), {
            preserveScroll: true,
            onSuccess: () => reset('current_password', 'password', 'password_confirmation'),
        });
    };

    return (
        <AuthenticatedLayout title="Profil Saya" hideTitle>
            <PageHeader title="Profil saya" description={`Masuk sebagai ${user.username}`} />

            <form onSubmit={submit}>
                <BentoGrid>
                    <BentoCard span="half" title="Data akun" description={`Username: ${user.username}`}>
                        <div className="space-y-5">
                            <FormInput id="nama_lengkap" label="Nama lengkap" value={data.nama_lengkap} error={errors.nama_lengkap} onChange={isi('nama_lengkap')} />
                            <FormInput id="email" type="email" label="Email" value={data.email} error={errors.email} onChange={isi('email')} />
                        </div>
                    </BentoCard>

                    <BentoCard span="half" title="Ubah kata sandi" description="Kosongkan jika tidak ingin mengubah.">
                        <div className="space-y-5">
                            <FormInput id="current_password" type="password" label="Kata sandi saat ini" autoComplete="current-password" value={data.current_password} error={errors.current_password} onChange={isi('current_password')} />
                            <FormInput id="password" type="password" label="Kata sandi baru" autoComplete="new-password" value={data.password} error={errors.password} onChange={isi('password')} />
                            <FormInput id="password_confirmation" type="password" label="Ulangi kata sandi baru" autoComplete="new-password" value={data.password_confirmation} onChange={isi('password_confirmation')} />
                        </div>
                    </BentoCard>

                    <div className="flex justify-end md:col-span-6 lg:col-span-12">
                        <Button type="submit" disabled={processing} className="w-full sm:w-auto">Simpan perubahan</Button>
                    </div>
                </BentoGrid>
            </form>
        </AuthenticatedLayout>
    );
}
