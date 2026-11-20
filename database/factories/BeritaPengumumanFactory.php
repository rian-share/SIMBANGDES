<?php

namespace Database\Factories;

use App\Models\BeritaPengumuman;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<BeritaPengumuman> */
class BeritaPengumumanFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $judul = fake()->sentence(6);

        return [
            'user_id' => User::factory()->state(['role' => 'pemdes']),
            'judul' => $judul,
            'slug' => Str::slug($judul).'-'.Str::lower(Str::random(4)),
            'kategori' => fake()->randomElement(['Berita', 'Pengumuman']),
            'ringkasan' => fake()->sentence(14),
            'konten' => fake()->paragraphs(4, true),
            'gambar_cover' => null,
            'is_published' => true,
            'published_at' => now()->subDay(),
        ];
    }

    public function draf(): static
    {
        return $this->state(['is_published' => false, 'published_at' => null]);
    }
}
