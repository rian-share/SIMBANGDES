import BentoCard from '@/Components/UI/BentoCard';
import { IconButton } from '@/Components/UI/Button';
import EmptyState from '@/Components/UI/EmptyState';
import { useConfirm } from '@/Components/UI/Modal';
import Pagination from '@/Components/UI/Pagination';

const SEMBUNYI = { md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' };

function Aksi({ aksi }) {
    const konfirmasi = useConfirm();

    return (
        <div className="flex items-center justify-end gap-0.5">
            {aksi.map((a) => (
                <IconButton
                    key={a.label}
                    icon={a.icon}
                    label={a.label}
                    href={a.href}
                    variant={a.danger ? 'danger' : 'ghost'}
                    onClick={a.href ? undefined : async () => {
                        // Aksi berbahaya selalu lewat modal konfirmasi.
                        if (a.confirm && !(await konfirmasi(a.confirm))) return;
                        a.onClick?.();
                    }}
                />
            ))}
        </div>
    );
}

/**
 * Tabel data: tabel >= md, daftar kartu ringkas < md (tanpa scroll horizontal).
 * columns: [{ key, header, primary?, badge?, align?, hideBelow?: 'md'|'lg', render?(row) }]
 * actions(row) -> [{ label, icon, href?, onClick?, danger?, confirm?: { title, description, confirmLabel } }]
 * paginator: objek paginator Laravel (data tidak dipakai; kirim `rows` terpisah).
 */
export default function DataTable({ columns = [], rows = [], rowKey = 'id', actions, toolbar, paginator, empty, title, description, action, span = 'full', className = '' }) {
    const sel = (r, c) => (c.render ? c.render(r) : r[c.key]);
    const utama = columns.find((c) => c.primary) ?? columns[0];
    const lencana = columns.find((c) => c.badge);
    const lainnya = columns.filter((c) => c !== utama && c !== lencana && !c.hideBelow);

    return (
        <BentoCard flush span={span} title={title} description={description} action={action} className={className}>
            {toolbar && <div className={`px-6 pb-4 md:px-7 ${title ? '' : 'pt-6 md:pt-7'}`}>{toolbar}</div>}

            {rows.length === 0 ? (
                <div className="border-t border-slate-100"><EmptyState title={empty?.title ?? 'Belum ada data'} description={empty?.description} action={empty?.action} /></div>
            ) : (
                <>
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-sm">
                            <thead className="border-y border-slate-200/80 bg-slate-50/80">
                                <tr>
                                    {columns.map((c) => (
                                        <th key={c.key} scope="col" className={`px-4 py-2.5 text-xs font-medium text-slate-500 first:pl-6 md:first:pl-7 ${c.align === 'right' ? 'text-right' : 'text-left'} ${c.hideBelow ? SEMBUNYI[c.hideBelow] : ''}`}>{c.header}</th>
                                    ))}
                                    {actions && <th scope="col" className="w-px px-4 py-2.5 pr-6 md:pr-7"><span className="sr-only">Aksi</span></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r[rowKey]} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60">
                                        {columns.map((c) => (
                                            <td key={c.key} className={`px-4 py-3.5 first:pl-6 md:first:pl-7 ${c.primary ? 'font-medium text-slate-900' : 'text-slate-600'} ${c.align === 'right' ? 'text-right tabular-nums' : ''} ${c.hideBelow ? SEMBUNYI[c.hideBelow] : ''} ${c.className ?? ''}`}>{sel(r, c)}</td>
                                        ))}
                                        {actions && <td className="w-px whitespace-nowrap px-4 py-2 pr-5 md:pr-6"><Aksi aksi={actions(r)} /></td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <ul className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
                        {rows.map((r) => (
                            <li key={r[rowKey]} className="px-5 py-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 break-words font-medium text-slate-900">{sel(r, utama)}</div>
                                    {lencana && <div className="shrink-0">{sel(r, lencana)}</div>}
                                </div>
                                {lainnya.length > 0 && (
                                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                                        {lainnya.map((c) => (
                                            <div key={c.key} className="min-w-0">
                                                <dt className="text-xs text-slate-500">{c.header}</dt>
                                                <dd className="break-words tabular-nums text-slate-700">{sel(r, c)}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                )}
                                {actions && <div className="mt-2 -ml-1.5"><Aksi aksi={actions(r)} /></div>}
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {paginator && <Pagination paginator={paginator} className="border-t border-slate-100 px-6 py-4 md:px-7" />}
        </BentoCard>
    );
}
