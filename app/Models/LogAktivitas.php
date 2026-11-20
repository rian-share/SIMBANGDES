<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

#[Fillable(['user_id', 'proyek_id', 'aktivitas', 'ip_address'])]
class LogAktivitas extends Model
{
    const UPDATED_AT = null;

    protected $table = 'log_aktivitas';

    protected static function booted(): void
    {
        // Audit trail bersifat read-only (BR-SYS 6.1).
        static::updating(fn () => throw new LogicException('Audit trail bersifat read-only.'));
        static::deleting(fn () => throw new LogicException('Audit trail bersifat read-only.'));
    }

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    private const KATA_KERJA = [
        'Create.Proyek' => 'membuat proyek', 'Update.Proyek' => 'memperbarui proyek', 'Delete.Proyek' => 'menghapus proyek',
        'Create.Anggaran' => 'menetapkan anggaran', 'Update.Anggaran' => 'mengubah anggaran',
        'Create.RabKomponen' => 'menambah komponen rencana', 'Update.RabKomponen' => 'mengubah komponen rencana', 'Delete.RabKomponen' => 'menghapus komponen rencana',
        'Create.TransaksiPengeluaran' => 'mencatat pengeluaran', 'Update.TransaksiPengeluaran' => 'mengubah pengeluaran', 'Delete.TransaksiPengeluaran' => 'menghapus pengeluaran',
        'Create.LaporanProgres' => 'mengirim laporan progres', 'Update.LaporanProgres' => 'memperbarui laporan progres',
        'Create.PengaduanMasyarakat' => 'pengaduan masuk', 'Update.PengaduanMasyarakat' => 'menanggapi pengaduan',
    ];

    /**
     * Uraian terbaca untuk timeline, diturunkan dari teks aktivitas (hanya baca).
     *
     * @return array{aksi: string, judul: string, detail: ?string}
     */
    protected function uraian(): Attribute
    {
        return Attribute::get(function () {
            if (! preg_match('/^(Create|Update|Delete) (\w+) #\d+: (.*)$/u', $this->aktivitas, $m)) {
                return ['aksi' => 'Lain', 'judul' => $this->aktivitas, 'detail' => null];
            }
            [, $aksi, $entitas, $label] = $m;
            $detail = str_contains($label, ' — ') ? explode(' — ', $label, 2)[1] : null;
            $judul = self::KATA_KERJA["$aksi.$entitas"] ?? strtolower($aksi).' '.$entitas;

            if ($entitas === 'LaporanProgres' && in_array($detail, ['Disetujui', 'Ditolak'], true)) {
                $judul = 'memverifikasi laporan';
                $aksi = $detail;
            }

            return ['aksi' => $aksi, 'judul' => $judul, 'detail' => $detail ?? ($aksi === 'Create' ? $label : null)];
        });
    }

    public static function catat(string $aktivitas, ?int $proyekId = null): void
    {
        static::create([
            'user_id' => auth()->id(),
            'proyek_id' => $proyekId,
            'aktivitas' => mb_substr($aktivitas, 0, 255),
            'ip_address' => request()->ip(),
        ]);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
