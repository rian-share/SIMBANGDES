<?php

namespace Database\Factories;

use App\Models\RabKomponen;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<RabKomponen> */
class RabKomponenFactory extends Factory
{
    protected $model = RabKomponen::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'nama_komponen' => fake()->unique()->words(2, true),
            'nominal_rencana' => '10000000.00',
        ];
    }
}
