<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Rekap Pembangunan Desa</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #0f172a; }
        h1 { font-size: 16px; color: #b91c1c; margin: 0 0 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #1e293b; color: #fff; text-align: left; padding: 5px; }
        td { border-bottom: 1px solid #cbd5e1; padding: 5px; }
        .r { text-align: right; }
        tfoot td { font-weight: bold; background: #f1f5f9; }
    </style>
</head>
<body>
    <h1>Rekap Pembangunan &amp; Realisasi Anggaran</h1>
    <div>SIMBANGDES &middot; Dicetak {{ $dicetak->format('d/m/Y H:i') }}</div>
    <table>
        <thead>
            <tr><th>Proyek</th><th>Pelaksana</th><th>Status</th><th class="r">Progres</th><th class="r">Pagu</th><th class="r">Realisasi</th><th class="r">Sisa</th></tr>
        </thead>
        <tbody>
            @foreach ($proyek as $p)
                <tr>
                    <td>{{ $p->nama_proyek }}</td>
                    <td>{{ $p->pelaksana->nama_lengkap }}</td>
                    <td>{{ $p->status_proyek }}</td>
                    <td class="r">{{ number_format($p->progres_aktual, 2, ',', '.') }}%</td>
                    <td class="r">{{ number_format($p->anggaran?->pagu_anggaran ?? 0, 2, ',', '.') }}</td>
                    <td class="r">{{ number_format($p->anggaran?->total_realisasi ?? 0, 2, ',', '.') }}</td>
                    <td class="r">{{ number_format($p->anggaran?->sisa_anggaran ?? 0, 2, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4">Total</td>
                <td class="r">{{ number_format($proyek->sum(fn ($p) => $p->anggaran?->pagu_anggaran ?? 0), 2, ',', '.') }}</td>
                <td class="r">{{ number_format($proyek->sum(fn ($p) => $p->anggaran?->total_realisasi ?? 0), 2, ',', '.') }}</td>
                <td class="r">{{ number_format($proyek->sum(fn ($p) => $p->anggaran?->sisa_anggaran ?? 0), 2, ',', '.') }}</td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
