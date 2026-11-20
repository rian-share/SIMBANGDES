import { Inbox } from 'lucide-react';

/** Kompatibel dengan pemakaian lama: <EmptyState>teks</EmptyState> dianggap sebagai judul. */
export default function EmptyState({ icon: Ikon = Inbox, title, description, action, children }) {
    return (
        <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white shadow-card">
                <Ikon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-medium text-slate-900">{title ?? children}</p>
            {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
