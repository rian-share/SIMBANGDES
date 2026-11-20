<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable(['judul', 'slug', 'kategori', 'ringkasan', 'konten', 'gambar_cover', 'is_published', 'published_at'])]
class BeritaPengumuman extends Model
{
    use HasFactory;

    protected $table = 'berita_pengumuman';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['is_published' => 'boolean', 'published_at' => 'datetime'];
    }

    public function penulis(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Terbit = dipublikasikan dan waktunya sudah tiba. */
    public function scopeTerbit(Builder $query): void
    {
        $query->where('is_published', true)->where('published_at', '<=', now());
    }

    public static function buatSlug(string $judul): string
    {
        $dasar = Str::limit(Str::slug($judul), 200, '') ?: 'berita';
        $slug = $dasar;
        for ($i = 2; static::where('slug', $slug)->exists(); $i++) {
            $slug = "{$dasar}-{$i}";
        }

        return $slug;
    }
}
