<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

#[Fillable(['nama_lengkap', 'username', 'email', 'password', 'role', 'status_aktif'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;

    protected $table = 'users';

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'status_aktif' => 'boolean',
        ];
    }

    public function logAktivitas(): HasMany
    {
        return $this->hasMany(LogAktivitas::class, 'user_id');
    }

    public function beritaPengumuman(): HasMany
    {
        return $this->hasMany(BeritaPengumuman::class, 'user_id');
    }

    public function proyekDitugaskan(): HasMany
    {
        return $this->hasMany(Proyek::class, 'pelaksana_id');
    }

    public function transaksiDiinput(): HasMany
    {
        return $this->hasMany(TransaksiPengeluaran::class, 'created_by');
    }

    public function laporanDikirim(): HasMany
    {
        return $this->hasMany(LaporanProgres::class, 'pelaksana_id');
    }

    public function laporanDiverifikasi(): HasMany
    {
        return $this->hasMany(LaporanProgres::class, 'verified_by');
    }

    public function pengaduanDitanggapi(): HasMany
    {
        return $this->hasMany(PengaduanMasyarakat::class, 'ditanggapi_oleh');
    }
}
