<?php

namespace App\Providers;

use App\Models\Anggaran;
use App\Models\BeritaPengumuman;
use App\Models\LaporanProgres;
use App\Models\PengaduanMasyarakat;
use App\Models\Proyek;
use App\Models\RabKomponen;
use App\Models\TransaksiPengeluaran;
use App\Models\User;
use App\Observers\AuditTrailObserver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        foreach ([Proyek::class, Anggaran::class, TransaksiPengeluaran::class, LaporanProgres::class, PengaduanMasyarakat::class, User::class, BeritaPengumuman::class, RabKomponen::class] as $model) {
            $model::observe(AuditTrailObserver::class);
        }

        // Lazy loading (sumber N+1) langsung melempar exception di lokal & test; dimatikan di produksi.
        Model::preventLazyLoading(! $this->app->isProduction());
    }
}
