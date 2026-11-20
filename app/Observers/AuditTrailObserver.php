<?php

namespace App\Observers;

use App\Models\Anggaran;
use App\Models\BeritaPengumuman;
use App\Models\LaporanProgres;
use App\Models\LogAktivitas;
use App\Models\PengaduanMasyarakat;
use App\Models\Proyek;
use App\Models\RabKomponen;
use App\Models\TransaksiPengeluaran;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/** Mencatat Create/Update/Delete ke log_aktivitas dengan format "{Aksi} {Entitas} #{id}: {label}" (V-13). */
class AuditTrailObserver
{
    public function created(Model $model): void
    {
        $this->catat('Create', $model);
    }

    public function updated(Model $model): void
    {
        // Abaikan perubahan teknis (token "ingat saya") agar log tidak berisik.
        if (array_diff(array_keys($model->getChanges()), ['remember_token', 'updated_at']) === []) {
            return;
        }
        $this->catat('Update', $model);
    }

    public function deleted(Model $model): void
    {
        $this->catat('Delete', $model);
    }

    private function catat(string $aksi, Model $model): void
    {
        // Lewati konteks tanpa pengguna login (seeder, console, pengaduan publik).
        if (! auth()->check()) {
            return;
        }

        $entitas = class_basename($model);
        LogAktivitas::catat("$aksi $entitas #{$model->getKey()}: {$this->label($aksi, $model)}", $this->proyekId($model));
    }

    /** Tanpa menyentuh relasi (preventLazyLoading aktif). */
    private function proyekId(Model $model): ?int
    {
        return match (true) {
            $model instanceof Proyek => $model->getKey(),
            $model instanceof Anggaran, $model instanceof LaporanProgres, $model instanceof PengaduanMasyarakat => $model->proyek_id,
            $model instanceof TransaksiPengeluaran, $model instanceof RabKomponen => Anggaran::whereKey($model->anggaran_id)->value('proyek_id'),
            default => null,
        };
    }

    private function label(string $aksi, Model $model): string
    {
        $dasar = match (true) {
            $model instanceof Proyek => $model->nama_proyek,
            $model instanceof Anggaran => "proyek #{$model->proyek_id}",
            $model instanceof TransaksiPengeluaran => "{$model->uraian} ({$this->rupiah($model->nominal)})",
            $model instanceof RabKomponen => "{$model->nama_komponen} ({$this->rupiah($model->nominal_rencana)})",
            $model instanceof LaporanProgres => "proyek #{$model->proyek_id} ({$model->persentase_fisik}%)",
            $model instanceof PengaduanMasyarakat => $model->kode_tiket,
            $model instanceof User => $model->username,
            $model instanceof BeritaPengumuman => $model->judul,
            default => '',
        };

        $detail = $aksi === 'Update' ? $this->detailUpdate($model) : [];

        return $detail === [] ? $dasar : $dasar.' — '.implode('; ', $detail);
    }

    /** @return list<string> */
    private function detailUpdate(Model $model): array
    {
        $berubah = fn (string $k): bool => $model->wasChanged($k);
        $lama = fn (string $k) => $model->getOriginal($k);
        $detail = [];

        if ($model instanceof Proyek) {
            if ($berubah('pelaksana_id')) {
                $detail[] = 'pelaksana: '.(User::whereKey($model->pelaksana_id)->value('nama_lengkap') ?? '-');
            }
            if ($berubah('status_proyek')) {
                $detail[] = "status: {$lama('status_proyek')} → {$model->status_proyek}";
            }
            if ($berubah('progres_aktual')) {
                $detail[] = "progres {$lama('progres_aktual')}% → {$model->progres_aktual}%";
            }
        } elseif ($model instanceof Anggaran) {
            if ($berubah('pagu_anggaran')) {
                $detail[] = "pagu {$this->rupiah($lama('pagu_anggaran'))} → {$this->rupiah($model->pagu_anggaran)}";
            }
            if ($berubah('sumber_dana')) {
                $detail[] = "sumber dana: {$model->sumber_dana}";
            }
        } elseif ($model instanceof LaporanProgres && $berubah('status_verifikasi')) {
            $detail[] = $model->status_verifikasi === 'Menunggu' ? 'Revisi dikirim' : $model->status_verifikasi;
        }

        return $detail;
    }

    private function rupiah(mixed $nominal): string
    {
        return 'Rp '.number_format((float) $nominal, 0, ',', '.');
    }
}
