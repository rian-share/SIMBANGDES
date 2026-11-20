import GrafikRencanaRealisasi from '@/Components/GrafikRencanaRealisasi';
import Lightbox from '@/Components/Lightbox';
import Selisih from '@/Components/Selisih';
import TimelineRiwayat from '@/Components/TimelineRiwayat';
import { BentoCard, BentoGrid, Button, DataTable, EmptyState, KpiCard, Money, PageHeader, ProgressBar, StatusBadge, formatPersen, formatRupiah, formatTanggal } from '@/Components/UI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';
import { Banknote, Gauge, History, Pencil, PiggyBank, Wallet } from 'lucide-react';
import { useState } from 'react';

const TAHAP = ['Sebelum', 'Saat', 'Sesudah'];
const tautan = 'text-[13px] font-medium text-slate-600 hover:text-slate-900';

export default function Show({ proyek, anggaran, rencana = { baris: [], total: {} }, transaksi = [], laporan = [], foto = [], riwayat = [], risiko }) {
    const [indeks, setIndeks] = useState(null);
    const urutan = TAHAP.flatMap((t) => foto.filter((f) => f.tahap === t));
    const items = urutan.map((f) => ({ src: `/storage/${f.file_path}`, alt: `Foto ${f.tahap}`, caption: `${proyek.nama_proyek} — ${f.tahap}` }));
    const terlambat = proyek.status_proyek === 'Terlambat';

    const kolomRencana = [
        { key: 'komponen', header: 'Komponen', primary: true },
        { key: 'rencana', header: 'Rencana', align: 'right', render: (b) => formatRupiah(b.rencana) },
        { key: 'realisasi', header: 'Realisasi', align: 'right', render: (b) => formatRupiah(b.realisasi) },
        { key: 'selisih', header: 'Selisih', align: 'right', render: (b) => <Selisih value={b.selisih} /> },
    ];
    const kolomTransaksi = [
        { key: 'tanggal_transaksi', header: 'Tanggal', render: (t) => <span className="whitespace-nowrap">{formatTanggal(t.tanggal_transaksi)}</span> },
        { key: 'uraian', header: 'Keterangan', primary: true },
        { key: 'komponen', header: 'Jenis', render: (t) => t.komponen?.nama_komponen ?? 'Tanpa komponen' },
        { key: 'nominal', header: 'Nominal', align: 'right', render: (t) => formatRupiah(t.nominal) },
    ];

    return (
        <AuthenticatedLayout title={proyek.nama_proyek} hideTitle>
            <PageHeader
                back={{ href: route('pemdes.proyek.index'), label: 'Proyek' }}
                eyebrow={proyek.kategori}
                title={proyek.nama_proyek}
                description={[proyek.lokasi, `${formatTanggal(proyek.tanggal_mulai)} sampai ${formatTanggal(proyek.tanggal_selesai)}`].filter(Boolean).join(' · ')}
                actions={(
                    <>
                        <Button variant="secondary" icon={Wallet} href={route('pemdes.anggaran.show', proyek.id)}>Kelola anggaran</Button>
                        <Button icon={Pencil} href={route('pemdes.proyek.edit', proyek.id)}>Ubah proyek</Button>
                    </>
                )}
            />

            <BentoGrid>
                <BentoCard span="hero" title="Ringkasan proyek" action={<StatusBadge status={proyek.status_proyek} />}>
                    <dl className="grid gap-4 text-sm sm:grid-cols-3">
                        <div><dt className="text-xs text-slate-500">Pelaksana</dt><dd className="mt-0.5 font-medium text-slate-900">{proyek.pelaksana?.nama_lengkap ?? '-'}</dd></div>
                        <div><dt className="text-xs text-slate-500">Mulai</dt><dd className="mt-0.5 font-medium tabular-nums text-slate-900">{formatTanggal(proyek.tanggal_mulai)}</dd></div>
                        <div><dt className="text-xs text-slate-500">Selesai</dt><dd className="mt-0.5 font-medium tabular-nums text-slate-900">{formatTanggal(proyek.tanggal_selesai)}</dd></div>
                    </dl>
                    {proyek.deskripsi && <p className="mt-5 max-w-[68ch] text-sm leading-6 text-slate-600">{proyek.deskripsi}</p>}
                    <div className="mt-6">
                        <ProgressBar value={proyek.progres_aktual} danger={terlambat} className="!h-2.5" />
                        <p className="mt-2 text-xs tabular-nums text-slate-500">Progres {formatPersen(proyek.progres_aktual)} dari target {formatPersen(proyek.target_progres)} · target jadwal berjalan {formatPersen(risiko.target_berjalan)}</p>
                    </div>
                </BentoCard>

                <BentoCard span="highlight" title="Risiko jadwal" action={<StatusBadge status={risiko.level} />}>
                    <p className="text-sm text-slate-600">Deviasi progres <b className={`font-medium tabular-nums ${Number(risiko.deviasi) < 0 ? 'text-red-600' : 'text-slate-900'}`}>{formatPersen(risiko.deviasi)}</b> terhadap target jadwal.</p>
                    <div className="mt-5 flex flex-col gap-2">
                        <Button variant="secondary" icon={History} href={route('pemdes.riwayat.index', { proyek: proyek.id })}>Lihat riwayat</Button>
                        <Button variant="secondary" href={route('pemdes.laporan.index')}>Verifikasi laporan</Button>
                    </div>
                </BentoCard>

                <div className="grid grid-cols-2 gap-5 md:col-span-6 lg:col-span-12 lg:grid-cols-4">
                    <KpiCard label="Pagu" icon={Wallet}><Money value={anggaran.pagu_anggaran} ringkas /></KpiCard>
                    <KpiCard label="Realisasi" icon={Banknote} hint={`Serapan ${formatPersen(anggaran.persentase_serapan)}`}><Money value={anggaran.total_realisasi} ringkas /></KpiCard>
                    <KpiCard label="Sisa" icon={PiggyBank}><Money value={anggaran.sisa_anggaran} ringkas /></KpiCard>
                    <KpiCard label="Progres fisik" icon={Gauge} tone={terlambat ? 'critical' : 'default'} value={formatPersen(proyek.progres_aktual)} />
                </div>

                <BentoCard span="chart" title="Rencana vs realisasi" action={<Link href={route('pemdes.keuangan.rencana-realisasi', { proyek: proyek.id })} className={tautan}>Detail</Link>}>
                    {rencana.baris.length === 0 ? <EmptyState title="Belum ada rincian komponen rencana" /> : <GrafikRencanaRealisasi baris={rencana.baris} />}
                </BentoCard>

                <BentoCard span="list" title="Riwayat terbaru" action={<Link href={route('pemdes.riwayat.index', { proyek: proyek.id })} className={tautan}>Lihat semua</Link>}>
                    <TimelineRiwayat items={riwayat} />
                </BentoCard>

                {rencana.baris.length > 0 && <DataTable title="Rincian per komponen" columns={kolomRencana} rows={rencana.baris} rowKey="komponen" />}

                <BentoCard span="list" title="Laporan progres" description="5 laporan terakhir">
                    {laporan.length === 0 ? <EmptyState title="Belum ada laporan" /> : (
                        <ul className="divide-y divide-slate-100 text-sm">
                            {laporan.map((l) => (
                                <li key={l.id} className="py-3.5 first:pt-0 last:pb-0">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="tabular-nums text-slate-900">{formatTanggal(l.tanggal_laporan)} · <b className="font-medium">{formatPersen(l.persentase_fisik)}</b></span>
                                        <StatusBadge status={l.status_verifikasi} />
                                    </div>
                                    {l.verifikator && <p className="mt-0.5 text-xs text-slate-500">Diverifikasi {l.verifikator.nama_lengkap} · {formatTanggal(l.verified_at)}</p>}
                                    {l.catatan_revisi && <p className="mt-1 text-[13px] text-red-600">Catatan: {l.catatan_revisi}</p>}
                                </li>
                            ))}
                        </ul>
                    )}
                </BentoCard>

                <BentoCard span="chart" title="Dokumentasi 3 tahap" description="Sebelum, Saat, Sesudah">
                    {foto.length === 0 ? <EmptyState title="Belum ada dokumentasi foto" /> : (
                        <div className="grid gap-5 sm:grid-cols-3">
                            {TAHAP.map((t) => (
                                <div key={t}>
                                    <p className="mb-2 text-xs font-medium text-slate-500">{t}</p>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                                        {foto.filter((f) => f.tahap === t).map((f) => (
                                            <button key={f.id} type="button" onClick={() => setIndeks(urutan.indexOf(f))} className="overflow-hidden rounded-xl border border-slate-200/80">
                                                <img src={`/storage/${f.file_path}`} alt={`Foto ${t}`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                                            </button>
                                        ))}
                                        {!foto.some((f) => f.tahap === t) && <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">Belum ada</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </BentoCard>

                <DataTable
                    title="Pengeluaran terakhir"
                    action={<Link href={route('pemdes.keuangan.pengeluaran', { proyek: proyek.id })} className={tautan}>Lihat semua</Link>}
                    columns={kolomTransaksi}
                    rows={transaksi}
                    empty={{ title: 'Belum ada pengeluaran' }}
                />
            </BentoGrid>
            <Lightbox items={items} index={indeks} onClose={() => setIndeks(null)} onIndexChange={setIndeks} />
        </AuthenticatedLayout>
    );
}
