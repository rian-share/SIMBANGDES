<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LogAktivitas;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BackupController extends Controller
{
    private const POLA_NAMA = '/^\d{4}-\d{2}-\d{2}_\d{6}\.sql$/';

    public function index(): Response
    {
        $disk = Storage::disk('local');

        return Inertia::render('Admin/Backup/Index', [
            'berkas' => collect($disk->files('backups'))->map(fn ($f) => [
                'nama' => basename($f),
                'ukuran' => $disk->size($f),
                'dibuat' => date('c', $disk->lastModified($f)),
            ])->sortByDesc('nama')->values(),
        ]);
    }

    public function store(): RedirectResponse
    {
        $db = config('database.connections.mysql');
        $nama = now()->format('Y-m-d_His').'.sql';
        $disk = Storage::disk('local');
        $disk->makeDirectory('backups');

        $hasil = Process::env(['MYSQL_PWD' => (string) $db['password']])->run([
            config('database.mysqldump_path'), '--single-transaction', '--routines',
            '--host='.$db['host'], '--port='.$db['port'], '--user='.$db['username'],
            '--result-file='.$disk->path("backups/$nama"), $db['database'],
        ]);

        if ($hasil->failed()) {
            $disk->delete("backups/$nama");

            return back()->with('error', 'Backup gagal. Periksa MYSQLDUMP_PATH di .env.');
        }

        LogAktivitas::catat("Create Backup: $nama");

        return back()->with('success', "Backup $nama dibuat.");
    }

    public function download(string $berkas): StreamedResponse
    {
        abort_unless(preg_match(self::POLA_NAMA, $berkas) === 1 && Storage::disk('local')->exists("backups/$berkas"), 404);

        LogAktivitas::catat("Download Backup: $berkas");

        return Storage::disk('local')->download("backups/$berkas");
    }
}
