import FlashToast from '@/Components/FlashToast';
import { Button, FormCheckbox, FormInput } from '@/Components/UI';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye, EyeOff, FolderKanban, ShieldCheck, Wallet } from 'lucide-react';
import { useState } from 'react';

const FITUR = [
    [FolderKanban, 'Monitoring proyek dan progres fisik'],
    [Wallet, 'Pengelolaan anggaran yang transparan'],
    [ShieldCheck, 'Jejak audit untuk setiap aktivitas'],
];

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({ login: '', password: '', remember: false });
    const [tampil, setTampil] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
            <Head title="Masuk" />
            <FlashToast />

            <aside className="hidden flex-col justify-between border-r border-slate-200/80 bg-white p-12 lg:flex">
                <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-600 text-sm font-semibold text-white">S</span>
                    <span className="font-display text-base font-semibold tracking-tight text-slate-900">SIMBANGDES</span>
                </div>

                <div>
                    <h1 className="max-w-md font-display text-4xl font-semibold leading-[1.15] tracking-tight text-slate-900">
                        Kelola pembangunan desa dengan data yang rapi.
                    </h1>
                    <p className="mt-4 max-w-md text-base leading-7 text-slate-600">Sistem Informasi Manajemen Pembangunan dan Transparansi Desa.</p>
                    <ul className="mt-8 space-y-3.5 text-sm text-slate-600">
                        {FITUR.map(([Ikon, teks]) => (
                            <li key={teks} className="flex items-center gap-3"><Ikon className="h-4 w-4 text-slate-500" aria-hidden="true" />{teks}</li>
                        ))}
                    </ul>
                </div>

                <Link href={route('beranda')} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />Kembali ke portal publik
                </Link>
            </aside>

            <main className="flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex items-center gap-2.5 lg:hidden">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-600 text-sm font-semibold text-white">S</span>
                        <span className="font-display text-base font-semibold tracking-tight text-slate-900">SIMBANGDES</span>
                    </div>

                    <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Masuk ke panel</h2>
                    <p className="mt-1.5 text-sm text-slate-500">Gunakan email atau username Anda.</p>

                    <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
                        <FormInput id="login" label="Email atau username" autoComplete="username" autoFocus value={data.login} onChange={(e) => setData('login', e.target.value)} error={errors.login} />

                        <div>
                            <div className="relative">
                                <FormInput id="password" label="Kata sandi" type={tampil ? 'text' : 'password'} autoComplete="current-password" inputClassName="pr-10" value={data.password} onChange={(e) => setData('password', e.target.value)} error={errors.password} />
                                <button
                                    type="button"
                                    onClick={() => setTampil((s) => !s)}
                                    aria-label={tampil ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                    className="absolute right-3 top-[38px] text-slate-500 hover:text-slate-900"
                                >
                                    {tampil ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <FormCheckbox id="remember" label="Ingat saya" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} />

                        <Button type="submit" disabled={processing} className="w-full">{processing ? 'Memproses…' : 'Masuk'}</Button>
                    </form>

                    <Link href={route('beranda')} className="mt-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900 lg:hidden">
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />Kembali ke portal publik
                    </Link>
                </div>
            </main>
        </div>
    );
}
