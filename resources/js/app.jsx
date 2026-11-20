import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { LucideProvider } from 'lucide-react';
import { createRoot } from 'react-dom/client';

const pages = import.meta.glob('./Pages/**/*.jsx');

createInertiaApp({
    title: (title) => (title ? `${title} - SIMBANGDES` : 'SIMBANGDES'),
    resolve: (name) => {
        const page = pages[`./Pages/${name}.jsx`];
        if (!page) throw new Error(`Halaman tidak ditemukan: ${name}`);
        return page();
    },
    setup({ el, App, props }) {
        // Ketebalan garis ikon seragam di seluruh UI.
        createRoot(el).render(
            <LucideProvider strokeWidth={1.75}>
                <App {...props} />
            </LucideProvider>,
        );
    },
});
