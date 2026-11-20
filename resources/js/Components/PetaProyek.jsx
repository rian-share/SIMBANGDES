import ProgressBar from '@/Components/UI/ProgressBar';
import StatusBadge from '@/Components/UI/StatusBadge';
import { Link } from '@inertiajs/react';
import L from 'leaflet';
import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet';

// Marker memakai divIcon (gaya di app.css): tidak bergantung pada aset PNG Leaflet yang rusak setelah bundling Vite.
const buatIkon = (p, aktif) =>
    L.divIcon({
        className: `peta-marker ${p.status_proyek === 'Terlambat' ? 'peta-marker--kritis' : ''} ${aktif ? 'peta-marker--aktif' : ''}`,
        html: '<span></span>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -10],
    });

/** Menjaga peta tetap benar: invalidateSize setelah mount & tiap ukuran kontainer berubah, lalu fit ke semua titik. */
function PasDenganData({ titik, fokus, proyek }) {
    const map = useMap();

    useEffect(() => {
        const sesuaikan = () => map.invalidateSize();
        const timer = setTimeout(sesuaikan, 0);
        const pengamat = new ResizeObserver(sesuaikan);
        pengamat.observe(map.getContainer());
        return () => {
            clearTimeout(timer);
            pengamat.disconnect();
        };
    }, [map]);

    useEffect(() => {
        if (titik.length === 1) {
            map.setView(titik[0], 14);
        } else if (titik.length > 1) {
            map.fitBounds(titik, { padding: [40, 40], maxZoom: 15 });
        }
    }, [map, titik]);

    useEffect(() => {
        const p = proyek.find((x) => x.id === fokus);
        if (p) {
            map.flyTo([Number(p.latitude), Number(p.longitude)], 16);
        }
    }, [map, fokus, proyek]);

    return null;
}

/** Roda mouse baru memperbesar peta setelah peta diklik, agar scroll halaman (terutama di seluler) tidak terjebak. */
function RodaSetelahKlik() {
    const map = useMap();

    useEffect(() => {
        const aktifkan = () => map.scrollWheelZoom.enable();
        const matikan = () => map.scrollWheelZoom.disable();
        map.on('click', aktifkan);
        map.on('mouseout', matikan);
        return () => {
            map.off('click', aktifkan);
            map.off('mouseout', matikan);
        };
    }, [map]);

    return null;
}

export default function PetaProyek({ proyek, fokus = null, className = '' }) {
    const titik = useMemo(() => proyek.map((p) => [Number(p.latitude), Number(p.longitude)]), [proyek]);
    const ikon = useMemo(() => proyek.map((p) => buatIkon(p, p.id === fokus)), [proyek, fokus]);

    return (
        <MapContainer center={[-2.5, 118]} zoom={5} scrollWheelZoom={false} zoomControl={false} className={`h-[60vh] min-h-[360px] w-full ${className}`}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="bottomright" />
            <RodaSetelahKlik />
            <PasDenganData titik={titik} fokus={fokus} proyek={proyek} />
            {proyek.map((p, i) => (
                <Marker key={`${p.id}-${p.id === fokus}`} position={titik[i]} icon={ikon[i]}>
                    <Popup>
                        <div className="w-52 space-y-2">
                            <p className="font-display font-semibold text-slate-900">{p.nama_proyek}</p>
                            <StatusBadge status={p.status_proyek} />
                            <div>
                                <ProgressBar value={p.progres_aktual} danger={p.status_proyek === 'Terlambat'} />
                                <p className="mt-1 text-xs tabular-nums text-slate-500">{p.progres_aktual}% selesai</p>
                            </div>
                            <Link href={route('proyek.publik.show', p.id)} className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 hover:text-red-600">
                                Lihat detail <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
