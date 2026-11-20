import { formatRupiah } from '@/Components/UI/format';

/** Rupiah ber-tabular-nums; mode ringkas menyimpan nilai penuh di title. */
export default function Money({ value, ringkas = false, className = '' }) {
    return (
        <span title={ringkas ? formatRupiah(value) : undefined} className={`tabular-nums ${className}`}>
            {formatRupiah(value, { ringkas })}
        </span>
    );
}
