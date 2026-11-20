<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Format;
use Intervention\Image\ImageManager;

class ImageCompressionService
{
    /** Perkecil (maks. lebar 1600px), kompres kualitas 80, simpan sebagai WebP ber-UUID. Mengembalikan path relatif disk public. */
    public function simpan(UploadedFile $file, string $folder = 'dokumentasi'): string
    {
        $hasil = ImageManager::usingDriver(Driver::class)
            ->decodePath($file->getRealPath())
            ->scaleDown(width: 1600)
            ->encodeUsingFormat(Format::WEBP, quality: 80);

        $path = $folder.'/'.Str::uuid().'.webp';
        Storage::disk('public')->put($path, (string) $hasil);

        return $path;
    }
}
